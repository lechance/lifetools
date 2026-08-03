<template>
  <view class="page">
    <view class="card">
      <view class="row">
        <text class="label">身份证号</text>
        <input class="input" v-model="id" placeholder="18位身份证号" maxlength="18" @input="parse" />
      </view>
    </view>

    <view v-if="result" class="card result-card">
      <view class="result-item" v-if="result.valid">
        <text class="result-label">校验结果</text>
        <text class="result-val ok">✓ 号码有效</text>
      </view>
      <view class="result-item" v-else>
        <text class="result-label">校验结果</text>
        <text class="result-val bad">✗ 号码无效</text>
      </view>
      <view class="result-item">
        <text class="result-label">所属省份</text>
        <text class="result-val">{{ result.province }}</text>
      </view>
      <view class="result-item">
        <text class="result-label">出生日期</text>
        <text class="result-val">{{ result.birthday }}<text v-if="!result.dateValid" class="bad">（日期无效）</text></text>
      </view>
      <view class="result-item">
        <text class="result-label">性别</text>
        <text class="result-val">{{ result.gender }}</text>
      </view>
      <view class="result-item">
        <text class="result-label">年龄</text>
        <text class="result-val">{{ result.age === '—' ? '—' : result.age + ' 岁' }}</text>
      </view>
      <view class="result-item">
        <text class="result-label">星座</text>
        <text class="result-val">{{ result.zodiac }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const PROVINCES = {
  '11': '北京', '12': '天津', '13': '河北', '14': '山西', '15': '内蒙古',
  '21': '辽宁', '22': '吉林', '23': '黑龙江',
  '31': '上海', '32': '江苏', '33': '浙江', '34': '安徽', '35': '福建', '36': '江西', '37': '山东',
  '41': '河南', '42': '湖北', '43': '湖南', '44': '广东', '45': '广西', '46': '海南',
  '50': '重庆', '51': '四川', '52': '贵州', '53': '云南', '54': '西藏',
  '61': '陕西', '62': '甘肃', '63': '青海', '64': '宁夏', '65': '新疆',
  '71': '台湾', '81': '香港', '82': '澳门',
}

const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
const CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']

const ZODIACS = [
  { key: 120, name: '水瓶座' }, { key: 219, name: '双鱼座' }, { key: 321, name: '白羊座' },
  { key: 420, name: '金牛座' }, { key: 521, name: '双子座' }, { key: 622, name: '巨蟹座' },
  { key: 723, name: '狮子座' }, { key: 823, name: '处女座' }, { key: 923, name: '天秤座' },
  { key: 1024, name: '天蝎座' }, { key: 1123, name: '射手座' }, { key: 1222, name: '摩羯座' },
]

const id = ref('')
const result = ref(null)

function parse() {
  const val = id.value.trim()
  if (val.length < 18) { result.value = null; return }
  if (val.length > 18) { id.value = val.slice(0, 18); return }

  const valid = validate(val)
  const birth = val.slice(6, 14)
  const year = parseInt(birth.slice(0, 4), 10)
  const month = parseInt(birth.slice(4, 6), 10)
  const day = parseInt(birth.slice(6, 8), 10)
  const genderCode = parseInt(val[16], 10)
  // 出生日期合法性校验
  const daysInMonth = new Date(year, month, 0).getDate()
  const dateValid = year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth

  result.value = {
    valid,
    province: PROVINCES[val.slice(0, 2)] || '未知',
    birthday: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    gender: genderCode % 2 === 1 ? '男' : '女',
    age: dateValid ? calcAge(year, month, day) : '—',
    zodiac: getZodiac(month, day),
    dateValid,
  }
}

function validate(id18) {
  if (!/^\d{17}[\dXx]$/.test(id18)) return false
  let sum = 0
  for (let i = 0; i < 17; i++) sum += parseInt(id18[i], 10) * WEIGHTS[i]
  const check = CHECK_CODES[sum % 11]
  return check === id18[17].toUpperCase()
}

function calcAge(y, m, d) {
  const now = new Date()
  let age = now.getFullYear() - y
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--
  return age
}

function getZodiac(m, d) {
  const val = m * 100 + d
  let name = '摩羯座'
  for (const z of ZODIACS) {
    if (val >= z.key) name = z.name
  }
  return name
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
  font-size: 30rpx;
  width: 300rpx;
  text-align: center;
  color: #1D1D1F;
  font-family: monospace;
}
.result-item {
  display: flex;
  justify-content: space-between;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #F5F5F7;
  &:last-child { border-bottom: none; }
}
.result-label { font-size: 26rpx; color: #86868B; }
.result-val { font-size: 28rpx; color: #1D1D1F; font-weight: 500; }
.ok { color: #34C759; }
.bad { color: #FF3B30; }
</style>
