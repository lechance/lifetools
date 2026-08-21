<template>
  <view class="page">
    <!-- ====== 预览区：点击添加/更换图片 ====== -->
    <view
      class="page__preview"
      :class="{ 'page__preview--empty': !imagePath }"
      @tap="chooseImage"
    >
      <view v-if="canvasReady" class="page__preview-canvas">
        <canvas
          canvas-id="watermarkCanvas"
          id="watermarkCanvas"
          class="page__canvas"
          :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
        ></canvas>
        <view class="page__preview-hint">点击更换图片</view>
      </view>
      <view v-else class="page__preview-placeholder">
        <text class="page__preview-icon">💧</text>
        <text class="page__preview-text">点击添加图片</text>
        <text class="page__preview-sub">支持相册与拍照</text>
      </view>
    </view>

    <!-- ====== 水印设置面板 ====== -->
    <view v-if="imagePath" class="page__settings">
      <!-- 水印文字 -->
      <view class="page__field">
        <text class="page__label">水印文字</text>
        <input
          class="page__input"
          v-model="text"
          placeholder="输入水印文字..."
          maxlength="50"
          @input="onTextInput"
        />
      </view>

      <!-- 大小 -->
      <view class="page__field">
        <view class="page__slider-header">
          <text class="page__label">大小</text>
          <text class="page__value">{{ fontSize }}px</text>
        </view>
        <slider
          class="page__slider"
          :value="fontSize"
          min="14" max="120" step="1"
          @change="onSizeChange"
          @changing="onSizeChanging"
          activeColor="#1D1D1F"
          backgroundColor="#E5E5EA"
          block-size="16"
        />
      </view>

      <!-- 间距 -->
      <view class="page__field">
        <view class="page__slider-header">
          <text class="page__label">间距</text>
          <text class="page__value">{{ spacing }}px</text>
        </view>
        <slider
          class="page__slider"
          :value="spacing"
          min="0" max="300" step="1"
          @change="onSpacingChange"
          @changing="onSpacingChanging"
          activeColor="#1D1D1F"
          backgroundColor="#E5E5EA"
          block-size="16"
        />
      </view>

      <!-- 角度 -->
      <view class="page__field">
        <view class="page__slider-header">
          <text class="page__label">角度</text>
          <text class="page__value">{{ angle }}°</text>
        </view>
        <slider
          class="page__slider"
          :value="angle + 90"
          min="0" max="180" step="1"
          @change="onAngleChange"
          @changing="onAngleChanging"
          activeColor="#1D1D1F"
          backgroundColor="#E5E5EA"
          block-size="16"
        />
      </view>

      <!-- 颜色 -->
      <view class="page__field">
        <text class="page__label">颜色</text>
        <view class="page__colors">
          <view
            v-for="c in colors"
            :key="c.value"
            class="page__color-dot"
            :class="{ 'page__color-dot--active': color === c.value }"
            :style="{ background: c.value }"
            @tap="selectColor(c.value)"
          ></view>
        </view>
      </view>

      <!-- 透明度 -->
      <view class="page__field">
        <view class="page__slider-header">
          <text class="page__label">透明度</text>
          <text class="page__value">{{ Math.round(opacity * 100) }}%</text>
        </view>
        <slider
          class="page__slider"
          :value="opacity * 100"
          min="10" max="100" step="1"
          @change="onOpacityChange"
          @changing="onOpacityChanging"
          activeColor="#1D1D1F"
          backgroundColor="#E5E5EA"
          block-size="16"
        />
      </view>

      <!-- 操作按钮 -->
      <view class="page__actions">
        <button
          class="page__btn page__btn--primary"
          :disabled="!text.trim()"
          @tap="renderWatermark"
        >
          生成水印
        </button>
        <button
          class="page__btn page__btn--secondary"
          :disabled="!rendered"
          @tap="saveImage"
        >
          保存图片
        </button>
      </view>
    </view>
  </view>

  <ImageSourceSheet :visible="showSourceSheet" @select="onSourceSelect" @close="closeSourceSheet" />
</template>

<script setup>
import { ref, nextTick, onUnmounted } from 'vue'
import { showToast, showSuccess, showLoading, hideLoading } from '@/utils/helpers'
import ImageSourceSheet from '@/components/ImageSourceSheet.vue'
import { pickImage } from '@/utils/image-picker'
import { saveCheckedImage, secCheck } from '@/utils/sec-check'

// ========== 颜色方案 ==========
const colors = [
  { value: '#FFFFFF', label: '白色' },
  { value: '#000000', label: '黑色' },
  { value: '#FF1744', label: '红色' },
  { value: '#FF6D00', label: '橙色' },
  { value: '#FFD600', label: '黄色' },
  { value: '#00E676', label: '绿色' },
  { value: '#2979FF', label: '蓝色' },
  { value: '#D500F9', label: '紫色' },
  { value: '#8D6E63', label: '棕色' },
  { value: '#78909C', label: '灰色' },
]

// ========== 状态 ==========
const imagePath = ref('')
const text = ref('')
const fontSize = ref(36)
const spacing = ref(60)
const angle = ref(45)
const color = ref('#FFFFFF')
const opacity = ref(0.6)
const canvasWidth = ref(0)
const canvasHeight = ref(0)
const canvasReady = ref(false)
const rendered = ref(false)

// 预渲染缓存（slider changing 时仅更新 pending，不触发完整渲染）
const pendingSize = ref(36)
const pendingSpacing = ref(60)
const pendingAngle = ref(45)
const pendingOpacity = ref(0.6)
const renderTimer = ref(null)
const drawTimer = ref(null)

// ========== 画布尺寸计算 ==========
function calcCanvasSize(imgW, imgH) {
  const sys = uni.getSystemInfoSync()
  // 1rpx = windowWidth / 750；卡片水平总 padding 为 80rpx（页面 20rpx×2 + 画布容器 20rpx×2）
  const rpx = sys.windowWidth / 750
  const maxW = Math.floor(sys.windowWidth - 80 * rpx)
  const maxH = 420
  const ratio = imgW / imgH

  let w, h
  if (ratio >= maxW / maxH) {
    // 宽图：限制宽度
    w = maxW
    h = maxW / ratio
  } else {
    // 高图：限制高度
    h = maxH
    w = maxH * ratio
  }

  // 不放大超过原图尺寸
  if (w > imgW) { w = imgW; h = imgW / ratio }
  if (h > imgH) { h = imgH; w = imgH * ratio }

  canvasWidth.value = Math.round(w)
  canvasHeight.value = Math.round(h)
}

// ========== 选择图片 ==========
const showSourceSheet = ref(false)
const secCheckResult = ref(null)

function chooseImage() {
  showSourceSheet.value = true
}

function closeSourceSheet() {
  showSourceSheet.value = false
}

/** 选源弹窗回调：拍摄 / 相册 / 聊天记录 */
async function onSourceSelect(source) {
  showSourceSheet.value = false
  try {
    const { paths } = await pickImage({ source, count: 1 })
    if (paths[0]) {
      secCheckResult.value = null
      secCheck(paths[0]).then((r) => { secCheckResult.value = r })
      loadImage(paths[0])
    }
  } catch (e) {}
}

/** 加载所选图片到画布 */
function loadImage(path) {
  imagePath.value = path
  rendered.value = false
  canvasReady.value = false

  uni.getImageInfo({
    src: path,
    success: (info) => {
      calcCanvasSize(info.width, info.height)
      canvasReady.value = true
      // 首次绘制在 nextTick，另加一次延时兜底重绘，避免 H5 画布 buffer 尺寸竞态导致图片不完整
      nextTick(() => drawCanvas())
      if (drawTimer.value) clearTimeout(drawTimer.value)
      drawTimer.value = setTimeout(() => {
        drawCanvas()
        drawTimer.value = null
      }, 120)
    },
    fail: () => {
      showToast('图片加载失败')
    }
  })
}

// ========== 绘制水印（平铺网格 + 旋转） ==========
function drawCanvas() {
  return new Promise((resolve) => {
    const ctx = uni.createCanvasContext('watermarkCanvas')

    const w = canvasWidth.value
    const h = canvasHeight.value

    // 1. 绘制背景图（始终不透明，透明度只作用于水印文字）
    ctx.setGlobalAlpha(1)
    ctx.drawImage(imagePath.value, 0, 0, w, h)

    // 2. 平铺水印
    if (text.value.trim()) {
      const txt = text.value.trim()
      const size = pendingSize.value
      const rad = pendingAngle.value * Math.PI / 180

      ctx.setFontSize(size)
      ctx.setFillStyle(color.value)
      ctx.setGlobalAlpha(pendingOpacity.value)
      ctx.setTextAlign('center')
      ctx.setTextBaseline('middle')

      // 估算文本宽度（measureText 兼容性兜底）
      let textW = size * txt.length
      try {
        const m = ctx.measureText(txt)
        if (m && m.width) textW = m.width
      } catch (e) {}

      const stepX = textW + pendingSpacing.value
      const stepY = size * 1.6 + pendingSpacing.value

      // 旋转整个坐标系后铺网格，覆盖范围需放大以填充画布四角
      const half = Math.max(w, h) * 1.5
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.rotate(rad)
      for (let y = -half; y < half; y += stepY) {
        for (let x = -half; x < half; x += stepX) {
          ctx.fillText(txt, x, y)
        }
      }
      ctx.restore()
    }

    // 3. 渲染到画布
    ctx.draw(false, () => {
      resolve()
    })
  })
}

// ========== 生成水印 ==========
async function renderWatermark() {
  if (!imagePath.value || !text.value.trim()) {
    showToast('请先输入水印文字')
    return
  }

  showLoading('生成水印...')
  syncPending()

  try {
    await drawCanvas()
    rendered.value = true
    hideLoading()
    showSuccess('水印生成完成')
  } catch (e) {
    hideLoading()
    showToast('生成失败，请重试')
  }
}

// ========== 保存图片 ==========
function saveImage() {
  if (!rendered.value) {
    showToast('请先生成水印')
    return
  }

  showLoading('保存中...')

  uni.canvasToTempFilePath({
    canvasId: 'watermarkCanvas',
    success: (res) => {
      hideLoading()

      // #ifdef H5
      const link = document.createElement('a')
      link.href = res.tempFilePath
      link.download = 'watermark_' + Date.now() + '.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showSuccess('已下载')
      // #endif

      // #ifdef MP-WEIXIN
      saveCheckedImage(res.tempFilePath, {
        onSuccess: () => {
          showSuccess('已保存到相册')
        },
        onFail: (err) => {
          if (err.errMsg && err.errMsg.includes('auth deny')) {
            showToast('请授权相册权限')
          } else {
            showToast('保存失败')
          }
        }
      }, secCheckResult.value)
      // #endif
    },
    fail: () => {
      hideLoading()
      showToast('导出失败')
    }
  })
}

// ========== 辅助函数 ==========
function canDraw() {
  return imagePath.value && text.value.trim()
}

function syncPending() {
  pendingSize.value = fontSize.value
  pendingSpacing.value = spacing.value
  pendingAngle.value = angle.value
  pendingOpacity.value = opacity.value
}

/** 拖拽结束时：提交值并完整渲染 */
function finishDraw() {
  if (canDraw()) {
    syncPending()
    drawCanvas().then(() => { rendered.value = true })
  }
}

/** 拖拽过程中：仅更新 pending 实时预览 */
function previewDraw() {
  if (canDraw()) {
    drawCanvas()
  }
}

// ========== 交互事件 ==========

/** 文字输入：防抖重新渲染 */
function onTextInput() {
  if (renderTimer.value) clearTimeout(renderTimer.value)
  renderTimer.value = setTimeout(() => {
    finishDraw()
  }, 400)
}

/** 大小变化 */
function onSizeChange(e) {
  fontSize.value = e.detail.value
  finishDraw()
}
function onSizeChanging(e) {
  pendingSize.value = e.detail.value
  previewDraw()
}

/** 间距变化 */
function onSpacingChange(e) {
  spacing.value = e.detail.value
  finishDraw()
}
function onSpacingChanging(e) {
  pendingSpacing.value = e.detail.value
  previewDraw()
}

/** 角度变化（内部 0~180，映射为 -90~90） */
function onAngleChange(e) {
  angle.value = e.detail.value - 90
  finishDraw()
}
function onAngleChanging(e) {
  pendingAngle.value = e.detail.value - 90
  previewDraw()
}

/** 颜色选择 */
function selectColor(val) {
  color.value = val
  finishDraw()
}

/** 透明度变化 */
function onOpacityChange(e) {
  opacity.value = e.detail.value / 100
  finishDraw()
}
function onOpacityChanging(e) {
  pendingOpacity.value = e.detail.value / 100
  previewDraw()
}

// ========== 生命周期 ==========
onUnmounted(() => {
  if (renderTimer.value) {
    clearTimeout(renderTimer.value)
    renderTimer.value = null
  }
  if (drawTimer.value) {
    clearTimeout(drawTimer.value)
    drawTimer.value = null
  }
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #F5F5F7;
  padding: 24rpx 20rpx 48rpx;

  // ====== 预览区（可点击） ======
  &__preview {
    background: #fff;
    border-radius: 20rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
    overflow: hidden;
  }
  &__preview--empty {
    min-height: 400rpx;
  }

  &__preview-canvas {
    padding: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 12rpx;
  }
  &__canvas {
    display: block;
    border-radius: 8rpx;
  }
  &__preview-hint {
    font-size: 22rpx;
    color: #8E8E93;
    background: rgba(0,0,0,0.04);
    border-radius: 20rpx;
    padding: 6rpx 20rpx;
  }

  &__preview-placeholder {
    min-height: 400rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
  }
  &__preview-icon {
    font-size: 88rpx;
  }
  &__preview-text {
    font-size: 30rpx;
    font-weight: 600;
    color: #1D1D1F;
  }
  &__preview-sub {
    font-size: 24rpx;
    color: #8E8E93;
  }

  // ====== 设置面板 ======
  &__settings {
    background: #fff;
    border-radius: 20rpx;
    padding: 28rpx;
    box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  }

  &__field {
    margin-bottom: 32rpx;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__label {
    display: block;
    font-size: 26rpx;
    font-weight: 600;
    color: #1D1D1F;
    margin-bottom: 16rpx;
  }

  &__input {
    display: block;
    width: 100%;
    height: 72rpx;
    background: #F5F5F7;
    border-radius: 14rpx;
    padding: 0 20rpx;
    font-size: 28rpx;
    color: #1D1D1F;
    box-sizing: border-box;
  }

  // 滑块头部（带值）
  &__slider-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .page__label {
      margin-bottom: 0;
    }
  }
  &__value {
    font-size: 22rpx;
    color: #8E8E93;
    font-family: monospace;
  }
  &__slider {
    margin-top: 8rpx;
  }

  // 颜色选择
  &__colors {
    display: flex;
    flex-wrap: wrap;
    gap: 14rpx;
  }
  &__color-dot {
    width: 52rpx;
    height: 52rpx;
    border-radius: 50%;
    box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.15);
    position: relative;

    &:active {
      transform: scale(0.9);
    }
    &--active::after {
      content: '✓';
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26rpx;
      color: #fff;
      text-shadow: 0 0 4rpx rgba(0,0,0,0.5);
    }
  }

  // ====== 操作按钮 ======
  &__actions {
    display: flex;
    gap: 16rpx;
    margin-top: 8rpx;
  }
  &__btn {
    flex: 1;
    height: 80rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    font-weight: 600;

    &:active {
      opacity: 0.7;
    }

    &--primary {
      background: #1D1D1F;
      color: #fff;
    }
    &--secondary {
      background: #F5F5F7;
      color: #1D1D1F;
    }

    &[disabled] {
      opacity: 0.4;
    }
  }
}

</style>
