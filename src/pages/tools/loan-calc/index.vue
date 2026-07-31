<template>
  <view class="page">
    <view class="card">
      <view class="row">
        <text class="label">贷款金额（万元）</text>
        <input class="input" type="digit" v-model="principal" placeholder="如 100" />
      </view>
      <view class="row">
        <text class="label">贷款年限（年）</text>
        <input class="input" type="number" v-model="years" placeholder="如 30" />
      </view>
      <view class="row">
        <text class="label">年利率（%）</text>
        <input class="input" type="digit" v-model="rate" placeholder="如 4.2" />
      </view>
      <view class="row">
        <text class="label">还款方式</text>
        <view class="seg">
          <view class="seg-item" :class="{ 'seg-item--active': method === 'equal' }" @tap="method = 'equal'">等额本息</view>
          <view class="seg-item" :class="{ 'seg-item--active': method === 'principal' }" @tap="method = 'principal'">等额本金</view>
        </view>
      </view>
      <button class="btn" @tap="calculate">计算</button>
    </view>

    <view v-if="result" class="card result-card">
      <view class="result-main">
        <text class="result-label">月供</text>
        <text class="result-num">{{ formatMoney(result.monthly) }}</text>
        <text class="result-unit">元</text>
      </view>
      <view class="result-row">
        <text>贷款总额</text>
        <text>{{ formatMoney(result.total) }} 元</text>
      </view>
      <view class="result-row">
        <text>支付利息</text>
        <text class="highlight">{{ formatMoney(result.interest) }} 元</text>
      </view>
      <view class="result-row">
        <text>还款总额</text>
        <text>{{ formatMoney(result.payment) }} 元</text>
      </view>
      <view class="result-row" v-if="method === 'equal'">
        <text>首月利息</text>
        <text>{{ formatMoney(result.firstInterest) }} 元</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from '@/utils/helpers'

const principal = ref('')
const years = ref('')
const rate = ref('')
const method = ref('equal')
const result = ref(null)

function formatMoney(n) {
  return Math.round(n).toLocaleString('zh-CN')
}

function calculate() {
  const P = parseFloat(principal.value) * 10000  // 元
  const n = parseInt(years.value) * 12           // 月数
  const annualRate = parseFloat(rate.value)
  if (!P || !n || isNaN(annualRate) || P <= 0 || n <= 0 || annualRate < 0) {
    showToast('请输入有效的贷款信息')
    return
  }
  const r = annualRate / 12 / 100  // 月利率

  if (method.value === 'equal') {
    // 等额本息
    const pow = Math.pow(1 + r, n)
    const monthly = P * r * pow / (pow - 1)
    const payment = monthly * n
    result.value = {
      total: P,
      interest: payment - P,
      payment,
      monthly,
      firstInterest: P * r
    }
  } else {
    // 等额本金
    const principalPerMonth = P / n
    const totalInterest = (n + 1) * P * r / 2
    const payment = P + totalInterest
    const firstMonthly = principalPerMonth + P * r
    result.value = {
      total: P,
      interest: totalInterest,
      payment,
      monthly: firstMonthly,
      firstInterest: P * r
    }
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
.input {
  background: #F5F5F7;
  border-radius: 12rpx;
  padding: 10rpx 24rpx;
  font-size: 28rpx;
  width: 220rpx;
  text-align: center;
}
.seg {
  display: flex;
  gap: 12rpx;
}
.seg-item {
  padding: 12rpx 24rpx;
  background: #F5F5F7;
  border-radius: 12rpx;
  font-size: 24rpx;
  color: #3A3A3C;
  &:active { opacity: 0.7; }
  &--active {
    background: #1D1D1F;
    color: #fff;
    font-weight: 600;
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
.result-main { padding: 20rpx 0 24rpx; border-bottom: 1rpx solid #F5F5F7; margin-bottom: 16rpx; }
.result-label {
  display: block;
  font-size: 24rpx;
  color: #86868B;
}
.result-num {
  font-size: 64rpx;
  font-weight: 700;
  font-family: monospace;
  color: #1D1D1F;
}
.result-unit { font-size: 24rpx; color: #86868B; margin-left: 8rpx; }
.result-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
  font-size: 26rpx;
  color: #3A3A3C;
}
.highlight { color: #FF3B30; font-weight: 600; }
</style>
