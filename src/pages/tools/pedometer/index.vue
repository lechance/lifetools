<template>
  <view class="page">
    <view class="card display-card">
      <text class="step-value">{{ steps }}</text>
      <text class="step-unit">步</text>
      <view class="step-stats">
        <view class="stat">
          <text class="stat-num">{{ (steps * 0.0007).toFixed(2) }}</text>
          <text class="stat-label">公里</text>
        </view>
        <view class="stat">
          <text class="stat-num">{{ (steps * 0.04).toFixed(1) }}</text>
          <text class="stat-label">千卡</text>
        </view>
        <view class="stat">
          <text class="stat-num">{{ steps === 0 ? '--' : ((steps / 10000) * 100).toFixed(0) + '%' }}</text>
          <text class="stat-label">日目标</text>
        </view>
      </view>

      <view class="sensor-status" :class="{ 'sensor-status--on': sensorOn }">
        {{ sensorOn ? '● 传感器运行中' : '○ 传感器未启动' }}
      </view>

      <view class="start-btn" :class="{ 'start-btn--stop': sensorOn }" @tap="toggleSensor">
        {{ sensorOn ? '停止计步' : '开始计步' }}
      </view>
      <view class="reset-btn" @tap="resetSteps">清零</view>
    </view>

    <view class="card">
      <view class="calib-row">
        <text class="calib-label">灵敏度（阈值）</text>
        <slider :value="threshold" min="10" max="25" step="1" @change="onThreshold" activeColor="#1D1D1F" backgroundColor="#E5E5EA" block-size="16" />
        <text class="calib-val">{{ threshold }}</text>
      </view>
      <text class="tip">阈值越低越灵敏。步行时加速度峰值约 12-18，跑步更高。若频繁误计请调高。</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { showToast } from '@/utils/helpers'

const steps = ref(0)
const sensorOn = ref(false)
const threshold = ref(12)
let cooldown = false

function toggleSensor() {
  if (sensorOn.value) {
    stopSensor()
  } else {
    startSensor()
  }
}

function startSensor() {
  uni.startAccelerometer({
    interval: 'game',
    success: () => {
      sensorOn.value = true
      uni.onAccelerometerChange(onAccelerate)
    },
    fail: () => showToast('无法启动加速度传感器')
  })
}

function stopSensor() {
  uni.offAccelerometerChange(onAccelerate)
  uni.stopAccelerometer({
    success: () => { sensorOn.value = false },
    fail: () => { sensorOn.value = false }
  })
}

let cooldownTimer = null

function onAccelerate(res) {
  if (!res || res.x === undefined) return
  const magnitude = Math.sqrt(res.x * res.x + res.y * res.y + res.z * res.z)
  if (magnitude > threshold.value && !cooldown) {
    steps.value++
    cooldown = true
    cooldownTimer = setTimeout(() => { cooldown = false }, 260)
  }
}

function onThreshold(e) {
  threshold.value = e.detail.value
}

function resetSteps() {
  steps.value = 0
}

onUnmounted(() => {
  if (cooldownTimer) clearTimeout(cooldownTimer)
  uni.offAccelerometerChange(onAccelerate)
  uni.stopAccelerometer()
})
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
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
.display-card { text-align: center; }
.step-value {
  font-size: 120rpx;
  font-weight: 700;
  font-family: monospace;
  color: #1D1D1F;
}
.step-unit { font-size: 40rpx; color: #86868B; }
.step-stats {
  display: flex;
  padding: 24rpx 0;
}
.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.stat-num {
  font-size: 36rpx;
  font-weight: 600;
  font-family: monospace;
  color: #007AFF;
}
.stat-label { font-size: 22rpx; color: #C7C7CC; }
.sensor-status {
  font-size: 24rpx;
  color: #C7C7CC;
  padding: 8rpx 0;
  &--on { color: #34C759; }
}
.start-btn {
  background: #1D1D1F;
  color: #fff;
  padding: 24rpx 0;
  border-radius: 40rpx;
  font-size: 32rpx;
  font-weight: 600;
  &:active { opacity: 0.8; }
  &--stop { background: #FF3B30; }
}
.reset-btn {
  padding: 16rpx 0;
  font-size: 26rpx;
  color: #86868B;
  &:active { opacity: 0.6; }
}
.calib-label { font-size: 26rpx; color: #86868B; }
.calib-val {
  display: block;
  font-size: 26rpx;
  color: #1D1D1F;
  font-weight: 600;
  text-align: right;
}
.tip {
  display: block;
  font-size: 22rpx;
  color: #C7C7CC;
  line-height: 1.6;
  margin-top: 8rpx;
}
</style>
