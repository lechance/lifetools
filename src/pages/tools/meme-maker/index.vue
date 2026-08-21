<template>
  <view class="page">
    <view class="empty" v-if="!imagePath" @tap="chooseImage">
      <text class="empty-icon">😄</text>
      <text class="empty-text">选择图片制作表情包</text>
      <text class="empty-sub">点击添加，支持相册与拍照</text>
    </view>

    <view v-if="imagePath" class="card">
      <view class="canvas-wrap" @tap="chooseImage">
        <canvas canvas-id="memeCanvas" id="memeCanvas" class="meme-canvas"
          :style="{ width: canvasW + 'px', height: canvasH + 'px' }"></canvas>
        <text class="replace-hint">点击更换图片</text>
      </view>

      <view class="field">
        <text class="field-label">顶部文字</text>
        <input class="field-input" v-model="topText" maxlength="20" placeholder="上方文字" @input="draw" />
      </view>
      <view class="field">
        <text class="field-label">底部文字</text>
        <input class="field-input" v-model="bottomText" maxlength="20" placeholder="下方文字" @input="draw" />
      </view>
      <view class="field">
        <text class="field-label">文字颜色</text>
        <view class="color-row">
          <view v-for="c in colors" :key="c" class="color-dot" :class="{ 'color-dot--active': textColor === c }"
            :style="{ background: c }" @tap="selectColor(c)"></view>
        </view>
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
import { saveCheckedImage, secCheck } from '@/utils/sec-check'

const colors = ['#FFFFFF', '#000000', '#FF1744', '#FFD600', '#00E676', '#2979FF']

const imagePath = ref('')
const showSheet = ref(false)
const canvasW = ref(300)
const canvasH = ref(300)
const topText = ref('')
const bottomText = ref('')
const textColor = ref('#FFFFFF')
const secCheckResult = ref(null)

function chooseImage() {
  showSheet.value = true
}

/** 选源弹窗回调：拍摄 / 相册 / 聊天记录 */
async function onSourceSelect(source) {
  showSheet.value = false
  try {
    const { paths } = await pickImage({ source, count: 1 })
    imagePath.value = paths[0]
    secCheckResult.value = null
    secCheck(paths[0]).then((r) => { secCheckResult.value = r })
    uni.getImageInfo({
      src: imagePath.value,
      success: (info) => {
        const ratio = info.width / info.height
        if (ratio >= 1) { canvasW.value = 300; canvasH.value = Math.round(300 / ratio) }
        else { canvasH.value = 300; canvasW.value = Math.round(300 * ratio) }
        nextTick(() => draw())
      }
    })
  } catch (e) {}
}

function selectColor(c) {
  textColor.value = c
  draw()
}

function draw() {
  const ctx = uni.createCanvasContext('memeCanvas')
  ctx.drawImage(imagePath.value, 0, 0, canvasW.value, canvasH.value)

  const fontSize = Math.max(24, Math.round(canvasW.value / 10))
  ctx.setFontSize(fontSize)
  ctx.setFillStyle(textColor.value)
  ctx.setTextAlign('center')
  ctx.setStrokeStyle('rgba(0,0,0,0.7)')
  ctx.setLineWidth(3)

  if (topText.value.trim()) {
    ctx.setTextBaseline('top')
    const x = canvasW.value / 2
    ctx.strokeText(topText.value, x, 16)
    ctx.fillText(topText.value, x, 16)
  }
  if (bottomText.value.trim()) {
    ctx.setTextBaseline('bottom')
    const x = canvasW.value / 2
    ctx.strokeText(bottomText.value, x, canvasH.value - 16)
    ctx.fillText(bottomText.value, x, canvasH.value - 16)
  }
  ctx.draw()
}

function saveImage() {
  showLoading('保存中...')
  draw()
  setTimeout(() => {
    uni.canvasToTempFilePath({
      canvasId: 'memeCanvas',
      success: (res) => {
        hideLoading()
        // #ifdef H5
        const link = document.createElement('a')
        link.href = res.tempFilePath
        link.download = 'meme.png'
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
.meme-canvas { border-radius: 8rpx; }
.replace-hint {
  font-size: 22rpx;
  color: #8E8E93;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 20rpx;
  padding: 6rpx 20rpx;
  margin-top: 12rpx;
}
.field { margin-bottom: 20rpx; }
.field-label {
  display: block;
  font-size: 26rpx;
  color: #86868B;
  margin-bottom: 8rpx;
}
.field-input {
  background: #F5F5F7;
  border-radius: 12rpx;
  padding: 14rpx 24rpx;
  font-size: 28rpx;
  color: #1D1D1F;
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
