<template>
  <view class="pf">
    <camera
      v-if="isMpWeixin"
      device-position="back"
      :flash="cameraFlash"
      class="pf__camera"
    >
      <cover-view class="pf__overlay">
        <cover-view class="pf__top" @tap="togglePower">
          <cover-view class="pf__power-ring" :style="isOn ? 'border-color: #D4AF37; box-shadow: 0 0 40rpx rgba(212,175,55,0.5)' : ''">
            <cover-view class="pf__power-inner" :style="isOn ? 'background: rgba(212,175,55,0.15)' : ''">
              <cover-view class="pf__power-dot" :style="isOn ? 'background: #D4AF37' : ''" />
            </cover-view>
          </cover-view>
          <cover-view class="pf__power-label" :style="isOn ? 'color: #D4AF37' : ''">{{ isOn ? '已开启' : '点击开启' }}</cover-view>
        </cover-view>

        <cover-view class="pf__bottom">
          <cover-view class="pf__modes">
            <cover-view
              v-for="m in modes"
              :key="m.key"
              class="pf__mode"
              :style="mode === m.key ? 'background: rgba(212,175,55,0.2); border: 1rpx solid #D4AF37' : ''"
              @tap="setMode(m.key)"
            >
              <cover-view class="pf__mode-name" :style="mode === m.key ? 'color: #D4AF37' : ''">{{ m.name }}</cover-view>
            </cover-view>
          </cover-view>
          <cover-view class="pf__status">
            <cover-view class="pf__status-text">{{ isOn ? '已开启 · ' + modeLabel : 'LED闪光灯' }}</cover-view>
          </cover-view>
        </cover-view>
      </cover-view>
    </camera>

    <view v-else class="pf__h5">
      <text class="pf__h5-icon">🔦</text>
      <text class="pf__h5-text">闪光灯功能仅支持微信小程序</text>
      <text class="pf__h5-sub">请在微信中打开使用</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { onHide } from '@dcloudio/uni-app'

const isMpWeixin = ref(false)
try { isMpWeixin.value = !!uni.getSystemInfoSync().platform?.match(/ios|android/) } catch(e) {}

const modes = [
  { key: 'steady', name: '常亮' },
  { key: 'slow', name: '慢闪' },
  { key: 'fast', name: '快闪' },
]

const MODE_LABELS = { steady: '常亮', slow: '慢闪 ~1Hz', fast: '快闪 ~8Hz' }

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
  background: #000;

  &__camera {
    position: fixed;
    left: 0; top: 0; right: 0; bottom: 0;
    z-index: 0;
  }

  &__overlay {
    position: fixed;
    left: 0; top: 0; right: 0; bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 0 32rpx;
    z-index: 1;
  }

  &__top {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  &__power-ring {
    width: 200rpx;
    height: 200rpx;
    border-radius: 50%;
    border: 6rpx solid rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
  }
  &__power-inner {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background: rgba(255,255,255,0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
  }
  &__power-dot {
    width: 48rpx;
    height: 48rpx;
    border-radius: 50%;
    background: rgba(255,255,255,0.3);
    transition: all 0.3s;
  }
  &__power-label {
    margin-top: 24rpx;
    font-size: 28rpx;
    color: rgba(255,255,255,0.5);
  }

  &__bottom {
    padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
    width: 100%;
  }

  &__modes {
    display: flex;
    gap: 20rpx;
    justify-content: center;
    margin-bottom: 24rpx;
  }
  &__mode {
    width: 200rpx;
    height: 80rpx;
    border-radius: 40rpx;
    background: rgba(255,255,255,0.1);
    border: 1rpx solid rgba(255,255,255,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  &__mode-name {
    font-size: 28rpx;
    color: rgba(255,255,255,0.7);
  }

  &__status {
    text-align: center;
  }
  &__status-text {
    font-size: 24rpx;
    color: rgba(255,255,255,0.35);
  }

  &__h5 {
    min-height: 100vh;
    background: #1A1A1E;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24rpx;
  }
  &__h5-icon { font-size: 120rpx; }
  &__h5-text { font-size: 32rpx; color: rgba(255,255,255,0.7); }
  &__h5-sub { font-size: 24rpx; color: rgba(255,255,255,0.4); }
}
</style>
