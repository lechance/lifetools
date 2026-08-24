/**
 * 我的页面
 * 展示用户信息、使用统计、设置与关于入口
 */
<template>
  <view class="page-profile">
    <!-- 顶部用户信息栏 -->
    <view class="page-profile__user-card" @tap="handleUserCardTap">
      <view class="page-profile__user-avatar">
        <!-- #ifdef MP-WEIXIN -->
        <image v-if="user && user.avatarPath" class="page-profile__avatar-img" :src="user.avatarPath" mode="aspectFill" />
        <text v-else class="page-profile__avatar-text">👤</text>
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <text class="page-profile__avatar-text">👤</text>
        <!-- #endif -->
      </view>
      <view class="page-profile__user-info">
        <view class="page-profile__user-name-row">
          <text class="page-profile__user-name">{{ user ? user.nickname : '治点工具箱用户' }}</text>
          <text class="page-profile__user-edit">✎</text>
        </view>
        <text v-if="user" class="page-profile__user-id">ID: {{ user.id }}</text>
        <text v-else class="page-profile__user-id">点击登录</text>
        <text v-if="user" class="page-profile__user-time">{{ formatTimestamp(user.loginTime, 'MM-DD HH:mm') }} 登录</text>
      </view>
      <text v-if="!user" class="page-profile__user-arrow">›</text>
    </view>

    <!-- 使用统计 -->
    <view class="page-profile__stats">
      <view class="page-profile__stat" @tap="handleStatsTap('favorites')">
        <text class="page-profile__stat-value">{{ favoritesCount }}</text>
        <text class="page-profile__stat-label">⭐ 收藏</text>
      </view>
      <view class="page-profile__stat" @tap="handleStatsTap('records')">
        <text class="page-profile__stat-value">{{ recordsCount }}</text>
        <text class="page-profile__stat-label">📊 使用</text>
      </view>
      <view class="page-profile__stat" @tap="handleStatsTap('tools')">
        <text class="page-profile__stat-value">{{ TOTAL_TOOL_COUNT }}</text>
        <text class="page-profile__stat-label">🛠️ 工具</text>
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
        <view class="page-profile__menu-item" @tap="handleSuggestion">
          <text class="page-profile__menu-icon">💡</text>
          <text class="page-profile__menu-label">工具建议</text>
          <text class="page-profile__menu-arrow">›</text>
        </view>
        <view class="page-profile__menu-item" @tap="handleClearCache">
          <text class="page-profile__menu-icon">🗑️</text>
          <text class="page-profile__menu-label">清除缓存</text>
          <text class="page-profile__menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 关于小程序 -->
    <view class="page-profile__menu-group">
      <view class="page-profile__menu-title">关于</view>
      <view class="page-profile__menu-list">
        <view class="page-profile__menu-item" @tap="handleAbout">
          <text class="page-profile__menu-icon">📋</text>
          <text class="page-profile__menu-label">关于我们</text>
          <text class="page-profile__menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view v-if="isLoggedIn" class="page-profile__logout" @tap="handleLogout">退出登录</view>

    <!-- 底部标语 -->
    <view class="page-profile__footer">治点工具箱 · 用心做好每一个工具</view>

    <!-- 登录弹窗 -->
    <view v-if="showLogin" class="page-profile__popup">
      <view class="page-profile__popup-mask" @tap="closeLogin" />
      <view class="page-profile__popup-body">
        <view class="page-profile__popup-header">
          <text class="page-profile__popup-title">{{ user ? '编辑资料' : '登录' }}</text>
          <text class="page-profile__popup-close" @tap="closeLogin">✕</text>
        </view>

        <!-- 头像选择（仅微信小程序） -->
        <!-- #ifdef MP-WEIXIN -->
        <button class="page-profile__avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
          <view class="page-profile__avatar-box">
            <image v-if="form.avatarPath" class="page-profile__avatar-img" :src="form.avatarPath" mode="aspectFill" />
            <text v-else class="page-profile__avatar-text">👤</text>
          </view>
          <text class="page-profile__avatar-hint">点击选择微信头像</text>
        </button>
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <view class="page-profile__avatar-box">
          <text class="page-profile__avatar-text">👤</text>
        </view>
        <!-- #endif -->

        <!-- 昵称输入 -->
        <view class="page-profile__field">
          <text class="page-profile__field-label">昵称</text>
          <input
            v-model="form.nickname"
            class="page-profile__field-input"
            type="nickname"
            placeholder="请输入昵称"
            placeholder-class="page-profile__placeholder"
            maxlength="12"
          />
        </view>

        <!-- 操作按钮 -->
        <view class="page-profile__actions">
          <view class="page-profile__btn page-profile__btn--cancel" @tap="closeLogin">取消</view>
          <view class="page-profile__btn page-profile__btn--confirm" @tap="handleConfirm">{{ user ? '保存' : '登录' }}</view>
        </view>
      </view>
    </view>

    <!-- 最近使用弹窗 -->
    <view v-if="showRecordsModal" class="page-profile__popup">
      <view class="page-profile__popup-mask" @tap="closeRecordsModal" />
      <view class="page-profile__popup-body">
        <view class="page-profile__popup-header">
          <text class="page-profile__popup-title">最近使用</text>
          <text class="page-profile__popup-close" @tap="closeRecordsModal">✕</text>
        </view>
        <view v-if="recentRecords.length === 0" class="page-profile__records-empty">
          <text class="page-profile__records-empty-icon">📭</text>
          <text class="page-profile__records-empty-text">暂无使用记录</text>
        </view>
        <view v-else class="page-profile__records-list">
          <view v-for="record in recentRecords" :key="record.id" class="page-profile__record-item">
            <text class="page-profile__record-name">{{ record.toolName }}</text>
            <text class="page-profile__record-time">{{ formatTimestamp(record.timestamp, 'MM-DD HH:mm') }}</text>
          </view>
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
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useStore } from 'vuex'
import TabBar from '@/components/TabBar.vue'
import { getUserProfile, saveUserProfile, clearUserProfile } from '@/utils/storage'
import { showToast, showModal, generateId, formatTimestamp } from '@/utils/helpers'
import { switchToTab, hideNativeTabBar } from '@/utils/tab-nav'
import { TOTAL_TOOL_COUNT } from '@/utils/tools-data'

const store = useStore()

// ====== 登录状态 ======
const user = ref(getUserProfile())
const isLoggedIn = computed(() => !!user.value)
const showLogin = ref(false)
const form = ref({ nickname: '', avatarPath: '' })

// ====== 使用统计 ======
const favoritesCount = computed(() => store.getters.favoritesCount)
const records = computed(() => store.state.records)
const recordsCount = computed(() => records.value.length)
const recentRecords = computed(() => records.value.slice(0, 5))
const showRecordsModal = ref(false)

/** 打开登录/编辑弹窗（编辑态回填已有资料） */
function openLogin() {
  form.value = {
    nickname: user.value?.nickname || '',
    avatarPath: user.value?.avatarPath || ''
  }
  showLogin.value = true
}

/** 关闭登录弹窗 */
function closeLogin() {
  showLogin.value = false
}

/** 点击用户卡片：打开登录/编辑弹窗 */
function handleUserCardTap() {
  openLogin()
}

/** 统计卡点击：收藏/使用/工具 */
function handleStatsTap(type) {
  if (type === 'favorites') {
    switchToTab('favorites')
    return
  }
  if (type === 'records') {
    store.dispatch('loadRecords')
    showRecordsModal.value = true
    return
  }
  if (type === 'tools') {
    switchToTab('tools')
  }
}

/** 关闭最近使用弹窗 */
function closeRecordsModal() {
  showRecordsModal.value = false
}

/** 选择微信头像（仅微信小程序） */
// #ifdef MP-WEIXIN
function onChooseAvatar(e) {
  const tempPath = e.detail.avatarUrl
  // chooseAvatar 返回临时路径，保存到本地文件避免被回收
  uni.saveFile({
    tempFilePath: tempPath,
    success: (res) => {
      form.value.avatarPath = res.savedFilePath
    },
    fail: () => {
      // saveFile 失败（配额/基库限制）回退临时路径，本次会话可用
      form.value.avatarPath = tempPath
    }
  })
}
// #endif

/** 确认登录/保存资料 */
function handleConfirm() {
  const nickname = (form.value.nickname || '').trim()
  if (!nickname) {
    showToast('请输入昵称')
    return
  }
  const profile = {
    id: generateId().slice(-8),
    nickname,
    avatarPath: form.value.avatarPath || '',
    loginTime: Date.now()
  }
  const isEdit = !!user.value
  saveUserProfile(profile)
  user.value = profile
  closeLogin()
  showToast(isEdit ? '已保存' : '登录成功')
}

/** 退出登录 */
function handleLogout() {
  showModal({
    title: '确认退出登录',
    content: '退出后本地登录信息将被清除'
  }).then((confirmed) => {
    if (!confirmed) return
    clearUserProfile()
    user.value = null
    showToast('已退出登录')
  })
}

/** 清除缓存：使用记录 + 搜索历史（保留收藏与登录信息） */
function handleClearCache() {
  showModal({
    title: '清除缓存',
    content: '将清除使用记录与搜索历史，收藏和登录信息不受影响'
  }).then((confirmed) => {
    if (!confirmed) return
    store.dispatch('clearRecords')
    store.dispatch('clearSearchHistory')
    showToast('已清除')
  })
}

/** 底部Tab切换 - 微信原生 tabBar 保活，H5 reLaunch */
function handleTabChange(key) {
  if (key === 'profile') return
  switchToTab(key)
}

onShow(() => {
  hideNativeTabBar()
  store.dispatch('loadRecords')
})

/** 关于我们 */
function handleAbout() {
  uni.navigateTo({ url: '/pages/about/index' })
}

/** 工具建议 */
function handleSuggestion() {
  uni.navigateTo({ url: '/pages/suggestion/index' })
}

/** API 设置 */
function handleApiSettings() {
  uni.navigateTo({ url: '/pages/settings/index' })
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
    padding: 48rpx 32rpx 40rpx;
    background: $card-bg;
    margin-bottom: 24rpx;
  }

  &__user-avatar {
    width: 140rpx;
    height: 140rpx;
    border-radius: 50%;
    background: $primary-bg;
    border: 6rpx solid #FFFFFF;
    box-shadow: $shadow-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 28rpx;
    overflow: hidden;
    flex-shrink: 0;
  }

  &__avatar-text {
    font-size: 60rpx;
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }

  &__user-info {
    flex: 1;
    min-width: 0;
  }

  &__user-name-row {
    display: flex;
    align-items: center;
    margin-bottom: 8rpx;
  }

  &__user-name {
    font-size: 40rpx;
    font-weight: 700;
    color: $text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  &__user-edit {
    font-size: $font-size-base;
    color: $text-light;
    margin-left: 14rpx;
    flex-shrink: 0;
  }

  &__user-id {
    display: inline-block;
    font-size: $font-size-xs;
    color: $text-secondary;
    background: $primary-bg;
    padding: 4rpx 16rpx;
    border-radius: $radius-round;
    margin-bottom: 8rpx;
  }

  &__user-time {
    display: block;
    font-size: $font-size-xs;
    color: $text-light;
  }

  &__user-arrow {
    font-size: 40rpx;
    color: $text-light;
    margin-left: 16rpx;
    flex-shrink: 0;
  }

  // 使用统计
  &__stats {
    display: flex;
    background: $card-bg;
    border-radius: $radius-md;
    box-shadow: $shadow-sm;
    margin: 0 24rpx 24rpx;
    padding: 28rpx 0;
  }

  &__stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;

    &:not(:last-child) {
      border-right: 1rpx solid $border-color;
    }

    &:active {
      opacity: 0.6;
    }
  }

  &__stat-value {
    font-size: 40rpx;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 8rpx;
  }

  &__stat-label {
    font-size: $font-size-sm;
    color: $text-secondary;
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

  // 退出登录
  &__logout {
    text-align: center;
    font-size: $font-size-base;
    color: $danger;
    padding: 24rpx;
    margin: 16rpx 24rpx 0;

    &:active {
      opacity: 0.6;
    }
  }

  // 底部标语
  &__footer {
    text-align: center;
    font-size: $font-size-sm;
    color: $text-light;
    margin-top: 32rpx;
  }

  // 底部占位
  &__bottom-placeholder {
    height: 140rpx;
  }

  // ====== 弹窗（登录 / 最近使用） ======
  &__popup {
    position: fixed;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 200;
  }

  &__popup-mask {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.45);
    animation: ppFade 0.2s ease-out;
  }

  &__popup-body {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background: $card-bg;
    border-radius: $radius-lg $radius-lg 0 0;
    padding: 32rpx 32rpx 60rpx;
    animation: ppSlideUp 0.25s ease-out;
  }

  &__popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;
  }

  &__popup-title {
    font-size: $font-size-md;
    font-weight: 600;
    color: $text-primary;
  }

  &__popup-close {
    font-size: $font-size-md;
    color: $text-light;
    padding: 8rpx;
  }

  &__avatar-btn {
    display: block;
    margin: 0 auto;
    padding: 0;
    line-height: normal;
    background: transparent;
    border-radius: 0;

    &::after {
      border: none;
    }
  }

  &__avatar-box {
    width: 140rpx;
    height: 140rpx;
    border-radius: $radius-round;
    background: $primary-bg;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    overflow: hidden;
  }

  &__avatar-hint {
    display: block;
    margin-top: 16rpx;
    font-size: $font-size-sm;
    color: $text-secondary;
    text-align: center;
  }

  &__field {
    display: flex;
    align-items: center;
    padding: 28rpx 8rpx;
    margin-top: 32rpx;
    border-bottom: 1rpx solid $border-color;
  }

  &__field-label {
    font-size: $font-size-base;
    color: $text-primary;
    margin-right: 24rpx;
  }

  &__field-input {
    flex: 1;
    font-size: $font-size-base;
    color: $text-primary;
  }

  &__placeholder {
    color: $text-light;
  }

  &__actions {
    display: flex;
    margin-top: 48rpx;
  }

  &__btn {
    flex: 1;
    padding: 24rpx 0;
    border-radius: $radius-md;
    font-size: $font-size-base;
    text-align: center;

    & + & {
      margin-left: 24rpx;
    }
  }

  &__btn--cancel {
    background: $primary-bg;
    color: $text-primary;
  }

  &__btn--confirm {
    background: $primary-color;
    color: $card-bg;
  }

  // ====== 最近使用列表 ======
  &__records-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60rpx 0 40rpx;
  }

  &__records-empty-icon {
    font-size: 72rpx;
    margin-bottom: 16rpx;
  }

  &__records-empty-text {
    font-size: $font-size-base;
    color: $text-secondary;
  }

  &__records-list {
    max-height: 50vh;
    overflow-y: auto;
  }

  &__record-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 26rpx 8rpx;
    border-bottom: 1rpx solid $border-color;

    &:last-child {
      border-bottom: none;
    }
  }

  &__record-name {
    font-size: $font-size-base;
    color: $text-primary;
  }

  &__record-time {
    font-size: $font-size-sm;
    color: $text-light;
  }
}

@keyframes ppSlideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
@keyframes ppFade {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
