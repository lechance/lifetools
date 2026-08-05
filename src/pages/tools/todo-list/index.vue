<template>
  <view class="page">
    <view class="card input-card">
      <input class="input" v-model="newTodo" placeholder="添加新的待办事项..." maxlength="50" confirm-type="done" @confirm="addTodo" />
      <view class="add-btn" @tap="addTodo">添加</view>
    </view>

    <view class="card">
      <view class="filters">
        <view v-for="f in filters" :key="f.key"
          class="filter-item" :class="{ 'filter-item--active': filter === f.key }"
          @tap="filter = f.key">{{ f.label }}</view>
      </view>

      <view v-if="filteredTodos.length === 0" class="empty">
        <text>暂无待办事项</text>
      </view>

      <view v-for="todo in filteredTodos" :key="todo.id" class="todo-item"
        :class="{ 'todo-item--done': todo.done }">
        <view class="todo-check" :class="{ 'todo-check--done': todo.done }" @tap="toggleTodo(todo)">
          <text v-if="todo.done">✓</text>
        </view>
        <text class="todo-text" @tap="toggleTodo(todo)">{{ todo.text }}</text>
        <text class="todo-del" @tap="removeTodo(todo.id)">✕</text>
      </view>

      <view v-if="todos.length > 0" class="clear-bar">
        <text class="clear-done" @tap="clearDone">清除已完成</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const STORAGE_KEY = 'lifetool_todo'
const newTodo = ref('')
const filter = ref('all')
const todos = ref(load())

const filters = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '待办' },
  { key: 'done', label: '已完成' },
]

const filteredTodos = computed(() => {
  if (filter.value === 'active') return todos.value.filter(t => !t.done)
  if (filter.value === 'done') return todos.value.filter(t => t.done)
  return todos.value
})

function load() {
  try {
    return JSON.parse(uni.getStorageSync(STORAGE_KEY) || '[]')
  } catch (e) {
    return []
  }
}

function save() {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(todos.value))
}

function addTodo() {
  const text = newTodo.value.trim()
  if (!text) return
  todos.value.unshift({ id: Date.now(), text, done: false, time: Date.now() })
  newTodo.value = ''
  save()
}

function toggleTodo(todo) {
  todo.done = !todo.done
  save()
}

function removeTodo(id) {
  todos.value = todos.value.filter(t => t.id !== id)
  save()
}

function clearDone() {
  todos.value = todos.value.filter(t => !t.done)
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
.input-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.input {
  flex: 1;
  background: #F5F5F7;
  border-radius: 12rpx;
  padding: 14rpx 24rpx;
  font-size: 28rpx;
  color: #1D1D1F;
}
.add-btn {
  background: #1D1D1F;
  color: #fff;
  padding: 14rpx 32rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  &:active { opacity: 0.8; }
}
.filters {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
}
.filter-item {
  padding: 8rpx 24rpx;
  background: #F5F5F7;
  border-radius: 30rpx;
  font-size: 24rpx;
  color: #3A3A3C;
  &:active { opacity: 0.7; }
  &--active {
    background: #1D1D1F;
    color: #fff;
  }
}
.empty {
  text-align: center;
  font-size: 26rpx;
  color: #C7C7CC;
  padding: 40rpx 0;
}
.todo-item {
  display: flex;
  align-items: center;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #F5F5F7;
  &:last-child { border-bottom: none; }
  &--done .todo-text {
    text-decoration: line-through;
    color: #C7C7CC;
  }
}
.todo-check {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 3rpx solid #C7C7CC;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  font-size: 28rpx;
  color: #fff;
  flex-shrink: 0;
  &--done {
    background: #34C759;
    border-color: #34C759;
  }
}
.todo-text {
  flex: 1;
  font-size: 28rpx;
  color: #1D1D1F;
}
.todo-del {
  font-size: 24rpx;
  color: #C7C7CC;
  padding: 8rpx 12rpx;
  &:active { color: #FF3B30; }
}
.clear-bar {
  border-top: 1rpx solid #F5F5F7;
  padding-top: 16rpx;
  text-align: center;
}
.clear-done {
  font-size: 24rpx;
  color: #FF3B30;
  &:active { opacity: 0.6; }
}
</style>
