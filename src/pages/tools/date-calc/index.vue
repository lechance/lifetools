/**
 * 日期计算器
 * 功能：日期差计算 / 日期推算 / 第几天查询
 */
<template>
  <view class="dc">
    <!-- Tab 切换 -->
    <view class="dc__tabs">
      <view v-for="(t, i) in tabs" :key="i"
        class="dc__tab" :class="{ 'dc__tab--active': tab === i }"
        @tap="tab = i">{{ t }}</view>
    </view>

    <!-- ========== Tab 0: 日期差计算 ========== -->
    <view v-show="tab === 0" class="dc__body">
      <view class="card">
        <view class="dc__field">
          <text class="dc__label">开始日期</text>
          <picker mode="date" :value="diffStart" @change="e => diffStart = e.detail.value">
            <view class="dc__picker">{{ diffStart }}</view>
          </picker>
        </view>
        <view class="dc__field">
          <text class="dc__label">结束日期</text>
          <picker mode="date" :value="diffEnd" @change="e => diffEnd = e.detail.value">
            <view class="dc__picker">{{ diffEnd }}</view>
          </picker>
        </view>
        <view class="dc__field">
          <text class="dc__label">包含结束日</text>
          <switch :checked="diffInclusive" color="#1D1D1F" @change="diffInclusive = !diffInclusive" />
        </view>
      </view>

      <view class="card dc__result-card">
        <view class="dc__result-row">
          <text class="dc__result-label">相差天数</text>
          <text class="dc__result-value dc__result-value--hl">{{ diffResult.days }} 天</text>
        </view>
        <view class="dc__result-row">
          <text class="dc__result-label">相差月数</text>
          <text class="dc__result-value">{{ diffResult.months }} 个月</text>
        </view>
        <view class="dc__result-row">
          <text class="dc__result-label">相差年数</text>
          <text class="dc__result-value">{{ diffResult.years }} 年</text>
        </view>
        <view class="dc__result-row dc__result-row--sub">
          <text class="dc__result-label">总周数</text>
          <text class="dc__result-value">{{ diffResult.weeks }} 周</text>
        </view>
        <view class="dc__result-row dc__result-row--sub">
          <text class="dc__result-label">总小时数</text>
          <text class="dc__result-value">{{ diffResult.hours }} 小时</text>
        </view>
        <view class="dc__result-row dc__result-row--sub">
          <text class="dc__result-label">总分钟数</text>
          <text class="dc__result-value">{{ diffResult.minutes }} 分钟</text>
        </view>
      </view>
    </view>

    <!-- ========== Tab 1: 日期推算 ========== -->
    <view v-show="tab === 1" class="dc__body">
      <view class="card">
        <view class="dc__field">
          <text class="dc__label">起始日期</text>
          <picker mode="date" :value="addStart" @change="e => addStart = e.detail.value">
            <view class="dc__picker">{{ addStart }}</view>
          </picker>
        </view>
        <view class="dc__field">
          <text class="dc__label">偏移量</text>
          <view class="dc__offset-row">
            <input class="dc__input" type="number" v-model="addNum" placeholder="输入数字" />
            <picker :value="addUnitIdx" :range="addUnits" @change="e => addUnitIdx = Number(e.detail.value)">
              <view class="dc__picker dc__picker--sm">{{ addUnits[addUnitIdx] }}</view>
            </picker>
          </view>
        </view>
        <button class="dc__btn" @tap="calcAdd">推算</button>
      </view>

      <view v-if="addResult" class="card dc__result-card">
        <view class="dc__result-row">
          <text class="dc__result-label">目标日期</text>
          <text class="dc__result-value dc__result-value--hl">{{ addResult }}</text>
        </view>
        <view class="dc__result-row dc__result-row--sub">
          <text class="dc__result-label">星期</text>
          <text class="dc__result-value">{{ addWeekday }}</text>
        </view>
      </view>
    </view>

    <!-- ========== Tab 2: 第几天 ========== -->
    <view v-show="tab === 2" class="dc__body">
      <view class="card">
        <view class="dc__field">
          <text class="dc__label">选择日期</text>
          <picker mode="date" :value="doyDate" @change="e => { doyDate = e.detail.value; calcDOY() }">
            <view class="dc__picker">{{ doyDate }}</view>
          </picker>
        </view>
      </view>

      <view class="card dc__result-card">
        <view class="dc__result-row">
          <text class="dc__result-label">当年第几天</text>
          <text class="dc__result-value dc__result-value--hl">{{ doyResult.dayOfYear }} 天</text>
        </view>
        <view class="dc__result-row">
          <text class="dc__result-label">当年第几周</text>
          <text class="dc__result-value">{{ doyResult.weekOfYear }} 周</text>
        </view>
        <view class="dc__result-row">
          <text class="dc__result-label">星期</text>
          <text class="dc__result-value">{{ doyResult.weekday }}</text>
        </view>
        <view class="dc__result-row dc__result-row--sub">
          <text class="dc__result-label">本季度第几天</text>
          <text class="dc__result-value">{{ doyResult.dayOfQuarter }} 天</text>
        </view>
        <view class="dc__result-row dc__result-row--sub">
          <text class="dc__result-label">距离年末</text>
          <text class="dc__result-value">{{ doyResult.daysToYearEnd }} 天</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

// ============================
// Tab
// ============================
const tabs = ['日期差', '日期推算', '第几天']
const tab = ref(0)

// ============================
// Tab 0: 日期差计算
// ============================
const diffStart = ref('2024-01-01')
const diffEnd = ref(new Date().toISOString().slice(0, 10))
const diffInclusive = ref(false)

const diffResult = computed(() => {
  const d1 = new Date(diffStart.value)
  const d2 = new Date(diffEnd.value)
  let ms = d2.getTime() - d1.getTime()
  if (diffInclusive.value) ms += 86400000

  if (ms < 0) return { days: 0, months: 0, years: 0, weeks: 0, hours: 0, minutes: 0 }

  const totalDays = Math.floor(ms / 86400000)
  const totalWeeks = Math.floor(totalDays / 7)
  const totalHours = Math.floor(ms / 3600000)
  const totalMinutes = Math.floor(ms / 60000)

  // 实际年月计算
  let y1 = d1.getFullYear(), m1 = d1.getMonth(), day1 = d1.getDate()
  let y2 = d2.getFullYear(), m2 = d2.getMonth(), day2 = d2.getDate()
  let years = y2 - y1
  let months = m2 - m1
  let days = day2 - day1

  if (diffInclusive.value) days += 1

  if (days < 0) {
    months -= 1
    const prevMonthLastDay = new Date(y2, m2, 0).getDate()
    days += prevMonthLastDay
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  return { days, months, years, weeks: totalWeeks, hours: totalHours, minutes: totalMinutes }
})

// ============================
// Tab 1: 日期推算
// ============================
const addStart = ref(new Date().toISOString().slice(0, 10))
const addNum = ref('30')
const addUnitIdx = ref(0)
const addUnits = ['天', '月', '年']
const addResult = ref('')
const addWeekday = ref('')

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function calcAdd() {
  const d = new Date(addStart.value)
  const num = parseInt(addNum.value) || 0
  const unit = addUnits[addUnitIdx.value]

  if (unit === '天') d.setDate(d.getDate() + num)
  else if (unit === '月') d.setMonth(d.getMonth() + num)
  else if (unit === '年') d.setFullYear(d.getFullYear() + num)

  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  addResult.value = `${y}-${m}-${day}`
  addWeekday.value = WEEKDAYS[d.getDay()]
}

// ============================
// Tab 2: 第几天
// ============================
const doyDate = ref(new Date().toISOString().slice(0, 10))
const doyResult = ref({ dayOfYear: 0, weekOfYear: 0, weekday: '', dayOfQuarter: 0, daysToYearEnd: 0 })

function calcDOY() {
  const d = new Date(doyDate.value)
  const year = d.getFullYear()
  const month = d.getMonth()
  const day = d.getDate()

  // day of year
  const startOfYear = new Date(year, 0, 0)
  const dayOfYear = Math.floor((d.getTime() - startOfYear.getTime()) / 86400000)

  // week of year (ISO)
  const temp = new Date(d)
  temp.setHours(0, 0, 0, 0)
  const thursday = new Date(temp)
  thursday.setDate(temp.getDate() + 3 - ((temp.getDay() + 6) % 7))
  const week1 = new Date(thursday.getFullYear(), 0, 4)
  const weekOfYear = 1 + Math.round(((thursday.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)

  // day of quarter
  const quarterStartMonth = Math.floor(month / 3) * 3
  const quarterStart = new Date(year, quarterStartMonth, 1)
  const dayOfQuarter = Math.floor((d.getTime() - quarterStart.getTime()) / 86400000) + 1

  // days to year end
  const yearEnd = new Date(year, 11, 31)
  const daysToYearEnd = Math.floor((yearEnd.getTime() - d.getTime()) / 86400000)

  doyResult.value = {
    dayOfYear,
    weekOfYear: weekOfYear < 0 ? 0 : weekOfYear,
    weekday: WEEKDAYS[d.getDay()],
    dayOfQuarter,
    daysToYearEnd
  }
}

// 初始化算一次
calcDOY()
</script>

<style lang="scss" scoped>
.dc {
  min-height: 100vh;
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

  // ====== Field ======
  &__field {
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

  // ====== Picker ======
  &__picker {
    font-size: 28rpx;
    color: #007AFF;
    padding: 8rpx 20rpx;
    background: #F5F5F7;
    border-radius: 12rpx;
    min-width: 180rpx;
    text-align: center;
    &--sm { min-width: 100rpx; }
  }

  // ====== Offset Row ======
  &__offset-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  // ====== Input ======
  &__input {
    background: #F5F5F7;
    border-radius: 12rpx;
    padding: 8rpx 20rpx;
    font-size: 28rpx;
    color: #1D1D1F;
    width: 120rpx;
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
  }

  // ====== Result Card ======
  &__result-card {
    margin-top: 16rpx;
  }
  &__result-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12rpx 0;
    &--sub {
      padding: 8rpx 0;
      .dc__result-label { font-size: 24rpx; color: #86868B; }
      .dc__result-value { font-size: 24rpx; color: #86868B; }
    }
  }
  &__result-label {
    font-size: 28rpx;
    color: #86868B;
  }
  &__result-value {
    font-size: 28rpx;
    color: #1D1D1F;
    font-weight: 500;
    font-family: monospace;
    &--hl {
      font-size: 40rpx;
      color: #1D1D1F;
      font-weight: 700;
    }
  }
}
</style>
