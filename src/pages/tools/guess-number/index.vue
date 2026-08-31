<template>
  <view class="page">
    <view class="card">
      <view class="range-display">
        <text class="range-num">{{ min }}</text>
        <text class="range-sep">~</text>
        <text class="range-num">{{ max }}</text>
      </view>
      <text class="range-tip">猜一个 {{ min }} 到 {{ max }} 之间的数字，剩余尝试 {{ maxAttempts - attempts }}</text>
    </view>

    <view class="card input-card">
      <input class="input" type="number" v-model="guess" :disabled="won || lost" placeholder="输入你的猜测" @confirm="submit" />
      <view class="submit-btn" :class="{ 'submit-btn--disabled': won || lost }" @tap="submit">猜</view>
    </view>

    <view v-if="won || lost" class="card end-card" :class="{ 'end-card--win': won }">
      <text class="end-text">{{ won ? `🎉 恭喜猜中！用了 ${attempts} 次` : '😅 机会用完了' }}</text>
      <view class="restart-btn" @tap="restart">重新开始</view>
    </view>

    <view v-if="logs.length" class="card">
      <view v-for="(log, i) in logs" :key="i" class="log-item">
        <text class="log-num">{{ log.num }}</text>
        <text class="log-result" :class="{ 'log-result--high': log.dir === 'down', 'log-result--low': log.dir === 'up', 'log-result--win': log.dir === 'win' }">
          {{ log.text }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from '@/utils/helpers'

const min = ref(1)
const max = ref(100)
const secret = ref(0)
const attempts = ref(0)
const maxAttempts = 7
const won = ref(false)
const lost = ref(false)
const guess = ref('')
const logs = ref([])

function restart() {
  min.value = 1
  max.value = 100
  secret.value = Math.floor(Math.random() * 100) + 1
  attempts.value = 0
  won.value = false
  lost.value = false
  guess.value = ''
  logs.value = []
}

function submit() {
  if (won.value || lost.value) return
  const val = parseInt(guess.value, 10)
  if (!val || isNaN(val)) {
    showToast('请输入数字')
    return
  }
  if (val < min.value || val > max.value) {
    showToast(`请输入 ${min.value}~${max.value} 之间的数字`)
    return
  }
  attempts.value++
  if (val === secret.value) {
    won.value = true
    logs.value.unshift({ num: val, dir: 'win', text: '猜中了！' })
  } else if (val < secret.value) {
    min.value = val + 1
    logs.value.unshift({ num: val, dir: 'up', text: '小了' })
    if (attempts.value >= maxAttempts) { lost.value = true; revealSecret() }
  } else {
    max.value = val - 1
    logs.value.unshift({ num: val, dir: 'down', text: '大了' })
    if (attempts.value >= maxAttempts) { lost.value = true; revealSecret() }
  }
  guess.value = ''
}

function revealSecret() {
  logs.value.unshift({ num: secret.value, dir: 'win', text: '正确答案' })
}

// 初始化
secret.value = Math.floor(Math.random() * 100) + 1
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
.range-display {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 24rpx;
}
.range-num {
  font-size: 72rpx;
  font-weight: 700;
  font-family: monospace;
  color: #1D1D1F;
}
.range-sep { font-size: 40rpx; color: #C7C7CC; }
.range-tip {
  display: block;
  text-align: center;
  font-size: 24rpx;
  color: #86868B;
  padding-top: 12rpx;
}
.input-card {
  display: flex;
  gap: 16rpx;
  align-items: center;
}
.input {
  flex: 1;
  background: #F5F5F7;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  font-size: 32rpx;
  color: #1D1D1F;
}
.submit-btn {
  background: #1D1D1F;
  color: #fff;
  padding: 16rpx 40rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  &:active { opacity: 0.8; }
  &--disabled { background: #C7C7CC; }
}
.end-card {
  text-align: center;
  &.end-card--win { background: #EFFBF2; }
}
.end-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #1D1D1F;
}
.restart-btn {
  margin-top: 20rpx;
  background: #1D1D1F;
  color: #fff;
  padding: 16rpx 0;
  border-radius: 12rpx;
  font-size: 28rpx;
  &:active { opacity: 0.8; }
}
.log-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10rpx 0;
  border-bottom: 1rpx solid #F5F5F7;
  &:last-child { border-bottom: none; }
}
.log-num {
  font-size: 28rpx;
  font-weight: 600;
  font-family: monospace;
  color: #1D1D1F;
}
.log-result { font-size: 26rpx; }
.log-result--high { color: #FF3B30; }
.log-result--low { color: #007AFF; }
.log-result--win { color: #34C759; font-weight: 600; }
</style>
