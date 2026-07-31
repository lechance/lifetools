/**
 * LED弹幕
 * 输入文字在LED屏幕上滚动展示，支持调速、变色、方向切换
 */
<template>
  <view class="led">
    <!-- ====== LED 显示区 ====== -->
    <view class="led__screen" :class="{ 'led__screen--fullscreen': isFullscreen }" :style="{ background: bgColor }">
      <view
        class="led__marquee"
        :class="{ 'led__marquee--running': isRunning, 'led__marquee--paused': isPaused }"
        :style="marqueeStyle"
      >
        <text class="led__text" :style="textStyle">{{ displayText || '请输入文字' }}</text>
      </view>
      <!-- 装饰边框灯 -->
      <view class="led__border led__border--top"></view>
      <view class="led__border led__border--bottom"></view>
    </view>

    <!-- ====== 全屏退出按钮（全屏时显示） ====== -->
    <view v-if="isFullscreen" class="led__exit-btn" @tap="toggleFullscreen">
      <text>✕ 退出全屏</text>
    </view>

    <!-- ====== 输入区 ====== -->
    <view class="led__input-area" :class="{ 'led__input-area--hidden': isFullscreen }">
      <view class="led__input-row">
        <input
          class="led__input"
          v-model="inputText"
          placeholder="输入弹幕文字..."
          maxlength="100"
          confirm-type="done"
          @confirm="handleShow"
        />
        <view class="led__btn led__btn--primary" @tap="handleShow">显示</view>
      </view>
    </view>

    <!-- ====== 预设文本 ====== -->
    <scroll-view v-show="!isFullscreen" class="led__presets" scroll-x show-scrollbar="false">
      <view v-for="(t, i) in presets" :key="i" class="led__preset-tag" @tap="selectPreset(t)">
        <text>{{ t }}</text>
      </view>
    </scroll-view>

    <!-- ====== 控制面板 ====== -->
    <view class="led__controls" :class="{ 'led__controls--hidden': isFullscreen }">
      <!-- 控制按钮 -->
      <view class="led__ctrl-row">
        <view class="led__ctrl-btn led__ctrl-btn--play" @tap="togglePlay">
          <text>{{ isRunning && !isPaused ? '⏸' : '▶' }}</text>
          <text class="led__ctrl-label">{{ isRunning && !isPaused ? '暂停' : '开始' }}</text>
        </view>
        <view class="led__ctrl-btn" @tap="stop">
          <text>⏹</text>
          <text class="led__ctrl-label">停止</text>
        </view>
        <view class="led__ctrl-btn" @tap="toggleDirection">
          <text>{{ direction === 'left' ? '←' : '→' }}</text>
          <text class="led__ctrl-label">{{ direction === 'left' ? '左移' : '右移' }}</text>
        </view>
        <view class="led__ctrl-btn led__ctrl-btn--fullscreen" @tap="toggleFullscreen">
          <text>⛶</text>
          <text class="led__ctrl-label">全屏</text>
        </view>
      </view>

      <!-- 速度滑块 -->
      <view class="led__slider-row">
        <text class="led__slider-label">慢</text>
        <slider class="led__slider" :value="speed" min="1" max="10" step="1" @change="onSpeedChange" activeColor="#007AFF" backgroundColor="#E5E5EA" block-size="16" />
        <text class="led__slider-label">快</text>
        <text class="led__speed-val">{{ speedText }}</text>
      </view>

      <!-- 颜色选择 -->
      <view class="led__color-row">
        <view
          v-for="c in colors"
          :key="c.key"
          class="led__color-dot"
          :class="{ 'led__color-dot--active': colorKey === c.key }"
          :style="{ background: c.color }"
          @tap="selectColor(c)"
        >
        </view>
      </view>

      <!-- 字号调节 -->
      <view class="led__size-row">
        <view class="led__size-btn led__size-btn--step" @tap="decreaseFont">
          <text>−</text>
        </view>
        <view class="led__size-btn led__size-btn--reset" @tap="resetFont">
          <text>重置</text>
        </view>
        <view class="led__size-btn led__size-btn--step" @tap="increaseFont">
          <text>+</text>
        </view>
        <text class="led__size-val">{{ fontSize }}rpx</text>
      </view>
    </view>

    <!-- ====== 横播字幕入口 ====== -->
    <view v-show="!isFullscreen" class="led__landscape-btn" @tap="goToPlayer">
      <text class="led__landscape-icon">📺</text>
      <text class="led__landscape-label">横播字幕</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { showToast } from '@/utils/helpers'

// ========== 预设文本 ==========
const presets = [
  '🎉 新年快乐！',
  '❤️ 我喜欢你 💕',
  '生日快乐 🎂',
  '恭喜发财 🧧',
  '加油！💪',
  '你好世界 🌍',
  '欢迎光临 👋',
  '520 ❤️',
  '🎵 音乐响起 🎵',
  '圣诞快乐 🎄'
]

// ========== 颜色方案（浅色系） ==========
const colors = [
  { key: 'green',  color: '#00C853', bg: '#F0FBF2', label: '绿色' },
  { key: 'red',    color: '#FF1744', bg: '#FFF5F7', label: '红色' },
  { key: 'blue',   color: '#2979FF', bg: '#F0F7FF', label: '蓝色' },
  { key: 'yellow', color: '#F9A825', bg: '#FFFDF2', label: '黄色' },
  { key: 'dark',   color: '#1D1D1F', bg: '#F2F2F4', label: '墨色' },
  { key: 'purple', color: '#AA00FF', bg: '#F9F0FF', label: '紫色' },
  { key: 'cyan',   color: '#00B8D4', bg: '#F0FAFC', label: '青色' },
  { key: 'pink',   color: '#F50057', bg: '#FFF2F6', label: '粉色' },
  { key: 'orange', color: '#FF6D00', bg: '#FFF7F0', label: '橙色' },
  { key: 'rainbow',color: '#FF4081', bg: 'linear-gradient(135deg, #FFF0F0, #F0F7FF, #F9F0FF)', label: '彩' }
]

// ========== 字号（连续调节） ==========
const FONT_MIN = 28
const FONT_MAX = 88
const FONT_DEFAULT = 52
const FONT_STEP = 4

// ========== 状态 ==========
const inputText = ref('')
const isFullscreen = ref(false)
const displayText = ref('')
const isRunning = ref(false)
const isPaused = ref(false)
const speed = ref(5)
const direction = ref('left')
const colorKey = ref('green')
const bgColor = ref('#F0FBF2')
const textColor = ref('#00C853')
const fontSize = ref(FONT_DEFAULT)

// 动画持续时间映射（速度值 1-10 → 秒数 20-3）
const speedMap = [20, 16, 13, 10, 8, 6.5, 5.5, 4.5, 3.5, 3]
const speedText = computed(() => speedMap[speed.value - 1].toFixed(1) + 's')

const textStyle = computed(() => {
  const base = {
    fontSize: fontSize.value + 'rpx',
    fontWeight: 'bold',
    whiteSpace: 'nowrap'
  }
  // 彩字：渐变色文字
  if (colorKey.value === 'rainbow') {
    return {
      ...base,
      background: 'linear-gradient(90deg, #FF0000, #FF8000, #FFEB3B, #00C853, #00B0FF, #AA00FF)',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent'
    }
  }
  return {
    ...base,
    color: textColor.value,
    textShadow: `0 0 12rpx ${textColor.value}, 0 0 24rpx ${textColor.value}`
  }
})

const marqueeStyle = computed(() => {
  const dur = speedMap[speed.value - 1]
  const from = direction.value === 'left' ? '100%' : '-100%'
  const to = direction.value === 'left' ? '-100%' : '100%'
  return {
    animationDuration: `${dur}s`,
    '--from': from,
    '--to': to
  }
})

/** 选预设文本 */
function selectPreset(t) {
  inputText.value = t
  displayText.value = t
  startMarquee()
}

/** 点击显示 */
function handleShow() {
  if (!inputText.value.trim()) return
  displayText.value = inputText.value
  startMarquee()
}

/** 开始滚动 */
function startMarquee() {
  isRunning.value = true
  isPaused.value = false
}

/** 切换播放/暂停 */
function togglePlay() {
  if (!displayText.value) return
  if (!isRunning.value) {
    startMarquee()
  } else {
    isPaused.value = !isPaused.value
  }
}

/** 停止 */
function stop() {
  isRunning.value = false
  isPaused.value = false
}

/** 切换方向 */
function toggleDirection() {
  direction.value = direction.value === 'left' ? 'right' : 'left'
  // 重新触发动画
  if (isRunning.value) {
    isRunning.value = false
    setTimeout(() => { isRunning.value = true }, 50)
  }
}

/** 切换全屏横屏模式 */
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  // 进入全屏时如果未开始，自动开始
  if (isFullscreen.value && displayText.value && !isRunning.value) {
    startMarquee()
  }
}

/** 跳转横屏播放页（横播字幕） */
function goToPlayer() {
  if (!displayText.value.trim()) {
    showToast('请先输入文字')
    return
  }
  const query = [
    `text=${encodeURIComponent(displayText.value)}`,
    `color=${encodeURIComponent(textColor.value)}`,
    `colorKey=${colorKey.value}`,
    `speed=${speed.value}`,
    `direction=${direction.value}`,
    `fontSize=${fontSize.value}`
  ].join('&')
  uni.navigateTo({
    url: `/pages/tools/led-marquee/player?${query}`
  })
}

/** 减小字号 */
function decreaseFont() {
  fontSize.value = Math.max(FONT_MIN, fontSize.value - FONT_STEP)
}

/** 重置字号为默认（中号） */
function resetFont() {
  fontSize.value = FONT_DEFAULT
}

/** 增大字号 */
function increaseFont() {
  fontSize.value = Math.min(FONT_MAX, fontSize.value + FONT_STEP)
}

/** 速度改变 */
function onSpeedChange(e) {
  speed.value = e.detail.value
}

/** 选颜色 */
function selectColor(c) {
  colorKey.value = c.key
  textColor.value = c.color
  bgColor.value = c.bg
}
</script>

<style lang="scss" scoped>
.led {
  min-height: 100vh;
  background: #F5F5F7;
  padding-bottom: 40rpx;

  // ====== LED 屏幕 ======
  &__screen {
    position: relative;
    margin: 24rpx;
    height: 240rpx;
    border-radius: 24rpx;
    overflow: hidden;
    display: flex;
    align-items: center;
    box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.06), inset 0 0 40rpx rgba(0,0,0,0.03);
    border: 2rpx solid rgba(0,0,0,0.06);
  }

  &__marquee {
    width: 100%;
    overflow: hidden;
    padding: 0 20rpx;

    &--running {
      animation: marqueeScroll var(--duration, 8s) linear infinite;
      animation-duration: var(--duration);
    }
    &--paused {
      animation-play-state: paused;
    }
    &:not(&--running) {
      .led__text {
        transform: translateX(0);
      }
    }
  }

  &__text {
    display: inline-block;
    text-shadow: 0 0 20rpx currentColor, 0 0 40rpx currentColor;
    letter-spacing: 8rpx;
    line-height: 1.4;
  }

  // 装饰边框灯
  &__border {
    position: absolute; left: 0; right: 0; height: 6rpx;
    background: repeating-linear-gradient(
      90deg,
      rgba(0,0,0,0.06) 0rpx,
      rgba(0,0,0,0.06) 10rpx,
      transparent 10rpx,
      transparent 20rpx
    );
    &--top { top: 0; }
    &--bottom { bottom: 0; }
  }

  // ====== 输入区 ======
  &__input-area {
    margin: 0 24rpx 16rpx;
  }
  &__input-row {
    display: flex;
    gap: 16rpx;
  }
  &__input {
    flex: 1;
    height: 80rpx;
    background: #fff;
    border-radius: 16rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
    color: #1D1D1F;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
  }
  &__btn {
    height: 80rpx;
    padding: 0 40rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    font-weight: 600;
    flex-shrink: 0;

    &--primary {
      background: #007AFF;
      color: #fff;
    }
    &:active { opacity: 0.7; }
  }

  // ====== 预设标签 ======
  &__presets {
    white-space: nowrap;
    padding: 0 24rpx;
    margin-bottom: 20rpx;
  }
  &__preset-tag {
    display: inline-flex;
    padding: 12rpx 28rpx;
    margin-right: 12rpx;
    background: #fff;
    border-radius: 30rpx;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
    text { font-size: 24rpx; color: #3A3A3C; }
    &:active { background: #E5E5EA; }
  }

  // ====== 控制面板 ======
  &__controls {
    margin: 0 24rpx;
    background: #fff;
    border-radius: 20rpx;
    padding: 24rpx;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
  }

  // 控制按钮行
  &__ctrl-row {
    display: flex;
    gap: 16rpx;
    margin-bottom: 24rpx;
  }
  &__ctrl-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100rpx;
    background: #F5F5F7;
    border-radius: 16rpx;
    gap: 8rpx;

    text:first-child { font-size: 40rpx; }
    &:active { background: #E5E5EA; }

    &--play {
      background: #007AFF;
      text:first-child { color: #fff; }
      .led__ctrl-label { color: #fff; }
    }
  }
  &__ctrl-label {
    font-size: 20rpx;
    color: #3A3A3C;
  }

  // 速度滑块
  &__slider-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 24rpx;
  }
  &__slider-label {
    font-size: 24rpx; color: #8E8E93; min-width: 32rpx;
  }
  &__slider {
    flex: 1;
  }
  &__speed-val {
    font-size: 22rpx; color: #1D1D1F; min-width: 56rpx; text-align: right;
    font-family: monospace;
  }

  // 颜色选择
  &__color-row {
    display: flex;
    gap: 16rpx;
    margin-bottom: 24rpx;
    flex-wrap: wrap;
  }
  &__color-dot {
    width: 56rpx; height: 56rpx;
    border-radius: 50%;
    box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.15);
    position: relative;

    &--active {
      &::after {
        content: '✓';
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28rpx;
        color: #fff;
        text-shadow: 0 0 4rpx rgba(0,0,0,0.5);
      }
    }
    &:active { transform: scale(0.9); }
  }

  // 字号调节
  &__size-row {
    display: flex;
    gap: 16rpx;
    align-items: center;
  }
  &__size-btn {
    flex: 1;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F5F5F7;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: #3A3A3C;

    &--step {
      font-size: 44rpx;
      font-weight: 600;
      color: #007AFF;
    }
    &--reset {
      background: #007AFF;
      color: #fff;
      font-size: 26rpx;
      font-weight: 600;
    }
    &:active { opacity: 0.7; }
  }
  &__size-val {
    min-width: 88rpx;
    font-size: 22rpx;
    color: #8E8E93;
    text-align: center;
    font-family: monospace;
  }

  // ====== 横播字幕入口 ======
  &__landscape-btn {
    margin: 24rpx;
    height: 96rpx;
    border-radius: 20rpx;
    background: linear-gradient(135deg, #007AFF 0%, #0055CC 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.2);
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
      transform: translateX(-100%);
      transition: transform 0.4s ease;
    }
    &:active::after {
      transform: translateX(100%);
    }
  }
  &__landscape-icon {
    font-size: 40rpx;
  }
  &__landscape-label {
    font-size: 32rpx;
    font-weight: 600;
    color: #fff;
  }
}

// ====== 全局滚动动画 ======
@keyframes marqueeScroll {
  0%   { transform: translateX(var(--from, 100%)); }
  100% { transform: translateX(var(--to, -100%)); }
}

// ====== 全屏横屏模式 ======
.led__screen--fullscreen {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  margin: 0;
  border-radius: 0;
  z-index: 998;
  border: none;
  box-shadow: none;
  .led__marquee {
    height: 100%;
    display: flex;
    align-items: center;
  }
}

.led__input-area--hidden,
.led__controls--hidden {
  display: none;
}

.led__exit-btn {
  position: fixed;
  top: 24rpx;
  right: 24rpx;
  z-index: 999;
  padding: 12rpx 24rpx;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 30rpx;
  color: rgba(255, 255, 255, 0.8);
  font-size: 24rpx;
  backdrop-filter: blur(10rpx);
  line-height: 1;
  &:active {
    background: rgba(0, 0, 0, 0.7);
  }
}
</style>
