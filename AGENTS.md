# AGENTS.md

微信小程序「治点工具箱」，uni-app 3.x (Vue 3 + Vite)。编译目标：mp-weixin 与 H5。Vuex 状态管理。53 个工具页面，全部已实现。

> 仓库中 `CLAUDE.md` 部分已过时（应用名已改为「治点工具箱」），本文件为准。

## Commands

```bash
npm run dev:h5            # 浏览器预览（HTTPS，需 certs/ 下自签证书）
npm run build:h5          # H5 产物 → dist/
npm run dev:mp-weixin     # 微信开发者工具热更新
npm run build:mp-weixin   # 产物 → unpackage/dist/dev|build/mp-weixin
```

无 lint / test / typecheck 脚本。提交前 `npm run build:h5` 验证。

**mp-weixin**：构建前在 `src/manifest.json` 的 `mp-weixin.appid` 填入真实 AppID（当前占位 `wx0000000000000000`）。H5 用 `h5.router.mode = "history"`。

## 最容易踩坑：两种页面写法

- **主框架**（`pages/index|coupons|profile|favorites` + `components/*.vue` + `App.vue`）：uni-app 原语 — `<view>`、`uni.navigateTo/reLaunch`、`onLoad` 等。
- **工具页** `src/pages/tools/*`：大多数是纯 Web 写法 — `<div>`/`<button>`/`<input>`、`window.`/`document.`、原生 `<style>`（非 scoped scss）。

修改工具页前先 `grep -r "window\." src/pages/tools` 判断目标写法。mp-weixin 中 `window`/`document` 不可用，会导致白屏或事件失效。不要把主框架页的 uni 原语套到工具页，反之亦然。

## 新增/改一个工具（三处必须一致，均在 `src/` 下）

1. `utils/tools-data.js` — 对应分类数组加 `{ id, name, icon, color }`（icon 用 emoji）。
2. `pages/tools/{id}/index.vue` — 页面实现。
3. `pages.json` — `pages` 数组加路由 `pages/tools/{id}/index`。

子页面（如 `led-marquee/player`、`photo-filter/fullscreen`）需额外在 `pages.json` 配置 `pageOrientation`/`navigationStyle`。

## 架构

- **TabBar**：自定义 `TabBar.vue`（非原生 tabBar），`uni.reLaunch()` 切页清栈。
- **持久化**：`utils/storage.js` 封装 `uni.getStorageSync/setStorageSync`（收藏ID、最近50条使用记录、搜索历史）。
- **状态**：`store/index.js` → Vuex store，`main.js` 用 `createSSRApp` + `app.use(store)`。页面通过 `useStore()` 访问。
- **样式**：`vite.config.js` 的 `additionalData` 自动 `@import src/uni.scss` 到所有 scss。全局 SCSS 变量在 `src/uni.scss`（`$bg-color`、`$text-primary` 等），CSS 变量（`--primary-color`）也可用。工具卡片纯白简约，不用背景色。

## 目录速查

- `src/pages/tools/*/index.vue` — 各工具页面
- `src/pages/favorites/index.vue` — 收藏页（复用 `ToolGrid`）
- `src/pages/settings/index.vue` — API Key 设置页（含工具建议提交地址）
- `src/pages/suggestion/index.vue` — 工具建议提交页（POST 至 api-config 配置的接口）
- `src/pages/about/index.vue` — 关于我们（在线客服/用户协议/隐私政策）
- `src/utils/tools-data.js` — 工具元数据与分类过滤（`getAllTools`/`getToolById`/`searchTools`）
- `src/utils/storage.js` — 本地存储封装（收藏、记录、搜索历史）
- `src/utils/api-config.js` — API Key 与自定义配置（含建议提交地址 `getSuggestionUrl`）
- `src/utils/helpers.js` — 通用函数（`debounce`/`showToast`/`showModal` 等）
- `src/utils/qrcode.js` — 内联的 QR 编码源码（零依赖，不要改为 npm 依赖）
- `src/manifest.json` — 平台/AppID 配置
- `src/pages.json` — 页面路由 + 全局导航栏样式
- 产物：`unpackage/`（uni）、`dist/`（H5），均在 `.gitignore`