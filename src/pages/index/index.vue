/**
 * 首页 - 工具列表
 * 包含：搜索框、分类导航、工具网格、底部菜单栏
 * 支持搜索过滤、分类左右滑动切换、长按收藏
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

    <!-- 搜索模式：独立可滚动区域展示搜索结果 -->
    <scroll-view
      v-if="searchQuery"
      class="page-index__panel-scroll"
      scroll-y
      enhanced
      show-scrollbar="false"
    >
      <ToolGrid :tools="searchResults" @select="handleToolTap" @favorite="handleFavorite" />
    </scroll-view>

    <!-- 分类模式：swiper 左右滑动切换分类，高度固定占满剩余空间，面板内部各自滚动 -->
    <swiper
      v-else
      class="page-index__swiper"
      :current="categoryIndex"
      :duration="250"
      @change="onSwiperChange"
    >
      <swiper-item v-for="cat in panels" :key="cat.key" class="page-index__panel">
        <scroll-view class="page-index__panel-scroll" scroll-y enhanced show-scrollbar="false">
          <ToolGrid :tools="cat.tools" @select="handleToolTap" @favorite="handleFavorite" />
        </scroll-view>
      </swiper-item>
    </swiper>

    <!-- 底部菜单栏 -->
    <TabBar :current="currentTab" @change="handleTabChange" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useStore } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import CategoryNav from '@/components/CategoryNav.vue'
import ToolGrid from '@/components/ToolGrid.vue'
import TabBar from '@/components/TabBar.vue'
import {
  CATEGORIES,
  getToolsByCategory,
  searchTools
} from '@/utils/tools-data'
import { showToast } from '@/utils/helpers'
import { switchToTab, hideNativeTabBar } from '@/utils/tab-nav'

const store = useStore()

// 当前页面 Tab
const currentTab = ref('tools')

// 搜索关键词
const searchQuery = ref('')

// 当前分类
const currentCategory = ref(store.state.currentCategory || 'hot')

// 分类列表
const categories = CATEGORIES

// swiper 当前所在的分类索引
const categoryIndex = ref(
  Math.max(0, CATEGORIES.findIndex(c => c.key === currentCategory.value))
)

// 每个分类对应的工具面板（滑动切换的各个面板）
const panels = computed(() =>
  CATEGORIES.map(cat => ({
    key: cat.key,
    name: cat.name,
    tools: getToolsByCategory(cat.key)
  }))
)

// 搜索结果（仅搜索模式下使用）
const searchResults = computed(() => searchTools(searchQuery.value))

/** 搜索处理 */
function handleSearch(value) {
  searchQuery.value = value
}

/** 清除搜索 */
function handleClear() {
  searchQuery.value = ''
}

/** 点击分类标签切换 */
function switchCategory(key) {
  const idx = CATEGORIES.findIndex(c => c.key === key)
  categoryIndex.value = idx
  currentCategory.value = key
  store.commit('SET_CATEGORY', key)
}

/** 左右滑动切换分类 */
function onSwiperChange(e) {
  const idx = e.detail.current
  const key = CATEGORIES[idx].key
  categoryIndex.value = idx
  currentCategory.value = key
  store.commit('SET_CATEGORY', key)
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

/** 长按收藏/取消收藏 */
function handleFavorite(tool) {
  store.dispatch('toggleFavorite', tool.id)
  const isFav = store.getters.isFavorited(tool.id)
  // 轻震反馈
  if (uni.vibrateShort) uni.vibrateShort({ type: 'light' })
  showToast(isFav ? '已收藏' : '已取消收藏', 'none')
}

/** 底部Tab切换 - 微信原生 tabBar 保活，H5 reLaunch */
function handleTabChange(key) {
  if (key === 'tools') return
  switchToTab(key)
}

onShow(() => {
  hideNativeTabBar()
})

onMounted(() => {
  // 初始化时从 store 同步当前分类与 swiper 索引
  currentCategory.value = store.state.currentCategory || 'hot'
  const idx = CATEGORIES.findIndex(c => c.key === currentCategory.value)
  categoryIndex.value = idx >= 0 ? idx : 0
})
</script>

<style lang="scss" scoped>
.page-index {
  display: flex;
  flex-direction: column;
  height: 100vh;
  box-sizing: border-box;
  background: $bg-color;
  overflow: hidden;
  // 预留底部固定 TabBar（110rpx 内容 + 安全区），swiper 占满其上方空间
  padding-bottom: calc(110rpx + env(safe-area-inset-bottom, 0px));

  // swiper：占满搜索栏与底栏之间的剩余空间，高度固定 → 滑动无裁剪、无抖动
  &__swiper {
    flex: 1;
    min-height: 0;
    width: 100%;
  }

  &__panel {
    height: 100%;
  }

  // 分类面板 / 搜索结果的内部滚动区
  &__panel-scroll {
    height: 100%;
  }
}
</style>
