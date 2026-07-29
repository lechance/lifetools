/**
 * LED弹幕
 * 全屏显示滚动文字，支持调速、变色、字号调节
 */
<template>
  <view class="led">
    <!-- ====== 全屏模式：纯LED无界面 ====== -->
    <view v-if="fullscreen" class="led__fullscreen" :style="{ background: bgColor }" @tap="exitFullscreen">
      <view
        class="led__marquee"
        :class="{ 'led__marquee--running': isRunning }"
        :style="marqueeStyle"
      >
        <text class="led__text" :style="{ color: textColor, fontSize: fontSize + 'rpx', fontWeight: 'bold', whiteSpace: 'nowrap', textShadow: `0 0 ${fontSize*0.3}rpx currentColor, 0 0 ${fontSize*0.6}rpx currentColor` }">
          {{ displayText }}
        </text>
      </view>
      <text class="led__exit-hint">点击退出全屏</text>
    </view>

    <!-- ====== 普通模式 ====== -->
    <template v-else>
      <!-- LED 预览 -->
      <view class="led__preview" :style="{ background: bgColor }">
        <view class="led__marquee led__marquee--running" :style="marqueeStyle">
          <text class="led__text" :style="{ color: textColor, fontSize: Math.min(fontSize, 64) + 'rpx', fontWeight: 'bold', whiteSpace: 'nowrap', textShadow: `0 0 10rpx currentColor, 0 0 20rpx currentColor` }">
            {{ displayText || '输入文字预览' }}
          </text>
        </view>
      </view>

      <!-- 输入区 -->
      <view class="led__input-area">
        <input
          class="led__input"
          v-model="inputText"
          placeholder="输入弹幕文字..."
          maxlength="100"
          confirm-type="done"
          @confirm="handleShow"
        />
      </view>

      <!-- 预设标签 -->
      <scroll-view class="led__presets" scroll-x show-scrollbar="false">
        <view v-for="(t, i) in presets" :key="i" class="led__preset-tag" @tap="selectPreset(t)">
          <text>{{ t }}</text>
        </view>
      </scroll-view>

      <!-- 控制面板 -->
      <view class="led__controls">
        <!-- 方向 + 速度 -->
        <view class="led__ctrl-row">
          <view class="led__ctrl-btn" :class="{ 'led__ctrl-btn--on': direction === 'left' }" @tap="direction = 'left'">
            <text>←</text><text class="led__ctrl-lbl">左移</text>
          </view>
          <view class="led__ctrl-btn" :class="{ 'led__ctrl-btn--on': direction === 'right' }" @tap="direction = 'right'">
            <text>→</text><text class="led__ctrl-lbl">右移</text>
          </view>
          <view class="led__ctrl-slider">
            <text class="led__ctrl-label">慢</text>
            <slider :value="speed" min="1" max="10" step="1" @change="onSpeedChange" activeColor="#1D1D1F" backgroundColor="#E5E5EA" block-size="14" />
            <text class="led__ctrl-label">快</text>
          </view>
        </view>

        <!-- 颜色 -->
        <view class="led__color-row">
          <view v-for="c in colors" :key="c.key"
            class="led__color-dot"
            :class="{ 'led__color-dot--active': colorKey === c.key }"
            :style="{ background: c.color }"
            @tap="selectColor(c)">
          </view>
        </view>

        <!-- 字号滑块 -->
        <view class="led__size-row">
          <text class="led__size-label">字号</text>
          <slider class="led__size-slider" :value="fontSize" min="24" max="160" step="4" @change="onFontChange" activeColor="#1D1D1F" backgroundColor="#E5E5EA" block-size="14" />
          <text class="led__size-val">{{ fontSize }}</text>
        </view>
      </view>

      <!-- 底部开启按钮 -->
      <view class="led__bottom" @tap="enterFullscreen">
        <text class="led__bottom-icon">🚀</text>
        <text class="led__bottom-text">开启弹幕</text>
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

const inputText = ref('')
const displayText = ref('你好世界 🌍')
const fullscreen = ref(false)
const isRunning = ref(true)
const speed = ref(5)
const direction = ref('left')
const colorKey = ref('green')
const textColor = ref('#39FF14')
const bgColor = ref('#0A0A0A')
const fontSize = ref(80)  // rpx, 全屏字号

const speedMap = [20, 16, 13, 10, 8, 6.5, 5.5, 4.5, 3.5, 3]

const marqueeStyle = computed(() => {
  const dur = speedMap[speed.value - 1]
  return {
    animationDuration: `${dur}s`,
    '--from': direction.value === 'left' ? '100%' : '-100%',
    '--to': direction.value === 'left' ? '-100%' : '100%'
  }
})

function selectPreset(t) {
  inputText.value = t
  displayText.value = t
}

function handleShow() {
  if (inputText.value.trim()) displayText.value = inputText.value
}

function onSpeedChange(e) { speed.value = e.detail.value }
function onFontChange(e) { fontSize.value = e.detail.value }
function selectColor(c) { colorKey.value = c.key; textColor.value = c.color; bgColor.value = c.bg }

function enterFullscreen() {
  if (!displayText.value) return
  fullscreen.value = true
  isRunning.value = true
  // 隐藏导航栏
  uni.hideTabBar({ fail: () => {} })
  // 强制横屏提示
  // 注意：pageOrientation 已在 pages.json 配置 auto
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
  display: flex;
  flex-direction: column;

  // ====== 全屏模式 ======
  &__fullscreen {
    position: fixed; inset: 0;
    z-index: 9999;
    display: flex; align-items: center;
    overflow: hidden;

    .led__marquee {
      width: 100%; overflow: hidden;
      &--running { animation: ledScroll var(--duration, 8s) linear infinite; animation-duration: var(--duration); }
    }
    .led__text { display: inline-block; letter-spacing: 12rpx; padding: 0 40rpx; }
    .led__exit-hint {
      position: absolute; bottom: 80rpx; left: 0; right: 0;
      text-align: center; font-size: 24rpx; color: rgba(255,255,255,0.15);
    }
  }

  // ====== LED 预览 ======
  &__preview {
    margin: 24rpx; height: 240rpx; border-radius: 24rpx;
    display: flex; align-items: center; overflow: hidden;
    box-shadow: 0 0 40rpx rgba(57,255,20,0.15), inset 0 0 60rpx rgba(0,0,0,0.3);
    border: 4rpx solid rgba(255,255,255,0.06);

    .led__marquee {
      width: 100%; overflow: hidden;
      &--running { animation: ledScroll var(--duration, 8s) linear infinite; animation-duration: var(--duration); }
    }
    .led__text { display: inline-block; letter-spacing: 6rpx; padding: 0 20rpx; }
  }

  // ====== 输入区 ======
  &__input-area {
    margin: 0 24rpx 12rpx;
    .led__input {
      width: 100%; height: 72rpx; background: #fff; border-radius: 16rpx;
      padding: 0 24rpx; font-size: 28rpx; color: #1D1D1F;
      box-sizing: border-box; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
    }
  }

  // ====== 预设 ======
  &__presets {
    white-space: nowrap; padding: 0 24rpx; margin-bottom: 16rpx;
  }
  &__preset-tag {
    display: inline-flex; padding: 10rpx 24rpx; margin-right: 10rpx;
    background: #fff; border-radius: 30rpx;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
    text { font-size: 24rpx; color: #3A3A3C; }
    &:active { background: #E5E5EA; }
  }

  // ====== 控制面板 ======
  &__controls {
    margin: 0 24rpx; background: #fff; border-radius: 20rpx;
    padding: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
    flex: 1;
  }

  &__ctrl-row {
    display: flex; align-items: center; gap: 12rpx; margin-bottom: 20rpx;
  }
  &__ctrl-btn {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    width: 90rpx; height: 80rpx; background: #F5F5F7; border-radius: 14rpx; gap: 4rpx;
    text:first-child { font-size: 36rpx; }
    &:active { background: #E5E5EA; }
    &--on { background: #1D1D1F; text { color: #fff; } .led__ctrl-lbl { color: rgba(255,255,255,0.7); } }
  }
  &__ctrl-lbl { font-size: 18rpx; color: #3A3A3C; }
  &__ctrl-slider {
    flex: 1; display: flex; align-items: center; gap: 10rpx;
    padding: 0 8rpx;
  }
  &__ctrl-label { font-size: 22rpx; color: #8E8E93; min-width: 28rpx; }

  // 颜色
  &__color-row {
    display: flex; gap: 12rpx; margin-bottom: 20rpx; flex-wrap: wrap;
  }
  &__color-dot {
    width: 48rpx; height: 48rpx; border-radius: 50%;
    box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.15);
    &--active::after {
      content: '✓'; display: flex; align-items: center; justify-content: center;
      height: 100%; font-size: 24rpx; color: #fff;
      text-shadow: 0 0 4rpx rgba(0,0,0,0.5);
    }
    &:active { transform: scale(0.9); }
  }

  // 字号
  &__size-row {
    display: flex; align-items: center; gap: 12rpx;
  }
  &__size-label { font-size: 24rpx; color: #8E8E93; min-width: 48rpx; }
  &__size-slider { flex: 1; }
  &__size-val { font-size: 22rpx; color: #1D1D1F; min-width: 48rpx; text-align: right; font-family: monospace; }

  // ====== 底部开启按钮 ======
  &__bottom {
    display: flex; align-items: center; justify-content: center;
    gap: 12rpx; margin: 16rpx 24rpx; padding: 28rpx;
    background: #1D1D1F; border-radius: 20rpx;
    &:active { opacity: 0.85; }
  }
  &__bottom-icon { font-size: 40rpx; }
  &__bottom-text { font-size: 32rpx; font-weight: 600; color: #fff; }
}

// ====== 滚动动画 ======
@keyframes ledScroll {
  0%   { transform: translateX(var(--from, 100%)); }
  100% { transform: translateX(var(--to, -100%)); }
}
</style>
