<template>
  <view class="page">
    <view class="toolbar">
      <button class="btn btn--primary" @tap="chooseImage">{{ imagePath ? '重新选择' : '选择图片' }}</button>
    </view>

    <view class="empty" v-if="!imagePath">
      <text class="empty-icon">🖼️</text>
      <text class="empty-text">选择一张图片进行压缩</text>
    </view>

    <view v-if="imagePath" class="card">
      <view class="canvas-wrap">
        <canvas canvas-id="compressCanvas" id="compressCanvas" class="compress-canvas"
          :style="{ width: canvasW + 'px', height: canvasH + 'px' }"></canvas>
      </view>
      <view class="quality-row">
        <text class="quality-label">压缩质量</text>
        <slider :value="quality" min="10" max="100" step="1" @change="onQuality" activeColor="#1D1D1F" backgroundColor="#E5E5EA" block-size="16" />
        <text class="quality-val">{{ quality }}%</text>
      </view>
      <view class="size-info" v-if="result">
        <text class="size-text">原图 {{ formatSize(originalSize) }} → 压缩后 {{ formatSize(resultSize) }}</text>
        <text class="size-reduce">减少 {{ reducePercent }}%</text>
      </view>
      <button class="btn" @tap="compress">压缩</button>
      <button class="btn btn--ghost" v-if="result" @tap="saveImage">保存图片</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { showToast, showSuccess, showLoading, hideLoading } from '@/utils/helpers'

const imagePath = ref('')
const canvasW = ref(300)
const canvasH = ref(300)
const quality = ref(60)
const originalSize = ref(0)
const resultSize = ref(0)
const result = ref(false)
const originalW = ref(0)
const originalH = ref(0)

function formatSize(bytes) {
  if (!bytes) return '0 KB'
  return bytes > 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(2) + ' MB' : (bytes / 1024).toFixed(0) + ' KB'
}

function chooseImage() {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      const path = res.tempFilePaths[0]
      imagePath.value = path
      result.value = false
      originalSize.value = res.tempFiles[0] ? res.tempFiles[0].size : 0
      uni.getImageInfo({
        src: path,
        success: (info) => {
          originalW.value = info.width
          originalH.value = info.height
          calcCanvas(info.width, info.height)
          nextTick(() => drawImage())
        }
      })
    }
  })
}

function calcCanvas(w, h) {
  const maxW = 300
  const maxH = 300
  const ratio = w / h
  if (ratio >= 1) {
    canvasW.value = maxW
    canvasH.value = Math.round(maxW / ratio)
  } else {
    canvasH.value = maxH
    canvasW.value = Math.round(maxH * ratio)
  }
}

function drawImage() {
  const ctx = uni.createCanvasContext('compressCanvas')
  ctx.drawImage(imagePath.value, 0, 0, canvasW.value, canvasH.value)
  ctx.draw()
}

function onQuality(e) {
  quality.value = e.detail.value
}

function compress() {
  showLoading('压缩中...')
  drawImage()
  setTimeout(() => {
    uni.canvasToTempFilePath({
      canvasId: 'compressCanvas',
      fileType: 'jpg',
      quality: quality.value / 100,
      success: (res) => {
        uni.getFileSystemManager().getFileInfo({
          filePath: res.tempFilePath,
          success: (info) => {
            resultSize.value = info.size
          },
          fail: () => { resultSize.value = 0 }
        })
        result.value = true
        hideLoading()
      },
      fail: () => {
        hideLoading()
        showToast('压缩失败')
      }
    })
  }, 200)
}

function saveImage() {
  uni.canvasToTempFilePath({
    canvasId: 'compressCanvas',
    fileType: 'jpg',
    quality: quality.value / 100,
    success: (res) => {
      // #ifdef H5
      const link = document.createElement('a')
      link.href = res.tempFilePath
      link.download = 'compressed.jpg'
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

const reducePercent = computed(() => {
  if (!originalSize.value || !resultSize.value) return 0
  return Math.max(0, Math.round((1 - resultSize.value / originalSize.value) * 100))
})
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
.canvas-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 16rpx;
}
.compress-canvas { border-radius: 8rpx; background: #fff; }
.quality-row { display: flex; align-items: center; gap: 16rpx; }
.quality-label { font-size: 24rpx; color: #86868B; white-space: nowrap; }
.quality-val { font-size: 22rpx; color: #1D1D1F; min-width: 60rpx; text-align: right; font-family: monospace; }
.size-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #F5F5F7;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  margin: 16rpx 0;
}
.size-text { font-size: 24rpx; color: #3A3A3C; }
.size-reduce { font-size: 24rpx; color: #34C759; font-weight: 600; }
</style>
