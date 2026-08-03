<template>
  <view class="page">
    <view class="card search-card">
      <input class="search-input" v-model="city" placeholder="输入城市拼音，如 beijing / shanghai" confirm-type="search" @confirm="search" />
      <view class="search-btn" :class="{ 'search-btn--loading': loading }" @tap="search">{{ loading ? '查询中...' : '查询' }}</view>
    </view>

    <view v-if="error" class="card">
      <text class="error-text">{{ error }}</text>
    </view>

    <view v-if="current" class="card current-card">
      <text class="city-name">{{ cityName }}</text>
      <text class="temp">{{ current.temp_C }}°</text>
      <text class="weather-desc">{{ current.weatherDesc }}</text>
      <view class="detail-row">
        <view class="detail-item">
          <text class="detail-num">{{ current.humidity }}%</text>
          <text class="detail-label">湿度</text>
        </view>
        <view class="detail-item">
          <text class="detail-num">{{ current.windspeedKmph }}</text>
          <text class="detail-label">风速(km/h)</text>
        </view>
        <view class="detail-item">
          <text class="detail-num">{{ current.uvIndex }}</text>
          <text class="detail-label">紫外线</text>
        </view>
      </view>
    </view>

    <view v-if="forecast.length" class="card">
      <text class="title">未来预报</text>
      <view v-for="f in forecast" :key="f.date" class="forecast-row">
        <text class="forecast-date">{{ f.date }}</text>
        <text class="forecast-temp">{{ f.minTemp }}° / {{ f.maxTemp }}°</text>
        <text class="forecast-desc">{{ f.desc }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from '@/utils/helpers'

const city = ref('')
const cityName = ref('')
const current = ref(null)
const forecast = ref([])
const loading = ref(false)
const error = ref('')

function search() {
  const c = city.value.trim()
  if (!c) { showToast('请输入城市'); return }
  loading.value = true
  error.value = ''

  uni.request({
    url: `https://wttr.in/${encodeURIComponent(c)}?format=j1&lang=zh`,
    success: (res) => {
      if (res.statusCode !== 200 || !res.data) {
        error.value = '查询失败，请检查城市名'
        return
      }
      const data = res.data
      const cond = data.current_condition && data.current_condition[0]
      if (cond) {
        current.value = {
          temp_C: cond.temp_C,
          humidity: cond.humidity,
          windspeedKmph: cond.windspeedKmph,
          uvIndex: cond.uvIndex || '--',
          weatherDesc: (cond.weatherDesc && cond.weatherDesc[0] && cond.weatherDesc[0].value) || '--'
        }
        cityName.value = (data.nearest_area && data.nearest_area[0] && data.nearest_area[0].areaName && data.nearest_area[0].areaName[0].value) || c
      } else {
        // wttr.in 对不存在的城市仍返回 200，此时无 current_condition，需明确提示
        error.value = '未找到该城市，请检查城市名'
        current.value = null
        forecast.value = []
        return
      }
      forecast.value = (data.weather || []).slice(0, 3).map(w => ({
        date: w.date,
        minTemp: w.mintempC,
        maxTemp: w.maxtempC,
        desc: (w.hourly && w.hourly[0] && w.hourly[0].weatherDesc && w.hourly[0].weatherDesc[0] && w.hourly[0].weatherDesc[0].value) || '--'
      }))
    },
    fail: () => {
      error.value = '网络请求失败，请检查网络或稍后重试'
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
.search-card {
  display: flex;
  gap: 16rpx;
  align-items: center;
}
.search-input {
  flex: 1;
  background: #F5F5F7;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  font-size: 28rpx;
  color: #1D1D1F;
}
.search-btn {
  background: #1D1D1F;
  color: #fff;
  padding: 16rpx 32rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  &:active { opacity: 0.8; }
  &--loading { background: #C7C7CC; }
}
.current-card { text-align: center; }
.city-name {
  display: block;
  font-size: 32rpx;
  color: #86868B;
}
.temp {
  display: block;
  font-size: 120rpx;
  font-weight: 700;
  font-family: monospace;
  color: #1D1D1F;
  padding: 10rpx 0;
}
.weather-desc { font-size: 32rpx; color: #007AFF; }
.detail-row {
  display: flex;
  border-top: 1rpx solid #F5F5F7;
  padding-top: 24rpx;
  margin-top: 24rpx;
}
.detail-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.detail-num {
  font-size: 32rpx;
  font-weight: 600;
  font-family: monospace;
  color: #1D1D1F;
}
.detail-label { font-size: 22rpx; color: #C7C7CC; }
.title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 12rpx;
}
.forecast-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #F5F5F7;
  &:last-child { border-bottom: none; }
}
.forecast-date { font-size: 28rpx; color: #1D1D1F; }
.forecast-temp { font-size: 26rpx; color: #86868B; font-family: monospace; }
.forecast-desc { font-size: 24rpx; color: #007AFF; }
.error-text {
  font-size: 26rpx;
  color: #FF3B30;
  display: block;
  text-align: center;
  padding: 20rpx 0;
}
</style>
