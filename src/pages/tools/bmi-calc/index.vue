<template>
  <view class="page">
    <view class="card">
      <view class="row">
        <text class="label">身高 (cm)</text>
        <input class="input" type="digit" v-model="height" placeholder="如 170" />
      </view>
      <view class="row">
        <text class="label">体重 (kg)</text>
        <input class="input" type="digit" v-model="weight" placeholder="如 60" />
      </view>
      <button class="btn" @tap="calculate">计算 BMI</button>
    </view>

    <view v-if="result !== null" class="card result-card">
      <text class="result-num">{{ result }}</text>
      <text class="result-level" :class="levelClass">{{ level }}</text>
      <view class="standard">
        <view class="standard-row"><text>偏瘦</text><text>&lt; 18.5</text></view>
        <view class="standard-row"><text>正常</text><text>18.5 ~ 24</text></view>
        <view class="standard-row"><text>偏胖</text><text>24 ~ 28</text></view>
        <view class="standard-row"><text>肥胖</text><text>&gt; 28</text></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { showToast } from '@/utils/helpers'

const height = ref('')
const weight = ref('')
const result = ref(null)

function calculate() {
  const h = parseFloat(height.value)
  const w = parseFloat(weight.value)
  if (!h || !w || h <= 0 || w <= 0) {
    showToast('请输入有效的身高和体重')
    return
  }
  const bmi = w / Math.pow(h / 100, 2)
  result.value = bmi.toFixed(1)
}

const level = computed(() => {
  if (result.value === null) return ''
  const v = parseFloat(result.value)
  if (v < 18.5) return '偏瘦'
  if (v < 24) return '正常'
  if (v < 28) return '偏胖'
  return '肥胖'
})

const levelClass = computed(() => {
  if (result.value === null) return ''
  const v = parseFloat(result.value)
  if (v < 18.5) return 'is-thin'
  if (v < 24) return 'is-normal'
  if (v < 28) return 'is-over'
  return 'is-fat'
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
  width: 200rpx;
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
.result-num {
  display: block;
  font-size: 100rpx;
  font-weight: 700;
  font-family: monospace;
  color: #1D1D1F;
  padding: 20rpx 0 10rpx;
}
.result-level {
  font-size: 40rpx;
  font-weight: 600;
  padding: 8rpx 32rpx;
  border-radius: 40rpx;
  display: inline-block;
  margin-bottom: 24rpx;
  &.is-thin { color: #FF9500; background: #FFF7ED; }
  &.is-normal { color: #34C759; background: #EFFBF2; }
  &.is-over { color: #FF9500; background: #FFF7ED; }
  &.is-fat { color: #FF3B30; background: #FFEFED; }
}
.standard { border-top: 1rpx solid #F5F5F7; padding-top: 16rpx; }
.standard-row {
  display: flex;
  justify-content: space-between;
  padding: 8rpx 0;
  font-size: 24rpx;
  color: #86868B;
}
</style>
