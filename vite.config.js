import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'path'
import fs from 'fs'

// https://uniapp.dcloud.net.cn/collocation/vite-config.html
export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vuex']
        }
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['import', 'legacy-js-api'],
        additionalData: `@import "${path.resolve(__dirname, 'src/uni.scss').replace(/\\/g, '/')}";\n`
      }
    }
  },
  server: {
    https: {
      key: fs.readFileSync('./certs/key.pem'),
      cert: fs.readFileSync('./certs/cert.pem')
    }
  }
})
