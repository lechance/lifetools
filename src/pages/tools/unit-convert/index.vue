/**
 * 单位换算
 * 功能：长度 / 重量 / 温度 / 面积 / 体积 / 速度 分类互转
 */
<template>
  <view class="uc">
    <!-- 分类 Tab -->
    <scroll-view class="uc__cats" scroll-x show-scrollbar="false">
      <view v-for="(cat, i) in categories" :key="i"
        class="uc__cat" :class="{ 'uc__cat--active': catIdx === i }"
        @tap="switchCat(i)">{{ cat.name }}</view>
    </scroll-view>

    <!-- 单位输入区 -->
    <view class="uc__body">
      <view v-for="(unit, i) in curUnits" :key="i" class="card uc__unit-card">
        <view class="uc__unit-row">
          <text class="uc__unit-label">{{ unit.label }}</text>
          <view class="uc__unit-input-wrap">
            <input class="uc__unit-input" type="digit" :value="unit.val"
              @input="onInput(i, $event)" :placeholder="`输入${unit.label}`" />
            <text class="uc__unit-suffix">{{ unit.suffix }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Toast -->
    <view v-if="toast" class="uc__toast">{{ toast }}</view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// ============================
// 分类及单位定义
// ============================
const categories = [
  {
    name: '长度',
    units: [
      { key: 'mm', label: '毫米', suffix: 'mm', toBase: v => v / 1000, fromBase: v => v * 1000 },
      { key: 'cm', label: '厘米', suffix: 'cm', toBase: v => v / 100, fromBase: v => v * 100 },
      { key: 'm', label: '米', suffix: 'm', toBase: v => v, fromBase: v => v },
      { key: 'km', label: '千米', suffix: 'km', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { key: 'cun', label: '寸', suffix: '寸', toBase: v => v * (1 / 30), fromBase: v => v * 30 },
      { key: 'chi', label: '尺', suffix: '尺', toBase: v => v / 3, fromBase: v => v * 3 },
      { key: 'in', label: '英寸', suffix: 'in', toBase: v => v * 0.0254, fromBase: v => v / 0.0254 },
      { key: 'ft', label: '英尺', suffix: 'ft', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 }
    ]
  },
  {
    name: '重量',
    units: [
      { key: 'g', label: '克', suffix: 'g', toBase: v => v / 1000, fromBase: v => v * 1000 },
      { key: 'kg', label: '千克', suffix: 'kg', toBase: v => v, fromBase: v => v },
      { key: 'jin', label: '斤', suffix: '斤', toBase: v => v / 2, fromBase: v => v * 2 },
      { key: 'liang', label: '两', suffix: '两', toBase: v => v / 20, fromBase: v => v * 20 },
      { key: 'lb', label: '磅', suffix: 'lb', toBase: v => v * 0.453592, fromBase: v => v / 0.453592 },
      { key: 'oz', label: '盎司', suffix: 'oz', toBase: v => v * 0.0283495, fromBase: v => v / 0.0283495 }
    ]
  },
  {
    name: '温度',
    units: [
      { key: 'c', label: '摄氏度', suffix: '℃', toBase: v => v, fromBase: v => v },
      { key: 'f', label: '华氏度', suffix: '℉', toBase: v => (v - 32) / 1.8, fromBase: v => v * 1.8 + 32 },
      { key: 'k', label: '开尔文', suffix: 'K', toBase: v => v - 273.15, fromBase: v => v + 273.15 }
    ]
  },
  {
    name: '面积',
    units: [
      { key: 'sqm', label: '平方米', suffix: '㎡', toBase: v => v, fromBase: v => v },
      { key: 'mu', label: '亩', suffix: '亩', toBase: v => v / 0.0015, fromBase: v => v * 0.0015 },
      { key: 'ha', label: '公顷', suffix: 'ha', toBase: v => v * 10000, fromBase: v => v / 10000 },
      { key: 'sqft', label: '平方英尺', suffix: 'sq ft', toBase: v => v * 0.092903, fromBase: v => v / 0.092903 }
    ]
  },
  {
    name: '体积',
    units: [
      { key: 'ml', label: '毫升', suffix: 'ml', toBase: v => v / 1000, fromBase: v => v * 1000 },
      { key: 'l', label: '升', suffix: 'L', toBase: v => v, fromBase: v => v },
      { key: 'gal', label: '加仑', suffix: 'gal', toBase: v => v * 3.78541, fromBase: v => v / 3.78541 },
      { key: 'cuft', label: '立方英尺', suffix: 'cu ft', toBase: v => v * 28.3168, fromBase: v => v / 28.3168 }
    ]
  },
  {
    name: '速度',
    units: [
      { key: 'ms', label: '米/秒', suffix: 'm/s', toBase: v => v, fromBase: v => v },
      { key: 'kmh', label: '千米/时', suffix: 'km/h', toBase: v => v / 3.6, fromBase: v => v * 3.6 },
      { key: 'mph', label: '英里/时', suffix: 'mph', toBase: v => v * 0.44704, fromBase: v => v / 0.44704 },
      { key: 'kn', label: '节', suffix: 'kn', toBase: v => v * 0.514444, fromBase: v => v / 0.514444 }
    ]
  }
]

// ============================
// 状态
// ============================
const catIdx = ref(0)
const toast = ref('')
let toastTimer = null

function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 1500)
}

// 当前分类的单位列表（响应式）
const curUnits = ref([])
let _editingIdx = -1
let _editingVal = ''

function switchCat(i) {
  catIdx.value = i
  _editingIdx = -1
  _editingVal = ''
  initUnits()
}

function initUnits() {
  const cat = categories[catIdx.value]
  curUnits.value = cat.units.map(u => ({
    ...u,
    val: ''
  }))
}

// ============================
// 输入处理
// ============================
function fmt(v) {
  if (v === '' || v === null || v === undefined) return ''
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(n)) return ''
  // 避免浮点显示过长
  if (Number.isInteger(n)) return String(n)
  return parseFloat(n.toFixed(10)).toString()
}

function onInput(idx, e) {
  _editingIdx = idx
  const raw = e.detail.value
  _editingVal = raw

  const num = parseFloat(raw)
  if (raw === '' || isNaN(num)) {
    // 清空所有
    curUnits.value.forEach(u => { u.val = '' })
    return
  }

  const cat = categories[catIdx.value]
  const unit = cat.units[idx]
  const baseVal = unit.toBase(num)

  // 温度特殊处理
  if (cat.name === '温度') {
    const cVal = unit.toBase(num) // already in Celsius
    curUnits.value.forEach((u, i) => {
      if (i === idx) {
        u.val = raw // keep original input
      } else {
        const converted = cat.units[i].fromBase(cVal)
        u.val = fmt(converted)
      }
    })
    return
  }

  // 通用处理：转 base（米/千克/平方米/升/m/s）再转其他
  if (!isFinite(baseVal)) return

  curUnits.value.forEach((u, i) => {
    if (i === idx) {
      u.val = raw
    } else {
      const converted = cat.units[i].fromBase(baseVal)
      u.val = fmt(converted)
    }
  })
}

// 当用户点击另一个输入框时，主动聚焦但不重置
function focusInput(idx) {
  // 如果当前没有编辑中的字段，或该字段为空，不需要操作
}

// 初始化
initUnits()
</script>

<style lang="scss" scoped>
.uc {
  min-height: 100vh;
  background: #F5F5F7;
  padding-bottom: 40rpx;

  // ====== Category Tabs ======
  &__cats {
    white-space: nowrap;
    background: #fff;
    padding: 12rpx 24rpx;
    border-bottom: 1rpx solid #E5E5EA;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  &__cat {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 56rpx;
    padding: 0 28rpx;
    margin-right: 12rpx;
    background: #F5F5F7;
    border-radius: 28rpx;
    font-size: 26rpx;
    color: #86868B;
    transition: all 0.2s;
    &:active { opacity: 0.6; }
    &--active {
      background: #1D1D1F;
      color: #fff;
      font-weight: 500;
    }
  }

  // ====== Body ======
  &__body {
    padding: 24rpx;
  }

  // ====== Unit Card ======
  &__unit-card {
    margin-bottom: 12rpx;
    transition: all 0.15s;
  }
  &__unit-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  &__unit-label {
    font-size: 28rpx;
    color: #1D1D1F;
    min-width: 100rpx;
  }
  &__unit-input-wrap {
    display: flex;
    align-items: center;
    background: #F5F5F7;
    border-radius: 12rpx;
    padding: 0 16rpx;
    flex: 1;
    margin-left: 16rpx;
  }
  &__unit-input {
    flex: 1;
    height: 72rpx;
    font-size: 30rpx;
    color: #1D1D1F;
    text-align: right;
    font-family: monospace;
    padding: 0;
    background: transparent;
  }
  &__unit-suffix {
    font-size: 24rpx;
    color: #86868B;
    margin-left: 8rpx;
    min-width: 48rpx;
    text-align: left;
  }

  // ====== Toast ======
  &__toast {
    position: fixed;
    bottom: 120rpx;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 16rpx 40rpx;
    border-radius: 40rpx;
    font-size: 26rpx;
    z-index: 999;
  }
}
</style>
