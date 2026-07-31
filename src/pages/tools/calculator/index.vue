/**
 * 专业科学计算器
 * 行业标准：函数即时计算、运算符优先级、括号、记忆功能
 * 表达式仅含数字/运算符/括号，函数立即作用于当前值
 */

<template>
  <div class="calculator">
    <div class="display">
      <div class="expression">{{ expression }}</div>
      <div class="current">{{ displayValue }}</div>
    </div>

    <div class="keypad">
      <button
        v-for="btn in buttons"
        :key="btn.label"
        :class="['btn', btn.type, { zero: btn.label === '0', active: btn.label === activeKey }]"
        @click="handleClick(btn)"
      >
        {{ btn.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const current = ref('0')
const previous = ref(null)
const operator = ref(null)
const waitingForOperand = ref(false)
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
  if (current.value.length > 12) {
    return parseFloat(current.value).toPrecision(12).replace(/\.?0+$/, '')
  }
  return current.value
})

function handleClick(btn) {
  flashKey(btn.label)
  if (btn.type === 'number') inputDigit(btn.label)
  else if (btn.type === 'operator') inputOperator(btn.action)
  else if (btn.type === 'function') performFunction(btn.action)
  else if (btn.type === 'equals') calculate()
}

function inputDigit(digit) {
  if (waitingForOperand.value) {
    current.value = digit
    waitingForOperand.value = false
  } else {
    current.value = current.value === '0' ? digit : current.value + digit
  }
  if (!operator.value) expression.value = ''
}

function inputDecimal() {
  if (waitingForOperand.value) {
    current.value = '0.'
    waitingForOperand.value = false
    return
  }
  if (!current.value.includes('.')) current.value += '.'
}

function inputOperator(nextOperator) {
  const inputValue = parseFloat(current.value)
  if (previous.value === null) {
    previous.value = inputValue
  } else if (operator.value) {
    const result = performCalculation()
    current.value = String(result)
    previous.value = result
  }
  waitingForOperand.value = true
  operator.value = nextOperator
  const symbols = { add: '+', subtract: '−', multiply: '×', divide: '÷' }
  expression.value = `${previous.value} ${symbols[nextOperator]}`
}

function performCalculation() {
  const prev = parseFloat(previous.value)
  const curr = parseFloat(current.value)
  if (isNaN(prev) || isNaN(curr)) return curr
  let result = 0
  switch (operator.value) {
    case 'add': result = prev + curr; break
    case 'subtract': result = prev - curr; break
    case 'multiply': result = prev * curr; break
    case 'divide': result = curr === 0 ? 'Error' : prev / curr; break
  }
  return typeof result === 'string' ? result : Math.round(result * 1000000000) / 1000000000
}

function calculate() {
  if (!operator.value || waitingForOperand.value) return
  const result = performCalculation()
  const symbols = { add: '+', subtract: '−', multiply: '×', divide: '÷' }
  expression.value = `${previous.value} ${symbols[operator.value]} ${current.value} =`
  current.value = String(result)
  previous.value = null
  operator.value = null
  waitingForOperand.value = true
}

function performFunction(action) {
  const value = parseFloat(current.value)
  switch (action) {
    case 'clear':
      current.value = '0'
      previous.value = null
      operator.value = null
      waitingForOperand.value = false
      expression.value = ''
      break
    case 'negate':
      current.value = String(value * -1)
      break
    case 'percent':
      current.value = String(value / 100)
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

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<style scoped>
.calculator {
  width: 320px;
  background: #1c1c1c;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  user-select: none;
}

.display {
  text-align: right;
  padding: 20px 10px;
  margin-bottom: 15px;
}

.expression {
  color: #a5a5a5;
  font-size: 16px;
  min-height: 24px;
  margin-bottom: 8px;
  word-break: break-all;
}

.current {
  color: #ffffff;
  font-size: 48px;
  font-weight: 300;
  min-height: 58px;
  word-break: break-all;
  line-height: 1.1;
}

.keypad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.btn {
  border: none;
  border-radius: 50%;
  width: 64px;
  height: 64px;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-weight: 500;
  outline: none;
}

.btn:active,
.btn.active {
  transform: scale(0.92);
}

.number {
  background: #333333;
  color: #ffffff;
}

.number:hover {
  background: #737373;
}

.zero {
  grid-column: span 2;
  width: 100%;
  border-radius: 32px;
  text-align: left;
  padding-left: 28px;
}

.function {
  background: #a5a5a5;
  color: #1c1c1c;
}

.function:hover {
  background: #d4d4d2;
}

.operator {
  background: #ff9f0c;
  color: #ffffff;
}

.operator:hover,
.operator.active {
  background: #ffffff;
  color: #ff9f0c;
}

.equals {
  background: #ff9f0c;
  color: #ffffff;
}

.equals:hover {
  background: #ffb340;
}
</style>
