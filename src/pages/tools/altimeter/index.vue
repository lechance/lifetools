<template>
  <view class="page">
    <view class="card display-card">
      <text class="alt-value">{{ altitude }}</text>
      <text class="alt-unit">米 (m)</text>
      <text class="alt-desc">{{ altitudeDesc }}</text>

      <view class="meter">
        <view class="meter-fill" :style="{ width: meterWidth + '%' }"></view>
      </view>

      <view class="info-row">
        <view class="info-item">
          <text class="info-num">{{ floors }}</text>
          <text class="info-label">约楼层</text>
        </view>
        <view class="info-item">
          <text class="info-num">{{ accuracy }}</text>
          <text class="info-label">精度(m)</text>
        </view>
        <view class="info-item">
          <text class="info-num">{{ updateCount }}</text>
          <text class="info-label">更新次数</text>
        </view>
      </view>

      <view class="start-btn" :class="{ 'start-btn--loading': loading }" @tap="getLocation">
        {{ loading ? '定位中...' : '刷新海拔' }}
      </view>
    </view>

    <view class="card">
      <view class="coord-row">
        <text class="coord-label">纬度</text>
        <text class="coord-value">{{ latitude }}</text>
      </view>
      <view class="coord-row">
        <text class="coord-label">经度</text>
        <text class="coord-value">{{ longitude }}</text>
      </view>
      <view class="coord-row">
        <text class="coord-label">垂直精度</text>
        <text class="coord-value">{{ verticalAccuracy }}m</text>
      </view>
      <view class="coord-row">
        <text class="coord-label">水平精度</text>
        <text class="coord-value">{{ horizontalAccuracy }}m</text>
      </view>
    </view>

    <view class="card">
      <text class="tip">海拔数据来源于GPS定位，精度受设备和环境影响。开阔地带定位更准确。</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { showToast } from '@/utils/helpers'

const altitude = ref('--')
const latitude = ref('--')
const longitude = ref('--')
const accuracy = ref('--')
const verticalAccuracy = ref('--')
const horizontalAccuracy = ref('--')
const loading = ref(false)
const updateCount = ref(0)

const MAX_ALT = 1000

const meterWidth = computed(() => {
  if (altitude.value === '--') return 0
  return Math.min(100, (Number(altitude.value) / MAX_ALT) * 100)
})

const floors = computed(() => {
  if (altitude.value === '--') return '--'
  const alt = Number(altitude.value)
  const floor = Math.floor(alt / 3)
  return `~${floor}层`
})

const altitudeDesc = computed(() => {
  if (altitude.value === '--') return '等待定位'
  const alt = Number(altitude.value)
  if (alt < 0) return '海平面以下'
  if (alt < 100) return '低海拔'
  if (alt < 500) return '中海拔'
  if (alt < 2000) return '高海拔'
  return '超高海拔'
})

onMounted(() => {
  getLocation()
})

function getLocation() {
  if (loading.value) return
  loading.value = true

  uni.getLocation({
    altitude: true,
    success: (res) => {
      altitude.value = res.altitude ? res.altitude.toFixed(1) : '--'
      latitude.value = res.latitude ? res.latitude.toFixed(6) : '--'
      longitude.value = res.longitude ? res.longitude.toFixed(6) : '--'
      accuracy.value = res.accuracy ? res.accuracy.toFixed(1) : '--'
      verticalAccuracy.value = res.verticalAccuracy ? res.verticalAccuracy.toFixed(1) : '--'
      horizontalAccuracy.value = res.horizontalAccuracy ? res.horizontalAccuracy.toFixed(1) : '--'
      updateCount.value++
    },
    fail: (err) => {
      if (err.errMsg && err.errMsg.includes('auth deny')) {
        showToast('请在设置中允许定位权限')
      } else {
        showToast('定位失败，请稍后重试')
      }
    },
    complete: () => {
      loading.value = false
    }
  })
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
.display-card { text-align: center; }
.alt-value {
  font-size: 120rpx;
  font-weight: 700;
  font-family: monospace;
  color: #1D1D1F;
}
.alt-unit { font-size: 40rpx; color: #86868B; }
.alt-desc {
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
  background: linear-gradient(90deg, #34C759, #007AFF, #5856D6);
  transition: width 0.3s ease;
}
.info-row {
  display: flex;
  padding: 24rpx 0;
}
.info-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.info-num {
  font-size: 32rpx;
  font-weight: 600;
  font-family: monospace;
  color: #1D1D1F;
}
.info-label { font-size: 22rpx; color: #C7C7CC; }
.start-btn {
  background: #1D1D1F;
  color: #fff;
  padding: 24rpx 0;
  border-radius: 40rpx;
  font-size: 32rpx;
  font-weight: 600;
  &:active { opacity: 0.8; }
  &--loading { background: #C7C7CC; }
}
.coord-row {
  display: flex;
  justify-content: space-between;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #F5F5F7;
  &:last-child { border-bottom: none; }
}
.coord-label { font-size: 26rpx; color: #86868B; }
.coord-value { font-size: 26rpx; color: #1D1D1F; font-family: monospace; }
.tip {
  display: block;
  font-size: 22rpx;
  color: #C7C7CC;
  line-height: 1.6;
}
</style>
