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
  { key: 'tools', name: '工具', icon: '🧰' },
  { key: 'favorites', name: '收藏', icon: '⭐' },
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
    height: 110rpx;
    padding: 0 0 0;
    position: relative;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    height: 100%;
    padding: 10rpx 0 0;
    position: relative;
    -webkit-tap-highlight-color: transparent;

    &:active {
      opacity: 0.7;
    }

    &--active {
      .tab-bar__icon {
        transform: scale(1.15);
        filter: grayscale(0);
        opacity: 1;
      }
      .tab-bar__label {
        color: $text-primary;
        font-weight: 600;
      }
    }
  }

  &__icon {
    font-size: 48rpx;
    line-height: 1;
    margin-bottom: 4rpx;
    transition: transform 0.2s ease, filter 0.2s ease, opacity 0.2s ease;
    // 未选中：图标去色（灰度）+ 降低透明度，仅选中 tab 有色彩
    filter: grayscale(100%);
    opacity: 0.5;
  }

  &__label {
    font-size: 20rpx;
    line-height: 1.3;
    color: $text-light;
    margin-top: 2rpx;
    transition: color 0.2s;
  }

  // iPhone 底部安全区
  &__safe-area {
    height: env(safe-area-inset-bottom, 0);
  }
}
</style>
