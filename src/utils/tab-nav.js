/**
 * Tab 导航工具
 * - 微信小程序：原生 tabBar + uni.switchTab（页面保活，切换不销毁）
 * - 其他端（H5 等）：继续 uni.reLaunch（条件编译隔离）
 */
const TAB_PAGES = {
  tools: '/pages/index/index',
  favorites: '/pages/favorites/index',
  coupons: '/pages/coupons/index',
  profile: '/pages/profile/index'
}

/** 切换到指定 Tab（key 见 TAB_PAGES） */
export function switchToTab(key) {
  const url = TAB_PAGES[key]
  if (!url) return
  // #ifdef MP-WEIXIN
  uni.switchTab({ url })
  // #endif
  // #ifndef MP-WEIXIN
  uni.reLaunch({ url })
  // #endif
}

/** 隐藏原生 tabBar（仅微信小程序生效，底栏样式由自定义 TabBar 提供） */
export function hideNativeTabBar() {
  // #ifdef MP-WEIXIN
  uni.hideTabBar({ animation: false })
  // #endif
}
