<template>
  <view class="fullscreen">
    <view
      class="fullscreen__color"
      :style="{
        backgroundColor: currentColor,
        opacity: opacity
      }"
      @tap="toggleFromFullscreen"
    />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 从本地存储加载设置
const STORAGE_KEY = 'photo-filter-settings'

// 响应式状态
const activeKey = ref('milky')
const opacity = ref(0.85)
const warmth = ref(0)

// 韩系滤镜预设
const filters = [
  { key: 'milky',     label: '奶白',     color: '#FFF8F0' },
  { key: 'peach',     label: '蜜桃',     color: '#FFD4B8' },
  { key: 'sakura',    label: '樱花',     color: '#FFB7C5' },
  { key: 'mint',      label: '薄荷',     color: '#B8E8D0' },
  { key: 'lavender',  label: '薰衣草',   color: '#D4B8E8' },
  { key: 'milktea',   label: '奶茶',     color: '#E8D4B8' },
  { key: 'mistblue',  label: '雾霾蓝',   color: '#B8D4E8' },
  { key: 'warmsun',   label: '暖阳',     color: '#FFE8B8' },
]

// 计算属性
const currentFilter = computed(() => {
  return filters.find(f => f.key === activeKey.value) || filters[0]
})

const currentColor = computed(() => {
  const base = currentFilter.value.color
  const r = parseInt(base.slice(1, 3), 16)
  const g = parseInt(base.slice(3, 5), 16)
  const b = parseInt(base.slice(5, 7), 16)
  const w = warmth.value
  const nr = Math.min(255, Math.max(0, r + w))
  const ng = Math.min(255, Math.max(0, g))
  const nb = Math.min(255, Math.max(0, b - w))
  return `rgb(${nr}, ${ng}, ${nb})`
})

// 加载设置
function loadSettings() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data.activeKey) activeKey.value = data.activeKey
      if (data.opacity !== undefined) opacity.value = data.opacity
      if (data.warmth !== undefined) warmth.value = data.warmth
    }
  } catch (e) {}
}

// 从全屏返回
function toggleFromFullscreen() {
  uni.navigateBack()
}

// 生命周期钩子
onMounted(() => {
  loadSettings()
})
</script>

<style lang="scss" scoped>
.fullscreen {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;

  &__color {
    height: 100vh;
    width: 100vw;
    transition: background-color 0.3s ease, opacity 0.3s ease;
    cursor: pointer;
  }
}
</style>
