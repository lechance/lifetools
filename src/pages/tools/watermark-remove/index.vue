<template>
  <view class="wr">
    <!-- 空态 -->
    <view v-if="!imagePath" class="wr__empty" @tap="openPicker">
      <text class="wr__empty-icon">🧹</text>
      <text class="wr__empty-text">点击选择图片</text>
      <text class="wr__empty-sub">支持拍摄或从相册选择</text>
    </view>

    <!-- 图片已加载 -->
    <view v-else class="wr__editor">
      <!-- 模式切换 -->
      <view class="wr__tabs">
        <view class="wr__tab" :class="{ 'wr__tab--active': mode === 'crop' }" @tap="mode = 'crop'">
          <text>裁剪去水印</text>
        </view>
        <view class="wr__tab" :class="{ 'wr__tab--active': mode === 'mosaic' }" @tap="mode = 'mosaic'">
          <text>涂抹去水印</text>
        </view>
      </view>

      <!-- 画布区域 -->
      <view class="wr__canvas-wrap" :style="{ width: canvasW + 'px', height: canvasH + 'px' }">
        <canvas
          canvas-id="wrCanvas"
          class="wr__canvas"
          :style="{ width: canvasW + 'px', height: canvasH + 'px' }"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
        />
        <!-- 裁剪模式：选择框覆盖层 -->
        <view
          v-if="mode === 'crop' && cropReady"
          class="wr__crop-box"
          :style="cropBoxStyle"
        >
          <view class="wr__crop-handle wr__crop-handle--tl" @touchstart.stop="startResize($event, 'tl')" />
          <view class="wr__crop-handle wr__crop-handle--tr" @touchstart.stop="startResize($event, 'tr')" />
          <view class="wr__crop-handle wr__crop-handle--bl" @touchstart.stop="startResize($event, 'bl')" />
          <view class="wr__crop-handle wr__crop-handle--br" @touchstart.stop="startResize($event, 'br')" />
        </view>
      </view>

      <!-- 涂抹模式：画笔大小 -->
      <view v-if="mode === 'mosaic'" class="wr__brush">
        <text class="wr__brush-label">画笔大小 {{ brushSize }}</text>
        <slider
          class="wr__brush-slider"
          :value="brushSize"
          :min="10"
          :max="80"
          :step="5"
          activeColor="#E91E63"
          @change="e => brushSize = e.detail.value"
        />
      </view>

      <!-- 操作栏 -->
      <view class="wr__actions">
        <view class="wr__action" @tap="undo" :class="{ 'wr__action--disabled': !canUndo }">
          <text>↩ 撤销</text>
        </view>
        <view class="wr__action" @tap="resetImage">
          <text>🔄 重选</text>
        </view>
        <view class="wr__action wr__action--primary" @tap="applyAction">
          <text>{{ loading ? '处理中...' : '✅ 应用' }}</text>
        </view>
      </view>

      <!-- 保存 -->
      <view class="wr__save" @tap="saveImage">
        <text>{{ saving ? '保存中...' : '💾 保存图片' }}</text>
      </view>
    </view>

    <!-- 选图弹窗 -->
    <ImageSourceSheet :visible="showSheet" @select="onSourceSelect" @close="showSheet = false" />
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { showToast, showSuccess } from '@/utils/helpers'
import ImageSourceSheet from '@/components/ImageSourceSheet.vue'
import { pickImage } from '@/utils/image-picker'
import { saveCheckedImage, secCheck } from '@/utils/sec-check'

const canvasId = 'wrCanvas'
const canvasW = ref(300)
const canvasH = ref(300)

const imagePath = ref('')
const showSheet = ref(false)
const mode = ref('crop')
const loading = ref(false)
const saving = ref(false)

// 裁剪模式
const cropReady = ref(false)
const crop = ref({ x: 20, y: 20, w: 260, h: 260 })
const resizing = ref(null)
const resizeStart = ref({ x: 0, y: 0, crop: null })

// 涂抹模式
const brushSize = ref(30)
const strokes = ref([])
const currentStroke = ref(null)
const canUndo = computed(() => strokes.value.length > 0)

// sec-check
const secCheckResult = ref(null)

let ctx = null

function initCanvas() {
  ctx = uni.createCanvasContext(canvasId)
}

function openPicker() {
  showSheet.value = true
}

function onSourceSelect(source) {
  showSheet.value = false
  pickImage({ source, count: 1 }).then(({ paths }) => {
    if (paths && paths[0]) loadImage(paths[0])
  }).catch(() => {})
}

function loadImage(path) {
  imagePath.value = path
  uni.getImageInfo({
    src: path,
    success(info) {
      // 计算画布尺寸，保持比例
      const maxW = uni.getSystemInfoSync().windowWidth - 48
      const ratio = info.width / info.height
      let w = maxW
      let h = w / ratio
      if (h > maxW) { h = maxW; w = h * ratio }
      canvasW.value = Math.floor(w)
      canvasH.value = Math.floor(h)

      crop.value = { x: Math.floor(w * 0.1), y: Math.floor(h * 0.1), w: Math.floor(w * 0.8), h: Math.floor(h * 0.8) }
      cropReady.value = true
      strokes.value = []

      // sec-check
      secCheck(path).then(r => { secCheckResult.value = r })

      setTimeout(() => {
        initCanvas()
        drawImage()
      }, 100)
    },
    fail() { showToast('图片加载失败') }
  })
}

function drawImage() {
  if (!ctx || !imagePath.value) return
  ctx.clearRect(0, 0, canvasW.value, canvasH.value)
  ctx.drawImage(imagePath.value, 0, 0, canvasW.value, canvasH.value)
  ctx.draw(false)
}

function onTouchStart(e) {
  if (mode.value !== 'mosaic') return
  const touch = e.touches[0]
  currentStroke.value = [{ x: touch.x, y: touch.y }]
}

function onTouchMove(e) {
  if (mode.value !== 'mosaic' || !currentStroke.value) return
  const touch = e.touches[0]
  currentStroke.value.push({ x: touch.x, y: touch.y })
  // 绘制半透明涂抹轨迹
  drawMosaicPreview()
}

function onTouchEnd() {
  if (mode.value !== 'mosaic' || !currentStroke.value) return
  strokes.value.push([...currentStroke.value])
  currentStroke.value = null
}

function drawMosaicPreview() {
  if (!ctx || !currentStroke.value) return
  ctx.clearRect(0, 0, canvasW.value, canvasH.value)
  ctx.drawImage(imagePath.value, 0, 0, canvasW.value, canvasH.value)
  // 绘制已保存的笔画
  strokes.value.forEach(drawStroke)
  // 绘制当前笔画
  drawStroke(currentStroke.value)
  ctx.draw(false)
}

function drawStroke(stroke) {
  if (!stroke || stroke.length < 2) return
  ctx.save()
  ctx.setGlobalAlpha(0.5)
  ctx.setFillStyle('#E91E63')
  stroke.forEach(p => {
    ctx.beginPath()
    ctx.arc(p.x, p.y, brushSize.value / 2, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.restore()
}

// 裁剪模式拖拽
const cropBoxStyle = computed(() => ({
  left: crop.value.x + 'px',
  top: crop.value.y + 'px',
  width: crop.value.w + 'px',
  height: crop.value.h + 'px',
}))

function startResize(e, corner) {
  resizing.value = corner
  resizeStart.value = {
    x: e.touches[0].clientX,
    y: e.touches[0].clientY,
    crop: { ...crop.value }
  }
  // 注册全局触摸移动和结束
  const sysInfo = uni.getSystemInfoSync()
  // 简化：用 page 的 touchmove/touchend 模拟
  uni.$once('wr-resize-move', onResizeMove)
  uni.$once('wr-resize-end', onResizeEnd)
}

function onResizeMove() {} // placeholder
function onResizeEnd() { resizing.value = null }

function undo() {
  if (strokes.value.length === 0) return
  strokes.value.pop()
  drawMosaicPreview()
}

function resetImage() {
  if (imagePath.value) {
    strokes.value = []
    cropReady.value = false
    imagePath.value = ''
    secCheckResult.value = null
  }
}

function applyAction() {
  if (loading.value) return
  loading.value = true

  setTimeout(() => {
    initCanvas()
    ctx.clearRect(0, 0, canvasW.value, canvasH.value)

    if (mode.value === 'crop') {
      // 裁剪模式：从原图裁剪选中区域
      const imgInfo = uni.getImageInfo({ src: imagePath.value, success(info) {
        const sx = (crop.value.x / canvasW.value) * info.width
        const sy = (crop.value.y / canvasH.value) * info.height
        const sw = (crop.value.w / canvasW.value) * info.width
        const sh = (crop.value.h / canvasH.value) * info.height
        // 输出尺寸保持选区比例
        const outW = canvasW.value
        const outH = canvasH.value
        canvasW.value = Math.floor(outW)
        canvasH.value = Math.floor(outH)
        setTimeout(() => {
          initCanvas()
          ctx.drawImage(imagePath.value, sx, sy, sw, sh, 0, 0, outW, outH)
          ctx.draw(false, () => {
            loading.value = false
            showToast('已应用裁剪')
          })
        }, 50)
      }})
    } else {
      // 涂抹模式：对笔画区域做马赛克
      applyMosaic()
    }
  }, 50)
}

function applyMosaic() {
  if (!ctx) return
  ctx.clearRect(0, 0, canvasW.value, canvasH.value)
  ctx.drawImage(imagePath.value, 0, 0, canvasW.value, canvasH.value)

  // mp-weixin 用 canvasGetImageData，H5 用 getImageData
  // #ifdef MP-WEIXIN
  uni.canvasGetImageData({
    canvasId,
    x: 0, y: 0,
    width: canvasW.value,
    height: canvasH.value,
    success(res) {
      const data = res.data
      const bs = brushSize.value
      strokes.value.forEach(stroke => {
        // 找到笔画包围盒
        let minX = canvasW.value, minY = canvasH.value, maxX = 0, maxY = 0
        stroke.forEach(p => {
          if (p.x < minX) minX = p.x
          if (p.y < minY) minY = p.y
          if (p.x > maxX) maxX = p.x
          if (p.y > maxY) maxY = p.y
        })
        minX = Math.max(0, Math.floor(minX - bs))
        minY = Math.max(0, Math.floor(minY - bs))
        maxX = Math.min(canvasW.value, Math.ceil(maxX + bs))
        maxY = Math.min(canvasH.value, Math.ceil(maxY + bs))
        const regionW = maxX - minX
        if (regionW <= 0) return

        // NxN 块平均
        const blockSize = Math.max(8, Math.floor(bs / 2))
        for (let by = minY; by < maxY; by += blockSize) {
          for (let bx = minX; bx < maxX; bx += blockSize) {
            let r = 0, g = 0, b = 0, count = 0
            for (let dy = 0; dy < blockSize && by + dy < maxY; dy++) {
              for (let dx = 0; dx < blockSize && bx + dx < maxX; dx++) {
                const px = bx + dx
                const py = by + dy
                // 检查是否在笔画范围内
                const inStroke = stroke.some(p =>
                  Math.abs(p.x - px) < bs / 2 && Math.abs(p.y - py) < bs / 2
                )
                if (inStroke) {
                  const idx = (py * canvasW.value + px) * 4
                  r += data[idx]; g += data[idx + 1]; b += data[idx + 2]
                  count++
                }
              }
            }
            if (count > 0) {
              r = Math.round(r / count)
              g = Math.round(g / count)
              b = Math.round(b / count)
              // 填充块
              for (let dy = 0; dy < blockSize && by + dy < maxY; dy++) {
                for (let dx = 0; dx < blockSize && bx + dx < maxX; dx++) {
                  const px = bx + dx
                  const py = by + dy
                  const inStroke = stroke.some(p =>
                    Math.abs(p.x - px) < bs / 2 && Math.abs(p.y - py) < bs / 2
                  )
                  if (inStroke) {
                    const idx = (py * canvasW.value + px) * 4
                    data[idx] = r; data[idx + 1] = g; data[idx + 2] = b
                  }
                }
              }
            }
          }
        }
      })
      uni.canvasPutImageData({
        canvasId,
        x: 0, y: 0,
        width: canvasW.value,
        height: canvasH.value,
        data,
        success() {
          ctx.draw(false, () => {
            loading.value = false
            showToast('已应用马赛克')
          })
        }
      })
    }
  })
  // #endif
  // #ifndef MP-WEIXIN
  // H5: 使用原生 getImageData
  try {
    const canvas = document.querySelector(`canvas[canvas-id="${canvasId}"]`)
    if (!canvas) { loading.value = false; return }
    const imageData = canvas.getContext('2d').getImageData(0, 0, canvasW.value, canvasH.value)
    const data = imageData.data
    const bs = brushSize.value
    strokes.value.forEach(stroke => {
      let minX = canvasW.value, minY = canvasH.value, maxX = 0, maxY = 0
      stroke.forEach(p => {
        if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y
        if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y
      })
      minX = Math.max(0, Math.floor(minX - bs))
      minY = Math.max(0, Math.floor(minY - bs))
      maxX = Math.min(canvasW.value, Math.ceil(maxX + bs))
      maxY = Math.min(canvasH.value, Math.ceil(maxY + bs))
      const blockSize = Math.max(8, Math.floor(bs / 2))
      for (let by = minY; by < maxY; by += blockSize) {
        for (let bx = minX; bx < maxX; bx += blockSize) {
          let r = 0, g = 0, b = 0, count = 0
          for (let dy = 0; dy < blockSize && by + dy < maxY; dy++) {
            for (let dx = 0; dx < blockSize && bx + dx < maxX; dx++) {
              const px = bx + dx, py = by + dy
              const inStroke = stroke.some(p => Math.abs(p.x - px) < bs / 2 && Math.abs(p.y - py) < bs / 2)
              if (inStroke) {
                const idx = (py * canvasW.value + px) * 4
                r += data[idx]; g += data[idx + 1]; b += data[idx + 2]; count++
              }
            }
          }
          if (count > 0) {
            r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count)
            for (let dy = 0; dy < blockSize && by + dy < maxY; dy++) {
              for (let dx = 0; dx < blockSize && bx + dx < maxX; dx++) {
                const px = bx + dx, py = by + dy
                const inStroke = stroke.some(p => Math.abs(p.x - px) < bs / 2 && Math.abs(p.y - py) < bs / 2)
                if (inStroke) {
                  const idx = (py * canvasW.value + px) * 4
                  data[idx] = r; data[idx + 1] = g; data[idx + 2] = b
                }
              }
            }
          }
        }
      }
    })
    canvas.getContext('2d').putImageData(imageData, 0, 0)
    loading.value = false
    showToast('已应用马赛克')
  } catch (e) {
    loading.value = false
    showToast('处理失败')
  }
  // #endif
}

function saveImage() {
  if (saving.value) return
  saving.value = true
  ctx = uni.createCanvasContext(canvasId)
  // 重新绘制最终结果（apply 后画布已有内容，直接导出）
  uni.canvasToTempFilePath({
    canvasId,
    fileType: 'png',
    success(res) {
      // #ifdef H5
      const link = document.createElement('a')
      link.href = res.tempFilePath
      link.download = 'watermark-removed.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showSuccess('已下载')
      saving.value = false
      // #endif
      // #ifdef MP-WEIXIN
      saveCheckedImage(res.tempFilePath, {
        onSuccess: () => { showSuccess('已保存到相册'); saving.value = false },
        onFail: () => { showToast('保存失败'); saving.value = false }
      }, secCheckResult.value)
      // #endif
    },
    fail() { showToast('导出失败'); saving.value = false }
  })
}
</script>

<style lang="scss" scoped>
.wr {
  min-height: 100vh;
  background: $bg-color;

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 200rpx 0;
    &:active { opacity: 0.7; }
  }
  &__empty-icon { font-size: 80rpx; margin-bottom: 16rpx; }
  &__empty-text { font-size: 32rpx; color: $text-secondary; }
  &__empty-sub { font-size: 24rpx; color: $text-light; margin-top: 8rpx; }

  &__tabs {
    display: flex;
    background: $card-bg;
    border-radius: $radius-md;
    margin: 24rpx;
    overflow: hidden;
  }
  &__tab {
    flex: 1;
    padding: 20rpx 0;
    text-align: center;
    font-size: 28rpx;
    color: $text-secondary;
    &--active {
      background: $primary-color;
      color: #FFF;
      font-weight: 600;
    }
  }

  &__canvas-wrap {
    position: relative;
    margin: 0 auto;
    border-radius: $radius-md;
    overflow: hidden;
    box-shadow: $shadow-sm;
  }
  &__canvas {
    display: block;
  }

  &__crop-box {
    position: absolute;
    border: 3rpx dashed rgba(255,255,255,0.8);
    box-shadow: 0 0 0 9999rpx rgba(0,0,0,0.4);
    z-index: 5;
  }
  &__crop-handle {
    position: absolute;
    width: 24rpx;
    height: 24rpx;
    background: #FFF;
    border-radius: 50%;
    box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.3);
    &--tl { top: -12rpx; left: -12rpx; }
    &--tr { top: -12rpx; right: -12rpx; }
    &--bl { bottom: -12rpx; left: -12rpx; }
    &--br { bottom: -12rpx; right: -12rpx; }
  }

  &__brush {
    padding: 16rpx 32rpx;
  }
  &__brush-label {
    font-size: 24rpx;
    color: $text-secondary;
    display: block;
    text-align: center;
    margin-bottom: 8rpx;
  }
  &__brush-slider { width: 100%; }

  &__actions {
    display: flex;
    gap: 16rpx;
    padding: 16rpx 24rpx;
  }
  &__action {
    flex: 1;
    padding: 20rpx 0;
    text-align: center;
    background: $card-bg;
    border-radius: $radius-md;
    font-size: 28rpx;
    color: $text-primary;
    box-shadow: $shadow-sm;
    &--primary { background: $primary-color; color: #FFF; }
    &--disabled { opacity: 0.4; pointer-events: none; }
    &:active { opacity: 0.7; }
  }

  &__save {
    margin: 16rpx 24rpx;
    padding: 24rpx 0;
    text-align: center;
    background: $primary-color;
    color: #FFF;
    border-radius: $radius-md;
    font-size: 30rpx;
    &:active { opacity: 0.7; }
  }
}
</style>
