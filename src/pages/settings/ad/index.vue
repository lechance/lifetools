<template>
  <view class="ad-settings">
    <view class="ad-settings__header">
      <text class="ad-settings__title">工具广告</text>
      <text class="ad-settings__desc">管理工具的激励视频广告设置</text>
    </view>

    <!-- 广告状态 -->
    <view class="ad-settings__section">
      <view class="ad-settings__section-title">广告状态</view>
      <view class="ad-settings__card">
        <view class="ad-settings__row">
          <text class="ad-settings__label">广告功能</text>
          <text :class="['ad-settings__status', adEnabled ? 'ad-settings__status--on' : '']">
            {{ adEnabled ? '已启用' : '未启用' }}
          </text>
        </view>
        <view class="ad-settings__row">
          <text class="ad-settings__label">广告位 ID</text>
          <text class="ad-settings__value">{{ adUnitIdStatus }}</text>
        </view>
        <view class="ad-settings__row">
          <text class="ad-settings__label">云端广告工具</text>
          <text class="ad-settings__value">{{ adToolsCount }} 个工具</text>
        </view>
        <view class="ad-settings__row">
          <text class="ad-settings__label">本次会话已解锁</text>
          <text class="ad-settings__value">{{ unlockedCount }} 个工具</text>
        </view>
      </view>
    </view>

    <!-- 广告工具列表 -->
    <view class="ad-settings__section">
      <view class="ad-settings__section-title">广告工具列表</view>
      <view v-if="adToolsList.length === 0" class="ad-settings__empty">
        <text class="ad-settings__empty-icon">📭</text>
        <text class="ad-settings__empty-text">暂无工具启用广告</text>
      </view>
      <view v-else class="ad-settings__card">
        <view v-for="tool in adToolsList" :key="tool.id" class="ad-settings__tool">
          <text class="ad-settings__tool-icon">{{ tool.icon }}</text>
          <view class="ad-settings__tool-info">
            <text class="ad-settings__tool-name">{{ tool.name }}</text>
            <text class="ad-settings__tool-id">{{ tool.id }}</text>
          </view>
          <text v-if="unlockedSet.has(tool.id)" class="ad-settings__tool-badge">已解锁</text>
        </view>
      </view>
    </view>

    <!-- 调试操作 -->
    <view class="ad-settings__section">
      <view class="ad-settings__section-title">调试</view>
      <view class="ad-settings__card">
        <view class="ad-settings__action" @tap="handleResetUnlocks">
          <text class="ad-settings__action-icon">🔄</text>
          <view class="ad-settings__action-info">
            <text class="ad-settings__action-label">重置广告解锁</text>
            <text class="ad-settings__action-desc">清除本次会话的广告解锁记录，下次进入需重新观看广告</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 说明 -->
    <view class="ad-settings__section">
      <view class="ad-settings__section-title">说明</view>
      <view class="ad-settings__card">
        <view class="ad-settings__info">
          <text class="ad-settings__info-text">• 广告工具由云端配置，需在管理后台设置</text>
          <text class="ad-settings__info-text">• 每个工具首次使用需观看完整广告</text>
          <text class="ad-settings__info-text">• 同一会话内已解锁的工具无需重复观看</text>
          <text class="ad-settings__info-text">• 广告加载失败时将自动放行</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getToolById } from '@/utils/tools-data'
import { getAdTools } from '@/utils/app-config'
import { isAdEnabled, getUnlockedCount, getUnlockedIds, resetAdUnlocks } from '@/utils/ad-gate'
import { showToast, showModal } from '@/utils/helpers'
import { AD_UNIT_ID } from '@/utils/api-config'

const adEnabled = computed(() => isAdEnabled())
const adUnitIdStatus = computed(() => AD_UNIT_ID ? '已配置' : '未配置')

const adTools = getAdTools()
const adToolsCount = computed(() => adTools.value.length)

const unlockedCount = ref(0)
const unlockedSet = ref(new Set())

const adToolsList = computed(() =>
  adTools.value.map(id => getToolById(id)).filter(Boolean)
)

onMounted(() => {
  refreshUnlocked()
})

function refreshUnlocked() {
  unlockedCount.value = getUnlockedCount()
  unlockedSet.value = new Set(getUnlockedIds())
}

function handleResetUnlocks() {
  showModal({
    title: '重置广告解锁',
    content: '确定重置本次会话的广告解锁记录？'
  }).then((confirmed) => {
    if (!confirmed) return
    resetAdUnlocks()
    refreshUnlocked()
    showToast('已重置')
  })
}
</script>

<style lang="scss" scoped>
.ad-settings {
  min-height: 100vh;
  background: $bg-color;
  padding: 0 24rpx;

  &__header {
    padding: 48rpx 0 32rpx;
  }

  &__title {
    font-size: 48rpx;
    font-weight: 700;
    color: $text-primary;
    display: block;
    margin-bottom: 8rpx;
  }

  &__desc {
    font-size: $font-size-sm;
    color: $text-secondary;
  }

  &__section {
    margin-bottom: 32rpx;
  }

  &__section-title {
    font-size: $font-size-sm;
    color: $text-light;
    margin-bottom: 12rpx;
    padding-left: 8rpx;
  }

  &__card {
    background: $card-bg;
    border-radius: $radius-md;
    overflow: hidden;
    box-shadow: $shadow-sm;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28rpx 24rpx;
    border-bottom: 1rpx solid $border-color;

    &:last-child {
      border-bottom: none;
    }
  }

  &__label {
    font-size: $font-size-base;
    color: $text-primary;
  }

  &__value {
    font-size: $font-size-base;
    color: $text-secondary;
  }

  &__status {
    font-size: $font-size-base;
    color: $danger;
    font-weight: 500;

    &--on {
      color: $success;
    }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60rpx 0;
    background: $card-bg;
    border-radius: $radius-md;
  }

  &__empty-icon {
    font-size: 72rpx;
    margin-bottom: 16rpx;
  }

  &__empty-text {
    font-size: $font-size-base;
    color: $text-secondary;
  }

  &__tool {
    display: flex;
    align-items: center;
    padding: 24rpx;
    border-bottom: 1rpx solid $border-color;

    &:last-child {
      border-bottom: none;
    }
  }

  &__tool-icon {
    font-size: 40rpx;
    margin-right: 20rpx;
  }

  &__tool-info {
    flex: 1;
    min-width: 0;
  }

  &__tool-name {
    font-size: $font-size-base;
    color: $text-primary;
    display: block;
  }

  &__tool-id {
    font-size: $font-size-xs;
    color: $text-light;
    font-family: monospace;
  }

  &__tool-badge {
    font-size: $font-size-xs;
    color: $success;
    background: rgba($success, 0.1);
    padding: 4rpx 16rpx;
    border-radius: $radius-round;
  }

  &__action {
    display: flex;
    align-items: center;
    padding: 28rpx 24rpx;

    &:active {
      background: $primary-bg;
    }
  }

  &__action-icon {
    font-size: 40rpx;
    margin-right: 20rpx;
  }

  &__action-info {
    flex: 1;
  }

  &__action-label {
    font-size: $font-size-base;
    color: $text-primary;
    display: block;
  }

  &__action-desc {
    font-size: $font-size-xs;
    color: $text-light;
    display: block;
    margin-top: 4rpx;
  }

  &__info {
    padding: 24rpx;
  }

  &__info-text {
    font-size: $font-size-sm;
    color: $text-secondary;
    line-height: 1.8;
    display: block;
  }
}
</style>
