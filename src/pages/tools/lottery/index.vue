<template>
  <view class="page">
    <view class="card">
      <text class="label">选项（每行一个）</text>
      <textarea class="options-input" v-model="optionsText" placeholder="每行输入一个选项&#10;例如：&#10;张三&#10;李四&#10;王五" maxlength="500" />
      <view class="quick-tips">
        <text class="quick-tip" @tap="fillDemo">示例</text>
        <text class="quick-tip" @tap="optionsText = ''">清空</text>
      </view>
    </view>

    <view class="card draw-card">
      <view class="draw-display" :class="{ 'draw-display--rolling': rolling }">
        <text class="draw-result">{{ display }}</text>
      </view>
      <button class="btn" :class="{ 'btn--disabled': rolling || !options.length }" @tap="draw">
        {{ rolling ? '抽取中...' : '开始抽取' }}
      </button>
    </view>

    <view v-if="history.length" class="card">
      <text class="history-title">抽取记录</text>
      <view v-for="(item, i) in history" :key="i" class="history-item">
        <text class="history-time">{{ item.time }}</text>
        <text class="history-val">{{ item.val }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { showToast } from '@/utils/helpers'

const optionsText = ref('')
const rolling = ref(false)
const display = ref('?')
const history = ref([])
let timer = null

const options = computed(() => {
  return optionsText.value.split('\n').map(s => s.trim()).filter(Boolean)
})

function fillDemo() {
  optionsText.value = '张三\n李四\n王五\n赵六\n孙七'
}

function draw() {
  if (rolling.value) return
  const opts = options.value
  if (opts.length < 2) {
    showToast('请至少输入 2 个选项')
    return
  }
  rolling.value = true
  display.value = '?'
  const finalIdx = Math.floor(Math.random() * opts.length)
  let ticks = 0
  const total = 15 + Math.floor(Math.random() * 8)

  timer = setInterval(() => {
    ticks++
    display.value = opts[Math.floor(Math.random() * opts.length)]
    if (ticks >= total) {
      clearInterval(timer)
      timer = null
      rolling.value = false
      display.value = opts[finalIdx]
      const now = new Date()
      history.value.unshift({
        time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`,
        val: opts[finalIdx]
      })
      if (history.value.length > 10) history.value = history.value.slice(0, 10)
    }
  }, 80)
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
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
.label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 16rpx;
}
.options-input {
  width: 100%;
  min-height: 220rpx;
  background: #F5F5F7;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #1D1D1F;
  box-sizing: border-box;
  line-height: 1.6;
}
.quick-tips {
  display: flex;
  gap: 24rpx;
  margin-top: 12rpx;
}
.quick-tip {
  font-size: 24rpx;
  color: #007AFF;
  &:active { opacity: 0.6; }
}
.draw-card { text-align: center; }
.draw-display {
  background: #F5F5F7;
  border-radius: 24rpx;
  padding: 60rpx 0;
  margin-bottom: 20rpx;
  &--rolling { background: #1D1D1F; .draw-result { color: #FF9500; } }
}
.draw-result {
  font-size: 72rpx;
  font-weight: 700;
  color: #1D1D1F;
}
.btn {
  width: 100%;
  background: #1D1D1F;
  color: #fff;
  border: none;
  border-radius: 16rpx;
  padding: 20rpx 0;
  font-size: 30rpx;
  &:active { opacity: 0.8; }
  &--disabled { background: #C7C7CC; &:active { opacity: 1; } }
}
.history-title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 12rpx;
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
</style>
