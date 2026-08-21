<template>
  <view class="page">
    <view class="empty" v-if="!imagePath" @tap="chooseImage">
      <text class="empty-icon">📷</text>
      <text class="empty-text">选择一张正面照制作证件照</text>
      <text class="empty-sub">点击添加，支持相册与拍照</text>
    </view>

    <view v-if="imagePath" class="card">
      <view class="canvas-wrap" @tap="chooseImage">
        <canvas canvas-id="idphotoCanvas" id="idphotoCanvas" class="idphoto-canvas"
          :style="{ width: canvasW + 'px', height: canvasH + 'px' }"></canvas>
        <text class="replace-hint">点击更换图片</text>
      </view>

      <view class="row">
        <text class="row-label">尺寸</text>
        <view class="seg">
          <view class="seg-item" :class="{ 'seg-item--active': sizeKey === '1inch' }" @tap="selectSize('1inch')">一寸</view>
          <view class="seg-item" :class="{ 'seg-item--active': sizeKey === '2inch' }" @tap="selectSize('2inch')">二寸</view>
        </view>
      </view>
      <view class="row">
        <text class="row-label">底色</text>
        <view class="bg-row">
          <view v-for="b in bgColors" :key="b.key" class="bg-dot" :class="{ 'bg-dot--active': bgColor === b.color }"
            :style="{ background: b.color }" @tap="selectBg(b.color)"></view>
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

// 一寸 295x413，二寸 413x579
const SIZES = {
  '1inch': { w: 295, h: 413 },
  '2inch': { w: 413, h: 579 },
}
const bgColors = [
  { key: 'red', color: '#D9001B' },
  { key: 'blue', color: '#2E5C99' },
  { key: 'white', color: '#FFFFFF' },
]

const imagePath = ref('')
const showSheet = ref(false)
const sizeKey = ref('1inch')
const bgColor = ref('#D9001B')
const canvasW = ref(240)
const canvasH = ref(336)
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
    imagePath.value = paths[0]
    secCheckResult.value = null
    secCheck(paths[0]).then((r) => { secCheckResult.value = r })
    uni.getImageInfo({
      src: imagePath.value,
      success: (info) => {
        imgW.value = info.width
        imgH.value = info.height
        calcCanvas()
        nextTick(() => draw())
      },
      fail: () => {
        imgW.value = 0
        imgH.value = 0
        calcCanvas()
        nextTick(() => draw())
      }
    })
  } catch (e) {}
}

function calcCanvas() {
  const s = SIZES[sizeKey.value]
  const ratio = s.w / s.h
  if (ratio >= 1) { canvasW.value = 240; canvasH.value = Math.round(240 / ratio) }
  else { canvasH.value = 340; canvasW.value = Math.round(340 * ratio) }
}

function selectSize(key) {
  sizeKey.value = key
  calcCanvas()
  nextTick(() => draw())
}

function selectBg(color) {
  bgColor.value = color
  draw()
}

/** 按证件照比例对原图居中裁剪绘制（不拉伸变形），底色铺底 */
function draw(cb) {
  const s = SIZES[sizeKey.value]
  const targetRatio = s.w / s.h
  const ctx = uni.createCanvasContext('idphotoCanvas')
  // 背景
  ctx.setFillStyle(bgColor.value)
  ctx.fillRect(0, 0, canvasW.value, canvasH.value)

  // 图片按证件照比例居中裁剪绘制
  if (imagePath.value && imgW.value > 0) {
    let sx, sy, sw, sh
    if (imgW.value / imgH.value >= targetRatio) {
      sh = imgH.value
      sw = imgH.value * targetRatio
      sx = (imgW.value - sw) / 2
      sy = 0
    } else {
      sw = imgW.value
      sh = imgW.value / targetRatio
      sx = 0
      sy = (imgH.value - sh) / 2
    }
    ctx.drawImage(imagePath.value, sx, sy, sw, sh, 0, 0, canvasW.value, canvasH.value)
  }
  ctx.draw(false, cb || (() => {}))
}

function saveImage() {
  showLoading('生成中...')
  const s = SIZES[sizeKey.value]
  draw(() => {
    // destWidth/destHeight 控制导出为真实证件照尺寸
    uni.canvasToTempFilePath({
      canvasId: 'idphotoCanvas',
      destWidth: s.w,
      destHeight: s.h,
      success: (res) => {
        hideLoading()
        // #ifdef H5
        const link = document.createElement('a')
        link.href = res.tempFilePath
        link.download = 'idphoto.jpg'
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
      fail: () => { hideLoading(); showToast('生成失败') }
    })
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
.idphoto-canvas { border-radius: 8rpx; }
.replace-hint {
  font-size: 22rpx;
  color: #8E8E93;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 20rpx;
  padding: 6rpx 20rpx;
  margin-top: 12rpx;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 0;
}
.row-label { font-size: 26rpx; color: #86868B; }
.seg {
  display: flex;
  gap: 12rpx;
}
.seg-item {
  padding: 10rpx 28rpx;
  background: #F5F5F7;
  border-radius: 10rpx;
  font-size: 24rpx;
  color: #3A3A3C;
  &:active { opacity: 0.7; }
  &--active { background: #1D1D1F; color: #fff; }
}
.bg-row {
  display: flex;
  gap: 14rpx;
}
.bg-dot {
  width: 52rpx;
  height: 52rpx;
  border-radius: 10rpx;
  border: 2rpx solid #E5E5EA;
  &:active { transform: scale(0.9); }
  &--active { border: 4rpx solid #1D1D1F; }
}
</style>
