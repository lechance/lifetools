<template>
  <view class="page">
    <view class="empty" v-if="!images.length" @tap="chooseImages">
      <text class="empty-icon">🧩</text>
      <text class="empty-text">选择 2-9 张图片拼接</text>
      <text class="empty-sub">点击添加，支持相册与拍照</text>
    </view>

    <view v-if="images.length" class="card">
      <view class="thumbs" @tap="chooseImages">
        <view v-for="(img, i) in images" :key="i" class="thumb">
          <image class="thumb-img" :src="img" mode="aspectFill" />
          <text class="thumb-del" @tap.stop="removeImage(i)">✕</text>
        </view>
      </view>
      <text class="replace-hint" @tap="chooseImages">点击选择其他图片</text>

      <view class="dir-row">
        <view class="dir-btn" :class="{ 'dir-btn--active': dir === 'vertical' }" @tap="dir = 'vertical'">上下拼接</view>
        <view class="dir-btn" :class="{ 'dir-btn--active': dir === 'horizontal' }" @tap="dir = 'horizontal'">左右拼接</view>
      </view>

      <button class="btn" @tap="stitch" :disabled="busy">开始拼接</button>
      <button class="btn btn--ghost" v-if="result" @tap="saveImage" :disabled="busy">保存图片</button>
    </view>

    <view v-if="result" class="card">
      <view class="canvas-wrap" :style="{ width: dispW + 'px', height: dispH + 'px' }">
        <canvas canvas-id="stitchCanvas" id="stitchCanvas" class="stitch-canvas"
          :style="{ width: canvasW + 'px', height: canvasH + 'px' }"></canvas>
      </view>
    </view>
  </view>

  <ImageSourceSheet :visible="showSheet" @select="onSourceSelect" @close="showSheet = false" />
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import { showToast, showSuccess, showLoading, hideLoading } from '@/utils/helpers'
import ImageSourceSheet from '@/components/ImageSourceSheet.vue'
import { pickImage } from '@/utils/image-picker'
import { saveCheckedImage, secCheck, showSecCheckFailToast } from '@/utils/sec-check'

const GAP = 2
const MAX_OUT = 4096

const images = ref([])
const showSheet = ref(false)
const dir = ref('vertical')
const result = ref(false)
const busy = ref(false)
const canvasW = ref(300)
const canvasH = ref(300)
const dispW = ref(300)
const dispH = ref(300)
const secCheckResult = ref(null)
let outW = 0
let outH = 0
let placements = []
let drawToken = 0

function chooseImages() {
  showSheet.value = true
}

async function onSourceSelect(source) {
  if (busy.value) return
  showSheet.value = false
  try {
    const { paths } = await pickImage({ source, count: 9 })
    // 安全校验通过后才加载显示；失败则保留原状态
    if (paths[0]) {
      const checkResult = await secCheck(paths[0])
      if (!checkResult.safe) {
        showSecCheckFailToast(checkResult.error)
        return
      }
      secCheckResult.value = checkResult
    }
    images.value = paths
    result.value = false
  } catch (e) {}
}

function removeImage(i) {
  if (busy.value) return
  images.value.splice(i, 1)
  result.value = false
}

watch(dir, () => {
  result.value = false
})

function stitch() {
  if (busy.value) return
  if (images.value.length < 2) {
    showToast('请选择至少 2 张图片')
    return
  }
  busy.value = true
  showLoading('拼接中...')
  const count = images.value.length
  let loaded = 0
  let failed = false
  const sizes = []
  images.value.forEach((src, i) => {
    uni.getImageInfo({
      src,
      success: (info) => {
        if (failed) return
        sizes[i] = { w: info.width, h: info.height }
        loaded++
        if (loaded === count) computeAndDraw(sizes)
      },
      fail: () => {
        if (failed) return
        failed = true
        busy.value = false
        hideLoading()
        showToast('图片加载失败')
      }
    })
  })
}

function computeAndDraw(sizes) {
  const gapCount = images.value.length - 1
  const totalGap = gapCount * GAP

  let natW, natH
  if (dir.value === 'vertical') {
    const commonW = Math.max(...sizes.map(s => s.w))
    natW = commonW
    natH = sizes.reduce((a, s) => a + Math.round(s.h * commonW / s.w), 0) + totalGap
  } else {
    const commonH = Math.max(...sizes.map(s => s.h))
    natH = commonH
    natW = sizes.reduce((a, s) => a + Math.round(s.w * commonH / s.h), 0) + totalGap
  }
  const scale = Math.min(1, MAX_OUT / Math.max(natW, natH))

  placements = []
  if (dir.value === 'vertical') {
    const commonW = Math.round(Math.max(...sizes.map(s => s.w)) * scale)
    let y = 0
    sizes.forEach((s, i) => {
      const h = Math.round(s.h * commonW / s.w)
      placements.push({ x: 0, y, w: commonW, h })
      y += h + GAP
    })
    outW = commonW
    outH = Math.max(1, y - GAP)
  } else {
    const commonH = Math.round(Math.max(...sizes.map(s => s.h)) * scale)
    let x = 0
    sizes.forEach((s, i) => {
      const w = Math.round(s.w * commonH / s.h)
      placements.push({ x, y: 0, w, h: commonH })
      x += w + GAP
    })
    outW = Math.max(1, x - GAP)
    outH = commonH
  }

  result.value = true
  nextTick(async () => {
    await drawPreview()
    busy.value = false
    hideLoading()
    showSuccess('拼接完成')
  })
}

/** 读取 canvas 元素实际渲染尺寸（H5 的 uni-canvas 包装元素 / mp-weixin 原生节点） */
function queryCanvasSize() {
  return new Promise((resolve) => {
    let settled = false
    const finish = (r) => { if (!settled) { settled = true; resolve(r) } }
    try {
      uni.createSelectorQuery().select('#stitchCanvas').boundingClientRect((rect) => {
        finish(rect ? { w: rect.width, h: rect.height } : null)
      }).exec()
    } catch (e) {
      finish(null)
    }
    setTimeout(() => finish(null), 500)
  })
}

async function waitCanvasSize(w, h, timeout = 3000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const r = await queryCanvasSize()
    if (r && Math.abs(r.w - w) <= 1 && Math.abs(r.h - h) <= 1) {
      await new Promise((rs) => setTimeout(rs, 80))
      return true
    }
    await new Promise((rs) => setTimeout(rs, 100))
  }
  return false
}

/** 等待 canvas 缓冲区随尺寸变化异步重建后返回 */
async function setCanvasSize(w, h) {
  canvasW.value = w
  canvasH.value = h
  await nextTick()
  await waitCanvasSize(w, h)
}

function drawToCanvas(w, h, scaleX, scaleY) {
  return new Promise((resolve) => {
    const ctx = uni.createCanvasContext('stitchCanvas')
    ctx.setFillStyle('#fff')
    ctx.fillRect(0, 0, w, h)
    images.value.forEach((src, i) => {
      const p = placements[i]
      ctx.drawImage(src, p.x * scaleX, p.y * scaleY, p.w * scaleX, p.h * scaleY)
    })
    ctx.draw(false, () => resolve())
  })
}

function calcDisplaySize() {
  const ratio = outW / outH
  if (ratio >= 1) { dispW.value = 300; dispH.value = Math.round(300 / ratio) }
  else { dispH.value = 400; dispW.value = Math.round(400 * ratio) }
}

async function drawPreview() {
  calcDisplaySize()
  const dw = dispW.value
  const dh = dispH.value
  await setCanvasSize(dw, dh)
  await drawToCanvas(dw, dh, dw / outW, dh / outH)
}

async function saveImage() {
  if (busy.value) return
  busy.value = true
  const token = ++drawToken
  showLoading('导出中...')
  await setCanvasSize(outW, outH)
  await drawToCanvas(outW, outH, 1, 1)
  uni.canvasToTempFilePath({
    canvasId: 'stitchCanvas',
    destWidth: outW,
    destHeight: outH,
    quality: 1,
    success: async (res) => {
      await drawPreview()
      if (token !== drawToken) return
      busy.value = false
      // #ifdef H5
      const link = document.createElement('a')
      link.href = res.tempFilePath
      link.download = 'stitch.jpg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      hideLoading()
      showSuccess('已下载')
      // #endif
      // #ifdef MP-WEIXIN
      saveCheckedImage(res.tempFilePath, {
        onSuccess: () => { hideLoading(); showSuccess('已保存到相册') },
        onFail: () => { hideLoading(); showToast('保存失败') }
      }, secCheckResult.value)
      // #endif
    },
    fail: () => { busy.value = false; hideLoading(); showToast('导出失败') }
  })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #F5F5F7;
  padding: 24rpx;
}
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
  &[disabled] { opacity: 0.4; }
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
  margin-bottom: 24rpx;
}
.thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 20rpx;
  cursor: pointer;

  &:active { opacity: 0.7; }
}
.thumb {
  position: relative;
  width: 160rpx;
  height: 160rpx;
}
.thumb-img {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
}
.thumb-del {
  position: absolute;
  top: -12rpx;
  right: -12rpx;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
}
.dir-row {
  display: flex;
  gap: 12rpx;
  margin-bottom: 16rpx;
}
.dir-btn {
  flex: 1;
  padding: 16rpx 0;
  background: #F5F5F7;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #3A3A3C;
  text-align: center;
  &:active { opacity: 0.7; }
  &--active { background: #1D1D1F; color: #fff; }
}
.canvas-wrap {
  position: relative;
  overflow: hidden;
  background: #fff;
  margin: 0 auto;
  border-radius: 8rpx;
}
.stitch-canvas {
  display: block;
  flex-shrink: 0;
}
.replace-hint {
  display: block;
  text-align: center;
  font-size: 22rpx;
  color: #8E8E93;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 20rpx;
  padding: 6rpx 20rpx;
  margin-bottom: 20rpx;
  cursor: pointer;

  &:active { opacity: 0.7; }
}
</style>
