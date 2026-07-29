/**
 * 首页 - 工具列表
 * 包含：搜索框、分类导航、工具网格、底部菜单栏
 * 支持搜索过滤、分类切换、收藏
 */
<template>
  <view class="page-index">
    <!-- 顶部搜索框 -->
    <SearchBar
      v-model="searchQuery"
      @search="handleSearch"
      @clear="handleClear"
    />

    <!-- 分类导航标签 -->
    <CategoryNav
      :categories="categories"
      :active="currentCategory"
      @change="switchCategory"
    />

    <!-- 最近使用（当 searchQuery 为空且在热门分类下时显示） -->
    <view v-if="!searchQuery && currentCategory === 'hot' && recentList.length > 0" class="page-index__section">
      <view class="page-index__section-header">
        <text class="page-index__section-title">🕐 最近使用</text>
      </view>
      <scroll-view class="page-index__recent-scroll" scroll-x show-scrollbar="false">
        <view
          v-for="tool in recentList"
          :key="tool.id"
          class="page-index__recent-item"
          @tap="handleToolTap(tool)"
        >
          <view class="page-index__recent-icon">
            <text>{{ tool.icon }}</text>
          </view>
          <text class="page-index__recent-name">{{ tool.name }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 工具网格 -->
    <ToolGrid
      :tools="filteredTools"
      :favorites="favorites"
      @tap="handleToolTap"
      @favorite="handleFavorite"
    />

    <!-- 底部菜单栏 -->
    <TabBar :current="currentTab" @change="handleTabChange" />

    <!-- 底部占位（防止内容被 TabBar 遮挡） -->
    <view class="page-index__bottom-placeholder"></view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import CategoryNav from '@/components/CategoryNav.vue'
import ToolGrid from '@/components/ToolGrid.vue'
import TabBar from '@/components/TabBar.vue'
import {
  CATEGORIES,
  getToolsByCategory,
  searchTools,
  getToolById
} from '@/utils/tools-data'
import { addRecord, getRecords } from '@/utils/storage'
import { showToast } from '@/utils/helpers'

const store = useStore()

// 当前页面 Tab
const currentTab = ref('tools')

// 搜索关键词
const searchQuery = ref('')

// 当前分类
const currentCategory = ref(store.state.currentCategory || 'hot')

// 分类列表
const categories = CATEGORIES

// 收藏列表
const favorites = computed(() => store.state.favorites)

// 最近使用记录（前10条）
const recentList = computed(() => {
  const records = store.state.records || getRecords()
  // 获取前5条不同工具的记录
  const seen = new Set()
  const tools = []
  for (const record of records) {
    if (!seen.has(record.toolId) && tools.length < 5) {
      seen.add(record.toolId)
      const tool = getToolById(record.toolId)
      if (tool) tools.push(tool)
    }
  }
  return tools
})

// 过滤后的工具列表
const filteredTools = computed(() => {
  if (searchQuery.value) {
    return searchTools(searchQuery.value)
  }
  return getToolsByCategory(currentCategory.value)
})

/** 搜索处理 */
function handleSearch(value) {
  searchQuery.value = value
}

/** 清除搜索 */
function handleClear() {
  searchQuery.value = ''
}

/** 切换分类 */
function switchCategory(key) {
  currentCategory.value = key
  store.commit('SET_CATEGORY', key)
}

/** 点击工具 */
function handleToolTap(tool) {
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

/** 收藏/取消收藏 */
function handleFavorite(tool) {
  store.dispatch('toggleFavorite', tool.id)
  const isFav = store.getters.isFavorited(tool.id)
  showToast(isFav ? '已收藏' : '已取消收藏', 'none')
}

/** 底部Tab切换 - 使用 reLaunch 清除页面栈 */
function handleTabChange(key) {
  if (key === 'tools') return
  if (key === 'coupons') {
    uni.reLaunch({ url: '/pages/coupons/index' })
  } else if (key === 'profile') {
    uni.reLaunch({ url: '/pages/profile/index' })
  }
}

onMounted(() => {
  // 初始化时从 store 同步当前分类
  currentCategory.value = store.state.currentCategory || 'hot'
})
</script>

<style lang="scss" scoped>
.page-index {
  min-height: 100vh;
  background: $bg-color;

  // 区域标题
  &__section {
    padding: 0 24rpx 8rpx;

    &-header {
      padding: 8rpx 0 12rpx;
    }
    &-title {
      font-size: $font-size-md;
      font-weight: 600;
      color: $text-primary;
    }
  }

  // 最近使用横向滚动
  &__recent-scroll {
    white-space: nowrap;
    padding-bottom: 12rpx;
  }

  &__recent-item {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    margin-right: 24rpx;
    width: 120rpx;
  }

  &__recent-icon {
    width: 100rpx;
    height: 100rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 44rpx;
    background: $card-bg;
    box-shadow: $shadow-sm;
  }

  &__recent-name {
    font-size: 20rpx;
    color: $text-secondary;
    margin-top: 8rpx;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
  }

  // 底部占位
  &__bottom-placeholder {
    height: 120rpx;
  }
}
</style>
