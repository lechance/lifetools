<template>
  <view class="page">
    <view class="toolbar">
      <button class="btn btn--primary" @tap="chooseImage">{{ imagePath ? '重新选择' : '选择图片' }}</button>
    </view>

    <view class="empty" v-if="!imagePath">
      <text class="empty-icon">✂️</text>
      <text class="empty-text">选择一张图片进行裁剪</text>
    </view>

    <view v-if="imagePath" class="card">
      <view class="ratio-row">
        <view v-for="r in ratios" :key="r.key"
          class="ratio-btn" :class="{ 'ratio-btn--active': ratio === r.key }"
          @tap="selectRatio(r.key)">{{ r.label }}</view>
      </view>

      <view class="canvas-wrap">
        <canvas canvas-id="cropCanvas" id="cropCanvas" class="crop-canvas"
          :style="{ width: canvasW + 'px', height: canvasH + 'px' }"></canvas>
      </view>

      <button class="btn" @tap="doCrop">裁剪</button>
      <button class="btn btn--ghost" v-if="cropped" @tap="saveImage">保存图片</button>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { showToast, showSuccess, showLoading, hideLoading } from '@/utils/helpers'

const ratios = [
  { key: '1:1', label: '1:1' },
  { key: '3:4', label: '3:4' },
  { key: '4:3', label: '4:3' },
  { key: '9:16', label: '9:16' },
  { key: '16:9', label: '16:9' },
]

const imagePath = ref('')
const ratio = ref('1:1')
const canvasW = ref(300)
const canvasH = ref(300)
const cropped = ref(false)
const imgW = ref(0)
const imgH = ref(0)

function chooseImage() {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      imagePath.value = res.tempFilePaths[0]
      cropped.value = false
      uni.getImageInfo({
        src: imagePath.value,
        success: (info) => {
          imgW.value = info.width
          imgH.value = info.height
          calcCanvas()
          nextTick(() => drawPreview())
        }
      })
    }
  })
}

function getRatio() {
  const [a, b] = ratio.value.split(':').map(Number)
  return a / b
}

function calcCanvas() {
  const maxW = 300
  const maxH = 400
  const r = getRatio()
  // 裁剪区域（原图居中，保持比例）
  let cw, ch
  if (imgW.value / imgH.value >= r) {
    ch = imgH.value
    cw = imgH.value * r
  } else {
    cw = imgW.value
    ch = imgW.value / r
  }
  // 显示尺寸
  const dispRatio = cw / ch
  if (dispRatio >= 1) {
    canvasW.value = maxW
    canvasH.value = Math.round(maxW / dispRatio)
  } else {
    canvasH.value = maxH
    canvasW.value = Math.round(maxH * dispRatio)
  }
}

function selectRatio(key) {
  ratio.value = key
  calcCanvas()
  nextTick(() => drawPreview())
}

function drawPreview() {
  const ctx = uni.createCanvasContext('cropCanvas')
  ctx.setFillStyle('#000')
  ctx.fillRect(0, 0, canvasW.value, canvasH.value)
  // 计算裁剪区域
  const r = getRatio()
  let sx, sy, sw, sh
  if (imgW.value / imgH.value >= r) {
    sh = imgH.value
    sw = imgH.value * r
    sx = (imgW.value - sw) / 2
    sy = 0
  } else {
    sw = imgW.value
    sh = imgW.value / r
    sx = 0
    sy = (imgH.value - sh) / 2
  }
  ctx.drawImage(imagePath.value, sx, sy, sw, sh, 0, 0, canvasW.value, canvasH.value)
  ctx.draw()
}

function doCrop() {
  showLoading('裁剪中...')
  const ctx = uni.createCanvasContext('cropCanvas')
  // 高分辨率绘制裁剪区域
  const outW = Math.min(2000, imgW.value)
  const outH = Math.round(outW / getRatio())
  const r = getRatio()
  let sx, sy, sw, sh
  if (imgW.value / imgH.value >= r) {
    sh = imgH.value; sw = imgH.value * r; sx = (imgW.value - sw) / 2; sy = 0
  } else {
    sw = imgW.value; sh = imgW.value / r; sx = 0; sy = (imgH.value - sh) / 2
  }
  ctx.drawImage(imagePath.value, sx, sy, sw, sh, 0, 0, outW, outH)
  ctx.draw(false, () => {
    uni.canvasToTempFilePath({
      canvasId: 'cropCanvas',
      success: (res) => {
        cropped.value = true
        hideLoading()
        showSuccess('裁剪完成')
      },
      fail: () => { hideLoading(); showToast('裁剪失败') }
    })
  })
}

function saveImage() {
  uni.canvasToTempFilePath({
    canvasId: 'cropCanvas',
    success: (res) => {
      // #ifdef H5
      const link = document.createElement('a')
      link.href = res.tempFilePath
      link.download = 'cropped.jpg'
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
}
.ratio-row {
  display: flex;
  gap: 12rpx;
  margin-bottom: 20rpx;
}
.ratio-btn {
  flex: 1;
  padding: 12rpx 0;
  background: #F5F5F7;
  border-radius: 10rpx;
  font-size: 24rpx;
  color: #3A3A3C;
  text-align: center;
  &:active { opacity: 0.7; }
  &--active { background: #1D1D1F; color: #fff; font-weight: 600; }
}
.canvas-wrap {
  display: flex;
  justify-content: center;
  background: #000;
  border-radius: 8rpx;
}
.crop-canvas { display: block; }
</style>
