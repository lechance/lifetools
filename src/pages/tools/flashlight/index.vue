/**
 * SOS手电筒
 * 全屏闪光模式，支持常亮/频闪/SOS三种模式，白/红/蓝三种颜色
 * 在微信小程序中无法控制闪光灯，用全屏高亮色块模拟
 */
<template>
  <view class="flashlight">
    <!-- 全屏闪光区，点击切换开关 -->
    <view
      class="flashlight__screen"
      :style="screenStyle"
      @tap="togglePower"
    >
      <view v-if="!isOn" class="flashlight__off-hint">
        <text class="flashlight__off-icon">🔦</text>
        <text class="flashlight__off-text">点击屏幕开启</text>
      </view>
      <view v-else class="flashlight__on-info">
        <text class="flashlight__mode-badge">{{ modeBadge }}</text>
      </view>
    </view>

    <!-- 底部控制面板 -->
    <view class="flashlight__panel" @tap.stop>
      <!-- 模式选择 -->
      <view class="flashlight__section">
        <text class="flashlight__section-title">闪光模式</text>
        <view class="flashlight__mode-row">
          <view
            v-for="m in modeOptions"
            :key="m.key"
            class="flashlight__mode-btn"
            :class="{ 'flashlight__mode-btn--active': mode === m.key }"
            @tap="setMode(m.key)"
          >
            <text class="flashlight__mode-icon">{{ m.icon }}</text>
            <text class="flashlight__mode-name">{{ m.name }}</text>
          </view>
        </view>
      </view>

      <!-- 颜色选择 -->
      <view class="flashlight__section">
        <text class="flashlight__section-title">灯光颜色</text>
        <view class="flashlight__color-row">
          <view
            v-for="c in colorOptions"
            :key="c.key"
            class="flashlight__color-dot"
            :class="{ 'flashlight__color-dot--active': colorKey === c.key }"
            :style="{ backgroundColor: c.value }"
            @tap="setColor(c.key)"
          />
          <text class="flashlight__color-label">{{ colorName }}</text>
        </view>
      </view>

      <!-- 频率调节（仅频闪模式显示） -->
      <view v-if="mode === 'strobe'" class="flashlight__section">
        <view class="flashlight__freq-header">
          <text class="flashlight__section-title">闪烁频率</text>
          <text class="flashlight__freq-value">{{ frequency }} Hz</text>
        </view>
        <slider
          class="flashlight__slider"
          :value="frequency"
          min="1"
          max="10"
          step="1"
          backgroundColor="#E5E5EA"
          activeColor="#1D1D1F"
          block-size="18"
          @change="onFreqChange"
        />
      </view>

      <!-- 状态信息 -->
      <view class="flashlight__status-bar">
        <text class="flashlight__status-text">
          {{ isOn ? '已开启 · ' + modeLabel : '已关闭' }}
          <text v-if="isOn && mode === 'strobe'"> · {{ frequency }}Hz</text>
        </text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

// ====== 模式定义 ======
const modeOptions = [
  { key: 'constant', name: '常亮', icon: '💡' },
  { key: 'strobe',   name: '频闪', icon: '⚡' },
  { key: 'sos',      name: 'SOS',  icon: '🆘' }
]

// ====== 颜色定义 ======
const colorOptions = [
  { key: 'white', value: '#FFFFFF', name: '白色' },
  { key: 'red',   value: '#FF1744', name: '红色' },
  { key: 'blue',  value: '#2979FF', name: '蓝色' }
]

const COLOR_MAP = {
  white: '#FFFFFF',
  red:   '#FF1744',
  blue:  '#2979FF'
}

const COLOR_NAMES = {
  white: '白色',
  red:   '红色',
  blue:  '蓝色'
}

const MODE_LABELS = {
  constant: '常亮',
  strobe:   '频闪',
  sos:      'SOS'
}

// ====== 响应式状态 ======
const isOn = ref(false)
const mode = ref('constant')
const colorKey = ref('white')
const frequency = ref(5)
const bgColor = ref('#1A1A1E')

// 定时器句柄
let strobeTimer = null
let sosTimer = null

// ====== 计算属性 ======

/** 屏幕背景样式 */
const screenStyle = computed(() => ({
  background: bgColor.value
}))

/** 当前模式中文标签 */
const modeLabel = computed(() => MODE_LABELS[mode.value] || '常亮')

/** 当前模式徽章文本 */
const modeBadge = computed(() => {
  if (mode.value === 'strobe') return `频闪 ${frequency.value}Hz`
  if (mode.value === 'sos') return 'SOS 求救信号'
  return '常亮'
})

/** 当前颜色中文名 */
const colorName = computed(() => COLOR_NAMES[colorKey.value] || '白色')

// ====== 方法 ======

/** 切换电源开关 */
function togglePower() {
  if (isOn.value) {
    turnOff()
  } else {
    turnOn()
  }
}

/** 开启手电筒 */
function turnOn() {
  isOn.value = true
  bgColor.value = COLOR_MAP[colorKey.value]
  startMode()
  // 阻止屏幕休眠
  uni.setKeepScreenOn({ keepScreenOn: true })
}

/** 关闭手电筒 */
function turnOff() {
  isOn.value = false
  bgColor.value = '#1A1A1E'
  clearAllTimers()
  // 恢复屏幕休眠
  uni.setKeepScreenOn({ keepScreenOn: false })
}

/** 切换模式 */
function setMode(key) {
  if (mode.value === key) return
  mode.value = key
  if (isOn.value) {
    clearAllTimers()
    startMode()
  }
}

/** 切换颜色 */
function setColor(key) {
  if (colorKey.value === key) return
  colorKey.value = key
  if (isOn.value) {
    // 立即更新颜色（所有模式下）
    if (mode.value === 'constant') {
      bgColor.value = COLOR_MAP[key]
    }
    // 频闪和SOS模式会在下一个tick使用新颜色
  }
}

/** 频率滑块变化 */
function onFreqChange(e) {
  frequency.value = e.detail.value
  if (isOn.value && mode.value === 'strobe') {
    clearAllTimers()
    startStrobe()
  }
}

/** 根据当前模式启动对应的闪光效果 */
function startMode() {
  switch (mode.value) {
    case 'constant':
      bgColor.value = COLOR_MAP[colorKey.value]
      break
    case 'strobe':
      startStrobe()
      break
    case 'sos':
      startSOS()
      break
  }
}

/** 频闪模式：按频率交替亮灭 */
function startStrobe() {
  let flashOn = true
  // 频率 1-10 映射到半周期 500ms-50ms
  const halfCycle = Math.max(50, 500 / frequency.value)

  const tick = () => {
    if (!isOn.value) return
    flashOn = !flashOn
    bgColor.value = flashOn ? COLOR_MAP[colorKey.value] : '#1A1A1E'
    strobeTimer = setTimeout(tick, halfCycle)
  }

  // 先亮
  bgColor.value = COLOR_MAP[colorKey.value]
  strobeTimer = setTimeout(tick, halfCycle)
}

/**
 * SOS 模式：莫尔斯码 SOS
 * S = ... (3点), O = --- (3划), S = ... (3点)
 * 单位时长 200ms
 * 点=200ms亮, 划=600ms亮, 间隔=200ms, 字母间隙=600ms, 单词间隙=1400ms
 * 模式数组: [ON, OFF, ON, OFF, ...]
 */
function startSOS() {
  const UNIT = 200
  const pattern = [
    /* S */ UNIT, UNIT, UNIT, UNIT, UNIT, UNIT * 3,
    /* O */ UNIT * 3, UNIT, UNIT * 3, UNIT, UNIT * 3, UNIT * 3,
    /* S */ UNIT, UNIT, UNIT, UNIT, UNIT, UNIT * 7
  ]

  let step = 0

  const tick = () => {
    if (!isOn.value) return
    if (step >= pattern.length) step = 0

    const duration = pattern[step]
    bgColor.value = (step % 2 === 0) ? COLOR_MAP[colorKey.value] : '#1A1A1E'
    step++
    sosTimer = setTimeout(tick, duration)
  }

  tick()
}

/** 清除所有定时器 */
function clearAllTimers() {
  if (strobeTimer) {
    clearTimeout(strobeTimer)
    strobeTimer = null
  }
  if (sosTimer) {
    clearTimeout(sosTimer)
    sosTimer = null
  }
}

// 页面卸载时清理资源
onUnmounted(() => {
  clearAllTimers()
  uni.setKeepScreenOn({ keepScreenOn: false })
})
</script>

<style lang="scss" scoped>
.flashlight {
  position: relative;
  height: 100vh;
  overflow: hidden;
  background: #1A1A1E;

  // ====== 全屏闪光区 ======
  &__screen {
    position: fixed;
    inset: 0;
    z-index: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.05s ease;
  }

  // 关闭状态
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

  // 开启状态
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
    margin-bottom: 24rpx;
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

  // ====== 模式选择 ======
  &__mode-row {
    display: flex;
    gap: 12rpx;
  }
  &__mode-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 88rpx;
    background: #F5F5F7;
    border-radius: 16rpx;
    gap: 6rpx;
    transition: all 0.2s;

    &:active {
      transform: scale(0.95);
      opacity: 0.8;
    }

    &--active {
      background: #1D1D1F;
      .flashlight__mode-icon { color: #fff; }
      .flashlight__mode-name { color: #fff; font-weight: 600; }
    }
  }
  &__mode-icon {
    font-size: 32rpx;
    color: #3A3A3C;
  }
  &__mode-name {
    font-size: 22rpx;
    color: #8E8E93;
  }

  // ====== 颜色选择 ======
  &__color-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }
  &__color-dot {
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    border: 2rpx solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
    transition: all 0.2s;

    &:active {
      transform: scale(0.9);
    }

    &--active {
      border: 4rpx solid #1D1D1F;
      box-shadow: 0 0 0 4rpx rgba(255, 255, 255, 0.9), 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
      transform: scale(1.1);
    }
  }
  &__color-label {
    font-size: 26rpx;
    color: #3A3A3C;
    margin-left: 8rpx;
  }

  // ====== 频率调节 ======
  &__freq-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8rpx;
  }
  &__freq-value {
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
