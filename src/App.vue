// 应用入口文件
// 用于配置全局样式、全局生命周期等
<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('App Launch - 万能工具派启动')
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
/* 全局样式已在 uni.scss 中定义 */
</style>
