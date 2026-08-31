<template>
  <view class="page">
    <view class="card search-card">
      <input class="search-input" v-model="query" placeholder="输入垃圾名称，如 矿泉水瓶" @input="search" />
    </view>

    <view v-if="result" class="card result-card" :class="'result-card--' + result.type">
      <text class="result-name">{{ result.name }}</text>
      <text class="result-type">{{ result.typeName }}</text>
      <text class="result-desc">{{ result.desc }}</text>
    </view>
    <view v-if="searched && !result" class="card result-card">
      <text class="result-empty">未找到该物品，试试其他关键词</text>
    </view>

    <view class="card">
      <text class="title">分类说明</text>
      <view v-for="type in types" :key="type.key" class="type-row" :class="'type-row--' + type.key">
        <text class="type-name">{{ type.name }}</text>
        <text class="type-desc">{{ type.desc }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const types = [
  { key: 'recyclable', name: '可回收物', color: '#007AFF', desc: '适宜回收利用的废弃物' },
  { key: 'hazardous', name: '有害垃圾', color: '#FF3B30', desc: '对人体健康或环境有害的物质' },
  { key: 'kitchen', name: '厨余垃圾', color: '#34C759', desc: '易腐烂的生物质废弃物' },
  { key: 'other', name: '其他垃圾', color: '#86868B', desc: '除上述三类外的其他生活废弃物' },
]

const ITEMS = [
  { name: '矿泉水瓶', type: 'recyclable', desc: '塑料瓶，属于可回收物' },
  { name: '易拉罐', type: 'recyclable', desc: '金属罐体，属于可回收物' },
  { name: '纸箱', type: 'recyclable', desc: '纸类制品，属于可回收物' },
  { name: '报纸', type: 'recyclable', desc: '纸张类，属于可回收物' },
  { name: '玻璃瓶', type: 'recyclable', desc: '玻璃制品，属于可回收物' },
  { name: '旧衣服', type: 'recyclable', desc: '织物类，属于可回收物' },
  { name: '旧手机', type: 'recyclable', desc: '电子产品，属于可回收物' },
  { name: '废电池', type: 'hazardous', desc: '含重金属，属于有害垃圾' },
  { name: '过期药品', type: 'hazardous', desc: '药品类，属于有害垃圾' },
  { name: '灯泡', type: 'hazardous', desc: '含汞灯管，属于有害垃圾' },
  { name: '油漆桶', type: 'hazardous', desc: '含化学成分，属于有害垃圾' },
  { name: '指甲油', type: 'hazardous', desc: '化学用品，属于有害垃圾' },
  { name: '剩饭', type: 'kitchen', desc: '剩菜剩饭，属于厨余垃圾' },
  { name: '果皮', type: 'kitchen', desc: '瓜果皮核，属于厨余垃圾' },
  { name: '菜叶', type: 'kitchen', desc: '蔬菜残留，属于厨余垃圾' },
  { name: '茶叶渣', type: 'kitchen', desc: '茶渣，属于厨余垃圾' },
  { name: '鱼骨', type: 'kitchen', desc: '动物骨骼，属于厨余垃圾' },
  { name: '烟蒂', type: 'other', desc: '烟头，属于其他垃圾' },
  { name: '尘土', type: 'other', desc: '灰尘，属于其他垃圾' },
  { name: '陶瓷碗', type: 'other', desc: '陶瓷制品，属于其他垃圾' },
  { name: '卫生纸', type: 'other', desc: '受污染的纸类，属于其他垃圾' },
  { name: '尿不湿', type: 'other', desc: '卫生用品，属于其他垃圾' },
  { name: '一次性餐具', type: 'other', desc: '受污染的塑料，属于其他垃圾' },
  { name: '头发', type: 'other', desc: '毛发，属于其他垃圾' },
  { name: '牛奶盒', type: 'recyclable', desc: '纸塑复合包装，属于可回收物' },
  { name: '泡沫箱', type: 'recyclable', desc: '泡沫塑料，属于可回收物' },
  { name: '金属罐', type: 'recyclable', desc: '金属制品，属于可回收物' },
  { name: '旧书', type: 'recyclable', desc: '纸制品，属于可回收物' },
  { name: '温度计', type: 'hazardous', desc: '含水银，属于有害垃圾' },
  { name: '杀虫剂', type: 'hazardous', desc: '化学药剂，属于有害垃圾' },
  { name: '鸡蛋壳', type: 'kitchen', desc: '蛋壳，属于厨余垃圾' },
  { name: '剩菜', type: 'kitchen', desc: '剩菜，属于厨余垃圾' },
  { name: '西瓜皮', type: 'kitchen', desc: '瓜皮，属于厨余垃圾' },
  { name: '咖啡渣', type: 'kitchen', desc: '咖啡残渣，属于厨余垃圾' },
  { name: '旧牙刷', type: 'other', desc: '清洁用品，属于其他垃圾' },
  { name: '塑料袋', type: 'other', desc: '受污染的塑料，属于其他垃圾' },
  { name: '湿纸巾', type: 'other', desc: '受污染纸张，属于其他垃圾' },
  { name: '灰烬', type: 'other', desc: '燃烧残留，属于其他垃圾' },
]

const query = ref('')
const result = ref(null)
const searched = ref(false)

const typeNameMap = { recyclable: '可回收物', hazardous: '有害垃圾', kitchen: '厨余垃圾', other: '其他垃圾' }

function search() {
  const q = query.value.trim()
  if (!q) { result.value = null; searched.value = false; return }
  searched.value = true
  const item = ITEMS.find(i => i.name.includes(q) || q.includes(i.name))
  if (item) {
    result.value = { ...item, typeName: typeNameMap[item.type] }
  } else {
    result.value = null
  }
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
.search-input {
  background: #F5F5F7;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  font-size: 28rpx;
  color: #1D1D1F;
}
.result-card { text-align: center; }
.result-name {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #1D1D1F;
}
.result-type {
  display: inline-block;
  font-size: 32rpx;
  font-weight: 600;
  padding: 8rpx 32rpx;
  border-radius: 40rpx;
  margin: 16rpx 0;
  color: #fff;
}
.result-card--recyclable .result-type { background: #007AFF; }
.result-card--hazardous .result-type { background: #FF3B30; }
.result-card--kitchen .result-type { background: #34C759; }
.result-card--other .result-type { background: #86868B; }
.result-desc { display: block; font-size: 26rpx; color: #86868B; }
.result-empty {
  font-size: 26rpx;
  color: #C7C7CC;
  display: block;
  padding: 20rpx 0;
}
.title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 16rpx;
}
.type-row {
  display: flex;
  align-items: center;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #F5F5F7;
  &:last-child { border-bottom: none; }
}
.type-name {
  font-size: 28rpx;
  font-weight: 600;
  min-width: 140rpx;
}
.type-row--recyclable .type-name { color: #007AFF; }
.type-row--hazardous .type-name { color: #FF3B30; }
.type-row--kitchen .type-name { color: #34C759; }
.type-row--other .type-name { color: #86868B; }
.type-desc { font-size: 24rpx; color: #86868B; flex: 1; text-align: right; }
</style>
