<template>
  <view class="page">
    <view class="card display-card">
      <text class="time-display">{{ displayTime }}</text>
      <view class="controls">
        <view class="ctrl-btn" :class="{ 'ctrl-btn--start': !running, 'ctrl-btn--pause': running }" @tap="toggle">
          {{ running ? '暂停' : '开始' }}
        </view>
        <view class="ctrl-btn ctrl-btn--reset" @tap="reset">重置</view>
      </view>
    </view>

    <view v-if="laps.length" class="card">
      <view class="laps-header">
        <text class="laps-title">计次</text>
        <text class="laps-clear" @tap="laps = []">清空</text>
      </view>
      <view v-for="(lap, i) in laps" :key="i" class="lap-item">
        <text class="lap-index">#{{ laps.length - i }}</text>
        <text class="lap-time">{{ lap }}</text>
      </view>
    </view>

    <view v-if="running" class="card">
      <view class="lap-btn" @tap="addLap">计次</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { onHide } from '@dcloudio/uni-app'

const elapsed = ref(0)  // 毫秒
const running = ref(false)
const laps = ref([])
let raf = null
let lastLap = 0
let lastTick = 0

const displayTime = computed(() => formatTime(elapsed.value))

function formatTime(ms) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const cs = Math.floor((ms % 1000) / 10)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(cs)}`
}

function tick(ts) {
  if (!running.value) return
  raf = requestAnimationFrame(tick)
  if (ts - lastTick < 100) return // ~10fps for centisecond display
  lastTick = ts
  elapsed.value += 100
}

function toggle() {
  if (running.value) {
    cancelAnimationFrame(raf)
    raf = null
  } else {
    lastLap = elapsed.value
    lastTick = 0
    raf = requestAnimationFrame(tick)
  }
  running.value = !running.value
}

function reset() {
  cancelAnimationFrame(raf)
  raf = null
  running.value = false
  elapsed.value = 0
  laps.value = []
}

function addLap() {
  const lap = elapsed.value - lastLap
  laps.value.unshift(formatTime(lap))
  lastLap = elapsed.value
}

function cleanup() {
  if (raf) {
    cancelAnimationFrame(raf)
    raf = null
  }
}

onUnmounted(cleanup)
onHide(cleanup)
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
.time-display {
  display: block;
  font-size: 72rpx;
  font-weight: 700;
  font-family: monospace;
  color: #1D1D1F;
  letter-spacing: 4rpx;
  padding: 24rpx 0 32rpx;
}
.controls {
  display: flex;
  gap: 24rpx;
  justify-content: center;
}
.ctrl-btn {
  flex: 1;
  padding: 20rpx 0;
  border-radius: 40rpx;
  font-size: 30rpx;
  font-weight: 600;
  text-align: center;
  &:active { opacity: 0.8; }
  &--start { background: #34C759; color: #fff; }
  &--pause { background: #FF9500; color: #fff; }
  &--reset { background: #F5F5F7; color: #3A3A3C; }
}
.lap-btn {
  background: #1D1D1F;
  color: #fff;
  padding: 20rpx 0;
  border-radius: 16rpx;
  font-size: 30rpx;
  text-align: center;
  &:active { opacity: 0.8; }
}
.laps-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}
.laps-title { font-size: 26rpx; font-weight: 600; color: #1D1D1F; }
.laps-clear { font-size: 24rpx; color: #FF3B30; }
.lap-item {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #F5F5F7;
  &:last-child { border-bottom: none; }
}
.lap-index { font-size: 24rpx; color: #86868B; }
.lap-time { font-size: 28rpx; font-family: monospace; color: #1D1D1F; }
</style>
