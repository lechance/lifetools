<template>
  <view class="page">
    <view class="card">
      <view class="row">
        <text class="label">输入数字</text>
        <input class="input" v-model="inputVal" placeholder="输入数字" @input="convert" />
      </view>
      <view class="row">
        <text class="label">当前进制</text>
        <view class="seg">
          <view v-for="b in [2, 8, 10, 16]" :key="b"
            class="seg-item" :class="{ 'seg-item--active': fromBase === b }"
            @tap="selectBase(b)">{{ b }}</view>
        </view>
      </view>
    </view>

    <view v-if="results.length" class="card result-card">
      <view v-for="r in results" :key="r.base" class="result-row">
        <text class="result-label">{{ r.base }} 进制</text>
        <text class="result-val" selectable>{{ r.value }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { showToast } from '@/utils/helpers'

const inputVal = ref('')
const fromBase = ref(10)

function selectBase(b) {
  fromBase.value = b
  convert()
}

const results = computed(() => {
  const val = inputVal.value.trim()
  if (!val) return []
  const dec = parseInt(val, fromBase.value)
  if (isNaN(dec)) return []
  return [2, 8, 10, 16].map(base => ({
    base,
    value: dec.toString(base).toUpperCase()
  }))
})

function convert() {
  if (inputVal.value.trim() && results.value.length === 0) {
    showToast('输入的数字在当前进制下无效')
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
  width: 260rpx;
  text-align: center;
}
.seg {
  display: flex;
  gap: 12rpx;
}
.seg-item {
  width: 72rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F5F7;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #3A3A3C;
  &:active { opacity: 0.7; }
  &--active {
    background: #1D1D1F;
    color: #fff;
    font-weight: 600;
  }
}
.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  &:not(:last-child) { border-bottom: 1rpx solid #F5F5F7; }
}
.result-label { font-size: 26rpx; color: #86868B; }
.result-val {
  font-size: 32rpx;
  font-weight: 600;
  font-family: monospace;
  color: #1D1D1F;
  word-break: break-all;
  max-width: 400rpx;
  text-align: right;
}
</style>
