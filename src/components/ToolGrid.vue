/**
 * 工具网格组件 - ToolGrid
 * 3列网格展示工具卡片，简洁白色卡片风格，无背景色
 */
<template>
  <view class="tool-grid">
    <!-- 空状态 -->
    <view v-if="tools.length === 0" class="tool-grid__empty">
      <text class="tool-grid__empty-icon">🔍</text>
      <text class="tool-grid__empty-text">没有找到匹配的工具</text>
    </view>

    <!-- 工具网格 -->
    <view v-else class="tool-grid__list">
      <view
        v-for="tool in tools"
        :key="tool.id"
        class="tool-grid__item"
        @tap="handleTap(tool)"
      >
        <!-- 图标卡片 - 纯白色无背景色 -->
        <view class="tool-grid__card">
          <text class="tool-grid__icon">{{ tool.icon }}</text>
          <!-- 收藏心形 -->
          <text
            class="tool-grid__favorite"
            :class="{ 'tool-grid__favorite--active': isFav(tool.id) }"
            @tap.stop="handleFavorite(tool)"
          >
            {{ isFav(tool.id) ? '❤️' : '🤍' }}
          </text>
        </view>
        <!-- 工具名称 -->
        <text class="tool-grid__name">{{ tool.name }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  tools: {
    type: Array,
    default: () => []
  },
  favorites: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select', 'favorite'])

function isFav(toolId) {
  return props.favorites.includes(toolId)
}

function handleTap(tool) {
  emit('select', tool)
}

function handleFavorite(tool) {
  emit('favorite', tool)
}
</script>

<style lang="scss" scoped>
.tool-grid {
  padding: 8rpx 16rpx 20rpx;
  min-height: 300rpx;

  // 空状态
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80rpx 0;

    &-icon {
      font-size: 80rpx;
      margin-bottom: 20rpx;
    }
    &-text {
      font-size: $font-size-base;
      color: $text-light;
    }
  }

  // 网格列表
  &__list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16rpx;
  }

  // 每个工具项
  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8rpx 0;
  }

  // 工具卡片 - 纯白简约设计
  &__card {
    position: relative;
    width: 200rpx;
    height: 200rpx;
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $card-bg;
    box-shadow: $shadow-sm;
    transition: transform 0.2s;

    &:active {
      transform: scale(0.95);
    }
  }

  // 收藏按钮
  &__favorite {
    position: absolute;
    top: 8rpx;
    right: 8rpx;
    font-size: 22rpx;
    line-height: 1;
    z-index: 2;
  }

  // 图标
  &__icon {
    font-size: 64rpx;
    line-height: 1;
  }

  // 工具名称
  &__name {
    font-size: $font-size-sm;
    color: $text-primary;
    margin-top: 10rpx;
    text-align: center;
    line-height: 1.3;
    max-width: 200rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
