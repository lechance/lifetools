<template>
  <view class="page">
    <view class="empty" v-if="!imagePath" @tap="chooseImage">
      <text class="empty-icon">🔲</text>
      <text class="empty-text">选择一张图片进行九宫格切图</text>
      <text class="empty-tip">图片将自动裁剪为正方形并切成 3×3 共 9 张</text>
    </view>

    <!-- 选图后、切图前：画布预览 -->
    <view v-if="imagePath && !split" class="card">
      <view class="canvas-wrap" @tap="chooseImage">
        <canvas canvas-id="gridCanvas" id="gridCanvas" class="grid-canvas"
          :style="{ width: canvasW + 'px', height: canvasH + 'px' }"></canvas>
        <text class="replace-hint">点击更换图片</text>
      </view>
      <button class="btn" @tap="doSplit">开始切图</button>
    </view>

    <!-- 切图后：3×3 结果网格 -->
    <view v-if="split" class="card">
      <text class="result-title">切图结果（3×3）</text>
      <view class="grid">
        <view v-for="(p, i) in pieces" :key="i" class="grid-item">
          <image class="grid-img" :src="p" mode="aspectFill" />
          <text class="grid-num">{{ i + 1 }}</text>
        </view>
      </view>
      <button class="btn" @tap="saveAll">保存全部</button>
      <button class="btn btn--ghost" @tap="reset">重新切图</button>
    </view>
  </view>

  <ImageSourceSheet :visible="showSheet" @select="onSourceSelect" @close="showSheet = false" />
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { showToast, showSuccess, showLoading, hideLoading } from '@/utils/helpers'
import ImageSourceSheet from '@/components/ImageSourceSheet.vue'
import { pickImage } from '@/utils/image-picker'

const imagePath = ref('')
const showSheet = ref(false)
const canvasW = ref(300)
const canvasH = ref(300)
const split = ref(false)
const pieces = ref([])

let imgW = 0
let imgH = 0
// 正方形裁剪区域（原图坐标）
let cropSx = 0
let cropSy = 0
let cropSize = 0

function chooseImage() {
  showSheet.value = true
}

/** 选源弹窗回调：拍摄 / 相册 / 聊天记录 */
async function onSourceSelect(source) {
  showSheet.value = false
  try {
    const { paths } = await pickImage({ source, count: 1 })
    imagePath.value = paths[0]
    split.value = false
    pieces.value = []
    uni.getImageInfo({
      src: imagePath.value,
      success: (info) => {
        imgW = info.width
        imgH = info.height
        calcCrop()
        nextTick(() => drawPreview())
      }
    })
  } catch (e) {}
}

/** 计算居中的正方形裁剪区域 */
function calcCrop() {
  if (imgW >= imgH) {
    cropSize = imgH
    cropSx = (imgW - imgH) / 2
    cropSy = 0
  } else {
    cropSize = imgW
    cropSx = 0
    cropSy = (imgH - imgW) / 2
  }
  canvasW.value = 300
  canvasH.value = 300
}

function drawPreview() {
  const ctx = uni.createCanvasContext('gridCanvas')
  ctx.setFillStyle('#000')
  ctx.fillRect(0, 0, canvasW.value, canvasH.value)
  ctx.drawImage(imagePath.value, cropSx, cropSy, cropSize, cropSize, 0, 0, 300, 300)
  ctx.draw()
}

/** 执行切图：从画布提取 9 块 */
function doSplit() {
  showLoading('切图中...')
  const per = 100 // 画布显示每块 100px (300/3)
  const out = Math.round(cropSize / 3) // 输出高清尺寸
  const result = []
  let done = 0

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      uni.canvasToTempFilePath({
        canvasId: 'gridCanvas',
        x: col * per,
        y: row * per,
        width: per,
        height: per,
        destWidth: out,
        destHeight: out,
        success: (res) => {
          result[row * 3 + col] = res.tempFilePath
          done++
          if (done === 9) {
            pieces.value = result
            split.value = true
            hideLoading()
            showSuccess('切图完成')
          }
        },
        fail: () => {
          hideLoading()
          showToast('切图失败')
        }
      })
    }
  }
}

/** 保存全部 9 张 */
function saveAll() {
  // #ifdef H5
  pieces.value.forEach((p, i) => {
    const link = document.createElement('a')
    link.href = p
    link.download = `grid_${i + 1}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  })
  showSuccess('已开始下载')
  // #endif
  // #ifdef MP-WEIXIN
  saveToAlbum(0)
  // #endif
}

/** mp-weixin 逐张保存到相册 */
function saveToAlbum(index) {
  if (index >= pieces.value.length) {
    showSuccess('已全部保存到相册')
    return
  }
  uni.saveImageToPhotosAlbum({
    filePath: pieces.value[index],
    success: () => saveToAlbum(index + 1),
    fail: () => showToast('保存失败')
  })
}

function reset() {
  split.value = false
  pieces.value = []
  nextTick(() => drawPreview())
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
.empty-tip { font-size: 24rpx; color: #C7C7CC; }
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
  background: #000;
  border-radius: 8rpx;
  cursor: pointer;

  &:active { opacity: 0.7; }
}
.grid-canvas { display: block; }
.replace-hint {
  font-size: 22rpx;
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20rpx;
  padding: 6rpx 20rpx;
  margin-top: 12rpx;
}
.result-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 20rpx;
}
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4rpx;
  margin-bottom: 12rpx;
}
.grid-item {
  position: relative;
  width: 32%;
  padding-top: 32%;
}
.grid-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 4rpx;
}
.grid-num {
  position: absolute;
  top: 4rpx;
  left: 6rpx;
  font-size: 20rpx;
  color: #fff;
  background: rgba(0,0,0,0.5);
  border-radius: 4rpx;
  padding: 2rpx 6rpx;
}
</style>
