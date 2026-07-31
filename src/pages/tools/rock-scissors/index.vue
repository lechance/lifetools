<template>
  <view class="page">
    <view class="card score-card">
      <view class="score-item">
        <text class="score-num">{{ win }}</text>
        <text class="score-label">胜</text>
      </view>
      <view class="score-item">
        <text class="score-num">{{ lose }}</text>
        <text class="score-label">负</text>
      </view>
      <view class="score-item">
        <text class="score-num">{{ draw }}</text>
        <text class="score-label">平</text>
      </view>
    </view>

    <view class="card arena-card">
      <view class="fighter">
        <text class="fighter-label">电脑</text>
        <text class="fighter-icon">{{ computerChoice ? CHOICES[computerChoice].icon : '❓' }}</text>
        <text class="fighter-name">{{ computerChoice ? CHOICES[computerChoice].name : '等待出招' }}</text>
      </view>
      <text class="vs">VS</text>
      <view class="fighter">
        <text class="fighter-label">你</text>
        <text class="fighter-icon">{{ playerChoice ? CHOICES[playerChoice].icon : '❓' }}</text>
        <text class="fighter-name">{{ playerChoice ? CHOICES[playerChoice].name : '请选择' }}</text>
      </view>
    </view>

    <view v-if="resultText" class="card result-card" :class="resultClass">
      <text class="result-text">{{ resultText }}</text>
    </view>

    <view class="card">
      <text class="label">出招</text>
      <view class="choices">
        <view v-for="c in choiceList" :key="c.key" class="choice-btn" @tap="play(c.key)">
          <text class="choice-icon">{{ c.icon }}</text>
          <text class="choice-name">{{ c.name }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const CHOICES = {
  rock: { icon: '✊', name: '石头', beats: 'scissors' },
  scissors: { icon: '✌️', name: '剪刀', beats: 'paper' },
  paper: { icon: '✋', name: '布', beats: 'rock' },
}
const choiceList = Object.entries(CHOICES).map(([key, val]) => ({ key, ...val }))

const playerChoice = ref('')
const computerChoice = ref('')
const win = ref(0)
const lose = ref(0)
const draw = ref(0)

const resultText = computed(() => {
  if (!playerChoice.value || !computerChoice.value) return ''
  if (playerChoice.value === computerChoice.value) return '平局'
  if (CHOICES[playerChoice.value].beats === computerChoice.value) return '你赢了！🎉'
  return '你输了'
})

const resultClass = computed(() => {
  if (!playerChoice.value || !computerChoice.value) return ''
  if (playerChoice.value === computerChoice.value) return 'is-draw'
  if (CHOICES[playerChoice.value].beats === computerChoice.value) return 'is-win'
  return 'is-lose'
})

function play(key) {
  playerChoice.value = key
  const keys = Object.keys(CHOICES)
  computerChoice.value = keys[Math.floor(Math.random() * keys.length)]

  if (playerChoice.value === computerChoice.value) draw.value++
  else if (CHOICES[playerChoice.value].beats === computerChoice.value) win.value++
  else lose.value++
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
.score-card {
  display: flex;
  padding: 20rpx 0;
}
.score-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}
.score-num {
  font-size: 44rpx;
  font-weight: 700;
  font-family: monospace;
  color: #1D1D1F;
}
.score-label { font-size: 22rpx; color: #C7C7CC; }
.arena-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.fighter {
  flex: 1;
  text-align: center;
}
.fighter-label { font-size: 24rpx; color: #86868B; }
.fighter-icon {
  display: block;
  font-size: 100rpx;
  padding: 20rpx 0;
}
.fighter-name { font-size: 26rpx; color: #1D1D1F; }
.vs {
  font-size: 36rpx;
  font-weight: 700;
  color: #FF9500;
  padding: 0 20rpx;
}
.result-card {
  text-align: center;
  padding: 20rpx;
  &.is-win { background: #EFFBF2; }
  &.is-lose { background: #FFEFED; }
  &.is-draw { background: #F5F5F7; }
}
.result-text {
  font-size: 36rpx;
  font-weight: 700;
  &.is-win { color: #34C759; }
  &.is-lose { color: #FF3B30; }
  &.is-draw { color: #86868B; }
}
.label {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 20rpx;
}
.choices {
  display: flex;
  gap: 20rpx;
}
.choice-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 24rpx 0;
  background: #F5F5F7;
  border-radius: 16rpx;
  &:active { transform: scale(0.95); }
}
.choice-icon { font-size: 72rpx; }
.choice-name { font-size: 26rpx; color: #3A3A3C; }
</style>
