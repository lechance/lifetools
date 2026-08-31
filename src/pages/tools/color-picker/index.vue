<template>
  <view class="page">
    <view class="empty" v-if="!imagePath" @tap="chooseImage">
      <text class="empty-icon">🎯</text>
      <text class="empty-text">选择图片，点击任意位置取色</text>
      <text class="empty-sub">点击添加，支持相册与拍照</text>
    </view>

    <view v-if="imagePath" class="card">
      <view class="canvas-wrap">
        <canvas canvas-id="pickerCanvas" id="pickerCanvas" class="picker-canvas"
          :style="{ width: canvasW + 'px', height: canvasH + 'px' }"
          @touchstart="onTouch"></canvas>
      </view>
      <text class="hint">点击图片取色</text>
      <text class="replace-hint" @tap="chooseImage">更换图片</text>

      <view v-if="pickedColor" class="color-result">
        <view class="color-swatch" :style="{ background: pickedColor }"></view>
        <view class="color-info">
          <text class="color-hex">{{ pickedColor }}</text>
          <text class="color-rgb">RGB {{ pickedRgb }}</text>
        </view>
        <text class="copy-btn" @tap="copyColor">复制</text>
      </view>
    </view>
  </view>

  <ImageSourceSheet :visible="showSheet" @select="onSourceSelect" @close="showSheet = false" />
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { showToast, showSuccess } from '@/utils/helpers'
import ImageSourceSheet from '@/components/ImageSourceSheet.vue'
import { pickImage } from '@/utils/image-picker'

const imagePath = ref('')
const showSheet = ref(false)
const canvasW = ref(300)
const canvasH = ref(300)
const pickedColor = ref('')
const pickedRgb = ref('')

function chooseImage() {
  showSheet.value = true
}

/** 选源弹窗回调：拍摄 / 相册 / 聊天记录 */
async function onSourceSelect(source) {
  showSheet.value = false
  try {
    const { paths } = await pickImage({ source, count: 1 })
    imagePath.value = paths[0]
    pickedColor.value = ''
    uni.getImageInfo({
      src: imagePath.value,
      success: (info) => {
        const ratio = info.width / info.height
        if (ratio >= 1) { canvasW.value = 300; canvasH.value = Math.round(300 / ratio) }
        else { canvasH.value = 300; canvasW.value = Math.round(300 * ratio) }
        // #ifdef H5
        nextTick(() => {
          const el = document.getElementById('pickerCanvas')
          if (el) { el.width = canvasW.value; el.height = canvasH.value }
        })
        // #endif
        nextTick(() => drawImage())
      }
    })
  } catch (e) {}
}

function drawImage() {
  const ctx = uni.createCanvasContext('pickerCanvas')
  ctx.drawImage(imagePath.value, 0, 0, canvasW.value, canvasH.value)
  ctx.draw()
}

function onTouch(e) {
  if (!e.touches || !e.touches[0]) return
  const x = Math.round(e.touches[0].x)
  const y = Math.round(e.touches[0].y)
  // #ifdef H5
  const el = document.getElementById('pickerCanvas')
  if (el) {
    const ctx = el.getContext('2d')
    const pixel = ctx.getImageData(x, y, 1, 1).data
    setColor(pixel[0], pixel[1], pixel[2])
  }
  // #endif
  // #ifndef H5
  wx.canvasGetImageData({
    canvasId: 'pickerCanvas',
    x, y,
    width: 1,
    height: 1,
    success: (res) => {
      const d = res.data
      setColor(d[0], d[1], d[2])
    },
    fail: () => showToast('取色失败')
  })
  // #endif
}

function setColor(r, g, b) {
  const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
  pickedColor.value = hex
  pickedRgb.value = `${r}, ${g}, ${b}`
}

function copyColor() {
  uni.setClipboardData({
    data: pickedColor.value,
    success: () => showSuccess('已复制')
  })
}
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
  justify-content: center;
  margin-bottom: 12rpx;
}
.picker-canvas { border-radius: 8rpx; background: #fff; }
.hint {
  display: block;
  text-align: center;
  font-size: 24rpx;
  color: #C7C7CC;
  margin-bottom: 16rpx;
}
.replace-hint {
  display: block;
  text-align: center;
  font-size: 22rpx;
  color: #8E8E93;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 20rpx;
  padding: 6rpx 20rpx;
  margin: 0 auto 16rpx;
  cursor: pointer;

  &:active { opacity: 0.7; }
}
.color-result {
  display: flex;
  align-items: center;
  background: #F5F5F7;
  border-radius: 12rpx;
  padding: 20rpx;
}
.color-swatch {
  width: 72rpx;
  height: 72rpx;
  border-radius: 12rpx;
  border: 2rpx solid #E5E5EA;
  margin-right: 20rpx;
}
.color-info { flex: 1; }
.color-hex {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  font-family: monospace;
  color: #1D1D1F;
}
.color-rgb { font-size: 22rpx; color: #86868B; font-family: monospace; }
.copy-btn {
  font-size: 26rpx;
  color: #007AFF;
  padding: 8rpx 24rpx;
  &:active { opacity: 0.6; }
}
</style>
