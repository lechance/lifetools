<template>
  <view class="pf">
    <camera v-if="isMpWeixin" device-position="back" :flash="cameraFlash" class="pf__camera" />

    <view v-else class="pf__h5-fallback">
      <text class="pf__h5-icon">🔦</text>
      <text class="pf__h5-text">闪光灯功能仅支持微信小程序</text>
      <text class="pf__h5-sub">请在微信中打开使用</text>
    </view>

    <view class="pf__panel" v-if="isMpWeixin">
      <view class="pf__power-row">
        <view class="pf__power-btn" :class="{ 'pf__power-btn--on': isOn }" @tap="togglePower">
          <text class="pf__power-icon">{{ isOn ? '💡' : '⭕' }}</text>
        </view>
      </view>
      <view class="pf__modes">
        <view v-for="m in modes" :key="m.key" class="pf__mode" :class="{ 'pf__mode--active': mode === m.key }" @tap="setMode(m.key)">
          <text class="pf__mode-icon">{{ m.icon }}</text>
          <text class="pf__mode-name">{{ m.name }}</text>
        </view>
      </view>
      <view class="pf__status">
        <text class="pf__status-text">{{ isOn ? '已开启 · ' + modeLabel : '已关闭' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { onHide } from '@dcloudio/uni-app'

const isMpWeixin = ref(false)
try { isMpWeixin.value = !!uni.getSystemInfoSync().platform?.match(/ios|android/) } catch(e) {}

const modes = [
  { key: 'steady', name: '常亮', icon: '💡' },
  { key: 'slow', name: '慢闪', icon: '🔅' },
  { key: 'fast', name: '快闪', icon: '⚡' },
]

const MODE_LABELS = { steady: '常亮', slow: '慢闪', fast: '快闪' }

const isOn = ref(false)
const mode = ref('steady')
const cameraFlash = ref('off')
const modeLabel = computed(() => MODE_LABELS[mode.value])

let flashTimer = null

function togglePower() {
  isOn.value = !isOn.value
  if (isOn.value) {
    startFlash()
    uni.setKeepScreenOn({ keepScreenOn: true })
  } else {
    stopFlash()
    uni.setKeepScreenOn({ keepScreenOn: false })
  }
}

function setMode(m) {
  mode.value = m
  if (isOn.value) { stopFlash(); startFlash() }
}

function startFlash() {
  if (mode.value === 'steady') {
    cameraFlash.value = 'torch'
  } else {
    const interval = mode.value === 'slow' ? 500 : 125
    let on = true
    cameraFlash.value = 'torch'
    flashTimer = setInterval(() => {
      on = !on
      cameraFlash.value = on ? 'torch' : 'off'
    }, interval)
  }
}

function stopFlash() {
  cameraFlash.value = 'off'
  if (flashTimer) { clearInterval(flashTimer); flashTimer = null }
}

onHide(() => { if (isOn.value) { isOn.value = false; stopFlash(); uni.setKeepScreenOn({ keepScreenOn: false }) } })
onUnmounted(() => { stopFlash(); uni.setKeepScreenOn({ keepScreenOn: false }) })
</script>

<style lang="scss" scoped>
.pf {
  min-height: 100vh;
  background: #1A1A1E;
  display: flex;
  flex-direction: column;
  
  &__camera {
    width: 100%;
    height: 60vh;
  }
  
  &__h5-fallback {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24rpx;
  }
  &__h5-icon { font-size: 120rpx; }
  &__h5-text { font-size: 32rpx; color: rgba(255,255,255,0.7); }
  &__h5-sub { font-size: 24rpx; color: rgba(255,255,255,0.4); }
  
  &__panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32rpx;
    gap: 40rpx;
  }
  
  &__power-row { display: flex; justify-content: center; }
  &__power-btn {
    width: 120rpx; height: 120rpx; border-radius: 50%;
    background: rgba(255,255,255,0.08);
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
    &--on { background: rgba(212,175,55,0.3); box-shadow: 0 0 30rpx rgba(212,175,55,0.4); }
    &:active { transform: scale(0.9); }
  }
  &__power-icon { font-size: 56rpx; }
  
  &__modes { display: flex; gap: 24rpx; }
  &__mode {
    width: 160rpx; height: 140rpx; border-radius: 20rpx;
    background: rgba(255,255,255,0.06);
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8rpx;
    transition: all 0.2s;
    &--active { background: rgba(212,175,55,0.2); border: 2rpx solid #D4AF37; }
    &:active { opacity: 0.7; }
  }
  &__mode-icon { font-size: 40rpx; }
  &__mode-name { font-size: 24rpx; color: rgba(255,255,255,0.7); }
  
  &__status { margin-top: 16rpx; }
  &__status-text { font-size: 24rpx; color: rgba(255,255,255,0.4); }
}
</style>
