<template>
  <view class="page">
    <view class="toolbar">
      <button class="btn btn--primary" @tap="chooseImages">{{ images.length ? '重新选择' : '选择图片' }}</button>
    </view>

    <view class="empty" v-if="!images.length">
      <text class="empty-icon">🧩</text>
      <text class="empty-text">选择 2-9 张图片拼接</text>
    </view>

    <view v-if="images.length" class="card">
      <view class="thumbs">
        <view v-for="(img, i) in images" :key="i" class="thumb">
          <image class="thumb-img" :src="img" mode="aspectFill" />
          <text class="thumb-del" @tap="removeImage(i)">✕</text>
        </view>
      </view>

      <view class="dir-row">
        <view class="dir-btn" :class="{ 'dir-btn--active': dir === 'vertical' }" @tap="dir = 'vertical'">上下拼接</view>
        <view class="dir-btn" :class="{ 'dir-btn--active': dir === 'horizontal' }" @tap="dir = 'horizontal'">左右拼接</view>
      </view>

      <button class="btn" @tap="stitch">开始拼接</button>
      <button class="btn btn--ghost" v-if="result" @tap="saveImage">保存图片</button>
    </view>

    <view v-if="result" class="card">
      <view class="canvas-wrap">
        <canvas canvas-id="stitchCanvas" id="stitchCanvas" class="stitch-canvas"
          :style="{ width: canvasW + 'px', height: canvasH + 'px' }"></canvas>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { showToast, showSuccess, showLoading, hideLoading } from '@/utils/helpers'

const images = ref([])
const dir = ref('vertical')
const result = ref(false)
const canvasW = ref(300)
const canvasH = ref(300)

function chooseImages() {
  uni.chooseImage({
    count: 9,
    success: (res) => {
      images.value = res.tempFilePaths
      result.value = false
    }
  })
}

function removeImage(i) {
  images.value.splice(i, 1)
  result.value = false
}

function stitch() {
  if (images.value.length < 2) {
    showToast('请选择至少 2 张图片')
    return
  }
  showLoading('拼接中...')
  // 获取所有图片尺寸
  let loaded = 0
  const sizes = []
  images.value.forEach((src, i) => {
    uni.getImageInfo({
      src,
      success: (info) => {
        sizes[i] = { w: info.width, h: info.height }
        loaded++
        if (loaded === images.value.length) {
          computeAndDraw(sizes)
        }
      },
      fail: () => {
        hideLoading()
        showToast('图片加载失败')
      }
    })
  })
}

function computeAndDraw(sizes) {
  const MAX_OUT = 1500
  let outW, outH, placements = []

  if (dir.value === 'vertical') {
    // 公共宽 = 最大宽（限制）
    const maxW = Math.max(...sizes.map(s => s.w))
    const scale = Math.min(1, MAX_OUT / maxW)
    const commonW = Math.round(maxW * scale)
    const heights = sizes.map((s, i) => {
      const h = Math.round(s.h * commonW / s.w)
      placements[i] = { x: 0, y: 0, w: commonW, h }
      return h
    })
    outW = commonW
    outH = heights.reduce((a, b) => a + b, 0)
    let y = 0
    placements.forEach(p => { p.y = y; y += p.h })
  } else {
    const maxH = Math.max(...sizes.map(s => s.h))
    const scale = Math.min(1, MAX_OUT / maxH)
    const commonH = Math.round(maxH * scale)
    const widths = sizes.map((s, i) => {
      const w = Math.round(s.w * commonH / s.h)
      placements[i] = { x: 0, y: 0, w, h: commonH }
      return w
    })
    outH = commonH
    outW = widths.reduce((a, b) => a + b, 0)
    let x = 0
    placements.forEach(p => { p.x = x; x += p.w })
  }

  // 显示尺寸
  const dispRatio = outW / outH
  if (dispRatio >= 1) { canvasW.value = 300; canvasH.value = Math.round(300 / dispRatio) }
  else { canvasH.value = 400; canvasW.value = Math.round(400 * dispRatio) }

  // 先让结果画布挂载（v-if="result"），再在 nextTick 后绘制
  result.value = true
  nextTick(() => {
    const ctx = uni.createCanvasContext('stitchCanvas')
    ctx.setFillStyle('#fff')
    ctx.fillRect(0, 0, canvasW.value, canvasH.value)
    // 绘制（缩放至显示尺寸）
    const scaleX = canvasW.value / outW
    const scaleY = canvasH.value / outH
    images.value.forEach((src, i) => {
      const p = placements[i]
      ctx.drawImage(src, p.x * scaleX, p.y * scaleY, p.w * scaleX, p.h * scaleY)
    })
    ctx.draw(false, () => {
      hideLoading()
      showSuccess('拼接完成')
    })
  })
}

function saveImage() {
  uni.canvasToTempFilePath({
    canvasId: 'stitchCanvas',
    success: (res) => {
      // #ifdef H5
      const link = document.createElement('a')
      link.href = res.tempFilePath
      link.download = 'stitch.jpg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showSuccess('已下载')
      // #endif
      // #ifdef MP-WEIXIN
      uni.saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
        success: () => showSuccess('已保存到相册'),
        fail: () => showToast('保存失败')
      })
      // #endif
    }
  })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #F5F5F7;
  padding: 24rpx;
}
.toolbar { margin-bottom: 24rpx; }
.btn {
  width: 100%;
  margin-top: 20rpx;
  background: #1D1D1F;
  color: #fff;
  border: none;
  border-radius: 16rpx;
  padding: 20rpx 0;
  font-size: 30rpx;
  &:active { opacity: 0.8; }
  &--primary { margin-top: 0; }
  &--ghost { background: #F5F5F7; color: #3A3A3C; }
}
.empty {
  background: #fff;
  border-radius: 20rpx;
  padding: 100rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}
.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 28rpx; color: #8E8E93; }
.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  margin-bottom: 24rpx;
}
.thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 20rpx;
}
.thumb {
  position: relative;
  width: 160rpx;
  height: 160rpx;
}
.thumb-img {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
}
.thumb-del {
  position: absolute;
  top: -12rpx;
  right: -12rpx;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
}
.dir-row {
  display: flex;
  gap: 12rpx;
  margin-bottom: 16rpx;
}
.dir-btn {
  flex: 1;
  padding: 16rpx 0;
  background: #F5F5F7;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #3A3A3C;
  text-align: center;
  &:active { opacity: 0.7; }
  &--active { background: #1D1D1F; color: #fff; }
}
.canvas-wrap {
  display: flex;
  justify-content: center;
  background: #fff;
}
.stitch-canvas { border-radius: 8rpx; }
</style>
