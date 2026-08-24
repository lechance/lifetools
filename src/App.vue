// 应用入口文件
// 用于配置全局样式、全局生命周期等
<script setup>
import { onLaunch, onHide } from '@dcloudio/uni-app'
import { useStore } from 'vuex'
import { pullSync, pushSync } from '@/utils/sync'

const store = useStore()

onLaunch(() => {
  store.dispatch('hydrate')
  // 云同步：启动拉取合并（静默失败，离线优先）
  pullSync().then((res) => {
    if (res && res.changed) store.dispatch('reloadUserData')
  })
})

onHide(() => {
  // 云同步：退后台推送本地变更
  pushSync()
})
</script>

<style lang="scss">
@import '@/global-classes.scss';
</style>
