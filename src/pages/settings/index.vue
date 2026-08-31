<template>
  <view class="settings">
    <view class="settings__header">
      <text class="settings__title">API 设置</text>
      <text class="settings__desc">配置各工具的 API Key，留空则使用免费公共接口</text>
    </view>

    <view class="settings__list">
      <view class="settings__item">
        <text class="settings__item-label">天气 API Key</text>
        <view class="settings__input-wrap">
          <input
            class="settings__input"
            :type="showWeather ? 'text' : 'password'"
            :value="weatherKey"
            placeholder="留空使用免费接口 wttr.in"
            @input="weatherKey = $event.detail.value"
            @focus="onFocus"
          />
          <view class="settings__eye" @tap="showWeather = !showWeather">{{ showWeather ? '🙈' : '👁' }}</view>
        </view>
      </view>
      <view class="settings__item">
        <text class="settings__item-label">历史上的今天 API Key</text>
        <view class="settings__input-wrap">
          <input
            class="settings__input"
            :type="showHistory ? 'text' : 'password'"
            :value="historyKey"
            placeholder="留空使用免费接口 xxapi.cn"
            @input="historyKey = $event.detail.value"
            @focus="onFocus"
          />
          <view class="settings__eye" @tap="showHistory = !showHistory">{{ showHistory ? '🙈' : '👁' }}</view>
        </view>
      </view>
      <view class="settings__item">
        <text class="settings__item-label">诗泉 API Key</text>
        <view class="settings__input-wrap">
          <input
            class="settings__input"
            :type="showPoetry ? 'text' : 'password'"
            :value="poetryKey"
            placeholder="留空使用免费接口 poetry.palemoky.com"
            @input="poetryKey = $event.detail.value"
            @focus="onFocus"
          />
          <view class="settings__eye" @tap="showPoetry = !showPoetry">{{ showPoetry ? '🙈' : '👁' }}</view>
        </view>
      </view>
      <view class="settings__item">
        <text class="settings__item-label">汇率 API Key</text>
        <view class="settings__input-wrap">
          <input
            class="settings__input"
            :type="showExchange ? 'text' : 'password'"
            :value="exchangeKey"
            placeholder="留空使用免费接口 er-api.com"
            @input="exchangeKey = $event.detail.value"
            @focus="onFocus"
          />
          <view class="settings__eye" @tap="showExchange = !showExchange">{{ showExchange ? '🙈' : '👁' }}</view>
        </view>
      </view>
    </view>

    <view class="settings__actions">
      <button class="settings__btn settings__btn--save" @tap="onSave">保存配置</button>
      <button class="settings__btn settings__btn--reset" @tap="onReset">恢复默认</button>
    </view>

    <view class="settings__tip">
      <text class="settings__tip-text">提示：所有配置项均可留空，工具会自动使用免费公共接口。如需更稳定的服务，可申请对应平台的 API Key 后填写。所有值默认以密文显示，点击 👁 可切换明文。</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getConfig, saveConfig, resetConfig } from '@/utils/api-config'
import { showSuccess } from '@/utils/helpers'

const weatherKey = ref('')
const historyKey = ref('')
const poetryKey = ref('')
const exchangeKey = ref('')

// 明文显示开关，默认全部隐藏
const showWeather = ref(false)
const showHistory = ref(false)
const showPoetry = ref(false)
const showExchange = ref(false)

onMounted(() => {
  const saved = getConfig()
  if (saved.weather) weatherKey.value = saved.weather.apiKey || ''
  if (saved.todayInHistory) historyKey.value = saved.todayInHistory.apiKey || ''
  if (saved.ancientPoetry) poetryKey.value = saved.ancientPoetry.apiKey || ''
  if (saved.exchangeRate) exchangeKey.value = saved.exchangeRate.apiKey || ''
})

function onFocus() {}

function onSave() {
  saveConfig({
    weather: { apiKey: weatherKey.value },
    todayInHistory: { apiKey: historyKey.value },
    ancientPoetry: { apiKey: poetryKey.value },
    exchangeRate: { apiKey: exchangeKey.value },
  })
  showSuccess('保存成功')
}

function onReset() {
  resetConfig()
  weatherKey.value = ''
  historyKey.value = ''
  poetryKey.value = ''
  exchangeKey.value = ''
  showSuccess('已恢复默认')
}
</script>

<style lang="scss" scoped>
.settings {
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
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

  &__list {
    background: #fff;
    border-radius: 20rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
    margin-bottom: 32rpx;
  }

  &__item {
    padding: 28rpx 28rpx;
    border-bottom: 1rpx solid #F0F0F0;

    &:last-child {
      border-bottom: none;
    }
  }

  &__item-label {
    display: block;
    font-size: 30rpx;
    font-weight: 600;
    color: #1D1D1F;
    margin-bottom: 16rpx;
  }

  &__input-wrap {
    position: relative;
  }

  &__input {
    width: 100%;
    height: 88rpx;
    background: #F5F5F7;
    border-radius: 12rpx;
    padding: 0 76rpx 0 20rpx;
    font-size: 30rpx;
    color: #1D1D1F;
    box-sizing: border-box;
  }

  &__eye {
    position: absolute;
    top: 50%;
    right: 16rpx;
    transform: translateY(-50%);
    font-size: 32rpx;
    padding: 8rpx;
    line-height: 1;
  }

  &__actions {
    display: flex;
    gap: 20rpx;
    margin-bottom: 24rpx;
  }

  &__btn {
    flex: 1;
    border-radius: 16rpx;
    font-size: 30rpx;
    padding: 22rpx 0;
    border: none;
    line-height: 1;

    &--save {
      background: #1D1D1F;
      color: #fff;

      &:active {
        opacity: 0.8;
      }
    }

    &--reset {
      background: #F0F0F0;
      color: #1D1D1F;

      &:active {
        opacity: 0.7;
      }
    }
  }

  &__tip {
    background: #fff;
    border-radius: 20rpx;
    padding: 24rpx 28rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  }

  &__tip-text {
    font-size: 24rpx;
    color: #86868B;
    line-height: 1.6;
  }
}
</style>
