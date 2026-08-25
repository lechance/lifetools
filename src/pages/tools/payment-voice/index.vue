<template>
<view class="pv">
  <view class="pv__header">
    <text class="pv__title">模拟到帐语音</text>
    <text class="pv__subtitle">假装有人给你转了钱</text>
  </view>

  <view class="pv__card">
    <view class="pv__platforms">
      <view class="pv__platform" :class="{ 'pv__platform--active': platform === 'alipay' }" @tap="platform = 'alipay'">
        <text class="pv__platform-name">支付宝</text>
      </view>
      <view class="pv__platform" :class="{ 'pv__platform--active': platform === 'wechat' }" @tap="platform = 'wechat'">
        <text class="pv__platform-name">微信</text>
      </view>
    </view>
  </view>

  <view class="pv__card">
    <text class="pv__label">输入金额</text>
    <view class="pv__input-wrap">
      <text class="pv__input-prefix">¥</text>
      <input class="pv__input" type="digit" :value="amount" @input="onAmountInput" placeholder="0.00" />
    </view>
    <view class="pv__presets">
      <view v-for="p in presets" :key="p" class="pv__preset" :class="{ 'pv__preset--active': amount === p }" @tap="amount = p">
        <text class="pv__preset-text">¥{{ p }}</text>
      </view>
    </view>
  </view>

  <view class="pv__card">
    <text class="pv__label">播放次数</text>
    <view class="pv__counts">
      <view v-for="c in counts" :key="c" class="pv__count" :class="{ 'pv__count--active': repeatCount === c }" @tap="repeatCount = c">
        <text class="pv__count-text">{{ c }}次</text>
      </view>
    </view>
  </view>

  <view class="pv__play-wrap">
    <view class="pv__play-btn" :class="{ 'pv__play-btn--active': isPlaying }" @tap="playVoice">
      <text class="pv__play-icon">{{ isPlaying ? '⏸' : '▶' }}</text>
      <text class="pv__play-text">{{ isPlaying ? '播放中...' : '播放到帐语音' }}</text>
    </view>
  </view>

  <view class="pv__preview" v-if="amount">
    <text class="pv__preview-text">"{{ platformName }}到帐{{ amount }}元"</text>
  </view>
</view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

const platform = ref('alipay')
const amount = ref('100')
const repeatCount = ref(1)
const isPlaying = ref(false)
const presets = ['0.01', '1', '10', '50', '100', '1000']
const counts = [1, 3, 5, 10]

const platformName = computed(() => platform.value === 'alipay' ? '支付宝' : '微信')

let audio = null
let playTimer = null
let playCount = 0

function ensureAudio() {
  if (audio) return
  try {
    audio = uni.createInnerAudioContext()
    audio.loop = false
  } catch (e) {}
}

function onAmountInput(e) {
  amount.value = e.detail.value
}

function playVoice() {
  if (isPlaying.value) return
  const amt = parseFloat(amount.value)
  if (isNaN(amt) || amt <= 0) {
    try { uni.showToast({ title: '请输入有效金额', icon: 'none' }) } catch (e) {}
    return
  }
  ensureAudio()
  isPlaying.value = true
  playCount = 0
  try { uni.vibrateShort({ type: 'light' }) } catch (e) {}
  playNext()
}

function playNext() {
  if (playCount >= repeatCount.value) {
    isPlaying.value = false
    return
  }
  playCount++
  const file = playCount % 2 === 1 ? '/static/audio/pay-ding.mp3' : '/static/audio/pay-complete.mp3'
  audio.src = file
  try { audio.play() } catch (e) {}
  if (playTimer) clearTimeout(playTimer)
  playTimer = setTimeout(() => {
    if (playCount < repeatCount.value) playNext()
    else isPlaying.value = false
  }, 1200)
}

onUnmounted(() => {
  try { audio && audio.destroy() } catch (e) {}
  if (playTimer) clearTimeout(playTimer)
})
</script>

<style lang="scss" scoped>
.pv {
  min-height: 100vh;
  background: #F5F5F7;
  padding: 24rpx;

  &__header { text-align: center; margin-bottom: 32rpx; padding-top: 24rpx; }
  &__title { font-size: 36rpx; font-weight: 700; color: #1D1D1F; display: block; }
  &__subtitle { font-size: 24rpx; color: #8E8E93; margin-top: 8rpx; display: block; }

  &__card {
    background: #fff;
    border-radius: 20rpx;
    padding: 28rpx;
    box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
    margin-bottom: 24rpx;
  }
  &__label { font-size: 26rpx; color: #8E8E93; margin-bottom: 16rpx; display: block; font-weight: 500; }

  &__platforms { display: flex; gap: 16rpx; }
  &__platform {
    flex: 1; height: 80rpx; border-radius: 12rpx;
    background: #F5F5F7; display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
    &--active { background: #1D1D1F; }
    &--active &__platform-name { color: #fff; }
    &:active { opacity: 0.7; }
  }
  &__platform-name { font-size: 28rpx; color: #3A3A3C; }

  &__input-wrap {
    display: flex; align-items: center;
    background: #F5F5F7; border-radius: 12rpx;
    padding: 0 20rpx; height: 88rpx;
    margin-bottom: 20rpx;
  }
  &__input-prefix { font-size: 36rpx; font-weight: 700; color: #1D1D1F; margin-right: 12rpx; }
  &__input { flex: 1; font-size: 40rpx; font-weight: 600; color: #1D1D1F; }

  &__presets { display: flex; flex-wrap: wrap; gap: 12rpx; }
  &__preset {
    padding: 12rpx 24rpx; border-radius: 20rpx;
    background: #F5F5F7;
    &--active { background: #E8F5E9; }
    &:active { opacity: 0.7; }
  }
  &__preset-text { font-size: 24rpx; color: #3A3A3C; }
  &__preset--active &__preset-text { color: #2E7D32; font-weight: 600; }

  &__counts { display: flex; gap: 16rpx; }
  &__count {
    flex: 1; height: 72rpx; border-radius: 12rpx;
    background: #F5F5F7; display: flex; align-items: center; justify-content: center;
    &--active { background: #1D1D1F; }
    &--active &__count-text { color: #fff; }
    &:active { opacity: 0.7; }
  }
  &__count-text { font-size: 26rpx; color: #3A3A3C; }

  &__play-wrap { padding: 16rpx 0; }
  &__play-btn {
    height: 96rpx; border-radius: 48rpx;
    background: linear-gradient(135deg, #4CAF50, #2E7D32);
    display: flex; align-items: center; justify-content: center; gap: 12rpx;
    transition: all 0.2s;
    &--active { opacity: 0.7; }
    &:active { transform: scale(0.97); }
  }
  &__play-icon { font-size: 36rpx; color: #fff; }
  &__play-text { font-size: 30rpx; font-weight: 600; color: #fff; }

  &__preview {
    text-align: center;
    margin-top: 8rpx;
  }
  &__preview-text { font-size: 28rpx; color: #8E8E93; font-style: italic; }
}
</style>
