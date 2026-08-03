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

    <!-- 收藏统计 -->
    <view class="page-profile__stats">
      <view class="page-profile__stat-item">
        <text class="page-profile__stat-num">{{ favoritesCount }}</text>
        <text class="page-profile__stat-label">收藏工具</text>
      </view>
      <view class="page-profile__stat-item">
        <text class="page-profile__stat-num">{{ recordsCount }}</text>
        <text class="page-profile__stat-label">使用记录</text>
      </view>
      <view class="page-profile__stat-item">
        <text class="page-profile__stat-num">{{ totalTools }}</text>
        <text class="page-profile__stat-label">全部工具</text>
      </view>
    </view>

    <!-- 关于小程序 -->
    <view class="page-profile__menu-group">
      <view class="page-profile__menu-title">关于小程序</view>
      <view class="page-profile__menu-list">
        <!-- 在线客服 -->
        <view class="page-profile__menu-item" @tap="handleContact">
          <text class="page-profile__menu-icon">💬</text>
          <text class="page-profile__menu-label">在线客服</text>
          <text class="page-profile__menu-arrow">›</text>
        </view>
        <!-- 关于我们 -->
        <view class="page-profile__menu-item" @tap="handleAbout">
          <text class="page-profile__menu-icon">📋</text>
          <text class="page-profile__menu-label">关于我们</text>
          <text class="page-profile__menu-arrow">›</text>
        </view>
        <!-- 鼓励我们 -->
        <view class="page-profile__menu-item" @tap="handleEncourage">
          <text class="page-profile__menu-icon">⭐</text>
          <text class="page-profile__menu-label">鼓励我们</text>
          <text class="page-profile__menu-arrow">›</text>
        </view>
        <!-- 分享我们 -->
        <view class="page-profile__menu-item" @tap="handleShare">
          <text class="page-profile__menu-icon">📤</text>
          <text class="page-profile__menu-label">分享我们</text>
          <text class="page-profile__menu-arrow">›</text>
        </view>
        <!-- 工具建议 -->
        <view class="page-profile__menu-item" @tap="handleSuggestion">
          <text class="page-profile__menu-icon">💡</text>
          <text class="page-profile__menu-label">工具建议</text>
          <text class="page-profile__menu-arrow">›</text>
        </view>
        <!-- 隐私政策 -->
        <view class="page-profile__menu-item" @tap="handlePrivacy">
          <text class="page-profile__menu-icon">🔒</text>
          <text class="page-profile__menu-label">隐私政策</text>
          <text class="page-profile__menu-arrow">›</text>
        </view>
        <!-- 用户协议 -->
        <view class="page-profile__menu-item" @tap="handleAgreement">
          <text class="page-profile__menu-icon">📄</text>
          <text class="page-profile__menu-label">用户协议</text>
          <text class="page-profile__menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 使用说明 -->
    <view class="page-profile__notice">
      <view class="page-profile__notice-header">
        <text class="page-profile__notice-icon">💡</text>
        <text class="page-profile__notice-title">使用说明</text>
      </view>
      <view class="page-profile__notice-body">
        <text class="page-profile__notice-text">
          治点工具箱是一款集合日常生活常用工具的微信小程序，目前版本为 1.0.0。我们致力于为您提供便捷、高效的工具服务。
        </text>
        <text class="page-profile__notice-text">
          当前为第一阶段版本，已搭建完整框架，各工具功能将在后续版本中逐步完善。如有任何建议或反馈，欢迎通过在线客服联系我们。
        </text>
        <text class="page-profile__notice-text">
          感谢您的使用与支持！
        </text>
      </view>
    </view>

    <!-- 底部菜单栏 -->
    <TabBar current="profile" @change="handleTabChange" />

    <!-- 底部占位 -->
    <view class="page-profile__bottom-placeholder"></view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import TabBar from '@/components/TabBar.vue'
import { getAllTools } from '@/utils/tools-data'
import { showToast } from '@/utils/helpers'

const store = useStore()

const favoritesCount = computed(() => store.state.favorites.length)
const recordsCount = computed(() => store.state.records.length)
const totalTools = computed(() => getAllTools().length)

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

/** 分享我们 */
function handleShare() {
  showToast('分享功能开发中，敬请期待')
}

/** 工具建议 */
function handleSuggestion() {
  showToast('感谢您的建议！请通过在线客服反馈 💪')
}

/** 隐私政策 */
function handlePrivacy() {
  showToast('隐私政策内容准备中')
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

  // 统计区域
  &__stats {
    display: flex;
    justify-content: space-around;
    background: $card-bg;
    margin: 0 24rpx 24rpx;
    border-radius: $radius-md;
    padding: 24rpx 16rpx;
    box-shadow: $shadow-base;
  }

  &__stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
  }

  &__stat-num {
    font-size: $font-size-xl;
    font-weight: 700;
    color: $primary-color;
  }

  &__stat-label {
    font-size: $font-size-sm;
    color: $text-secondary;
    margin-top: 4rpx;
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

  // 使用说明
  &__notice {
    margin: 0 24rpx 24rpx;
    background: $card-bg;
    border-radius: $radius-md;
    padding: 24rpx;
    box-shadow: $shadow-sm;

    &-header {
      display: flex;
      align-items: center;
      margin-bottom: 16rpx;
    }

    &-icon {
      font-size: 36rpx;
      margin-right: 12rpx;
    }

    &-title {
      font-size: $font-size-md;
      font-weight: 600;
      color: $text-primary;
    }

    &-body {
      display: flex;
      flex-direction: column;
      gap: 12rpx;
    }

    &-text {
      font-size: $font-size-sm;
      color: $text-secondary;
      line-height: 1.6;
    }
  }

  // 底部占位
  &__bottom-placeholder {
    height: 140rpx;
  }
}
</style>
