/**
 * 专业科学计算器
 * 行业标准：函数即时计算、运算符优先级、括号、记忆功能
 * 表达式仅含数字/运算符/括号，函数调用显示为 sin(30) 并立即计算
 */
<template>
  <view class="calc">
    <!-- ====== 显示区 ====== -->
    <view class="calc__display">
      <text class="calc__history">{{ history }}</text>
      <scroll-view class="calc__expr" scroll-x show-scrollbar="false">
        <text class="calc__expr-text">{{ expr || '0' }}</text>
      </scroll-view>
      <text class="calc__result" :class="{ 'calc__result--err': isErr }">{{ result }}</text>
      <text v-if="memory !== 0" class="calc__mem-indicator">M</text>
    </view>

    <!-- ====== 记忆行 ====== -->
    <view class="calc__mem">
      <text v-for="m in memBtns" :key="m.label" class="calc__mem-btn"
        :class="{ 'calc__mem-btn--active': m.act === 'mr' && memory !== 0 }"
        @tap="handleMem(m)">{{ m.label }}</text>
    </view>

    <!-- ====== 科学函数行 ====== -->
    <scroll-view class="calc__sci" scroll-x show-scrollbar="false">
      <view v-for="b in sciBtns" :key="b.label" class="calc__sci-btn" @tap="handleSci(b)">
        <text>{{ b.label }}</text>
      </view>
    </scroll-view>

    <!-- ====== 主按键区 ====== -->
    <view class="calc__keys">
      <view v-for="(row, ri) in keys" :key="ri" class="calc__row">
        <view v-for="k in row" :key="k.label"
          :class="['calc__key', k.cls]" @tap="onKey(k)">
          <text>{{ k.label }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

// ==================================================================
//  按键数据
// ==================================================================

const memBtns = [
  { label: 'MC', act: 'mc' },
  { label: 'MR', act: 'mr' },
  { label: 'M+', act: 'mAdd' },
  { label: 'M-', act: 'mSub' }
]

const sciBtns = [
  { label: '(',  act: '(' },
  { label: ')',  act: ')' },
  { label: 'x²', act: 'sq' },
  { label: 'x³', act: 'cb' },
  { label: 'xⁿ', act: 'pow' },
  { label: '√',  act: 'sqrt' },
  { label: '∛',  act: 'cbrt' },
  { label: 'x!', act: 'fact' },
  { label: '1/x', act: 'recip' },
  { label: '|x|', act: 'abs' },
  { label: 'π',  act: 'pi' },
  { label: 'e',  act: 'e' },
  { label: 'sin', act: 'sin' },
  { label: 'cos', act: 'cos' },
  { label: 'tan', act: 'tan' },
  { label: 'log', act: 'log' },
  { label: 'ln',  act: 'ln' }
]

function k(label, type, extra) {
  return { label, type, cls: `calc__k--${type}`, ...extra }
}

const keys = [
  [k('C',  'fn', { act: 'clear' }), k('⌫', 'fn', { act: 'bs' }), k('%', 'op', { val: '%' }), k('÷', 'op', { val: '/' })],
  [k('7', 'n', { val: '7' }), k('8', 'n', { val: '8' }), k('9', 'n', { val: '9' }), k('×', 'op', { val: '*' })],
  [k('4', 'n', { val: '4' }), k('5', 'n', { val: '5' }), k('6', 'n', { val: '6' }), k('-', 'op', { val: '-' })],
  [k('1', 'n', { val: '1' }), k('2', 'n', { val: '2' }), k('3', 'n', { val: '3' }), k('+', 'op', { val: '+' })],
  [k('±', 'fn', { act: 'neg' }), k('0', 'n', { val: '0' }), k('.', 'n', { val: '.' }), k('=', 'eq', { act: 'calc' })]
]

// ==================================================================
//  状态
// ==================================================================

const expr = ref('')       // 算式
const result = ref('0')    // 当前结果
const history = ref('')    // 上一步结果文本
const isErr = ref(false)
const memory = ref(0)

let cur = ''          // 当前输入数字串
let lastVal = null    // 上次计算结果
let gotRes = false    // 刚得到结果
let parens = 0        // 括号深度

// ==================================================================
//  工具函数
// ==================================================================

/** 格式化数字 */
function fmt(n) {
  if (n === '' || n === null || n === undefined) return '0'
  const num = typeof n === 'number' ? n : Number(n)
  if (!isFinite(num)) return isNaN(num) ? '错误' : (num > 0 ? '∞' : '-∞')
  if (Math.abs(num) > 1e12 || (Math.abs(num) < 1e-9 && num !== 0)) return num.toExponential(8)
  const s = String(num)
  return s.length > 16 ? num.toPrecision(12) : s
}

/** 末尾是否运算符（含显示符号 ×÷） */
function endsWithOp(s) { return /[+\-*/%×÷]$/.test(s.trimEnd()) }

/** 去掉末尾运算符 */
function trimOp(s) { return s.trimEnd().replace(/[+\-*/%×÷]+$/, '').trimEnd() }

/** 表达式是否以数字或 ) 结尾（可追加运算符） */
function endsWithNumOrParen(s) { return /[\d)]$/.test(s.trimEnd()) }

/** 当前显示值 */
function displayNum() { return parseFloat(cur || result.value || '0') }

/** 替换表达式末尾的数字为指定文本 */
function replaceLastToken(replacement) {
  const m = expr.value.match(/^(.*?)(-?[\d.]+)$/)
  if (m) {
    expr.value = m[1] + replacement
  } else {
    expr.value += replacement
  }
}

// ==================================================================
//  主按键处理器
// ==================================================================

function onKey(k) {
  isErr.value = false
  if (k.type === 'n')      digit(k.val)
  else if (k.type === 'op')  op(k.label)
  else if (k.type === 'eq')  calc()
  else if (k.type === 'fn')  doFn(k.act)
}

// ==================================================================
//  数字输入
// ==================================================================

function digit(d) {
  if (gotRes) { expr.value = ''; cur = ''; lastVal = null; gotRes = false }
  if (d === '.' && cur.includes('.')) return
  // 前导零：当前"0"且按数字 → 替换
  if (d !== '.' && cur === '0') {
    cur = d; expr.value = expr.value.slice(0, -1) + d; result.value = d
    return
  }
  cur += d
  expr.value += d
  result.value = cur
}

// ==================================================================
//  运算符
// ==================================================================

function op(val) {
  if (gotRes && lastVal !== null) {
    const v = fmt(lastVal)
    expr.value = v; cur = v; gotRes = false
  }
  // 末尾已有运算符 → 替换
  if (cur === '' && expr.value && endsWithOp(expr.value)) {
    expr.value = trimOp(expr.value) + ` ${val} `
    return
  }
  expr.value += ` ${val} `
  cur = ''
}

// ==================================================================
//  功能键
// ==================================================================

function doFn(act) {
  isErr.value = false
  if (act === 'clear') {
    expr.value = ''; cur = ''; result.value = '0'
    lastVal = null; gotRes = false; history.value = ''; parens = 0
    return
  }
  if (act === 'bs') {
    if (gotRes) { expr.value = ''; cur = ''; result.value = '0'; gotRes = false; return }
    if (cur.length > 0) {
      cur = cur.slice(0, -1)
      expr.value = expr.value.slice(0, -1)
      result.value = fmt(cur || lastVal || '0')
    } else {
      expr.value = trimOp(expr.value)
      result.value = '0'
    }
    return
  }
  if (act === 'neg') {
    if (cur && cur !== '0') {
      cur = cur.startsWith('-') ? cur.slice(1) : '-' + cur
      const parts = expr.value.split(/(\s+)/)
      if (parts.length) { parts[parts.length - 1] = cur; expr.value = parts.join('') }
      result.value = fmt(cur)
    }
  }
}

// ==================================================================
//  科学函数 — 立即计算，表达式显示函数调用
// ==================================================================

function handleSci(btn) {
  isErr.value = false

  // --- 括号 ---
  if (btn.act === '(') {
    if (expr.value && /[\d)]$/.test(expr.value.trimEnd())) expr.value += ' × '
    expr.value += '('; parens++; cur = ''; result.value = '('
    return
  }
  if (btn.act === ')') {
    if (parens <= 0) return
    expr.value += ')'; parens--; cur = ''; result.value = ')'
    return
  }

  // --- 常数 ---
  if (btn.act === 'pi') { insertConst(Math.PI, 'π'); return }
  if (btn.act === 'e')  { insertConst(Math.E, 'e');  return }

  // --- 若有上次结果且没有当前输入，用结果作为输入 ---
  if (gotRes && lastVal !== null) {
    cur = fmt(lastVal)
    gotRes = false
  }

  // --- 幂运算符（右结合，需要继续输入指数）---
  if (btn.act === 'pow') {
    expr.value += '^'; cur = ''; result.value = fmt(displayNum())
    return
  }

  // --- 一元函数计算 ---
  const n = displayNum()
  let val

  switch (btn.act) {
    case 'sq':    val = n * n;          break
    case 'cb':    val = n * n * n;      break
    case 'sqrt':  val = Math.sqrt(n);   break
    case 'cbrt':  val = Math.cbrt(n);   break
    case 'fact':  val = factorial(n);   break
    case 'recip': val = n === 0 ? NaN : 1 / n; break
    case 'abs':   val = Math.abs(n);    break
    case 'sin':   val = Math.sin(n * Math.PI / 180); break
    case 'cos':   val = Math.cos(n * Math.PI / 180); break
    case 'tan':   val = Math.tan(n * Math.PI / 180); break
    case 'log':   val = Math.log10(n);  break
    case 'ln':    val = Math.log(n);    break
  }

  if (val === undefined) return

  // 构造函数显示文本：sin(30)
  const display = btn.act === 'sq' ? `(${n})²`
    : btn.act === 'cb' ? `(${n})³`
    : `${btn.label}(${n})`

  // 替换末尾数字为函数调用显示
  replaceLastToken(display)

  // 求值完整表达式（例如 5 + sin(30) → 5.5），而非仅函数值
  const full = safeEval(expr.value)
  const finalVal = isFinite(full) ? full : val
  const f = isFinite(finalVal) ? fmt(finalVal) : (isNaN(finalVal) ? '错误' : '∞')
  cur = f
  result.value = f
  lastVal = finalVal
  gotRes = true
}

/** 插入常数（π/e/记忆值） */
function insertConst(v, label) {
  if (gotRes) { expr.value = ''; cur = ''; gotRes = false }
  if (expr.value && /[\d)]$/.test(expr.value.trimEnd())) expr.value += ' × '
  expr.value += label
  cur = fmt(v)
  result.value = cur
  lastVal = v
  gotRes = true
}

/** 阶乘 */
function factorial(n) {
  if (n < 0 || n > 170) return NaN
  if (n === 0 || n === 1) return 1
  if (!Number.isInteger(n)) return NaN  // 非整数阶乘无定义
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

// ==================================================================
//  记忆
// ==================================================================

function handleMem(m) {
  const v = displayNum()
  if (m.act === 'mc')    { memory.value = 0; return }
  if (m.act === 'mr')    { insertConst(memory.value, fmt(memory.value)); return }
  if (m.act === 'mAdd')  { memory.value += v; return }
  if (m.act === 'mSub')  { memory.value -= v; return }
}

// ==================================================================
//  安全求值 — 支持函数名、运算符、常数
// ==================================================================

/**
 * 将显示表达式转换为可执行的 JavaScript 表达式字符串
 * 处理：函数名→Math.*、度数→弧度、常数替换、安全过滤
 */
function toEvalStr(s) {
  return s
    .replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**')
    .replace(/--/g, '+')
    .replace(/π/g, `(${Math.PI})`)
    .replace(/\be\b/g, `(${Math.E})`)
    // 函数调用 → Math.*（度数→弧度）
    .replace(/sin\(([^)]+)\)/g, 'Math.sin(($1)*Math.PI/180)')
    .replace(/cos\(([^)]+)\)/g, 'Math.cos(($1)*Math.PI/180)')
    .replace(/tan\(([^)]+)\)/g, 'Math.tan(($1)*Math.PI/180)')
    .replace(/log\(([^)]+)\)/g, 'Math.log10($1)')
    .replace(/ln\(([^)]+)\)/g, 'Math.log($1)')
    .replace(/√\(([^)]+)\)/g, 'Math.sqrt($1)')
    .replace(/∛\(([^)]+)\)/g, 'Math.cbrt($1)')
    .replace(/\((-?[\d.]+)\)²/g, 'Math.pow($1,2)')
    .replace(/\((-?[\d.]+)\)³/g, 'Math.pow($1,3)')
}

/** 安全过滤：只保留数字、运算符、Math 对象相关字符 */
const SAFE_RE = /[^0-9+\-*/.()%\s,Math.sinclotagqrbefhpwPI]/g

/** 求值完整表达式，返回数值或 NaN */
function safeEval(s) {
  const e = toEvalStr(s)
  const safe = e.replace(SAFE_RE, '')
  if (!safe.trim()) return NaN
  return Function('"use strict"; return (' + safe + ')')()
}

// ==================================================================
//  计算
// ==================================================================

function calc() {
  isErr.value = false
  const raw = expr.value.trim()
  if (!raw || endsWithOp(raw)) return

  try {
    const val = safeEval(raw)
    if (!isFinite(val)) {
      result.value = isNaN(val) ? '错误' : '∞'
      isErr.value = true
      return
    }
    history.value = `${expr.value} =`
    const f = fmt(val)
    result.value = f
    lastVal = val
    gotRes = true
    cur = f
  } catch {
    result.value = '错误'
    isErr.value = true
  }
}
</script>

<style lang="scss" scoped>
.calc {
  display: flex; flex-direction: column; height: 100vh;
  background: $card-bg; user-select: none;

  // ====== 显示 ======
  &__display {
    padding: 24rpx 28rpx 12rpx; border-bottom: 1rpx solid $border-color;
    flex-shrink: 0; position: relative;
  }
  &__history { font-size: 22rpx; color: $text-light; min-height: 30rpx; font-family: monospace; }
  &__expr {
    white-space: nowrap; min-height: 40rpx; margin: 6rpx 0;
    &-text { font-size: 30rpx; color: $text-secondary; font-family: monospace; }
  }
  &__result {
    text-align: right; font-size: 60rpx; font-weight: 300; color: $text-primary;
    font-family: monospace; line-height: 1.1;
    &--err { color: $danger; font-size: 44rpx; }
  }
  &__mem-indicator {
    position: absolute; right: 28rpx; bottom: 12rpx; font-size: 20rpx;
    color: $primary-color; font-weight: 700;
  }

  // ====== 记忆行 ======
  &__mem {
    display: flex; padding: 4rpx 12rpx; background: $primary-bg; gap: 4rpx; flex-shrink: 0;
  }
  &__mem-btn {
    flex: 1; text-align: center; font-size: 20rpx; color: $text-secondary;
    padding: 6rpx 0; border-radius: 6rpx;
    &:active { background: $border-color; }
    &--active { color: $primary-color; font-weight: 600; }
  }

  // ====== 科学行 ======
  &__sci {
    white-space: nowrap; padding: 6rpx 12rpx; background: $primary-bg;
    border-bottom: 1rpx solid $border-color; flex-shrink: 0;
  }
  &__sci-btn {
    display: inline-flex; align-items: center; justify-content: center;
    height: 50rpx; min-width: 66rpx; padding: 0 10rpx; margin-right: 6rpx;
    background: $card-bg; border-radius: 8rpx; box-shadow: $shadow-sm;
    text { font-size: 20rpx; color: $text-primary; white-space: nowrap; }
    &:active { opacity: 0.65; }
  }

  // ====== 主键盘 ======
  &__keys {
    flex: 1; display: flex; flex-direction: column;
    padding: 6rpx 8rpx 16rpx; gap: 6rpx;
  }
  &__row { display: flex; gap: 6rpx; flex: 1; }
  &__key {
    flex: 1; display: flex; align-items: center; justify-content: center;
    border-radius: 14rpx; font-size: 36rpx;
    &:active { opacity: 0.55; }
    &--n  { background: $primary-bg; font-size: 40rpx; color: $text-primary; }
    &--op { background: $primary-bg; font-size: 36rpx; color: $primary-color; }
    &--eq { background: $primary-color; color: #fff; font-size: 40rpx; }
    &--fn { background: #E8E8ED; font-size: 32rpx; color: $text-primary; }
  }
}
</style>
