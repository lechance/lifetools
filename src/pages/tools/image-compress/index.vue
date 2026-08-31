<template>
  <view class="page">
    <view class="empty" v-if="!imagePath" @tap="chooseImage">
      <text class="empty-icon">🖼️</text>
      <text class="empty-text">选择一张图片进行压缩</text>
      <text class="empty-sub">点击添加，支持相册与拍照</text>
    </view>

    <view v-if="imagePath" class="card">
      <view class="canvas-wrap" @tap="chooseImage">
        <canvas canvas-id="compressCanvas" id="compressCanvas" class="compress-canvas"
          :style="{ width: canvasW + 'px', height: canvasH + 'px' }"></canvas>
        <text class="replace-hint">点击更换图片</text>
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

  <ImageSourceSheet :visible="showSheet" @select="onSourceSelect" @close="showSheet = false" />
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { showToast, showSuccess, showLoading, hideLoading } from '@/utils/helpers'
import ImageSourceSheet from '@/components/ImageSourceSheet.vue'
import { pickImage } from '@/utils/image-picker'
import { saveCheckedImage, secCheck, showSecCheckFailToast } from '@/utils/sec-check'

const imagePath = ref('')
const showSheet = ref(false)
const canvasW = ref(300)
const canvasH = ref(300)
const quality = ref(60)
const originalSize = ref(0)
const resultSize = ref(0)
const result = ref(false)
const originalW = ref(0)
const originalH = ref(0)
const secCheckResult = ref(null)

function formatSize(bytes) {
  if (!bytes) return '0 KB'
  return bytes > 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(2) + ' MB' : (bytes / 1024).toFixed(0) + ' KB'
}

function chooseImage() {
  showSheet.value = true
}

/** 选源弹窗回调：拍摄 / 相册 / 聊天记录 */
async function onSourceSelect(source) {
  showSheet.value = false
  try {
    const { paths, tempFiles } = await pickImage({ source, count: 1 })
    const path = paths[0]
    // 安全校验通过后才加载显示；失败则保留原状态
    const checkResult = await secCheck(path)
    if (!checkResult.safe) {
      showSecCheckFailToast(checkResult.error)
      return
    }
    secCheckResult.value = checkResult
    imagePath.value = path
    result.value = false
    originalSize.value = tempFiles && tempFiles[0] ? tempFiles[0].size : 0
    uni.getImageInfo({
      src: path,
      success: (info) => {
        originalW.value = info.width
        originalH.value = info.height
        calcCanvas(info.width, info.height)
        nextTick(() => drawImage())
      }
    })
  } catch (e) {}
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
  ctx.draw(false)
}

function onQuality(e) {
  quality.value = e.detail.value
}

function compress() {
  showLoading('压缩中...')
  const ctx = uni.createCanvasContext('compressCanvas')
  ctx.drawImage(imagePath.value, 0, 0, canvasW.value, canvasH.value)
  ctx.draw(false, () => {
    uni.canvasToTempFilePath({
      canvasId: 'compressCanvas',
      fileType: 'jpg',
      quality: quality.value / 100,
      success: (res) => {
        // #ifdef MP-WEIXIN
        uni.getFileSystemManager().getFileInfo({
          filePath: res.tempFilePath,
          success: (info) => {
            resultSize.value = info.size
          },
          fail: () => { resultSize.value = 0 }
        })
        // #endif
        // #ifdef H5
        resultSize.value = 0
        // #endif
        result.value = true
        hideLoading()
      },
      fail: () => {
        hideLoading()
        showToast('压缩失败')
      }
    })
  })
}

function saveImage() {
  const ctx = uni.createCanvasContext('compressCanvas')
  ctx.drawImage(imagePath.value, 0, 0, canvasW.value, canvasH.value)
  ctx.draw(false, () => {
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
        saveCheckedImage(res.tempFilePath, {
          onSuccess: () => showSuccess('已保存到相册'),
          onFail: () => showToast('保存失败')
        }, secCheckResult.value)
        // #endif
      }
    })
  })
}

const reducePercent = computed(() => {
  if (!originalSize.value || !resultSize.value) return 0
  return Math.max(0, Math.round((1 - resultSize.value / originalSize.value) * 100))
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
}
.canvas-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16rpx;
  cursor: pointer;

  &:active { opacity: 0.7; }
}
.replace-hint {
  font-size: 22rpx;
  color: #8E8E93;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 20rpx;
  padding: 6rpx 20rpx;
  margin-top: 12rpx;
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
