/**
 * 专业科学计算器
 * 行业标准布局：四列键区、分组科学函数、大号等号
 */
<template>
  <view class="calc">
    <!-- ====== 显示区 ====== -->
    <view class="calc__display">
      <view class="calc__display-inner">
        <text class="calc__history">{{ history }}</text>
        <scroll-view class="calc__expr" scroll-x show-scrollbar="false" enhanced>
          <text class="calc__expr-text">{{ expr || '0' }}</text>
        </scroll-view>
        <text class="calc__result" :class="{ 'calc__result--err': isErr }">{{ result }}</text>
      </view>
    </view>

    <!-- ====== 记忆行 ====== -->
    <view class="calc__mem">
      <text v-for="m in memBtns" :key="m.label" class="calc__mem-btn"
        :class="{ 'calc__mem-btn--on': m.act === 'mr' && memory !== 0 }"
        @tap="handleMem(m)">{{ m.label }}</text>
    </view>

    <!-- ====== 科学函数行 ====== -->
    <scroll-view class="calc__sci" scroll-x show-scrollbar="false" enhanced>
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

// 科学函数（按分组排列）
const sciBtns = [
  { label: '(',  act: '(' },
  { label: ')',  act: ')' },
  { label: 'x²', act: 'sq' },
  { label: 'x³', act: 'cb' },
  { label: 'xⁿ', act: 'pow' },
  { label: '√',  act: 'sqrt' },
  { label: '∛',  act: 'cbrt' },
  { label: 'sin', act: 'sin' },
  { label: 'cos', act: 'cos' },
  { label: 'tan', act: 'tan' },
  { label: 'log', act: 'log' },
  { label: 'ln',  act: 'ln' },
  { label: 'x!', act: 'fact' },
  { label: '1/x', act: 'recip' },
  { label: '|x|', act: 'abs' },
  { label: 'π',  act: 'pi' },
  { label: 'e',  act: 'e' }
]

function k(label, type, extra) {
  return { label, type, cls: `calc__k--${type}`, ...extra }
}

// 按键布局：C/⌫/%/÷ → 7/8/9/× → 4/5/6/- → 1/2/3/+ → ±/0/./
// = 在右下角（第4列第5行）
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
//  科学函数
// ==================================================================

function handleSci(btn) {
  isErr.value = false

  if (btn.act === '(') {
    if (gotRes && lastVal !== null) {
      expr.value = fmt(lastVal); cur = fmt(lastVal); gotRes = false
    }
    if (expr.value && /[\d)]$/.test(expr.value.trimEnd())) expr.value += ' × '
    expr.value += '('; parens++; cur = ''; result.value = '('
    return
  }
  if (btn.act === ')') {
    if (parens <= 0) return
    expr.value += ')'; parens--; cur = ''; result.value = ')'
    return
  }

  if (btn.act === 'pi') { insertConst(Math.PI, 'π'); return }
  if (btn.act === 'e')  { insertConst(Math.E, 'e');  return }

  if (gotRes && lastVal !== null) {
    const v = fmt(lastVal)
    expr.value = v; cur = v; gotRes = false
  }

  if (btn.act === 'pow') {
    expr.value += '^'; cur = ''; result.value = fmt(displayNum())
    return
  }

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

  const display = btn.act === 'sq' ? `(${n})²`
    : btn.act === 'cb' ? `(${n})³`
    : `${btn.label}(${n})`

  replaceLastToken(display)

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
  if (!Number.isInteger(n)) return NaN
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
//  安全求值
// ==================================================================

function toEvalStr(s) {
  return s
    .replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**')
    .replace(/--/g, '+')
    .replace(/π/g, `(${Math.PI})`)
    .replace(/\be\b/g, `(${Math.E})`)
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

const SAFE_RE = /[^0-9+\-*/.()%\s,Math.sinclotagqrbefhpwPI]/g

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
  background: #1C1C1E; user-select: none;

  // ====== 显示区（深色背景，白色文字）=======
  &__display {
    background: #1C1C1E; flex-shrink: 0;
    padding: 0 20rpx;
  }
  &__display-inner {
    padding: 32rpx 0 20rpx;
    border-bottom: 1rpx solid rgba(255,255,255,0.08);
  }
  &__history {
    font-size: 22rpx; color: rgba(255,255,255,0.35);
    min-height: 30rpx; font-family: monospace; text-align: right;
  }
  &__expr {
    white-space: nowrap; min-height: 44rpx; margin: 4rpx 0;
    text-align: right;
    &-text {
      font-size: 32rpx; color: rgba(255,255,255,0.5);
      font-family: monospace; display: inline-block;
    }
  }
  &__result {
    text-align: right; font-size: 72rpx; font-weight: 300;
    color: #fff; font-family: monospace; line-height: 1.1; min-height: 80rpx;
    &--err { color: #FF453A; font-size: 52rpx; }
  }

  // ====== 记忆行 ======
  &__mem {
    display: flex; padding: 4rpx 12rpx; background: #2C2C2E; gap: 2rpx; flex-shrink: 0;
  }
  &__mem-btn {
    flex: 1; text-align: center; font-size: 22rpx; color: rgba(255,255,255,0.5);
    padding: 8rpx 0; border-radius: 6rpx;
    &:active { background: rgba(255,255,255,0.1); }
    &--on { color: #fff; }
  }

  // ====== 科学函数行 ======
  &__sci {
    white-space: nowrap; padding: 6rpx 10rpx; background: #2C2C2E;
    flex-shrink: 0;
  }
  &__sci-btn {
    display: inline-flex; align-items: center; justify-content: center;
    height: 56rpx; min-width: 72rpx; padding: 0 14rpx; margin-right: 6rpx;
    background: #3A3A3C; border-radius: 10rpx;
    text { font-size: 22rpx; color: rgba(255,255,255,0.85); white-space: nowrap; }
    &:active { background: #4A4A4C; }
  }

  // ====== 主键盘（深色背景，浅色按键）======
  &__keys {
    flex: 1; display: flex; flex-direction: column;
    padding: 6rpx 8rpx env(safe-area-inset-bottom, 12rpx) 8rpx; gap: 6rpx;
    background: #1C1C1E;
  }
  &__row { display: flex; gap: 6rpx; flex: 1; }
  &__key {
    flex: 1; display: flex; align-items: center; justify-content: center;
    border-radius: 16rpx; font-size: 40rpx; font-weight: 400;
    transition: background 0.1s;
    &:active { opacity: 0.6; }

    // 数字键（浅灰）
    &--n  { background: #505052; color: #fff; font-size: 44rpx; }

    // 运算符/百分比（稍浅灰）
    &--op { background: #3A3A3C; color: #fff; font-size: 40rpx; }

    // = 号（主题色）
    &--eq { background: $primary-color; color: #fff; font-size: 44rpx; }

    // 功能键 C/⌫/±（深灰）
    &--fn { background: #2C2C2E; color: rgba(255,255,255,0.85); font-size: 36rpx; }
  }
}
</style>
