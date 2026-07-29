/**
 * 搜索框组件 - SearchBar
 * 支持输入搜索、清除、防抖
 * 使用：<SearchBar @search="handleSearch" />
 */
<template>
  <view class="search-bar">
    <view class="search-bar__inner">
      <text class="search-bar__icon">🔍</text>
      <input
        class="search-bar__input"
        :value="modelValue"
        :placeholder="placeholder"
        placeholder-class="search-bar__placeholder"
        confirm-type="search"
        @input="handleInput"
        @confirm="handleConfirm"
        @clear="handleClear"
      />
      <!-- 清除按钮 -->
      <text
        v-if="modelValue"
        class="search-bar__clear"
        @tap="handleClear"
      >✕</text>
    </view>
  </view>
</template>

<script setup>
import { debounce } from '@/utils/helpers'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '搜索工具名称...'
  }
})

const emit = defineEmits(['update:modelValue', 'search', 'clear'])

// 防抖搜索，避免频繁触发
const debouncedSearch = debounce((value) => {
  emit('search', value)
}, 300)

function handleInput(event) {
  const value = event.detail.value
  emit('update:modelValue', value)
  debouncedSearch(value)
}

function handleConfirm(event) {
  const value = event.detail.value
  emit('search', value)
}

function handleClear() {
  emit('update:modelValue', '')
  emit('search', '')
  emit('clear')
}
</script>

<style lang="scss" scoped>
.search-bar {
  padding: 20rpx 24rpx 16rpx;
  background: $bg-color;

  &__inner {
    display: flex;
    align-items: center;
    background: #fff;
    border-radius: 40rpx;
    padding: 16rpx 24rpx;
    box-shadow: $shadow-sm;
  }

  &__icon {
    font-size: 32rpx;
    margin-right: 12rpx;
  }

  &__input {
    flex: 1;
    font-size: $font-size-base;
    color: $text-primary;
    height: 48rpx;
  }

  &__placeholder {
    color: $text-light;
    font-size: $font-size-base;
  }

  &__clear {
    font-size: 28rpx;
    color: $text-light;
    padding: 4rpx 8rpx;
  }
}
</style>
