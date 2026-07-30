<template>
  <view class="page">
    <!-- ====== 顶部操作栏 ====== -->
    <view class="page__toolbar">
      <button class="page__btn page__btn--primary" @tap="chooseImage">
        {{ imagePath ? '重新选择' : '选择图片' }}
      </button>
      <text v-if="imagePath" class="page__file-name">{{ fileName }}</text>
    </view>

    <!-- ====== 画布预览区 ====== -->
    <view v-if="imagePath" class="page__canvas-card">
      <canvas
        canvas-id="watermarkCanvas"
        id="watermarkCanvas"
        class="page__canvas"
        :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
      ></canvas>
    </view>
    <view v-else class="page__empty">
      <text class="page__empty-icon">🖼️</text>
      <text class="page__empty-text">请选择一张图片添加水印</text>
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

      <!-- 位置选择 -->
      <view class="page__field">
        <text class="page__label">位置</text>
        <view class="page__positions">
          <view
            v-for="pos in positions"
            :key="pos.key"
            class="page__pos-btn"
            :class="{ 'page__pos-btn--active': position === pos.key }"
            @tap="selectPosition(pos.key)"
          >
            <text>{{ pos.label }}</text>
          </view>
        </view>
      </view>

      <!-- 字号 -->
      <view class="page__field">
        <view class="page__slider-header">
          <text class="page__label">字号</text>
          <text class="page__value">{{ fontSize }}px</text>
        </view>
        <slider
          class="page__slider"
          :value="fontSize"
          min="14" max="120" step="1"
          @change="onFontSizeChange"
          @changing="onFontSizeChanging"
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
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { showToast, showSuccess, showLoading, hideLoading } from '@/utils/helpers'

// ========== 位置选项 ==========
const positions = [
  { key: 'top-left',     label: '左上' },
  { key: 'top-right',    label: '右上' },
  { key: 'center',       label: '居中' },
  { key: 'bottom-left',  label: '左下' },
  { key: 'bottom-right', label: '右下' },
]

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
const fileName = ref('')
const text = ref('')
const position = ref('bottom-right')
const fontSize = ref(36)
const color = ref('#FFFFFF')
const opacity = ref(0.6)
const canvasWidth = ref(0)
const canvasHeight = ref(0)
const rendered = ref(false)

// 预渲染时的字号/透明度缓存（slider changing 时不触发 canvas 重绘）
const pendingFontSize = ref(36)
const pendingOpacity = ref(0.6)
const renderTimer = ref(null)

const dpr = ref(1)

// ========== 画布尺寸计算 ==========
function calcCanvasSize(imgW, imgH) {
  const sys = uni.getSystemInfoSync()
  const maxW = sys.windowWidth - 40  // 左右各 20px padding
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
function chooseImage() {
  uni.chooseImage({
    count: 1,
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const path = res.tempFilePaths[0]
      imagePath.value = path
      fileName.value = getFileName(path)
      rendered.value = false

      uni.getImageInfo({
        src: path,
        success: (info) => {
          calcCanvasSize(info.width, info.height)
          setupCanvas()
          renderWatermark()
        },
        fail: () => {
          showToast('图片加载失败')
        }
      })
    }
  })
}

/** 从临时路径提取文件名 */
function getFileName(path) {
  const parts = path.split(/[\\/]/)
  return parts[parts.length - 1] || '图片'
}

// ========== Canvas 初始化 ==========
function setupCanvas() {
  dpr.value = uni.getSystemInfoSync().pixelRatio || 1

  nextTick(() => {
    // #ifdef H5
    const el = document.getElementById('watermarkCanvas')
    if (el) {
      el.width = canvasWidth.value * dpr.value
      el.height = canvasHeight.value * dpr.value
    }
    // #endif
  })
}

// ========== 绘制水印 ==========
function drawCanvas() {
  return new Promise((resolve) => {
    const ctx = uni.createCanvasContext('watermarkCanvas')

    // DPR 缩放
    ctx.scale(dpr.value, dpr.value)

    const w = canvasWidth.value
    const h = canvasHeight.value
    const pad = 24

    // 1. 绘制背景图
    ctx.drawImage(imagePath.value, 0, 0, w, h)

    // 2. 绘制水印文字
    if (text.value.trim()) {
      const ft = pendingFontSize.value
      ctx.setFontSize(ft)
      ctx.setFillStyle(color.value)
      ctx.setGlobalAlpha(pendingOpacity.value)

      let align, baseline, x, y
      switch (position.value) {
        case 'top-left':
          align = 'left'; baseline = 'top'; x = pad; y = pad
          break
        case 'top-right':
          align = 'right'; baseline = 'top'; x = w - pad; y = pad
          break
        case 'center':
          align = 'center'; baseline = 'middle'; x = w / 2; y = h / 2
          break
        case 'bottom-left':
          align = 'left'; baseline = 'bottom'; x = pad; y = h - pad
          break
        case 'bottom-right':
        default:
          align = 'right'; baseline = 'bottom'; x = w - pad; y = h - pad
          break
      }

      ctx.setTextAlign(align)
      ctx.setTextBaseline(baseline)
      ctx.fillText(text.value, x, y)
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

  // 同步 pending 值
  pendingFontSize.value = fontSize.value
  pendingOpacity.value = opacity.value

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
async function saveImage() {
  if (!rendered.value) {
    showToast('请先生成水印')
    return
  }

  showLoading('保存中...')

  // 导出 canvas 为临时文件
  uni.canvasToTempFilePath({
    canvasId: 'watermarkCanvas',
    success: (res) => {
      hideLoading()

      // #ifdef H5
      // H5：触发文件下载
      const link = document.createElement('a')
      link.href = res.tempFilePath
      link.download = 'watermark_' + Date.now() + '.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showSuccess('已下载')
      // #endif

      // #ifdef MP-WEIXIN
      // 微信小程序：保存到相册
      uni.saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
        success: () => {
          showSuccess('已保存到相册')
        },
        fail: (err) => {
          if (err.errMsg && err.errMsg.includes('auth deny')) {
            showToast('请授权相册权限')
          } else {
            showToast('保存失败')
          }
        }
      })
      // #endif
    },
    fail: () => {
      hideLoading()
      showToast('导出失败')
    }
  })
}

// ========== 交互事件 ==========

/** 文字输入：防抖重新渲染 */
function onTextInput() {
  if (renderTimer.value) clearTimeout(renderTimer.value)
  renderTimer.value = setTimeout(() => {
    if (imagePath.value && text.value.trim()) {
      pendingFontSize.value = fontSize.value
      pendingOpacity.value = opacity.value
      drawCanvas().then(() => { rendered.value = true })
    }
  }, 400)
}

/** 选择位置 */
function selectPosition(key) {
  position.value = key
  if (imagePath.value && text.value.trim()) {
    pendingFontSize.value = fontSize.value
    pendingOpacity.value = opacity.value
    drawCanvas().then(() => { rendered.value = true })
  }
}

/** 颜色选择 */
function selectColor(val) {
  color.value = val
  if (imagePath.value && text.value.trim()) {
    pendingFontSize.value = fontSize.value
    pendingOpacity.value = opacity.value
    drawCanvas().then(() => { rendered.value = true })
  }
}

/** 字号变化（拖拽结束） */
function onFontSizeChange(e) {
  fontSize.value = e.detail.value
  pendingFontSize.value = fontSize.value
  if (imagePath.value && text.value.trim()) {
    drawCanvas().then(() => { rendered.value = true })
  }
}

/** 字号拖拽中（实时预览但不触发完整渲染） */
function onFontSizeChanging(e) {
  pendingFontSize.value = e.detail.value
  if (imagePath.value && text.value.trim()) {
    drawCanvas()
  }
}

/** 透明度变化（拖拽结束） */
function onOpacityChange(e) {
  opacity.value = e.detail.value / 100
  pendingOpacity.value = opacity.value
  if (imagePath.value && text.value.trim()) {
    drawCanvas().then(() => { rendered.value = true })
  }
}

/** 透明度拖拽中 */
function onOpacityChanging(e) {
  pendingOpacity.value = e.detail.value / 100
  if (imagePath.value && text.value.trim()) {
    drawCanvas()
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #F5F5F7;
  padding: 24rpx 20rpx 48rpx;

  // ====== 顶部工具栏 ======
  &__toolbar {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 24rpx;
  }
  &__file-name {
    flex: 1;
    font-size: 24rpx;
    color: #8E8E93;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // ====== 画布卡片 ======
  &__canvas-card {
    background: #fff;
    border-radius: 20rpx;
    padding: 20rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__canvas {
    display: block;
    border-radius: 8rpx;
  }

  // ====== 空状态 ======
  &__empty {
    background: #fff;
    border-radius: 20rpx;
    padding: 120rpx 40rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;
  }
  &__empty-icon {
    font-size: 80rpx;
  }
  &__empty-text {
    font-size: 28rpx;
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

  // 位置按钮网格
  &__positions {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12rpx;
  }
  &__pos-btn {
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F5F5F7;
    border-radius: 12rpx;
    font-size: 24rpx;
    color: #3A3A3C;

    &:active {
      background: #E5E5EA;
    }
    &--active {
      background: #1D1D1F;
      color: #fff;
    }
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

    // button 组件 disabled 状态
    &[disabled] {
      opacity: 0.4;
    }
  }
}
</style>
