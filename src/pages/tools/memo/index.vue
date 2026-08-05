<template>
  <view class="page">
    <view class="card editor" v-if="editing !== null">
      <text class="editor-label">{{ editing === -1 ? '新建备忘' : '编辑备忘' }}</text>
      <textarea class="editor-input" v-model="draft" placeholder="输入备忘内容..." maxlength="500" />
      <view class="editor-actions">
        <view class="btn btn--ghost" @tap="cancelEdit">取消</view>
        <view class="btn btn--primary" @tap="saveEdit">保存</view>
      </view>
    </view>

    <view v-else class="card add-card" @tap="startNew">
      <text class="add-plus">＋</text>
      <text class="add-text">新建备忘录</text>
    </view>

    <view v-if="memos.length === 0" class="empty">
      <text>暂无备忘，点击上方新建</text>
    </view>

    <view v-for="memo in memos" :key="memo.id" class="card memo-item" @tap="startEdit(memo)">
      <text class="memo-text">{{ memo.text }}</text>
      <view class="memo-footer">
        <text class="memo-time">{{ formatTime(memo.time) }}</text>
        <text class="memo-del" @tap.stop="deleteMemo(memo.id)">删除</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const STORAGE_KEY = 'lifetool_memo'
const memos = ref(load())
const editing = ref(null)   // -1 新建, id 编辑
const draft = ref('')

function load() {
  try {
    return JSON.parse(uni.getStorageSync(STORAGE_KEY) || '[]')
  } catch (e) {
    return []
  }
}

watch(memos, (val) => {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(val))
}, { deep: true })

function formatTime(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function startNew() {
  editing.value = -1
  draft.value = ''
}
function startEdit(memo) {
  editing.value = memo.id
  draft.value = memo.text
}
function cancelEdit() {
  editing.value = null
  draft.value = ''
}
function saveEdit() {
  const text = draft.value.trim()
  if (!text) return
  if (editing.value === -1) {
    memos.value.unshift({ id: Date.now(), text, time: Date.now() })
  } else {
    const m = memos.value.find(x => x.id === editing.value)
    if (m) { m.text = text; m.time = Date.now() }
  }
  editing.value = null
  draft.value = ''
  save()
}
function deleteMemo(id) {
  memos.value = memos.value.filter(m => m.id !== id)
  save()
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
.add-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  border: 2rpx dashed #C7C7CC;
  box-shadow: none;
  &:active { background: #FAFAFA; }
}
.add-plus { font-size: 36rpx; color: #007AFF; }
.add-text { font-size: 28rpx; color: #007AFF; }
.editor-label {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 16rpx;
}
.editor-input {
  width: 100%;
  min-height: 200rpx;
  background: #F5F5F7;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #1D1D1F;
  box-sizing: border-box;
}
.editor-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}
.btn {
  flex: 1;
  padding: 18rpx 0;
  border-radius: 12rpx;
  font-size: 28rpx;
  text-align: center;
  &:active { opacity: 0.8; }
  &--primary { background: #1D1D1F; color: #fff; }
  &--ghost { background: #F5F5F7; color: #3A3A3C; }
}
.empty {
  text-align: center;
  font-size: 26rpx;
  color: #C7C7CC;
  padding: 60rpx 0;
}
.memo-item { &:active { background: #FAFAFA; } }
.memo-text {
  display: block;
  font-size: 28rpx;
  color: #1D1D1F;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
.memo-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #F5F5F7;
}
.memo-time { font-size: 22rpx; color: #C7C7CC; }
.memo-del {
  font-size: 24rpx;
  color: #FF3B30;
  &:active { opacity: 0.6; }
}
</style>
