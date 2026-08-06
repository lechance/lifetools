<template>
  <view class="page">
    <view class="empty" v-if="!imagePath" @tap="chooseImage">
      <text class="empty-icon">🎨</text>
      <text class="empty-text">选择一张图片添加滤镜</text>
      <text class="empty-sub">点击添加，支持相册与拍照</text>
    </view>

    <view v-if="imagePath" class="card">
      <view class="canvas-wrap" @tap="chooseImage">
        <canvas canvas-id="filterCanvas" id="filterCanvas" class="filter-canvas"
          :style="{ width: canvasW + 'px', height: canvasH + 'px' }"></canvas>
        <text class="replace-hint">点击更换图片</text>
      </view>

      <view class="filter-row">
        <view v-for="f in filters" :key="f.key"
          class="filter-btn" :class="{ 'filter-btn--active': activeFilter === f.key }"
          @tap="applyFilter(f.key)">{{ f.label }}</view>
      </view>

      <button class="btn" @tap="saveImage">保存图片</button>
    </view>
  </view>

  <ImageSourceSheet :visible="showSheet" @select="onSourceSelect" @close="showSheet = false" />
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { showToast, showSuccess, showLoading, hideLoading } from '@/utils/helpers'
import ImageSourceSheet from '@/components/ImageSourceSheet.vue'
import { pickImage } from '@/utils/image-picker'

const filters = [
  { key: 'original', label: '原图' },
  { key: 'gray', label: '黑白' },
  { key: 'sepia', label: '怀旧' },
  { key: 'invert', label: '反色' },
  { key: 'bright', label: '提亮' },
  { key: 'contrast', label: '增强' },
]

const imagePath = ref('')
const showSheet = ref(false)
const canvasW = ref(300)
const canvasH = ref(300)
const activeFilter = ref('original')

function chooseImage() {
  showSheet.value = true
}

/** 选源弹窗回调：拍摄 / 相册 / 聊天记录 */
async function onSourceSelect(source) {
  showSheet.value = false
  try {
    const { paths } = await pickImage({ source, count: 1 })
    imagePath.value = paths[0]
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
  } catch (e) {}
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
  if (type === 'original') {
    const ctx = uni.createCanvasContext('filterCanvas')
    ctx.drawImage(imagePath.value, 0, 0, canvasW.value, canvasH.value)
    ctx.draw()
  } else {
    applyPixelMp(type)
  }
  // #endif
}

/** 小程序端：canvasGetImageData 取像素处理后写回 */
function applyPixelMp(type) {
  const ctx = uni.createCanvasContext('filterCanvas')
  ctx.drawImage(imagePath.value, 0, 0, canvasW.value, canvasH.value)
  ctx.draw(false, () => {
    uni.canvasGetImageData({
      canvasId: 'filterCanvas',
      x: 0, y: 0,
      width: canvasW.value,
      height: canvasH.value,
      success: (res) => {
        const d = res.data
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
        uni.canvasPutImageData({
          canvasId: 'filterCanvas',
          x: 0, y: 0,
          width: canvasW.value,
          height: canvasH.value,
          data: d,
          fail: () => {}
        })
      },
      fail: () => {}
    })
  })
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
  drawAndFilter(key)
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
  margin-bottom: 20rpx;
  cursor: pointer;

  &:active { opacity: 0.7; }
}
.filter-canvas { border-radius: 8rpx; }
.replace-hint {
  font-size: 22rpx;
  color: #8E8E93;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 20rpx;
  padding: 6rpx 20rpx;
  margin-top: 12rpx;
}
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
