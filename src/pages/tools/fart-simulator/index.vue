<template>
  <view class="fs">
    <view class="fs__header">
      <text class="fs__title">放屁模拟器</text>
      <text class="fs__subtitle">点击按钮，选择你的屁声</text>
    </view>

    <view class="fs__grid">
      <view v-for="s in sounds" :key="s.id" class="fs__item" :class="{ 'fs__item--active': playingId === s.id }" @tap="play(s)">
        <text class="fs__item-emoji">{{ s.emoji }}</text>
        <text class="fs__item-name">{{ s.name }}</text>
        <text class="fs__item-desc">{{ s.desc }}</text>
      </view>
    </view>

    <view v-if="history.length" class="fs__history">
      <text class="fs__history-title">最近播放</text>
      <view class="fs__history-list">
        <text v-for="(h, i) in history" :key="i" class="fs__history-item">{{ h }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

const sounds = [
  { id: 'loud', name: '响屁', emoji: '🔊', desc: '震天响', file: '/static/audio/fart-loud.mp3' },
  { id: 'silent', name: '闷屁', emoji: '🤫', desc: '悄无声息', file: '/static/audio/fart-silent.mp3' },
  { id: 'long', name: '长屁', emoji: '📏', desc: '绵延不绝', file: '/static/audio/fart-long.mp3' },
  { id: 'chain', name: '连环屁', emoji: '🔗', desc: '一连串', file: '/static/audio/fart-chain.mp3' },
  { id: 'wet', name: '水屁', emoji: '💧', desc: '带水花', file: '/static/audio/fart-wet.mp3' },
  { id: 'ripcord', name: '撕裂屁', emoji: '🎸', desc: '撕裂声', file: '/static/audio/fart-ripcord.mp3' },
]

const playingId = ref(null)
const history = ref([])
let audio = null
let playTimer = null

function ensureAudio() {
  if (audio) return
  try {
    audio = uni.createInnerAudioContext()
    audio.loop = false
  } catch (e) {}
}

function play(sound) {
  ensureAudio()
  try {
    audio.stop()
  } catch (e) {}
  audio.src = sound.file
  playingId.value = sound.id
  try {
    audio.play()
  } catch (e) {}
  try {
    uni.vibrateShort({ type: 'medium' })
  } catch (e) {}
  history.value.unshift(sound.emoji + ' ' + sound.name)
  if (history.value.length > 5) history.value.pop()
  if (playTimer) clearTimeout(playTimer)
  playTimer = setTimeout(() => { playingId.value = null }, 1500)
}

onUnmounted(() => {
  try { audio && audio.destroy() } catch (e) {}
  if (playTimer) clearTimeout(playTimer)
})
</script>

<style lang="scss" scoped>
.fs {
  min-height: 100vh;
  background: #1A1A1A;
  padding: 32rpx;

  &__header {
    text-align: center;
    margin-bottom: 48rpx;
    padding-top: 32rpx;
  }
  &__title { font-size: 40rpx; font-weight: 700; color: #FFF; display: block; }
  &__subtitle { font-size: 24rpx; color: rgba(255,255,255,0.4); margin-top: 8rpx; display: block; }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24rpx;
  }
  &__item {
    background: rgba(255,255,255,0.06);
    border-radius: 24rpx;
    padding: 32rpx 20rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    transition: all 0.15s;
    &--active {
      background: rgba(212,175,55,0.2);
      transform: scale(0.95);
    }
    &:active { opacity: 0.7; transform: scale(0.95); }
  }
  &__item-emoji { font-size: 56rpx; }
  &__item-name { font-size: 28rpx; font-weight: 600; color: #FFF; }
  &__item-desc { font-size: 22rpx; color: rgba(255,255,255,0.4); }

  &__history {
    margin-top: 48rpx;
    padding: 24rpx;
    background: rgba(255,255,255,0.04);
    border-radius: 16rpx;
  }
  &__history-title { font-size: 24rpx; color: rgba(255,255,255,0.3); margin-bottom: 16rpx; display: block; }
  &__history-list { display: flex; flex-wrap: wrap; gap: 12rpx; }
  &__history-item {
    font-size: 22rpx;
    color: rgba(255,255,255,0.5);
    background: rgba(255,255,255,0.06);
    padding: 8rpx 20rpx;
    border-radius: 20rpx;
  }
}
</style>
