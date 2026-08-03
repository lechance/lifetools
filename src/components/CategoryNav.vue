/**
 * 分类导航组件 - CategoryNav
 * 横向滚动的分类标签，固定高度，激活项自动滚动到可视区
 * 使用：<CategoryNav :categories="categories" :active="current" @change="onChange" />
 */
<template>
  <view class="category-nav">
    <scroll-view
      class="category-nav__scroll"
      scroll-x
      show-scrollbar="false"
      enhanced
      :scroll-into-view="activeId"
      scroll-with-animation
    >
      <view class="category-nav__list">
        <view
          v-for="cat in categories"
          :key="cat.key"
          :id="'cat-item-' + cat.key"
          class="category-nav__item"
          :class="{ 'category-nav__item--active': cat.key === active }"
          @tap="handleChange(cat.key)"
        >
          <text class="category-nav__text">{{ cat.name }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  categories: {
    type: Array,
    required: true
  },
  active: {
    type: String,
    default: 'hot'
  }
})

const emit = defineEmits(['change'])

// 激活项 id，用于 scroll-into-view 自动滚动到可视区
const activeId = computed(() => 'cat-item-' + props.active)

function handleChange(key) {
  emit('change', key)
}
</script>

<style lang="scss" scoped>
.category-nav {
  padding: 8rpx 0 16rpx;
  background: $bg-color;
  z-index: 10;
  box-sizing: border-box;

  &__scroll {
    white-space: nowrap;
    padding: 0 16rpx;
  }

  &__list {
    display: inline-flex;
    padding: 0 8rpx;
    gap: 16rpx;
  }

  // 固定高度 + border-box：激活态的 2rpx 边框不会改变整行高度，避免菜单抖动
  &__item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 64rpx;
    padding: 0 28rpx;
    box-sizing: border-box;
    border-radius: 40rpx;
    background: $card-bg;
    box-shadow: $shadow-sm;
    transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;

    &--active {
      background: $primary-bg;
      border: 2rpx solid $text-primary;

      .category-nav__text {
        color: $primary-color;
        font-weight: 600;
      }
    }
  }

  &__text {
    font-size: $font-size-sm;
    color: $text-secondary;
    white-space: nowrap;
  }
}
</style>
