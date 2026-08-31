/**
 * 安全期计算 - 基于日历法的经期周期计算工具
 * 输入上次月经日期、周期天数、经期天数，可视化展示各阶段
 */
<template>
  <view class="safe">
    <!-- ====== 输入区域 ====== -->
    <view class="safe__section">
      <view class="safe__section-title">输入信息</view>

      <!-- 上次月经日期 -->
      <view class="safe__field">
        <text class="safe__label">上次月经日期</text>
        <picker
          mode="date"
          :value="lastPeriodDate"
          @change="onDateChange"
          class="safe__picker"
        >
          <view class="safe__picker-value">
            <text>{{ lastPeriodDate || '请选择日期' }}</text>
            <text class="safe__arrow">›</text>
          </view>
        </picker>
      </view>

      <!-- 周期天数 -->
      <view class="safe__field">
        <text class="safe__label">周期天数</text>
        <view class="safe__input-group">
          <view class="safe__stepper" @tap="adjustCycle(-1)">−</view>
          <input
            v-model="cycleDays"
            type="number"
            class="safe__input"
            @blur="validateCycle"
          />
          <view class="safe__stepper" @tap="adjustCycle(1)">+</view>
          <text class="safe__unit">天</text>
        </view>
      </view>

      <!-- 经期天数 -->
      <view class="safe__field">
        <text class="safe__label">经期天数</text>
        <view class="safe__input-group">
          <view class="safe__stepper" @tap="adjustPeriod(-1)">−</view>
          <input
            v-model="periodDays"
            type="number"
            class="safe__input"
            @blur="validatePeriod"
          />
          <view class="safe__stepper" @tap="adjustPeriod(1)">+</view>
          <text class="safe__unit">天</text>
        </view>
      </view>

      <view class="safe__calc-btn" @tap="calculate">计算安全期</view>
    </view>

    <!-- ====== 结果区域 ====== -->
    <view v-if="calculated" class="safe__section">
      <view class="safe__section-title">计算结果</view>

      <!-- 关键日期 -->
      <view class="safe__key-dates">
        <view class="safe__key-item">
          <text class="safe__key-label">排卵日</text>
          <text class="safe__key-value safe__date--ovulation">{{ result.ovulationDay }}</text>
        </view>
        <view class="safe__key-item">
          <text class="safe__key-label">排卵期</text>
          <text class="safe__key-value">{{ result.ovulationStart }} ~ {{ result.ovulationEnd }}</text>
        </view>
        <view class="safe__key-item">
          <text class="safe__key-label">下次月经</text>
          <text class="safe__key-value safe__date--period">{{ result.nextPeriod }}</text>
        </view>
      </view>

      <!-- 日历视图 -->
      <view class="safe__calendar">
        <view class="safe__cal-header">
          <text class="safe__cal-title">周期日历</text>
          <text class="safe__cal-subtitle">{{ result.monthLabel }}</text>
        </view>

        <!-- 图例 -->
        <view class="safe__legend">
          <view class="safe__legend-item">
            <view class="safe__legend-dot safe__dot--period" />
            <text>月经期</text>
          </view>
          <view class="safe__legend-item">
            <view class="safe__legend-dot safe__dot--ovulation" />
            <text>排卵期</text>
          </view>
          <view class="safe__legend-item">
            <view class="safe__legend-dot safe__dot--safe" />
            <text>安全期</text>
          </view>
        </view>

        <!-- 星期头 -->
        <view class="safe__weekdays">
          <view v-for="w in weekDays" :key="w" class="safe__weekday">{{ w }}</view>
        </view>

        <!-- 日期网格 -->
        <view class="safe__days">
          <!-- 空白占位 -->
          <view
            v-for="i in result.startWeekday"
            :key="'empty_' + i"
            class="safe__day safe__day--empty"
          />
          <!-- 实际日期 -->
          <view
            v-for="(d, idx) in result.days"
            :key="idx"
            :class="[
              'safe__day',
              `safe__day--${d.type}`,
              { 'safe__day--today': d.isToday }
            ]"
          >
            <text class="safe__day-num">{{ d.day }}</text>
            <text v-if="d.isOvulationDay" class="safe__day-tag">排</text>
            <text v-if="d.isPeriodStart" class="safe__day-tag">始</text>
          </view>
        </view>
      </view>

      <!-- 阶段时间线 -->
      <view class="safe__timeline">
        <view class="safe__tl-header">各阶段预计日期</view>

        <view class="safe__tl-item safe__tl--period">
          <view class="safe__tl-icon">🔴</view>
          <view class="safe__tl-info">
            <text class="safe__tl-title">月经期</text>
            <text class="safe__tl-dates">{{ result.periodStart }} ~ {{ result.periodEnd }}</text>
            <text class="safe__tl-desc">{{ periodDays }}天</text>
          </view>
        </view>

        <view class="safe__tl-item safe__tl--safe">
          <view class="safe__tl-icon">🟢</view>
          <view class="safe__tl-info">
            <text class="safe__tl-title">安全期（排卵前）</text>
            <text class="safe__tl-dates">{{ result.safePreStart }} ~ {{ result.safePreEnd }}</text>
          </view>
        </view>

        <view class="safe__tl-item safe__tl--ovulation">
          <view class="safe__tl-icon">🟡</view>
          <view class="safe__tl-info">
            <text class="safe__tl-title">排卵期</text>
            <text class="safe__tl-dates">{{ result.ovulationStart }} ~ {{ result.ovulationEnd }}</text>
          </view>
        </view>

        <view class="safe__tl-item safe__tl--ovulation-day">
          <view class="safe__tl-icon">🔶</view>
          <view class="safe__tl-info">
            <text class="safe__tl-title">排卵日</text>
            <text class="safe__tl-dates">{{ result.ovulationDay }}</text>
          </view>
        </view>

        <view class="safe__tl-item safe__tl--safe">
          <view class="safe__tl-icon">🟢</view>
          <view class="safe__tl-info">
            <text class="safe__tl-title">安全期（排卵后）</text>
            <text class="safe__tl-dates">{{ result.safePostStart }} ~ {{ result.safePostEnd }}</text>
          </view>
        </view>

        <view class="safe__tl-item safe__tl--period">
          <view class="safe__tl-icon">🔴</view>
          <view class="safe__tl-info">
            <text class="safe__tl-title">下次月经期</text>
            <text class="safe__tl-dates">{{ result.nextPeriod }}</text>
            <text class="safe__tl-desc">预计日期</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 未计算提示 -->
    <view v-if="!calculated" class="safe__hint">
      <text class="safe__hint-icon">📊</text>
      <text class="safe__hint-text">请输入上次月经日期和周期信息，点击"计算安全期"查看结果</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

// ==================================================================
//  常量
// ==================================================================
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// ==================================================================
//  状态
// ==================================================================
const lastPeriodDate = ref('')
const cycleDays = ref(28)
const periodDays = ref(5)
const calculated = ref(false)
const result = ref({
  ovulationDay: '',
  ovulationStart: '',
  ovulationEnd: '',
  nextPeriod: '',
  periodStart: '',
  periodEnd: '',
  safePreStart: '',
  safePreEnd: '',
  safePostStart: '',
  safePostEnd: '',
  monthLabel: '',
  startWeekday: 0,
  days: [],
  today: ''
})

// ==================================================================
//  输入控制
// ==================================================================
const now = new Date()
const todayStr = formatDate(now)

// 初始化最近一个月的日期作为默认值
function initDefaultDate() {
  const d = new Date()
  d.setDate(d.getDate() - 14) // 假设上次月经在14天前
  lastPeriodDate.value = formatDate(d)
}

initDefaultDate()

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDate(str) {
  const parts = str.split('-')
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDateCN(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

function onDateChange(e) {
  lastPeriodDate.value = e.detail.value
}

function adjustCycle(delta) {
  let v = parseInt(cycleDays.value) || 28
  v = Math.max(21, Math.min(45, v + delta))
  cycleDays.value = v
}

function adjustPeriod(delta) {
  let v = parseInt(periodDays.value) || 5
  v = Math.max(2, Math.min(10, v + delta))
  periodDays.value = v
}

function validateCycle() {
  let v = parseInt(cycleDays.value) || 28
  v = Math.max(21, Math.min(45, v))
  cycleDays.value = v
}

function validatePeriod() {
  let v = parseInt(periodDays.value) || 5
  v = Math.max(2, Math.min(10, v))
  periodDays.value = v
}

// ==================================================================
//  核心计算
// ==================================================================
function calculate() {
  if (!lastPeriodDate.value) {
    uni.showToast({ title: '请选择上次月经日期', icon: 'none' })
    return
  }

  const lastDate = parseDate(lastPeriodDate.value)
  const cycle = parseInt(cycleDays.value) || 28
  const period = parseInt(periodDays.value) || 5

  // 排卵日 = 下次月经前14天
  const nextPeriodDate = addDays(lastDate, cycle)
  const ovulationDate = addDays(nextPeriodDate, -14)

  // 排卵期 = 排卵日前5天 + 后4天（共10天，含排卵日）
  const ovulationStart = addDays(ovulationDate, -5)
  const ovulationEnd = addDays(ovulationDate, 4)

  // 月经期
  const periodEnd = addDays(lastDate, period - 1)

  // 安全期（排卵前）：月经结束后 ~ 排卵期开始前
  const safePreStart = addDays(periodEnd, 1)
  const safePreEnd = addDays(ovulationStart, -1)

  // 安全期（排卵后）：排卵期结束后 ~ 下次月经前
  const safePostStart = addDays(ovulationEnd, 1)
  const safePostEnd = addDays(nextPeriodDate, -1)

  // 构建日历数据（显示从上次月经开始的35天）
  const calStart = new Date(lastDate)
  const startWeekday = calStart.getDay()
  const calDays = []

  const today = new Date()
  const todayStr2 = formatDate(today)

  for (let i = 0; i < 35; i++) {
    const d = addDays(calStart, i)
    const dStr = formatDate(d)
    const dayNum = d.getDate()

    let type = 'normal'
    let isOvulationDay = false
    let isPeriodStart = false

    // 判断月经期
    if (dStr >= formatDate(lastDate) && dStr <= formatDate(periodEnd)) {
      type = 'period'
      if (dStr === formatDate(lastDate)) isPeriodStart = true
    }
    // 判断排卵期
    else if (dStr >= formatDate(ovulationStart) && dStr <= formatDate(ovulationEnd)) {
      type = 'ovulation'
      if (dStr === formatDate(ovulationDate)) isOvulationDay = true
    }
    // 判断安全期
    else if (dStr >= formatDate(safePreStart) && dStr <= formatDate(safePreEnd)) {
      type = 'safe'
    }
    else if (dStr >= formatDate(safePostStart) && dStr <= formatDate(safePostEnd)) {
      type = 'safe'
    }
    // 下次月经
    else if (dStr >= formatDate(nextPeriodDate) && dStr < formatDate(addDays(nextPeriodDate, period))) {
      type = 'period'
      if (dStr === formatDate(nextPeriodDate)) isPeriodStart = true
    }

    calDays.push({
      day: dayNum,
      date: dStr,
      isToday: dStr === todayStr2,
      type,
      isOvulationDay,
      isPeriodStart
    })
  }

  // 生成月份标签
  const monthLabel = `${calStart.getFullYear()}年${calStart.getMonth() + 1}月 ~ ${addDays(calStart, 34).getMonth() + 1}月`

  result.value = {
    ovulationDay: formatDateCN(ovulationDate),
    ovulationStart: formatDateCN(ovulationStart),
    ovulationEnd: formatDateCN(ovulationEnd),
    nextPeriod: formatDateCN(nextPeriodDate),
    periodStart: formatDateCN(lastDate),
    periodEnd: formatDateCN(periodEnd),
    safePreStart: formatDateCN(safePreStart),
    safePreEnd: formatDateCN(safePreEnd),
    safePostStart: formatDateCN(safePostStart),
    safePostEnd: formatDateCN(safePostEnd),
    monthLabel,
    startWeekday,
    days: calDays,
    today: todayStr2
  }

  calculated.value = true
}

// 默认自动计算一次
calculate()
</script>

<style lang="scss" scoped>
.safe {
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
  background: #F5F5F7;
  padding: 24rpx;

  // ====== 区块 ======
  &__section {
    background: #FFFFFF;
    border-radius: 16rpx;
    padding: 28rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  }
  &__section-title {
    font-size: 32rpx;
    font-weight: 700;
    color: #1D1D1F;
    margin-bottom: 24rpx;
    padding-bottom: 16rpx;
    border-bottom: 2rpx solid #F5F5F7;
  }

  // ====== 字段 ======
  &__field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16rpx 0;
    border-bottom: 1rpx solid #F5F5F7;

    &:last-child {
      border-bottom: none;
    }
  }
  &__label {
    font-size: 28rpx;
    color: #1D1D1F;
    font-weight: 500;
  }

  // ---- 日期选择器 ----
  &__picker {
    flex: 1;
    text-align: right;
  }
  &__picker-value {
    display: inline-flex;
    align-items: center;
    gap: 8rpx;
    font-size: 28rpx;
    color: #007AFF;
  }
  &__arrow {
    font-size: 32rpx;
    color: #C7C7CC;
    font-weight: 300;
  }

  // ---- 数字输入（步进器） ----
  &__input-group {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }
  &__stepper {
    width: 52rpx;
    height: 52rpx;
    border-radius: 50%;
    background: #F5F5F7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;
    color: #1D1D1F;
    font-weight: 600;

    &:active {
      background: #E5E5EA;
    }
  }
  &__input {
    width: 72rpx;
    text-align: center;
    font-size: 32rpx;
    font-weight: 600;
    color: #1D1D1F;
    padding: 8rpx 0;
    border: 2rpx solid #E5E5EA;
    border-radius: 8rpx;
  }
  &__unit {
    font-size: 26rpx;
    color: #86868B;
  }

  // ---- 计算按钮 ----
  &__calc-btn {
    background: #1D1D1F;
    color: #FFFFFF;
    text-align: center;
    padding: 24rpx 0;
    border-radius: 12rpx;
    font-size: 30rpx;
    font-weight: 600;
    margin-top: 24rpx;

    &:active {
      opacity: 0.85;
    }
  }

  // ====== 关键日期 ======
  &__key-dates {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    margin-bottom: 28rpx;
  }
  &__key-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12rpx 16rpx;
    background: #F5F5F7;
    border-radius: 10rpx;
  }
  &__key-label {
    font-size: 26rpx;
    color: #86868B;
  }
  &__key-value {
    font-size: 28rpx;
    font-weight: 600;
    color: #1D1D1F;
  }
  &__date--ovulation {
    color: #FF9500;
  }
  &__date--period {
    color: #FF3B30;
  }

  // ====== 日历 ======
  &__calendar {
    margin-bottom: 28rpx;
  }
  &__cal-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 16rpx;
  }
  &__cal-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #1D1D1F;
  }
  &__cal-subtitle {
    font-size: 24rpx;
    color: #86868B;
  }

  // ---- 图例 ----
  &__legend {
    display: flex;
    gap: 20rpx;
    margin-bottom: 16rpx;
    flex-wrap: wrap;
  }
  &__legend-item {
    display: flex;
    align-items: center;
    gap: 6rpx;
    font-size: 22rpx;
    color: #86868B;
  }
  &__legend-dot {
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
  }
  &__dot--period { background: #FF3B30; }
  &__dot--ovulation { background: #FF9500; }
  &__dot--safe { background: #34C759; }

  // ---- 星期 ----
  &__weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    margin-bottom: 8rpx;
  }
  &__weekday {
    text-align: center;
    font-size: 22rpx;
    color: #86868B;
    padding: 8rpx 0;
  }

  // ---- 日期网格 ----
  &__days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4rpx;
  }
  &__day {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 10rpx;
    position: relative;
    min-height: 72rpx;

    &--empty {
      visibility: hidden;
    }

    &--normal {
      color: #1D1D1F;
    }
    &--period {
      background: #FFE5E3;
      color: #FF3B30;
      font-weight: 600;
    }
    &--ovulation {
      background: #FFF3DC;
      color: #FF9500;
      font-weight: 600;
    }
    &--safe {
      background: #E8F8ED;
      color: #34C759;
      font-weight: 500;
    }
    &--today {
      box-shadow: 0 0 0 2rpx #1D1D1F;
    }
  }
  &__day-num {
    font-size: 26rpx;
    line-height: 1.2;
  }
  &__day-tag {
    font-size: 18rpx;
    font-weight: 700;
    line-height: 1;
    margin-top: 2rpx;
  }

  // ====== 时间线 ======
  &__timeline {
    border-top: 2rpx solid #F5F5F7;
    padding-top: 20rpx;
  }
  &__tl-header {
    font-size: 28rpx;
    font-weight: 600;
    color: #1D1D1F;
    margin-bottom: 20rpx;
  }
  &__tl-item {
    display: flex;
    align-items: flex-start;
    gap: 16rpx;
    padding: 16rpx 0;
    border-left: 3rpx solid transparent;
    padding-left: 20rpx;
    margin-left: 12rpx;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: -3rpx;
      top: 0;
      bottom: 0;
      width: 3rpx;
    }
  }
  &__tl--period::before { background: #FF3B30; }
  &__tl--ovulation::before { background: #FF9500; }
  &__tl--ovulation-day::before { background: #FF9500; }
  &__tl--safe::before { background: #34C759; }

  &__tl-icon {
    font-size: 32rpx;
    line-height: 1.3;
    flex-shrink: 0;
  }
  &__tl-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }
  &__tl-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #1D1D1F;
  }
  &__tl-dates {
    font-size: 26rpx;
    color: #515154;
  }
  &__tl-desc {
    font-size: 22rpx;
    color: #86868B;
  }

  // ====== 提示 ======
  &__hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 80rpx 40rpx;
    text-align: center;
  }
  &__hint-icon {
    font-size: 80rpx;
    margin-bottom: 24rpx;
  }
  &__hint-text {
    font-size: 26rpx;
    color: #86868B;
    line-height: 1.6;
  }
}
</style>
