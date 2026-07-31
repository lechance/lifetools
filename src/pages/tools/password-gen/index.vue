<template>
  <view class="page">
    <view class="card">
      <view class="row">
        <text class="label">密码长度</text>
        <view class="length-ctrl">
          <view class="step-btn" @tap="length = Math.max(4, length - 1)">−</view>
          <text class="length-val">{{ length }}</text>
          <view class="step-btn" @tap="length = Math.min(64, length + 1)">+</view>
        </view>
      </view>
      <view class="row">
        <text class="label">包含字符</text>
        <view class="opts">
          <view v-for="opt in charOptions" :key="opt.key"
            class="opt-item" :class="{ 'opt-item--active': opt.on }"
            @tap="toggleOpt(opt)">{{ opt.label }}</view>
        </view>
      </view>
      <button class="btn" @tap="generate">生成密码</button>
    </view>

    <view v-if="password" class="card result-card">
      <text class="password-text" selectable>{{ password }}</text>
      <view class="actions">
        <text class="action" @tap="copy">复制</text>
        <text class="action" @tap="generate">换一个</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { showSuccess } from '@/utils/helpers'

const length = ref(12)
const password = ref('')

const charOptions = reactive([
  { key: 'upper', label: '大写', on: true },
  { key: 'lower', label: '小写', on: true },
  { key: 'number', label: '数字', on: true },
  { key: 'symbol', label: '符号', on: false },
])

function toggleOpt(opt) {
  opt.on = !opt.on
  if (!charOptions.some(o => o.on)) opt.on = true
}

function generate() {
  const sets = {
    upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
    lower: 'abcdefghijkmnpqrstuvwxyz',
    number: '23456789',
    symbol: '!@#$%^&*_-+=?',
  }
  let pool = ''
  charOptions.forEach(o => { if (o.on) pool += sets[o.key] })
  if (!pool) pool = sets.number

  let result = ''
  const arr = new Uint32Array(length.value)
  crypto.getRandomValues ? crypto.getRandomValues(arr) : null
  for (let i = 0; i < length.value; i++) {
    result += pool[Math.floor(Math.random() * pool.length)]
  }
  password.value = result
}

function copy() {
  uni.setClipboardData({
    data: password.value,
    success: () => showSuccess('已复制')
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
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
  &:not(:last-child) { border-bottom: 1rpx solid #F5F5F7; }
}
.label { font-size: 28rpx; color: #1D1D1F; }
.length-ctrl {
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.step-btn {
  width: 60rpx;
  height: 60rpx;
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
  min-width: 60rpx;
  text-align: center;
}
.opts {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}
.opt-item {
  padding: 10rpx 22rpx;
  background: #F5F5F7;
  border-radius: 30rpx;
  font-size: 24rpx;
  color: #3A3A3C;
  &:active { opacity: 0.7; }
  &--active {
    background: #1D1D1F;
    color: #fff;
  }
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
.password-text {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  font-family: monospace;
  color: #1D1D1F;
  padding: 20rpx 0;
  word-break: break-all;
  letter-spacing: 4rpx;
}
.actions {
  display: flex;
  justify-content: center;
  gap: 40rpx;
  border-top: 1rpx solid #F5F5F7;
  padding-top: 16rpx;
}
.action {
  font-size: 26rpx;
  color: #007AFF;
  padding: 8rpx 24rpx;
  &:active { opacity: 0.6; }
}
</style>
