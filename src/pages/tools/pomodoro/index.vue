/**
 * 番茄专注
 * 25分钟专注 + 5分钟休息的番茄钟
 * 圆形进度显示、开始/暂停/重置、轮次记录、可自定义时长
 */
<template>
  <view class="pomodoro">
    <!-- ====== 头部状态 ====== -->
    <view class="pomodoro__header">
      <text class="pomodoro__phase">{{ phaseLabel }}</text>
      <text class="pomodoro__count">第 <text class="pomodoro__count-num">{{ sessionCount }}</text> 个番茄</text>
    </view>

    <!-- ====== 圆形进度 ====== -->
    <view class="pomodoro__circle-wrap">
      <view class="pomodoro__circle">
        <svg viewBox="0 0 300 300" class="pomodoro__svg">
          <!-- 轨道圆 -->
          <circle
            cx="150" cy="150" r="130"
            fill="none"
            stroke="#E8E8ED"
            stroke-width="12"
          />
          <!-- 进度圆 -->
          <circle
            cx="150" cy="150" r="130"
            fill="none"
            :stroke="progressColor"
            stroke-width="12"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            transform="rotate(-90 150 150)"
            class="pomodoro__progress-ring"
          />
        </svg>
        <!-- 中央时间显示 -->
        <view class="pomodoro__center">
          <text class="pomodoro__time">{{ displayTime }}</text>
          <text class="pomodoro__phase-hint">{{ phaseHint }}</text>
        </view>
      </view>

      <!-- 装饰统计 -->
      <view class="pomodoro__stats">
        <view class="pomodoro__stat-item">
          <text class="pomodoro__stat-value">{{ completedSessions }}</text>
          <text class="pomodoro__stat-label">已完成</text>
        </view>
        <view class="pomodoro__stat-divider" />
        <view class="pomodoro__stat-item">
          <text class="pomodoro__stat-value">{{ focusMinutes }}</text>
          <text class="pomodoro__stat-label">专注分钟</text>
        </view>
        <view class="pomodoro__stat-divider" />
        <view class="pomodoro__stat-item">
          <text class="pomodoro__stat-value">{{ progressPercent }}%</text>
          <text class="pomodoro__stat-label">完成</text>
        </view>
      </view>
    </view>

    <!-- ====== 控制按钮 ====== -->
    <view class="pomodoro__controls">
      <view
        class="pomodoro__main-btn"
        :class="mainBtnClass"
        @tap="handleMainAction"
      >
        <text class="pomodoro__main-btn-icon">{{ mainBtnIcon }}</text>
        <text class="pomodoro__main-btn-text">{{ mainBtnLabel }}</text>
      </view>
      <view
        class="pomodoro__ctrl-btn pomodoro__ctrl-btn--reset"
        :class="{ 'pomodoro__ctrl-btn--disabled': status === 'idle' }"
        @tap="handleReset"
      >
        <text class="pomodoro__ctrl-icon">↺</text>
        <text class="pomodoro__ctrl-label">重置</text>
      </view>
    </view>

    <!-- ====== 时长选择 ====== -->
    <view class="pomodoro__settings">
      <view class="pomodoro__setting-section">
        <text class="pomodoro__setting-label">专注时长</text>
        <view class="pomodoro__duration-row">
          <view
            v-for="d in durationOptions"
            :key="d.value"
            class="pomodoro__duration-btn"
            :class="{ 'pomodoro__duration-btn--active': focusDuration === d.value }"
            @tap="setFocusDuration(d.value)"
          >
            <text>{{ d.label }}</text>
          </view>
        </view>
      </view>
      <view class="pomodoro__setting-section">
        <text class="pomodoro__setting-label">休息时长</text>
        <view class="pomodoro__duration-row">
          <view
            v-for="d in breakOptions"
            :key="d.value"
            class="pomodoro__duration-btn"
            :class="{ 'pomodoro__duration-btn--active': breakDuration === d.value }"
            @tap="setBreakDuration(d.value)"
          >
            <text>{{ d.label }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { onHide, onShow } from '@dcloudio/uni-app'

// ====== 常量 ======
const DURATION_OPTIONS = [
  { value: 15, label: '15分钟' },
  { value: 25, label: '25分钟' },
  { value: 30, label: '30分钟' }
]

const BREAK_OPTIONS = [
  { value: 3,  label: '3分钟' },
  { value: 5,  label: '5分钟' },
  { value: 10, label: '10分钟' }
]

const CIRCUMFERENCE = 2 * Math.PI * 130 // SVG circle r=130

// ====== 状态 ======
const status = ref('idle') // idle | running | paused | break | break-paused | completed
const focusDuration = ref(25)
const breakDuration = ref(5)
const sessionCount = ref(0)
const completedSessions = ref(0)
const focusMinutes = ref(0)

// 计时相关
const timeLeft = ref(0)      // 剩余秒数
const totalTime = ref(0)     // 当前阶段总秒数
let timer = null

// ====== 计算属性 ======

/** 阶段标签 */
const phaseLabel = computed(() => {
  switch (status.value) {
    case 'running':    return '🍅 专注中'
    case 'paused':     return '⏸ 已暂停'
    case 'break':      return '☕ 休息中'
    case 'break-paused': return '⏸ 休息暂停'
    case 'completed':  return '🎉 完成!'
    default:           return '🍅 准备开始'
  }
})

/** 阶段提示 */
const phaseHint = computed(() => {
  if (status.value === 'running') return '保持专注'
  if (status.value === 'paused') return '休息一下，随时继续'
  if (status.value === 'break') return '放松一下吧'
  if (status.value === 'break-paused') return '继续休息'
  if (status.value === 'completed') return '太棒了！'
  return '点击开始'
})

/** 进度圆环颜色 */
const progressColor = computed(() => {
  if (status.value === 'break' || status.value === 'break-paused') return '#34C759'
  if (status.value === 'completed') return '#FF9500'
  return '#FF6B6B'
})

/** 格式化显示时间 MM:SS */
const displayTime = computed(() => {
  const mins = Math.floor(timeLeft.value / 60)
  const secs = timeLeft.value % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

/** 进度百分比 */
const progressPercent = computed(() => {
  if (totalTime.value === 0) return 0
  const elapsed = totalTime.value - timeLeft.value
  return Math.round((elapsed / totalTime.value) * 100)
})

/** SVG 圆环偏移量 */
const dashOffset = computed(() => {
  if (totalTime.value === 0) return 0
  const progress = 1 - (timeLeft.value / totalTime.value)
  return CIRCUMFERENCE * progress
})

const circumference = CIRCUMFERENCE

/** 主按钮图标 */
const mainBtnIcon = computed(() => {
  switch (status.value) {
    case 'running': return '⏸'
    case 'paused': return '▶'
    case 'break': return '⏸'
    case 'break-paused': return '▶'
    case 'completed': return '↻'
    default: return '▶'
  }
})

/** 主按钮标签 */
const mainBtnLabel = computed(() => {
  switch (status.value) {
    case 'running': return '暂停'
    case 'paused': return '继续'
    case 'break': return '暂停'
    case 'break-paused': return '继续'
    case 'completed': return '再来一轮'
    default: return '开始专注'
  }
})

/** 主按钮样式类 */
const mainBtnClass = computed(() => {
  if (status.value === 'running' || status.value === 'break') return 'pomodoro__main-btn--active'
  if (status.value === 'completed') return 'pomodoro__main-btn--complete'
  return ''
})

/** 时长选项 */
const durationOptions = DURATION_OPTIONS
const breakOptions = BREAK_OPTIONS

// ====== 方法 ======

/** 设置专注时长（仅空闲状态可改） */
function setFocusDuration(val) {
  if (status.value !== 'idle') return
  focusDuration.value = val
  resetTimer()
}

/** 设置休息时长 */
function setBreakDuration(val) {
  if (status.value !== 'idle') return
  breakDuration.value = val
}

/** 主按钮操作 */
function handleMainAction() {
  switch (status.value) {
    case 'idle':
      startFocus()
      break
    case 'running':
      pauseFocus()
      break
    case 'paused':
      resumeFocus()
      break
    case 'break':
      pauseBreak()
      break
    case 'break-paused':
      resumeBreak()
      break
    case 'completed':
      resetTimer()
      status.value = 'idle'
      break
  }
}

/** 开始专注 */
function startFocus() {
  status.value = 'running'
  sessionCount.value++
  totalTime.value = focusDuration.value * 60
  timeLeft.value = totalTime.value
  startTimer()
}

/** 暂停专注 */
function pauseFocus() {
  status.value = 'paused'
  stopTimer()
}

/** 继续专注 */
function resumeFocus() {
  status.value = 'running'
  startTimer()
}

/** 暂停休息 */
function pauseBreak() {
  status.value = 'break-paused'
  stopTimer()
}

/** 继续休息 */
function resumeBreak() {
  status.value = 'break'
  startTimer()
}

/** 开始休息 */
function startBreak() {
  status.value = 'break'
  totalTime.value = breakDuration.value * 60
  timeLeft.value = totalTime.value
  startTimer()
  uni.showToast({ title: '专注完成，休息一下吧！', icon: 'none', duration: 2000 })
}

/** 重置 */
function handleReset() {
  if (status.value === 'idle') return
  stopTimer()
  resetTimer()
  status.value = 'idle'
  uni.showToast({ title: '已重置', icon: 'none' })
}

/** 重置计时数值 */
function resetTimer() {
  timeLeft.value = focusDuration.value * 60
  totalTime.value = focusDuration.value * 60
}

/** 启动计时器（每秒更新） */
function startTimer() {
  stopTimer()
  timer = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    }

    // 时间到
    if (timeLeft.value === 0) {
      handleTimeUp()
    }
  }, 1000)
}

/** 停止计时器 */
function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

/** 时间到处理 */
function handleTimeUp() {
  stopTimer()

  if (status.value === 'running' || status.value === 'paused') {
    // 专注结束，记录
    completedSessions.value++
    focusMinutes.value += focusDuration.value
    // 开始休息或标记完成
    if (sessionCount.value >= 1) {
      startBreak()
    }
  } else if (status.value === 'break' || status.value === 'break-paused') {
    // 休息结束
    status.value = 'completed'
    timeLeft.value = 0
    totalTime.value = breakDuration.value * 60
    uni.showToast({ title: '休息结束，继续加油！', icon: 'none', duration: 2000 })
    // 自动震动反馈
    uni.vibrateShort && uni.vibrateShort({ type: 'medium' })
  }
}

// 页面卸载时清理
onUnmounted(() => {
  stopTimer()
})

// 页面隐藏时暂停计时
onHide(() => {
  stopTimer()
})

// 页面显示时恢复计时
onShow(() => {
  if (status.value === 'running' || status.value === 'break') {
    startTimer()
  }
})

// 监听状态变化提供震动反馈
watch(status, (newVal) => {
  if (newVal === 'running') {
    uni.vibrateShort && uni.vibrateShort({ type: 'light' })
  }
})
</script>

<style lang="scss" scoped>
.pomodoro {
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
  background: linear-gradient(180deg, #FFF5F5 0%, #F5F5F7 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 60rpx;

  // ====== 头部 ======
  &__header {
    padding: 48rpx 32rpx 20rpx;
    text-align: center;
  }
  &__phase {
    font-size: 40rpx;
    font-weight: 700;
    color: #1D1D1F;
  }
  &__count {
    display: block;
    font-size: 26rpx;
    color: #8E8E93;
    margin-top: 8rpx;
  }
  &__count-num {
    color: #FF6B6B;
    font-weight: 700;
    font-size: 32rpx;
  }

  // ====== 圆形进度 ======
  &__circle-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding: 0 32rpx;
  }
  &__circle {
    position: relative;
    width: 480rpx;
    height: 480rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__svg {
    width: 100%;
    height: 100%;
  }
  &__progress-ring {
    transition: stroke-dashoffset 0.5s ease, stroke 0.3s ease;
  }

  &__center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
  }
  &__time {
    font-size: 88rpx;
    font-weight: 700;
    color: #1D1D1F;
    font-family: 'Courier New', monospace;
    letter-spacing: 6rpx;
    line-height: 1;
  }
  &__phase-hint {
    font-size: 26rpx;
    color: #8E8E93;
  }

  // ====== 统计面板 ======
  &__stats {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    background: #fff;
    border-radius: 20rpx;
    padding: 20rpx 24rpx;
    margin-top: 16rpx;
    width: 100%;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  }
  &__stat-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rpx;
  }
  &__stat-value {
    font-size: 36rpx;
    font-weight: 700;
    color: #1D1D1F;
    font-family: 'Courier New', monospace;
  }
  &__stat-label {
    font-size: 22rpx;
    color: #8E8E93;
  }
  &__stat-divider {
    width: 2rpx;
    height: 40rpx;
    background: #E8E8ED;
  }

  // ====== 控制按钮 ======
  &__controls {
    display: flex;
    align-items: center;
    gap: 24rpx;
    margin-top: 40rpx;
    padding: 0 32rpx;
    width: 100%;
    justify-content: center;
  }

  &__main-btn {
    width: 240rpx;
    height: 240rpx;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    background: #fff;
    box-shadow: 0 8rpx 32rpx rgba(255, 107, 107, 0.2);
    border: 4rpx solid #FF6B6B;
    transition: all 0.3s;

    &:active {
      transform: scale(0.95);
    }

    &--active {
      background: #FF6B6B;
      .pomodoro__main-btn-icon { color: #fff; }
      .pomodoro__main-btn-text { color: rgba(255,255,255,0.9); }
    }

    &--complete {
      background: #FF9500;
      border-color: #FF9500;
      box-shadow: 0 8rpx 32rpx rgba(255, 149, 0, 0.2);
      .pomodoro__main-btn-icon { color: #fff; }
      .pomodoro__main-btn-text { color: rgba(255,255,255,0.9); }
    }
  }
  &__main-btn-icon {
    font-size: 56rpx;
    color: #FF6B6B;
  }
  &__main-btn-text {
    font-size: 26rpx;
    color: #FF6B6B;
    font-weight: 600;
  }

  &__ctrl-btn {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4rpx;
    background: #fff;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
    border: 2rpx solid #E8E8ED;

    &:active:not(&--disabled) {
      transform: scale(0.92);
    }
    &--disabled {
      opacity: 0.4;
    }
  }
  &__ctrl-icon {
    font-size: 36rpx;
    color: #1D1D1F;
  }
  &__ctrl-label {
    font-size: 20rpx;
    color: #8E8E93;
  }

  // ====== 时长设置 ======
  &__settings {
    width: 100%;
    padding: 0 32rpx;
    margin-top: 36rpx;
  }
  &__setting-section {
    margin-bottom: 20rpx;
    background: #fff;
    border-radius: 20rpx;
    padding: 24rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  }
  &__setting-label {
    display: block;
    font-size: 24rpx;
    color: #8E8E93;
    margin-bottom: 16rpx;
    font-weight: 500;
  }
  &__duration-row {
    display: flex;
    gap: 12rpx;
  }
  &__duration-btn {
    flex: 1;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F5F5F7;
    border-radius: 12rpx;
    font-size: 26rpx;
    color: #3A3A3C;
    transition: all 0.2s;

    &:active {
      transform: scale(0.95);
    }

    &--active {
      background: #1D1D1F;
      color: #fff;
      font-weight: 600;
    }
  }
}
</style>
