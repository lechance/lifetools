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

    <view class="card records-card">
      <view class="records-header">
        <text class="records-title">测试记录</text>
        <text v-if="records.length" class="records-clear" @tap="clearRecords">清空</text>
      </view>
      <scroll-view v-if="records.length" scroll-y class="records-scroll">
        <view v-for="r in records" :key="r.id" class="record-row">
          <view class="record-left">
            <text class="record-time">{{ formatTime(r.time) }}</text>
            <text class="record-duration">{{ formatDuration(r.duration) }}</text>
          </view>
          <view class="record-right">
            <view class="record-stat">
              <text class="record-label">最高</text>
              <text class="record-val record-val--max">{{ r.max }}</text>
            </view>
            <view class="record-stat">
              <text class="record-label">平均</text>
              <text class="record-val">{{ r.avg }}</text>
            </view>
            <view class="record-stat">
              <text class="record-label">最低</text>
              <text class="record-val record-val--min">{{ r.min }}</text>
            </view>
          </view>
        </view>
      </scroll-view>
      <view v-else class="records-empty">
        <text class="records-empty-text">暂无记录，开始测试后自动保存</text>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { showToast } from '@/utils/helpers'

const db = ref(0)
const recording = ref(false)
let recorder = null
const MAX_DB = 120
let h5Stream = null
let h5AudioCtx = null
let h5Afr = null

const records = ref([])
const STORAGE_KEY = 'lifetool_decibel_records'
let trackMax = 0
let trackMin = 120
let trackSum = 0
let trackCount = 0
let trackStart = 0

const levels = [
  { range: '0-30', name: '安静环境' },
  { range: '30-60', name: '正常交谈' },
  { range: '60-80', name: '嘈杂环境' },
  { range: '80-120', name: '高分贝·刺耳' },
]

function loadRecords() {
  try {
    const data = uni.getStorageSync(STORAGE_KEY)
    records.value = data ? JSON.parse(data) : []
  } catch (e) {
    records.value = []
  }
}

function saveRecord(record) {
  records.value.unshift(record)
  if (records.value.length > 20) records.value = records.value.slice(0, 20)
  try { uni.setStorageSync(STORAGE_KEY, JSON.stringify(records.value)) } catch (e) {}
}

function clearRecords() {
  records.value = []
  try { uni.setStorageSync(STORAGE_KEY, JSON.stringify([])) } catch (e) {}
}

function trackDb(val) {
  if (val > trackMax) trackMax = val
  if (val < trackMin) trackMin = val
  trackSum += val
  trackCount++
}

function formatTime(ts) {
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDuration(ms) {
  const s = Math.round(ms / 1000)
  if (s < 60) return s + '秒'
  return Math.floor(s / 60) + '分' + (s % 60) + '秒'
}

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
  // #ifdef MP-WEIXIN
  uni.authorize({
    scope: 'scope.record',
    success: () => startRecord(),
    fail: () => showToast('需要麦克风权限')
  })
  // #endif
  // #ifdef H5
  startRecordH5()
  // #endif
}

function startRecord() {
  trackMax = 0; trackMin = 120; trackSum = 0; trackCount = 0; trackStart = Date.now()
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
    const dbVal = 20 * Math.log10((rms / 32768) + 1e-10)
    db.value = Math.max(0, Math.min(120, 90 + dbVal))
    trackDb(db.value)
  })
  recorder.start({
    duration: 600000,
    sampleRate: 44100,
    numberOfChannels: 1,
    encodeBitRate: 192000,
    format: 'aac',
    frameSize: 8
  })
}

function stop() {
  if (recording.value && trackCount > 0) {
    saveRecord({
      id: Date.now(),
      time: trackStart,
      duration: Date.now() - trackStart,
      max: +trackMax.toFixed(1),
      min: +trackMin.toFixed(1),
      avg: +(trackSum / trackCount).toFixed(1)
    })
  }
  if (recorder) {
    recorder.stop()
    recorder = null
  }
  // #ifdef H5
  stopH5()
  // #endif
  recording.value = false
  db.value = 0
}

// #ifdef H5
function startRecordH5() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('当前浏览器不支持录音')
    return
  }
  trackMax = 0; trackMin = 120; trackSum = 0; trackCount = 0; trackStart = Date.now()
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      h5Stream = stream
      h5AudioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const source = h5AudioCtx.createMediaStreamSource(stream)
      const analyser = h5AudioCtx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      recording.value = true
      const data = new Float32Array(analyser.fftSize)
      function tick() {
        analyser.getFloatTimeDomainData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i]
        const rms = Math.sqrt(sum / data.length)
        const dbVal = 20 * Math.log10(rms + 1e-10)
        db.value = Math.max(0, Math.min(MAX_DB, dbVal + 94))
        trackDb(db.value)
        h5Afr = requestAnimationFrame(tick)
      }
      tick()
    })
    .catch(() => showToast('需要麦克风权限'))
}

function stopH5() {
  if (h5Afr) { cancelAnimationFrame(h5Afr); h5Afr = null }
  if (h5AudioCtx) { h5AudioCtx.close(); h5AudioCtx = null }
  if (h5Stream) { h5Stream.getTracks().forEach(t => t.stop()); h5Stream = null }
}
// #endif

onMounted(() => {
  loadRecords()
})

onUnmounted(() => {
  // #ifdef H5
  stopH5()
  // #endif
  if (recorder) {
    recorder.stop()
    recorder = null
  }
  recording.value = false
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
.records-card { padding-bottom: 16rpx; }
.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}
.records-title { font-size: 28rpx; font-weight: 600; color: #1D1D1F; }
.records-clear { font-size: 24rpx; color: #FF3B30; }
.records-scroll { max-height: 400rpx; }
.record-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #F5F5F7;
  &:last-child { border-bottom: none; }
}
.record-left { flex-shrink: 0; }
.record-time { display: block; font-size: 26rpx; color: #1D1D1F; }
.record-duration { display: block; font-size: 22rpx; color: #86868B; margin-top: 4rpx; }
.record-right { display: flex; gap: 24rpx; }
.record-stat { text-align: center; }
.record-label { display: block; font-size: 20rpx; color: #86868B; }
.record-val { display: block; font-size: 28rpx; font-weight: 600; color: #1D1D1F; font-family: monospace; }
.record-val--max { color: #FF3B30; }
.record-val--min { color: #34C759; }
.records-empty { padding: 32rpx 0; text-align: center; }
.records-empty-text { font-size: 26rpx; color: #86868B; }
</style>
