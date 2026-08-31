# AGENTS.md

微信小程序「治点工具箱」，uni-app 3.x (Vue 3 + Vite)。编译目标：mp-weixin 与 H5。Vuex 状态管理。63 个工具页面，全部已实现（工具总数由 `TOTAL_TOOL_COUNT = getAllTools().length` 自动计算，加工具无需手动改计数）。

## Commands

```bash
npm run dev:h5            # 浏览器预览（HTTPS，需 certs/ 下自签证书）
npm run build:h5          # H5 产物 → dist/build/h5
npm run dev:mp-weixin     # 微信开发者工具热更新 → dist/dev/mp-weixin
npm run build:mp-weixin   # 产物 → dist/build/mp-weixin
```

无 lint / test / typecheck 脚本。提交前 `npm run build:h5` 验证。

**mp-weixin**：构建前在 `src/manifest.json` 的 `mp-weixin.appid` 填入真实 AppID（当前占位 `wx0000000000000000`）。H5 用 `h5.router.mode = "history"`。

## 最容易踩坑：两种页面写法

- **主框架**（`pages/index|coupons|profile|favorites` + `components/*.vue` + `App.vue`）：uni-app 原语 — `<view>`、`uni.navigateTo/reLaunch`、`onLoad` 等。
- **工具页** `src/pages/tools/*`：绝大多数用 `<view>`/`<picker>` 等 uni 写法。仅 3 个工具是纯 Web 写法、直接裸用 `window.`（mp-weixin 下会失效）：`calculator`、`password-gen`、`decibel`。
- **`document.` 例外（安全模式，勿删）**：图片工具在 `// #ifdef H5` 守卫块内用 `document.createElement('a')` 触发浏览器下载导出图片。这是 H5 导出图片的既有标准模式，必须保持在 `#ifdef H5` 内，mp-weixin 构建会剔除；**不要**在顶层裸用 `document.`。

修改工具页前先 `grep -r "window\.\|document\." src/pages/tools` 确认目标页写法。mp-weixin 中顶层 `window`/`document` 不可用，会导致白屏或事件失效。

## 新增/改一个工具（三处必须一致，均在 `src/` 下）

1. `utils/tools-data.js` — 对应分类数组加 `{ id, name, icon, color }`（icon 用 emoji）。
2. `pages/tools/{id}/index.vue` — 页面实现。
3. `pages.json` — `pages` 数组加路由 `pages/tools/{id}/index`。
4. **运行 `node scripts/export-tools-catalog.mjs`** 同步工具目录到 mpserver（后台广告勾选列表依赖此文件）。

子页面（如 `led-marquee/player`、`photo-filter/fullscreen`）需额外在 `pages.json` 配置 `pageOrientation`/`navigationStyle`。

## Canvas 工具（压缩/裁剪/滤镜/拼接/取色/表情包/证件照/水印/头像/九宫格/二维码/搞怪检查，id 为 `ct-scan`）

**DPR（设备像素比）处理** — 这是最容易出错的点：

- **H5**：uni-canvas 内部已处理 DPR。`onMounted` 时自动调用 `_resize()` 将 buffer 设为 `offsetWidth × pixelRatio`，所有绘制方法被 `__hidpi__` 补丁自动乘以 pixelRatio。**绝不能手动 `ctx.scale(dpr, dpr)`**，否则双重缩放 → 图片被裁剪或溢出。全仓库没有任何工具手动 scale DPR。
- **mp-weixin**：旧 canvas API 按逻辑像素绘制，同样无需手动 scale。

**画布尺寸**：

- canvas 宽高用内联 `:style` 的 **px**（非 rpx），因为 rpx 是动态值。
- canvas 必须装在父容器内，宽度不能超过可用内容区。计算可用宽度时要把所有水平 padding（rpx）换算为 px：`maxW = Math.floor(windowWidth - totalHorizontalPaddingRpx * windowWidth / 750)`。
- `v-if` 重挂载 canvas 时，H5 的 `ResizeSensor` 异步更新 buffer。首次绘制需在 `nextTick` 后，建议额外延时（~120ms）重绘一次兜底。

**mp-weixin canvas 状态持久化**：

- `ctx.setGlobalAlpha()` 等状态跨 `ctx.draw()` 调用保留。绘制背景前必须 `ctx.setGlobalAlpha(1)` 重置，否则背景会继承上一次的透明度。

**导出**：

- 导出必须在 `ctx.draw(false, cb)` 回调里调 `canvasToTempFilePath`，否则导出为空；需要高分辨率输出用 `destWidth/destHeight`。

## WebGL 工具（敲木鱼）

`wooden-fish` 使用 three.js 渲染 3D 模型。**H5** 直接用 `import * as THREE from 'three'`；**mp-weixin** 用 `threejs-miniprogram-tn` 适配器（`createScopedThreejs(canvas)` 返回 scoped THREE 对象）。canvas 用 `<canvas type="webgl">`，`requestAnimationFrame` 在 mp-weixin 走 `canvas.requestAnimationFrame` 而非 `window`。模型为程序化生成（`LatheGeometry` + `CylinderGeometry`），无外部 GLTF 文件。

## 图片选图统一模式

图片工具（压缩/裁剪/滤镜/拼接/取色/表情包/证件照/头像/九宫格/水印）的「选择图片」统一走共享组件：

- `src/components/ImageSourceSheet.vue` — 选源弹窗（拍摄 / 从相册选择 / 从聊天记录选择💬，聊天记录仅微信小程序显示）。`props: visible`；`@select` 回传 `'camera' | 'album' | 'message'`，`@close` 关闭。
- `src/utils/image-picker.js` — `pickImage({ source, count })` 封装 `uni.chooseImage` / `uni.chooseMessageFile`，统一 `sizeType: ['original','compressed']`，返回 `{ paths, tempFiles }`。

各页接入模式：点击预览区 → `chooseImage()` 设置 `showSheet = true` 打开弹窗 → `onSourceSelect(source)` 用 `pickImage` 选图 → 走该页原有 `getImageInfo` + 画布绘制逻辑。空态占位（`.empty`）点击添加、有图时 `.canvas-wrap` 点击更换。**例外**：`color-picker` 画布用于取色，换图走画布下方「更换图片」链接；`image-stitch` 多图，点缩略图区 `.thumbs` 重新选择。**新增图片工具应复用这两个文件**。

## 图片保存：内容安全校验

会导出图片的 11 个图片工具（压缩/裁剪/滤镜/拼接/表情包/证件照/水印/头像/九宫格/二维码/CT检查，`ct-scan` 已改名搞怪检查）在 **mp-weixin** 存相册前统一走 `src/utils/sec-check.js` 的 `saveCheckedImage(tempFilePath, { onSuccess, onFail })`，**不要**裸用 `uni.saveImageToPhotosAlbum`。该后端走**异步检测**（微信 `mediaCheckAsync`），`checkImage` 流程：`uni.login` 取 code → `uni.uploadFile` 到 `<base>/api/sec-check/image`（字段 `media` + `code`）→ 拿 `trace_id` → 轮询 `GET <base>/api/sec-check/result?trace_id=...&token=...`（首次延迟 3s，每 2s，上限 30s）直到拿到 `safe`。违规或校验失败（含超时/网络/登录失败）都中止保存并 toast（fail-closed）；`SEC_CHECK_URL` 为空则跳过校验直接保存（fail-open）。`SEC_CHECK_URL` 是**基础地址**（不含路径），在 `api-config.js` **代码配置**（不在设置页）。mp-weixin 需把域名加入 `uploadFile` 与 `request` 两类合法域名；后端为 `code2Session` 校验，用户近两小时未访问小程序会报 61010（非前端问题）。**H5 不走此逻辑**：仍用 `#ifdef H5` 内 `document.createElement('a')` 直接下载（见 watermark `index.vue` 约 353 行）。新增图片工具沿用此模式，`#ifdef` 分支结构照抄 watermark。

## 用户数据云同步

`src/utils/sync.js`（**仅 mp-weixin**，H5 全部 no-op）+ 设置页 `pages/settings/sync/index`。会话级同步：App 启动 `pullSync()` 合并、`onHide` `pushSync()` 推送（钩子在 App.vue）；后端 `/api/sync/*` 复用 `SEC_CHECK_URL` 基础地址。身份为每请求 `wx.login` code 换 openid；冲突 last-write-wins 按 `(scope, data_type)` 行比较 `updated_at`，本地内容未变化时沿用旧时间戳（行哈希探测变化，防旧设备覆盖新设备数据）。范围：全局行（`_global` 收藏/记录/搜索历史、`_profile` 资料、`_sync/config` 勾选配置）+ 按工具勾选的独立存储数据，映射表 `TOOL_DATA_KEYS` 在 sync.js 中维护 —— **给工具加新的本地存储 key 且需要云同步时必须同步更新该表**。合并后需 `store.dispatch('reloadUserData')` 刷新 Vuex（sync.js 不直接碰 store）。总开关默认关闭（用户显式开启），工具原始值按 raw 字符串读写以保持各工具自身序列化格式。

## 工具广告（激励视频）

`src/utils/ad-gate.js` — 云端控制的工具广告拦截系统，仅 mp-weixin 生效，H5 全部放行。

**工作流程**：点击工具 → `openTool(tool, pageRoute)` → recordUsage → 若需广告且未解锁 → showModal 确认 → 播放激励视频 → `isEnded` 则记解锁并 navigateTo，中途退出 toast 提示；广告加载失败/超时 → fail-open 直接放行。

**关键约束**：
- `AD_UNIT_ID`（`api-config.js`）为空时整个广告功能关闭（安全联锁）
- 解锁记录为模块级 `Set`（会话级，冷启动后每工具首次需看广告）
- `wx.createRewardedVideoAd` 页面内单例不可跨页 → `pageRoute` 参数隔离实例
- `onClose` 的 `res.isEnded` 判断完整观看；`res === undefined` 为旧基础库兼容，视为完整观看

**新增/修改广告工具**：后台「功能开关」→「广告工具」textarea 填写工具 id（每行一个），保存后 `GET /api/app-config` 的 `adTools` 字段更新。前端 `toolRequiresAd(toolId)` 自动匹配。

**工具入口**：`openTool()` 是唯一入口，`index.vue` 和 `favorites/index.vue` 的 `handleToolTap` 均调用此函数（ToolGrid 组件 emit 事件，父组件处理导航）。

## 架构

- **TabBar**：自定义 `TabBar.vue`（非原生 tabBar），`uni.reLaunch()` 切页清栈。
- **持久化**：`utils/storage.js` 封装 `uni.getStorageSync/setStorageSync`（收藏ID、最近50条使用记录、搜索历史）。
- **状态**：`store/index.js` → Vuex store，`main.js` 用 `createSSRApp` + `app.use(store)`。页面通过 `useStore()` 访问。
- **样式**：`vite.config.js` 的 `additionalData` 自动 `@import src/uni.scss` 到所有 scss。全局 SCSS 变量在 `src/uni.scss`（`$bg-color`、`$text-primary` 等），CSS 变量（`--primary-color`）也可用。工具类（`.card`、`.btn-primary` 等）在 `src/global-classes.scss`，仅 `App.vue` 引入（**不**像 `uni.scss` 那样自动注入每个组件）。工具卡片纯白简约，不用背景色。工具页面类名前缀用工具缩写（如 `rd__`、`led__`），避免跨页面类名冲突。
- **构建**：`vite.config.js` 配置了 `@` 别名指向 `src/`、`vue-vendor` 手动分包（vue + vuex）。

## 外部 API 与例外

- **外部 API 工具**：天气 `wttr.in`、汇率 `open.er-api.com`、历史上的今天 `v2.xxapi.cn`、诗泉 `poetry.palemoky.com`。H5 直接可用；**mp-weixin 需在公众平台把域名加入 request 合法域名白名单**。Key 在「我的 → API 设置」页填写，配置集中在 `utils/api-config.js`。
- **例外 `api-balance`**：不走 API 设置页，在工具页内按厂商（DeepSeek/Kimi/MiniMax/GLM）配置 Key 并本地缓存余额（独立 storage key `lifetool_api_balance_keys`），改它时勿套用 api-config。
- **`birthday-countdown`**：仅支持阳历生日（不支持农历），微信订阅提醒仅完成授权。

## 目录速查

- `src/pages/tools/*/index.vue` — 各工具页面
- `src/components/ImageSourceSheet.vue` — 图片选源弹窗（共享）
- `src/utils/image-picker.js` — 图片选择统一封装（共享）
- `src/utils/sec-check.js` — mp-weixin 图片保存前内容安全校验（`saveCheckedImage`）
- `src/pages/favorites/index.vue` — 收藏页（复用 `ToolGrid`）
- `src/pages/settings/index.vue` — API Key 设置页（仅天气/历史/诗泉/汇率四个 Key；校验地址 `SEC_CHECK_URL` 与建议地址 `SUGGESTION_URL` 均为 `api-config.js` 代码配置，不在页面）
- `src/pages/settings/sync/index.vue` — 数据同步设置页（总开关 + 按工具勾选；仅 mp-weixin）
- `src/pages/suggestion/index.vue` — 工具建议提交页（POST 至 api-config 配置的接口）
- `src/pages/about/index.vue` — 关于我们（在线客服/用户协议/隐私政策入口）
- `src/pages/agreement/index.vue`、`src/pages/privacy/index.vue` — 用户协议 / 隐私政策
- `src/utils/tools-data.js` — 工具元数据与分类过滤（`getAllTools`/`getToolById`/`searchTools`）
- `src/utils/storage.js` — 本地存储封装（收藏、记录、搜索历史）
- `src/utils/api-config.js` — API Key 与自定义配置（含建议提交地址 `getSuggestionUrl`）
- `src/utils/helpers.js` — 通用函数（`debounce`/`throttle`/`formatTimestamp`/`generateId`/`showToast`/`showModal` 等）
- `src/utils/ad-gate.js` — 工具广告拦截（`openTool()` 唯一入口；仅 mp-weixin）
- `src/utils/qrcode.js` — 内联的 QR 编码源码（零依赖，不要改为 npm 依赖）
- `src/manifest.json` — 平台/AppID 配置
- `src/pages.json` — 页面路由 + 全局导航栏样式
- 产物：`dist/`（H5 与 mp-weixin 均输出到 `dist/build|dev/<platform>`），`unpackage/` 亦在 `.gitignore`
