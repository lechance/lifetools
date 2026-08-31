/**
 * LED弹幕
 * 输入文字在LED屏幕上滚动展示，支持调速、变色、方向切换
 */
<template>
  <view class="led">
    <!-- ====== LED 显示区 ====== -->
    <view class="led__screen" :style="{ background: bgColor }">
      <view class="led__marquee">
        <view
          class="led__track"
          :class="{ 'led__track--running': isRunning, 'led__track--paused': isPaused }"
          :style="trackStyle"
        >
          <text class="led__text" :style="textStyle">{{ displayText }}</text>
        </view>
      </view>
      <!-- 装饰边框灯 -->
      <view class="led__border led__border--top"></view>
      <view class="led__border led__border--bottom"></view>
    </view>

    <!-- ====== 输入区 ====== -->
    <view class="led__input-area">
      <input
        class="led__input"
        v-model="inputText"
        placeholder="输入弹幕文字，回车显示"
        maxlength="100"
        confirm-type="done"
        @confirm="handleShow"
      />
    </view>

    <!-- ====== 预设文本 ====== -->
    <scroll-view class="led__presets" scroll-x show-scrollbar="false">
      <view v-for="(t, i) in presets" :key="i" class="led__preset-tag" @tap="selectPreset(t)">
        <text>{{ t }}</text>
      </view>
    </scroll-view>

    <!-- ====== 控制面板 ====== -->
    <view class="led__controls">
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
      </view>

      <!-- 速度滑块 -->
      <view class="led__slider-row">
        <text class="led__slider-label">慢</text>
        <slider class="led__slider" :value="speed" min="1" max="10" step="1" @change="onSpeedChange" activeColor="#1D1D1F" backgroundColor="#E5E5EA" block-size="16" />
        <text class="led__slider-label">快</text>
        <text class="led__speed-val">{{ speedText }}</text>
      </view>

      <!-- 文字颜色选择 -->
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

      <!-- 背景色选择 -->
      <view class="led__bg-row">
        <view
          v-for="b in bgColors"
          :key="b.key"
          class="led__bg-dot"
          :class="{ 'led__bg-dot--active': bgColor === b.color }"
          :style="{ background: b.color }"
          @tap="selectBgColor(b)"
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
    <view class="led__landscape-btn" @tap="goToPlayer">
      <text class="led__landscape-icon">📺</text>
      <text class="led__landscape-label">横播字幕</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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

// ========== 文字颜色方案 ==========
const colors = [
  { key: 'green',  color: '#39FF14', label: '霓虹绿' },
  { key: 'red',    color: '#FF1744', label: '热情红' },
  { key: 'blue',   color: '#00B0FF', label: '科技蓝' },
  { key: 'yellow', color: '#FFEA00', label: '亮黄' },
  { key: 'white',  color: '#FFFFFF', label: '经典白' },
  { key: 'purple', color: '#D500F9', label: '炫紫' },
  { key: 'cyan',   color: '#00E5FF', label: '青色' },
  { key: 'pink',   color: '#FF4081', label: '粉色' },
  { key: 'orange', color: '#FF9100', label: '橙色' },
  { key: 'rainbow',color: '#fff',    label: '彩' }
]

// ========== LED 屏幕背景色方案 ==========
const bgColors = [
  { key: 'black',   color: '#0A0A0A', label: '纯黑' },
  { key: 'navy',    color: '#14213D', label: '深蓝' },
  { key: 'green',   color: '#0D2B18', label: '深绿' },
  { key: 'maroon',  color: '#2B0D0D', label: '深红' },
  { key: 'purple',  color: '#1A0D2B', label: '深紫' },
  { key: 'blue',    color: '#2979FF', label: '亮蓝' },
  { key: 'pink',    color: '#FF4081', label: '亮粉' },
  { key: 'orange',  color: '#FF6D00', label: '亮橙' },
  { key: 'gray',    color: '#8E8E93', label: '浅灰' },
  { key: 'white',   color: '#FFFFFF', label: '白色' }
]

// ========== 字号（连续调节） ==========
const FONT_MIN = 28
const FONT_MAX = 200
const FONT_DEFAULT = 88
const FONT_STEP = 4

// ========== 状态 ==========
const inputText = ref('')
const isRunning = ref(false)
const isPaused = ref(false)
const speed = ref(5)
const direction = ref('left')
const colorKey = ref('green')
const bgColor = ref('#0A0A0A')
const textColor = ref('#39FF14')
const fontSize = ref(FONT_DEFAULT)

// 显示内容：实时跟随输入框，为空时显示第一条预设
const displayText = computed(() => inputText.value.trim() ? inputText.value : presets[0])

// 页面加载时自动开始滚动（默认显示第一条预设）
onMounted(() => {
  startMarquee()
})

// 动画持续时间映射（速度值 1-10 → 秒数 20-3）
const speedMap = [20, 16, 13, 10, 8, 6.5, 5.5, 4.5, 3.5, 3]
const speedText = computed(() => speedMap[speed.value - 1].toFixed(1) + 's')

const textStyle = computed(() => ({
  color: colorKey.value === 'rainbow' ? '#fff' : textColor.value,
  fontSize: fontSize.value + 'rpx',
  fontWeight: 'bold',
  whiteSpace: 'nowrap'
}))

// 滚动动画：位移百分比基于文字轨道自身宽度（= 文字宽度），任意长度文字均能完整滚动
const trackStyle = computed(() => {
  const dur = speedMap[speed.value - 1]
  // left：从右外侧（+100%）滚到左外侧（-100%）；right：反向
  const from = direction.value === 'left' ? '100%' : '-100%'
  const to = direction.value === 'left' ? '-100%' : '100%'
  return {
    animationDuration: `${dur}s`,
    '--from': from,
    '--to': to
  }
})

/** 选预设文本（填入输入框，LED 实时同步显示） */
function selectPreset(t) {
  inputText.value = t
  startMarquee()
}

/** 回车：开始滚动（显示内容已与输入框实时同步） */
function handleShow() {
  if (!inputText.value.trim()) {
    showToast('请输入文字')
    return
  }
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

/** 跳转横屏播放页（横播字幕） */
function goToPlayer() {
  if (!displayText.value.trim()) {
    showToast('请先输入文字')
    return
  }
  const query = [
    `text=${encodeURIComponent(displayText.value)}`,
    `color=${encodeURIComponent(colorKey.value === 'rainbow' ? '#FFFFFF' : textColor.value)}`,
    `speed=${speed.value}`,
    `direction=${direction.value}`,
    `fontSize=${fontSize.value}`,
    `running=${isRunning.value ? 1 : 0}`,
    `paused=${isPaused.value ? 1 : 0}`
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

/** 选文字颜色 */
function selectColor(c) {
  colorKey.value = c.key
  textColor.value = c.color
}

/** 选 LED 屏幕背景色 */
function selectBgColor(b) {
  bgColor.value = b.color
}
</script>

<style lang="scss" scoped>
.led {
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
  background: #F5F5F7;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));

  // ====== LED 屏幕 ======
  &__screen {
    position: relative;
    margin: 24rpx;
    height: 240rpx;
    border-radius: 24rpx;
    overflow: hidden;
    display: flex;
    align-items: center;
    box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.12);
    border: 4rpx solid rgba(0,0,0,0.08);
  }

  &__marquee {
    width: 100%;
    overflow: hidden;
    padding: 0 20rpx;
  }

  // 文字轨道：宽度即文字宽度（min-width:100% 兜底），动画施加于此
  // translateX 百分比基于轨道自身宽度 → 任意长度文字都能完整滚出
  // will-change 提升合成层，滚动只做 GPU 平移，避免每帧重绘文字/阴影
  &__track {
    display: inline-block;
    white-space: nowrap;
    min-width: 100%;
    will-change: transform;

    &--running {
      animation: marqueeScroll var(--duration, 8s) linear infinite;
      animation-duration: var(--duration);
    }
    &--paused {
      animation-play-state: paused;
    }
    &:not(&--running) {
      transform: translateX(0);
    }
  }

  &__text {
    display: inline-block;
    text-shadow: 0 0 16rpx currentColor;
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
  &__input {
    display: block;
    width: 100%;
    height: 80rpx;
    background: #fff;
    border-radius: 16rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
    color: #1D1D1F;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
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

  // 文字颜色选择
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

  // 背景色选择
  &__bg-row {
    display: flex;
    gap: 16rpx;
    margin-bottom: 24rpx;
    flex-wrap: wrap;
  }
  &__bg-dot {
    width: 56rpx; height: 56rpx;
    border-radius: 12rpx;
    box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.15);
    position: relative;

    &--active {
      border: 4rpx solid #007AFF;
      box-sizing: border-box;

      &::after {
        content: '✓';
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26rpx;
        color: #fff;
        text-shadow: 0 0 4rpx rgba(0,0,0,0.8);
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
      color: #1D1D1F;
    }
    &--reset {
      background: #1D1D1F;
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

  // ====== 横播字幕入口（悬浮底部） ======
  &__landscape-btn {
    position: fixed;
    bottom: calc(24rpx + env(safe-area-inset-bottom));
    left: 24rpx;
    right: 24rpx;
    z-index: 100;
    height: 112rpx;
    border-radius: 24rpx;
    background: linear-gradient(135deg, #1D1D1F 0%, #000 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14rpx;
    box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.25);
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
      transform: translateX(-100%);
      transition: transform 0.4s ease;
    }
    &:active::after {
      transform: translateX(100%);
    }
    &:active {
      transform: scale(0.98);
    }
  }
  &__landscape-icon {
    font-size: 44rpx;
  }
  &__landscape-label {
    font-size: 32rpx;
    font-weight: 600;
    color: #fff;
    letter-spacing: 4rpx;
  }
}

// ====== 全局滚动动画 ======
@keyframes marqueeScroll {
  0%   { transform: translateX(var(--from, 100%)); }
  100% { transform: translateX(var(--to, -100%)); }
}

</style>
