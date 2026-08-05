/**
 * 我的收藏页面
 * 展示已收藏的工具，支持搜索过滤，长按取消收藏
 */
<template>
  <view class="page-favorites">
    <!-- 搜索框（有收藏时才显示） -->
    <SearchBar
      v-if="favoriteTools.length > 0"
      v-model="searchQuery"
      @search="handleSearch"
      @clear="handleClear"
    />

    <!-- 无收藏空态 -->
    <view v-if="favoriteTools.length === 0" class="page-favorites__empty">
      <text class="page-favorites__empty-icon">⭐</text>
      <text class="page-favorites__empty-title">还没有收藏的工具</text>
      <text class="page-favorites__empty-desc">在首页长按工具即可收藏</text>
    </view>

    <!-- 有收藏：工具网格 -->
    <ToolGrid
      v-else
      :tools="displayedTools"
      @select="handleToolTap"
      @favorite="handleFavorite"
    />

    <!-- 收藏使用说明：置于页面最底部 -->
    <view v-if="favoriteTools.length > 0" class="page-favorites__notice">
      <view class="page-favorites__notice-header">
        <text class="page-favorites__notice-icon">💡</text>
        <text class="page-favorites__notice-title">使用说明</text>
      </view>
      <view class="page-favorites__notice-body">
        <text class="page-favorites__notice-text">1. 点击工具即可打开使用</text>
        <text class="page-favorites__notice-text">2. 长按工具 1 秒可取消收藏</text>
        <text class="page-favorites__notice-text">3. 在首页长按工具 1 秒即可收藏</text>
        <text class="page-favorites__notice-text">4. 支持在搜索框输入关键词筛选收藏的工具</text>
      </view>
    </view>

    <!-- 底部菜单栏 -->
    <TabBar current="favorites" @change="handleTabChange" />

    <!-- 底部占位 -->
    <view class="page-favorites__bottom-placeholder"></view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import ToolGrid from '@/components/ToolGrid.vue'
import TabBar from '@/components/TabBar.vue'
import { getToolById } from '@/utils/tools-data'
import { showToast } from '@/utils/helpers'

const store = useStore()

// 搜索关键词
const searchQuery = ref('')

// 收藏的工具对象列表
const favoriteTools = computed(() =>
  store.state.favorites.map(id => getToolById(id)).filter(Boolean)
)

// 过滤后的收藏工具（支持搜索）
const displayedTools = computed(() => {
  const tools = favoriteTools.value
  if (!searchQuery.value.trim()) return tools
  const q = searchQuery.value.trim().toLowerCase()
  return tools.filter(tool =>
    tool.name.toLowerCase().includes(q) ||
    tool.id.toLowerCase().includes(q)
  )
})

/** 搜索处理 */
function handleSearch(value) {
  searchQuery.value = value
}

/** 清除搜索 */
function handleClear() {
  searchQuery.value = ''
}

/** 点击工具 */
function handleToolTap(tool) {
  if (!tool || !tool.path) {
    showToast('工具数据异常，请重试')
    return
  }
  // 记录使用
  store.dispatch('recordUsage', {
    toolId: tool.id,
    toolName: tool.name
  })
  // 跳转到工具页面
  uni.navigateTo({
    url: tool.path
  })
}

/** 长按取消收藏 */
function handleFavorite(tool) {
  store.dispatch('toggleFavorite', tool.id)
  const isFav = store.getters.isFavorited(tool.id)
  // 轻震反馈
  if (uni.vibrateShort) uni.vibrateShort({ type: 'light' })
  showToast(isFav ? '已收藏' : '已取消收藏', 'none')
}

/** 底部Tab切换 - 使用 reLaunch 清除页面栈 */
function handleTabChange(key) {
  if (key === 'favorites') return
  if (key === 'tools') {
    uni.reLaunch({ url: '/pages/index/index' })
  } else if (key === 'coupons') {
    uni.reLaunch({ url: '/pages/coupons/index' })
  } else if (key === 'profile') {
    uni.reLaunch({ url: '/pages/profile/index' })
  }
}
</script>

<style lang="scss" scoped>
.page-favorites {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: $bg-color;

  // 空状态
  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 160rpx 40rpx;

    &-icon {
      font-size: 100rpx;
      margin-bottom: 24rpx;
    }
    &-title {
      font-size: $font-size-lg;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 12rpx;
    }
    &-desc {
      font-size: $font-size-sm;
      color: $text-secondary;
    }
  }

  // 收藏使用说明：margin-top: auto 使其始终位于页面最底部
  &__notice {
    margin: auto 24rpx 24rpx;
    background: $card-bg;
    border-radius: $radius-md;
    padding: 24rpx;
    box-shadow: $shadow-sm;

    &-header {
      display: flex;
      align-items: center;
      margin-bottom: 16rpx;
    }

    &-icon {
      font-size: 36rpx;
      margin-right: 12rpx;
    }

    &-title {
      font-size: $font-size-md;
      font-weight: 600;
      color: $text-primary;
    }

    &-body {
      display: flex;
      flex-direction: column;
      gap: 12rpx;
    }

    &-text {
      font-size: $font-size-sm;
      color: $text-secondary;
      line-height: 1.5;
    }
  }

  // 底部占位
  &__bottom-placeholder {
    height: 140rpx;
  }
}
</style>
