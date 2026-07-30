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
        <slider class="led__slider" :value="speed" min="1" max="10" step="1" @change="onSpeedChange" activeColor="#1D1D1F" backgroundColor="#E5E5EA" block-size="16" />
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

      <!-- 字号 -->
      <view class="led__size-row">
        <text v-for="s in sizes" :key="s.key"
          class="led__size-btn"
          :class="{ 'led__size-btn--active': sizeKey === s.key }"
          @tap="sizeKey = s.key"
        >{{ s.label }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

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

// ========== 颜色方案 ==========
const colors = [
  { key: 'green',  color: '#39FF14', bg: '#0A0A0A', label: '霓虹绿' },
  { key: 'red',    color: '#FF1744', bg: '#0A0A0A', label: '热情红' },
  { key: 'blue',   color: '#00B0FF', bg: '#0A0A0A', label: '科技蓝' },
  { key: 'yellow', color: '#FFEA00', bg: '#0A0A0A', label: '亮黄' },
  { key: 'white',  color: '#FFFFFF', bg: '#0A0A0A', label: '经典白' },
  { key: 'purple', color: '#D500F9', bg: '#0A0A0A', label: '炫紫' },
  { key: 'cyan',   color: '#00E5FF', bg: '#0A0A0A', label: '青色' },
  { key: 'pink',   color: '#FF4081', bg: '#0A0A0A', label: '粉色' },
  { key: 'orange', color: '#FF9100', bg: '#0A0A0A', label: '橙色' },
  { key: 'rainbow',color: '#fff',    bg: '#0A0A0A', label: '彩' }
]

// ========== 字号 ==========
const sizes = [
  { key: 'sm', label: '小', size: '36rpx' },
  { key: 'md', label: '中', size: '52rpx' },
  { key: 'lg', label: '大', size: '72rpx' }
]

// ========== 状态 ==========
const inputText = ref('')
const isFullscreen = ref(false)
const displayText = ref('')
const isRunning = ref(false)
const isPaused = ref(false)
const speed = ref(5)
const direction = ref('left')
const colorKey = ref('green')
const bgColor = ref('#0A0A0A')
const textColor = ref('#39FF14')
const sizeKey = ref('md')

// 动画持续时间映射（速度值 1-10 → 秒数 20-3）
const speedMap = [20, 16, 13, 10, 8, 6.5, 5.5, 4.5, 3.5, 3]
const speedText = computed(() => speedMap[speed.value - 1].toFixed(1) + 's')

const textStyle = computed(() => ({
  color: colorKey.value === 'rainbow' ? '#fff' : textColor.value,
  fontSize: sizes.find(s => s.key === sizeKey.value).size,
  fontWeight: 'bold',
  whiteSpace: 'nowrap'
}))

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
    box-shadow: 0 0 40rpx rgba(57, 255, 20, 0.15), inset 0 0 60rpx rgba(0,0,0,0.3);
    border: 4rpx solid rgba(255,255,255,0.06);
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
      rgba(255,255,255,0.03) 0rpx,
      rgba(255,255,255,0.03) 10rpx,
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
      background: #1D1D1F;
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
      background: #1D1D1F;
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

  // 字号选择
  &__size-row {
    display: flex;
    gap: 16rpx;
  }
  &__size-btn {
    flex: 1;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F5F5F7;
    border-radius: 12rpx;
    font-size: 24rpx;
    color: #3A3A3C;

    &--active {
      background: #1D1D1F;
      color: #fff;
    }
    &:active { opacity: 0.7; }
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
