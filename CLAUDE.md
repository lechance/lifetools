# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"治点工具箱" — 微信小程序，集合日常生活常用工具。uni-app 3.x (Vue 3 + Vite) 构建，编译到微信小程序和 H5。

**48 个工具已全部实现**（无占位页面），覆盖：热门、生活、娱乐、图片、计算、实用六大分类。

## Commands

```bash
# H5 开发（浏览器预览）
npm run dev:h5

# H5 构建
npm run build:h5

# 微信小程序构建
npm run build:mp-weixin

# 微信小程序开发
npm run dev:mp-weixin
```

**注意：**
- 构建前需在 `src/manifest.json` 配置 `mp-weixin.appid` 为真实 AppID（当前为占位 `wx0000000000000000`）
- 微信小程序产物 `dist/build/mp-weixin/` 用微信开发者工具打开
- 依赖极少：无外部二维码库（`src/utils/qrcode.js` 为内联源码），仅 weather/汇率两工具用外部 API

## Architecture

### 工具实现模式

所有工具都是**独立页面** `src/pages/tools/{id}/index.vue`（模板 + script setup + scoped SCSS 三合一），纯前端实现。按类型分几种模式：

| 模式 | 涉及工具 | 关键实现 |
|------|---------|---------|
| 表单计算 | BMI/房贷/个税/进制等 | `input` + `picker` + 本地计算 |
| 本地存储 | 待办/备忘/生理期/日历日程 | `uni.getStorageSync/setStorageSync` |
| Canvas 图片 | 压缩/裁剪/滤镜/拼接/取色/表情包/证件照/头像 | `uni.createCanvasContext` + `canvasToTempFilePath` 导出 |
| 传感器 | 计步/分贝/尺子 | `uni.startAccelerometer` / `uni.getRecorderManager` |
| 外部 API | 天气/汇率 | `uni.request` 调 `wttr.in` / `open.er-api.com` |

### 关键工具文件

- `src/utils/tools-data.js` — 工具元数据（名称、图标、分类），`getAllTools()` / `getToolById()` / `getToolsByCategory()` / `searchTools()`
- `src/utils/storage.js` — 收藏、使用记录、搜索历史的本地存储封装
- `src/utils/helpers.js` — `debounce`、`showToast`、`showModal` 等通用函数
- `src/utils/qrcode.js` — **内联的 QR 编码源码**（零依赖，勿改导出方式）
- `src/pages.json` — 页面路由 + 全局导航栏样式

### 外部 API 域名

天气工具用 `wttr.in`，汇率工具用 `open.er-api.com`。**H5 直接可用**；微信小程序需在公众平台把这些域名加入 request 合法域名白名单，否则请求失败。

### 二维码工具

qr-code 工具用 `src/utils/qrcode.js` 生成矩阵，`uni.createCanvasContext` 绘制。**该文件是内联的第三方源码**，为 ESM 兼容在文件末尾加了 `export default qrcode`——不要把它改回 npm 依赖，否则小程序构建会因外部依赖解析失败。

## Data Flow

- **工具数据**：`tools-data.js` 定义所有工具元数据，导出按分类/搜索过滤的函数
- **持久化**：`storage.js` 封装 `uni.getStorageSync/setStorageSync`，管理收藏ID列表、使用记录（最近50条）、搜索历史；工具页面自用数据（待办/备忘/日历）用独立的 `lifetool_*` key
- **状态管理**：Vuex store 同步持久化数据，页面通过 `useStore()` 访问

## Adding a New Tool

1. 在 `src/utils/tools-data.js` 对应分类数组添加工具条目（`{ id, name, icon, color }`）
2. 创建 `src/pages/tools/{id}/index.vue`（复制已实现工具的页面结构）
3. 在 `src/pages.json` 添加页面路由

## Styling

- 全局 SCSS 变量在 `uni.scss`（中性灰 `#F5F5F7` 背景、`#1D1D1F` 主色、`#007AFF` 链接色）
- 所有页面用 `<style lang="scss" scoped>`，工具页面统一浅灰背景 + 白色圆角卡片
- 工具页面类名前缀用工具缩写（如 `rd__`、`led__`），避免类名冲突

## Tab Switching

三个主页面使用**自定义 TabBar 组件**（非原生 `tabBar`），点击触发 `@change` 事件，通过 `uni.reLaunch()` 切换页面以清除导航栈。
