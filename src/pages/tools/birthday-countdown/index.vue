<template>
  <view class="bd">
    <!-- ====== 头部 ====== -->
    <view class="bd__header">
      <text class="bd__title">🎂 生日倒计时</text>
      <text class="bd__subtitle">别忘记重要的人的生日</text>
    </view>

    <!-- ====== 提醒条 ====== -->
    <view v-if="upcomingBirthdays.length > 0" class="bd__banner">
      <view class="bd__banner-title">
        <text>🎉 {{ upcomingBirthdays.length }} 位亲友的生日将至</text>
      </view>
      <view v-for="p in upcomingBirthdays" :key="p.id" class="bd__banner-item">
        <text class="bd__banner-name">{{ p.name }}</text>
        <text class="bd__banner-text">{{ p.days === 0 ? '今天生日！' : p.days + ' 天后' }}</text>
      </view>
    </view>

    <!-- ====== 提醒设置 ====== -->
    <view class="bd__subscribe">
      <view class="bd__subscribe-row">
        <text class="bd__subscribe-label">提前提醒</text>
        <view class="bd__subscribe-picker">
          <input
            class="bd__remind-input"
            type="number"
            :value="remindDaysText"
            @input="onRemindInput"
            @blur="onRemindBlur"
          />
          <text class="bd__remind-unit">天前</text>
          <text v-if="settings.remindDays === 0" class="bd__remind-today">（生日当天）</text>
        </view>
      </view>
      <text class="bd__subscribe-tip">可自定义提前天数（0-365，0 表示生日当天）。在人员卡片点 📅 添加到手机系统日历，按此提前量提醒（仅微信小程序支持）</text>
    </view>

    <!-- ====== Tab 切换 ====== -->
    <view class="bd__tabs">
      <view
        v-for="(t, i) in tabs"
        :key="t"
        :class="['bd__tab', { 'bd__tab--active': tab === i }]"
        @tap="tab = i"
      >
        <text>{{ t }}</text>
      </view>
    </view>

    <!-- ====== Tab 0: 倒计时 ====== -->
    <view v-show="tab === 0" class="bd__body">
      <!-- 人员列表 -->
      <view class="bd__section">
        <view class="bd__section-row">
          <text class="bd__section-title">已添加人员</text>
          <text class="bd__count">{{ people.length }} 人</text>
        </view>

        <view v-if="people.length === 0" class="bd__empty">
          <text>还没有添加人员，点右下角 ＋ 添加</text>
        </view>

        <view
          v-for="(p, idx) in sortedPeople"
          :key="p.id || idx"
          class="bd__card"
          :class="urgencyClass(p.days)"
          :style="{ animationDelay: idx * 0.04 + 's' }"
        >
          <view class="bd__card-main">
            <view class="bd__card-left">
              <view class="bd__avatar"><text>🥳</text></view>
              <view class="bd__card-info">
                <view class="bd__card-name-row">
                  <text class="bd__card-name">{{ p.name }}</text>
                  <text v-if="p.age !== null" class="bd__card-age">{{ p.age }}岁</text>
                </view>
                <text class="bd__card-birth">{{ p.birthLabel }}</text>
                <view v-if="p.constellation" class="bd__badges">
                  <text class="bd__badge">♈ {{ p.constellation }}</text>
                </view>
              </view>
            </view>
            <view class="bd__card-right">
              <template v-if="p.days !== null">
                <view class="bd__card-days">
                  <text class="bd__card-number">{{ p.days }}</text>
                  <text class="bd__card-unit">天</text>
                </view>
                <text class="bd__card-label">{{ daysLabel(p.days) }}</text>
                <text class="bd__card-next">{{ p.nextLabel }}</text>
              </template>
              <text v-else class="bd__card-label">日期无效</text>
            </view>
            <view class="bd__card-actions">
              <text class="bd__card-action" @tap="editItem(p)">✎</text>
              <text class="bd__card-action bd__card-action--del" @tap="removeItem(p.id)">✕</text>
            </view>
          </view>
          <view
            class="bd__card-cal"
            :class="{ 'bd__card-cal--added': p.calendarAdded }"
            @tap="addCalendarReminder(p)"
          >
            <text>📅</text>
            <text class="bd__card-cal-text">{{ p.calendarAdded ? '已添加日历提醒' : '添加日历提醒' }}</text>
            <text v-if="p.calendarAdded" class="bd__card-cal-sub">（可点击重新添加）</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ====== Tab 1: 日历 ====== -->
    <view v-show="tab === 1" class="bd__body">
      <view class="bd__section">
        <view class="bd__cal-header">
          <view class="bd__nav-btn" @tap="prevMonth">‹</view>
          <text class="bd__cal-title">{{ calYear }}年{{ calMonth + 1 }}月</text>
          <view class="bd__nav-btn" @tap="nextMonth">›</view>
        </view>
        <view class="bd__week-row">
          <text v-for="w in ['日','一','二','三','四','五','六']" :key="w" class="bd__week-label">{{ w }}</text>
        </view>
        <view class="bd__grid">
          <view
            v-for="(d, i) in cells"
            :key="i"
            class="bd__cell"
            :class="{
              'bd__cell--empty': !d,
              'bd__cell--today': d === todayDay && isCurrentMonth,
              'bd__cell--selected': d === selectedDay && isCurrentMonth,
            }"
            @tap="d ? selectDay(d) : null"
          >
            <template v-if="d">
              <text class="bd__cell-num">{{ d }}</text>
              <view class="bd__cell-markers">
                <view
                  v-for="(mk, mi) in cellMarkers(calYear, calMonth, d)"
                  :key="mi"
                  class="bd__cell-dot"
                  :style="{ background: mk }"
                />
                <text v-if="cellBirthdays(calYear, calMonth, d).length > 2" class="bd__cell-more">
                  +{{ cellBirthdays(calYear, calMonth, d).length - 2 }}
                </text>
              </view>
            </template>
          </view>
        </view>
      </view>

      <view class="bd__section">
        <text class="bd__section-title">{{ selectedDate }} 生日</text>
        <view v-if="selectedDayBirthdays.length === 0" class="bd__empty">
          <text>当天没有人生日</text>
        </view>
        <view v-for="p in selectedDayBirthdays" :key="p.id" class="bd__day-item">
          <text class="bd__day-name">{{ p.name }}</text>
          <text class="bd__day-rel">{{ p.relation || '—' }}</text>
          <text class="bd__day-birth">{{ p.birthLabel }}</text>
        </view>
      </view>
    </view>

    <!-- ====== 浮动添加按钮 ====== -->
    <view class="bd__fab" @tap="openAdd">
      <text>＋</text>
    </view>

    <!-- ====== 添加/编辑弹窗 ====== -->
    <view v-if="showForm" class="bd__popup">
      <view class="bd__popup-mask" @tap="closeForm" />
      <view class="bd__popup-body">
        <view class="bd__popup-header">
          <text class="bd__popup-title">{{ editingId ? '编辑人员' : '添加人员' }}</text>
          <text class="bd__popup-close" @tap="closeForm">✕</text>
        </view>

        <view class="bd__field">
          <text class="bd__label">称呼</text>
          <input
            v-model="form.name"
            class="bd__input"
            placeholder="如：妈妈 / 朋友"
            placeholder-class="bd__placeholder"
            maxlength="20"
          />
        </view>

        <view class="bd__field">
          <text class="bd__label">关系</text>
          <input
            v-model="form.relation"
            class="bd__input"
            placeholder="如：家人 / 朋友 / 同事（可留空）"
            placeholder-class="bd__placeholder"
            maxlength="20"
          />
        </view>

        <view class="bd__field">
          <text class="bd__label">生日</text>
          <picker mode="date" :value="form.solarDate" start="1900-01-01" :end="todayStr" @change="onSolarDateChange">
            <view class="bd__picker">
              <text>{{ form.solarDate }}</text>
              <text class="bd__arrow">›</text>
            </view>
          </picker>
        </view>

        <view class="bd__actions">
          <view class="bd__btn bd__btn--cancel" @tap="closeForm">
            <text>取消</text>
          </view>
          <view class="bd__btn bd__btn--primary" @tap="savePerson">
            <text>{{ editingId ? '更新' : '添加' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { generateId, showToast, showSuccess } from '@/utils/helpers'

// ====== 常量 ======
const PEOPLE_KEY = 'lifetool_birthdays'
const SETTINGS_KEY = 'lifetool_birthday_settings'
const tabs = ['倒计时', '日历']
const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
// 头像点颜色池（日历标记用）
const DOT_COLORS = ['#FF9500', '#007AFF', '#FF3B30', '#34C759', '#AF52DE', '#5AC8FA']

/** 星座（按公历月日） */
function getConstellation(solarMonth, solarDay) {
  // 各月「起始星座」：水瓶1/20 双鱼2/19 白羊3/21 金牛4/20 双子5/21 巨蟹6/22 狮子7/23 处女8/23 天秤9/23 天蝎10/24 射手11/23 摩羯12/22
  const CONSTELLATIONS = ['水瓶座', '双鱼座', '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座']
  const boundary = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 23, 22]
  let idx = solarMonth - 1
  if (solarDay < boundary[idx]) idx = (idx + 11) % 12
  return CONSTELLATIONS[idx]
}

// ====== 存储 ======
function loadPeople() {
  try {
    return JSON.parse(uni.getStorageSync(PEOPLE_KEY) || '[]')
  } catch (e) {
    return []
  }
}
function savePeople() {
  try {
    uni.setStorageSync(PEOPLE_KEY, JSON.stringify(people.value))
  } catch (e) {}
}
function loadSettings() {
  try {
    return Object.assign({ remindDays: 7 }, JSON.parse(uni.getStorageSync(SETTINGS_KEY) || '{}'))
  } catch (e) {
    return { remindDays: 7 }
  }
}
function saveSettings() {
  try {
    uni.setStorageSync(SETTINGS_KEY, JSON.stringify(settings.value))
  } catch (e) {}
}

// ====== 状态 ======
const people = ref(loadPeople())
const settings = ref(loadSettings())
// 提前提醒天数输入框文本（受控，blur 时归一化/校验）
const remindDaysText = ref(String(settings.value.remindDays))
const tab = ref(0)
const editingId = ref('')
const showForm = ref(false)
const form = ref(emptyForm())

// 日历状态
const now = new Date()
const calYear = ref(now.getFullYear())
const calMonth = ref(now.getMonth())
const selectedDay = ref(now.getDate())
const selectedDate = ref(formatKey(now.getFullYear(), now.getMonth(), now.getDate()))

function emptyForm() {
  return {
    name: '',
    relation: '',
    solarDate: '2000-01-01',
  }
}

// ====== 计算属性 ======

const todayStr = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

/** 每条人员记录附加倒计时/星座/展示字段 */
const enriched = computed(() => people.value.map(withCountdown))

const sortedPeople = computed(() => {
  return enriched.value
    .slice()
    .sort((a, b) => {
      if (a.days === null) return 1
      if (b.days === null) return -1
      return a.days - b.days
    })
})

const upcomingBirthdays = computed(() => {
  return enriched.value
    .filter(p => p.days !== null && p.days >= 0 && p.days <= settings.value.remindDays)
    .sort((a, b) => a.days - b.days)
})

// 日历
const isCurrentMonth = computed(() => {
  const t = new Date()
  return calYear.value === t.getFullYear() && calMonth.value === t.getMonth()
})
const todayDay = new Date().getDate()

const cells = computed(() => {
  const firstWeekday = new Date(calYear.value, calMonth.value, 1).getDay()
  const days = new Date(calYear.value, calMonth.value + 1, 0).getDate()
  const arr = []
  for (let i = 0; i < firstWeekday; i++) arr.push(null)
  for (let d = 1; d <= days; d++) arr.push(d)
  return arr
})

/** 某天有生日的人 */
function birthdaysOnDay(y, m, d) {
  return people.value.filter(p => isBirthdayOnSolarDate(p, y, m, d))
}

function isBirthdayOnSolarDate(p, y, m, d) {
  // m 为 0-11
  return p.solarMonth === m + 1 && p.solarDay === d
}

const selectedDayBirthdays = computed(() => birthdaysOnDay(calYear.value, calMonth.value, selectedDay.value))

// ====== 倒计时计算 ======

function nextSolarBirthday(month, day) {
  const now = new Date()
  let y = now.getFullYear()
  let target = new Date(y, month - 1, day)
  const todayMid = new Date(y, now.getMonth(), now.getDate())
  if (target < todayMid) target = new Date(y + 1, month - 1, day)
  return target
}

function daysUntil(target) {
  const now = new Date()
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target.getTime() - t0.getTime()) / 86400000)
}

/** 计算周岁年龄：已过生日算实岁，未到生日减一 */
function getAge(birthYear, birthMonth, birthDay) {
  if (!birthYear || !birthMonth || !birthDay) return null
  const now = new Date()
  let age = now.getFullYear() - birthYear
  const bdThisYear = new Date(now.getFullYear(), birthMonth - 1, birthDay)
  if (now < bdThisYear) age--
  return age
}

function withCountdown(p) {
  let nextDate = null
  if (p.solarMonth && p.solarDay) {
    nextDate = nextSolarBirthday(p.solarMonth, p.solarDay)
  }
  const days = nextDate ? daysUntil(nextDate) : null

  // 生日展示文案
  let birthLabel = ''
  let nextLabel = ''
  let constellation = ''
  if (p.solarMonth && p.solarDay) {
    birthLabel = `${p.solarMonth}月${p.solarDay}日`
    constellation = getConstellation(p.solarMonth, p.solarDay)
  }
  if (nextDate) {
    nextLabel = `${nextDate.getMonth() + 1}月${nextDate.getDate()}日 ${WEEKDAYS[nextDate.getDay()]}`
    if (p.birthYear) nextLabel += ` · 满 ${nextDate.getFullYear() - p.birthYear} 岁`
  }

  const age = getAge(p.birthYear, p.solarMonth, p.solarDay)

  return { ...p, days, nextDate, birthLabel, nextLabel, constellation, age }
}

// ====== 显示辅助 ======

function daysLabel(days) {
  if (days === 0) return '今天生日 🎉'
  if (days === 1) return '明天生日'
  if (days <= 7) return '即将到来'
  if (days <= 30) return '还有不到一个月'
  return '还有一段时间'
}

function urgencyClass(days) {
  if (days === 0) return 'bd__card--today'
  if (days <= 7) return 'bd__card--urgent'
  if (days <= 30) return 'bd__card--soon'
  return ''
}

function cellMarkers(y, m, d) {
  const list = birthdaysOnDay(y, m, d)
  return list.slice(0, 2).map((p, i) => DOT_COLORS[indexOfPerson(p) % DOT_COLORS.length])
}
function cellBirthdays(y, m, d) {
  return birthdaysOnDay(y, m, d)
}
function indexOfPerson(p) {
  return people.value.findIndex(x => x.id === p.id)
}

// ====== 表单操作 ======

function onSolarDateChange(e) {
  form.value.solarDate = e.detail.value
}

function savePerson() {
  const f = form.value
  if (!f.name.trim()) {
    showToast('请输入称呼')
    return
  }
  const parts = f.solarDate.split('-').map(Number)
  const record = {
    birthYear: parts[0],
    solarMonth: parts[1],
    solarDay: parts[2],
  }
  const isEditing = !!editingId.value

  if (isEditing) {
    const idx = people.value.findIndex(x => x.id === editingId.value)
    if (idx > -1) {
      people.value[idx] = {
        ...people.value[idx],
        name: f.name.trim(),
        relation: f.relation.trim(),
        ...record,
      }
    }
  } else {
    people.value.unshift({
      id: generateId(),
      name: f.name.trim(),
      relation: f.relation.trim(),
      ...record,
      createdAt: Date.now(),
    })
  }
  savePeople()
  closeForm()
  showToast(isEditing ? '已更新' : '已添加', 'success')
}

function editItem(p) {
  editingId.value = p.id
  form.value = {
    name: p.name || '',
    relation: p.relation || '',
    solarDate: `${p.birthYear || 2000}-${String(p.solarMonth || 1).padStart(2, '0')}-${String(p.solarDay || 1).padStart(2, '0')}`,
  }
  showForm.value = true
}

function openAdd() {
  resetForm()
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  resetForm()
}

function resetForm() {
  editingId.value = ''
  form.value = emptyForm()
}

function removeItem(id) {
  uni.showModal({
    title: '确认删除',
    content: '删除后将无法恢复，确定删除该人员吗？',
    success: (res) => {
      if (res.confirm) {
        people.value = people.value.filter(p => p.id !== id)
        savePeople()
        showToast('已删除', 'success')
      }
    },
  })
}

// ====== 日历操作 ======

function formatKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function selectDay(d) {
  selectedDay.value = d
  selectedDate.value = formatKey(calYear.value, calMonth.value, d)
}
function prevMonth() {
  if (calMonth.value === 0) {
    calMonth.value = 11
    calYear.value--
  } else {
    calMonth.value--
  }
  selectDay(1)
}
function nextMonth() {
  if (calMonth.value === 11) {
    calMonth.value = 0
    calYear.value++
  } else {
    calMonth.value++
  }
  selectDay(1)
}

// ====== 日历提醒 ======

function onRemindInput(e) {
  remindDaysText.value = e.detail.value || ''
  const days = parseInt(remindDaysText.value, 10)
  if (remindDaysText.value !== '' && !Number.isNaN(days) && days >= 0 && days <= 365) {
    settings.value.remindDays = days
    saveSettings()
  }
}

function onRemindBlur() {
  const days = parseInt(remindDaysText.value, 10)
  if (remindDaysText.value === '' || Number.isNaN(days) || days < 0 || days > 365) {
    remindDaysText.value = String(settings.value.remindDays)
    showToast('提前天数需为 0-365 的整数')
  } else {
    remindDaysText.value = String(days)
  }
}

/** 添加日历提醒（每人独立，仅微信小程序支持） */
function addCalendarReminder(p) {
  // #ifdef MP-WEIXIN
  if (!wx.canIUse('addPhoneRepeatCalendar')) {
    showToast('当前微信版本不支持日历提醒')
    return
  }
  if (p.calendarAdded) {
    uni.showModal({
      title: '已添加日历提醒',
      content: '该人员已添加到手机系统日历（按年重复）。微信暂不支持删除日历事件，如需取消请在手机系统日历中删除。要再次添加吗？',
      confirmText: '再次添加',
      success: (res) => {
        if (res.confirm) doAddToCalendar(p)
      },
    })
    return
  }
  doAddToCalendar(p)
  // #endif
  // #ifndef MP-WEIXIN
  showToast('日历提醒仅微信小程序支持')
  // #endif
}

function doAddToCalendar(p) {
  if (!p.solarMonth || !p.solarDay) {
    showToast('生日日期无效，无法添加')
    return
  }
  // 下次生日当天 09:00 开始，按年重复
  const next = nextSolarBirthday(p.solarMonth, p.solarDay)
  const start = new Date(next.getFullYear(), next.getMonth(), next.getDate(), 9, 0, 0)
  const offset = (settings.value.remindDays || 0) * 86400
  const option = {
    title: `${p.name}的生日${p.relation ? '（' + p.relation + '）' : ''}`,
    startTime: Math.floor(start.getTime() / 1000),
    allDay: false,
    repeatInterval: 'year',
    alarm: true,
    alarmOffset: offset,
    description: '治点工具箱 · 生日提醒',
  }
  wx.addPhoneRepeatCalendar({
    ...option,
    success: () => {
      markCalendarAdded(p)
      showSuccess('已添加到系统日历')
    },
    fail: () => {
      // iOS 对非预设提前量（如 3/14/30 天）可能拒绝，回退为生日当天提醒
      if (offset > 0) {
        wx.addPhoneRepeatCalendar({
          ...option,
          alarmOffset: 0,
          success: () => {
            markCalendarAdded(p)
            showToast('已添加（提醒调整为生日当天）')
          },
          fail: () => showCalendarFail(),
        })
        return
      }
      showCalendarFail()
    },
  })
}

/** 在底层人员记录写入 calendarAdded 并持久化（enriched 是 spread 副本，不能直接改） */
function markCalendarAdded(p) {
  const idx = people.value.findIndex(x => x.id === p.id)
  if (idx === -1) return
  people.value[idx] = { ...people.value[idx], calendarAdded: true }
  savePeople()
}

function showCalendarFail() {
  uni.showModal({
    title: '添加失败',
    content: '未能添加到系统日历，可能未授权日历权限。可前往设置开启「添加日历事件」权限后重试。',
    confirmText: '去设置',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) uni.openSetting()
    },
  })
}

// ====== 生命周期 ======
onShow(() => {
  // 幂等重载：进入页面时刷新数据与倒计时
  people.value = loadPeople()
  settings.value = loadSettings()
  remindDaysText.value = String(settings.value.remindDays)
})
</script>

<style lang="scss" scoped>
.bd {
  min-height: 100vh;
  background: #F5F5F7;
  padding: 24rpx;
  padding-bottom: 60rpx;
}

/* ====== 头部 ====== */
.bd__header {
  background: linear-gradient(135deg, #FF9A3D 0%, #FF5F6D 100%);
  border-radius: 20rpx;
  padding: 40rpx 32rpx;
  margin-bottom: 24rpx;
  display: flex;
  flex-direction: column;
}
.bd__title {
  font-size: 40rpx;
  font-weight: 700;
  color: #FFFFFF;
}
.bd__subtitle {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
}

/* ====== 提醒条 ====== */
.bd__banner {
  background: #FFF7E6;
  border: 1rpx solid #FFE0B2;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 24rpx;
}
.bd__banner-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #B2500A;
  margin-bottom: 8rpx;
}
.bd__banner-item {
  display: flex;
  justify-content: space-between;
  padding: 4rpx 0;
}
.bd__banner-name {
  font-size: 24rpx;
  color: #6B4A1F;
}
.bd__banner-text {
  font-size: 24rpx;
  color: #FF9500;
  font-weight: 600;
}

/* ====== 订阅设置 ====== */
.bd__subscribe {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.bd__subscribe-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8rpx 0;
}
.bd__subscribe-label {
  font-size: 26rpx;
  color: #1D1D1F;
}
.bd__subscribe-picker {
  display: flex;
  align-items: center;
  color: #007AFF;
  font-size: 26rpx;
}
.bd__remind-input {
  width: 96rpx;
  text-align: right;
  color: #007AFF;
  font-size: 26rpx;
  padding: 4rpx 8rpx;
  border-bottom: 1rpx solid #E5E5EA;
  margin-right: 8rpx;
}
.bd__remind-unit {
  color: #007AFF;
}
.bd__remind-today {
  font-size: 20rpx;
  color: #86868B;
  margin-left: 8rpx;
}
.bd__arrow {
  margin-left: 8rpx;
  color: #C7C7CC;
}
.bd__subscribe-tip {
  display: block;
  margin-top: 8rpx;
  font-size: 20rpx;
  color: #86868B;
  line-height: 1.5;
}

/* ====== Tab ====== */
.bd__tabs {
  display: flex;
  background: #E9E9ED;
  border-radius: 12rpx;
  padding: 6rpx;
  margin-bottom: 24rpx;
}
.bd__tab {
  flex: 1;
  text-align: center;
  padding: 14rpx 0;
  font-size: 28rpx;
  color: #86868B;
  border-radius: 8rpx;
  transition: all 0.2s;
}
.bd__tab--active {
  background: #FFFFFF;
  color: #1D1D1F;
  font-weight: 600;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.bd__body {
  display: flex;
  flex-direction: column;
}

/* ====== 卡片区块 ====== */
.bd__section {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.bd__section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 20rpx;
}
.bd__section-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.bd__section-row .bd__section-title {
  margin-bottom: 0;
}
.bd__count {
  font-size: 24rpx;
  color: #86868B;
}
.bd__empty {
  padding: 40rpx 0;
  text-align: center;
  color: #C7C7CC;
  font-size: 26rpx;
}

/* ====== 表单 ====== */
.bd__field {
  margin-bottom: 24rpx;
}
.bd__label {
  display: block;
  font-size: 24rpx;
  color: #86868B;
  margin-bottom: 12rpx;
}
.bd__input {
  background: #F5F5F7;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  color: #1D1D1F;
}
.bd__placeholder {
  color: #C7C7CC;
}
.bd__picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #F5F5F7;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  color: #1D1D1F;
}
.bd__actions {
  display: flex;
  gap: 16rpx;
  margin-top: 8rpx;
}
.bd__btn {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 600;
}
.bd__btn--primary {
  background: #1D1D1F;
  color: #FFFFFF;
}
.bd__btn--cancel {
  background: #F5F5F7;
  color: #86868B;
}

/* ====== 人员卡片 ====== */
.bd__card {
  display: flex;
  flex-direction: column;
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  border-left: 6rpx solid #E9E9ED;
}
.bd__card-main {
  display: flex;
  align-items: center;
  width: 100%;
}
.bd__card--today {
  border-left-color: #FF3B30;
}
.bd__card--urgent {
  border-left-color: #FF9500;
}
.bd__card--soon {
  border-left-color: #FFCC00;
}
.bd__card-left {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
}
.bd__avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #FFF3E0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}
.bd__card-info {
  min-width: 0;
}
.bd__card-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.bd__card-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1D1D1F;
}
.bd__card-age {
  font-size: 22rpx;
  font-weight: 600;
  color: #FF9500;
  background: #FFF4E5;
  padding: 2rpx 14rpx;
  border-radius: 20rpx;
}
.bd__card-birth {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #86868B;
}
.bd__badges {
  display: flex;
  gap: 12rpx;
  margin-top: 6rpx;
}
.bd__badge {
  font-size: 20rpx;
  color: #6E4B1F;
  background: #F5F0E6;
  padding: 2rpx 12rpx;
  border-radius: 20rpx;
}
.bd__card-right {
  text-align: right;
  margin-left: 16rpx;
  flex-shrink: 0;
}
.bd__card-days {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
}
.bd__card-number {
  font-size: 44rpx;
  font-weight: 700;
  color: #1D1D1F;
  line-height: 1;
}
.bd__card--today .bd__card-number {
  color: #FF3B30;
}
.bd__card--urgent .bd__card-number {
  color: #FF9500;
}
.bd__card-unit {
  font-size: 22rpx;
  color: #86868B;
  margin-left: 4rpx;
}
.bd__card-label {
  display: block;
  font-size: 20rpx;
  color: #C7C7CC;
  margin-top: 4rpx;
}
.bd__card-next {
  display: block;
  font-size: 20rpx;
  color: #86868B;
  margin-top: 4rpx;
}
.bd__card-actions {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-left: 16rpx;
}
.bd__card-action {
  font-size: 28rpx;
  color: #C7C7CC;
  padding: 4rpx;
}
.bd__card-action--del {
  color: #FF3B30;
}
.bd__card-cal {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #F0F0F2;
  font-size: 24rpx;

  &:active {
    opacity: 0.6;
  }
}
.bd__card-cal-text {
  color: #007AFF;
}
.bd__card-cal--added {
  .bd__card-cal-text {
    color: #34C759;
  }
}
.bd__card-cal-sub {
  font-size: 20rpx;
  color: #C7C7CC;
}

/* ====== 日历 ====== */
.bd__cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}
.bd__nav-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #007AFF;
  background: #F5F5F7;
  border-radius: 12rpx;
}
.bd__cal-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1D1D1F;
}
.bd__week-row {
  display: flex;
  margin-bottom: 8rpx;
}
.bd__week-label {
  flex: 1;
  text-align: center;
  font-size: 22rpx;
  color: #86868B;
}
.bd__grid {
  display: flex;
  flex-wrap: wrap;
}
.bd__cell {
  width: 14.28%;
  height: 92rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  position: relative;
}
.bd__cell--today .bd__cell-num {
  background: #007AFF;
  color: #FFFFFF;
  border-radius: 50%;
  width: 52rpx;
  height: 52rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bd__cell--selected {
  background: #E8F1FF;
}
.bd__cell-num {
  font-size: 26rpx;
  color: #1D1D1F;
  line-height: 52rpx;
}
.bd__cell--empty {
  visibility: hidden;
}
.bd__cell-markers {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16rpx;
  gap: 4rpx;
}
.bd__cell-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
}
.bd__cell-more {
  font-size: 16rpx;
  color: #86868B;
}

.bd__day-item {
  display: flex;
  align-items: center;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #F2F2F4;
}
.bd__day-item:last-child {
  border-bottom: none;
}
.bd__day-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-right: 16rpx;
}
.bd__day-rel {
  font-size: 24rpx;
  color: #86868B;
  margin-right: 16rpx;
}
.bd__day-birth {
  font-size: 24rpx;
  color: #C7C7CC;
}

/* ====== 浮动添加按钮 ====== */
.bd__fab {
  position: fixed;
  right: 40rpx;
  bottom: 60rpx;
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: #1D1D1F;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
  font-weight: 300;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);
  z-index: 20;
}
.bd__fab:active {
  transform: scale(0.92);
}

/* ====== 弹窗 ====== */
.bd__popup {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
}
.bd__popup-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  animation: bdFade 0.2s ease-out;
}
.bd__popup-body {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: #FFFFFF;
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx 32rpx 60rpx;
  animation: bdSlideUp 0.25s ease-out;
}
.bd__popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}
.bd__popup-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1D1D1F;
}
.bd__popup-close {
  font-size: 32rpx;
  color: #C7C7CC;
  padding: 8rpx;
}

@keyframes bdSlideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
@keyframes bdFade {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
