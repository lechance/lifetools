<template>
  <view class="page">
    <!-- 诗词卡片 -->
    <view class="poem-card" v-if="poem">
      <view class="poem-card__header">
        <text class="poem-card__title">{{ poem.title }}</text>
        <view class="poem-card__meta">
          <text class="poem-card__author">{{ poem.author.name }}</text>
          <text class="poem-card__dot">·</text>
          <text class="poem-card__dynasty">{{ poem.dynasty.name }}</text>
          <text class="poem-card__dot">·</text>
          <text class="poem-card__type">{{ poem.type.name }}</text>
        </view>
      </view>

      <view class="poem-card__body">
        <text
          class="poem-card__line"
          v-for="(line, i) in poem.content"
          :key="i"
        >{{ line }}</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="placeholder" v-else-if="loading">
      <text class="placeholder__text">加载中...</text>
    </view>

    <!-- 错误状态 -->
    <view class="placeholder" v-else-if="error">
      <text class="placeholder__text placeholder__text--error">{{ error }}</text>
    </view>

    <!-- 操作按钮 -->
    <view class="actions">
      <button class="btn btn--primary" @tap="fetchPoem">换一首</button>
      <button class="btn btn--secondary" @tap="copyPoem" :disabled="!poem">复制全文</button>
    </view>

    <!-- 提示 -->
    <view class="tip">
      <text class="tip__text">内容来源于诗泉 API，仅供学习欣赏</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast, showSuccess } from '@/utils/helpers'

const API_URL = 'https://poetry.palemoky.com/api/poems/random'

const poem = ref(null)
const loading = ref(false)
const error = ref('')

async function fetchPoem() {
  loading.value = true
  error.value = ''
  poem.value = null

  try {
    const res = await new Promise((resolve, reject) => {
      uni.request({
        url: API_URL,
        method: 'GET',
        timeout: 10000,
        success: (r) => {
          if (r.statusCode === 200 && r.data && r.data.data) {
            resolve(r.data.data)
          } else {
            reject(new Error('请求失败'))
          }
        },
        fail: () => reject(new Error('网络错误，请检查网络连接'))
      })
    })
    poem.value = res
  } catch (e) {
    error.value = e.message || '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function copyPoem() {
  if (!poem.value) return
  const lines = poem.value.content.join('\n')
  const text = `${poem.value.title}\n${poem.value.dynasty.name} · ${poem.value.author.name}\n\n${lines}`
  uni.setClipboardData({
    data: text,
    success: () => showSuccess('已复制'),
    fail: () => showToast('复制失败')
  })
}

onMounted(() => {
  fetchPoem()
})
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
  background: #F5F5F7;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.poem-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  flex: 1;
  display: flex;
  flex-direction: column;

  &__header {
    margin-bottom: 32rpx;
    padding-bottom: 24rpx;
    border-bottom: 1rpx solid #F0F0F0;
  }

  &__title {
    display: block;
    font-size: 36rpx;
    font-weight: 700;
    color: #1D1D1F;
    margin-bottom: 16rpx;
    line-height: 1.4;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  &__author {
    font-size: 26rpx;
    color: #007AFF;
  }

  &__dot {
    font-size: 24rpx;
    color: #C7C7CC;
  }

  &__dynasty,
  &__type {
    font-size: 26rpx;
    color: #86868B;
  }

  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20rpx;
  }

  &__line {
    font-size: 32rpx;
    color: #1D1D1F;
    line-height: 1.8;
    letter-spacing: 2rpx;
  }
}

.placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder__text {
  font-size: 28rpx;
  color: #86868B;

  &--error {
    color: #FF3B30;
  }
}

.actions {
  display: flex;
  gap: 20rpx;
  margin: 32rpx 0 0;
  flex-shrink: 0;
}

.btn {
  flex: 1;
  border-radius: 16rpx;
  font-size: 30rpx;
  padding: 22rpx 0;
  border: none;
  line-height: 1;

  &--primary {
    background: #1D1D1F;
    color: #fff;

    &:active {
      opacity: 0.8;
    }
  }

  &--secondary {
    background: #F0F0F0;
    color: #1D1D1F;

    &:active {
      opacity: 0.7;
    }
  }

  &[disabled] {
    opacity: 0.4;
  }
}

.tip {
  text-align: center;
  padding: 16rpx 0;
}

.tip__text {
  font-size: 22rpx;
  color: #C7C7CC;
}
</style>
