<template>
  <view class="page">
    <view class="empty" v-if="!imagePath" @tap="chooseImage">
      <text class="empty-icon">✂️</text>
      <text class="empty-text">选择一张图片进行裁剪</text>
      <text class="empty-sub">点击添加，支持相册与拍照</text>
    </view>

    <view v-if="imagePath" class="card">
      <view class="ratio-row">
        <view v-for="r in ratios" :key="r.key"
          class="ratio-btn" :class="{ 'ratio-btn--active': ratio === r.key }"
          @tap="selectRatio(r.key)">{{ r.label }}</view>
      </view>

      <view class="canvas-wrap" @tap="chooseImage">
        <canvas canvas-id="cropCanvas" id="cropCanvas" class="crop-canvas"
          :style="{ width: canvasW + 'px', height: canvasH + 'px' }"></canvas>
        <text class="replace-hint">点击更换图片</text>
      </view>

      <button class="btn" @tap="doCrop">裁剪</button>
      <button class="btn btn--ghost" v-if="cropped" @tap="saveImage">保存图片</button>
    </view>
  </view>

  <ImageSourceSheet :visible="showSheet" @select="onSourceSelect" @close="showSheet = false" />
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { showToast, showSuccess, showLoading, hideLoading } from '@/utils/helpers'
import ImageSourceSheet from '@/components/ImageSourceSheet.vue'
import { pickImage } from '@/utils/image-picker'
import { saveCheckedImage, secCheck, showSecCheckFailToast } from '@/utils/sec-check'

const ratios = [
  { key: '1:1', label: '1:1' },
  { key: '3:4', label: '3:4' },
  { key: '4:3', label: '4:3' },
  { key: '9:16', label: '9:16' },
  { key: '16:9', label: '16:9' },
]

const imagePath = ref('')
const showSheet = ref(false)
const ratio = ref('1:1')
const canvasW = ref(300)
const canvasH = ref(300)
const cropped = ref(false)
const imgW = ref(0)
const imgH = ref(0)
const secCheckResult = ref(null)

function chooseImage() {
  showSheet.value = true
}

/** 选源弹窗回调：拍摄 / 相册 / 聊天记录 */
async function onSourceSelect(source) {
  showSheet.value = false
  try {
    const { paths } = await pickImage({ source, count: 1 })
    // 安全校验通过后才加载显示；失败则保留原状态
    const checkResult = await secCheck(paths[0])
    if (!checkResult.safe) {
      showSecCheckFailToast(checkResult.error)
      return
    }
    secCheckResult.value = checkResult
    imagePath.value = paths[0]
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
  } catch (e) {}
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
  // 按显示尺寸绘制（画布缓冲区与显示一致，避免绘制超出缓冲区被裁剪）
  const r = getRatio()
  let sx, sy, sw, sh
  if (imgW.value / imgH.value >= r) {
    sh = imgH.value; sw = imgH.value * r; sx = (imgW.value - sw) / 2; sy = 0
  } else {
    sw = imgW.value; sh = imgW.value / r; sx = 0; sy = (imgH.value - sh) / 2
  }
  ctx.drawImage(imagePath.value, sx, sy, sw, sh, 0, 0, canvasW.value, canvasH.value)
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
      saveCheckedImage(res.tempFilePath, {
        onSuccess: () => showSuccess('已保存到相册'),
        onFail: () => showToast('保存失败')
      }, secCheckResult.value)
      // #endif
    }
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
  flex-direction: column;
  align-items: center;
  background: #000;
  border-radius: 8rpx;
  cursor: pointer;

  &:active { opacity: 0.7; }
}
.crop-canvas { display: block; }
.replace-hint {
  font-size: 22rpx;
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20rpx;
  padding: 6rpx 20rpx;
  margin-top: 12rpx;
}
</style>
