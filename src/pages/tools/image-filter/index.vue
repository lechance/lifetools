<template>
  <view class="page">
    <view class="toolbar">
      <button class="btn btn--primary" @tap="chooseImage">{{ imagePath ? '重新选择' : '选择图片' }}</button>
    </view>

    <view class="empty" v-if="!imagePath">
      <text class="empty-icon">🎨</text>
      <text class="empty-text">选择一张图片添加滤镜</text>
    </view>

    <view v-if="imagePath" class="card">
      <view class="canvas-wrap">
        <canvas canvas-id="filterCanvas" id="filterCanvas" class="filter-canvas"
          :style="{ width: canvasW + 'px', height: canvasH + 'px' }"></canvas>
      </view>

      <view class="filter-row">
        <view v-for="f in filters" :key="f.key"
          class="filter-btn" :class="{ 'filter-btn--active': activeFilter === f.key }"
          @tap="applyFilter(f.key)">{{ f.label }}</view>
      </view>

      <button class="btn" @tap="saveImage">保存图片</button>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { showToast, showSuccess, showLoading, hideLoading } from '@/utils/helpers'

const filters = [
  { key: 'original', label: '原图' },
  { key: 'gray', label: '黑白' },
  { key: 'sepia', label: '怀旧' },
  { key: 'invert', label: '反色' },
  { key: 'bright', label: '提亮' },
  { key: 'contrast', label: '增强' },
]

const imagePath = ref('')
const canvasW = ref(300)
const canvasH = ref(300)
const activeFilter = ref('original')

function chooseImage() {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      imagePath.value = res.tempFilePaths[0]
      uni.getImageInfo({
        src: imagePath.value,
        success: (info) => {
          const ratio = info.width / info.height
          if (ratio >= 1) { canvasW.value = 300; canvasH.value = Math.round(300 / ratio) }
          else { canvasH.value = 300; canvasW.value = Math.round(300 * ratio) }
          setupCanvas()
          nextTick(() => drawAndFilter('original'))
        }
      })
    }
  })
}

function setupCanvas() {
  // #ifdef H5
  nextTick(() => {
    const el = document.getElementById('filterCanvas')
    if (el) {
      el.width = canvasW.value
      el.height = canvasH.value
    }
  })
  // #endif
}

function drawAndFilter(type) {
  activeFilter.value = type
  // #ifdef H5
  nextTick(() => {
    const el = document.getElementById('filterCanvas')
    if (!el) return
    const ctx = el.getContext('2d')
    ctx.clearRect(0, 0, el.width, el.height)
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, el.width, el.height)
      if (type !== 'original') applyPixel(ctx, el, type)
    }
    img.src = imagePath.value
  })
  // #endif
  // #ifndef H5
  // 小程序：用 canvas 绘制后用 wx.canvasGetImageData 处理（降级为简单绘制）
  const ctx = uni.createCanvasContext('filterCanvas')
  ctx.drawImage(imagePath.value, 0, 0, canvasW.value, canvasH.value)
  ctx.draw()
  // #endif
}

function applyPixel(ctx, el, type) {
  const imageData = ctx.getImageData(0, 0, el.width, el.height)
  const d = imageData.data
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2]
    switch (type) {
      case 'gray': {
        const v = 0.299 * r + 0.587 * g + 0.114 * b
        r = g = b = v
        break
      }
      case 'sepia': {
        const nr = 0.393 * r + 0.769 * g + 0.189 * b
        const ng = 0.349 * r + 0.686 * g + 0.168 * b
        const nb = 0.272 * r + 0.534 * g + 0.131 * b
        r = Math.min(255, nr); g = Math.min(255, ng); b = Math.min(255, nb)
        break
      }
      case 'invert':
        r = 255 - r; g = 255 - g; b = 255 - b
        break
      case 'bright':
        r = Math.min(255, r * 1.3); g = Math.min(255, g * 1.3); b = Math.min(255, b * 1.3)
        break
      case 'contrast': {
        const f = (x) => 128 + (x - 128) * 1.4
        r = f(r); g = f(g); b = f(b)
        break
      }
    }
    d[i] = r; d[i + 1] = g; d[i + 2] = b
  }
  ctx.putImageData(imageData, 0, 0)
}

function applyFilter(key) {
  // #ifdef H5
  drawAndFilter(key)
  // #endif
  // #ifndef H5
  if (key === 'original') {
    const ctx = uni.createCanvasContext('filterCanvas')
    ctx.drawImage(imagePath.value, 0, 0, canvasW.value, canvasH.value)
    ctx.draw()
  }
  activeFilter.value = key
  // #endif
}

function saveImage() {
  showLoading('保存中...')
  uni.canvasToTempFilePath({
    canvasId: 'filterCanvas',
    success: (res) => {
      hideLoading()
      // #ifdef H5
      const link = document.createElement('a')
      link.href = res.tempFilePath
      link.download = 'filtered.jpg'
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
    },
    fail: () => { hideLoading(); showToast('导出失败') }
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
  margin-bottom: 20rpx;
}
.filter-canvas { border-radius: 8rpx; }
.filter-row {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
  margin-bottom: 16rpx;
}
.filter-btn {
  padding: 12rpx 24rpx;
  background: #F5F5F7;
  border-radius: 30rpx;
  font-size: 24rpx;
  color: #3A3A3C;
  &:active { opacity: 0.7; }
  &--active { background: #1D1D1F; color: #fff; }
}
</style>
