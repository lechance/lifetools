<template>
  <view class="page">
    <view class="card">
      <view class="row">
        <text class="label">金额</text>
        <input class="input" type="digit" v-model="amount" placeholder="如 100" />
      </view>
      <view class="row">
        <text class="label">从</text>
        <picker :range="currencies" :value="fromIdx" @change="onFrom">
          <view class="picker-val">{{ currencies[fromIdx] }}</view>
        </picker>
        <view class="swap-btn" @tap="swap">⇄</view>
        <picker :range="currencies" :value="toIdx" @change="onTo">
          <view class="picker-val">{{ currencies[toIdx] }}</view>
        </picker>
        <text class="label">到</text>
      </view>
      <button class="btn" @tap="convert">{{ loading ? '获取汇率中...' : '换算' }}</button>
    </view>

    <view v-if="result" class="card result-card">
      <text class="result-label">{{ amount }} {{ currencies[fromIdx] }} =</text>
      <text class="result-num">{{ result }}</text>
      <text class="result-currency">{{ currencies[toIdx] }}</text>
      <text class="rate-info">1 {{ currencies[fromIdx] }} = {{ rate }} {{ currencies[toIdx] }}</text>
    </view>

    <view v-if="ratesLoaded" class="card">
      <text class="title">常用汇率（对 {{ currencies[fromIdx] }}）</text>
      <view v-for="c in ['CNY', 'USD', 'EUR', 'JPY', 'GBP', 'HKD']" :key="c" class="rate-row" v-show="c !== currencies[fromIdx]">
        <text class="rate-cur">{{ c }}</text>
        <text class="rate-val">{{ rates[c] ? rates[c].toFixed(4) : '--' }}</text>
      </view>
    </view>

    <view class="card">
      <text class="tip">汇率数据来自公开接口，仅供参考，实际以银行汇率为准。</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from '@/utils/helpers'

const currencies = ['CNY', 'USD', 'EUR', 'JPY', 'GBP', 'HKD', 'AUD', 'CAD', 'CHF', 'SGD', 'KRW', 'INR']
const fromIdx = ref(1)   // USD
const toIdx = ref(0)     // CNY
const amount = ref('100')
const result = ref('')
const rate = ref('')
const rates = ref({})
const ratesLoaded = ref(false)
const loading = ref(false)

function onFrom(e) {
  fromIdx.value = parseInt(e.detail.value, 10)
  fetchRates()
}
function onTo(e) {
  toIdx.value = parseInt(e.detail.value, 10)
  if (ratesLoaded.value) calc()
}
function swap() {
  const t = fromIdx.value
  fromIdx.value = toIdx.value
  toIdx.value = t
  fetchRates()
}

function fetchRates() {
  loading.value = true
  const base = currencies[fromIdx.value]
  uni.request({
    url: `https://open.er-api.com/v6/latest/${base}`,
    success: (res) => {
      if (res.data && res.data.result === 'success') {
        rates.value = res.data.rates || {}
        ratesLoaded.value = true
        calc()
      } else {
        showToast('获取汇率失败')
      }
    },
    fail: () => showToast('网络请求失败'),
    complete: () => { loading.value = false }
  })
}

function calc() {
  const val = parseFloat(amount.value)
  const target = currencies[toIdx.value]
  const r = rates.value[target]
  if (isNaN(val) || !r) return
  result.value = (val * r).toFixed(2)
  rate.value = r.toFixed(4)
}

function convert() {
  if (!ratesLoaded.value) {
    fetchRates()
  } else {
    calc()
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
  gap: 12rpx;
  &:not(:last-child) { border-bottom: 1rpx solid #F5F5F7; }
}
.label { font-size: 26rpx; color: #86868B; }
.input {
  background: #F5F5F7;
  border-radius: 12rpx;
  padding: 10rpx 24rpx;
  font-size: 28rpx;
  width: 200rpx;
  text-align: center;
}
.picker-val {
  background: #F5F5F7;
  border-radius: 12rpx;
  padding: 10rpx 24rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #1D1D1F;
  min-width: 120rpx;
  text-align: center;
}
.swap-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F5F7;
  border-radius: 50%;
  font-size: 32rpx;
  color: #007AFF;
  &:active { opacity: 0.7; }
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
.result-label {
  display: block;
  font-size: 26rpx;
  color: #86868B;
}
.result-num {
  font-size: 72rpx;
  font-weight: 700;
  font-family: monospace;
  color: #1D1D1F;
  padding: 8rpx 0;
}
.result-currency {
  font-size: 36rpx;
  color: #007AFF;
  font-weight: 600;
}
.rate-info {
  display: block;
  font-size: 22rpx;
  color: #C7C7CC;
  padding-top: 12rpx;
}
.title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 8rpx;
}
.rate-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #F5F5F7;
  &:last-child { border-bottom: none; }
}
.rate-cur { font-size: 28rpx; color: #1D1D1F; }
.rate-val { font-size: 26rpx; color: #86868B; font-family: monospace; }
.tip {
  font-size: 22rpx;
  color: #C7C7CC;
  line-height: 1.6;
}
</style>
