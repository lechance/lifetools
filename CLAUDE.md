# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

「治点工具箱」— 微信小程序，集合日常生活常用工具。uni-app 3.x (Vue 3 + Vite) 构建，编译到微信小程序（mp-weixin）和 H5。纯前端实现，Vuex 状态管理。

**53 个工具已全部实现**（无占位页面），覆盖热门、生活、娱乐、图片、计算、实用六大分类。分类 key 与色值见 `src/utils/tools-data.js` 顶部的 `COLORS` 映射。

> 仓库中 `AGENTS.md` 为同一项目的独立说明（标注"本文件为准"）。本 CLAUDE.md 已合并其有效要点并修正过时数据；若两者冲突，以本文档为准。

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
- H5 dev server 走 HTTPS（`vite.config.js` 读 `certs/` 下自签证书），首次访问需信任自签证书。
- 微信小程序产物 `dist/build/mp-weixin/` 用微信开发者工具打开。
- 依赖极少：无外部二维码库（`src/utils/qrcode.js` 为内联源码），仅 4 个工具用外部 API。

## Architecture

### 两种页面写法（改代码前先判断目标写法）

- **主框架页**（`pages/index|coupons|profile|favorites` + `components/*.vue` + `App.vue`）：uni-app 原语 — `<view>`、`uni.navigateTo/reLaunch`、`onLoad` 等。
- **工具页** `src/pages/tools/*`：多数也用 `<view>`/`<picker>` 等 uni 写法；仅个别工具（`calculator`、`password-gen`、`decibel`）使用 `window.`/`document.`。

修改工具页前先 `grep -r "window\." src/pages/tools` 确认目标页写法。mp-weixin 中 `window`/`document` 不可用，会导致白屏或事件失效；反之也不要把主框架的 uni 原语生搬硬套到工具页。

### 工具实现模式

所有工具都是**独立页面** `src/pages/tools/{id}/index.vue`（模板 + script setup + scoped SCSS 三合一），按类型分几种模式：

| 模式 | 涉及工具 | 关键实现 |
|------|---------|---------|
| 表单计算 | BMI/房贷/个税/进制等 | `input` + `picker` + 本地计算 |
| 本地存储 | 待办/备忘/生理期/日历日程 | `uni.getStorageSync/setStorageSync`（独立 `lifetool_*` key） |
| Canvas 图片 | 压缩/裁剪/滤镜/拼接/取色/表情包/证件照/水印/头像/九宫格切图/二维码/CT检查 | `uni.createCanvasContext` + `canvasToTempFilePath` 导出 |
| 传感器/录音 | 计步/分贝 | `uni.onAccelerometerChange` / `uni.getRecorderManager`（尺子为 DPI 校准的虚拟直尺，非传感器） |
| 外部 API | 天气/汇率/历史上的今天/古诗文 | `uni.request`，域名与 Key 可在 `utils/api-config.js` 配置 |
| 娱乐模拟 | CT检查 | 多阶段流程（选部位→贴近提示→扫描→出片）+ canvas 绘制结果片 + 定时器动画 |

### 图片选图统一模式（共享组件）

图片工具（压缩/裁剪/滤镜/拼接/取色/表情包/证件照/头像/九宫格/水印）的「选择图片」统一走共享组件，不再各自内联 `uni.chooseImage`：

- `src/components/ImageSourceSheet.vue` — 选源弹窗（拍摄 / 从相册选择 / 从聊天记录选择💬，聊天记录仅微信小程序显示）。`props: visible`；`@select` 回传 `'camera' | 'album' | 'message'`，`@close` 关闭。
- `src/utils/image-picker.js` — `pickImage({ source, count })` 封装 `uni.chooseImage` / `uni.chooseMessageFile`，统一 `sizeType: ['original','compressed']`，返回 `{ paths, tempFiles }`（`tempFiles` 含原图 `size`，供压缩等场景用）。

各页接入模式（无「选择图片」按钮，参照 watermark 交互）：点击预览区 → `chooseImage()` 设置 `showSheet = true` 打开弹窗 → `onSourceSelect(source)` 用 `pickImage` 选图 → 走该页原有 `getImageInfo` + 画布绘制逻辑。空态占位（`.empty`）点击添加、有图时 `.canvas-wrap` 点击更换，均带 `.empty-sub` / `.replace-hint` 提示。**例外**：`color-picker` 画布用于取色，换图走画布下方「更换图片」链接；`image-stitch` 多图，点缩略图区 `.thumbs` 重新选择（删除按钮需 `@tap.stop`）。**新增图片工具应复用这两个文件**，参照 watermark 的实现。

### 外部 API 域名

天气 `wttr.in`、汇率 `open.er-api.com`、历史上的今天 `v2.xxapi.cn`、古诗文 `poetry.palemoky.com`。**H5 直接可用**；微信小程序需在公众平台把域名加入 request 合法域名白名单，否则请求失败。各工具可通过「我的 → API 设置」页填写自己的 Key 替换免费接口（配置集中在 `src/utils/api-config.js`）。

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

## Data Flow

- **工具数据**：`src/utils/tools-data.js` 定义所有工具元数据（名称、emoji 图标、分类），导出 `getAllTools()` / `getToolById()` / `getToolsByCategory()` / `searchTools()`。
- **持久化**：`src/utils/storage.js` 封装 `uni.getStorageSync/setStorageSync`，管理收藏 ID 列表、使用记录（最近 50 条）、搜索历史；工具页面自用数据（待办/备忘/日历）用独立的 `lifetool_*` key。
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
- 所有页面用 `<style lang="scss" scoped>`，工具页面统一浅灰背景 + 白色圆角卡片。
- 工具页面类名前缀用工具缩写（如 `rd__`、`led__`、`shelf__`），避免跨页面类名冲突。
- `vite.config.js` 还配置了 `@` 别名指向 `src/`、`vue-vendor` 手动分包。

## 页面速查

- `src/pages/settings/index.vue` — API Key 设置页（含工具建议提交地址）
- `src/pages/suggestion/index.vue` — 工具建议提交页（POST 至 `api-config.js` 配置的接口）
- `src/pages/about/index.vue` — 关于我们（在线客服/用户协议/隐私政策入口）
- `src/pages/agreement/index.vue`、`src/pages/privacy/index.vue` — 用户协议 / 隐私政策
- `src/pages.json` — 页面路由 + 全局导航栏样式
- `src/manifest.json` — 平台 / AppID 配置
