/**
 * 分类导航组件 - CategoryNav
 * 横向滚动的分类标签，支持切换选中状态
 * 使用：<CategoryNav :categories="categories" :active="current" @change="onChange" />
 */
<template>
  <view class="category-nav">
    <scroll-view
      class="category-nav__scroll"
      scroll-x
      show-scrollbar="false"
      enhanced
    >
      <view class="category-nav__list">
        <view
          v-for="cat in categories"
          :key="cat.key"
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
defineProps({
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

function handleChange(key) {
  emit('change', key)
}
</script>

<style lang="scss" scoped>
.category-nav {
  padding: 8rpx 0 16rpx;
  background: $bg-color;
  position: sticky;
  top: 0;
  z-index: 10;

  &__scroll {
    white-space: nowrap;
    padding: 0 16rpx;
  }

  &__list {
    display: inline-flex;
    padding: 0 8rpx;
    gap: 16rpx;
  }

  &__item {
    display: inline-flex;
    align-items: center;
    padding: 12rpx 28rpx;
    border-radius: 40rpx;
    background: $card-bg;
    box-shadow: $shadow-sm;
    transition: all 0.3s ease;

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
