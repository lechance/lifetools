<template>
  <view class="page">
    <view class="card">
      <view class="row">
        <text class="label">出生日期</text>
        <picker mode="date" :value="birthday" start="1900-01-01" :end="today" @change="onBirthday">
          <view class="picker-val">{{ birthday || '请选择' }}</view>
        </picker>
      </view>
      <view class="row">
        <text class="label">目标日期</text>
        <picker mode="date" :value="target" start="1900-01-01" :end="today" @change="onTarget">
          <view class="picker-val">{{ target || '今天' }}</view>
        </picker>
      </view>
      <button class="btn" @tap="calculate">计算年龄</button>
    </view>

    <view v-if="years !== null" class="card result-card">
      <view class="age-big">
        <text class="age-num">{{ years }}</text>
        <text class="age-unit">岁</text>
      </view>
      <view class="age-detail">
        <view class="detail-item">
          <text class="detail-num">{{ months }}</text>
          <text class="detail-label">月</text>
        </view>
        <view class="detail-item">
          <text class="detail-num">{{ days }}</text>
          <text class="detail-label">天</text>
        </view>
        <view class="detail-item">
          <text class="detail-num">{{ totalDays }}</text>
          <text class="detail-label">总天数</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from '@/utils/helpers'

const today = new Date().toISOString().slice(0, 10)
const birthday = ref('')
const target = ref(today)
const years = ref(null)
const months = ref(0)
const days = ref(0)
const totalDays = ref(0)

function onBirthday(e) {
  birthday.value = e.detail.value
  calculate()
}
function onTarget(e) {
  target.value = e.detail.value
  calculate()
}

function calculate() {
  if (!birthday.value) {
    showToast('请选择出生日期')
    return
  }
  const b = new Date(birthday.value)
  const t = new Date(target.value)
  if (b > t) {
    showToast('出生日期不能晚于目标日期')
    return
  }

  let y = t.getFullYear() - b.getFullYear()
  let m = t.getMonth() - b.getMonth()
  let d = t.getDate() - b.getDate()
  if (d < 0) {
    m--
    d += new Date(t.getFullYear(), t.getMonth(), 0).getDate()
  }
  if (m < 0) {
    y--
    m += 12
  }

  years.value = y
  months.value = m
  days.value = d
  totalDays.value = Math.floor((t - b) / 86400000)
}
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
.btn {
  width: 100%;
  margin-top: 24rpx;
  background: #1D1D1F;
  color: #fff;
  border: none;
  border-radius: 16rpx;
  padding: 20rpx 0;
  font-size: 30rpx;
  &:active { opacity: 0.8; }
}
.result-card { text-align: center; }
.age-big {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8rpx;
  padding: 24rpx 0;
}
.age-num {
  font-size: 120rpx;
  font-weight: 700;
  font-family: monospace;
  color: #1D1D1F;
}
.age-unit { font-size: 36rpx; color: #86868B; }
.age-detail {
  display: flex;
  border-top: 1rpx solid #F5F5F7;
  padding-top: 20rpx;
}
.detail-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.detail-num {
  font-size: 40rpx;
  font-weight: 600;
  font-family: monospace;
  color: #007AFF;
}
.detail-label { font-size: 24rpx; color: #86868B; }
</style>
