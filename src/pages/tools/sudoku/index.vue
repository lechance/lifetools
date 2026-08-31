<template>
  <view class="page">
    <view class="card">
      <view class="board">
        <view v-for="(row, r) in board" :key="r" class="row" :class="{ 'row--bottom': r === 2 || r === 5 }">
          <view v-for="(cell, c) in row" :key="c" class="cell"
            :class="{
              'cell--right': c === 2 || c === 5,
              'cell--given': cell.given,
              'cell--selected': selected[0] === r && selected[1] === c,
              'cell--same': selected[0] !== null && cell.value !== 0 && cell.value === board[selected[0]][selected[1]].value && !(selected[0] === r && selected[1] === c),
              'cell--error': cell.error
            }"
            @tap="selectCell(r, c)">
            <text>{{ cell.value || '' }}</text>
          </view>
        </view>
      </view>

      <view class="keypad">
        <view v-for="n in 9" :key="n" class="num-key" @tap="inputNumber(n)">{{ n }}</view>
        <view class="num-key num-key--erase" @tap="erase">✕</view>
      </view>

      <view class="actions">
        <view class="action-btn" @tap="newGame">新游戏</view>
        <view class="action-btn" @tap="checkBoard">检查</view>
        <view class="action-btn" @tap="hint">提示</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { showToast, showSuccess } from '@/utils/helpers'

const board = ref([])
const selected = ref([null, null])
const solution = ref([])
const HINTS = 38  // 挖 38 个洞，留 43 个

function newGame() {
  solution.value = generateSolution()
  const puzzle = makePuzzle(solution.value, HINTS)
  board.value = puzzle.map((row, r) => row.map((val, c) => ({
    value: val,
    given: val !== 0,
    error: false
  })))
  selected.value = [null, null]
}

function generateSolution() {
  const b = Array.from({ length: 9 }, () => Array(9).fill(0))
  fill(b)
  return b
}

function fill(b) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (b[r][c] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
        for (const n of nums) {
          if (isValid(b, r, c, n)) {
            b[r][c] = n
            if (fill(b)) return true
            b[r][c] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

function isValid(b, r, c, n) {
  for (let i = 0; i < 9; i++) {
    if (b[r][i] === n || b[i][c] === n) return false
  }
  const br = Math.floor(r / 3) * 3
  const bc = Math.floor(c / 3) * 3
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (b[br + i][bc + j] === n) return false
    }
  }
  return true
}

function makePuzzle(sol, holes) {
  const p = sol.map(r => [...r])
  let count = 0
  let attempts = 0
  while (count < holes && attempts < 200) {
    const r = Math.floor(Math.random() * 9)
    const c = Math.floor(Math.random() * 9)
    if (p[r][c] !== 0) {
      p[r][c] = 0
      count++
    }
    attempts++
  }
  return p
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function selectCell(r, c) {
  selected.value = [r, c]
}

function inputNumber(n) {
  const [r, c] = selected.value
  if (r === null) {
    showToast('请先选择格子')
    return
  }
  const cell = board.value[r][c]
  if (cell.given) return
  cell.value = n
  cell.error = solution.value[r][c] !== n
}

function erase() {
  const [r, c] = selected.value
  if (r === null) return
  const cell = board.value[r][c]
  if (cell.given) return
  cell.value = 0
  cell.error = false
}

function checkBoard() {
  let correct = true
  board.value.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell.value === 0 || cell.value !== solution.value[r][c]) correct = false
    })
  })
  if (correct) showSuccess('全部正确，太棒了！')
  else showToast('还有错误或未填的格子')
}

function hint() {
  const [r, c] = selected.value
  if (r === null) {
    showToast('请先选择格子')
    return
  }
  const cell = board.value[r][c]
  if (cell.given) return
  cell.value = solution.value[r][c]
  cell.error = false
}

newGame()
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
  background: #F5F5F7;
  padding: 24rpx;
}
.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}
.board {
  border: 3rpx solid #1D1D1F;
  border-radius: 8rpx;
  overflow: hidden;
}
.row {
  display: flex;
  &--bottom { border-bottom: 3rpx solid #1D1D1F; }
}
.cell {
  flex: 1;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #007AFF;
  border-right: 1rpx solid #E5E5EA;
  border-bottom: 1rpx solid #E5E5EA;
  &:nth-child(9n) { border-right: none; }
  &--right { border-right: 3rpx solid #1D1D1F; }
  &--given { color: #1D1D1F; font-weight: 600; }
  &--selected { background: #E3F2FD; }
  &--same { background: #F5F5F7; }
  &--error { color: #FF3B30; }
  &:active { background: #E3F2FD; }
}
.keypad {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12rpx;
  margin-top: 24rpx;
}
.num-key {
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F5F7;
  border-radius: 12rpx;
  font-size: 32rpx;
  color: #1D1D1F;
  &:active { background: #E5E5EA; }
  &--erase { color: #FF3B30; font-size: 28rpx; }
}
.actions {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}
.action-btn {
  flex: 1;
  background: #1D1D1F;
  color: #fff;
  padding: 18rpx 0;
  border-radius: 12rpx;
  font-size: 28rpx;
  text-align: center;
  &:active { opacity: 0.8; }
}
</style>
