<template>
  <view class="page">
    <view class="card">
      <text class="current-label">当前成语</text>
      <text class="current-idiom" selectable>{{ current }}</text>
      <text class="next-hint">下一个需以「{{ current ? current.slice(-1) : '?' }}」开头</text>
    </view>

    <view v-if="gameOver" class="card end-card">
      <text class="end-text">{{ gameOver }}</text>
      <view class="restart-btn" @tap="restart">重新开始</view>
    </view>

    <view v-else class="card input-card">
      <input class="input" v-model="playerInput" placeholder="输入四字成语" maxlength="4" @confirm="submitPlayer" />
      <view class="submit-btn" @tap="submitPlayer">接龙</view>
    </view>

    <view v-if="history.length" class="card">
      <text class="history-title">接龙记录</text>
      <view v-for="(item, i) in history" :key="i" class="history-item">
        <text class="history-src">{{ item.src === 'player' ? '你' : '电脑' }}</text>
        <text class="history-idiom">{{ item.text }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from '@/utils/helpers'

const IDIOMS = [
  '一心一意', '意气风发', '发扬光大', '大显身手', '手到擒来', '来日方长', '长驱直入', '入木三分',
  '分秒必争', '争分夺秒', '妙笔生花', '花好月圆', '圆木警枕', '枕戈待旦', '旦夕祸福', '福星高照',
  '照猫画虎', '虎头蛇尾', '尾大不掉', '掉以轻心', '心想事成', '成竹在胸', '胸怀大志', '志在四方',
  '方兴未艾', '艾发衰容', '容光焕发', '发人深省', '省吃俭用', '用心良苦', '苦口婆心', '心想事成',
  '全力以赴', '赴汤蹈火', '火树银花', '花言巧语', '语重心长', '长命百岁', '岁岁平安', '安居乐业',
  '业精于勤', '勤能补拙', '拙口笨舌', '舌战群儒', '如虎添翼', '异想天开', '开天辟地', '地大物博',
  '博古通今', '今非昔比', '比翼双飞', '飞黄腾达', '达官贵人', '人山人海', '海阔天空', '空穴来风',
  '风调雨顺', '顺水推舟', '舟车劳顿', '顿足捶胸', '胸有成竹', '竹报平安', '安然无恙', '样样俱全',
  '全力以赴', '赴汤蹈火', '火急火燎', '燎原烈火', '火眼金睛', '精益求精', '惊天动地', '地久天长',
  '长驱直入', '入乡随俗', '俗不可耐', '耐人寻味', '味同嚼蜡', '蜡炬成灰', '灰心丧气', '气壮山河',
  '河清海晏', '晏然自若', '若无其事', '事不宜迟', '持之以恒', '恒河沙数', '数一数二', '二话不说',
  '说三道四', '四面八方', '方方正正', '正大光明', '明察秋毫', '毫不留情', '情深似海', '海底捞月',
  '月明风清', '清风明月', '月下老人', '人定胜天', '天长地久', '久经考验', '验明正身', '身先士卒',
  '卒章显志', '志同道合', '合二为一', '一心同体', '体贴入微', '微不足道', '道听途说', '说长道短',
  '短兵相接', '接二连三', '三心二意', '意气用事', '事在人为', '为人师表', '表里如一', '一如既往',
  '往事如烟', '烟消云散', '散兵游勇', '勇往直前', '前功尽弃', '弃暗投明', '明目张胆', '胆大心细',
  '细水长流', '流芳百世', '世外桃源', '源源不断', '断章取义', '义不容辞', '辞旧迎新', '新年快乐',
]

// 按首字索引
const byFirst = {}
IDIOMS.forEach(i => {
  const first = i[0]
  if (!byFirst[first]) byFirst[first] = []
  byFirst[first].push(i)
})

const current = ref('')
const playerInput = ref('')
const history = ref([])
const gameOver = ref('')
const used = new Set()

function restart() {
  used.clear()
  history.value = []
  gameOver.value = ''
  // 电脑先出
  const start = IDIOMS[Math.floor(Math.random() * IDIOMS.length)]
  setCurrent(start, 'computer')
}

function setCurrent(text, src) {
  current.value = text
  used.add(text)
  history.value.unshift({ src, text })
}

function submitPlayer() {
  const word = playerInput.value.trim()
  playerInput.value = ''
  if (word.length !== 4) {
    showToast('请输入四字成语')
    return
  }
  if (word[0] !== current.value.slice(-1)) {
    showToast(`需以「${current.value.slice(-1)}」开头`)
    return
  }
  if (used.has(word)) {
    showToast('该成语已用过')
    return
  }
  if (!IDIOMS.includes(word)) {
    showToast('未收录该成语')
    return
  }

  setCurrent(word, 'player')

  // 电脑接龙
  const last = word.slice(-1)
  const candidates = (byFirst[last] || []).filter(i => !used.has(i))
  if (candidates.length === 0) {
    gameOver.value = `你赢了！电脑接不上「${last}」`
    return
  }
  const reply = candidates[Math.floor(Math.random() * candidates.length)]
  setCurrent(reply, 'computer')

  // 电脑出的成语，检查玩家能否接
  const replyLast = reply.slice(-1)
  const canPlayer = (byFirst[replyLast] || []).some(i => !used.has(i))
  if (!canPlayer) {
    gameOver.value = `电脑赢了！你接不上「${replyLast}」`
  }
}

// 初始化
restart()
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
.current-label {
  display: block;
  font-size: 24rpx;
  color: #86868B;
  text-align: center;
}
.current-idiom {
  display: block;
  text-align: center;
  font-size: 64rpx;
  font-weight: 700;
  color: #1D1D1F;
  letter-spacing: 12rpx;
  padding: 20rpx 0;
}
.next-hint {
  display: block;
  text-align: center;
  font-size: 24rpx;
  color: #007AFF;
}
.input-card {
  display: flex;
  gap: 16rpx;
  align-items: center;
}
.input {
  flex: 1;
  background: #F5F5F7;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  font-size: 32rpx;
  color: #1D1D1F;
  text-align: center;
}
.submit-btn {
  background: #1D1D1F;
  color: #fff;
  padding: 16rpx 40rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  &:active { opacity: 0.8; }
}
.end-card { text-align: center; }
.end-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #FF9500;
}
.restart-btn {
  margin-top: 20rpx;
  background: #1D1D1F;
  color: #fff;
  padding: 16rpx 0;
  border-radius: 12rpx;
  font-size: 28rpx;
  &:active { opacity: 0.8; }
}
.history-title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 12rpx;
}
.history-item {
  display: flex;
  justify-content: space-between;
  padding: 10rpx 0;
  border-bottom: 1rpx solid #F5F5F7;
  &:last-child { border-bottom: none; }
}
.history-src {
  font-size: 24rpx;
  color: #C7C7CC;
  min-width: 100rpx;
}
.history-idiom {
  font-size: 28rpx;
  color: #1D1D1F;
  font-weight: 500;
  letter-spacing: 4rpx;
}
</style>
