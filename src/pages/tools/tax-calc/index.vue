<template>
  <view class="page">
    <view class="card">
      <view class="row">
        <text class="label">月收入（元）</text>
        <input class="input" type="digit" v-model="income" placeholder="如 15000" />
      </view>
      <view class="row">
        <text class="label">五险一金（元）</text>
        <input class="input" type="digit" v-model="insurance" placeholder="如 2000" />
      </view>
      <view class="row">
        <text class="label">专项附加（元）</text>
        <input class="input" type="digit" v-model="deduction" placeholder="如 1000" />
      </view>
      <button class="btn" @tap="calculate">计算个税</button>
    </view>

    <view v-if="result" class="card result-card">
      <view class="result-main">
        <text class="result-label">应缴个税</text>
        <text class="result-num">{{ formatMoney(result.tax) }}</text>
        <text class="result-unit">元</text>
      </view>
      <view class="result-row">
        <text>应纳税所得额</text>
        <text>{{ formatMoney(result.taxable) }} 元</text>
      </view>
      <view class="result-row">
        <text>适用税率</text>
        <text>{{ result.rate }}%（速算扣除 {{ result.deduction }}）</text>
      </view>
      <view class="result-row">
        <text>税后月收入</text>
        <text class="highlight">{{ formatMoney(result.net) }} 元</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from '@/utils/helpers'

const income = ref('')
const insurance = ref('')
const deduction = ref('')
const result = ref(null)

function formatMoney(n) {
  return Math.round(n).toLocaleString('zh-CN')
}

function calculate() {
  const inc = parseFloat(income.value)
  const ins = parseFloat(insurance.value) || 0
  const ded = parseFloat(deduction.value) || 0
  if (!inc || inc <= 0) {
    showToast('请输入月收入')
    return
  }
  // 应纳税所得额 = 收入 - 起征点5000 - 五险一金 - 专项附加
  const taxable = Math.max(0, inc - 5000 - ins - ded)

  let rate = 0, quick = 0
  if (taxable <= 3000) { rate = 3; quick = 0 }
  else if (taxable <= 12000) { rate = 10; quick = 210 }
  else if (taxable <= 25000) { rate = 20; quick = 1410 }
  else if (taxable <= 35000) { rate = 25; quick = 2660 }
  else if (taxable <= 55000) { rate = 30; quick = 4410 }
  else if (taxable <= 80000) { rate = 35; quick = 7160 }
  else { rate = 45; quick = 15160 }

  const tax = taxable * rate / 100 - quick
  result.value = {
    taxable,
    rate,
    deduction: quick,
    tax: Math.max(0, tax),
    net: inc - ins - Math.max(0, tax)
  }
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
.input {
  background: #F5F5F7;
  border-radius: 12rpx;
  padding: 10rpx 24rpx;
  font-size: 28rpx;
  width: 220rpx;
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
.highlight { color: #34C759; font-weight: 600; }
</style>
