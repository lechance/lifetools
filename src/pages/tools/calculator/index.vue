/**
 * 科学计算器
 * 支持基础运算+科学函数+括号
 * 性能优化：预计算样式、减少重复格式化、单次 sanitize
 */
<template>
  <view class="calculator">
    <!-- 显示区域 -->
    <view class="calculator__display">
      <scroll-view class="calculator__expr" scroll-x>
        <text class="calculator__expr-text">{{ displayExpr }}</text>
      </scroll-view>
      <view class="calculator__result">
        <text class="calculator__result-text">{{ result }}</text>
      </view>
    </view>

    <!-- 科学函数行 -->
    <view class="calculator__sci-row">
      <view v-for="fn in sciFuncs" :key="fn" class="calculator__sci-btn" @tap="handleSci(fn)">
        <text>{{ fn }}</text>
      </view>
    </view>

    <!-- 主按键区（classes 预计算，避免模板中重复计算） -->
    <view class="calculator__keys">
      <view v-for="(row, ri) in keyRows" :key="ri" class="calculator__key-row">
        <view
          v-for="key in row"
          :key="key.label"
          :class="key.cls"
          @tap="handleKey(key)"
        >
          <text>{{ key.label }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

// ========== 静态数据（模块级，非响应式） ==========

const sciFuncs = ['sin', 'cos', 'tan', 'log', 'ln', '√', 'x²', 'xⁿ', 'π', 'e']

// 预计算按键 CSS 类名，避免模板中重复对象创建
function buildKey(label, type, extra) {
  const cls = `calculator__key calculator__key--${type}`
  return { label, type, cls, ...extra }
}

const keyRows = [
  [
    buildKey('C', 'func', { action: 'clear' }),
    buildKey('⌫', 'func', { action: 'backspace' }),
    buildKey('%', 'op', { action: '%' }),
    buildKey('÷', 'op', { action: '/' })
  ],
  [
    buildKey('7', 'num', { value: '7' }),
    buildKey('8', 'num', { value: '8' }),
    buildKey('9', 'num', { value: '9' }),
    buildKey('×', 'op', { action: '*' })
  ],
  [
    buildKey('4', 'num', { value: '4' }),
    buildKey('5', 'num', { value: '5' }),
    buildKey('6', 'num', { value: '6' }),
    buildKey('-', 'op', { action: '-' })
  ],
  [
    buildKey('1', 'num', { value: '1' }),
    buildKey('2', 'num', { value: '2' }),
    buildKey('3', 'num', { value: '3' }),
    buildKey('+', 'op', { action: '+' })
  ],
  [
    buildKey('±', 'func', { action: 'negate' }),
    buildKey('0', 'num', { value: '0' }),
    buildKey('.', 'num', { value: '.' }),
    buildKey('=', 'eq', { action: 'calculate' })
  ]
]

// ========== 响应式状态 ==========

const expression = ref('')
const result = ref('0')
const currentInput = ref('')
const lastAnswer = ref(null)
const justCalculated = ref(false)

// 表达式为空时显示 0，避免模板中重复 `|| '0'`
const displayExpr = computed(() => expression.value || '0')

// ========== 格式化 ==========

/** 格式化数字，缓存最近一次结果避免重复计算 */
let lastFormattedInput = ''
let lastFormattedResult = '0'

function formatDisplay(val) {
  if (val === undefined || val === null || val === '') return '0'
  const num = Number(val)
  if (!isFinite(num)) return isNaN(num) ? '错误' : (num > 0 ? '∞' : '-∞')
  if (Math.abs(num) > 999999999 || (Math.abs(num) < 0.0000001 && num !== 0)) {
    return num.toExponential(6)
  }
  const str = String(num)
  return str.length > 15 ? num.toPrecision(10) : str
}

/** 快速格式化当前输入（带缓存） */
function fmtInput(input) {
  if (input === lastFormattedInput) return lastFormattedResult
  lastFormattedInput = input
  lastFormattedResult = formatDisplay(input || '0')
  return lastFormattedResult
}

// ========== 按键处理 ==========

function handleKey(key) {
  if (key.type === 'num') {
    if (justCalculated.value) {
      expression.value = ''
      currentInput.value = ''
      lastAnswer.value = null
      justCalculated.value = false
    }
    if (key.value === '.' && currentInput.value.includes('.')) return
    // 前导零：0 → 按数字替换
    if (key.value !== '.' && currentInput.value === '0') {
      currentInput.value = key.value
      expression.value = expression.value.slice(0, -1) + key.value
      result.value = key.value
      return
    }
    currentInput.value += key.value
    expression.value += key.value
    result.value = fmtInput(currentInput.value)
  } else if (key.type === 'op') {
    if (justCalculated.value && lastAnswer.value !== null) {
      const v = fmtInput(lastAnswer.value)
      expression.value = v
      currentInput.value = v
      justCalculated.value = false
    }
    expression.value += ` ${key.label} `
    currentInput.value = ''
    justCalculated.value = false
  } else if (key.type === 'func') {
    handleFuncAction(key.action)
  } else if (key.type === 'eq') {
    calculate()
  }
}

// ========== 功能键 ==========

function handleFuncAction(action) {
  if (action === 'clear') {
    expression.value = ''
    currentInput.value = ''
    result.value = '0'
    lastAnswer.value = null
    justCalculated.value = false
  } else if (action === 'backspace') {
    if (justCalculated.value) {
      expression.value = ''
      currentInput.value = ''
      result.value = '0'
      justCalculated.value = false
      return
    }
    if (currentInput.value.length > 0) {
      currentInput.value = currentInput.value.slice(0, -1)
      expression.value = expression.value.slice(0, -1)
      result.value = fmtInput(currentInput.value || lastAnswer.value)
    } else {
      const idx = expression.value.trimEnd().lastIndexOf(' ')
      expression.value = idx > -1 ? expression.value.slice(0, idx).trimEnd() : ''
      result.value = '0'
    }
  } else if (action === 'negate') {
    if (currentInput.value && currentInput.value !== '0') {
      currentInput.value = currentInput.value.startsWith('-')
        ? currentInput.value.slice(1)
        : '-' + currentInput.value
      const parts = expression.value.split(/(\s+)/)
      if (parts.length > 0) {
        parts[parts.length - 1] = currentInput.value
        expression.value = parts.join('')
      }
      result.value = fmtInput(currentInput.value)
    }
  }
}

// ========== 科学函数 ==========

function handleSci(fn) {
  if (justCalculated.value && lastAnswer.value !== null) {
    currentInput.value = fmtInput(lastAnswer.value)
  }
  justCalculated.value = false
  const lastNum = parseFloat(currentInput.value) || 0
  let val

  switch (fn) {
    case 'sin':  val = Math.sin(lastNum * Math.PI / 180); expression.value = `sin(${lastNum}°)`; break
    case 'cos':  val = Math.cos(lastNum * Math.PI / 180); expression.value = `cos(${lastNum}°)`; break
    case 'tan':  val = Math.tan(lastNum * Math.PI / 180); expression.value = `tan(${lastNum}°)`; break
    case 'log':  val = Math.log10(lastNum); expression.value = `log(${lastNum})`; break
    case 'ln':   val = Math.log(lastNum); expression.value = `ln(${lastNum})`; break
    case '√':
      val = lastNum < 0 ? NaN : Math.sqrt(lastNum)
      expression.value = `√(${lastNum})`
      break
    case 'x²':
      val = lastNum * lastNum
      expression.value = `(${lastNum})²`
      break
    case 'xⁿ':
      expression.value = `${lastNum}^`
      currentInput.value = ''
      result.value = fmtInput(lastNum)
      return
    case 'π':  val = Math.PI; expression.value = 'π'; break
    case 'e':  val = Math.E;  expression.value = 'e'; break
  }

  if (val !== undefined) {
    const formatted = isFinite(val) ? fmtInput(val) : (isNaN(val) ? '错误' : '∞')
    currentInput.value = formatted
    result.value = formatted
    lastAnswer.value = val
    justCalculated.value = true
  }
}

// ========== 计算 ==========

// 单次替换映射表，比链式 .replace() 快
const OP_MAP = { '×': '*', '÷': '/', '^': '**' }
const OP_PATTERN = /[×÷^]/g

function calculate() {
  try {
    // 一次替换所有运算符（单次正则遍历）
    const expr = expression.value.replace(OP_PATTERN, ch => OP_MAP[ch]).replace(/--/g, '+')

    // 白名单过滤
    const sanitized = expr.replace(/[^0-9+\-*/.()% ]/g, '')
    if (!sanitized.trim()) {
      result.value = '0'
      return
    }

    const computed = Function(`"use strict"; return (${sanitized})`)()
    if (!isFinite(computed)) {
      result.value = isNaN(computed) ? '错误' : '∞'
      return
    }
    const formatted = fmtInput(computed)
    result.value = formatted
    lastAnswer.value = computed
    justCalculated.value = true
    currentInput.value = formatted
    expression.value = `${expression.value} =`
  } catch (e) {
    result.value = '错误'
  }
}
</script>

<style lang="scss" scoped>
.calculator {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $card-bg;
  user-select: none;

  &__display {
    background: $card-bg;
    padding: 60rpx 32rpx 24rpx;
    border-bottom: 1rpx solid $border-color;
    flex-shrink: 0;
  }

  &__expr {
    white-space: nowrap;
    margin-bottom: 16rpx;
    min-height: 48rpx;

    &-text {
      font-size: 32rpx;
      color: $text-secondary;
      font-family: 'Menlo', 'Monaco', monospace;
    }
  }

  &__result {
    text-align: right;

    &-text {
      font-size: 72rpx;
      font-weight: 300;
      color: $text-primary;
      font-family: 'Menlo', 'Monaco', monospace;
      line-height: 1.1;
      word-break: break-all;
    }
  }

  // 科学函数行
  &__sci-row {
    display: flex;
    flex-wrap: wrap;
    padding: 12rpx 16rpx;
    background: $primary-bg;
    gap: 10rpx;
    flex-shrink: 0;
  }

  &__sci-btn {
    flex: 0 0 auto;
    min-width: 88rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $card-bg;
    border-radius: 12rpx;
    box-shadow: $shadow-sm;

    text { font-size: 22rpx; color: $text-primary; }
    &:active { opacity: 0.7; }
  }

  // 主按键区
  &__keys {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 12rpx 12rpx 24rpx;
    gap: 8rpx;
    background: $card-bg;
  }

  &__key-row {
    display: flex;
    gap: 8rpx;
    flex: 1;
  }

  // 按键基础样式（type 类名由 buildKey 预计算）
  &__key {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;
    font-size: 40rpx;
    transition: background 0.1s;
    &:active { opacity: 0.6; }

    &--num {
      background: $primary-bg;
      color: $text-primary;
      font-size: 44rpx;
    }
    &--op {
      background: $primary-bg;
      color: $primary-color;
      font-size: 40rpx;
    }
    &--eq {
      background: $primary-color;
      color: #fff;
      font-size: 44rpx;
    }
    &--func {
      background: #E8E8ED;
      color: $text-primary;
      font-size: 36rpx;
    }
  }
}
</style>
