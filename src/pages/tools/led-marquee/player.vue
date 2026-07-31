<template>
  <!-- 点击屏幕任意位置返回 -->
  <view class="player" @tap="goBack">
    <!-- ====== 横屏弹幕显示区 ====== -->
    <view class="player__marquee">
      <view class="player__track" :style="trackStyle">
        <text class="player__text" :style="textStyle">{{ text || '请输入文字' }}</text>
      </view>
    </view>

    <!-- ====== 底部轻点提示（非交互，点击会冒泡到根节点） ====== -->
    <view class="player__hint">
      <text>轻点屏幕返回</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// ========== 状态 ==========
const text = ref('')
const color = ref('#39FF14')
const speed = ref(5)
const direction = ref('left')
const fontSizePx = ref(96)

// 动画持续时间映射（速度值 1-10 → 秒数 20-3），与主页面保持一致
const speedMap = [20, 16, 13, 10, 8, 6.5, 5.5, 4.5, 3.5, 3]

// 默认字号（rpx），与主页面一致
const FONT_DEFAULT_RPX = 88

// ========== 读取 URL 参数 ==========
onLoad((options) => {
  if (!options) return
  if (options.text) text.value = decodeURIComponent(options.text)
  if (options.color) color.value = decodeURIComponent(options.color)
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
  const c = color.value
  return {
    color: c,
    fontSize: fontSizePx.value + 'px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    textShadow: `0 0 16px ${c}`
  }
})

// 滚动动画：位移百分比基于文字轨道自身宽度（= 文字宽度），长文字也能完整滚动
const trackStyle = computed(() => {
  const dur = speedMap[speed.value - 1] || 6.5
  const from = direction.value === 'left' ? '100%' : '-100%'
  const to = direction.value === 'left' ? '-100%' : '100%'
  return {
    animationDuration: `${dur}s`,
    '--from': from,
    '--to': to
  }
})

/** 返回上一页（带兜底：横屏下页面栈异常时 navigateBack 会静默失效，改用 reLaunch 强制返回） */
function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack({ delta: 1 })
  }
  // 兜底：若 navigateBack 未生效（仍在当前页），强制回 LED 弹幕主页面
  setTimeout(() => {
    const after = getCurrentPages()
    const last = after[after.length - 1]
    if (last && last.route && last.route.indexOf('led-marquee/player') !== -1) {
      uni.reLaunch({ url: '/pages/tools/led-marquee/index' })
    }
  }, 300)
}
</script>

<style lang="scss" scoped>
.player {
  width: 100vw;
  height: 100vh;
  background: #000;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;

  // ====== 弹幕显示 ======
  &__marquee {
    width: 100%;
    overflow: hidden;
    padding: 0 24rpx;
  }

  // 文字轨道：宽度即文字宽度，translateX 百分比基于自身宽度，长文字完整滚动
  // will-change 提升合成层，滚动只做 GPU 平移，避免每帧重绘文字/阴影
  &__track {
    display: inline-block;
    white-space: nowrap;
    min-width: 100%;
    will-change: transform;
    animation: marqueeScroll var(--duration, 8s) linear infinite;
    animation-duration: var(--duration);
  }
  &__text {
    display: inline-block;
    letter-spacing: 12rpx;
    line-height: 1.3;
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
      color: rgba(255, 255, 255, 0.25);
    }
  }
}

// ====== 滚动动画 ======
@keyframes marqueeScroll {
  0%   { transform: translateX(var(--from, 100%)); }
  100% { transform: translateX(var(--to, -100%)); }
}
</style>
