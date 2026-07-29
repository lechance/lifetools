/**
 * 科学计算器
 * 支持基础运算+科学函数+括号
 * 健壮性优化：防连续运算符、保护表达式状态
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

    <!-- 主按键区 -->
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

// ========== 静态数据 ==========

const sciFuncs = ['sin', 'cos', 'tan', 'log', 'ln', '√', 'x²', 'xⁿ', 'π', 'e']

function buildKey(label, type, extra) {
  return { label, type, cls: `calculator__key calculator__key--${type}`, ...extra }
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

// ========== 状态 ==========

const expression = ref('')      // 算式文本
const result = ref('0')         // 结果显示
const currentInput = ref('')    // 当前输入的数字
const lastAnswer = ref(null)    // 上次计算结果
const justGotResult = ref(false) // 刚获得结果标记

const displayExpr = computed(() => expression.value || '0')

// 格式化
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

// ========== 按键处理 ==========

/** 判断表达式末尾是否以运算符结尾 */
function endsWithOp(expr) {
  return /[\s+\-/*÷×%]+\s*$/.test(expr)
}

/** 去掉末尾运算符 */
function trimTrailingOp(expr) {
  return expr.replace(/[\s+\-/*÷×%]+$/g, '').trimEnd()
}

function handleKey(key) {
  if (key.type === 'num') {
    handleDigit(key.value)
  } else if (key.type === 'op') {
    handleOperator(key)
  } else if (key.type === 'func') {
    handleFuncAction(key.action)
  } else if (key.type === 'eq') {
    calculate()
  }
}

/** 输入数字 */
function handleDigit(value) {
  // 刚算完结果 → 清空重新开始
  if (justGotResult.value) {
    expression.value = ''
    currentInput.value = ''
    lastAnswer.value = null
    justGotResult.value = false
  }

  // 小数点去重
  if (value === '.' && currentInput.value.includes('.')) return

  // 前导零：当前是 "0" 且按的是数字 → 替换，按小数点 → 保留
  if (value !== '.' && currentInput.value === '0') {
    currentInput.value = value
    expression.value = expression.value.slice(0, -1) + value
    result.value = value
    return
  }

  currentInput.value += value
  expression.value += value
  result.value = formatDisplay(currentInput.value)
}

/** 输入运算符 */
function handleOperator(key) {
  // 刚算完结果 → 用结果继续运算
  if (justGotResult.value && lastAnswer.value !== null) {
    const v = formatDisplay(lastAnswer.value)
    expression.value = v
    currentInput.value = v
    justGotResult.value = false
  }

  // 当前没有输入数字 → 替换末尾运算符
  if (!currentInput.value && expression.value) {
    expression.value = trimTrailingOp(expression.value) + ` ${key.label} `
    return
  }

  expression.value += ` ${key.label} `
  currentInput.value = ''
  justGotResult.value = false
}

/** 功能键：C / ⌫ / ± */
function handleFuncAction(action) {
  if (action === 'clear') {
    expression.value = ''
    currentInput.value = ''
    result.value = '0'
    lastAnswer.value = null
    justGotResult.value = false
    return
  }

  if (action === 'backspace') {
    if (justGotResult.value) {
      expression.value = ''
      currentInput.value = ''
      result.value = '0'
      justGotResult.value = false
      return
    }
    if (currentInput.value.length > 0) {
      currentInput.value = currentInput.value.slice(0, -1)
      expression.value = expression.value.slice(0, -1)
      result.value = formatDisplay(currentInput.value || lastAnswer.value || '0')
    } else {
      // 退回一个运算符
      expression.value = trimTrailingOp(expression.value)
      result.value = '0'
    }
    return
  }

  if (action === 'negate') {
    if (currentInput.value && currentInput.value !== '0') {
      currentInput.value = currentInput.value.startsWith('-')
        ? currentInput.value.slice(1)
        : '-' + currentInput.value
      const parts = expression.value.split(/(\s+)/)
      if (parts.length > 0) {
        parts[parts.length - 1] = currentInput.value
        expression.value = parts.join('')
      }
      result.value = formatDisplay(currentInput.value)
    }
  }
}

// ========== 科学函数 ==========

function handleSci(fn) {
  if (justGotResult.value && lastAnswer.value !== null) {
    currentInput.value = formatDisplay(lastAnswer.value)
  }
  justGotResult.value = false
  const lastNum = parseFloat(currentInput.value) || 0
  let val

  switch (fn) {
    case 'sin':  val = Math.sin(lastNum * Math.PI / 180); break
    case 'cos':  val = Math.cos(lastNum * Math.PI / 180); break
    case 'tan':  val = Math.tan(lastNum * Math.PI / 180); break
    case 'log':  val = Math.log10(lastNum); break
    case 'ln':   val = Math.log(lastNum); break
    case '√':    val = lastNum < 0 ? NaN : Math.sqrt(lastNum); break
    case 'x²':   val = lastNum * lastNum; break
    case 'xⁿ':
      expression.value = `${lastNum}^`
      currentInput.value = ''
      result.value = formatDisplay(lastNum)
      return
    case 'π':  val = Math.PI; break
    case 'e':  val = Math.E; break
  }

  if (val !== undefined) {
    const formatted = isFinite(val) ? formatDisplay(val) : (isNaN(val) ? '错误' : '∞')
    expression.value = `${fn}(${lastNum})`
    currentInput.value = formatted
    result.value = formatted
    lastAnswer.value = val
    justGotResult.value = true
  }
}

// ========== 计算 ==========

const OP_MAP = { '×': '*', '÷': '/', '^': '**' }
const OP_PATTERN = /[×÷^]/g

function calculate() {
  // 表达式为空或只含运算符 → 不计算
  const raw = expression.value.trim()
  if (!raw) return
  if (endsWithOp(raw)) return

  try {
    const expr = raw.replace(OP_PATTERN, ch => OP_MAP[ch]).replace(/--/g, '+')
    const sanitized = expr.replace(/[^0-9+\-*/.()% ]/g, '')
    if (!sanitized.trim()) return

    const computed = Function(`"use strict"; return (${sanitized})`)()
    if (!isFinite(computed)) {
      result.value = isNaN(computed) ? '错误' : '∞'
      return
    }
    const formatted = formatDisplay(computed)
    result.value = formatted
    lastAnswer.value = computed
    justGotResult.value = true
    currentInput.value = formatted
    // 注意：不修改 expression，下次输入时由 justGotResult 触发清空
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

  &__result { text-align: right; }
  &__result-text {
    font-size: 72rpx;
    font-weight: 300;
    color: $text-primary;
    font-family: 'Menlo', 'Monaco', monospace;
    line-height: 1.1;
    word-break: break-all;
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
    padding: 12rpx 12px 24rpx;
    gap: 8rpx;
    background: $card-bg;
  }
  &__key-row { display: flex; gap: 8rpx; flex: 1; }
  &__key {
    flex: 1; display: flex; align-items: center; justify-content: center;
    border-radius: 16rpx; font-size: 40rpx;
    &:active { opacity: 0.6; }
    &--num  { background: $primary-bg; color: $text-primary; font-size: 44rpx; }
    &--op   { background: $primary-bg; color: $primary-color; font-size: 40rpx; }
    &--eq   { background: $primary-color; color: #fff; font-size: 44rpx; }
    &--func { background: #E8E8ED; color: $text-primary; font-size: 36rpx; }
  }
}
</style>
