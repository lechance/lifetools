<template>
  <view class="page">
    <view class="toolbar">
      <button class="btn btn--primary" @tap="chooseImage">{{ imagePath ? '重新选择' : '选择图片' }}</button>
    </view>

    <view class="empty" v-if="!imagePath">
      <text class="empty-icon">👤</text>
      <text class="empty-text">选择头像图片添加装饰</text>
    </view>

    <view v-if="imagePath" class="card">
      <view class="canvas-wrap">
        <canvas canvas-id="avatarCanvas" id="avatarCanvas" class="avatar-canvas"
          :style="{ width: canvasSize + 'px', height: canvasSize + 'px' }"></canvas>
      </view>

      <view class="field">
        <text class="field-label">装饰边框</text>
        <view class="deco-row">
          <view v-for="d in decos" :key="d.key"
            class="deco-btn" :class="{ 'deco-btn--active': deco === d.key }"
            @tap="selectDeco(d.key)">{{ d.label }}</view>
        </view>
      </view>
      <view class="field">
        <text class="field-label">边框颜色</text>
        <view class="color-row">
          <view v-for="c in colors" :key="c" class="color-dot" :class="{ 'color-dot--active': borderColor === c }"
            :style="{ background: c }" @tap="selectColor(c)"></view>
        </view>
      </view>

      <button class="btn" @tap="saveImage">保存图片</button>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { showToast, showSuccess, showLoading, hideLoading } from '@/utils/helpers'

const decos = [
  { key: 'none', label: '无' },
  { key: 'solid', label: '纯色' },
  { key: 'dashed', label: '虚线' },
  { key: 'gradient', label: '渐变' },
]
const colors = ['#FF4081', '#2979FF', '#00E676', '#FF6D00', '#AA00FF', '#FFFFFF']

const imagePath = ref('')
const canvasSize = ref(280)
const deco = ref('solid')
const borderColor = ref('#FF4081')

function chooseImage() {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      imagePath.value = res.tempFilePaths[0]
      nextTick(() => draw())
    }
  })
}

function selectDeco(key) {
  deco.value = key
  draw()
}
function selectColor(c) {
  borderColor.value = c
  draw()
}

function draw() {
  const ctx = uni.createCanvasContext('avatarCanvas')
  const size = canvasSize.value
  const center = size / 2
  const radius = size / 2 - 10

  // 圆形裁剪头像
  ctx.save()
  ctx.beginPath()
  ctx.arc(center, center, radius, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(imagePath.value, 0, 0, size, size)
  ctx.restore()

  // 装饰边框
  if (deco.value !== 'none') {
    ctx.beginPath()
    ctx.arc(center, center, radius - 3, 0, Math.PI * 2)
    ctx.setStrokeStyle(borderColor.value)
    ctx.setLineWidth(6)
    if (deco.value === 'dashed') {
      ctx.setLineDash([12, 8])
    }
    if (deco.value === 'gradient') {
      // 渐变：分段绘制
      ctx.setLineDash([])
      const steps = 24
      for (let i = 0; i < steps; i++) {
        const start = i / steps * Math.PI * 2
        const end = (i + 1) / steps * Math.PI * 2
        const hue = Math.round(i / steps * 360)
        ctx.setStrokeStyle(`hsl(${hue}, 90%, 60%)`)
        ctx.beginPath()
        ctx.arc(center, center, radius - 3, start, end)
        ctx.stroke()
      }
    } else {
      ctx.stroke()
    }
  }
  ctx.draw()
}

function saveImage() {
  showLoading('保存中...')
  draw()
  setTimeout(() => {
    uni.canvasToTempFilePath({
      canvasId: 'avatarCanvas',
      success: (res) => {
        hideLoading()
        // #ifdef H5
        const link = document.createElement('a')
        link.href = res.tempFilePath
        link.download = 'avatar.png'
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
  }, 200)
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
.avatar-canvas { border-radius: 50%; }
.field { margin-bottom: 20rpx; }
.field-label {
  display: block;
  font-size: 26rpx;
  color: #86868B;
  margin-bottom: 12rpx;
}
.deco-row {
  display: flex;
  gap: 12rpx;
}
.deco-btn {
  flex: 1;
  padding: 12rpx 0;
  background: #F5F5F7;
  border-radius: 10rpx;
  font-size: 24rpx;
  color: #3A3A3C;
  text-align: center;
  &:active { opacity: 0.7; }
  &--active { background: #1D1D1F; color: #fff; }
}
.color-row {
  display: flex;
  gap: 14rpx;
}
.color-dot {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  border: 2rpx solid #E5E5EA;
  &:active { transform: scale(0.9); }
  &--active { border: 4rpx solid #1D1D1F; }
}
</style>
