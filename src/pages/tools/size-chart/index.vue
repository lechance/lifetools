<template>
  <view class="page">
    <view class="tabs">
      <view v-for="(t, i) in tabs" :key="i" class="tab" :class="{ 'tab--active': tab === i }" @tap="tab = i">{{ t }}</view>
    </view>

    <!-- 服装尺码 -->
    <view v-show="tab === 0" class="tab-body">
      <view class="card">
        <view class="row">
          <text class="label">身高 (cm)</text>
          <input class="input" type="number" v-model="height" placeholder="如 172" />
        </view>
        <button class="btn" @tap="recommendClothes">推荐尺码</button>
        <view v-if="clothesSuggestion" class="suggestion">
          <text class="suggestion-text">推荐：{{ clothesSuggestion }}</text>
        </view>
      </view>
      <view class="card">
        <text class="title">男装尺码对照</text>
        <view class="table-row" v-for="r in clothesTable" :key="r.size">
          <text class="table-size">{{ r.size }}</text>
          <text class="table-val">{{ r.height }}</text>
        </view>
      </view>
    </view>

    <!-- 鞋码 -->
    <view v-show="tab === 1" class="tab-body">
      <view class="card">
        <view class="row">
          <text class="label">脚长 (cm)</text>
          <input class="input" type="digit" v-model="footLen" placeholder="如 25.5" />
        </view>
        <button class="btn" @tap="recommendShoe">推荐鞋码</button>
        <view v-if="shoeSuggestion" class="suggestion">
          <text class="suggestion-text">推荐：欧码 {{ shoeSuggestion }}</text>
        </view>
      </view>
      <view class="card">
        <text class="title">鞋码对照（欧码/中国码）</text>
        <view class="table-row" v-for="r in shoeTable" :key="r.eu">
          <text class="table-size">EU {{ r.eu }}</text>
          <text class="table-val">脚长 {{ r.cm }} cm</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from '@/utils/helpers'

const tabs = ['服装尺码', '鞋码']
const tab = ref(0)

const clothesTable = [
  { size: 'S', height: '165cm 以下' },
  { size: 'M', height: '165 - 175cm' },
  { size: 'L', height: '175 - 185cm' },
  { size: 'XL', height: '185 - 195cm' },
  { size: 'XXL', height: '195cm 以上' },
]

const shoeTable = [
  { eu: 36, cm: '23.0' }, { eu: 37, cm: '23.5' }, { eu: 38, cm: '24.0' },
  { eu: 39, cm: '24.5' }, { eu: 40, cm: '25.0' }, { eu: 41, cm: '25.5' },
  { eu: 42, cm: '26.0' }, { eu: 43, cm: '26.5' }, { eu: 44, cm: '27.0' },
  { eu: 45, cm: '27.5' }, { eu: 46, cm: '28.0' },
]

const height = ref('')
const footLen = ref('')
const clothesSuggestion = ref('')
const shoeSuggestion = ref('')

function recommendClothes() {
  const h = parseFloat(height.value)
  if (!h) { showToast('请输入身高'); return }
  if (h < 165) clothesSuggestion.value = 'S'
  else if (h < 175) clothesSuggestion.value = 'M'
  else if (h < 185) clothesSuggestion.value = 'L'
  else if (h < 195) clothesSuggestion.value = 'XL'
  else clothesSuggestion.value = 'XXL'
}

function recommendShoe() {
  const cm = parseFloat(footLen.value)
  if (!cm) { showToast('请输入脚长'); return }
  const eu = Math.round((cm - 23.0) / 0.5) + 36
  shoeSuggestion.value = Math.max(34, Math.min(48, eu))
}
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
  background: #F5F5F7;
}
.tabs {
  display: flex;
  background: #fff;
  border-bottom: 1rpx solid #E5E5EA;
  position: sticky;
  top: 0;
  z-index: 10;
}
.tab {
  flex: 1;
  text-align: center;
  font-size: 28rpx;
  color: #86868B;
  padding: 24rpx 0 20rpx;
  border-bottom: 3rpx solid transparent;
  &:active { opacity: 0.6; }
  &--active {
    color: #1D1D1F;
    font-weight: 600;
    border-bottom-color: #1D1D1F;
  }
}
.tab-body { padding: 24rpx; }
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
  padding: 8rpx 0;
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
  margin-top: 20rpx;
  background: #1D1D1F;
  color: #fff;
  border: none;
  border-radius: 16rpx;
  padding: 18rpx 0;
  font-size: 28rpx;
  &:active { opacity: 0.8; }
}
.suggestion {
  margin-top: 20rpx;
  text-align: center;
  background: #EFFBF2;
  border-radius: 12rpx;
  padding: 20rpx;
}
.suggestion-text { font-size: 32rpx; font-weight: 700; color: #34C759; }
.title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 12rpx;
}
.table-row {
  display: flex;
  justify-content: space-between;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #F5F5F7;
  &:last-child { border-bottom: none; }
}
.table-size { font-size: 28rpx; font-weight: 600; color: #1D1D1F; }
.table-val { font-size: 26rpx; color: #86868B; }
</style>
