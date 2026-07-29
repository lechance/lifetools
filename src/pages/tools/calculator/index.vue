/**
 * 科学计算器
 * 支持基础运算+科学函数+括号
 */
<template>
  <view class="calculator">
    <!-- 显示区域 -->
    <view class="calculator__display">
      <scroll-view class="calculator__expr" scroll-x>
        <text class="calculator__expr-text">{{ expression || '0' }}</text>
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

    <!-- 主按键区 -->
    <view class="calculator__keys">
      <view v-for="(row, ri) in keys" :key="ri" class="calculator__key-row">
        <view
          v-for="(key, ki) in row"
          :key="ki"
          class="calculator__key"
          :class="{
            'calculator__key--num': key.type === 'num',
            'calculator__key--op': key.type === 'op',
            'calculator__key--eq': key.type === 'eq',
            'calculator__key--func': key.type === 'func',
            'calculator__key--wide': key.wide
          }"
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

// 科学函数列表
const sciFuncs = ['sin', 'cos', 'tan', 'log', 'ln', '√', 'x²', 'xⁿ', 'π', 'e']

// 按键布局
const keys = [
  [
    { label: 'C', type: 'func', action: 'clear' },
    { label: '⌫', type: 'func', action: 'backspace' },
    { label: '%', type: 'op', action: '%' },
    { label: '÷', type: 'op', action: '/' }
  ],
  [
    { label: '7', type: 'num', value: '7' },
    { label: '8', type: 'num', value: '8' },
    { label: '9', type: 'num', value: '9' },
    { label: '×', type: 'op', action: '*' }
  ],
  [
    { label: '4', type: 'num', value: '4' },
    { label: '5', type: 'num', value: '5' },
    { label: '6', type: 'num', value: '6' },
    { label: '-', type: 'op', action: '-' }
  ],
  [
    { label: '1', type: 'num', value: '1' },
    { label: '2', type: 'num', value: '2' },
    { label: '3', type: 'num', value: '3' },
    { label: '+', type: 'op', action: '+' }
  ],
  [
    { label: '±', type: 'func', action: 'negate' },
    { label: '0', type: 'num', value: '0' },
    { label: '.', type: 'num', value: '.' },
    { label: '=', type: 'eq', action: 'calculate' }
  ]
]

// 状态
const expression = ref('')
const result = ref('0')
const currentInput = ref('')
const lastAnswer = ref(null)
const justCalculated = ref(false)

// 格式化结果显示
function formatDisplay(val) {
  if (val === undefined || val === null || val === '') return '0'
  const num = Number(val)
  if (isNaN(num)) return val
  // 避免超大数字用科学计数法
  if (Math.abs(num) > 999999999 || (Math.abs(num) < 0.0000001 && num !== 0)) {
    return num.toExponential(6)
  }
  const str = String(num)
  // 限制显示长度
  if (str.length > 15) {
    return num.toPrecision(10)
  }
  return str
}

// 处理按键
function handleKey(key) {
  if (key.type === 'num') {
    if (justCalculated.value) {
      expression.value = ''
      currentInput.value = ''
      justCalculated.value = false
    }
    if (key.value === '.' && currentInput.value.includes('.')) return
    currentInput.value += key.value
    expression.value += key.value
    result.value = formatDisplay(currentInput.value || '0')
  } else if (key.type === 'op') {
    justCalculated.value = false
    expression.value += ` ${key.label} `
    currentInput.value = ''
  } else if (key.type === 'func') {
    handleFuncAction(key.action)
  } else if (key.type === 'eq') {
    calculate()
  }
}

// 处理功能按键
function handleFuncAction(action) {
  if (action === 'clear') {
    expression.value = ''
    currentInput.value = ''
    result.value = '0'
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
      result.value = formatDisplay(currentInput.value || lastAnswer.value || '0')
    } else {
      // 退回一个操作符
      const idx = expression.value.lastIndexOf(' ')
      if (idx > -1) {
        expression.value = expression.value.slice(0, idx)
      } else {
        expression.value = ''
      }
      result.value = '0'
    }
  } else if (action === 'negate') {
    if (currentInput.value && currentInput.value !== '0') {
      if (currentInput.value.startsWith('-')) {
        currentInput.value = currentInput.value.slice(1)
      } else {
        currentInput.value = '-' + currentInput.value
      }
      // 更新 expression 中的最后一个数字
      const parts = expression.value.split(/(\s+)/)
      if (parts.length > 0) {
        parts[parts.length - 1] = currentInput.value
        expression.value = parts.join('')
      }
      result.value = formatDisplay(currentInput.value)
    }
  }
}

// 处理科学函数
function handleSci(fn) {
  justCalculated.value = false
  const lastNum = parseFloat(currentInput.value) || parseFloat(lastAnswer.value) || 0
  let val

  switch (fn) {
    case 'sin':
      val = Math.sin(lastNum * Math.PI / 180)
      expression.value = `sin(${lastNum}°)`
      break
    case 'cos':
      val = Math.cos(lastNum * Math.PI / 180)
      expression.value = `cos(${lastNum}°)`
      break
    case 'tan':
      val = Math.tan(lastNum * Math.PI / 180)
      expression.value = `tan(${lastNum}°)`
      break
    case 'log':
      val = Math.log10(lastNum)
      expression.value = `log(${lastNum})`
      break
    case 'ln':
      val = Math.log(lastNum)
      expression.value = `ln(${lastNum})`
      break
    case '√':
      val = Math.sqrt(lastNum)
      expression.value = `√(${lastNum})`
      break
    case 'x²':
      val = lastNum * lastNum
      expression.value = `(${lastNum})²`
      break
    case 'xⁿ':
      expression.value = `${lastNum}^`
      currentInput.value = ''
      result.value = formatDisplay(lastNum)
      return
    case 'π':
      val = Math.PI
      expression.value = 'π'
      break
    case 'e':
      val = Math.E
      expression.value = 'e'
      break
  }

  if (val !== undefined) {
    const formatted = typeof val === 'number' && !isNaN(val) ? formatDisplay(val) : String(val)
    currentInput.value = formatted
    result.value = formatted
    lastAnswer.value = val
    justCalculated.value = true
  }
}

// 计算
function calculate() {
  try {
    // 替换显示符号为JS可计算的符号
    let expr = expression.value
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/\^/g, '**')

    // 安全评估 —— 只允许数字和运算符
    const sanitized = expr.replace(/[^0-9+\-*/.() ]/g, '')
    if (!sanitized.trim()) {
      result.value = '0'
      return
    }

    // 使用 eval 在受控环境下计算
    const computed = Function(`"use strict"; return (${sanitized})`)()
    const formatted = formatDisplay(computed)
    result.value = formatted
    lastAnswer.value = computed
    justCalculated.value = true
    // 表达式保留用于继续运算
    currentInput.value = formatted
  } catch (e) {
    result.value = '错误'
    setTimeout(() => { result.value = '0' }, 1000)
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

  // 显示区域
  &__display {
    background: $card-bg;
    padding: 60rpx 32rpx 24rpx;
    border-bottom: 1rpx solid $border-color;

    // 分隔线以上为表达式区
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

    text {
      font-size: 22rpx;
      color: $text-primary;
    }

    &:active {
      opacity: 0.7;
    }
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

  &__key {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;
    font-size: 40rpx;
    transition: background 0.1s;

    &:active {
      opacity: 0.6;
    }

    // 数字键
    &--num {
      background: $primary-bg;
      color: $text-primary;
      font-size: 44rpx;
    }

    // 运算符
    &--op {
      background: $primary-bg;
      color: $primary-color;
      font-size: 40rpx;
    }

    // 等号
    &--eq {
      background: $primary-color;
      color: #fff;
      font-size: 44rpx;
    }

    // 功能键（C, ⌫）
    &--func {
      background: #E8E8ED;
      color: $text-primary;
      font-size: 36rpx;
    }
  }
}
</style>
