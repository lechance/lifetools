<template>
  <view class="ann">
    <!-- 列表 -->
    <scroll-view class="ann__list" scroll-y show-scrollbar>
      <view v-if="list.length === 0" class="ann__empty">
        <text class="ann__empty-icon">📅</text>
        <text class="ann__empty-text">还没有纪念日</text>
        <text class="ann__empty-sub">点击右下角 + 添加</text>
      </view>

      <view
        v-for="item in sortedList"
        :key="item.id"
        class="ann__card"
        :class="urgencyClass(item.daysToNext)"
      >
        <view class="ann__card-main" @tap="editItem(item)">
          <view class="ann__card-left">
            <text class="ann__card-name">{{ item.name }}</text>
            <text class="ann__card-date">{{ item.dateStr }}</text>
          </view>
          <view class="ann__card-right">
            <text class="ann__card-days">{{ item.daysToNext }}</text>
            <text class="ann__card-unit">天后</text>
          </view>
        </view>
        <view class="ann__card-footer">
          <text class="ann__card-elapsed">已过 {{ item.daysElapsed }} 天</text>
          <text class="ann__card-del" @tap.stop="removeItem(item.id)">✕</text>
        </view>
      </view>
    </scroll-view>

    <!-- FAB -->
    <view class="ann__fab" @tap="openAdd">＋</view>

    <!-- 弹窗 -->
    <view v-if="showForm" class="ann__popup">
      <view class="ann__popup-mask" @tap="closeForm" />
      <view class="ann__popup-body">
        <view class="ann__popup-header">
          <text class="ann__popup-title">{{ editingId ? '编辑纪念日' : '添加纪念日' }}</text>
          <text class="ann__popup-close" @tap="closeForm">✕</text>
        </view>

        <view class="ann__field">
          <text class="ann__field-label">名称</text>
          <input
            v-model="form.name"
            class="ann__field-input"
            placeholder="例如：结婚纪念日"
            maxlength="20"
            confirm-type="done"
          />
        </view>

        <view class="ann__field">
          <text class="ann__field-label">日期</text>
          <picker mode="date" :value="form.date" start="1900-01-01" end="2099-12-31" @change="onDateChange">
            <view class="ann__picker">
              <text>{{ form.date }}</text>
              <text class="ann__picker-arrow">›</text>
            </view>
          </picker>
        </view>

        <view class="ann__actions">
          <view class="ann__btn ann__btn--cancel" @tap="closeForm"><text>取消</text></view>
          <view class="ann__btn ann__btn--primary" @tap="saveItem">
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
import { showToast, generateId } from '@/utils/helpers'

const STORAGE_KEY = 'lifetool_anniversaries'

const list = ref([])
const showForm = ref(false)
const editingId = ref('')
const form = ref({ name: '', date: todayStr() })

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function loadData() {
  try { list.value = JSON.parse(uni.getStorageSync(STORAGE_KEY) || '[]') } catch (e) { list.value = [] }
}
function saveData() {
  try { uni.setStorageSync(STORAGE_KEY, JSON.stringify(list.value)) } catch (e) {}
}

function daysBetween(dateStr) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const parts = dateStr.split('-').map(Number)
  const target = new Date(parts[0], parts[1] - 1, parts[2])
  target.setHours(0, 0, 0, 0)
  return Math.floor((target - now) / 86400000)
}

function daysElapsed(dateStr) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const parts = dateStr.split('-').map(Number)
  const target = new Date(parts[0], parts[1] - 1, parts[2])
  target.setHours(0, 0, 0, 0)
  return Math.floor((now - target) / 86400000)
}

function daysToNextAnniversary(dateStr) {
  const parts = dateStr.split('-').map(Number)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const thisYear = new Date(now.getFullYear(), parts[1] - 1, parts[2])
  thisYear.setHours(0, 0, 0, 0)
  if (thisYear >= now) return Math.floor((thisYear - now) / 86400000)
  const nextYear = new Date(now.getFullYear() + 1, parts[1] - 1, parts[2])
  nextYear.setHours(0, 0, 0, 0)
  return Math.floor((nextYear - now) / 86400000)
}

const sortedList = computed(() => {
  return list.value
    .map(item => ({
      ...item,
      dateStr: item.date,
      daysElapsed: Math.max(0, daysElapsed(item.date)),
      daysToNext: daysToNextAnniversary(item.date),
    }))
    .sort((a, b) => a.daysToNext - b.daysToNext)
})

function urgencyClass(days) {
  if (days <= 7) return 'ann__card--urgent'
  if (days <= 30) return 'ann__card--soon'
  return ''
}

function openAdd() {
  editingId.value = ''
  form.value = { name: '', date: todayStr() }
  showForm.value = true
}
function editItem(item) {
  editingId.value = item.id
  form.value = { name: item.name, date: item.date }
  showForm.value = true
}
function closeForm() {
  showForm.value = false
}
function onDateChange(e) {
  form.value.date = e.detail.value
}
function saveItem() {
  const name = (form.value.name || '').trim()
  if (!name) { showToast('请输入名称'); return }
  if (editingId.value) {
    const idx = list.value.findIndex(x => x.id === editingId.value)
    if (idx > -1) list.value[idx] = { ...list.value[idx], name, date: form.value.date }
  } else {
    list.value.unshift({ id: generateId(), name, date: form.value.date, createdAt: Date.now() })
  }
  saveData()
  closeForm()
  showToast(editingId.value ? '已更新' : '已添加')
}
function removeItem(id) {
  uni.showModal({
    title: '确认删除',
    content: '删除后将无法恢复，确定删除吗？',
    success(res) {
      if (res.confirm) {
        list.value = list.value.filter(x => x.id !== id)
        saveData()
        showToast('已删除')
      }
    },
  })
}

onShow(() => { loadData() })
</script>

<style lang="scss" scoped>
.ann {
  min-height: 100vh;
  background: $bg-color;

  &__list {
    height: calc(100vh - 140rpx);
    padding: 24rpx;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 120rpx 0;
  }
  &__empty-icon { font-size: 80rpx; margin-bottom: 16rpx; }
  &__empty-text { font-size: 32rpx; color: $text-secondary; }
  &__empty-sub { font-size: 24rpx; color: $text-light; margin-top: 8rpx; }

  &__card {
    background: $card-bg;
    border-radius: $radius-md;
    box-shadow: $shadow-sm;
    margin-bottom: 20rpx;
    overflow: hidden;
    border-left: 8rpx solid transparent;
    &--urgent { border-left-color: $danger; }
    &--soon { border-left-color: #FF9800; }
  }
  &__card-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28rpx 24rpx;
  }
  &__card-left { flex: 1; min-width: 0; }
  &__card-name {
    font-size: 32rpx;
    font-weight: 600;
    color: $text-primary;
    display: block;
    margin-bottom: 6rpx;
  }
  &__card-date {
    font-size: 24rpx;
    color: $text-secondary;
  }
  &__card-right {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-left: 24rpx;
  }
  &__card-days {
    font-size: 48rpx;
    font-weight: 700;
    color: $text-primary;
    line-height: 1;
  }
  &__card-unit {
    font-size: 22rpx;
    color: $text-light;
    margin-top: 4rpx;
  }
  &__card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12rpx 24rpx;
    border-top: 1rpx solid $border-color;
  }
  &__card-elapsed {
    font-size: 22rpx;
    color: $text-light;
  }
  &__card-del {
    font-size: 28rpx;
    color: $text-light;
    padding: 8rpx 16rpx;
    &:active { color: $danger; }
  }

  &__fab {
    position: fixed;
    right: 40rpx;
    bottom: 60rpx;
    width: 112rpx;
    height: 112rpx;
    border-radius: 50%;
    background: $primary-color;
    color: #FFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 56rpx;
    font-weight: 300;
    box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.2);
    z-index: 20;
    &:active { transform: scale(0.92); }
  }

  // 弹窗
  &__popup {
    position: fixed;
    left: 0; top: 0; right: 0; bottom: 0;
    z-index: 30;
  }
  &__popup-mask {
    position: absolute;
    left: 0; top: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.45);
  }
  &__popup-body {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    background: $card-bg;
    border-radius: $radius-lg $radius-lg 0 0;
    padding: 32rpx 32rpx 60rpx;
    animation: annSlideUp 0.25s ease-out;
  }
  &__popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32rpx;
  }
  &__popup-title { font-size: 32rpx; font-weight: 600; color: $text-primary; }
  &__popup-close { font-size: 32rpx; color: $text-light; padding: 8rpx; }

  &__field {
    margin-bottom: 24rpx;
  }
  &__field-label {
    font-size: 26rpx;
    color: $text-secondary;
    margin-bottom: 12rpx;
    display: block;
  }
  &__field-input {
    background: $primary-bg;
    border-radius: $radius-sm;
    padding: 20rpx 24rpx;
    font-size: 30rpx;
    color: $text-primary;
  }

  &__picker {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: $primary-bg;
    border-radius: $radius-sm;
    padding: 20rpx 24rpx;
    font-size: 30rpx;
    color: $text-primary;
  }
  &__picker-arrow { color: $text-light; font-size: 32rpx; }

  &__actions {
    display: flex;
    gap: 24rpx;
    margin-top: 40rpx;
  }
  &__btn {
    flex: 1;
    padding: 24rpx 0;
    border-radius: $radius-md;
    text-align: center;
    font-size: 30rpx;
    &--cancel { background: $primary-bg; color: $text-primary; }
    &--primary { background: $primary-color; color: #FFF; }
    &:active { opacity: 0.7; }
  }
}

@keyframes annSlideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>
