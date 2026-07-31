<template>
  <view class="player">
    <!-- ====== 横屏弹幕显示区 ====== -->
    <view class="player__marquee" :style="marqueeStyle">
      <text class="player__text" :style="textStyle">{{ text || '请输入文字' }}</text>
    </view>

    <!-- ====== 返回按钮 ====== -->
    <view class="player__back" @tap="goBack">
      <text>✕</text>
    </view>

    <!-- ====== 底部轻点提示 ====== -->
    <view class="player__hint" @tap="goBack">
      <text>轻点返回</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// ========== 状态 ==========
const text = ref('')
const color = ref('#00C853')
const colorKey = ref('green')
const speed = ref(5)
const direction = ref('left')
const fontSizePx = ref(96)

// 动画持续时间映射（速度值 1-10 → 秒数 20-3），与主页面保持一致
const speedMap = [20, 16, 13, 10, 8, 6.5, 5.5, 4.5, 3.5, 3]

// 默认字号（rpx），与主页面一致
const FONT_DEFAULT_RPX = 52

// ========== 读取 URL 参数 ==========
onLoad((options) => {
  if (!options) return
  if (options.text) text.value = decodeURIComponent(options.text)
  if (options.color) color.value = decodeURIComponent(options.color)
  if (options.colorKey) colorKey.value = decodeURIComponent(options.colorKey)
  if (options.speed) speed.value = parseInt(options.speed, 10)
  if (options.direction) direction.value = options.direction
  if (options.fontSize) {
    // rpx → 横屏 px，放大显示
    const rpx = parseInt(options.fontSize, 10) || FONT_DEFAULT_RPX
    const sys = uni.getSystemInfoSync()
    const pxPerRpx = sys.windowWidth / 750
    fontSizePx.value = Math.round(rpx * pxPerRpx * 1.8)
  }
})

// ========== 样式计算 ==========
const textStyle = computed(() => {
  const base = {
    fontSize: fontSizePx.value + 'px',
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
    color: color.value,
    textShadow: `0 0 16px ${color.value}`
  }
})

const marqueeStyle = computed(() => {
  const dur = speedMap[speed.value - 1] || 6.5
  const from = direction.value === 'left' ? '100%' : '-100%'
  const to = direction.value === 'left' ? '-100%' : '100%'
  return {
    animationDuration: `${dur}s`,
    '--from': from,
    '--to': to
  }
})

/** 返回上一页 */
function goBack() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.player {
  width: 100vw;
  height: 100vh;
  background: #F5F5F7;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;

  // ====== 弹幕显示 ======
  &__marquee {
    width: 100%;
    overflow: hidden;
    padding: 0 24rpx;
    animation: marqueeScroll var(--duration, 8s) linear infinite;
    animation-duration: var(--duration);
  }
  &__text {
    display: inline-block;
    letter-spacing: 12rpx;
    line-height: 1.3;
  }

  // ====== 返回按钮 ======
  &__back {
    position: fixed;
    top: 24rpx;
    left: 24rpx;
    z-index: 10;
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;

    text {
      color: #3A3A3C;
      font-size: 32rpx;
    }
    &:active {
      background: rgba(0, 0, 0, 0.12);
    }
  }

  // ====== 底部提示 ======
  &__hint {
    position: fixed;
    bottom: 32rpx;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;

    text {
      font-size: 22rpx;
      color: #C7C7CC;
    }
  }
}

// ====== 滚动动画 ======
@keyframes marqueeScroll {
  0%   { transform: translateX(var(--from, 100%)); }
  100% { transform: translateX(var(--to, -100%)); }
}
</style>
