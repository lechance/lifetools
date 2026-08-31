<template>
  <view class="gp">
    <!-- 加载中 -->
    <view v-if="loading && !goldData" class="gp__loading">
      <view class="gp__loading-spinner" />
      <text class="gp__loading-text">获取金价中...</text>
    </view>

    <!-- 错误 -->
    <view v-else-if="error" class="gp__error">
      <text class="gp__error-icon">⚠️</text>
      <text class="gp__error-text">{{ error }}</text>
      <view class="gp__retry" @tap="fetchPrice">重试</view>
    </view>

    <!-- 金价数据 -->
    <view v-else-if="goldData" class="gp__content">
      <!-- 国内金价 -->
      <view class="gp__card gp__card--primary">
        <text class="gp__card-label">上海黄金现货</text>
        <view class="gp__price-row">
          <text class="gp__currency">¥</text>
          <text class="gp__price">{{ goldData.price }}</text>
          <text class="gp__unit">/克</text>
        </view>
        <text class="gp__update">更新于 {{ goldData.updateTime }}</text>
      </view>

      <!-- 国际金价 -->
      <view class="gp__card gp__card--secondary">
        <text class="gp__card-label">国际金价 (XAU/USD)</text>
        <view class="gp__price-row">
          <text class="gp__currency gp__currency--usd">$</text>
          <text class="gp__price gp__price--secondary">{{ goldData.intlPrice }}</text>
          <text class="gp__unit">/盎司</text>
        </view>
      </view>

      <!-- 克↔盎司换算 -->
      <view class="gp__card gp__card--calc">
        <text class="gp__card-label">快速换算</text>
        <view class="gp__calc-row">
          <text class="gp__calc-label">克</text>
          <input
            v-model="gramInput"
            class="gp__calc-input"
            type="digit"
            placeholder="输入克数"
            @input="calcOz"
          />
          <text class="gp__calc-eq">≈</text>
          <text class="gp__calc-result">{{ ozResult }} 盎司</text>
        </view>
        <view class="gp__calc-row">
          <text class="gp__calc-label">盎司</text>
          <input
            v-model="ozInput"
            class="gp__calc-input"
            type="digit"
            placeholder="输入盎司数"
            @input="calcGram"
          />
          <text class="gp__calc-eq">≈</text>
          <text class="gp__calc-result">{{ gramResult }} 克</text>
        </view>
      </view>

      <!-- 手动刷新 -->
      <view class="gp__refresh" @tap="fetchPrice">
        <text>{{ loading ? '刷新中...' : '🔄 刷新' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { showToast } from '@/utils/helpers'
import { cachedFetch } from '@/utils/api-cache'

const goldData = ref(null)
const loading = ref(false)
const error = ref('')
const gramInput = ref('')
const ozInput = ref('')
const ozResult = ref('0')
const gramResult = ref('0')

let refreshTimer = null

const PRIMARY_API = 'https://api.freejk.com/shuju/jinjia/'
const FALLBACK_API = 'https://api.goldprice.dev/v1/prices?symbol=XAU-USD-SPOT'

async function fetchPrice() {
  if (loading.value) return
  loading.value = true
  error.value = ''

  try {
    // 尝试主 API（国内金价）
    const res = await cachedFetch(PRIMARY_API, {}, 60000)
    if (res && res.status === 'success' && res.data) {
      goldData.value = {
        price: Number(res.data.price).toFixed(2),
        intlPrice: Number(res.data.international_price).toFixed(2),
        updateTime: res.data.update_time || '--',
      }
      loading.value = false
      return
    }
  } catch (e) {}

  try {
    // 备用 API（国际金价）
    const res = await cachedFetch(FALLBACK_API, {}, 60000)
    if (res && res.symbols && res.symbols[0]) {
      const s = res.symbols[0]
      goldData.value = {
        price: '--',
        intlPrice: Number(s.price).toFixed(2),
        updateTime: s.computed_at ? new Date(s.computed_at).toLocaleString('zh-CN') : '--',
      }
      loading.value = false
      return
    }
  } catch (e) {}

  error.value = '获取金价失败，请稍后重试'
  loading.value = false
}

function calcOz() {
  const g = parseFloat(gramInput.value)
  ozResult.value = isNaN(g) ? '0' : (g / 31.1035).toFixed(4)
}
function calcGram() {
  const oz = parseFloat(ozInput.value)
  gramResult.value = isNaN(oz) ? '0' : (oz * 31.1035).toFixed(2)
}

onMounted(() => {
  fetchPrice()
  refreshTimer = setInterval(fetchPrice, 120000)
})
onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style lang="scss" scoped>
.gp {
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
  background: $bg-color;
  padding: 24rpx;

  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 200rpx 0;
  }
  &__loading-spinner {
    width: 60rpx;
    height: 60rpx;
    border: 6rpx solid $border-color;
    border-top-color: $primary-color;
    border-radius: 50%;
    animation: gpSpin 0.8s linear infinite;
  }
  &__loading-text {
    font-size: 28rpx;
    color: $text-secondary;
    margin-top: 24rpx;
  }

  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 200rpx 0;
  }
  &__error-icon { font-size: 64rpx; margin-bottom: 16rpx; }
  &__error-text { font-size: 28rpx; color: $text-secondary; margin-bottom: 24rpx; }
  &__retry {
    padding: 16rpx 48rpx;
    background: $primary-color;
    color: #FFF;
    border-radius: $radius-md;
    font-size: 28rpx;
    &:active { opacity: 0.7; }
  }

  &__card {
    background: $card-bg;
    border-radius: $radius-md;
    box-shadow: $shadow-sm;
    padding: 32rpx;
    margin-bottom: 24rpx;
    &--primary {
      background: linear-gradient(135deg, #FFF8E1, #FFFDE7);
      border: 1rpx solid rgba(212,175,55,0.2);
    }
    &--calc { padding: 24rpx 32rpx; }
  }
  &__card-label {
    font-size: 24rpx;
    color: $text-secondary;
    display: block;
    margin-bottom: 12rpx;
  }

  &__price-row {
    display: flex;
    align-items: baseline;
  }
  &__currency {
    font-size: 36rpx;
    font-weight: 600;
    color: #D4AF37;
    margin-right: 8rpx;
    &--usd { color: $text-secondary; }
  }
  &__price {
    font-size: 72rpx;
    font-weight: 700;
    color: #D4AF37;
    line-height: 1.1;
    &--secondary { font-size: 48rpx; color: $text-primary; }
  }
  &__unit {
    font-size: 26rpx;
    color: $text-light;
    margin-left: 8rpx;
  }
  &__update {
    font-size: 22rpx;
    color: $text-light;
    margin-top: 12rpx;
    display: block;
  }

  &__calc-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-top: 16rpx;
  }
  &__calc-label {
    font-size: 26rpx;
    color: $text-secondary;
    width: 64rpx;
  }
  &__calc-input {
    flex: 1;
    background: $primary-bg;
    border-radius: $radius-sm;
    padding: 16rpx 20rpx;
    font-size: 28rpx;
    color: $text-primary;
  }
  &__calc-eq {
    font-size: 28rpx;
    color: $text-light;
  }
  &__calc-result {
    font-size: 28rpx;
    color: $text-primary;
    font-weight: 600;
    min-width: 140rpx;
    text-align: right;
  }

  &__refresh {
    text-align: center;
    padding: 24rpx;
    color: $text-secondary;
    font-size: 28rpx;
    &:active { opacity: 0.6; }
  }
}

@keyframes gpSpin {
  to { transform: rotate(360deg); }
}
</style>
