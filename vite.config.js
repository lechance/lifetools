import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'path'

// https://uniapp.dcloud.net.cn/collocation/vite-config.html
export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 注入全局 SCSS 变量
        additionalData: `@import "${path.resolve(__dirname, 'src/uni.scss').replace(/\\/g, '/')}";\n`
      }
    }
  }
})
