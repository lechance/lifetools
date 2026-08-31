/**
 * 随机数生成器
 * 功能：范围随机 / 不重复多组 / 抽奖模式
 */
<template>
  <view class="rd">
    <!-- Tab 切换 -->
    <view class="rd__tabs">
      <view v-for="(t, i) in tabs" :key="i"
        class="rd__tab" :class="{ 'rd__tab--active': tab === i }"
        @tap="switchTab(i)">{{ t }}</view>
    </view>

    <!-- ========== Tab 0: 范围随机 ========== -->
    <view v-show="tab === 0" class="rd__body">
      <view class="card">
        <view class="rd__row">
          <text class="rd__label">最小值</text>
          <input class="rd__input" type="number" v-model="rMin" @input="clearRangeResult" />
        </view>
        <view class="rd__row">
          <text class="rd__label">最大值</text>
          <input class="rd__input" type="number" v-model="rMax" @input="clearRangeResult" />
        </view>
        <view class="rd__row">
          <text class="rd__label">小数位</text>
          <input class="rd__input" type="number" v-model="rDec" />
        </view>
        <button class="rd__btn" @tap="genRange">生成</button>
      </view>

      <view v-if="rangeResult !== null" class="card rd__result-card">
        <text class="rd__big-result">{{ rangeResult }}</text>
        <view class="rd__actions">
          <text class="rd__action" @tap="copyResult(rangeResult)">复制</text>
          <text class="rd__action rd__action--danger" @tap="rangeResult = null">清除</text>
        </view>
      </view>
    </view>

    <!-- ========== Tab 1: 不重复多组 ========== -->
    <view v-show="tab === 1" class="rd__body">
      <view class="card">
        <view class="rd__row">
          <text class="rd__label">生成数量</text>
          <input class="rd__input" type="number" v-model="uCount" />
        </view>
        <view class="rd__row">
          <text class="rd__label">范围最小值</text>
          <input class="rd__input" type="number" v-model="uMin" />
        </view>
        <view class="rd__row">
          <text class="rd__label">范围最大值</text>
          <input class="rd__input" type="number" v-model="uMax" />
        </view>
        <button class="rd__btn" @tap="genUnique">生成</button>
      </view>

      <view v-if="uniqueList.length" class="card rd__result-card">
        <view class="rd__chip-list">
          <text v-for="(n, i) in uniqueList" :key="i" class="rd__chip">{{ n }}</text>
        </view>
        <view class="rd__actions">
          <text class="rd__action" @tap="copyResult(uniqueList.join(', '))">复制列表</text>
          <text class="rd__action rd__action--danger" @tap="uniqueList = []">清除</text>
        </view>
      </view>
    </view>

    <!-- ========== Tab 2: 抽奖模式 ========== -->
    <view v-show="tab === 2" class="rd__body">
      <view class="card">
        <view class="rd__row">
          <text class="rd__label">最小值</text>
          <input class="rd__input" type="number" v-model="lMin" />
        </view>
        <view class="rd__row">
          <text class="rd__label">最大值</text>
          <input class="rd__input" type="number" v-model="lMax" />
        </view>
      </view>

      <view class="card rd__lottery-card">
        <view class="rd__lottery-display" :class="{ 'rd__lottery-display--rolling': lRolling }">
          <text class="rd__lottery-num">{{ lDisplay }}</text>
        </view>
        <button class="rd__btn" :class="{ 'rd__btn--disabled': lRolling }"
          @tap="lRolling ? null : startLottery">
          {{ lRolling ? '抽奖中...' : (lFinished ? '再抽一次' : '开始抽奖') }}
        </button>
      </view>

      <view v-if="lFinished && !lRolling" class="card rd__result-card">
        <text class="rd__big-result rd__big-result--lottery">{{ lResult }}</text>
        <view class="rd__actions">
          <text class="rd__action" @tap="copyResult(lResult)">复制</text>
        </view>
      </view>
    </view>

    <!-- ========== 历史记录 ========== -->
    <view v-if="history.length > 0" class="rd__history">
      <view class="rd__history-header">
        <text class="rd__history-title">历史记录</text>
        <text class="rd__history-clear" @tap="history = []">清空</text>
      </view>
      <view class="card">
        <view v-for="(item, i) in history" :key="i" class="rd__history-item"
          @tap="copyResult(item.val)">
          <text class="rd__history-label">{{ item.label }}</text>
          <text class="rd__history-val">{{ item.val }}</text>
        </view>
      </view>
    </view>

    <!-- toast -->
    <view v-if="toast" class="rd__toast">{{ toast }}</view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

// ============================
// Tab
// ============================
const tabs = ['范围随机', '不重复多组', '抽奖模式']
const tab = ref(0)

function switchTab(i) {
  tab.value = i
  stopLottery()
}

// ============================
// Toast
// ============================
const toast = ref('')
let toastTimer = null
function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 2000)
}

// ============================
// 复制
// ============================
function copyResult(val) {
  uni.setClipboardData({
    data: String(val),
    success: () => showToast('已复制')
  })
}

// ============================
// 历史记录
// ============================
const history = ref([])
function addHistory(label, val) {
  history.value.unshift({ label, val, time: Date.now() })
  if (history.value.length > 20) history.value = history.value.slice(0, 20)
}

// ============================
// Tab 0: 范围随机
// ============================
const rMin = ref('1')
const rMax = ref('100')
const rDec = ref('0')
const rangeResult = ref(null)

function clearRangeResult() { rangeResult.value = null }

function genRange() {
  const min = parseFloat(rMin.value) || 0
  const max = parseFloat(rMax.value) || 100
  const dec = Math.max(0, parseInt(rDec.value) || 0)
  if (min > max) { showToast('最大值需大于等于最小值'); return }

  // 闭区间 [min, max]，按小数精度放大为整数后随机，保证上界可取
  const factor = Math.pow(10, dec)
  const scaledMin = min * factor
  const scaledMax = max * factor
  const scaled = Math.floor(Math.random() * (scaledMax - scaledMin + 1)) + scaledMin
  const val = scaled / factor
  const display = dec > 0 ? val.toFixed(dec) : String(val)
  rangeResult.value = display
  addHistory(`范围 ${rMin.value}~${rMax.value}`, display)
}

// ============================
// Tab 1: 不重复多组
// ============================
const uCount = ref('5')
const uMin = ref('1')
const uMax = ref('50')
const uniqueList = ref([])

function genUnique() {
  const count = parseInt(uCount.value) || 1
  const min = parseInt(uMin.value) || 1
  const max = parseInt(uMax.value) || 50
  if (min >= max) { showToast('最大值需大于最小值'); return }
  if (count > max - min + 1) { showToast('数量超过范围总数'); return }

  const pool = []
  for (let i = min; i <= max; i++) pool.push(i)

  const result = []
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool[idx])
    pool.splice(idx, 1)
  }

  result.sort((a, b) => a - b)
  uniqueList.value = result
  addHistory(`不重复 ${count}个(${min}~${max})`, result.join(', '))
}

// ============================
// Tab 2: 抽奖模式
// ============================
const lMin = ref('1')
const lMax = ref('100')
const lDisplay = ref('?')
const lResult = ref('')
const lRolling = ref(false)
const lFinished = ref(false)
let lotteryTimer = null

function stopLottery() {
  if (lotteryTimer) {
    clearInterval(lotteryTimer)
    lotteryTimer = null
  }
  lRolling.value = false
}

function startLottery() {
  const min = parseInt(lMin.value) || 1
  const max = parseInt(lMax.value) || 100
  if (min >= max) { showToast('最大值需大于最小值'); return }

  stopLottery()
  lRolling.value = true
  lFinished.value = false
  lDisplay.value = '?'

  // 快速滚动阶段：变换数字
  let ticks = 0
  const totalTicks = 20 + Math.floor(Math.random() * 10) // 20-29 ticks
  const finalVal = Math.floor(Math.random() * (max - min + 1)) + min

  lotteryTimer = setInterval(() => {
    ticks++
    const fake = Math.floor(Math.random() * (max - min + 1)) + min
    lDisplay.value = String(fake)

    if (ticks >= totalTicks) {
      clearInterval(lotteryTimer)
      lotteryTimer = null
      lRolling.value = false
      lFinished.value = true
      lDisplay.value = String(finalVal)
      lResult.value = String(finalVal)
      addHistory(`抽奖 (${lMin.value}~${lMax.value})`, String(finalVal))
    }
  }, 80)
}

// 组件卸载时清理
import { onUnmounted } from 'vue'
onUnmounted(() => {
  stopLottery()
  clearTimeout(toastTimer)
})
</script>

<style lang="scss" scoped>
.rd {
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
  background: #F5F5F7;
  padding-bottom: 40rpx;

  // ====== Tabs ======
  &__tabs {
    display: flex;
    background: #fff;
    padding: 0 24rpx;
    border-bottom: 1rpx solid #E5E5EA;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  &__tab {
    flex: 1;
    text-align: center;
    font-size: 28rpx;
    color: #86868B;
    padding: 24rpx 0 20rpx;
    border-bottom: 3rpx solid transparent;
    transition: all 0.2s;
    &:active { opacity: 0.6; }
    &--active {
      color: #1D1D1F;
      font-weight: 600;
      border-bottom-color: #1D1D1F;
    }
  }

  // ====== Body ======
  &__body {
    padding: 24rpx;
  }

  // ====== Row ======
  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16rpx 0;
    &:not(:last-child) { border-bottom: 1rpx solid #F5F5F7; }
  }
  &__label {
    font-size: 28rpx;
    color: #1D1D1F;
  }

  // ====== Input ======
  &__input {
    background: #F5F5F7;
    border-radius: 12rpx;
    padding: 8rpx 20rpx;
    font-size: 28rpx;
    color: #1D1D1F;
    width: 160rpx;
    text-align: center;
  }

  // ====== Button ======
  &__btn {
    width: 100%;
    margin-top: 24rpx;
    background: #1D1D1F;
    color: #fff;
    border: none;
    border-radius: 16rpx;
    padding: 20rpx 0;
    font-size: 30rpx;
    text-align: center;
    &:active { opacity: 0.8; }
    &--disabled {
      background: #C7C7CC;
      &:active { opacity: 1; }
    }
  }

  // ====== Big Result ======
  &__result-card {
    margin-top: 16rpx;
    text-align: center;
  }
  &__big-result {
    display: block;
    font-size: 80rpx;
    font-weight: 700;
    color: #1D1D1F;
    font-family: monospace;
    padding: 40rpx 0 20rpx;
    letter-spacing: 4rpx;
    &--lottery {
      font-size: 100rpx;
      color: #FF9500;
    }
  }

  // ====== Actions ======
  &__actions {
    display: flex;
    justify-content: center;
    gap: 40rpx;
    padding: 16rpx 0 8rpx;
    border-top: 1rpx solid #F5F5F7;
  }
  &__action {
    font-size: 26rpx;
    color: #007AFF;
    padding: 8rpx 24rpx;
    &:active { opacity: 0.6; }
    &--danger { color: #FF3B30; }
  }

  // ====== Chip List ======
  &__chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    padding: 24rpx 0 16rpx;
    justify-content: center;
  }
  &__chip {
    background: #F5F5F7;
    color: #1D1D1F;
    font-size: 28rpx;
    font-family: monospace;
    padding: 8rpx 24rpx;
    border-radius: 12rpx;
    font-weight: 500;
  }

  // ====== Lottery ======
  &__lottery-card {
    text-align: center;
  }
  &__lottery-display {
    background: #F5F5F7;
    border-radius: 24rpx;
    padding: 60rpx 0;
    margin-bottom: 8rpx;
    transition: background 0.1s;
    &--rolling {
      background: #1D1D1F;
      .rd__lottery-num { color: #FF9500; }
    }
  }
  &__lottery-num {
    font-size: 120rpx;
    font-weight: 700;
    font-family: monospace;
    color: #1D1D1F;
    letter-spacing: 8rpx;
  }

  // ====== History ======
  &__history {
    padding: 0 24rpx;
    margin-top: 16rpx;
  }
  &__history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12rpx;
  }
  &__history-title {
    font-size: 26rpx;
    color: #86868B;
    font-weight: 500;
  }
  &__history-clear {
    font-size: 24rpx;
    color: #FF3B30;
    &:active { opacity: 0.6; }
  }
  &__history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12rpx 0;
    &:not(:last-child) { border-bottom: 1rpx solid #F5F5F7; }
    &:active { opacity: 0.6; }
  }
  &__history-label {
    font-size: 24rpx;
    color: #86868B;
    flex: 1;
  }
  &__history-val {
    font-size: 28rpx;
    color: #1D1D1F;
    font-family: monospace;
    font-weight: 500;
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
    animation: rdFadeIn 0.2s both;
  }
}

@keyframes rdFadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(20rpx); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>
