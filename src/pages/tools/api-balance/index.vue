<template>
  <view class="page">
    <view class="card">
      <view class="card__header" @tap="showConfig = !showConfig">
        <text class="card__title">平台配置</text>
        <text class="card__arrow">{{ showConfig ? '▲' : '▼' }}</text>
      </view>
      <view v-if="showConfig" class="config">
        <view v-for="p in platforms" :key="p.id" class="config__item">
          <view class="config__row">
            <switch :checked="p.enabled" color="#00BCD4" @change="p.enabled = $event.detail.value" />
            <text class="config__name">{{ p.name }}</text>
          </view>
          <view v-if="p.enabled" class="config__key-row">
            <input
              class="config__input"
              :type="p.showKey ? 'text' : 'password'"
              :value="p.apiKey"
              :placeholder="'输入 ' + p.name + ' API Key'"
              @input="p.apiKey = $event.detail.value"
            />
            <view class="config__eye" @tap="p.showKey = !p.showKey">
              {{ p.showKey ? '🙈' : '👁' }}
            </view>
          </view>
        </view>
        <button class="config__save" @tap="saveKeys">保存配置</button>
      </view>
    </view>

    <button class="query-btn" :disabled="loading || !hasEnabled" @tap="queryAll">
      {{ loading ? '查询中...' : '一键查询' }}
    </button>

    <view v-if="results.length > 0" class="results">
      <view v-for="r in results" :key="r.id" class="result-card" :style="{ borderLeftColor: r.color }">
        <view class="result-card__header">
          <text class="result-card__name">{{ r.name }}</text>
          <text v-if="r.error" class="result-card__error">查询失败</text>
          <text v-else class="result-card__time">{{ r.time }}</text>
        </view>

        <view v-if="r.error" class="result-card__error-wrap">
          <text class="result-card__error-msg">{{ r.error }}</text>
        </view>

        <view v-else-if="r.type === 'balance'" class="result-card__body">
          <view class="balance-main">
            <text class="balance-main__currency">{{ r.currency }}</text>
            <text class="balance-main__amount">{{ r.total }}</text>
          </view>
          <view class="balance-detail">
            <view class="balance-detail__row">
              <text class="balance-detail__label">赠送余额</text>
              <text class="balance-detail__value">{{ r.granted }}</text>
            </view>
            <view class="balance-detail__row">
              <text class="balance-detail__label">充值余额</text>
              <text class="balance-detail__value">{{ r.toppedUp }}</text>
            </view>
          </view>
        </view>

        <view v-else-if="r.type === 'moonshot'" class="result-card__body">
          <view class="balance-main">
            <text class="balance-main__currency">¥</text>
            <text class="balance-main__amount">{{ r.available }}</text>
          </view>
          <view class="balance-detail">
            <view class="balance-detail__row">
              <text class="balance-detail__label">代金券</text>
              <text class="balance-detail__value">¥{{ r.voucher }}</text>
            </view>
            <view class="balance-detail__row">
              <text class="balance-detail__label">现金</text>
              <text class="balance-detail__value">¥{{ r.cash }}</text>
            </view>
          </view>
        </view>

        <view v-else-if="r.type === 'quota'" class="result-card__body">
          <view class="quota-row" v-if="r.fiveHour !== null">
            <text class="quota-row__label">5小时窗口</text>
            <view class="progress">
              <view class="progress__bar" :style="{ width: r.fiveHour + '%', background: getProgressColor(r.fiveHour) }"></view>
            </view>
            <text class="quota-row__value">{{ 100 - r.fiveHour }}% 剩余</text>
          </view>
          <view class="quota-row" v-if="r.weekly !== null">
            <text class="quota-row__label">每周窗口</text>
            <view class="progress">
              <view class="progress__bar" :style="{ width: r.weekly + '%', background: getProgressColor(r.weekly) }"></view>
            </view>
            <text class="quota-row__value">{{ 100 - r.weekly }}% 剩余</text>
          </view>
          <view v-if="r.level" class="quota-info">
            <text class="quota-info__text">套餐: {{ r.level.toUpperCase() }}</text>
          </view>
          <view v-if="r.resetTime" class="quota-info">
            <text class="quota-info__text">重置: {{ r.resetTime }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="!hasEnabled && results.length === 0" class="empty">
      <text class="empty__icon">💰</text>
      <text class="empty__text">请先配置平台 API Key</text>
      <text class="empty__desc">点击上方「平台配置」添加你要查询的平台</text>
    </view>

    <view class="card tip">
      <text class="tip__text">提示：API Key 仅保存在本地，不会上传到任何服务器。查询结果仅供参考，以各平台官方数据为准。</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { showToast, showLoading, hideLoading } from '@/utils/helpers'

const STORAGE_KEY = 'lifetool_api_balance_keys'

const platforms = ref([
  { id: 'deepseek', name: 'DeepSeek', enabled: false, apiKey: '', showKey: false, color: '#4D6BFE' },
  { id: 'moonshot', name: 'Kimi', enabled: false, apiKey: '', showKey: false, color: '#000000' },
  { id: 'minimax', name: 'MiniMax', enabled: false, apiKey: '', showKey: false, color: '#2D5BFF' },
  { id: 'zhipu', name: 'GLM', enabled: false, apiKey: '', showKey: false, color: '#6A5ACD' },
])

const showConfig = ref(false)
const loading = ref(false)
const results = ref([])

const hasEnabled = computed(() => platforms.value.some(p => p.enabled && p.apiKey.trim()))

onMounted(() => {
  loadKeys()
  nextTick(() => {
    if (hasEnabled.value) {
      queryAll()
    }
  })
})

function loadKeys() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      platforms.value.forEach(p => {
        if (saved[p.id]) {
          p.apiKey = saved[p.id].apiKey || ''
          p.enabled = saved[p.id].enabled || false
        }
      })
    }
  } catch (e) {}
}

function saveKeys() {
  const data = {}
  platforms.value.forEach(p => {
    data[p.id] = { apiKey: p.apiKey, enabled: p.enabled }
  })
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(data))
    showToast('保存成功', 'success')
  } catch (e) {
    showToast('保存失败')
  }
}

function getProgressColor(usedPercent) {
  if (usedPercent >= 80) return '#FF4D4F'
  if (usedPercent >= 50) return '#FAAD14'
  return '#52C41A'
}

function formatTime(ms) {
  if (!ms) return ''
  const diff = ms - Date.now()
  if (diff <= 0) return '即将重置'
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}天${hours % 24}小时后`
  if (hours > 0) return `${hours}小时${mins % 60}分钟后`
  return `${mins}分钟后`
}

function queryAll() {
  if (loading.value) return
  loading.value = true
  results.value = []
  showLoading('查询中...')

  const enabled = platforms.value.filter(p => p.enabled && p.apiKey.trim())
  let done = 0

  enabled.forEach(p => {
    const handler = {
      deepseek: queryDeepSeek,
      moonshot: queryMoonshot,
      minimax: queryMinimax,
      zhipu: queryZhipu,
    }[p.id]

    if (!handler) {
      results.value.push({ id: p.id, name: p.name, color: p.color, error: '暂不支持该平台' })
      done++
      checkDone()
      return
    }

    handler(p.apiKey.trim(), p.name, p.color)
      .then(r => { results.value.push(r) })
      .catch(e => { results.value.push({ id: p.id, name: p.name, color: p.color, error: e.message || '查询失败' }) })
      .finally(() => { done++; checkDone() })
  })

  function checkDone() {
    if (done >= enabled.length) {
      results.value.sort((a, b) => {
        const order = { deepseek: 0, moonshot: 1, minimax: 2, zhipu: 3 }
        return (order[a.id] ?? 99) - (order[b.id] ?? 99)
      })
      loading.value = false
      hideLoading()
    }
  }
}

function queryDeepSeek(key, name, color) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: 'https://api.deepseek.com/user/balance',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + key,
        'Accept': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 401 || res.statusCode === 403) {
          reject(new Error('API Key 无效'))
          return
        }
        const data = res.data
        if (!data || !data.balance_infos || !data.balance_infos.length) {
          reject(new Error('返回数据异常'))
          return
        }
        const info = data.balance_infos[0]
        resolve({
          id: 'deepseek', name, color, type: 'balance',
          currency: info.currency || '$',
          total: info.total_balance || '0.00',
          granted: (info.granted_balance || '0.00') + ' ' + (info.currency || '$'),
          toppedUp: (info.topped_up_balance || '0.00') + ' ' + (info.currency || '$'),
          time: formatNow()
        })
      },
      fail: () => reject(new Error('网络请求失败'))
    })
  })
}

function queryMoonshot(key, name, color) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: 'https://api.moonshot.cn/v1/users/me/balance',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + key,
        'Accept': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 401 || res.statusCode === 403) {
          reject(new Error('API Key 无效'))
          return
        }
        const data = res.data
        if (!data || data.status === false || !data.data) {
          reject(new Error(data?.error?.message || '返回数据异常'))
          return
        }
        resolve({
          id: 'moonshot', name, color, type: 'moonshot',
          available: Number(data.data.available_balance || 0).toFixed(2),
          voucher: Number(data.data.voucher_balance || 0).toFixed(2),
          cash: Number(data.data.cash_balance || 0).toFixed(2),
          time: formatNow()
        })
      },
      fail: () => reject(new Error('网络请求失败'))
    })
  })
}

function queryMinimax(key, name, color) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: 'https://www.minimaxi.com/v1/token_plan/remains',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + key,
        'Accept': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 401 || res.statusCode === 403) {
          reject(new Error('API Key 无效'))
          return
        }
        const data = res.data
        if (!data || data.base_resp?.status_code !== 0) {
          reject(new Error(data?.base_resp?.status_msg || '返回数据异常'))
          return
        }
        const remains = data.model_remains
        if (!remains || !remains.length) {
          reject(new Error('无额度数据'))
          return
        }
        const general = remains.find(m => m.model_name === 'general') || remains[0]
        const fiveHour = general.current_interval_remaining_percent ?? null
        const weekly = general.current_weekly_remaining_percent ?? null
        let resetTime = ''
        if (general.end_time) {
          resetTime = formatTime(general.end_time)
        }
        resolve({
          id: 'minimax', name, color, type: 'quota',
          fiveHour, weekly, level: null, resetTime,
          time: formatNow()
        })
      },
      fail: () => reject(new Error('网络请求失败'))
    })
  })
}

function queryZhipu(key, name, color) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: 'https://open.bigmodel.cn/api/monitor/usage/quota/limit',
      method: 'GET',
      header: {
        'Authorization': key,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 401 || res.statusCode === 403) {
          reject(new Error('API Key 无效'))
          return
        }
        const data = res.data
        if (!data || data.success === false || !data.data) {
          reject(new Error(data?.msg || '返回数据异常'))
          return
        }
        const limits = data.data.limits || []
        const tokensLimits = limits.filter(l => l.type === 'TOKENS_LIMIT')
        tokensLimits.sort((a, b) => {
          if (!a.nextResetTime) return -1
          if (!b.nextResetTime) return 1
          return a.nextResetTime - b.nextResetTime
        })
        const fiveHour = tokensLimits[0]?.percentage ?? null
        const weekly = tokensLimits[1]?.percentage ?? null
        const resetTime = tokensLimits[0]?.nextResetTime ? formatTime(tokensLimits[0].nextResetTime) : ''
        resolve({
          id: 'zhipu', name, color, type: 'quota',
          fiveHour, weekly, level: data.data.level || null, resetTime,
          time: formatNow()
        })
      },
      fail: () => reject(new Error('网络请求失败'))
    })
  })
}

function formatNow() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #F5F5F7;
  padding: 24rpx;
}

.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  margin-bottom: 24rpx;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__title {
    font-size: 30rpx;
    font-weight: 600;
    color: #1D1D1F;
  }

  &__arrow {
    font-size: 24rpx;
    color: #86868B;
  }
}

.config {
  margin-top: 20rpx;

  &__item {
    padding: 16rpx 0;
    border-bottom: 1rpx solid #F0F0F0;

    &:last-child { border-bottom: none; }
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  &__name {
    font-size: 28rpx;
    color: #1D1D1F;
    font-weight: 500;
  }

  &__key-row {
    display: flex;
    align-items: center;
    margin-top: 12rpx;
    gap: 12rpx;
  }

  &__input {
    flex: 1;
    height: 72rpx;
    background: #F5F5F7;
    border-radius: 12rpx;
    padding: 0 20rpx;
    font-size: 26rpx;
    color: #1D1D1F;
  }

  &__eye {
    font-size: 32rpx;
    padding: 8rpx;
  }

  &__save {
    width: 100%;
    margin-top: 20rpx;
    background: #1D1D1F;
    color: #fff;
    border: none;
    border-radius: 16rpx;
    padding: 20rpx 0;
    font-size: 28rpx;

    &:active { opacity: 0.8; }
  }
}

.query-btn {
  width: 100%;
  background: #00BCD4;
  color: #fff;
  border: none;
  border-radius: 16rpx;
  padding: 24rpx 0;
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 24rpx;

  &:active { opacity: 0.8; }
  &[disabled] { opacity: 0.5; }
}

.results {
  margin-bottom: 24rpx;
}

.result-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  margin-bottom: 20rpx;
  border-left: 8rpx solid;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
  }

  &__name {
    font-size: 30rpx;
    font-weight: 600;
    color: #1D1D1F;
  }

  &__time {
    font-size: 22rpx;
    color: #C7C7CC;
  }

  &__error {
    font-size: 22rpx;
    color: #FF4D4F;
  }

  &__error-wrap {
    padding: 12rpx 0;
  }

  &__error-msg {
    font-size: 26rpx;
    color: #FF4D4F;
  }
}

.balance-main {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
  margin-bottom: 16rpx;

  &__currency {
    font-size: 32rpx;
    color: #86868B;
    font-weight: 600;
  }

  &__amount {
    font-size: 64rpx;
    font-weight: 700;
    color: #1D1D1F;
    font-family: monospace;
  }
}

.balance-detail {
  &__row {
    display: flex;
    justify-content: space-between;
    padding: 8rpx 0;
    border-top: 1rpx solid #F5F5F7;
  }

  &__label {
    font-size: 26rpx;
    color: #86868B;
  }

  &__value {
    font-size: 26rpx;
    color: #1D1D1F;
    font-family: monospace;
  }
}

.quota-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 12rpx 0;

  &__label {
    font-size: 26rpx;
    color: #86868B;
    min-width: 140rpx;
  }

  &__value {
    font-size: 26rpx;
    color: #1D1D1F;
    font-weight: 500;
    min-width: 140rpx;
    text-align: right;
  }
}

.progress {
  flex: 1;
  height: 16rpx;
  background: #F0F0F0;
  border-radius: 8rpx;
  overflow: hidden;

  &__bar {
    height: 100%;
    border-radius: 8rpx;
    transition: width 0.3s ease;
  }
}

.quota-info {
  padding: 8rpx 0;

  &__text {
    font-size: 24rpx;
    color: #86868B;
  }
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;

  &__icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;
  }

  &__text {
    font-size: 30rpx;
    color: #1D1D1F;
    font-weight: 600;
    margin-bottom: 8rpx;
  }

  &__desc {
    font-size: 26rpx;
    color: #86868B;
  }
}

.tip {
  &__text {
    font-size: 22rpx;
    color: #C7C7CC;
    line-height: 1.6;
  }
}
</style>
