/**
 * LED弹幕 - 重构版
 * 输入文字在LED屏幕滚动展示，支持调速、变色、方向、字号
 */
<template>
  <view class="led">
    <!-- 全屏模式 -->
    <view v-if="fullscreen" class="led__fullscreen" :style="{ background: bgColor }" @tap="exitFullscreen">
      <view class="led__marquee led__marquee--running" :style="marqueeStyle">
        <text class="led__text" :style="fullTextStyle">{{ displayText }}</text>
      </view>
      <text class="led__exit-hint">点击退出</text>
    </view>

    <!-- 普通模式 -->
    <template v-else>
      <!-- LED 预览 -->
      <view class="led__preview" :style="{ background: bgColor }">
        <view class="led__marquee led__marquee--running" :style="marqueeStyle">
          <text class="led__text" :style="previewTextStyle">{{ displayText || '输入文字预览' }}</text>
        </view>
        <view class="led__fullscreen-btn" @tap.stop="enterFullscreen">
          <text>⛶</text>
        </view>
      </view>

      <!-- 输入区 -->
      <view class="led__card">
        <view class="led__input-row">
          <input class="led__input" v-model="inputText" placeholder="输入弹幕文字..." maxlength="100"
            confirm-type="done" @confirm="handleShow" />
          <view class="led__btn" @tap="handleShow">显示</view>
        </view>
      </view>

      <!-- 预设 -->
      <view class="led__card led__card--padded">
        <text class="led__section-title">预设文本</text>
        <scroll-view class="led__tags" scroll-x show-scrollbar="false">
          <view v-for="(t, i) in presets" :key="i" class="led__tag" @tap="selectPreset(t)">
            <text>{{ t }}</text>
          </view>
        </scroll-view>
      </view>

      <!-- 控制面板 -->
      <view class="led__card led__card--padded led__card--last">
        <!-- 播放控制 -->
        <view class="led__ctrl-row">
          <view class="led__ctrl-btn led__ctrl-btn--play" @tap="togglePlay">
            <text class="led__ctrl-icon">{{ isRunning && !isPaused ? '⏸' : '▶' }}</text>
            <text class="led__ctrl-text">{{ isRunning && !isPaused ? '暂停' : '播放' }}</text>
          </view>
          <view class="led__ctrl-btn" @tap="stop">
            <text class="led__ctrl-icon">⏹</text>
            <text class="led__ctrl-text">停止</text>
          </view>
          <view class="led__ctrl-btn" :class="{ 'led__ctrl-btn--on': direction === 'left' }" @tap="direction = 'left'">
            <text class="led__ctrl-icon">←</text>
            <text class="led__ctrl-text">左移</text>
          </view>
          <view class="led__ctrl-btn" :class="{ 'led__ctrl-btn--on': direction === 'right' }" @tap="direction = 'right'">
            <text class="led__ctrl-icon">→</text>
            <text class="led__ctrl-text">右移</text>
          </view>
        </view>

        <!-- 速度 -->
        <view class="led__setting-row">
          <text class="led__setting-label">速度</text>
          <text class="led__setting-hint">慢</text>
          <slider class="led__slider" :value="speed" min="1" max="10" step="1"
            @change="onSpeedChange" activeColor="#1D1D1F" backgroundColor="#E5E5EA" block-size="14" />
          <text class="led__setting-hint">快</text>
          <text class="led__setting-value">{{ speedText }}</text>
        </view>

        <!-- 颜色 -->
        <view class="led__setting-row">
          <text class="led__setting-label">颜色</text>
          <view class="led__color-list">
            <view v-for="c in colors" :key="c.key"
              class="led__color-dot" :class="{ 'led__color-dot--active': colorKey === c.key }"
              :style="{ background: c.color }" @tap="selectColor(c)">
            </view>
          </view>
        </view>

        <!-- 字号 -->
        <view class="led__setting-row">
          <text class="led__setting-label">字号</text>
          <view class="led__size-list">
            <text v-for="s in sizes" :key="s.key"
              class="led__size-btn" :class="{ 'led__size-btn--active': sizeKey === s.key }"
              @tap="sizeKey = s.key">{{ s.label }}</text>
          </view>
          <text class="led__setting-value">{{ sizes.find(s => s.key === sizeKey.value).size }}</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const presets = [
  '🎉 新年快乐！', '❤️ 我喜欢你 💕', '生日快乐 🎂',
  '恭喜发财 🧧', '加油！💪', '你好世界 🌍',
  '欢迎光临 👋', '520 ❤️', '🎵 音乐响起 🎵', '圣诞快乐 🎄'
]

const colors = [
  { key: 'green',  color: '#39FF14', bg: '#0A0A0A' },
  { key: 'red',    color: '#FF1744', bg: '#0A0A0A' },
  { key: 'blue',   color: '#00B0FF', bg: '#0A0A0A' },
  { key: 'yellow', color: '#FFEA00', bg: '#0A0A0A' },
  { key: 'white',  color: '#FFFFFF', bg: '#0A0A0A' },
  { key: 'purple', color: '#D500F9', bg: '#0A0A0A' },
  { key: 'cyan',   color: '#00E5FF', bg: '#0A0A0A' },
  { key: 'pink',   color: '#FF4081', bg: '#0A0A0A' },
  { key: 'orange', color: '#FF9100', bg: '#0A0A0A' },
  { key: 'rainbow',color: '#fff',    bg: '#0A0A0A' }
]

const sizes = [
  { key: 'sm', label: '小', size: '36rpx' },
  { key: 'md', label: '中', size: '56rpx' },
  { key: 'lg', label: '大', size: '80rpx' }
]

const inputText = ref('')
const displayText = ref('')
const isRunning = ref(false)
const isPaused = ref(false)
const fullscreen = ref(false)
const speed = ref(5)
const direction = ref('left')
const colorKey = ref('green')
const textColor = ref('#39FF14')
const bgColor = ref('#0A0A0A')
const sizeKey = ref('md')

const speedMap = [20, 16, 13, 10, 8, 6.5, 5.5, 4.5, 3.5, 3]
const speedText = computed(() => speedMap[speed.value - 1].toFixed(1) + 's')
const curSize = computed(() => sizes.find(s => s.key === sizeKey.value).size)

const textStyle = computed(() => ({
  color: colorKey.value === 'rainbow' ? '#fff' : textColor.value,
  fontWeight: 'bold', whiteSpace: 'nowrap'
}))

const fullTextStyle = computed(() => ({
  ...textStyle.value,
  fontSize: curSize.value,
  textShadow: `0 0 ${parseInt(curSize.value) * 0.3}rpx currentColor, 0 0 ${parseInt(curSize.value) * 0.6}rpx currentColor`,
  letterSpacing: '12rpx'
}))

const previewTextStyle = computed(() => ({
  ...textStyle.value,
  fontSize: Math.min(parseInt(curSize.value), 56) + 'rpx',
  textShadow: '0 0 10rpx currentColor, 0 0 20rpx currentColor',
  letterSpacing: '6rpx'
}))

const marqueeStyle = computed(() => {
  const dur = speedMap[speed.value - 1]
  return {
    animationDuration: `${dur}s`,
    '--from': direction.value === 'left' ? '100%' : '-100%',
    '--to': direction.value === 'left' ? '-100%' : '100%'
  }
})

function selectPreset(t) { inputText.value = t; displayText.value = t; startMarquee() }
function handleShow() { if (inputText.value.trim()) displayText.value = inputText.value; startMarquee() }
function startMarquee() { isRunning.value = true; isPaused.value = false }
function togglePlay() {
  if (!displayText.value) return
  if (!isRunning.value) startMarquee(); else isPaused.value = !isPaused.value
}
function stop() { isRunning.value = false; isPaused.value = false }
function onSpeedChange(e) { speed.value = e.detail.value }
function selectColor(c) { colorKey.value = c.key; textColor.value = c.color; bgColor.value = c.bg }

function enterFullscreen() {
  if (!displayText.value) return
  fullscreen.value = true
  if (!isRunning.value) startMarquee()
  uni.hideTabBar({ fail: () => {} })
}

function exitFullscreen() {
  fullscreen.value = false
  uni.showTabBar({ fail: () => {} })
}
</script>

<style lang="scss" scoped>
.led {
  min-height: 100vh;
  background: #F5F5F7;
  padding: 20rpx 20rpx 40rpx;
  box-sizing: border-box;

  // ====== 全屏 ======
  &__fullscreen {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; overflow: hidden;
    .led__marquee {
      width: 100%; overflow: hidden;
      &--running { animation: ledScroll var(--duration, 8s) linear infinite; }
    }
    .led__text { display: inline-block; padding: 0 40rpx; }
    .led__exit-hint {
      position: absolute; bottom: 80rpx; left: 0; right: 0;
      text-align: center; font-size: 24rpx; color: rgba(255,255,255,0.15);
    }
  }

  // ====== LED 预览 ======
  &__preview {
    position: relative; height: 220rpx; border-radius: 20rpx;
    display: flex; align-items: center; overflow: hidden; margin-bottom: 16rpx;
    box-shadow: 0 0 30rpx rgba(57,255,20,0.12), inset 0 0 40rpx rgba(0,0,0,0.25);
    .led__marquee {
      width: 100%; overflow: hidden;
      &--running { animation: ledScroll var(--duration, 8s) linear infinite; }
    }
    .led__text { display: inline-block; padding: 0 20rpx; white-space: nowrap; }
  }

  // 全屏按钮
  &__fullscreen-btn {
    position: absolute; top: 12rpx; right: 12rpx;
    width: 52rpx; height: 52rpx; border-radius: 50%;
    background: rgba(255,255,255,0.1);
    display: flex; align-items: center; justify-content: center;
    text { font-size: 30rpx; color: rgba(255,255,255,0.4); }
    &:active { background: rgba(255,255,255,0.2); }
  }

  // ====== 卡片容器 ======
  &__card {
    background: #fff; border-radius: 16rpx; margin-bottom: 12rpx;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
    &--padded { padding: 20rpx; }
    &--last { margin-bottom: 0; }
  }

  &__section-title {
    font-size: 22rpx; color: #8E8E93; margin-bottom: 12rpx; display: block;
  }

  // ====== 输入 ======
  &__input-row {
    display: flex; gap: 12rpx; padding: 12rpx;
  }
  &__input {
    flex: 1; height: 72rpx; background: #F5F5F7; border-radius: 14rpx;
    padding: 0 20rpx; font-size: 28rpx; color: #1D1D1F;
  }
  &__btn {
    height: 72rpx; padding: 0 32rpx; background: #1D1D1F; color: #fff;
    border-radius: 14rpx; display: flex; align-items: center; justify-content: center;
    font-size: 28rpx; font-weight: 600; flex-shrink: 0;
    &:active { opacity: 0.8; }
  }

  // ====== 预设 ======
  &__tags {
    white-space: nowrap;
  }
  &__tag {
    display: inline-flex; padding: 10rpx 24rpx; margin-right: 10rpx;
    background: #F5F5F7; border-radius: 30rpx;
    text { font-size: 24rpx; color: #3A3A3C; }
    &:active { background: #E5E5EA; }
  }

  // ====== 控制 ======
  &__ctrl-row {
    display: flex; gap: 10rpx; margin-bottom: 20rpx;
  }
  &__ctrl-btn {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; height: 88rpx; background: #F5F5F7;
    border-radius: 14rpx; gap: 6rpx;
    &:active { background: #E5E5EA; }
    &--play { background: #1D1D1F; .led__ctrl-icon, .led__ctrl-text { color: #fff; } }
    &--on { background: #E8E8ED; }
  }
  &__ctrl-icon { font-size: 36rpx; color: #3A3A3C; }
  &__ctrl-text { font-size: 20rpx; color: #3A3A3C; }

  // ====== 设置行 ======
  &__setting-row {
    display: flex; align-items: center; gap: 12rpx;
    padding: 12rpx 0;
    border-top: 1rpx solid #F5F5F7;

    &:first-of-type { border-top: none; }
  }
  &__setting-label {
    font-size: 26rpx; color: #1D1D1F; font-weight: 500;
    min-width: 56rpx;
  }
  &__setting-hint {
    font-size: 22rpx; color: #8E8E93; min-width: 28rpx;
  }
  &__setting-value {
    font-size: 22rpx; color: #8E8E93; min-width: 60rpx; text-align: right;
    font-family: monospace;
  }
  &__slider { flex: 1; }

  // 颜色
  &__color-list {
    display: flex; gap: 10rpx; flex-wrap: wrap; flex: 1;
  }
  &__color-dot {
    width: 44rpx; height: 44rpx; border-radius: 50%;
    box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.15);
    &--active::after {
      content: '✓'; display: flex; align-items: center; justify-content: center;
      height: 100%; font-size: 22rpx; color: #fff;
      text-shadow: 0 0 4rpx rgba(0,0,0,0.5);
    }
    &:active { transform: scale(0.9); }
  }

  // 字号
  &__size-list {
    display: flex; gap: 10rpx; flex: 1;
  }
  &__size-btn {
    flex: 1; height: 56rpx; display: flex; align-items: center; justify-content: center;
    background: #F5F5F7; border-radius: 12rpx;
    font-size: 24rpx; color: #3A3A3C;
    &--active { background: #1D1D1F; color: #fff; }
    &:active { opacity: 0.7; }
  }
}

@keyframes ledScroll {
  0%   { transform: translateX(var(--from, 100%)); }
  100% { transform: translateX(var(--to, -100%)); }
}
</style>
