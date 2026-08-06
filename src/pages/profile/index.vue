/**
 * 我的页面
 * 展示用户信息、小程序相关内容
 */
<template>
  <view class="page-profile">
    <!-- 顶部用户信息栏 -->
    <view class="page-profile__user-card">
      <view class="page-profile__user-avatar">
        <text class="page-profile__avatar-text">👤</text>
      </view>
      <view class="page-profile__user-info">
        <text class="page-profile__user-name">治点工具箱用户</text>
        <text class="page-profile__user-id">ID: 10000001</text>
      </view>
    </view>

    <!-- 设置 -->
    <view class="page-profile__menu-group">
      <view class="page-profile__menu-title">设置</view>
      <view class="page-profile__menu-list">
        <view class="page-profile__menu-item" @tap="handleApiSettings">
          <text class="page-profile__menu-icon">🔑</text>
          <text class="page-profile__menu-label">API 设置</text>
          <text class="page-profile__menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 关于小程序 -->
    <view class="page-profile__menu-group">
      <view class="page-profile__menu-title">关于小程序</view>
      <view class="page-profile__menu-list">
        <!-- 鼓励我们 -->
        <view class="page-profile__menu-item" @tap="handleEncourage">
          <text class="page-profile__menu-icon">⭐</text>
          <text class="page-profile__menu-label">鼓励我们</text>
          <text class="page-profile__menu-arrow">›</text>
        </view>
        <!-- 工具建议 -->
        <view class="page-profile__menu-item" @tap="handleSuggestion">
          <text class="page-profile__menu-icon">💡</text>
          <text class="page-profile__menu-label">工具建议</text>
          <text class="page-profile__menu-arrow">›</text>
        </view>
        <!-- 关于我们 -->
        <view class="page-profile__menu-item" @tap="handleAbout">
          <text class="page-profile__menu-icon">📋</text>
          <text class="page-profile__menu-label">关于我们</text>
          <text class="page-profile__menu-arrow">›</text>
        </view>
        <!-- 在线客服 -->
        <view class="page-profile__menu-item" @tap="handleContact">
          <text class="page-profile__menu-icon">💬</text>
          <text class="page-profile__menu-label">在线客服</text>
          <text class="page-profile__menu-arrow">›</text>
        </view>
        <!-- 用户协议 -->
        <view class="page-profile__menu-item" @tap="handleAgreement">
          <text class="page-profile__menu-icon">📄</text>
          <text class="page-profile__menu-label">用户协议</text>
          <text class="page-profile__menu-arrow">›</text>
        </view>
        <!-- 隐私政策 -->
        <view class="page-profile__menu-item" @tap="handlePrivacy">
          <text class="page-profile__menu-icon">🔒</text>
          <text class="page-profile__menu-label">隐私政策</text>
          <text class="page-profile__menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 底部菜单栏 -->
    <TabBar current="profile" @change="handleTabChange" />

    <!-- 底部占位 -->
    <view class="page-profile__bottom-placeholder"></view>
  </view>
</template>

<script setup>
import TabBar from '@/components/TabBar.vue'
import { showToast } from '@/utils/helpers'

/** 底部Tab切换 - 使用 reLaunch 清除页面栈 */
function handleTabChange(key) {
  if (key === 'profile') return
  if (key === 'tools') {
    uni.reLaunch({ url: '/pages/index/index' })
  } else if (key === 'favorites') {
    uni.reLaunch({ url: '/pages/favorites/index' })
  } else if (key === 'coupons') {
    uni.reLaunch({ url: '/pages/coupons/index' })
  }
}

/** 在线客服 */
function handleContact() {
  showToast('客服功能开发中，敬请期待')
}

/** 关于我们 */
function handleAbout() {
  showToast('治点工具箱 v1.0.0')
}

/** 鼓励我们 */
function handleEncourage() {
  showToast('感谢您的鼓励！我们会继续努力 💪')
}

/** 工具建议 */
function handleSuggestion() {
  showToast('感谢您的建议！请通过在线客服反馈 💪')
}

/** 隐私政策 */
function handlePrivacy() {
  showToast('隐私政策内容准备中')
}

/** API 设置 */
function handleApiSettings() {
  uni.navigateTo({ url: '/pages/settings/index' })
}

/** 用户协议 */
function handleAgreement() {
  showToast('用户协议内容准备中')
}
</script>

<style lang="scss" scoped>
.page-profile {
  min-height: 100vh;
  background: $bg-color;

  // 用户信息卡片
  &__user-card {
    display: flex;
    align-items: center;
    padding: 40rpx 32rpx 32rpx;
    background: $card-bg;
    margin-bottom: 24rpx;
  }

  &__user-avatar {
    width: 120rpx;
    height: 140rpx;
    border-radius: 50%;
    background: $primary-bg;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;
  }

  &__avatar-text {
    font-size: 56rpx;
  }

  &__user-info {
    flex: 1;
  }

  &__user-name {
    font-size: $font-size-lg;
    font-weight: 700;
    color: $text-primary;
    display: block;
    margin-bottom: 6rpx;
  }

  &__user-id {
    font-size: $font-size-sm;
    color: $text-secondary;
    display: block;
  }

  // 菜单组
  &__menu-group {
    margin: 0 24rpx 24rpx;
  }

  &__menu-title {
    font-size: $font-size-sm;
    color: $text-light;
    margin-bottom: 12rpx;
    padding-left: 8rpx;
  }

  &__menu-list {
    background: $card-bg;
    border-radius: $radius-md;
    overflow: hidden;
    box-shadow: $shadow-sm;
  }

  &__menu-item {
    display: flex;
    align-items: center;
    padding: 28rpx 24rpx;
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

  // 底部占位
  &__bottom-placeholder {
    height: 140rpx;
  }
}
</style>
