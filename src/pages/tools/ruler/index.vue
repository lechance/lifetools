<template>
  <view class="page">
    <view class="card">
      <text class="tip">将物品放在刻度尺上比对测量</text>
      <view class="ruler-wrap">
        <canvas canvas-id="rulerCanvas" id="rulerCanvas" class="ruler-canvas"
          :style="{ width: canvasW + 'px', height: '120px' }"></canvas>
      </view>
      <view class="calib">
        <text class="calib-label">灵敏度校准</text>
        <slider :value="dpi" min="100" max="500" step="1" @change="onDpi" activeColor="#1D1D1F" backgroundColor="#E5E5EA" block-size="16" />
        <text class="calib-val">{{ dpi }} DPI</text>
      </view>
    </view>

    <view class="card">
      <text class="info-title">使用说明</text>
      <text class="info-text">1. 将实物贴住屏幕上边缘对齐刻度</text>
      <text class="info-text">2. 若刻度不准确，调节 DPI 直到 1cm 与实际相符</text>
      <text class="info-text">3. 常见手机 DPI：iPhone 326 / 401 / 458，Android 常见 400 左右</text>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'

const dpi = ref(400)
const canvasW = ref(300)

function getCanvasW() {
  try {
    const sys = uni.getSystemInfoSync()
    canvasW.value = Math.round(sys.windowWidth) - 32
  } catch (e) {
    canvasW.value = 300
  }
}

function onDpi(e) {
  dpi.value = e.detail.value
  draw()
}

function draw() {
  nextTick(() => {
    const ctx = uni.createCanvasContext('rulerCanvas')
    const pxPerCm = dpi.value / 2.54
    const W = canvasW.value
    const totalCm = Math.ceil(W / pxPerCm)
    const H = 110

    ctx.setFillStyle('#fff')
    ctx.fillRect(0, 0, W, 120)

    // 主刻度线
    ctx.setFillStyle('#1D1D1F')
    ctx.fillRect(0, H - 40, W, 3)

    for (let i = 0; i <= totalCm; i++) {
      const x = Math.round(i * pxPerCm)
      // 厘米主刻度
      ctx.fillRect(x, H - 28, 2, 28)
      ctx.setFontSize(14)
      ctx.setTextAlign('center')
      ctx.fillText(String(i), x, H - 44)
      // 毫米刻度
      for (let m = 1; m < 10; m++) {
        const mx = Math.round((i * 10 + m) * pxPerCm / 10)
        if (mx >= W) break
        ctx.fillRect(mx, H - 14, 1, 14)
      }
      // 半厘米
      const hx = Math.round((i + 0.5) * pxPerCm)
      if (hx < W) ctx.fillRect(hx, H - 20, 1, 20)
    }

    ctx.draw()
  })
}

onMounted(() => {
  getCanvasW()
  draw()
})
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
.tip {
  display: block;
  font-size: 28rpx;
  color: #1D1D1F;
  margin-bottom: 20rpx;
}
.ruler-wrap {
  background: #fff;
  border: 2rpx solid #F0F0F2;
  border-radius: 12rpx;
  overflow: hidden;
}
.ruler-canvas {
  display: block;
  background: #fff;
}
.calib {
  margin-top: 24rpx;
}
.calib-label { font-size: 26rpx; color: #86868B; }
.calib-val {
  display: block;
  font-size: 26rpx;
  color: #1D1D1F;
  font-weight: 600;
  text-align: right;
}
.info-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 16rpx;
}
.info-text {
  display: block;
  font-size: 24rpx;
  color: #86868B;
  line-height: 1.8;
}
</style>
