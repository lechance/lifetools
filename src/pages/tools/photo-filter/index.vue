/**
 * 拍照滤镜（色彩补光灯）
 * 全屏显示韩系风格色彩滤镜，用作补光灯光源
 * 支持多种滤镜预设、亮度调节、设置持久化
 */
<template>
  <view class="filter-tool">
    <!-- 全屏滤镜区域 -->
    <view
      class="filter-tool__screen"
      :style="screenStyle"
      @tap="togglePower"
    >
      <view v-if="!isOn" class="filter-tool__off-hint">
        <text class="filter-tool__off-icon">📸</text>
        <text class="filter-tool__off-text">点击屏幕开启滤镜</text>
      </view>
      <view v-else class="filter-tool__on-info">
        <text class="filter-tool__mode-badge">{{ currentFilter.label }}</text>
      </view>
    </view>

    <!-- 底部控制面板 -->
    <view class="filter-tool__panel" @tap.stop>
      <!-- 滤镜预设选择 -->
      <view class="filter-tool__section">
        <text class="filter-tool__section-title">韩系滤镜</text>
        <scroll-view scroll-x class="filter-tool__scroll">
          <view class="filter-tool__filter-row">
            <view
              v-for="f in filters"
              :key="f.key"
              class="filter-tool__filter-item"
              :class="{ 'filter-tool__filter-item--active': activeKey === f.key }"
              @tap="selectFilter(f)"
            >
              <view
                class="filter-tool__filter-preview"
                :style="{ backgroundColor: f.color }"
              />
              <text class="filter-tool__filter-name">{{ f.label }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 亮度调节 -->
      <view class="filter-tool__section">
        <view class="filter-tool__brightness-header">
          <text class="filter-tool__section-title">亮度</text>
          <text class="filter-tool__brightness-value">{{ Math.round(opacity * 100) }}%</text>
        </view>
        <slider
          class="filter-tool__slider"
          :value="opacity"
          :min="0.1"
          :max="1"
          :step="0.05"
          backgroundColor="#E5E5EA"
          activeColor="#1D1D1F"
          block-size="18"
          @change="onOpacityChange"
        />
      </view>

      <!-- 色温微调 -->
      <view class="filter-tool__section">
        <view class="filter-tool__brightness-header">
          <text class="filter-tool__section-title">色温</text>
          <text class="filter-tool__brightness-value">{{ warmthLabel }}</text>
        </view>
        <slider
          class="filter-tool__slider"
          :value="warmth"
          :min="-50"
          :max="50"
          :step="5"
          backgroundColor="#E5E5EA"
          activeColor="#1D1D1F"
          block-size="18"
          @change="onWarmthChange"
        />
      </view>

      <!-- 状态信息 -->
      <view class="filter-tool__status-bar">
        <text class="filter-tool__status-text">
          {{ isOn ? currentFilter.label + ' · 亮度' + Math.round(opacity * 100) + '%' : '已关闭' }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onHide } from '@dcloudio/uni-app'

// ====== 韩系滤镜预设 ======
const filters = [
  { key: 'milky',     label: '奶白',     color: '#FFF8F0' },
  { key: 'peach',     label: '蜜桃',     color: '#FFD4B8' },
  { key: 'sakura',    label: '樱花',     color: '#FFB7C5' },
  { key: 'mint',      label: '薄荷',     color: '#B8E8D0' },
  { key: 'lavender',  label: '薰衣草',   color: '#D4B8E8' },
  { key: 'milktea',   label: '奶茶',     color: '#E8D4B8' },
  { key: 'mistblue',  label: '雾霾蓝',   color: '#B8D4E8' },
  { key: 'warmsun',   label: '暖阳',     color: '#FFE8B8' },
]

const STORAGE_KEY = 'photo-filter-settings'

// ====== 响应式状态 ======
const isOn = ref(false)
const activeKey = ref('milky')
const opacity = ref(0.85)
const warmth = ref(0)

const currentFilter = computed(() => {
  return filters.find(f => f.key === activeKey.value) || filters[0]
})

const warmthLabel = computed(() => {
  if (warmth.value < -20) return '偏冷'
  if (warmth.value < 0) return '微冷'
  if (warmth.value === 0) return '中性'
  if (warmth.value <= 20) return '微暖'
  return '偏暖'
})

const screenStyle = computed(() => {
  if (!isOn.value) {
    return { backgroundColor: '#1A1A1E' }
  }
  const base = currentFilter.value.color
  const r = parseInt(base.slice(1, 3), 16)
  const g = parseInt(base.slice(3, 5), 16)
  const b = parseInt(base.slice(5, 7), 16)
  const w = warmth.value
  const nr = Math.min(255, Math.max(0, r + w))
  const ng = Math.min(255, Math.max(0, g))
  const nb = Math.min(255, Math.max(0, b - w))
  const finalColor = `rgb(${nr}, ${ng}, ${nb})`
  return {
    backgroundColor: finalColor,
    opacity: opacity.value
  }
})

// ====== 方法 ======

function togglePower() {
  if (isOn.value) {
    turnOff()
  } else {
    turnOn()
  }
}

function turnOn() {
  isOn.value = true
  uni.setKeepScreenOn({ keepScreenOn: true })
  saveSettings()
}

function turnOff() {
  isOn.value = false
  uni.setKeepScreenOn({ keepScreenOn: false })
  saveSettings()
}

function selectFilter(f) {
  activeKey.value = f.key
  saveSettings()
}

function onOpacityChange(e) {
  opacity.value = e.detail.value
  saveSettings()
}

function onWarmthChange(e) {
  warmth.value = e.detail.value
  saveSettings()
}

function saveSettings() {
  const data = {
    activeKey: activeKey.value,
    opacity: opacity.value,
    warmth: warmth.value,
    isOn: isOn.value
  }
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {}
}

function loadSettings() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data.activeKey) activeKey.value = data.activeKey
      if (data.opacity !== undefined) opacity.value = data.opacity
      if (data.warmth !== undefined) warmth.value = data.warmth
      if (data.isOn) {
        isOn.value = true
        uni.setKeepScreenOn({ keepScreenOn: true })
      }
    }
  } catch (e) {}
}

onMounted(() => {
  loadSettings()
})

onHide(() => {
  if (isOn.value) turnOff()
})

onUnmounted(() => {
  uni.setKeepScreenOn({ keepScreenOn: false })
})
</script>

<style lang="scss" scoped>
.filter-tool {
  position: relative;
  height: 100vh;
  overflow: hidden;
  background: #1A1A1E;

  // ====== 全屏滤镜区域 ======
  &__screen {
    position: fixed;
    inset: 0;
    z-index: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.3s ease, opacity 0.3s ease;
  }

  &__off-hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24rpx;
    opacity: 0.6;
  }
  &__off-icon {
    font-size: 96rpx;
  }
  &__off-text {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.5);
    letter-spacing: 4rpx;
  }

  &__on-info {
    position: absolute;
    top: 100rpx;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
  }
  &__mode-badge {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.7);
    background: rgba(0, 0, 0, 0.25);
    padding: 12rpx 32rpx;
    border-radius: 40rpx;
    backdrop-filter: blur(8px);
    letter-spacing: 2rpx;
  }

  // ====== 底部控制面板 ======
  &__panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1;
    background: rgba(255, 255, 255, 0.97);
    border-radius: 36rpx 36rpx 0 0;
    padding: 32rpx 32rpx calc(48rpx + env(safe-area-inset-bottom));
    box-shadow: 0 -8rpx 48rpx rgba(0, 0, 0, 0.12);
    max-height: 55vh;
    overflow-y: auto;
  }

  &__section {
    margin-bottom: 28rpx;
    &:last-of-type {
      margin-bottom: 0;
    }
  }

  &__section-title {
    display: block;
    font-size: 24rpx;
    color: #8E8E93;
    margin-bottom: 12rpx;
    font-weight: 500;
  }

  // ====== 滤镜选择 ======
  &__scroll {
    white-space: nowrap;
  }
  &__filter-row {
    display: inline-flex;
    gap: 20rpx;
    padding: 8rpx 0;
  }
  &__filter-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
    transition: all 0.2s;

    &:active {
      transform: scale(0.92);
    }

    &--active {
      .filter-tool__filter-preview {
        border: 4rpx solid #1D1D1F;
        box-shadow: 0 0 0 4rpx rgba(255, 255, 255, 0.9), 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
        transform: scale(1.1);
      }
      .filter-tool__filter-name {
        color: #1D1D1F;
        font-weight: 600;
      }
    }
  }
  &__filter-preview {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    border: 3rpx solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
  }
  &__filter-name {
    font-size: 20rpx;
    color: #8E8E93;
    transition: all 0.2s;
  }

  // ====== 亮度调节 ======
  &__brightness-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8rpx;
  }
  &__brightness-value {
    font-size: 26rpx;
    color: #1D1D1F;
    font-weight: 600;
    font-family: 'Courier New', monospace;
  }
  &__slider {
    width: 100%;
  }

  // ====== 状态栏 ======
  &__status-bar {
    margin-top: 20rpx;
    padding-top: 20rpx;
    border-top: 2rpx solid #F0F0F0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__status-text {
    font-size: 22rpx;
    color: #8E8E93;
  }
}
</style>
