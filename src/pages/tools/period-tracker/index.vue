<template>
  <view class="page">
    <view class="card">
      <view class="row">
        <text class="label">上次开始日期</text>
        <picker mode="date" :value="lastStart" :end="today" @change="onLastStart">
          <view class="picker-val">{{ lastStart || '请选择' }}</view>
        </picker>
      </view>
      <view class="row">
        <text class="label">周期天数</text>
        <view class="length-ctrl">
          <view class="step-btn" @tap="cycle = Math.max(21, cycle - 1)">−</view>
          <text class="length-val">{{ cycle }}</text>
          <view class="step-btn" @tap="cycle = Math.min(45, cycle + 1)">+</view>
        </view>
      </view>
      <view class="row">
        <text class="label">经期天数</text>
        <view class="length-ctrl">
          <view class="step-btn" @tap="period = Math.max(3, period - 1)">−</view>
          <text class="length-val">{{ period }}</text>
          <view class="step-btn" @tap="period = Math.min(10, period + 1)">+</view>
        </view>
      </view>
    </view>

    <view v-if="prediction" class="card">
      <view class="prediction-item">
        <text class="prediction-label">下次经期</text>
        <text class="prediction-val">{{ formatDate(prediction.nextPeriod) }}</text>
      </view>
      <view class="prediction-item">
        <text class="prediction-label">剩余天数</text>
        <text class="prediction-val highlight">{{ prediction.daysLeft }} 天</text>
      </view>
      <view class="prediction-item">
        <text class="prediction-label">排卵日</text>
        <text class="prediction-val">{{ formatDate(prediction.ovulation) }}</text>
      </view>
      <view class="prediction-item">
        <text class="prediction-label">排卵期</text>
        <text class="prediction-val">{{ formatDate(prediction.ovulationWindow.start) }} ~ {{ formatDate(prediction.ovulationWindow.end) }}</text>
      </view>
      <view class="prediction-item">
        <text class="prediction-label">安全期</text>
        <text class="prediction-val">{{ formatDate(prediction.safeStart) }} ~ {{ formatDate(prediction.safeEnd) }}</text>
      </view>
    </view>

    <view class="card">
      <text class="tip">提示：以上预测仅供参考，不构成医疗建议。周期可能因个人情况波动。</text>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'

const STORAGE_KEY = 'lifetool_period'
const today = new Date().toISOString().slice(0, 10)
const lastStart = ref('')
const cycle = ref(28)
const period = ref(5)
const prediction = ref(null)

// 读取本地记录
try {
  const saved = JSON.parse(uni.getStorageSync(STORAGE_KEY) || 'null')
  if (saved) {
    lastStart.value = saved.lastStart || ''
    cycle.value = saved.cycle || 28
    period.value = saved.period || 5
  }
} catch (e) {}

// 页面加载时若有本地记录立即计算预测
calculate()

watch([lastStart, cycle, period], (val) => {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify({
    lastStart: val[0], cycle: val[1], period: val[2]
  }))
  calculate()
}, { deep: true })

function onLastStart(e) {
  lastStart.value = e.detail.value
}

function formatDate(d) {
  if (!d) return '--'
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function addDays(d, n) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function calculate() {
  if (!lastStart.value) { prediction.value = null; return }
  const start = new Date(lastStart.value)
  const nextPeriod = addDays(start, cycle.value)
  const ovulation = addDays(nextPeriod, -14)
  const ovulationStart = addDays(ovulation, -3)
  const ovulationEnd = addDays(ovulation, 3)
  const safeStart = addDays(start, period.value)
  let safeEnd = addDays(ovulationStart, -1)
  // 经期与排卵期重叠时前段安全区为空，钳制避免反向区间
  if (safeEnd < safeStart) safeEnd = safeStart
  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)
  const daysLeft = Math.round((nextPeriod - todayDate) / 86400000)

  prediction.value = {
    nextPeriod,
    ovulation,
    ovulationWindow: { start: ovulationStart, end: ovulationEnd },
    safeStart,
    safeEnd,
    daysLeft: Math.max(0, daysLeft)
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #F5F5F7;
  padding: 24rpx;
}
.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  margin-bottom: 24rpx;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
  &:not(:last-child) { border-bottom: 1rpx solid #F5F5F7; }
}
.label { font-size: 28rpx; color: #1D1D1F; }
.picker-val {
  background: #F5F5F7;
  border-radius: 12rpx;
  padding: 10rpx 24rpx;
  font-size: 28rpx;
  color: #1D1D1F;
  min-width: 200rpx;
  text-align: center;
}
.length-ctrl {
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.step-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F5F7;
  border-radius: 12rpx;
  font-size: 36rpx;
  color: #1D1D1F;
  &:active { opacity: 0.7; }
}
.length-val {
  font-size: 36rpx;
  font-weight: 600;
  font-family: monospace;
  min-width: 56rpx;
  text-align: center;
}
.prediction-item {
  display: flex;
  justify-content: space-between;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #F5F5F7;
  &:last-child { border-bottom: none; }
}
.prediction-label { font-size: 26rpx; color: #86868B; }
.prediction-val { font-size: 28rpx; color: #1D1D1F; font-weight: 500; }
.highlight { color: #FF3B30; font-weight: 600; }
.tip {
  font-size: 22rpx;
  color: #C7C7CC;
  line-height: 1.6;
}
</style>
