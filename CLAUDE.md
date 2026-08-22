# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

「治点工具箱」— 微信小程序，集合日常生活常用工具。uni-app 3.x (Vue 3 + Vite) 构建，编译到微信小程序（mp-weixin）和 H5。纯前端实现，Vuex 状态管理。

**55 个工具已全部实现**（无占位页面），覆盖热门、生活、娱乐、图片、计算、实用六大分类。分类 key 与色值见 `src/utils/tools-data.js` 顶部的 `COLORS` 映射；工具总数由 `TOTAL_TOOL_COUNT = getAllTools().length` 自动计算，改分类数组时无需手动更新。

> 仓库中 `AGENTS.md` 为同一项目的旧版说明，其顶部"本文件为准"标注已过时（其中"工具页大多数为纯 Web 写法"的论断与现状不符，见下方"两种页面写法"）。本 CLAUDE.md 已合并其有效要点并修正过时数据；两者冲突一律以本文档为准。

## Commands

```bash
npm run dev:h5            # 浏览器预览（HTTPS，需 certs/ 下自签证书 key.pem/cert.pem）
npm run build:h5          # H5 产物 → dist/
npm run dev:mp-weixin     # 微信开发者工具热更新
npm run build:mp-weixin   # 产物 → dist/build/mp-weixin/
```

**注意：**
- **无 lint / test / typecheck 脚本**。提交前用 `npm run build:h5` 验证可编译。
- 构建微信小程序前需在 `src/manifest.json` 配置 `mp-weixin.appid` 为真实 AppID（当前为占位 `wx0000000000000000`）。
- H5 dev server 走 HTTPS（`vite.config.js` 读 `certs/` 下自签证书），首次访问需信任自签证书；H5 路由已配 `router.mode = "history"`（`src/manifest.json`）。
- 微信小程序产物 `dist/build/mp-weixin/` 用微信开发者工具打开。
- 依赖极少：无外部二维码库（`src/utils/qrcode.js` 为内联源码），仅 5 个工具用外部 API（天气/汇率/历史上的今天/诗泉/模型余额）。

## Architecture

### 两种页面写法（改代码前先判断目标写法）

- **主框架页**（`pages/index|coupons|profile|favorites` + `components/*.vue` + `App.vue`）：uni-app 原语 — `<view>`、`uni.navigateTo/reLaunch`、`onLoad` 等。
- **工具页** `src/pages/tools/*`：绝大多数用 `<view>`/`<picker>` 等 uni 写法。仅 3 个工具是纯 Web 写法、直接裸用 `window.`（mp-weixin 下会失效）：`calculator`、`password-gen`、`decibel`。
- **`document.` 例外（安全模式，勿删）**：图片工具在 `// #ifdef H5` 守卫块内用 `document.createElement('a')` 触发浏览器下载导出图片（见 watermark `index.vue` 约 353 行）。这是 H5 导出图片的既有标准模式，必须保持在 `#ifdef H5` 内，mp-weixin 构建会剔除；**不要**在顶层裸用 `document.`。

修改工具页前先 `grep -r "window\.\|document\." src/pages/tools` 确认目标页写法。mp-weixin 中顶层 `window`/`document` 不可用，会导致白屏或事件失效；反之也不要把主框架的 uni 原语生搬硬套到工具页。

### 工具实现模式

所有工具都是**独立页面** `src/pages/tools/{id}/index.vue`（模板 + script setup + scoped SCSS 三合一），按类型分几种模式：

| 模式 | 涉及工具 | 关键实现 |
|------|---------|---------|
| 表单计算 | BMI/房贷/个税/进制等 | `input` + `picker` + 本地计算 |
| 本地存储 | 待办/备忘/生理期/日历日程 | `uni.getStorageSync/setStorageSync`（独立 `lifetool_*` key） |
| Canvas 图片 | 压缩/裁剪/滤镜/拼接/取色/表情包/证件照/水印/头像/九宫格切图/二维码/CT检查 | `uni.createCanvasContext` + `canvasToTempFilePath` 导出 |
| 传感器/录音 | 计步/分贝 | `uni.onAccelerometerChange` / `uni.getRecorderManager`（尺子为 DPI 校准的虚拟直尺，非传感器） |
| 外部 API | 天气/汇率/历史上的今天/诗泉 | `uni.request`，域名与 Key 可在 `utils/api-config.js` 配置 |
| 娱乐模拟 | CT检查 | 多阶段流程（选部位→贴近提示→扫描→出片）+ canvas 绘制结果片 + 定时器动画 |

### 图片选图统一模式（共享组件）

图片工具（压缩/裁剪/滤镜/拼接/取色/表情包/证件照/头像/九宫格/水印）的「选择图片」统一走共享组件，不再各自内联 `uni.chooseImage`：

- `src/components/ImageSourceSheet.vue` — 选源弹窗（拍摄 / 从相册选择 / 从聊天记录选择💬，聊天记录仅微信小程序显示）。`props: visible`；`@select` 回传 `'camera' | 'album' | 'message'`，`@close` 关闭。
- `src/utils/image-picker.js` — `pickImage({ source, count })` 封装 `uni.chooseImage` / `uni.chooseMessageFile`，统一 `sizeType: ['original','compressed']`，返回 `{ paths, tempFiles }`（`tempFiles` 含原图 `size`，供压缩等场景用）。

各页接入模式（无「选择图片」按钮，参照 watermark 交互）：点击预览区 → `chooseImage()` 设置 `showSheet = true` 打开弹窗 → `onSourceSelect(source)` 用 `pickImage` 选图 → 走该页原有 `getImageInfo` + 画布绘制逻辑。空态占位（`.empty`）点击添加、有图时 `.canvas-wrap` 点击更换，均带 `.empty-sub` / `.replace-hint` 提示。**例外**：`color-picker` 画布用于取色，换图走画布下方「更换图片」链接；`image-stitch` 多图，点缩略图区 `.thumbs` 重新选择（删除按钮需 `@tap.stop`）。**新增图片工具应复用这两个文件**，参照 watermark 的实现。

### 图片保存：内容安全校验（共享工具）

会导出图片的 9 个图片工具（压缩/裁剪/滤镜/拼接/表情包/证件照/水印/头像/九宫格）在 **mp-weixin** 把图片存相册前统一走 `src/utils/sec-check.js` 的 `saveCheckedImage(tempFilePath, { onSuccess, onFail })`，替代裸 `uni.saveImageToPhotosAlbum`。**尚未迁移**：`qr-code`、`ct-scan` 两个工具目前仍用裸 `uni.saveImageToPhotosAlbum`（`saveCheckedImage` 的存量引用见各页 `grep`，迁移时参照 watermark）。该后端走**异步检测**（微信 `mediaCheckAsync`），`checkImage` 流程：`uni.login` 取 code → `uni.uploadFile` 到 `<base>/api/sec-check/image`（字段 `media` + `code`）→ 拿 `trace_id` → 轮询 `GET <base>/api/sec-check/result?trace_id=...&token=...`（首次延迟 3s，每 2s，上限 30s）直到拿到 `safe`。违规或校验失败（含超时/网络/登录失败）都中止保存并 toast（fail-closed，`SEC_CHECK_RISKY_MSG`/`SEC_CHECK_ERROR_MSG`）；`SEC_CHECK_URL` 为空则跳过校验直接保存（fail-open）。`SEC_CHECK_URL` 是**基础地址**（不含路径），在 `api-config.js` **代码配置**（设置页不放）。mp-weixin 需把域名加入 `uploadFile` 与 `request` 两类合法域名；后端为 `code2Session` 校验，用户近两小时未访问小程序会报 61010（非前端问题）。**H5 不走此逻辑**：仍用 `#ifdef H5` 内 `document.createElement('a')` 直接下载（见 watermark `index.vue` 约 353 行）。新增图片工具沿用此模式，`#ifdef` 分支结构照抄 watermark。

### 外部 API 域名

天气 `wttr.in`、汇率 `open.er-api.com`、历史上的今天 `v2.xxapi.cn`、诗泉 `poetry.palemoky.com`。**H5 直接可用**；微信小程序需在公众平台把域名加入 request 合法域名白名单，否则请求失败。各工具可通过「我的 → API 设置」页填写自己的 Key 替换免费接口（配置集中在 `src/utils/api-config.js`）。**例外**：模型余额 `api-balance` 不走 API 设置页，在工具页内按厂商（DeepSeek/Kimi/MiniMax/GLM）配置 Key 并本地缓存余额（独立 storage key），改它时勿套用 api-config。

### Canvas 工具要点（压缩/裁剪/滤镜/拼接/取色/表情包/证件照/水印/头像/九宫格/二维码/CT检查）

**DPR（设备像素比）处理 — 最容易出错的点：**
- H5 的 uni-canvas 内部已处理 DPR（`__hidpi__` 补丁自动乘以 pixelRatio）。**绝不能手动 `ctx.scale(dpr, dpr)`**，否则双重缩放 → 图片被裁剪或溢出。全仓库没有任何工具手动 scale DPR。
- mp-weixin 旧 canvas API 按逻辑像素绘制，同样无需手动 scale。

**画布尺寸：**
- canvas 宽高用内联 `:style` 的 **px**（非 rpx，rpx 是动态值）；canvas 必须装在父容器内，宽度不能超过可用内容区。
- 计算可用宽度时要把所有水平 padding 的 rpx 换算为 px：`maxW = Math.floor(windowWidth - totalHorizontalPaddingRpx * windowWidth / 750)`。
- `v-if` 重挂载 canvas 时，H5 的 ResizeSensor 异步更新 buffer。首次绘制需在 `nextTick` 后，建议额外延时（~120ms）重绘一次兜底。

**mp-weixin canvas 状态持久化：**
- `ctx.setGlobalAlpha()` 等状态跨 `ctx.draw()` 调用保留。绘制背景前必须 `ctx.setGlobalAlpha(1)` 重置，否则背景会继承上一次的透明度。

**导出：**
- 必须在 `ctx.draw(false, cb)` 回调里调 `canvasToTempFilePath`，否则导出为空；需要高分辨率输出用 `destWidth/destHeight`。

### 二维码工具

qr-code 工具用 `src/utils/qrcode.js` 生成矩阵。**该文件是内联的第三方源码**，为 ESM 兼容在文件末尾加了 `export default qrcode` — 不要把它改回 npm 依赖，否则小程序构建会因外部依赖解析失败。

### 生日倒计时

`birthday-countdown` 工具仅支持**阳历生日**（不支持农历）：主页面不占表单空间，右下角**浮动 ＋ 按钮**点击弹出**底部弹窗**（`bd__popup` + `bd__fab`，`showForm` 控制）填写人员（称呼/关系/生日，生日用 `<picker mode="date">` 存 `birthYear` + 月/日）。按年循环计算倒计时，日历视图按阳历月日匹配标记。卡片展示**年龄**（周岁，`getAge` 已过生日算实岁、未到减一）与**星座**（阳历月日计算，函数内联在页面内），下次生日行附带「满 X 岁」。微信订阅提醒仅完成授权（纯前端无后端，实际推送需服务端下发模板消息），模板 ID 在 `api-config.js` 的 `BIRTHDAY_TEMPLATE_ID` 配置。

## Data Flow

- **工具数据**：`src/utils/tools-data.js` 定义所有工具元数据（名称、emoji 图标、分类），导出 `getAllTools()` / `getToolById()` / `getToolsByCategory()` / `searchTools()`。
- **持久化**：`src/utils/storage.js` 封装 `uni.getStorageSync/setStorageSync`，管理收藏 ID 列表、使用记录（最近 50 条）、搜索历史；工具页面自用数据（待办/备忘/日历）用独立的 `lifetool_*` key。
- **API 缓存**：`src/utils/api-cache.js` 提供 `cachedFetch(url, options, ttl)`，基于 storage 持久化（`lifetool_api_cache_` 前缀），默认 TTL 10 分钟，供外部 API 工具复用，避免重复请求。
- **状态管理**：`src/store/index.js` 为 Vuex store（`currentCategory`/`searchQuery`/`favorites`/`records`/`searchHistory`），`main.js` 用 `createSSRApp` + `app.use(store)`，`hydrate()` action 从 storage 加载；页面通过 `useStore()` 访问。

## Tab Switching

四个主页面（工具/收藏/卡券/我的）使用**自定义 TabBar 组件**（`src/components/TabBar.vue`，非原生 `tabBar`），点击触发 `@change` 事件，通过 `uni.reLaunch()` 切换页面以清除导航栈。收藏页 `src/pages/favorites/index.vue` 复用 `ToolGrid` 展示已收藏工具并支持搜索、长按取消收藏。首页工具网格与收藏页复用 `ToolGrid` 组件（长按 1 秒收藏，图标最大化、无卡片背景）。

## Adding a New Tool

三处必须一致（均在 `src/` 下）：

1. `utils/tools-data.js` — 对应分类数组添加条目（`{ id, name, icon, color }`，icon 用 emoji）。
2. `pages/tools/{id}/index.vue` — 页面实现（复制已实现工具的页面结构）。
3. `pages.json` — `pages` 数组添加路由 `pages/tools/{id}/index`。

子页面（如 `led-marquee/player`、`photo-filter/fullscreen`）需额外在 `pages.json` 配置 `pageOrientation`/`navigationStyle`。

## Styling

- 全局 SCSS 变量在 `src/uni.scss`（中性灰 `#F5F5F7` 背景、`#1D1D1F` 主色、`#007AFF` 链接色），`vite.config.js` 的 `additionalData` 自动 `@import` 到所有 scss，页面内直接使用变量名即可。
- `src/global-classes.scss` — 通用工具类（`.card`、`$card-bg`/`$radius-md` 等卡片样式变量）仅 `App.vue` 引入一次，**不**像 uni.scss 那样自动注入每个组件；页面直接写 `.card` 类名依赖此文件。
- 所有页面用 `<style lang="scss" scoped>`，工具页面统一浅灰背景 + 白色圆角卡片。
- 工具页面类名前缀用工具缩写（如 `rd__`、`led__`、`shelf__`），避免跨页面类名冲突。
- `vite.config.js` 还配置了 `@` 别名指向 `src/`、`vue-vendor` 手动分包。

## 页面速查

- `src/pages/settings/index.vue` — API Key 设置页（仅各工具的 Key：天气/历史/诗泉/汇率；内容校验地址 `SEC_CHECK_URL` 与工具建议地址 `SUGGESTION_URL` 均为 `api-config.js` 代码配置，不在页面）
- `src/pages/suggestion/index.vue` — 工具建议提交页（POST 至 `api-config.js` 配置的接口）
- `src/pages/about/index.vue` — 关于我们（在线客服/用户协议/隐私政策入口）
- `src/pages/agreement/index.vue`、`src/pages/privacy/index.vue` — 用户协议 / 隐私政策
- `src/utils/helpers.js` — 通用函数（`debounce`/`throttle`/`formatTimestamp`/`generateId`/`showToast`/`showModal` 等）
- `src/pages.json` — 页面路由 + 全局导航栏样式
- `src/manifest.json` — 平台 / AppID 配置
