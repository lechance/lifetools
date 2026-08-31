<template>
  <view class="page">
    <view class="card">
      <view class="row">
        <text class="label">金额（元）</text>
        <input class="input" type="digit" v-model="amount" placeholder="如 1234.56" />
      </view>
      <button class="btn" @tap="convert">转大写</button>
    </view>

    <view v-if="result" class="card result-card">
      <text class="result-title">人民币大写</text>
      <text class="result-text" selectable>{{ result }}</text>
      <text class="copy" @tap="copy">复制</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { showToast, showSuccess } from '@/utils/helpers'

const amount = ref('')
const result = ref('')

const CN_NUMS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
const CN_INT_UNITS = ['', '拾', '佰', '仟']
const CN_BIG_UNITS = ['', '万', '亿', '万亿']

function convert() {
  const val = parseFloat(amount.value)
  if (isNaN(val) || val < 0 || val > 99999999999999.99) {
    showToast('请输入有效金额（0 ~ 99999999999999.99）')
    return
  }
  result.value = numberToChinese(val)
}

function numberToChinese(num) {
  // 分离整数和小数
  const parts = num.toFixed(2).split('.')
  const intPart = parseInt(parts[0], 10)
  const decPart = parts[1]

  let intStr = intPart === 0 ? '零' : convertInt(intPart)
  let result = intStr + '元'

  const jiao = parseInt(decPart[0], 10)
  const fen = parseInt(decPart[1], 10)

  if (jiao === 0 && fen === 0) {
    result += '整'
  } else {
    if (jiao > 0) result += CN_NUMS[jiao] + '角'
    if (fen > 0) result += CN_NUMS[fen] + '分'
  }
  return result
}

function convertInt(n) {
  if (n === 0) return '零'
  let str = ''
  let bigIdx = 0
  let lowerSection = 0 // 已拼入 str 的最低位段数值，用于判断是否需补零
  while (n > 0) {
    const section = n % 10000
    if (section !== 0) {
      // 存在空档（更低段为0）或更低段不足四位（<1000）时补零
      if (str && (lowerSection === 0 || lowerSection < 1000)) {
        str = '零' + str
      }
      str = convertSection(section) + CN_BIG_UNITS[bigIdx] + str
      lowerSection = section
    } else {
      lowerSection = 0
    }
    n = Math.floor(n / 10000)
    bigIdx++
  }
  return str
}

function convertSection(n) {
  let str = ''
  let unitIdx = 0
  let zeroPending = false
  while (n > 0) {
    const digit = n % 10
    if (digit === 0) {
      zeroPending = str !== ''
    } else {
      if (zeroPending) str = '零' + str
      zeroPending = false
      str = CN_NUMS[digit] + CN_INT_UNITS[unitIdx] + str
    }
    n = Math.floor(n / 10)
    unitIdx++
  }
  return str
}

function copy() {
  uni.setClipboardData({
    data: result.value,
    success: () => showSuccess('已复制')
  })
}
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
  background: #F5F5F7;
  padding: 24rpx;
}
.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  margin-bottom: 24rpx;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #F5F5F7;
}
.label { font-size: 28rpx; color: #1D1D1F; }
.input {
  background: #F5F5F7;
  border-radius: 12rpx;
  padding: 10rpx 24rpx;
  font-size: 28rpx;
  width: 260rpx;
  text-align: center;
}
.btn {
  width: 100%;
  margin-top: 24rpx;
  background: #1D1D1F;
  color: #fff;
  border: none;
  border-radius: 16rpx;
  padding: 20rpx 0;
  font-size: 30rpx;
  &:active { opacity: 0.8; }
}
.result-card { text-align: center; }
.result-title {
  font-size: 24rpx;
  color: #86868B;
}
.result-text {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: #1D1D1F;
  line-height: 1.6;
  padding: 24rpx 0;
  letter-spacing: 4rpx;
}
.copy {
  display: inline-block;
  font-size: 26rpx;
  color: #007AFF;
  padding: 8rpx 32rpx;
  &:active { opacity: 0.6; }
}
</style>
