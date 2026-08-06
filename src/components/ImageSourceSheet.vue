<template>
  <view v-if="visible" class="sheet-mask" @tap="close">
    <view class="sheet-dialog" @tap.stop>
      <view class="sheet-title">选择图片来源</view>
      <view class="sheet-option" @tap="emitSelect('camera')">
        <text class="sheet-option-icon">📷</text>
        <text class="sheet-option-text">拍摄</text>
      </view>
      <view class="sheet-option" @tap="emitSelect('album')">
        <text class="sheet-option-icon">🖼️</text>
        <text class="sheet-option-text">从相册选择</text>
      </view>
      <view class="sheet-option" v-if="canPickMessageFile" @tap="emitSelect('message')">
        <text class="sheet-option-icon">💬</text>
        <text class="sheet-option-text">从聊天记录选择</text>
      </view>
      <view class="sheet-cancel" @tap="close">取消</view>
    </view>
  </view>
</template>

<script setup>
// 通用选源弹窗：拍摄 / 从相册选择 / 从聊天记录选择（仅微信小程序）
// 用法：<ImageSourceSheet :visible="show" @select="onSourceSelect" @close="show = false" />
import { ref } from 'vue'

defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select', 'close'])

// 仅微信小程序支持从聊天记录选图
const canPickMessageFile = ref(false)
// #ifdef MP-WEIXIN
canPickMessageFile.value = true
// #endif

function emitSelect(source) {
  emit('select', source)
}

function close() {
  emit('close')
}
</script>

<style lang="scss" scoped>
// ====== 居中图片来源选择对话框 ======
.sheet-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sheet-dialog {
  width: 560rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx 0 0;
  overflow: hidden;
}
.sheet-title {
  text-align: center;
  font-size: 28rpx;
  font-weight: 600;
  color: #1D1D1F;
  padding: 0 32rpx 24rpx;
}
.sheet-option {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  height: 96rpx;
  font-size: 28rpx;
  color: #1D1D1F;
  border-top: 1rpx solid #F0F0F2;

  &:active {
    background: #F5F5F7;
  }
}
.sheet-option-icon {
  font-size: 32rpx;
}
.sheet-cancel {
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #8E8E93;
  border-top: 12rpx solid #F5F5F7;

  &:active {
    background: #F5F5F7;
  }
}
</style>
