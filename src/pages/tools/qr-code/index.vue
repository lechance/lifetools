<template>
  <view class="page">
    <view class="card">
      <view class="row">
        <text class="label">内容</text>
        <input class="input" v-model="content" placeholder="输入文本或网址" @confirm="generate" />
      </view>
      <view class="row">
        <text class="label">纠错级别</text>
        <view class="seg">
          <view v-for="l in levels" :key="l.key"
            class="seg-item" :class="{ 'seg-item--active': level === l.key }"
            @tap="selectLevel(l.key)">{{ l.label }}</view>
        </view>
      </view>
      <button class="btn" @tap="generate">生成二维码</button>
    </view>

    <view class="card qr-card">
      <canvas canvas-id="qrCanvas" id="qrCanvas" class="qr-canvas" :style="{ width: '260px', height: '260px' }"></canvas>
      <view v-if="generated" class="qr-actions">
        <text class="action" @tap="saveQr">保存图片</text>
      </view>
    </view>

    <view class="card">
      <text class="tip">提示：输入网址生成后，可保存图片分享。纠错级别越高，二维码越复杂但抗污损能力越强。</text>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { showToast, showSuccess, showLoading, hideLoading } from '@/utils/helpers'

const content = ref('')
const level = ref('M')
const generated = ref(false)
const CANVAS_SIZE = 260

const levels = [
  { key: 'L', label: '低' },
  { key: 'M', label: '中' },
  { key: 'Q', label: '较高' },
  { key: 'H', label: '高' },
]

let qrcodeModule = null

function selectLevel(k) {
  level.value = k
  if (content.value.trim()) generate()
}

async function generate() {
  const text = content.value.trim()
  if (!text) {
    showToast('请输入内容')
    return
  }
  if (!qrcodeModule) {
    qrcodeModule = await import('@/utils/qrcode')
  }
  nextTick(() => drawQr(text))
}

function drawQr(text) {
  try {
    const qr = qrcodeModule.default(0, level.value)  // typeNumber 0 = 自动版本
    qr.addData(text)
    qr.make()
    const size = qr.getModuleCount()
    const ctx = uni.createCanvasContext('qrCanvas')
    const quiet = 4  // 留白格数
    const cell = CANVAS_SIZE / (size + quiet * 2)
    const margin = quiet * cell

    ctx.setFillStyle('#fff')
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    ctx.setFillStyle('#000')

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect(margin + c * cell, margin + r * cell, cell + 0.5, cell + 0.5)
        }
      }
    }
    ctx.draw(false, () => {
      generated.value = true
    })
  } catch (e) {
    showToast('生成失败：' + (e.message || '内容过长'))
  }
}

function saveQr() {
  if (!generated.value) return
  showLoading('保存中...')
  uni.canvasToTempFilePath({
    canvasId: 'qrCanvas',
    success: (res) => {
      hideLoading()
      // #ifdef H5
      const link = document.createElement('a')
      link.href = res.tempFilePath
      link.download = 'qrcode.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showSuccess('已下载')
      // #endif
      // #ifdef MP-WEIXIN
      uni.saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
        success: () => showSuccess('已保存到相册'),
        fail: () => showToast('保存失败，请检查相册权限')
      })
      // #endif
    },
    fail: () => {
      hideLoading()
      showToast('导出失败')
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
.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  margin-bottom: 24rpx;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
  &:not(:last-child) { border-bottom: 1rpx solid #F5F5F7; }
}
.label { font-size: 28rpx; color: #1D1D1F; }
.input {
  background: #F5F5F7;
  border-radius: 12rpx;
  padding: 10rpx 24rpx;
  font-size: 28rpx;
  width: 320rpx;
  color: #1D1D1F;
}
.seg {
  display: flex;
  gap: 10rpx;
}
.seg-item {
  padding: 10rpx 18rpx;
  background: #F5F5F7;
  border-radius: 10rpx;
  font-size: 24rpx;
  color: #3A3A3C;
  &:active { opacity: 0.7; }
  &--active {
    background: #1D1D1F;
    color: #fff;
  }
}
.btn {
  width: 100%;
  margin-top: 24rpx;
  background: #1D1D1F;
  color: #fff;
  border: none;
  border-radius: 16rpx;
  padding: 20rpx 0;
  font-size: 30rpx;
  &:active { opacity: 0.8; }
}
.qr-card {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.qr-canvas {
  display: block;
  background: #fff;
  border-radius: 8rpx;
}
.qr-actions {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #F5F5F7;
  width: 100%;
  text-align: center;
}
.action {
  font-size: 26rpx;
  color: #007AFF;
  padding: 8rpx 32rpx;
  &:active { opacity: 0.6; }
}
.tip {
  font-size: 24rpx;
  color: #86868B;
  line-height: 1.7;
}
</style>
