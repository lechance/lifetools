<template>
  <view class="page">
    <view class="card display-card">
      <text class="db-value">{{ currentDb }}</text>
      <text class="db-unit">dB</text>
      <text class="db-desc">{{ levelDesc }}</text>

      <view class="meter">
        <view class="meter-fill" :style="{ width: meterWidth + '%' }"></view>
      </view>

      <view class="start-btn" :class="{ 'start-btn--stop': recording }" @tap="toggle">
        {{ recording ? '停止测试' : '开始测试' }}
      </view>
    </view>

    <view class="card">
      <view v-for="l in levels" :key="l.range" class="level-row">
        <text class="level-range">{{ l.range }}</text>
        <text class="level-name">{{ l.name }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { showToast } from '@/utils/helpers'

const db = ref(0)
const recording = ref(false)
let recorder = null
const MAX_DB = 100

const levels = [
  { range: '0-30', name: '安静环境' },
  { range: '30-60', name: '正常交谈' },
  { range: '60-80', name: '嘈杂环境' },
  { range: '80-100', name: '高分贝·刺耳' },
]

const currentDb = computed(() => db.value.toFixed(1))
const meterWidth = computed(() => Math.max(2, Math.min(100, db.value / MAX_DB * 100)))

const levelDesc = computed(() => {
  const v = db.value
  if (v < 30) return '安静'
  if (v < 60) return '正常交谈'
  if (v < 80) return '嘈杂'
  return '高分贝'
})

function toggle() {
  if (recording.value) {
    stop()
  } else {
    start()
  }
}

function start() {
  // 小程序：请求录音权限
  // #ifdef MP-WEIXIN
  uni.authorize({
    scope: 'scope.record',
    success: () => startRecord(),
    fail: () => showToast('需要麦克风权限')
  })
  // #endif
  // #ifndef MP-WEIXIN
  startRecord()
  // #endif
}

function startRecord() {
  recorder = uni.getRecorderManager()
  recorder.onStart(() => {
    recording.value = true
  })
  recorder.onError((err) => {
    recording.value = false
    showToast('录音失败：' + (err.errMsg || '未知错误'))
  })
  recorder.onFrameRecorded((res) => {
    const data = new Int16Array(res.frameBuffer)
    let sum = 0
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i]
    const rms = Math.sqrt(sum / data.length)
    // 16bit 满量程 32768，0dBFS 基准
    const dbVal = 20 * Math.log10((rms / 32768) + 1e-10)
    // 映射到 0-100 近似声压级
    db.value = Math.max(0, Math.min(100, 90 + dbVal))
  })
  recorder.start({
    duration: 600000,
    sampleRate: 44100,
    numberOfChannels: 1,
    encodeBitRate: 192000,
    format: 'aac',
    // frameSize 单位 KB（微信限定 1-256），取较小值保证 onFrameRecorded 频繁回调刷新分贝
    frameSize: 8
  })
}

function stop() {
  if (recorder) {
    recorder.stop()
    recorder = null
  }
  recording.value = false
  db.value = 0
}

onUnmounted(() => {
  stop()
})
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
.display-card { text-align: center; }
.db-value {
  font-size: 120rpx;
  font-weight: 700;
  font-family: monospace;
  color: #1D1D1F;
}
.db-unit { font-size: 40rpx; color: #86868B; }
.db-desc {
  display: block;
  font-size: 28rpx;
  color: #007AFF;
  padding: 8rpx 0 24rpx;
}
.meter {
  height: 20rpx;
  background: #F5F5F7;
  border-radius: 10rpx;
  overflow: hidden;
  margin-bottom: 32rpx;
}
.meter-fill {
  height: 100%;
  border-radius: 10rpx;
  background: linear-gradient(90deg, #34C759, #FF9500, #FF3B30);
  transition: width 0.1s linear;
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
.level-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #F5F5F7;
  &:last-child { border-bottom: none; }
}
.level-range { font-size: 26rpx; color: #86868B; }
.level-name { font-size: 26rpx; color: #1D1D1F; }
</style>
