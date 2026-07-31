<template>
  <view class="page">
    <view class="card">
      <view class="dice-row">
        <view v-for="(d, i) in dice" :key="i" class="dice" :class="{ 'dice--rolling': rolling }">
          <view class="dice-face">
            <view v-for="n in d" :key="n" class="dice-dot" :class="'dice-dot--' + n"></view>
          </view>
        </view>
      </view>
      <view class="total" v-if="dice.length > 1">合计：{{ total }}</view>
      <view class="controls">
        <view class="ctrl-btn" @tap="roll">掷骰子</view>
        <view class="ctrl-btn ctrl-btn--ghost" @tap="toggleCount">{{ dice.length }} 个</view>
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
import { ref, computed } from 'vue'

const dice = ref([1])
const rolling = ref(false)
const history = ref([])

const total = computed(() => dice.value.reduce((a, b) => a + b, 0))

function roll() {
  if (rolling.value) return
  rolling.value = true
  let ticks = 0
  const final = dice.value.map(() => Math.floor(Math.random() * 6) + 1)
  const timer = setInterval(() => {
    dice.value = dice.value.map(() => Math.floor(Math.random() * 6) + 1)
    ticks++
    if (ticks >= 10) {
      clearInterval(timer)
      dice.value = final
      rolling.value = false
      const now = new Date()
      history.value.unshift({
        time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`,
        val: final.join(' + ') + (final.length > 1 ? ` = ${final.reduce((a,b)=>a+b,0)}` : '')
      })
      if (history.value.length > 10) history.value = history.value.slice(0, 10)
    }
  }, 80)
}

function toggleCount() {
  if (rolling.value) return
  dice.value = dice.value.length === 1 ? [1, 1] : [1]
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
.dice-row {
  display: flex;
  justify-content: center;
  gap: 32rpx;
  padding: 32rpx 0;
}
.dice {
  width: 160rpx;
  height: 160rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.15);
  border: 3rpx solid #E5E5EA;
  &--rolling {
    animation: shake 0.08s infinite;
  }
}
.dice-face {
  width: 100%;
  height: 100%;
  position: relative;
  padding: 20rpx;
  box-sizing: border-box;
}
.dice-dot {
  position: absolute;
  width: 28rpx;
  height: 28rpx;
  background: #1D1D1F;
  border-radius: 50%;
}
// 点阵位置（3x3 网格）
.dice-dot--1 { top: 50%; left: 50%; transform: translate(-50%, -50%); }
.dice-dot--2 { top: 20%; left: 20%; }
.dice-dot--3 { top: 20%; left: 20%; }
.dice-dot--4 { top: 20%; left: 20%; }
.dice-dot--5 { top: 20%; left: 20%; }
.dice-dot--6 { top: 20%; left: 20%; }
.dice-dot--1:nth-child(1) { top: 20%; left: 20%; }
.dice-dot--2:nth-child(2) { top: 50%; left: 50%; transform: translate(-50%, -50%); }
.dice-dot--3:nth-child(3) { bottom: 20%; right: 20%; top: auto; left: auto; }
.dice-dot--4:nth-child(4) { top: 20%; right: 20%; left: auto; }
.dice-dot--5:nth-child(5) { top: 50%; left: 50%; transform: translate(-50%, -50%); }
.dice-dot--6:nth-child(6) { bottom: 20%; right: 20%; top: auto; left: auto; }

.total {
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #1D1D1F;
  padding-bottom: 24rpx;
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
  &--ghost { background: #F5F5F7; color: #3A3A3C; }
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

@keyframes shake {
  0% { transform: rotate(-3deg); }
  100% { transform: rotate(3deg); }
}
</style>
