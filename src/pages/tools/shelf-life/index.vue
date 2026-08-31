/**
 * 保质期计算 - 商品保质期管理与到期提醒工具
 * 支持分类预设、自动计算过期日、本地存储保存记录
 */
<template>
  <view class="shelf">
    <!-- ====== 输入/编辑区域 ====== -->
    <view class="shelf__section">
      <view class="shelf__section-title">{{ editingId ? '编辑商品' : '添加商品' }}</view>

      <!-- 商品分类 -->
      <view class="shelf__field">
        <text class="shelf__label">商品分类</text>
        <view class="shelf__categories">
          <view
            v-for="cat in categories"
            :key="cat.key"
            :class="['shelf__category', { 'shelf__category--active': formData.category === cat.key }]"
            @tap="formData.category = cat.key"
          >
            <text class="shelf__cat-icon">{{ cat.icon }}</text>
            <text class="shelf__cat-name">{{ cat.name }}</text>
          </view>
        </view>
      </view>

      <!-- 商品名称 -->
      <view class="shelf__field">
        <text class="shelf__label">商品名称</text>
        <input
          v-model="formData.name"
          class="shelf__input"
          placeholder="输入商品名称"
          placeholder-class="shelf__placeholder"
        />
      </view>

      <!-- 预设选择（根据分类动态显示） -->
      <view v-if="presetOptions.length > 0" class="shelf__field">
        <text class="shelf__label">常用预设</text>
        <scroll-view class="shelf__presets" scroll-x show-scrollbar="false">
          <view
            v-for="p in presetOptions"
            :key="p.label"
            :class="['shelf__preset', { 'shelf__preset--active': formData.duration === p.days && formData.durationUnit === p.unit }]"
            @tap="selectPreset(p)"
          >
            <text>{{ p.label }}</text>
          </view>
        </scroll-view>
      </view>

      <!-- 生产日期 -->
      <view class="shelf__field">
        <text class="shelf__label">生产日期</text>
        <picker
          mode="date"
          :value="formData.productionDate"
          @change="onProdDateChange"
          class="shelf__picker"
        >
          <view class="shelf__picker-value">
            <text>{{ formData.productionDate || '请选择生产日期' }}</text>
            <text class="shelf__arrow">›</text>
          </view>
        </picker>
      </view>

      <!-- 保质期时长 -->
      <view class="shelf__field">
        <text class="shelf__label">保质期时长</text>
        <view class="shelf__duration">
          <input
            v-model="formData.duration"
            type="number"
            class="shelf__input shelf__input--sm"
            placeholder="数值"
            placeholder-class="shelf__placeholder"
          />
          <view class="shelf__unit-select">
            <view
              v-for="u in durationUnits"
              :key="u.value"
              :class="['shelf__unit-item', { 'shelf__unit-item--active': formData.durationUnit === u.value }]"
              @tap="formData.durationUnit = u.value"
            >
              <text>{{ u.label }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="shelf__actions">
        <view class="shelf__btn shelf__btn--primary" @tap="saveItem">
          <text>{{ editingId ? '更新' : '添加' }}</text>
        </view>
        <view v-if="editingId" class="shelf__btn shelf__btn--cancel" @tap="cancelEdit">
          <text>取消</text>
        </view>
      </view>
    </view>

    <!-- ====== 结果预览 ====== -->
    <view v-if="preview" class="shelf__section">
      <view class="shelf__section-title">计算结果</view>

      <view class="shelf__result-grid">
        <view class="shelf__result-item">
          <text class="shelf__result-label">过期日期</text>
          <text class="shelf__result-value">{{ preview.expiryDate }}</text>
        </view>
        <view class="shelf__result-item">
          <text class="shelf__result-label">剩余天数</text>
          <text
            :class="[
              'shelf__result-value',
              'shelf__result-value--' + preview.status
            ]"
          >
            {{ preview.remainingDays > 0 ? preview.remainingDays + ' 天' : '已过期 ' + Math.abs(preview.remainingDays) + ' 天' }}
          </text>
        </view>
      </view>

      <!-- 状态条 -->
      <view class="shelf__status-bar">
        <view
          :class="['shelf__status-dot', 'shelf__status-dot--' + preview.status]"
        />
        <text :class="['shelf__status-text', 'shelf__status-text--' + preview.status]">
          {{ statusLabel(preview.status) }}
        </text>
      </view>

      <!-- 进度条 -->
      <view class="shelf__progress">
        <view class="shelf__progress-track">
          <view
            :class="['shelf__progress-fill', 'shelf__progress-fill--' + preview.status]"
            :style="{ width: preview.ratio + '%' }"
          />
        </view>
        <view class="shelf__progress-labels">
          <text class="shelf__progress-label">生产: {{ formData.productionDate }}</text>
          <text class="shelf__progress-label">过期: {{ preview.expiryDate }}</text>
        </view>
      </view>
    </view>

    <!-- ====== 已保存列表 ====== -->
    <view class="shelf__section">
      <view class="shelf__section-row">
        <text class="shelf__section-title">已保存商品</text>
        <text class="shelf__clear-btn" @tap="clearAll">清空</text>
      </view>

      <view v-if="itemList.length === 0" class="shelf__empty">
        <text>还没有保存任何商品</text>
      </view>

      <view
        v-for="(item, idx) in sortedList"
        :key="item.id || idx"
        class="shelf__item"
      >
        <view class="shelf__item-icon">{{ categoryIcon(item.category) }}</view>
        <view class="shelf__item-info">
          <text class="shelf__item-name">{{ item.name }}</text>
          <text class="shelf__item-dates">
            生产: {{ item.productionDate }} | 过期: {{ item.expiryDate }}
          </text>
          <text class="shelf__item-preset">{{ item.categoryName }} · {{ item.duration }}{{ unitLabel(item.durationUnit) }}</text>
        </view>
        <view class="shelf__item-right">
          <view :class="['shelf__item-badge', 'shelf__item-badge--' + item.status]">
            <text>{{ statusShort(item.status) }}</text>
          </view>
          <view class="shelf__item-actions">
            <text class="shelf__item-action" @tap="editItem(item)">编辑</text>
            <text class="shelf__item-action shelf__item-action--del" @tap="removeItem(item.id)">删除</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// ==================================================================
//  数据定义
// ==================================================================
const categories = [
  { key: 'food', name: '食品', icon: '🍚' },
  { key: 'drink', name: '饮料', icon: '🥤' },
  { key: 'cosmetic', name: '化妆品', icon: '💄' },
  { key: 'medicine', name: '药品', icon: '💊' },
  { key: 'daily', name: '日用品', icon: '🧴' }
]

const durationUnits = [
  { value: 'day', label: '天' },
  { value: 'month', label: '月' },
  { value: 'year', label: '年' }
]

// 各分类预设
const presetMap = {
  food: [
    { label: '鲜奶 7天', days: 7, unit: 'day' },
    { label: '面包 5天', days: 5, unit: 'day' },
    { label: '鸡蛋 30天', days: 30, unit: 'day' },
    { label: '大米 6月', days: 6, unit: 'month' },
    { label: '方便面 6月', days: 6, unit: 'month' },
    { label: '罐头 2年', days: 2, unit: 'year' }
  ],
  drink: [
    { label: '鲜榨果汁 3天', days: 3, unit: 'day' },
    { label: '啤酒 6月', days: 6, unit: 'month' },
    { label: '红酒 10年', days: 10, unit: 'year' },
    { label: '白酒 不限', days: 9999, unit: 'day' }
  ],
  cosmetic: [
    { label: '粉底液 12月', days: 12, unit: 'month' },
    { label: '口红 3年', days: 3, unit: 'year' },
    { label: '眼影 2年', days: 2, unit: 'year' },
    { label: '防晒霜 12月', days: 12, unit: 'month' }
  ],
  medicine: [
    { label: '感冒药 2年', days: 2, unit: 'year' },
    { label: '维生素 2年', days: 2, unit: 'year' },
    { label: '外用药膏 3年', days: 3, unit: 'year' },
    { label: '中药 1年', days: 1, unit: 'year' }
  ],
  daily: [
    { label: '洗衣液 3年', days: 3, unit: 'year' },
    { label: '洗发水 3年', days: 3, unit: 'year' },
    { label: '牙膏 2年', days: 2, unit: 'year' },
    { label: '纸巾 3年', days: 3, unit: 'year' }
  ]
}

// ==================================================================
//  状态
// ==================================================================
const STORAGE_KEY = 'lifetool_shelf_items'

const formData = ref({
  category: 'food',
  name: '',
  productionDate: '',
  duration: '',
  durationUnit: 'month'
})

const editingId = ref('')
const itemList = ref([])
const preview = ref(null)

// ==================================================================
//  计算属性
// ==================================================================
const presetOptions = computed(() => {
  return presetMap[formData.value.category] || []
})

const sortedList = computed(() => {
  const list = [...itemList.value]
  // 按状态排序：已过期 > 即将过期 > 正常；同状态下按过期日期升序
  const statusOrder = { expired: 0, warning: 1, normal: 2 }
  list.sort((a, b) => {
    const sa = statusOrder[a.status] ?? 3
    const sb = statusOrder[b.status] ?? 3
    if (sa !== sb) return sa - sb
    return a.expiryTimestamp - b.expiryTimestamp
  })
  return list
})

// ==================================================================
//  方法
// ==================================================================
function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDateCN(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

function addMonths(date, n) {
  const d = new Date(date)
  const m = d.getMonth() + n
  d.setMonth(m)
  // 处理日期溢出（如 1月31日 + 1个月 -> 2月28日）
  if (d.getMonth() !== ((m % 12) + 12) % 12) {
    d.setDate(0)
  }
  return d
}

function addYears(date, n) {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() + n)
  return d
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function getToday() {
  return formatDate(new Date())
}

function getDiffDays(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

function selectPreset(p) {
  formData.value.duration = p.days
  formData.value.durationUnit = p.unit
}

function onProdDateChange(e) {
  formData.value.productionDate = e.detail.value
}

function unitLabel(unit) {
  const map = { day: '天', month: '月', year: '年' }
  return map[unit] || unit
}

function categoryIcon(key) {
  const c = categories.find(c => c.key === key)
  return c ? c.icon : '📦'
}

function statusLabel(status) {
  const map = { normal: '正常', warning: '即将过期', expired: '已过期' }
  return map[status] || status
}

function statusShort(status) {
  const map = { normal: '正常', warning: '将过期', expired: '已过期' }
  return map[status] || status
}

/** 计算过期信息 */
function computePreview(data) {
  if (!data.productionDate || !data.duration) return null

  const prod = new Date(data.productionDate)
  const dur = parseInt(data.duration) || 0
  let expiryDate

  switch (data.durationUnit) {
    case 'day':
      expiryDate = addDays(prod, dur)
      break
    case 'month':
      expiryDate = addMonths(prod, dur)
      break
    case 'year':
      expiryDate = addYears(prod, dur)
      break
    default:
      expiryDate = addDays(prod, dur)
  }

  const expiryStr = formatDate(expiryDate)
  const remainingDays = getDiffDays(expiryStr)

  let status = 'normal'
  if (remainingDays < 0) {
    status = 'expired'
  } else if (remainingDays <= 30) {
    status = 'warning'
  }

  // 进度比例（用于进度条）
  const totalDays = getDiffDays(expiryStr) + Math.abs(getDiffDays(data.productionDate))
  const used = totalDays > 0 ? ((totalDays - Math.max(0, remainingDays)) / totalDays) * 100 : 0
  const ratio = Math.min(100, Math.max(0, used))

  return {
    expiryDate: formatDateCN(expiryDate),
    expiryRaw: expiryStr,
    expiryTimestamp: expiryDate.getTime(),
    remainingDays,
    status,
    ratio
  }
}

// ==================================================================
//  表单操作
// ==================================================================
function saveItem() {
  const data = formData.value

  if (!data.name.trim()) {
    uni.showToast({ title: '请输入商品名称', icon: 'none' })
    return
  }
  if (!data.productionDate) {
    uni.showToast({ title: '请选择生产日期', icon: 'none' })
    return
  }
  if (!data.duration || parseInt(data.duration) <= 0) {
    uni.showToast({ title: '请输入有效保质期', icon: 'none' })
    return
  }

  const p = computePreview(data)
  if (!p) {
    uni.showToast({ title: '计算失败，请检查输入', icon: 'none' })
    return
  }

  const cat = categories.find(c => c.key === data.category)

  if (editingId.value) {
    // 编辑更新
    const idx = itemList.value.findIndex(i => i.id === editingId.value)
    if (idx > -1) {
      itemList.value[idx] = {
        ...itemList.value[idx],
        name: data.name.trim(),
        category: data.category,
        categoryName: cat ? cat.name : '',
        productionDate: data.productionDate,
        duration: data.duration,
        durationUnit: data.durationUnit,
        expiryDate: p.expiryRaw,
        expiryTimestamp: p.expiryTimestamp,
        status: p.status
      }
    }
    editingId.value = ''
    uni.showToast({ title: '已更新', icon: 'success' })
  } else {
    // 新增
    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      name: data.name.trim(),
      category: data.category,
      categoryName: cat ? cat.name : '',
      productionDate: data.productionDate,
      duration: data.duration,
      durationUnit: data.durationUnit,
      expiryDate: p.expiryRaw,
      expiryTimestamp: p.expiryTimestamp,
      status: p.status,
      createdAt: Date.now()
    }
    itemList.value.unshift(newItem)
    uni.showToast({ title: '已添加', icon: 'success' })
  }

  // 重置表单
  resetForm()
  // 保存到本地
  saveToStorage()
}

function editItem(item) {
  editingId.value = item.id
  formData.value = {
    category: item.category,
    name: item.name,
    productionDate: item.productionDate,
    duration: item.duration,
    durationUnit: item.durationUnit
  }
  // 计算预览
  updatePreview()
}

function cancelEdit() {
  editingId.value = ''
  resetForm()
}

function resetForm() {
  formData.value = {
    category: 'food',
    name: '',
    productionDate: '',
    duration: '',
    durationUnit: 'month'
  }
  preview.value = null
}

function removeItem(id) {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除该商品吗？',
    success: (res) => {
      if (res.confirm) {
        itemList.value = itemList.value.filter(i => i.id !== id)
        saveToStorage()
        uni.showToast({ title: '已删除', icon: 'success' })
      }
    }
  })
}

function clearAll() {
  if (itemList.value.length === 0) return
  uni.showModal({
    title: '清空列表',
    content: '确定要清空所有已保存商品吗？',
    success: (res) => {
      if (res.confirm) {
        itemList.value = []
        saveToStorage()
        uni.showToast({ title: '已清空', icon: 'success' })
      }
    }
  })
}

// ==================================================================
//  预览计算（响应式）
// ==================================================================
function updatePreview() {
  const fd = formData.value
  if (fd.productionDate && fd.duration && parseInt(fd.duration) > 0) {
    preview.value = computePreview(fd)
  } else {
    preview.value = null
  }
}

watch(
  () => [formData.value.productionDate, formData.value.duration, formData.value.durationUnit],
  () => { updatePreview() },
  { deep: true }
)

// ==================================================================
//  本地存储
// ==================================================================
function loadFromStorage() {
  try {
    const data = uni.getStorageSync(STORAGE_KEY)
    if (data) {
      itemList.value = JSON.parse(data)
      // 刷新所有项目的状态（基于当前日期）
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      itemList.value.forEach(item => {
        const remaining = getDiffDays(item.expiryDate)
        if (remaining < 0) item.status = 'expired'
        else if (remaining <= 30) item.status = 'warning'
        else item.status = 'normal'
      })
    }
  } catch (e) {
    console.error('读取存储失败:', e)
  }
}

function saveToStorage() {
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(itemList.value))
  } catch (e) {
    console.error('保存存储失败:', e)
  }
}

// ==================================================================
//  初始化
// ==================================================================
loadFromStorage()
</script>

<style lang="scss" scoped>
.shelf {
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
  background: #F5F5F7;
  padding: 24rpx;

  // ====== 通用区块 ======
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
  &__section-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;
    padding-bottom: 16rpx;
    border-bottom: 2rpx solid #F5F5F7;

    .shelf__section-title {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
  }
  &__clear-btn {
    font-size: 26rpx;
    color: #FF3B30;

    &:active {
      opacity: 0.6;
    }
  }

  // ====== 字段 ======
  &__field {
    padding: 16rpx 0;
    border-bottom: 1rpx solid #F5F5F7;

    &:last-child {
      border-bottom: none;
    }
  }
  &__label {
    display: block;
    font-size: 26rpx;
    color: #86868B;
    margin-bottom: 12rpx;
  }

  // ---- 输入框 ----
  &__input {
    width: 100%;
    font-size: 30rpx;
    color: #1D1D1F;
    padding: 12rpx 0;
    border-bottom: 2rpx solid #E5E5EA;
    box-sizing: border-box;

    &--sm {
      width: 120rpx;
      text-align: center;
      border: 2rpx solid #E5E5EA;
      border-radius: 8rpx;
      padding: 12rpx 16rpx;
    }
  }
  &__placeholder {
    color: #C7C7CC;
    font-size: 28rpx;
  }

  // ---- 日期选择器 ----
  &__picker {
    width: 100%;
  }
  &__picker-value {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 30rpx;
    color: #007AFF;
    padding: 12rpx 0;
  }
  &__arrow {
    font-size: 32rpx;
    color: #C7C7CC;
  }

  // ---- 分类选择 ----
  &__categories {
    display: flex;
    gap: 12rpx;
    flex-wrap: wrap;
  }
  &__category {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 10rpx 20rpx;
    border-radius: 40rpx;
    border: 2rpx solid #E5E5EA;
    background: #FFFFFF;

    &--active {
      border-color: #1D1D1F;
      background: #1D1D1F;
    }
    &:active {
      opacity: 0.7;
    }
  }
  &__cat-icon {
    font-size: 28rpx;
  }
  &__cat-name {
    font-size: 24rpx;
    color: #1D1D1F;

    .shelf__category--active & {
      color: #FFFFFF;
    }
  }

  // ---- 预设 ----
  &__presets {
    white-space: nowrap;
    padding: 4rpx 0;
  }
  &__preset {
    display: inline-flex;
    padding: 8rpx 20rpx;
    margin-right: 12rpx;
    border-radius: 30rpx;
    background: #F5F5F7;
    font-size: 24rpx;
    color: #515154;

    &--active {
      background: #1D1D1F;
      color: #FFFFFF;
    }
    &:active {
      opacity: 0.7;
    }
  }

  // ---- 保质期时长 ----
  &__duration {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }
  &__unit-select {
    display: flex;
    border: 2rpx solid #E5E5EA;
    border-radius: 8rpx;
    overflow: hidden;
  }
  &__unit-item {
    padding: 12rpx 20rpx;
    font-size: 26rpx;
    color: #86868B;
    border-right: 1rpx solid #E5E5EA;

    &:last-child { border-right: none; }
    &--active {
      background: #1D1D1F;
      color: #FFFFFF;
    }
    &:active {
      opacity: 0.7;
    }
  }

  // ---- 操作按钮 ----
  &__actions {
    display: flex;
    gap: 16rpx;
    margin-top: 24rpx;
  }
  &__btn {
    flex: 1;
    text-align: center;
    padding: 24rpx 0;
    border-radius: 12rpx;
    font-size: 30rpx;
    font-weight: 600;

    &--primary {
      background: #1D1D1F;
      color: #FFFFFF;

      &:active { opacity: 0.85; }
    }
    &--cancel {
      flex: 0.5;
      background: #F5F5F7;
      color: #86868B;

      &:active { opacity: 0.7; }
    }
  }

  // ====== 计算结果 ======
  &__result-grid {
    display: flex;
    gap: 16rpx;
    margin-bottom: 20rpx;
  }
  &__result-item {
    flex: 1;
    background: #F5F5F7;
    border-radius: 12rpx;
    padding: 16rpx;
    text-align: center;
  }
  &__result-label {
    display: block;
    font-size: 22rpx;
    color: #86868B;
    margin-bottom: 8rpx;
  }
  &__result-value {
    font-size: 32rpx;
    font-weight: 700;
    color: #1D1D1F;

    &--normal { color: #34C759; }
    &--warning { color: #FF9500; }
    &--expired { color: #FF3B30; }
  }

  // ---- 状态 ----
  &__status-bar {
    display: flex;
    align-items: center;
    gap: 10rpx;
    margin-bottom: 20rpx;
  }
  &__status-dot {
    width: 20rpx;
    height: 20rpx;
    border-radius: 50%;

    &--normal { background: #34C759; }
    &--warning { background: #FF9500; }
    &--expired { background: #FF3B30; }
  }
  &__status-text {
    font-size: 28rpx;
    font-weight: 600;

    &--normal { color: #34C759; }
    &--warning { color: #FF9500; }
    &--expired { color: #FF3B30; }
  }

  // ---- 进度条 ----
  &__progress {
    margin-top: 8rpx;
  }
  &__progress-track {
    height: 8rpx;
    background: #F5F5F7;
    border-radius: 4rpx;
    overflow: hidden;
    margin-bottom: 8rpx;
  }
  &__progress-fill {
    height: 100%;
    border-radius: 4rpx;
    transition: width 0.3s ease;

    &--normal { background: #34C759; }
    &--warning { background: #FF9500; }
    &--expired { background: #FF3B30; }
  }
  &__progress-labels {
    display: flex;
    justify-content: space-between;
  }
  &__progress-label {
    font-size: 20rpx;
    color: #C7C7CC;
  }

  // ====== 已保存列表 ======
  &__empty {
    text-align: center;
    padding: 40rpx 0;
    font-size: 26rpx;
    color: #C7C7CC;
  }

  &__item {
    display: flex;
    gap: 16rpx;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #F5F5F7;

    &:last-child { border-bottom: none; }
  }
  &__item-icon {
    font-size: 44rpx;
    line-height: 1.2;
    flex-shrink: 0;
  }
  &__item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
    min-width: 0;
  }
  &__item-name {
    font-size: 28rpx;
    font-weight: 600;
    color: #1D1D1F;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__item-dates {
    font-size: 24rpx;
    color: #515154;
  }
  &__item-preset {
    font-size: 22rpx;
    color: #86868B;
  }
  &__item-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8rpx;
    flex-shrink: 0;
  }
  &__item-badge {
    padding: 4rpx 16rpx;
    border-radius: 20rpx;
    font-size: 20rpx;
    font-weight: 600;

    &--normal { background: #E8F8ED; color: #34C759; }
    &--warning { background: #FFF3DC; color: #FF9500; }
    &--expired { background: #FFE5E3; color: #FF3B30; }
  }
  &__item-actions {
    display: flex;
    gap: 12rpx;
  }
  &__item-action {
    font-size: 22rpx;
    color: #007AFF;

    &:active { opacity: 0.6; }

    &--del { color: #FF3B30; }
  }
}
</style>
