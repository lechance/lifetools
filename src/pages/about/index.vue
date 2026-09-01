/**
 * 关于我们子页面
 * 展示：用户协议、隐私政策 两个选项
 */
<template>
  <view class="page-about">
    <!-- 头部信息 -->
    <view class="page-about__header">
      <text class="page-about__logo">🧰</text>
      <text class="page-about__name">治点工具箱</text>
      <text class="page-about__version">v{{ version }}</text>
      <text class="page-about__desc">一款集合日常生活常用工具的微信小程序</text>
    </view>

    <!-- 选项列表 -->
    <view class="page-about__menu">
      <view class="page-about__menu-item" @tap="handleAgreement">
        <text class="page-about__menu-icon">📄</text>
        <text class="page-about__menu-label">用户协议</text>
        <text class="page-about__menu-arrow">›</text>
      </view>
      <view class="page-about__menu-item" @tap="handlePrivacy">
        <text class="page-about__menu-icon">🔒</text>
        <text class="page-about__menu-label">隐私政策</text>
        <text class="page-about__menu-arrow">›</text>
      </view>
    </view>

    <view class="page-about__footer">治点工具箱 · 用心做好每一个工具</view>
  </view>
</template>

<script setup>
const version = __APP_VERSION__

/** 用户协议 */
function handleAgreement() {
  uni.navigateTo({ url: '/pages/agreement/index' })
}

/** 隐私政策 */
function handlePrivacy() {
  uni.navigateTo({ url: '/pages/privacy/index' })
}
</script>

<style lang="scss" scoped>
.page-about {
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
  background: $bg-color;
  padding-bottom: 60rpx;

  // 头部
  &__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 80rpx 40rpx 60rpx;
    background: $card-bg;
  }

  &__logo {
    font-size: 100rpx;
    margin-bottom: 20rpx;
  }

  &__name {
    font-size: $font-size-xl;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 8rpx;
  }

  &__version {
    font-size: $font-size-sm;
    color: $text-light;
    margin-bottom: 16rpx;
  }

  &__desc {
    font-size: $font-size-base;
    color: $text-secondary;
    text-align: center;
    line-height: 1.5;
  }

  // 菜单
  &__menu {
    margin: 24rpx;
    background: $card-bg;
    border-radius: $radius-md;
    overflow: hidden;
    box-shadow: $shadow-sm;
  }

  &__menu-item {
    display: flex;
    align-items: center;
    padding: 30rpx 24rpx;
    border-bottom: 1rpx solid $border-color;

    &:last-child {
      border-bottom: none;
    }

    &:active {
      background: $primary-bg;
    }
  }

  &__menu-icon {
    font-size: 36rpx;
    margin-right: 20rpx;
  }

  &__menu-label {
    flex: 1;
    font-size: $font-size-base;
    color: $text-primary;
  }

  &__menu-arrow {
    font-size: 36rpx;
    color: $text-light;
  }

  // 版权
  &__footer {
    text-align: center;
    font-size: $font-size-sm;
    color: $text-light;
    margin-top: 40rpx;
  }
}
</style>