/**
 * 专业科学计算器
 * 支持加减乘除，含运算符优先级（×÷ 优先于 +−），即时计算，除零保护
 */

<template>
  <view class="page">
    <view class="card display-card">
      <view class="expression">{{ expression }}</view>
      <view class="current">{{ displayValue }}</view>
    </view>

    <view class="card keypad-card">
      <view class="keypad">
        <view
          v-for="btn in buttons"
          :key="btn.label"
          :class="['btn', btn.type, { zero: btn.label === '0', active: btn.label === activeKey }]"
          @tap="handleClick(btn)"
        >
          {{ btn.label }}
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const current = ref('0')
const waitingForOperand = ref(true)
const expression = ref('')
const activeKey = ref('')

const buttons = [
  { label: 'AC', type: 'function', action: 'clear' },
  { label: '±', type: 'function', action: 'negate' },
  { label: '%', type: 'function', action: 'percent' },
  { label: '÷', type: 'operator', action: 'divide' },
  { label: '7', type: 'number' },
  { label: '8', type: 'number' },
  { label: '9', type: 'number' },
  { label: '×', type: 'operator', action: 'multiply' },
  { label: '4', type: 'number' },
  { label: '5', type: 'number' },
  { label: '6', type: 'number' },
  { label: '−', type: 'operator', action: 'subtract' },
  { label: '1', type: 'number' },
  { label: '2', type: 'number' },
  { label: '3', type: 'number' },
  { label: '+', type: 'operator', action: 'add' },
  { label: '0', type: 'number' },
  { label: '.', type: 'function', action: 'decimal' },
  { label: '=', type: 'equals', action: 'calculate' },
]

const displayValue = computed(() => {
  const v = current.value === '' ? '0' : current.value
  if (v === 'Error' || v === 'NaN') return v
  if (v.length > 12) {
    return parseFloat(v).toPrecision(12).replace(/\.?0+$/, '')
  }
  return v
})

function handleClick(btn) {
  flashKey(btn.label)
  if (btn.type === 'number') inputDigit(btn.label)
  else if (btn.type === 'operator') inputOperator(btn.action)
  else if (btn.type === 'function') performFunction(btn.action)
  else if (btn.type === 'equals') calculate()
}

function inputDigit(digit) {
  // 上一步是 '='：开始新运算，清空旧表达式
  if (expression.value.includes('=')) expression.value = ''
  if (waitingForOperand.value) {
    current.value = digit
    waitingForOperand.value = false
  } else {
    current.value = current.value === '0' ? digit : current.value + digit
  }
}

function inputDecimal() {
  if (expression.value.includes('=')) expression.value = ''
  if (waitingForOperand.value) {
    current.value = '0.'
    waitingForOperand.value = false
    return
  }
  if (!current.value.includes('.')) current.value += '.'
}

function inputOperator(nextOperator) {
  const symbols = { add: '+', subtract: '−', multiply: '×', divide: '÷' }
  const op = symbols[nextOperator]

  // 上一步是 '='：用当前结果继续计算
  if (expression.value.includes('=')) {
    expression.value = (current.value === '' ? '0' : current.value) + op
    current.value = ''
    waitingForOperand.value = true
    return
  }

  if (waitingForOperand.value) {
    // 连续按运算符：替换末尾运算符
    if (expression.value) {
      expression.value = expression.value.replace(/[+−×÷]$/, '') + op
    }
    return
  }

  expression.value += current.value + op
  current.value = ''
  waitingForOperand.value = true
}

/** 表达式求值：×÷ 优先于 +−，同级从左到右（调度场算法） */
function evaluateExpression(str) {
  const tokens = str.match(/(\d+\.?\d*|[+−×÷])/g) || []
  const prec = { '+': 1, '−': 1, '×': 2, '÷': 2 }
  // 中缀转后缀
  const output = []
  const opStack = []
  for (const t of tokens) {
    if (t === '+' || t === '−' || t === '×' || t === '÷') {
      while (opStack.length && prec[opStack[opStack.length - 1]] >= prec[t]) {
        output.push(opStack.pop())
      }
      opStack.push(t)
    } else {
      output.push(parseFloat(t))
    }
  }
  while (opStack.length) output.push(opStack.pop())
  // 求后缀表达式
  const stack = []
  for (const t of output) {
    if (typeof t === 'number') {
      stack.push(t)
      continue
    }
    const b = stack.pop()
    const a = stack.pop()
    let r
    switch (t) {
      case '+': r = a + b; break
      case '−': r = a - b; break
      case '×': r = a * b; break
      case '÷': r = b === 0 ? 'Error' : a / b; break
    }
    if (r === 'Error') return 'Error'
    stack.push(r)
  }
  const final = stack[stack.length - 1]
  return Math.round(final * 1000000000) / 1000000000
}

function calculate() {
  if (waitingForOperand.value) {
    // 末尾是运算符且无当前值：去掉末尾运算符再计算
    expression.value = expression.value.replace(/[+−×÷]$/, '')
  } else {
    expression.value += current.value
  }
  if (!expression.value) return
  const result = evaluateExpression(expression.value)
  if (result === 'Error') {
    expression.value = ''
    current.value = 'Error'
  } else {
    expression.value += ' ='
    current.value = String(result)
  }
  waitingForOperand.value = true
}

function performFunction(action) {
  switch (action) {
    case 'clear':
      current.value = '0'
      expression.value = ''
      waitingForOperand.value = true
      break
    case 'negate':
      if (current.value === 'Error' || current.value === 'NaN') {
        current.value = '0'
        expression.value = ''
        waitingForOperand.value = true
        return
      }
      current.value = String(parseFloat(current.value || '0') * -1)
      break
    case 'percent':
      if (current.value === 'Error' || current.value === 'NaN') {
        current.value = '0'
        expression.value = ''
        waitingForOperand.value = true
        return
      }
      current.value = String(parseFloat(current.value || '0') / 100)
      break
    case 'decimal':
      inputDecimal()
      break
  }
}

function flashKey(key) {
  activeKey.value = key
  setTimeout(() => (activeKey.value = ''), 100)
}

function handleKeydown(e) {
  const keyMap = {
    Enter: '=',
    Escape: 'AC',
    Backspace: 'AC',
    '+': '+',
    '-': '−',
    '*': '×',
    '/': '÷',
    0: '0',
    1: '1',
    2: '2',
    3: '3',
    4: '4',
    5: '5',
    6: '6',
    7: '7',
    8: '8',
    9: '9',
    '.': '.',
  }
  const mapped = keyMap[e.key]
  if (!mapped) return
  e.preventDefault()
  const btn = buttons.find((b) => b.label === mapped)
  if (btn) handleClick(btn)
}

// 键盘快捷键仅 H5 支持，小程序端无 window 对象（加守卫避免报错）
onMounted(() => {
  if (typeof window !== 'undefined') window.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  if (typeof window !== 'undefined') window.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #F5F5F7;
  padding: 24rpx;
}
.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  margin-bottom: 24rpx;
}
.display-card {
  text-align: right;
  padding: 32rpx 24rpx;
}
.expression {
  color: #86868B;
  font-size: 28rpx;
  min-height: 40rpx;
  margin-bottom: 12rpx;
  word-break: break-all;
}
.current {
  color: #1D1D1F;
  font-size: 72rpx;
  font-weight: 300;
  min-height: 88rpx;
  word-break: break-all;
  line-height: 1.1;
  font-family: monospace;
}
.keypad-card {
  padding: 16rpx;
}
.keypad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
}
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100rpx;
  border-radius: 16rpx;
  font-size: 36rpx;
  font-weight: 500;
  transition: all 0.15s ease;
  user-select: none;
  &:active {
    transform: scale(0.95);
    opacity: 0.8;
  }
  &.active {
    transform: scale(0.95);
  }
}
.number {
  background: #FFFFFF;
  color: #1D1D1F;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
  &:active { background: #F5F5F7; }
}
.zero {
  grid-column: span 2;
  text-align: left;
  padding-left: 36rpx;
}
.function {
  background: #F5F5F7;
  color: #1D1D1F;
  &:active { background: #E5E5EA; }
}
.operator {
  background: #1D1D1F;
  color: #FFFFFF;
  &:active { background: #3A3A3C; }
  &.active {
    background: #FFFFFF;
    color: #1D1D1F;
    box-shadow: 0 0 0 2rpx #1D1D1F;
  }
}
.equals {
  background: #007AFF;
  color: #FFFFFF;
  &:active { background: #0056CC; }
}
</style>
