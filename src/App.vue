// 应用入口文件
// 用于配置全局样式、全局生命周期等
<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { useStore } from 'vuex'

onLaunch(() => {
  const store = useStore()
  store.dispatch('hydrate')
})
</script>

<style lang="scss">
@import '@/global-classes.scss';
</style>
