<template>
  <view class="page">
    <view class="empty" v-if="!images.length" @tap="chooseImages">
      <text class="empty-icon">🧩</text>
      <text class="empty-text">选择 2-9 张图片拼接</text>
      <text class="empty-sub">点击添加，支持相册与拍照</text>
    </view>

    <view v-if="images.length" class="card">
      <view class="thumbs" @tap="chooseImages">
        <view v-for="(img, i) in images" :key="i" class="thumb">
          <image class="thumb-img" :src="img" mode="aspectFill" />
          <text class="thumb-del" @tap.stop="removeImage(i)">✕</text>
        </view>
      </view>
      <text class="replace-hint" @tap="chooseImages">点击选择其他图片</text>

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

  <ImageSourceSheet :visible="showSheet" @select="onSourceSelect" @close="showSheet = false" />
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { showToast, showSuccess, showLoading, hideLoading } from '@/utils/helpers'
import ImageSourceSheet from '@/components/ImageSourceSheet.vue'
import { pickImage } from '@/utils/image-picker'

const GAP = 2
const MAX_OUT = 1500

const images = ref([])
const showSheet = ref(false)
const dir = ref('vertical')
const result = ref(false)
const canvasW = ref(300)
const canvasH = ref(300)
let outW = 0
let outH = 0

function chooseImages() {
  showSheet.value = true
}

async function onSourceSelect(source) {
  showSheet.value = false
  try {
    const { paths } = await pickImage({ source, count: 9 })
    images.value = paths
    result.value = false
  } catch (e) {}
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
  const count = images.value.length
  let loaded = 0
  let failed = false
  const sizes = []
  images.value.forEach((src, i) => {
    uni.getImageInfo({
      src,
      success: (info) => {
        if (failed) return
        sizes[i] = { w: info.width, h: info.height }
        loaded++
        if (loaded === count) computeAndDraw(sizes)
      },
      fail: () => {
        if (failed) return
        failed = true
        hideLoading()
        showToast('图片加载失败')
      }
    })
  })
}

function computeAndDraw(sizes) {
  const gapCount = images.value.length - 1
  const totalGap = gapCount * GAP
  let placements = []

  if (dir.value === 'vertical') {
    const maxW = Math.max(...sizes.map(s => s.w))
    const scale = Math.min(1, MAX_OUT / maxW)
    const commonW = Math.round(maxW * scale)
    const heights = sizes.map((s) => Math.round(s.h * commonW / s.w))
    outW = commonW
    outH = heights.reduce((a, b) => a + b, 0) + totalGap
    let y = 0
    sizes.forEach((s, i) => {
      const h = heights[i]
      placements.push({ x: 0, y, w: commonW, h })
      y += h + GAP
    })
  } else {
    const maxH = Math.max(...sizes.map(s => s.h))
    const scale = Math.min(1, MAX_OUT / maxH)
    const commonH = Math.round(maxH * scale)
    const widths = sizes.map((s) => Math.round(s.w * commonH / s.h))
    outH = commonH
    outW = widths.reduce((a, b) => a + b, 0) + totalGap
    let x = 0
    sizes.forEach((s, i) => {
      const w = widths[i]
      placements.push({ x, y: 0, w, h: commonH })
      x += w + GAP
    })
  }

  const dispRatio = outW / outH
  if (dispRatio >= 1) { canvasW.value = 300; canvasH.value = Math.round(300 / dispRatio) }
  else { canvasH.value = 400; canvasW.value = Math.round(400 * dispRatio) }

  result.value = true
  nextTick(() => {
    const ctx = uni.createCanvasContext('stitchCanvas')
    ctx.setFillStyle('#fff')
    ctx.fillRect(0, 0, canvasW.value, canvasH.value)
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
    destWidth: outW,
    destHeight: outH,
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
  cursor: pointer;

  &:active { opacity: 0.7; }
}
.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 28rpx; font-weight: 600; color: #1D1D1F; }
.empty-sub {
  font-size: 22rpx;
  color: #C7C7CC;
  margin-top: 4rpx;
}
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
  cursor: pointer;

  &:active { opacity: 0.7; }
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
.replace-hint {
  display: block;
  text-align: center;
  font-size: 22rpx;
  color: #8E8E93;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 20rpx;
  padding: 6rpx 20rpx;
  margin-bottom: 20rpx;
  cursor: pointer;

  &:active { opacity: 0.7; }
}
</style>
