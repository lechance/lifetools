/**
 * 工具建议页面
 * 用户可提交对现有工具的建议，或提出新工具的诉求
 * 提交至「API 设置」中配置的 HTTP 接口
 */
<template>
  <view class="suggestion">
    <view class="suggestion__header">
      <text class="suggestion__title">工具建议</text>
      <text class="suggestion__desc">欢迎提出宝贵意见，我们会认真对待每一条反馈</text>
    </view>

    <!-- 建议类型 -->
    <view class="suggestion__card">
      <text class="suggestion__label">建议类型</text>
      <view class="suggestion__types">
        <view
          class="suggestion__type"
          :class="{ 'suggestion__type--active': type === 'improve' }"
          @tap="type = 'improve'"
        >
          <text class="suggestion__type-icon">🔧</text>
          <text class="suggestion__type-name">现有工具建议</text>
          <text class="suggestion__type-desc">改进已有工具</text>
        </view>
        <view
          class="suggestion__type"
          :class="{ 'suggestion__type--active': type === 'new' }"
          @tap="type = 'new'"
        >
          <text class="suggestion__type-icon">🚀</text>
          <text class="suggestion__type-name">新工具诉求</text>
          <text class="suggestion__type-desc">期待新增工具</text>
        </view>
      </view>
    </view>

    <!-- 选择相关工具（仅现有工具建议时显示） -->
    <view v-if="type === 'improve'" class="suggestion__card">
      <text class="suggestion__label">相关工具</text>
      <picker
        mode="selector"
        :range="toolNames"
        :value="toolIndex"
        @change="onToolChange"
      >
        <view class="suggestion__picker">
          <text v-if="toolIndex >= 0" class="suggestion__picker-text">{{ toolNames[toolIndex] }}</text>
          <text v-else class="suggestion__picker-placeholder">请选择要建议的工具</text>
          <text class="suggestion__picker-arrow">›</text>
        </view>
      </picker>
    </view>

    <!-- 建议内容 -->
    <view class="suggestion__card">
      <text class="suggestion__label">
        建议内容
        <text class="suggestion__required">*</text>
      </text>
      <textarea
        v-model="content"
        class="suggestion__textarea"
        :placeholder="type === 'improve' ? '请描述您对现有工具的改进建议...' : '请描述您期待的新工具功能...'"
        placeholder-class="suggestion__placeholder"
        maxlength="500"
        :show-confirm-bar="false"
      />
      <view class="suggestion__count">{{ content.length }}/500</view>
    </view>

    <!-- 提交按钮 -->
    <button class="suggestion__submit" @tap="onSubmit">
      {{ submitting ? '提交中...' : '提交建议' }}
    </button>

    <view class="suggestion__tip">
      <text class="suggestion__tip-text">提交后建议将通过接口发送给开发者。若接口未配置，可在「我的 → API 设置」中填写提交地址。</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getAllTools } from '@/utils/tools-data'
import { getSuggestionUrl } from '@/utils/api-config'
import { showToast, showSuccess, showLoading, hideLoading } from '@/utils/helpers'

const type = ref('improve')   // improve | new
const content = ref('')

// 工具选择
const allTools = getAllTools()
const toolNames = computed(() => allTools.map(t => t.name))
const toolIndex = ref(-1)

function onToolChange(e) {
  toolIndex.value = Number(e.detail.value)
}

/** 提交建议 */
function onSubmit() {
  const text = content.value.trim()
  if (!text) {
    showToast('请填写建议内容')
    return
  }
  if (type.value === 'improve' && toolIndex.value < 0) {
    showToast('请选择相关工具')
    return
  }

  const url = getSuggestionUrl()
  if (!url) {
    showToast('尚未配置提交地址')
    return
  }

  const payload = {
    type: type.value,
    toolId: type.value === 'improve' ? allTools[toolIndex.value].id : '',
    toolName: type.value === 'improve' ? allTools[toolIndex.value].name : '',
    content: text,
    time: Date.now()
  }

  showLoading('提交中...')
  uni.request({
    url,
    method: 'POST',
    data: payload,
    timeout: 10000,
    success: (res) => {
      hideLoading()
      if (res.statusCode >= 200 && res.statusCode < 300) {
        showSuccess('提交成功，感谢您的建议')
        setTimeout(() => {
          content.value = ''
          toolIndex.value = -1
        }, 300)
      } else {
        showToast(`提交失败（${res.statusCode}）`)
      }
    },
    fail: () => {
      hideLoading()
      showToast('提交失败，请检查网络')
    }
  })
}
</script>

<style lang="scss" scoped>
.suggestion {
  min-height: 100vh;
  background: #F5F5F7;
  padding: 24rpx;

  &__header {
    padding: 16rpx 8rpx 24rpx;
  }

  &__title {
    display: block;
    font-size: 40rpx;
    font-weight: 700;
    color: #1D1D1F;
    margin-bottom: 8rpx;
  }

  &__desc {
    display: block;
    font-size: 26rpx;
    color: #86868B;
  }

  &__card {
    background: #fff;
    border-radius: 20rpx;
    padding: 28rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
    margin-bottom: 24rpx;
  }

  &__label {
    display: block;
    font-size: 30rpx;
    font-weight: 600;
    color: #1D1D1F;
    margin-bottom: 20rpx;
  }

  &__required {
    color: #FF3B30;
  }

  // 类型选择
  &__types {
    display: flex;
    gap: 20rpx;
  }

  &__type {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24rpx 16rpx;
    border-radius: 16rpx;
    background: #F5F5F7;
    border: 2rpx solid transparent;
    transition: all 0.2s;

    &--active {
      background: #F0F4FF;
      border-color: #4F6EF7;

      .suggestion__type-name {
        color: #4F6EF7;
        font-weight: 600;
      }
    }
  }

  &__type-icon {
    font-size: 48rpx;
    margin-bottom: 12rpx;
  }

  &__type-name {
    font-size: 26rpx;
    color: #1D1D1F;
    margin-bottom: 6rpx;
  }

  &__type-desc {
    font-size: 22rpx;
    color: #86868B;
  }

  // 工具选择
  &__picker {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #F5F5F7;
    border-radius: 12rpx;
    padding: 22rpx 24rpx;
  }

  &__picker-text {
    font-size: 28rpx;
    color: #1D1D1F;
  }

  &__picker-placeholder {
    font-size: 28rpx;
    color: #C7C7CC;
  }

  &__picker-arrow {
    font-size: 32rpx;
    color: #C7C7CC;
  }

  // 文本域
  &__textarea {
    width: 100%;
    min-height: 220rpx;
    background: #F5F5F7;
    border-radius: 12rpx;
    padding: 20rpx;
    font-size: 28rpx;
    color: #1D1D1F;
    box-sizing: border-box;
  }

  &__count {
    text-align: right;
    font-size: 22rpx;
    color: #C7C7CC;
    margin-top: 8rpx;
  }

  &__placeholder {
    color: #C7C7CC;
  }

  // 提交按钮
  &__submit {
    width: 100%;
    background: #1D1D1F;
    color: #fff;
    border: none;
    border-radius: 16rpx;
    font-size: 30rpx;
    padding: 22rpx 0;
    line-height: 1.4;

    &:active {
      opacity: 0.8;
    }
  }

  &__tip {
    margin-top: 24rpx;
    padding: 20rpx 24rpx;
  }

  &__tip-text {
    font-size: 22rpx;
    color: #C7C7CC;
    line-height: 1.6;
  }
}
</style>
