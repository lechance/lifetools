/**
 * 数据同步设置页
 * 总开关 + 按工具勾选需要云同步的独立数据；支持立即同步与清除云端备份。
 * 仅微信小程序可用（依赖 wx.login 换 openid）。
 */
<template>
  <view class="sy">
    <view class="sy__header">
      <text class="sy__title">数据同步</text>
      <text class="sy__desc">将收藏、使用记录等数据备份到云端，多设备间自动合并。仅微信小程序支持。</text>
    </view>

    <!-- #ifndef MP-WEIXIN -->
    <view class="sy__notice">
      <text class="sy__notice-text">当前平台不支持云同步，请在微信小程序中使用</text>
    </view>
    <!-- #endif -->

    <!-- 总开关 -->
    <view class="sy__card">
      <view class="sy__cell sy__cell--switch">
        <view class="sy__cell-main">
          <text class="sy__cell-label">开启云同步</text>
          <text class="sy__cell-sub">{{ enabled ? '启动时拉取、退后台推送' : '关闭状态，数据仅保存在本机' }}</text>
        </view>
        <switch :checked="enabled" color="#1D1D1F" @change="onToggleMaster" />
      </view>
      <view v-if="lastSyncAt" class="sy__cell sy__cell--plain">
        <text class="sy__cell-sub">上次同步：{{ formatTimestamp(lastSyncAt, 'YYYY-MM-DD HH:mm') }}</text>
      </view>
    </view>

    <!-- 全局数据说明 -->
    <view class="sy__section-title">全局数据</view>
    <view class="sy__card">
      <view class="sy__cell sy__cell--plain">
        <text class="sy__cell-icon">🌐</text>
        <view class="sy__cell-main">
          <text class="sy__cell-label">收藏 · 使用记录 · 搜索历史 · 登录资料</text>
          <text class="sy__cell-sub">随总开关自动同步</text>
        </view>
      </view>
    </view>

    <!-- 工具数据 -->
    <view class="sy__section-title">工具数据</view>
    <view class="sy__card">
      <view
        v-for="tool in syncTools"
        :key="tool.id"
        class="sy__cell"
        :class="{ 'sy__cell--disabled': !enabled }"
        @tap="!enabled && showToast('请先开启云同步')"
      >
        <text class="sy__cell-icon">{{ tool.icon }}</text>
        <view class="sy__cell-main">
          <text class="sy__cell-label">{{ tool.name }}</text>
        </view>
        <switch
          :checked="enabledTools.includes(tool.id)"
          :disabled="!enabled"
          color="#1D1D1F"
          @change="(e) => onToggleTool(tool.id, e)"
        />
      </view>
    </view>

    <!-- 操作 -->
    <view class="sy__actions">
      <button class="sy__btn sy__btn--primary" :disabled="!enabled" @tap="onSyncNow">立即同步</button>
      <button class="sy__btn sy__btn--danger" :disabled="!enabled" @tap="onClearCloud">清除云端备份</button>
    </view>

    <view class="sy__tip">
      <text class="sy__tip-text">说明：冲突时以最近修改为准自动合并；关闭某工具的开关后，其云端数据保留，可随时重新开启；「清除云端备份」会删除当前已开启范围内的全部云端数据。</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useStore } from 'vuex'
import { getToolById } from '@/utils/tools-data'
import {
  TOOL_DATA_KEYS,
  isEnabled,
  setEnabled,
  getEnabledTools,
  setEnabledTools,
  getLastSyncAt,
  isSupported,
  syncNow,
  clearServerData,
} from '@/utils/sync'
import { showToast, showModal, showLoading, hideLoading, formatTimestamp } from '@/utils/helpers'

const store = useStore()

const enabled = ref(false)
const enabledTools = ref([])
const lastSyncAt = ref(0)
const syncing = ref(false)

/** 可勾选的工具列表（含名称/图标），按分类顺序稳定展示 */
const syncTools = computed(() =>
  Object.keys(TOOL_DATA_KEYS).map((id) => {
    const meta = getToolById(id) || {}
    return { id, name: meta.name || id, icon: meta.icon || '🧩' }
  })
)

function refreshState() {
  enabled.value = isEnabled()
  enabledTools.value = getEnabledTools()
  lastSyncAt.value = getLastSyncAt()
}

onShow(() => {
  refreshState()
})

function onToggleMaster(e) {
  setEnabled(e.detail.value && isSupported())
  refreshState()
}

function onToggleTool(toolId, e) {
  const next = e.detail.value
    ? Array.from(new Set([...enabledTools.value, toolId]))
    : enabledTools.value.filter((id) => id !== toolId)
  setEnabledTools(next)
  refreshState()
}

/** 立即同步：pull 合并 → push 本地变更 */
async function onSyncNow() {
  if (syncing.value) return
  syncing.value = true
  showLoading('正在同步...')
  try {
    const res = await syncNow(store)
    hideLoading()
    if (res.ok) {
      showSuccess('同步完成')
    } else {
      showToast('同步失败，请检查网络')
    }
  } finally {
    syncing.value = false
    refreshState()
  }
}

/** 清除云端备份（不影响本机数据） */
function onClearCloud() {
  showModal({
    title: '清除云端备份',
    content: '将删除当前已开启范围内的全部云端数据，本机数据不受影响',
  }).then(async (confirmed) => {
    if (!confirmed) return
    showLoading('正在清除...')
    const res = await clearServerData()
    hideLoading()
    if (res.skipped) {
      showToast('请先开启云同步')
    } else if (res.ok) {
      showToast(`已清除 ${res.deleted} 项云端数据`)
    } else {
      showToast('清除失败，请重试')
    }
  })
}
</script>

<style lang="scss" scoped>
.sy {
  min-height: 100vh;
  background: $bg-color;
  padding: 24rpx;

  &__header {
    padding: 16rpx 8rpx 24rpx;
  }

  &__title {
    display: block;
    font-size: 40rpx;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 8rpx;
  }

  &__desc {
    display: block;
    font-size: 26rpx;
    color: $text-secondary;
    line-height: 1.6;
  }

  &__notice {
    background: $warning;
    opacity: 0.9;
    border-radius: $radius-md;
    padding: 20rpx 28rpx;
    margin-bottom: 24rpx;
  }

  &__notice-text {
    color: #fff;
    font-size: $font-size-sm;
  }

  &__section-title {
    font-size: $font-size-sm;
    color: $text-light;
    margin: 8rpx 8rpx 12rpx;
  }

  &__card {
    background: $card-bg;
    border-radius: $radius-md;
    box-shadow: $shadow-sm;
    margin-bottom: 24rpx;
    overflow: hidden;
  }

  &__cell {
    display: flex;
    align-items: center;
    padding: 26rpx 24rpx;
    border-bottom: 1rpx solid $border-color;

    &:last-child {
      border-bottom: none;
    }

    &--switch {
      padding: 30rpx 24rpx;
    }

    &--plain {
      padding: 20rpx 24rpx;
    }

    &--disabled {
      opacity: 0.45;
    }
  }

  &__cell-icon {
    font-size: 36rpx;
    margin-right: 20rpx;
    flex-shrink: 0;
  }

  &__cell-main {
    flex: 1;
    min-width: 0;
    margin-right: 16rpx;
  }

  &__cell-label {
    display: block;
    font-size: $font-size-base;
    color: $text-primary;
  }

  &__cell-sub {
    display: block;
    font-size: $font-size-xs;
    color: $text-light;
    margin-top: 4rpx;
    line-height: 1.5;
  }

  &__actions {
    display: flex;
    gap: 20rpx;
    margin-top: 8rpx;
  }

  &__btn {
    flex: 1;
    border-radius: $radius-md;
    font-size: $font-size-base;
    padding: 22rpx 0;
    border: none;
    line-height: 1;

    &[disabled] {
      opacity: 0.4;
    }

    &--primary {
      background: $primary-color;
      color: #fff;

      &:active {
        opacity: 0.8;
      }
    }

    &--danger {
      background: $card-bg;
      color: $danger;

      &:active {
        opacity: 0.7;
      }
    }
  }

  &__tip {
    background: $card-bg;
    border-radius: $radius-md;
    padding: 24rpx 28rpx;
    box-shadow: $shadow-sm;
    margin-top: 24rpx;
  }

  &__tip-text {
    font-size: $font-size-xs;
    color: $text-light;
    line-height: 1.6;
  }
}
</style>
