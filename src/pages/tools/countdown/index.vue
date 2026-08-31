/**
 * 节日倒计时
 * 预设中国节日列表 + 自定义日期倒计时
 * 显示剩余天数、日期、自动排序、天数高亮
 */
<template>
  <view class="countdown">
    <!-- ====== 头部 ====== -->
    <view class="countdown__header">
      <text class="countdown__title">🎉 节日倒计时</text>
      <text class="countdown__subtitle">离重要日子还有多远？</text>
    </view>

    <!-- ====== 排序控制 ====== -->
    <view class="countdown__bar">
      <text class="countdown__bar-title">
        共 <text class="countdown__bar-num">{{ sortedFestivals.length }}</text> 个节日
      </text>
      <view class="countdown__legend">
        <view class="countdown__legend-item">
          <view class="countdown__legend-dot countdown__legend-dot--urgent" />
          <text class="countdown__legend-text">7天内</text>
        </view>
        <view class="countdown__legend-item">
          <view class="countdown__legend-dot countdown__legend-dot--soon" />
          <text class="countdown__legend-text">30天内</text>
        </view>
      </view>
    </view>

    <!-- ====== 节日列表 ====== -->
    <scroll-view
      class="countdown__list"
      scroll-y
      show-scrollbar
    >
      <view
        v-for="(f, i) in sortedFestivals"
        :key="f.id"
        class="countdown__card"
        :class="urgencyClass(f.days)"
        :style="{ animationDelay: f.animDelay }"
      >
        <view class="countdown__card-left">
          <text class="countdown__card-emoji">{{ f.emoji }}</text>
          <view class="countdown__card-info">
            <text class="countdown__card-name">{{ f.name }}</text>
            <text class="countdown__card-date">
              {{ f.month }}月{{ f.day }}日
              <text v-if="f.lunar" class="countdown__card-lunar">（{{ f.lunar }}）</text>
            </text>
          </view>
        </view>
        <view class="countdown__card-right" :class="urgencyClass(f.days)">
          <text class="countdown__card-days">
            <text class="countdown__card-number">{{ f.days }}</text>
            <text class="countdown__card-unit">天</text>
          </text>
          <text class="countdown__card-label">{{ daysLabel(f.days) }}</text>
        </view>
      </view>

      <!-- ====== 自定义倒计时 ====== -->
      <view class="countdown__divider">
        <text class="countdown__divider-line" />
        <text class="countdown__divider-text">自定义倒计时</text>
        <text class="countdown__divider-line" />
      </view>

      <!-- 添加自定义日期 -->
      <view class="countdown__custom-form">
        <view class="countdown__custom-input-row">
          <input
            class="countdown__custom-input"
            v-model="customName"
            placeholder="输入事件名称"
            maxlength="30"
            confirm-type="done"
            @confirm="addCustomDate"
          />
        </view>
        <view class="countdown__custom-input-row">
          <picker
            mode="date"
            :value="customDate"
            :start="todayStr"
            @change="onDateChange"
          >
            <view class="countdown__date-picker">
              <text class="countdown__date-picker-icon">📅</text>
              <text class="countdown__date-picker-text">{{ customDate || '选择日期' }}</text>
              <text class="countdown__date-picker-arrow">▾</text>
            </view>
          </picker>
          <view
            class="countdown__add-btn"
            :class="{ 'countdown__add-btn--disabled': !canAdd }"
            @tap="addCustomDate"
          >
            <text>添加</text>
          </view>
        </view>
      </view>

      <!-- 自定义日期列表 -->
      <view v-if="customDates.length === 0" class="countdown__empty-custom">
        <text class="countdown__empty-text">暂无自定义倒计时，添加一个吧</text>
      </view>
      <view
        v-for="(cd, i) in customDates"
        :key="cd.id"
        class="countdown__card countdown__card--custom"
        :class="urgencyClass(cd.days)"
        :style="{ animationDelay: (sortedFestivals.length * 0.05 + (i + 1) * 0.05) + 's' }"
      >
        <view class="countdown__card-left">
          <text class="countdown__card-emoji">📌</text>
          <view class="countdown__card-info">
            <text class="countdown__card-name">{{ cd.name }}</text>
            <text class="countdown__card-date">{{ cd.month }}月{{ cd.day }}日</text>
          </view>
        </view>
        <view class="countdown__card-right" :class="urgencyClass(cd.days)">
          <text class="countdown__card-days">
            <text class="countdown__card-number">{{ cd.days }}</text>
            <text class="countdown__card-unit">天</text>
          </text>
          <text class="countdown__card-label">{{ daysLabel(cd.days) }}</text>
        </view>
        <view class="countdown__card-delete" @tap="removeCustomDate(cd.id)">
          <text>✕</text>
        </view>
      </view>

      <view class="countdown__spacer" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// ====== 定义中国节日列表 ======
const festivalsData = [
  { id: 'new-year',     name: '元旦',     emoji: '🎉', month: 1,  day: 1 },
  { id: 'spring-fest',  name: '春节',     emoji: '🧧', month: 2,  day: 17, lunar: '正月初一' },
  { id: 'lantern',      name: '元宵节',   emoji: '🏮', month: 3,  day: 4,  lunar: '正月十五' },
  { id: 'qingming',     name: '清明节',   emoji: '🌿', month: 4,  day: 5 },
  { id: 'labor',        name: '劳动节',   emoji: '💪', month: 5,  day: 1 },
  { id: 'dragon-boat',  name: '端午节',   emoji: '🐉', month: 6,  day: 19, lunar: '五月初五' },
  { id: 'qixi',         name: '七夕节',   emoji: '💕', month: 8,  day: 19, lunar: '七月初七' },
  { id: 'mid-autumn',   name: '中秋节',   emoji: '🌙', month: 9,  day: 27, lunar: '八月十五' },
  { id: 'national-day', name: '国庆节',   emoji: '🇨🇳', month: 10, day: 1 },
  { id: 'double-ninth', name: '重阳节',   emoji: '🌸', month: 10, day: 21, lunar: '九月初九' },
  { id: 'laba',         name: '腊八节',   emoji: '🥣', month: 1,  day: 6,  lunar: '腊月初八' },
  { id: 'new-year-eve', name: '除夕',     emoji: '🎆', month: 2,  day: 16, lunar: '腊月廿九' },
]

const STORAGE_KEY = 'lifetool_custom_dates'

// ====== 状态 ======
const customName = ref('')
const customDate = ref('')
const customDates = ref([])

// ====== 计算属性 ======

/** 今日日期字符串 YYYY-MM-DD */
const todayStr = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

/** 是否可以添加自定义日期 */
const canAdd = computed(() => {
  return customName.value.trim() && customDate.value
})

/** 计算节日剩余天数并排序 */
const sortedFestivals = computed(() => {
  const now = new Date()
  return festivalsData
    .map(f => {
      const days = getDaysRemaining(f.month, f.day)
      return { ...f, days }
    })
    .sort((a, b) => a.days - b.days)
    .map((f, i) => ({ ...f, animDelay: i * 0.05 + 's' }))
})

// ====== 工具函数 ======

/** 计算某月某日距离今天还有多少天 */
function getDaysRemaining(month, day) {
  const now = new Date()
  const target = new Date(now.getFullYear(), month - 1, day)

  // 如果今年的日期已过，推到明年
  if (target < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    target.setFullYear(target.getFullYear() + 1)
  }

  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/** 获取紧急程度样式类 */
function urgencyClass(days) {
  if (days <= 7) return 'countdown__urgency--urgent'
  if (days <= 30) return 'countdown__urgency--soon'
  return ''
}

/** 剩余天数描述文字 */
function daysLabel(days) {
  if (days <= 0) return '就是今天！'
  if (days === 1) return '明天就到了'
  if (days <= 7) return '即将到来'
  if (days <= 30) return '还有不到一个月'
  if (days <= 90) return '还有三个月'
  if (days <= 180) return '还有半年'
  return '还有很久'
}

// ====== 自定义日期方法 ======

/** 日期选择变化 */
function onDateChange(e) {
  customDate.value = e.detail.value
}

/** 添加自定义日期 */
function addCustomDate() {
  if (!canAdd.value) return

  const parts = customDate.value.split('-')
  const year = parseInt(parts[0])
  const month = parseInt(parts[1])
  const day = parseInt(parts[2])

  const now = new Date()
  const target = new Date(year, month - 1, day)

  // 只允许未来日期
  if (target <= now) {
    uni.showToast({ title: '请选择未来的日期', icon: 'none' })
    return
  }

  const diff = target.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  const newItem = {
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: customName.value.trim(),
    year,
    month,
    day,
    days
  }

  customDates.value.push(newItem)
  saveCustomDates()
  customName.value = ''
  customDate.value = ''

  uni.showToast({ title: '已添加', icon: 'success' })
}

/** 删除自定义日期 */
function removeCustomDate(id) {
  customDates.value = customDates.value.filter(d => d.id !== id)
  saveCustomDates()
}

/** 保存自定义日期到本地存储 */
function saveCustomDates() {
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(customDates.value))
  } catch (e) {
    console.error('保存自定义日期失败', e)
  }
}

/** 加载自定义日期 */
function loadCustomDates() {
  try {
    const data = uni.getStorageSync(STORAGE_KEY)
    if (data) {
      const list = JSON.parse(data)
      // 重新计算天数并过滤掉已过期的
      const now = new Date()
      customDates.value = list
        .map(d => {
          const target = new Date(d.year, d.month - 1, d.day)
          const diff = target.getTime() - now.getTime()
          const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
          return { ...d, days }
        })
        .filter(d => d.days > 0)
        .sort((a, b) => a.days - b.days)
    }
  } catch (e) {
    console.error('加载自定义日期失败', e)
  }
}

// 初始化加载
onMounted(() => {
  loadCustomDates()
})
</script>

<style lang="scss" scoped>
.countdown {
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
  background: #F5F5F7;
  display: flex;
  flex-direction: column;

  // ====== 头部 ======
  &__header {
    padding: 40rpx 32rpx 20rpx;
    background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
    color: #fff;
  }
  &__title {
    font-size: 40rpx;
    font-weight: 700;
    letter-spacing: 2rpx;
  }
  &__subtitle {
    display: block;
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 12rpx;
  }

  // ====== 信息栏 ======
  &__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16rpx 32rpx;
    background: #fff;
    border-bottom: 2rpx solid #F0F0F0;
  }
  &__bar-title {
    font-size: 24rpx;
    color: #8E8E93;
  }
  &__bar-num {
    color: #1D1D1F;
    font-weight: 600;
  }
  &__legend {
    display: flex;
    gap: 16rpx;
  }
  &__legend-item {
    display: flex;
    align-items: center;
    gap: 6rpx;
  }
  &__legend-dot {
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;

    &--urgent { background: #FF3B30; }
    &--soon { background: #FF9500; }
  }
  &__legend-text {
    font-size: 22rpx;
    color: #8E8E93;
  }

  // ====== 节日列表 ======
  &__list {
    flex: 1;
    padding: 20rpx 24rpx;
  }

  // ====== 节日卡片 ======
  &__card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    border-radius: 20rpx;
    padding: 24rpx 28rpx;
    margin-bottom: 16rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
    position: relative;
    animation: fadeInUp 0.4s ease both;
    border-left: 6rpx solid transparent;
    transition: all 0.2s;

    &:active {
      transform: scale(0.98);
    }
  }

  &__card-left {
    display: flex;
    align-items: center;
    gap: 16rpx;
    flex: 1;
    min-width: 0;
  }
  &__card-emoji {
    font-size: 44rpx;
    flex-shrink: 0;
  }
  &__card-info {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
    min-width: 0;
  }
  &__card-name {
    font-size: 30rpx;
    font-weight: 600;
    color: #1D1D1F;
  }
  &__card-date {
    font-size: 22rpx;
    color: #8E8E93;
  }
  &__card-lunar {
    color: #AEAEB2;
    font-size: 20rpx;
  }

  &__card-right {
    text-align: right;
    flex-shrink: 0;
    padding-left: 16rpx;
  }
  &__card-days {
    display: flex;
    align-items: baseline;
    gap: 4rpx;
  }
  &__card-number {
    font-size: 44rpx;
    font-weight: 700;
    font-family: 'Courier New', monospace;
    line-height: 1;
  }
  &__card-unit {
    font-size: 24rpx;
    color: #8E8E93;
  }
  &__card-label {
    display: block;
    font-size: 20rpx;
    margin-top: 4rpx;
  }

  // ====== 紧急程度 ======
  &__urgency {
    // 默认（30天以上）
    & &__card-number { color: #1D1D1F; }
    & &__card-label { color: #8E8E93; }
    border-left-color: transparent;

    // 7-30天
    &--soon {
      border-left-color: #FF9500;
      .countdown__card-number { color: #FF9500; }
      .countdown__card-label { color: #FF9500; }
    }

    // 7天内
    &--urgent {
      border-left-color: #FF3B30;
      .countdown__card-number {
        color: #FF3B30;
        animation: pulse 1s ease infinite;
      }
      .countdown__card-label { color: #FF3B30; font-weight: 500; }
    }
  }

  // ====== 自定义卡片 ======
  &__card--custom {
    padding-right: 72rpx;
    border-left-color: #5AC8FA;
    .countdown__card-number { color: #5AC8FA; }
  }
  &__card-delete {
    position: absolute;
    right: 16rpx;
    top: 50%;
    transform: translateY(-50%);
    width: 44rpx;
    height: 44rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F5F5F7;
    border-radius: 50%;

    text {
      font-size: 22rpx;
      color: #8E8E93;
    }
    &:active {
      background: #E5E5EA;
    }
  }

  // ====== 分割线 ======
  &__divider {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin: 32rpx 0 24rpx;
  }
  &__divider-line {
    flex: 1;
    height: 2rpx;
    background: #E5E5EA;
  }
  &__divider-text {
    font-size: 24rpx;
    color: #8E8E93;
    white-space: nowrap;
  }

  // ====== 自定义表单 ======
  &__custom-form {
    background: #fff;
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  }
  &__custom-input-row {
    display: flex;
    gap: 16rpx;
    margin-bottom: 16rpx;

    &:last-child {
      margin-bottom: 0;
    }
  }
  &__custom-input {
    flex: 1;
    height: 72rpx;
    background: #F5F5F7;
    border-radius: 12rpx;
    padding: 0 20rpx;
    font-size: 26rpx;
    color: #1D1D1F;
  }
  &__date-picker {
    flex: 1;
    height: 72rpx;
    background: #F5F5F7;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 0 20rpx;
  }
  &__date-picker-icon {
    font-size: 28rpx;
  }
  &__date-picker-text {
    flex: 1;
    font-size: 26rpx;
    color: #1D1D1F;
  }
  &__date-picker-arrow {
    font-size: 22rpx;
    color: #8E8E93;
  }

  &__add-btn {
    width: 140rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1D1D1F;
    border-radius: 12rpx;
    font-size: 26rpx;
    font-weight: 600;
    color: #fff;
    flex-shrink: 0;

    &:active:not(&--disabled) { opacity: 0.8; }
    &--disabled {
      background: #E5E5EA;
      color: #AEAEB2;
    }
  }

  // ====== 空状态 ======
  &__empty-custom {
    padding: 40rpx;
    text-align: center;
  }
  &__empty-text {
    font-size: 24rpx;
    color: #AEAEB2;
  }

  // ====== 底部间距 ======
  &__spacer {
    height: 40rpx;
  }
}

// ====== 动画 ======
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}
</style>
