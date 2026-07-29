/**
 * 底部菜单栏组件 - TabBar
 * 自定义底部导航栏（替代原生 tabBar）
 * 使用：<TabBar :current="currentTab" @change="onTabChange" />
 */
<template>
  <view class="tab-bar">
    <view class="tab-bar__inner">
      <view
        v-for="(tab, index) in tabs"
        :key="index"
        class="tab-bar__item"
        :class="{ 'tab-bar__item--active': current === tab.key }"
        @tap="handleChange(tab.key)"
      >
        <text class="tab-bar__icon">{{ tab.icon }}</text>
        <text class="tab-bar__label">{{ tab.name }}</text>
      </view>
    </view>
    <!-- iPhone 底部安全区适配 -->
    <view class="tab-bar__safe-area"></view>
  </view>
</template>

<script setup>
defineProps({
  current: {
    type: String,
    default: 'tools'
  }
})

const emit = defineEmits(['change'])

// 底部菜单项定义
const tabs = [
  { key: 'tools', name: '工具列表', icon: '🧰' },
  { key: 'coupons', name: '卡券', icon: '🎫' },
  { key: 'profile', name: '我的', icon: '👤' }
]

function handleChange(key) {
  emit('change', key)
}
</script>

<style lang="scss" scoped>
.tab-bar {
  background: $card-bg;
  border-top: 1rpx solid $border-color;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;

  &__inner {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 8rpx 0 0;
    height: 100rpx;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    height: 100%;
    padding: 4rpx 0;
    transition: all 0.2s;

    &--active {
      .tab-bar__label {
        color: $primary-color;
        font-weight: 600;
      }
    }
  }

  &__icon {
    font-size: 44rpx;
    margin-bottom: 4rpx;
    transition: transform 0.2s;
  }

  &__label {
    font-size: 20rpx;
    color: $text-light;
    transition: color 0.2s;
  }

  // iPhone 底部安全区
  &__safe-area {
    height: env(safe-area-inset-bottom, 0);
  }
}
</style>
