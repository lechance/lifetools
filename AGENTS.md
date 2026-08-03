# AGENTS.md

微信小程序「治点工具箱」集日常工具。uni-app 3.x (Vue 3 + Vite) 构建，编译目标为 mp-weixin 与 H5。Vuex 状态管理。

> 注：仓库中 `CLAUDE.md` 部分已过时（工具页已全部实现，非占位；应用名已改为「治点工具箱」）。本文件为准。

## Commands（必须通过本地 `uni` CLI，非 vite）

依赖的 `uni` CLI 位于 `node_modules/.bin/uni`，直接用 npm scripts 即可：

```bash
npm run dev:h5            # 浏览器预览
npm run build:h5          # H5 产物，部署到 web 服务器
npm run dev:mp-weixin     # 微信开发者工具热更新
npm run build:mp-weixin   # 生成 unpackage/dist/dev|build/mp-weixin，用微信开发者工具打开
```

无 lint / test / typecheck 脚本，提交前人工自检 + `npm run build:h5` 验证。

**mp-weixin 注意**：构建/发布前必须在 `src/manifest.json` 的 `mp-weixin.appid` 填入真实 AppID（当前为占位 `wx0000000000000000`）。H5 用 `h5.router.mode = "history"`。

## 两种截然不同的页面写法（最容易踩坑）

- **主框架**（`pages/index|coupons|profile` 与 `components/*.vue`，以及 `App.vue`）使用 uni-app 原语：`<view>`、`uni.navigateTo/reLaunch`、`onLoad` 等。
- **工具页** `src/pages/tools/*` 大多数是**纯 Web 写法**：`<div>`/`<button>`/`<input>`、`window.`/`document.`/`window.addEventListener`、原生 `<style>`（非 scss）。此类代码在 H5 正常，但在 **mp-weixin 中 `window`/`document` 不可用，可能导致白屏或事件失效**。修改工具页前先 `grep -r "window\." src/pages/tools` 判断目标写法，别把主框架页的 uni 原语套到工具页（反之亦然）。

## 新增/改一个工具

三处必须一致（均在 `src/` 下）：
1. `utils/tools-data.js` 对应分类数组加条目 `{ id, name, icon, color }`（icon 当前用 emoji）。
2. `pages/tools/{id}/index.vue` 实现页面（可参照现有工具页；横向屏/隐藏导航等额外样式按需配合第 3 步的 style 配置）。
3. `pages.json` 的 `pages` 数组加路由 `pages/tools/{id}/index`。
- 首页点击通过 `uni.navigateTo({ url: tool.path })`（index.vue:143）。
- 也支持子页面（如 `led-marquee/player`）需额外配置 `pageOrientation`/导航样式。

## 架构 / 数据流

- 底部导航：**自定义 `TabBar.vue` 组件**（非原生 tabBar），点击用 `uni.reLaunch()` 切页清栈；各页 `handleTabChange` 排除当前 tab。
- 持久化：`utils/storage.js` 封装 `uni.getStorageSync/setStorageSync`（收藏ID、最近50条使用记录、搜索历史）。
- 状态：`store/index.js` 创建 Vuex store，`main.js` 用 `createSSRApp` + `app.use(store)`；页面用 Vuex 均需在 `main.js` 的 `createApp` 里注册。
- 样式：`vite.config.js` 通过 `additionalData` 自动 `@import src/uni.scss` 到所有 scss；全局 CSS 变量（`--primary-color`）可用。工具卡片纯白简约，不用背景色。

## 目录速查

- `src/pages/tools/*/index.vue` — 各工具实现（非占位）
- `src/utils/tools-data.js` — 工具元数据与分类过滤
- `src/utils/qrcode.js` — 二维码（自实现）
- `src/manifest.json` — 平台/AppID 配置
- 产物：`unpackage/`（uni）、`dist/`（H5），均在 `.gitignore`