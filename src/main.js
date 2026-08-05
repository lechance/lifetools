// 应用初始化文件
import { createSSRApp } from 'vue'
import { createStore } from './store/index'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)

  // 使用 Vuex 状态管理
  const store = createStore()
  app.use(store)

  return {
    app,
    store
  }
}
