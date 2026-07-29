# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"万能工具派" — 微信小程序，集合日常生活常用工具。uni-app 3.x (Vue 3 + Vite) 构建，编译到微信小程序和 H5。

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

**注意：** 构建前需在 `src/manifest.json` 中配置 `mp-weixin.appid` 为真实 AppID。
H5 构建产物用于部署到 web 服务器；mp-weixin 产物用微信开发者工具打开。

## Architecture

### Page Routing (`src/pages.json`)

- 主页面：`pages/index/index`（工具列表）、`pages/coupons/index`（卡券）、`pages/profile/index`（我的）
- 自定义底部 TabBar（非原生 tabBar），通过 `uni.reLaunch()` 切换页面
- 48 个工具页面：`pages/tools/{tool-id}/index`（第一阶段为占位页面）

### Directory Structure

```
src/
├── components/        # 公共组件
│   ├── TabBar.vue          # 底部菜单栏
│   ├── SearchBar.vue       # 搜索框（防抖）
│   ├── CategoryNav.vue     # 分类标签（横向滚动）
│   ├── ToolGrid.vue        # 工具网格（3列）
│   └── CouponCard.vue      # 卡券卡片
├── pages/
│   ├── index/              # 首页：搜索+分类+网格+最近使用
│   ├── coupons/            # 卡券列表+领取
│   ├── profile/            # 用户信息+菜单+统计
│   └── tools/{id}/         # 各工具页面（占位）
├── utils/
│   ├── tools-data.js       # 工具元数据（名称、图标、分类）
│   ├── storage.js          # 本地存储封装（收藏、记录、搜索历史）
│   └── helpers.js          # 通用函数（防抖、节流、提示等）
├── store/index.js          # Vuex 状态管理
├── uni.scss                # 全局样式变量+CSS自定义属性
├── App.vue                 # 应用入口
└── main.js                 # 初始化
```

### Data Flow

- **工具数据**：`tools-data.js` 定义所有工具元数据，导出按分类/搜索过滤的函数
- **持久化**：`storage.js` 封装 `uni.getStorageSync/setStorageSync`，管理收藏ID列表、使用记录（最近50条）、搜索历史
- **状态管理**：Vuex store 同步持久化数据，提供 mutations/actions/getters，页面通过 `useStore()` 访问
- **收藏**：`getFavorites()` → 收藏ID数组 → `ToolGrid` 组件通过 props 接收 → 用户点击触发 `toggleFavorite` mutation

### Adding a New Tool

1. 在 `src/utils/tools-data.js` 对应分类数组中添加工具条目（`{ id, name, icon, color }`）
2. 创建 `src/pages/tools/{id}/index.vue`（可直接复制现有占位页面模板）
3. 在 `src/pages.json` 中添加对应页面路由配置

### Styling

- 全局 SCSS 变量在 `uni.scss` 中定义（中性灰色调，#1D1D1F 为主色）
- CSS 自定义属性（`var(--primary-color)` 等）全局可用
- 所有组件使用 `<style lang="scss" scoped>`
- 组件通过 `vite.config.js` 的 `additionalData` 自动注入 `uni.scss` 变量
- 工具卡片为纯白简约设计，不使用背景色

### Tab Switching

三个主页面使用**自定义 TabBar 组件**（非原生 `tabBar`），点击触发 `@change` 事件，通过 `uni.reLaunch()` 进行页面切换以清除导航栈。各页面 `handleTabChange` 中排除当前 tab 不做操作。
