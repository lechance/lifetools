<template>
<view class="rc">
  <view class="rc__card">
    <text class="rc__title">退休年龄计算器</text>
    <text class="rc__subtitle">基于2025年延迟退休新政</text>
  </view>

  <view class="rc__card">
    <text class="rc__label">人员类型</text>
    <view class="rc__types">
      <view
        v-for="t in types"
        :key="t.type"
        class="rc__type"
        :class="{ 'rc__type--active': selectedType === t.type }"
        @tap="selectedType = t.type"
      >
        <text class="rc__type-text">{{ t.label }}</text>
      </view>
    </view>
  </view>

  <view class="rc__card">
    <text class="rc__label">出生年月</text>
    <picker mode="date" fields="month" :value="birthDate" @change="onBirthChange">
      <view class="rc__picker">
        <text class="rc__picker-text">{{ birthDate || '请选择出生年月' }}</text>
        <text class="rc__picker-arrow">▸</text>
      </view>
    </picker>
  </view>

  <view v-if="result" class="rc__card rc__result">
    <view class="rc__result-row">
      <text class="rc__result-label">预计退休日期</text>
      <text class="rc__result-value">{{ result.retYear }}年{{ result.retMonth }}月</text>
    </view>
    <view class="rc__result-row">
      <text class="rc__result-label">退休年龄</text>
      <text class="rc__result-value">{{ result.age }}岁</text>
    </view>
    <view v-if="result.delayed" class="rc__result-row">
      <text class="rc__result-label">延迟月数</text>
      <text class="rc__result-value rc__result-value--warn">+{{ result.delayMonths }}个月</text>
    </view>
    <view v-if="remainingText" class="rc__result-row">
      <text class="rc__result-label">距离退休</text>
      <text class="rc__result-value rc__result-value--accent">{{ remainingText }}</text>
    </view>
  </view>

  <view class="rc__card rc__info">
    <text class="rc__info-title">政策说明</text>
    <text class="rc__info-text">2025年1月1日起实施渐进式延迟退休：</text>
    <text class="rc__info-text">· 男：60→63岁，每4个月延迟1个月</text>
    <text class="rc__info-text">· 女干部：55→58岁，每4个月延迟1个月</text>
    <text class="rc__info-text">· 女工人：50→55岁，每2个月延迟1个月</text>
  </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const POLICY = [
  { type: 'male', label: '男', originalAge: 60, targetAge: 63, delayEveryMonths: 4, delayMonths: 1 },
  { type: 'female-cadre', label: '女干部', originalAge: 55, targetAge: 58, delayEveryMonths: 4, delayMonths: 1 },
  { type: 'female-worker', label: '女工人', originalAge: 50, targetAge: 55, delayEveryMonths: 2, delayMonths: 1 },
]

const types = POLICY

const selectedType = ref('male')
const birthDate = ref('')
const result = ref(null)

function onBirthChange(e) {
  birthDate.value = e.detail.value
}

function calcRetirement(type, birthYear, birthMonth) {
  const p = POLICY.find(x => x.type === type)
  let retYear = birthYear + p.originalAge
  let retMonth = birthMonth

  if (retYear < 2025 || (retYear === 2025 && retMonth <= 1)) {
    return { retYear, retMonth, age: p.originalAge, delayed: false }
  }

  const monthsFromReform = (retYear - 2025) * 12 + (retMonth - 1)
  const periods = Math.floor(monthsFromReform / p.delayEveryMonths)
  const maxDelay = (p.targetAge - p.originalAge) * 12
  const totalDelay = Math.min(periods * p.delayMonths, maxDelay)

  let newRetMonth = birthMonth + p.originalAge * 12 + totalDelay
  let newRetYear = birthYear + Math.floor((newRetMonth - 1) / 12)
  newRetMonth = ((newRetMonth - 1) % 12) + 1

  const ageYears = newRetYear - birthYear
  const ageMonths = newRetMonth - birthMonth
  const age = ageYears + (ageMonths >= 0 ? 0 : -1)

  return { retYear: newRetYear, retMonth: newRetMonth, age: p.originalAge + Math.floor(totalDelay / 12), delayed: totalDelay > 0, delayMonths: totalDelay }
}

function computeResult() {
  if (!birthDate.value) {
    result.value = null
    return
  }
  const parts = birthDate.value.split('-')
  const birthYear = parseInt(parts[0])
  const birthMonth = parseInt(parts[1])
  result.value = calcRetirement(selectedType.value, birthYear, birthMonth)
}

const remainingText = computed(() => {
  if (!result.value) return ''
  const now = new Date()
  const retDate = new Date(result.value.retYear, result.value.retMonth - 1, 1)
  const diffMs = retDate.getTime() - now.getTime()
  if (diffMs <= 0) return '已退休'
  const totalMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44))
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  if (years > 0 && months > 0) return `${years}年${months}个月`
  if (years > 0) return `${years}年`
  return `${months}个月`
})

watch([selectedType, birthDate], () => {
  computeResult()
})
</script>

<style lang="scss" scoped>
.rc {
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
  background: #F5F5F7;
  padding: 24rpx;

  &__card {
    background: #fff;
    border-radius: 20rpx;
    padding: 28rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
    margin-bottom: 24rpx;
  }

  &__title { font-size: 36rpx; font-weight: 700; color: #1D1D1F; display: block; }
  &__subtitle { font-size: 24rpx; color: #8E8E93; margin-top: 8rpx; display: block; }
  &__label { font-size: 26rpx; color: #8E8E93; margin-bottom: 16rpx; display: block; font-weight: 500; }

  &__types { display: flex; gap: 16rpx; }
  &__type {
    flex: 1; height: 80rpx; border-radius: 12rpx;
    background: #F5F5F7; display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
    &--active { background: #1D1D1F; }
    &:active { opacity: 0.7; }
  }
  &__type-text { font-size: 28rpx; color: #3A3A3C; }
  &__type--active &__type-text { color: #fff; }

  &__picker {
    display: flex; align-items: center; justify-content: space-between;
    height: 80rpx; padding: 0 20rpx;
    background: #F5F5F7; border-radius: 12rpx;
  }
  &__picker-text { font-size: 28rpx; color: #1D1D1F; }
  &__picker-arrow { font-size: 24rpx; color: #8E8E93; }

  &__result { border-left: 8rpx solid #9C27B0; }
  &__result-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 12rpx 0;
    border-bottom: 1rpx solid #F0F0F0;
    &:last-child { border-bottom: none; }
  }
  &__result-label { font-size: 26rpx; color: #8E8E93; }
  &__result-value { font-size: 30rpx; font-weight: 600; color: #1D1D1F; }
  &__result-value--warn { color: #FF6B35; }
  &__result-value--accent { color: #9C27B0; }

  &__info { background: #F8F5FF; }
  &__info-title { font-size: 26rpx; font-weight: 600; color: #9C27B0; margin-bottom: 12rpx; display: block; }
  &__info-text { font-size: 24rpx; color: #666; line-height: 1.8; display: block; }
}
</style>
