<template>
  <view class="page">
    <view class="card">
      <view class="dice-row">
        <view
          v-for="(d, i) in dice"
          :key="rollKey + '-' + i"
          class="dice"
          :class="{ 'dice--rolling': rolling, 'dice--settle': !rolling && hasRolled }"
          :style="{ animationDelay: (i * 70) + 'ms' }"
        >
          <view class="dice-face">
            <view v-for="(pos, pi) in dotPositions(d)" :key="pi" class="dice-dot" :class="'dice-dot--' + pos"></view>
          </view>
        </view>
      </view>
      <view class="total" v-if="dice.length > 1">合计：{{ total }}</view>

      <view class="count-row">
        <text class="count-label">骰子数</text>
        <view class="count-btn" :class="{ 'count-btn--disabled': rolling || dice.length <= 1 }" @tap="decreaseCount">−</view>
        <text class="count-val">{{ dice.length }} 个</text>
        <view class="count-btn" :class="{ 'count-btn--disabled': rolling || dice.length >= MAX_DICE }" @tap="increaseCount">+</view>
        <view class="count-btn count-btn--reset" :class="{ 'count-btn--disabled': rolling }" @tap="resetCount">重置</view>
      </view>

      <view class="controls">
        <view class="ctrl-btn" @tap="roll">{{ rolling ? '掷骰中...' : '掷骰子' }}</view>
      </view>
    </view>

    <view class="card">
      <text class="history-title">历史记录</text>
      <view v-if="history.length === 0" class="history-empty">暂无记录</view>
      <view v-for="(item, i) in history" :key="i" class="history-item">
        <text class="history-time">{{ item.time }}</text>
        <text class="history-val">{{ item.val }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

const MAX_DICE = 6

const dice = ref([1])
const rolling = ref(false)
const hasRolled = ref(false)
const history = ref([])
const rollKey = ref(0)
let timer = null

const total = computed(() => dice.value.reduce((a, b) => a + b, 0))

// 骰子点数对应的 3x3 网格位置（tl/tc/tr/ml/mc/mr/bl/bc/br）
const DOT_POSITIONS = {
  1: ['mc'],
  2: ['tl', 'br'],
  3: ['tl', 'mc', 'br'],
  4: ['tl', 'tr', 'bl', 'br'],
  5: ['tl', 'tr', 'mc', 'bl', 'br'],
  6: ['tl', 'ml', 'bl', 'tr', 'mr', 'br'],
}
function dotPositions(val) {
  return DOT_POSITIONS[val] || ['mc']
}

// ========== 音效（H5 / mp-weixin 均支持的内置音频） ==========
let shakeAudio = null
let landAudio = null

function ensureAudio() {
  if (shakeAudio) return
  try {
    shakeAudio = uni.createInnerAudioContext()
    shakeAudio.src = '/static/audio/dice-shake.mp3'
    shakeAudio.loop = true
    landAudio = uni.createInnerAudioContext()
    landAudio.src = '/static/audio/dice-land.mp3'
    landAudio.loop = false
  } catch (e) {}
}

function playShake() {
  ensureAudio()
  try { shakeAudio.play() } catch (e) {}
}

function stopShake() {
  if (!shakeAudio) return
  try { shakeAudio.stop() } catch (e) {}
}

function playLand() {
  ensureAudio()
  try { landAudio.play() } catch (e) {}
}

function roll() {
  if (rolling.value) return
  rolling.value = true
  rollKey.value++
  playShake()

  const final = dice.value.map(() => Math.floor(Math.random() * 6) + 1)
  const total = 15 + Math.floor(Math.random() * 8)
  let ticks = 0

  timer = setInterval(() => {
    dice.value = dice.value.map(() => Math.floor(Math.random() * 6) + 1)
    ticks++
    if (ticks >= total) {
      clearInterval(timer)
      timer = null
      dice.value = final
      stopShake()
      playLand()
      rolling.value = false
      hasRolled.value = true
      const now = new Date()
      history.value.unshift({
        time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`,
        val: final.join(' + ') + (final.length > 1 ? ` = ${final.reduce((a,b)=>a+b,0)}` : '')
      })
      if (history.value.length > 10) history.value = history.value.slice(0, 10)
    }
  }, 80)
}

// ========== 骰子数量调节（1-6） ==========
function increaseCount() {
  if (rolling.value || dice.value.length >= MAX_DICE) return
  dice.value = [...dice.value, 1]
}

function decreaseCount() {
  if (rolling.value || dice.value.length <= 1) return
  dice.value = dice.value.slice(0, -1)
}

function resetCount() {
  if (rolling.value) return
  dice.value = [1]
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
  try { shakeAudio && shakeAudio.destroy() } catch (e) {}
  try { landAudio && landAudio.destroy() } catch (e) {}
})
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
// 骰子容器：透视视口，配合子骰子 3D 翻滚
.dice-row {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 32rpx;
  padding: 40rpx 0;
  perspective: 900px;
}
.dice {
  width: 160rpx;
  height: 160rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.15);
  border: 3rpx solid #E5E5EA;

  // 滚动中：3D 翻滚 + 弹跳抖动（各骰子按 animation-delay 错峰）
  &--rolling {
    animation: diceRoll 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite;
  }
  // 落定：缩放回弹
  &--settle {
    animation: diceSettle 0.35s ease;
  }
}
.dice-face {
  width: 100%;
  height: 100%;
  position: relative;
  padding: 20rpx;
  box-sizing: border-box;
  transform-style: preserve-3d;
}
.dice-dot {
  position: absolute;
  width: 28rpx;
  height: 28rpx;
  background: #1D1D1F;
  border-radius: 50%;
}
// 点阵位置（3x3 网格）
.dice-dot--tl { top: 20%; left: 20%; }
.dice-dot--tc { top: 20%; left: 50%; transform: translateX(-50%); }
.dice-dot--tr { top: 20%; right: 20%; }
.dice-dot--ml { top: 50%; left: 20%; transform: translateY(-50%); }
.dice-dot--mc { top: 50%; left: 50%; transform: translate(-50%, -50%); }
.dice-dot--mr { top: 50%; right: 20%; transform: translateY(-50%); }
.dice-dot--bl { bottom: 20%; left: 20%; }
.dice-dot--bc { bottom: 20%; left: 50%; transform: translateX(-50%); }
.dice-dot--br { bottom: 20%; right: 20%; }

.total {
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #1D1D1F;
  padding-bottom: 24rpx;
}

// 骰子数量调节行
.count-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
}
.count-label {
  font-size: 26rpx;
  color: #3A3A3C;
  margin-right: 4rpx;
}
.count-btn {
  min-width: 72rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F5F7;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #1D1D1F;
  padding: 0 20rpx;
  box-sizing: border-box;
  &:active { opacity: 0.7; }
  &--reset { font-size: 24rpx; color: #fff; background: #1D1D1F; }
  &--disabled { opacity: 0.35; }
}
.count-val {
  min-width: 76rpx;
  font-size: 26rpx;
  color: #1D1D1F;
  font-weight: 600;
  text-align: center;
}

.controls {
  display: flex;
  gap: 16rpx;
}
.ctrl-btn {
  flex: 1;
  background: #1D1D1F;
  color: #fff;
  padding: 20rpx 0;
  border-radius: 16rpx;
  font-size: 30rpx;
  text-align: center;
  &:active { opacity: 0.8; }
}
.history-title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 12rpx;
}
.history-empty {
  text-align: center;
  font-size: 24rpx;
  color: #C7C7CC;
  padding: 20rpx 0;
}
.history-item {
  display: flex;
  justify-content: space-between;
  padding: 10rpx 0;
  border-bottom: 1rpx solid #F5F5F7;
  &:last-child { border-bottom: none; }
}
.history-time { font-size: 24rpx; color: #C7C7CC; }
.history-val { font-size: 28rpx; color: #1D1D1F; font-weight: 500; }

// 滚动：3D 翻转 + 上下弹跳抖动
@keyframes diceRoll {
  0%   { transform: rotateX(0) rotateY(0) rotateZ(0) scale(1) translateY(0); }
  20%  { transform: rotateX(90deg) rotateY(140deg) rotateZ(-7deg) scale(1.14) translateY(-14rpx); }
  40%  { transform: rotateX(180deg) rotateY(280deg) rotateZ(7deg) scale(0.9) translateY(8rpx); }
  60%  { transform: rotateX(270deg) rotateY(420deg) rotateZ(-6deg) scale(1.08) translateY(-10rpx); }
  80%  { transform: rotateX(360deg) rotateY(560deg) rotateZ(5deg) scale(0.94) translateY(5rpx); }
  100% { transform: rotateX(450deg) rotateY(700deg) rotateZ(0) scale(1) translateY(0); }
}

// 落定：缩放回弹
@keyframes diceSettle {
  0%   { transform: scale(1.25); }
  55%  { transform: scale(0.9); }
  100% { transform: scale(1); }
}
</style>
