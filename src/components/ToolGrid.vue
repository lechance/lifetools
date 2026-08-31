/**
 * 工具网格组件 - ToolGrid
 * 3列网格展示工具卡片，图标 + 名称同格子，无背景/边框
 * 点击打开工具，长按1秒收藏/取消收藏
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
        @touchstart="onTouchStart(tool)"
        @touchend="onTouchEnd"
        @touchcancel="onTouchEnd"
        @touchmove="onTouchMove"
      >
        <!-- 图标（最大化）+ 名称，无背景卡片 -->
        <image v-if="tool.iconImage" :src="tool.iconImage" class="tool-grid__icon-img" mode="aspectFit" />
        <text v-else class="tool-grid__icon">{{ tool.icon }}</text>
        <text class="tool-grid__name">{{ tool.name }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onBeforeUnmount } from 'vue'

const props = defineProps({
  tools: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select', 'favorite'])

// 长按收藏时长（毫秒）
const LONG_PRESS_MS = 1000

let longPressTimer = null
let longPressTool = null
let longPressed = false

function clearLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

/** 按下：启动3秒定时器，到时触发收藏 */
function onTouchStart(tool) {
  clearLongPress()
  longPressTool = tool
  longPressed = false
  longPressTimer = setTimeout(() => {
    longPressed = true
    emit('favorite', tool)
  }, LONG_PRESS_MS)
}

/** 抬起/取消：取消定时器 */
function onTouchEnd() {
  clearLongPress()
}

/** 移动：视为非长按，取消定时器 */
function onTouchMove() {
  clearLongPress()
}

function handleTap(tool) {
  // 若本次按压已触发过长按收藏，抑制 tap，避免同时跳转页面
  if (longPressed) {
    longPressed = false
    return
  }
  emit('select', tool)
}

onBeforeUnmount(clearLongPress)
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

  // 每个工具项：图标 + 名称同格子，无背景/边框
  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20rpx 0 24rpx;
    transition: transform 0.2s;

    &:active {
      transform: scale(0.9);
    }
  }

  // 图标 - 最大化
  &__icon {
    font-size: 100rpx;
    line-height: 1.2;
  }

  &__icon-img {
    width: 130rpx;
    height: 130rpx;
  }

  // 工具名称
  &__name {
    font-size: $font-size-sm;
    color: $text-primary;
    margin-top: 12rpx;
    text-align: center;
    line-height: 1.3;
    max-width: 100%;
    padding: 0 8rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
