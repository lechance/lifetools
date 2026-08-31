<template>
  <view class="page">
    <view class="card">
      <view class="cal-header">
        <view class="nav-btn" @tap="prevMonth">‹</view>
        <text class="cal-title">{{ year }}年{{ month + 1 }}月</text>
        <view class="nav-btn" @tap="nextMonth">›</view>
      </view>
      <view class="week-row">
        <text v-for="w in ['日','一','二','三','四','五','六']" :key="w" class="week-label">{{ w }}</text>
      </view>
      <view class="grid">
        <view v-for="(d, i) in cells" :key="i" class="cell"
          :class="{
            'cell--empty': !d,
            'cell--today': d === todayDay && isCurrentMonth,
            'cell--selected': d === selectedDay && isCurrentMonth,
            'cell--has-event': d && hasEvent(d)
          }"
          @tap="d ? selectDay(d) : null">
          <text class="cell-num">{{ d || '' }}</text>
          <view v-if="d && hasEvent(d)" class="cell-dot"></view>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="event-header">
        <text class="event-title">{{ selectedDate || '选择日期' }}</text>
        <view class="add-btn" @tap="showAdd = true">＋ 添加</view>
      </view>

      <view v-if="currentEvents.length === 0" class="event-empty">当天暂无日程</view>
      <view v-for="ev in currentEvents" :key="ev.id" class="event-item">
        <text class="event-time">{{ ev.time }}</text>
        <text class="event-text">{{ ev.text }}</text>
        <text class="event-del" @tap="removeEvent(ev.id)">✕</text>
      </view>

      <view v-if="showAdd" class="add-panel">
        <input class="event-input" v-model="newText" placeholder="日程内容" maxlength="50" />
        <picker mode="time" :value="newTime" @change="onNewTime">
          <view class="time-picker">{{ newTime }}</view>
        </picker>
        <view class="panel-actions">
          <view class="btn btn--ghost" @tap="showAdd = false">取消</view>
          <view class="btn btn--primary" @tap="saveEvent">保存</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { showToast } from '@/utils/helpers'

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth())
const selectedDay = ref(now.getDate())
const selectedDate = ref(formatKey(now.getFullYear(), now.getMonth(), now.getDate()))
const showAdd = ref(false)
const newText = ref('')
const newTime = ref('09:00')
const events = ref(loadEvents())

// 选中日期当天的日程数组（events 是「日期 → 事件数组」字典）
const currentEvents = computed(() => events.value[selectedDate.value] || [])

const isCurrentMonth = computed(() => {
  const t = new Date()
  return year.value === t.getFullYear() && month.value === t.getMonth()
})
const todayDay = new Date().getDate()
const todayKey = formatKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

const cells = computed(() => {
  const firstWeekday = new Date(year.value, month.value, 1).getDay()
  const days = new Date(year.value, month.value + 1, 0).getDate()
  const arr = []
  for (let i = 0; i < firstWeekday; i++) arr.push(null)
  for (let d = 1; d <= days; d++) arr.push(d)
  return arr
})

function formatKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function loadEvents() {
  try {
    return JSON.parse(uni.getStorageSync('lifetool_calendar') || '{}')
  } catch (e) {
    return {}
  }
}

function saveAll() {
  uni.setStorageSync('lifetool_calendar', JSON.stringify(events.value))
}

function hasEvent(d) {
  const key = formatKey(year.value, month.value, d)
  return (events.value[key] || []).length > 0
}

function selectDay(d) {
  selectedDay.value = d
  selectedDate.value = formatKey(year.value, month.value, d)
  showAdd.value = false
}

function prevMonth() {
  if (month.value === 0) { month.value = 11; year.value-- }
  else month.value--
  selectDay(1)
}
function nextMonth() {
  if (month.value === 11) { month.value = 0; year.value++ }
  else month.value++
  selectDay(1)
}

function onNewTime(e) {
  newTime.value = e.detail.value
}

function saveEvent() {
  const text = newText.value.trim()
  if (!text) { showToast('请输入日程内容'); return }
  if (!events.value[selectedDate.value]) events.value[selectedDate.value] = []
  events.value[selectedDate.value].push({ id: Date.now(), time: newTime.value, text })
  saveAll()
  newText.value = ''
  showAdd.value = false
}

function removeEvent(id) {
  events.value[selectedDate.value] = (events.value[selectedDate.value] || []).filter(e => e.id !== id)
  saveAll()
}
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
  margin-bottom: 24rpx;
}
.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20rpx;
}
.nav-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F5F7;
  border-radius: 50%;
  font-size: 40rpx;
  color: #1D1D1F;
  &:active { opacity: 0.7; }
}
.cal-title { font-size: 32rpx; font-weight: 600; color: #1D1D1F; }
.week-row {
  display: flex;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid #F5F5F7;
  margin-bottom: 8rpx;
}
.week-label {
  flex: 1;
  text-align: center;
  font-size: 24rpx;
  color: #86868B;
}
.grid {
  display: flex;
  flex-wrap: wrap;
}
.cell {
  width: 14.28%;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  &:active { background: #F5F5F7; border-radius: 16rpx; }
  &--empty { visibility: hidden; }
  &--today .cell-num {
    color: #007AFF;
    font-weight: 700;
  }
  &--selected {
    background: #1D1D1F;
    border-radius: 16rpx;
    .cell-num { color: #fff; }
  }
  &--has-event { font-weight: 600; }
}
.cell-num {
  font-size: 28rpx;
  color: #1D1D1F;
}
.cell-dot {
  position: absolute;
  bottom: 8rpx;
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: #FF3B30;
}
.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}
.event-title { font-size: 28rpx; font-weight: 600; color: #1D1D1F; }
.add-btn {
  font-size: 24rpx;
  color: #007AFF;
  padding: 8rpx 16rpx;
  background: #E3F2FD;
  border-radius: 30rpx;
  &:active { opacity: 0.7; }
}
.event-empty {
  text-align: center;
  font-size: 24rpx;
  color: #C7C7CC;
  padding: 30rpx 0;
}
.event-item {
  display: flex;
  align-items: center;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #F5F5F7;
  &:last-child { border-bottom: none; }
}
.event-time {
  font-size: 24rpx;
  color: #007AFF;
  font-family: monospace;
  min-width: 100rpx;
}
.event-text { flex: 1; font-size: 28rpx; color: #1D1D1F; }
.event-del {
  font-size: 24rpx;
  color: #C7C7CC;
  padding: 8rpx;
  &:active { color: #FF3B30; }
}
.add-panel {
  border-top: 1rpx solid #F5F5F7;
  padding-top: 20rpx;
  margin-top: 12rpx;
}
.event-input {
  background: #F5F5F7;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  font-size: 28rpx;
  color: #1D1D1F;
  margin-bottom: 16rpx;
}
.time-picker {
  background: #F5F5F7;
  border-radius: 12rpx;
  padding: 12rpx 24rpx;
  font-size: 28rpx;
  color: #1D1D1F;
  text-align: center;
  margin-bottom: 16rpx;
}
.panel-actions { display: flex; gap: 16rpx; }
.btn {
  flex: 1;
  padding: 16rpx 0;
  border-radius: 12rpx;
  font-size: 28rpx;
  text-align: center;
  &:active { opacity: 0.8; }
  &--primary { background: #1D1D1F; color: #fff; }
  &--ghost { background: #F5F5F7; color: #3A3A3C; }
}
</style>
