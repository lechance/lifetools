<template>
  <view class="wf" :style="{ background: activeBg.css }">
    <!-- 背景闪光 -->
    <view v-if="flashActive" class="wf__flash" />

    <!-- 顶部设置按钮 -->
    <view class="wf__top-bar">
      <view class="wf__top-btn" @tap="showSettings = true">
        <text class="wf__top-icon">⚙️</text>
      </view>
    </view>

    <!-- 木鱼舞台 -->
    <view class="wf__stage" @tap="knock">
      <!-- 水波纹 -->
      <view
        v-for="r in ripples"
        :key="r.id"
        class="wf__ripple"
        :style="{ left: r.x + 'px', top: r.y + 'px' }"
      />
      <!-- 金色粒子 -->
      <view
        v-for="p in particles"
        :key="p.id"
        class="wf__particle"
        :style="{ left: p.x + 'px', top: p.y + 'px' }"
      />
      <!-- 木鱼图片 -->
      <view class="wf__fish-wrap" :key="fishKey">
        <image
          src="/static/img/wooden-fish.png"
          class="wf__fish-img"
          mode="aspectFit"
          :style="{ filter: activeSkin.filter }"
        />
      </view>
      <!-- 功德浮动（图片 or 文字） -->
      <template v-for="f in floaters" :key="f.id">
        <image
          v-if="f.useImage"
          src="/static/img/good-plus-one.png"
          class="wf__floater-img"
          :style="{ left: f.x + 'px', top: f.y + 'px' }"
        />
        <view
          v-else
          class="wf__floater"
          :style="{ left: f.x + 'px', top: f.y + 'px', color: isLightBg ? '#7B5C3F' : '#D4AF37' }"
        >{{ f.text }}</view>
      </template>
    </view>

    <!-- 计数器 -->
    <view class="wf__counter">
      <text
        class="wf__count"
        :class="{ 'wf__count--bump': bumpKey > 0 }"
        :key="bumpKey"
        :style="{ color: isLightBg ? '#3A2E23' : '#D4AF37' }"
      >{{ count }}</text>
      <text class="wf__label" :style="{ color: isLightBg ? '#807467' : 'rgba(255,255,255,0.5)' }">功德</text>
      <text v-if="kpm > 0" class="wf__kpm" :style="{ color: isLightBg ? '#A09484' : 'rgba(255,255,255,0.35)' }">{{ kpm }} 敲/分钟</text>
    </view>

    <!-- 控制栏 -->
    <view class="wf__controls">
      <view
        class="wf__ctrl"
        :class="{ 'wf__ctrl--active': autoMode }"
        :style="isLightBg ? { background: 'rgba(0,0,0,0.06)', color: '#3A2E23' } : {}"
        @tap="toggleAuto"
      >
        <text>{{ autoMode ? '⏸ 停止' : '▶ 自动' }}</text>
      </view>
      <view
        class="wf__ctrl"
        :style="isLightBg ? { background: 'rgba(0,0,0,0.06)', color: '#3A2E23' } : {}"
        @tap="resetCount"
      >
        <text>🔄 重置</text>
      </view>
    </view>

    <!-- 自动模式间隔 -->
    <view v-if="autoMode" class="wf__slider">
      <text class="wf__slider-label" :style="{ color: isLightBg ? '#807467' : 'rgba(255,255,255,0.4)' }">
        间隔 {{ autoInterval }}ms
      </text>
      <slider
        class="wf__slider-bar"
        :value="autoInterval"
        :min="300"
        :max="2000"
        :step="100"
        activeColor="#D4AF37"
        @change="onIntervalChange"
      />
    </view>

    <!-- 设置弹窗 -->
    <view v-if="showSettings" class="wf__popup">
      <view class="wf__popup-mask" @tap="showSettings = false" />
      <view class="wf__popup-body">
        <view class="wf__popup-header">
          <text class="wf__popup-title">设置</text>
          <text class="wf__popup-close" @tap="showSettings = false">✕</text>
        </view>

        <!-- 开关项 -->
        <view class="wf__setting-row">
          <text class="wf__setting-label">🔊 音效</text>
          <view class="wf__toggle" :class="{ 'wf__toggle--on': soundEnabled }" @tap="soundEnabled = !soundEnabled; saveSettings()">
            <view class="wf__toggle-dot" />
          </view>
        </view>

        <view class="wf__setting-row">
          <text class="wf__setting-label">📳 震动</text>
          <view class="wf__toggle" :class="{ 'wf__toggle--on': vibrationEnabled }" @tap="vibrationEnabled = !vibrationEnabled; saveSettings()">
            <view class="wf__toggle-dot" />
          </view>
        </view>

        <view class="wf__setting-row">
          <text class="wf__setting-label">🎭 文案模式</text>
          <view class="wf__mode-switch">
            <view
              class="wf__mode-btn"
              :class="{ 'wf__mode-btn--active': meritMode === 'zen' }"
              @tap="meritMode = 'zen'; saveSettings()"
            >佛系</view>
            <view
              class="wf__mode-btn"
              :class="{ 'wf__mode-btn--active': meritMode === 'fun' }"
              @tap="meritMode = 'fun'; saveSettings()"
            >趣味</view>
          </view>
        </view>

        <!-- 背景选择 -->
        <view class="wf__section-label">背景</view>
        <view class="wf__bg-list">
          <view
            v-for="bg in backgrounds"
            :key="bg.id"
            class="wf__bg-item"
            :class="{ 'wf__bg-item--active': activeBg.id === bg.id }"
            @tap="activeBg = bg; saveSettings()"
          >
            <view class="wf__bg-preview" :style="{ background: bg.css }" />
            <text class="wf__bg-name">{{ bg.name }}</text>
          </view>
        </view>

        <!-- 皮肤选择 -->
        <view class="wf__section-label">木鱼皮肤</view>
        <view class="wf__skin-list">
          <view
            v-for="s in skins"
            :key="s.id"
            class="wf__skin-item"
            :class="{ 'wf__skin-item--active': activeSkin.id === s.id }"
            @tap="activeSkin = s; saveSettings()"
          >
            <view class="wf__skin-preview">
              <image src="/static/img/wooden-fish.png" class="wf__skin-thumb" :style="{ filter: s.filter }" mode="aspectFit" />
            </view>
            <text class="wf__skin-name">{{ s.name }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { onShow, onHide } from '@dcloudio/uni-app'

const COUNT_KEY = 'lifetool_wooden_fish'
const SETTINGS_KEY = 'lifetool_wooden_fish_settings'

const SKINS = [
  { id: 'classic', name: '经典', filter: 'none' },
  { id: 'warm', name: '暖光', filter: 'brightness(1.15) sepia(0.3)' },
  { id: 'jade', name: '翡翠', filter: 'hue-rotate(80deg) brightness(0.9)' },
  { id: 'gold', name: '鎏金', filter: 'sepia(0.6) brightness(1.2) saturate(1.5)' },
]

const BACKGROUNDS = [
  { id: 'dark', name: '墨夜', css: '#1A1A1A', light: false },
  { id: 'cream', name: '米白', css: 'linear-gradient(180deg, #F6F1E6, #EDE5D5)', light: true },
  { id: 'ink', name: '墨青', css: 'linear-gradient(180deg, #28343B, #1E2A30)', light: false },
  { id: 'tea', name: '茶褐', css: 'linear-gradient(180deg, #3E2E1C, #2A1E12)', light: false },
  { id: 'bamboo', name: '竹林', css: 'linear-gradient(180deg, #2D3A28, #1A2418)', light: false },
]

const TEXTS_ZEN = ['平安喜乐','万事顺遂','福寿安康','身心清净','福慧增长','岁岁无忧','吉祥如意','喜乐安宁']
const TEXTS_HEAL = ['烦恼消散','放宽心念','放下执念','少忧少虑','心平气和','与己和解','慢慢释怀']
const TEXTS_FUN = ['功德+1','功德+10086','今日积善','功德满满','福报+1']

// === State ===
const count = ref(loadCount())
const kpm = ref(0)
const fishKey = ref(0)
const bumpKey = ref(0)
const flashActive = ref(false)
const showSettings = ref(false)
const autoMode = ref(false)
const autoInterval = ref(800)

const soundEnabled = ref(true)
const vibrationEnabled = ref(true)
const meritMode = ref('zen')
const activeSkin = ref(SKINS[0])
const activeBg = ref(BACKGROUNDS[0])

const skins = ref(SKINS)
const backgrounds = ref(BACKGROUNDS)
const ripples = ref([])
const floaters = ref([])
const particles = ref([])

const isLightBg = computed(() => activeBg.value.light)

let autoTimer = null
let knockTimestamps = []
let rippleId = 0
let floaterId = 0
let particleId = 0
let audio = null

// === Storage ===
function loadCount() {
  try { return parseInt(uni.getStorageSync(COUNT_KEY) || '0', 10) || 0 } catch (e) { return 0 }
}
function saveCount() {
  try { uni.setStorageSync(COUNT_KEY, String(count.value)) } catch (e) {}
}
function loadSettings() {
  try {
    const s = JSON.parse(uni.getStorageSync(SETTINGS_KEY) || '{}')
    if (s.sound !== undefined) soundEnabled.value = s.sound
    if (s.vibration !== undefined) vibrationEnabled.value = s.vibration
    if (s.meritMode) meritMode.value = s.meritMode
    if (s.skinId) activeSkin.value = SKINS.find(x => x.id === s.skinId) || SKINS[0]
    if (s.bgId) activeBg.value = BACKGROUNDS.find(x => x.id === s.bgId) || BACKGROUNDS[0]
  } catch (e) {}
}
function saveSettings() {
  try {
    uni.setStorageSync(SETTINGS_KEY, JSON.stringify({
      sound: soundEnabled.value,
      vibration: vibrationEnabled.value,
      meritMode: meritMode.value,
      skinId: activeSkin.value.id,
      bgId: activeBg.value.id,
    }))
  } catch (e) {}
}

// === Audio ===
function ensureAudio() {
  if (audio) return
  try {
    audio = uni.createInnerAudioContext()
    audio.src = '/static/audio/wooden_fish_click.mp3'
    audio.loop = false
  } catch (e) {}
}
function playSound() {
  if (!soundEnabled.value) return
  ensureAudio()
  try { audio.play() } catch (e) {}
}

// === Merit text ===
function pickMeritText() {
  let pool
  if (meritMode.value === 'fun') {
    pool = TEXTS_FUN
  } else {
    pool = Math.random() < 0.5 ? TEXTS_ZEN : TEXTS_HEAL
  }
  return pool[Math.floor(Math.random() * pool.length)]
}

// === Knock ===
function knock(e) {
  count.value++
  saveCount()
  fishKey.value++
  bumpKey.value++

  const stageRect = e?.currentTarget || {}
  const cx = (stageRect.width || 300) / 2
  const cy = (stageRect.height || 300) / 2

  // 水波纹
  const rId = ++rippleId
  ripples.value.push({ id: rId, x: cx, y: cy })
  setTimeout(() => { ripples.value = ripples.value.filter(r => r.id !== rId) }, 800)

  // 金色粒子
  for (let i = 0; i < 5; i++) {
    const pId = ++particleId
    const ox = (Math.random() - 0.5) * 140
    const oy = -(Math.random() * 80 + 20)
    particles.value.push({ id: pId, x: cx + ox, y: cy + oy })
    setTimeout(() => { particles.value = particles.value.filter(p => p.id !== pId) }, 1500)
  }

  // 功德浮动（图片 or 文字）
  const fId = ++floaterId
  const useImage = meritMode.value === 'zen' && Math.random() < 0.7
  const ox = (Math.random() - 0.5) * 80
  floaters.value.push({
    id: fId,
    x: cx + ox - (useImage ? 80 : 30),
    y: cy - 80,
    useImage,
    text: useImage ? '' : pickMeritText(),
  })
  setTimeout(() => { floaters.value = floaters.value.filter(f => f.id !== fId) }, 1500)

  // 背景闪光
  flashActive.value = true
  setTimeout(() => { flashActive.value = false }, 300)

  // 敲击速度
  const now = Date.now()
  knockTimestamps.push(now)
  knockTimestamps = knockTimestamps.filter(t => now - t < 10000)
  kpm.value = knockTimestamps.length > 1 ? Math.round((knockTimestamps.length / 10) * 60) : 0

  // 音效
  playSound()

  // 震动
  if (vibrationEnabled.value) {
    try { uni.vibrateShort({ type: 'light' }) } catch (e) {}
  }
}

// === Auto mode ===
function toggleAuto() {
  if (autoMode.value) { stopAuto() } else {
    autoMode.value = true
    autoTimer = setInterval(knock, autoInterval.value)
  }
}
function stopAuto() {
  autoMode.value = false
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null }
}
function onIntervalChange(e) {
  autoInterval.value = e.detail.value
  if (autoMode.value) { stopAuto(); autoMode.value = true; autoTimer = setInterval(knock, autoInterval.value) }
}

function resetCount() {
  count.value = 0
  kpm.value = 0
  knockTimestamps = []
  saveCount()
}

// === Lifecycle ===
onShow(() => { loadSettings() })
onHide(() => { if (autoMode.value) stopAuto() })
onUnmounted(() => { stopAuto(); try { audio && audio.destroy() } catch (e) {} })
</script>

<style lang="scss" scoped>
.wf {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 32rpx;
  position: relative;
  transition: background 0.3s;

  &__flash {
    position: fixed;
    left: 0; top: 0; right: 0; bottom: 0;
    background: radial-gradient(circle at 50% 40%, rgba(212,175,55,0.18), transparent 70%);
    pointer-events: none;
    z-index: 1;
    animation: wfFlash 0.3s ease-out forwards;
  }

  &__top-bar {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    padding: 20rpx 0;
    z-index: 10;
  }
  &__top-btn { padding: 16rpx; }
  &__top-icon { font-size: 44rpx; }

  &__stage {
    position: relative;
    width: 620rpx;
    height: 620rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
  }

  &__fish-wrap {
    animation: wfBounce 0.4s ease;
    z-index: 2;
  }
  &__fish-img {
    width: 420rpx;
    height: 420rpx;
  }

  &__ripple {
    position: absolute;
    width: 200rpx;
    height: 200rpx;
    margin-left: -100rpx;
    margin-top: -100rpx;
    border-radius: 50%;
    border: 4rpx solid rgba(212,175,55,0.4);
    animation: wfRipple 0.8s ease-out forwards;
    pointer-events: none;
    z-index: 1;
  }

  &__particle {
    position: absolute;
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: #D4AF37;
    box-shadow: 0 0 8rpx rgba(212,175,55,0.6);
    animation: wfParticle 1.5s ease-out forwards;
    pointer-events: none;
    z-index: 3;
  }

  &__floater {
    position: absolute;
    font-size: 36rpx;
    font-weight: 700;
    text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.4);
    animation: wfFloat 1.5s ease-out forwards;
    pointer-events: none;
    white-space: nowrap;
    z-index: 4;
  }
  &__floater-img {
    position: absolute;
    width: 180rpx;
    height: 180rpx;
    animation: wfFloatImg 1.5s ease-out forwards;
    pointer-events: none;
    z-index: 4;
  }

  &__counter {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 16rpx;
    z-index: 2;
  }
  &__count {
    font-size: 100rpx;
    font-weight: 700;
    line-height: 1.1;
    transition: color 0.3s;
    &--bump { animation: wfCountBump 0.25s ease; }
  }
  &__label {
    font-size: 32rpx;
    margin-top: 4rpx;
    transition: color 0.3s;
  }
  &__kpm {
    font-size: 24rpx;
    margin-top: 12rpx;
    transition: color 0.3s;
  }

  &__controls {
    display: flex;
    gap: 24rpx;
    margin-top: 36rpx;
    z-index: 2;
  }
  &__ctrl {
    padding: 20rpx 48rpx;
    border-radius: 48rpx;
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.7);
    font-size: 28rpx;
    transition: background 0.2s, color 0.2s;
    &--active {
      background: rgba(212,175,55,0.2) !important;
      color: #D4AF37 !important;
    }
    &:active { opacity: 0.6; }
  }

  &__slider {
    width: 100%;
    margin-top: 28rpx;
    padding: 0 16rpx;
    z-index: 2;
  }
  &__slider-label {
    font-size: 24rpx;
    text-align: center;
    display: block;
    margin-bottom: 8rpx;
  }
  &__slider-bar { width: 100%; }

  // ====== 设置弹窗 ======
  &__popup {
    position: fixed;
    left: 0; top: 0; right: 0; bottom: 0;
    z-index: 100;
  }
  &__popup-mask {
    position: absolute;
    left: 0; top: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
  }
  &__popup-body {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    background: #2A2A2A;
    border-radius: 24rpx 24rpx 0 0;
    padding: 32rpx 32rpx 60rpx;
    max-height: 80vh;
    overflow-y: auto;
    animation: wfSlideUp 0.25s ease-out;
  }
  &__popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28rpx;
  }
  &__popup-title { font-size: 32rpx; font-weight: 600; color: #FFF; }
  &__popup-close { font-size: 32rpx; color: rgba(255,255,255,0.5); padding: 8rpx; }

  &__setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 0;
    border-bottom: 1rpx solid rgba(255,255,255,0.06);
  }
  &__setting-label { font-size: 28rpx; color: rgba(255,255,255,0.8); }

  &__toggle {
    width: 88rpx;
    height: 48rpx;
    border-radius: 24rpx;
    background: rgba(255,255,255,0.15);
    position: relative;
    transition: background 0.2s;
    &--on { background: #D4AF37; }
  }
  &__toggle-dot {
    position: absolute;
    top: 4rpx;
    left: 4rpx;
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    background: #FFF;
    transition: transform 0.2s;
    .wf__toggle--on & { transform: translateX(40rpx); }
  }

  &__mode-switch {
    display: flex;
    gap: 8rpx;
  }
  &__mode-btn {
    padding: 8rpx 24rpx;
    border-radius: 24rpx;
    font-size: 24rpx;
    color: rgba(255,255,255,0.5);
    background: rgba(255,255,255,0.08);
    &--active {
      background: rgba(212,175,55,0.2);
      color: #D4AF37;
    }
  }

  &__section-label {
    font-size: 24rpx;
    color: rgba(255,255,255,0.4);
    margin: 24rpx 0 16rpx;
  }

  &__bg-list {
    display: flex;
    gap: 24rpx;
    flex-wrap: wrap;
  }
  &__bg-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
    &--active .wf__bg-preview {
      box-shadow: 0 0 0 4rpx #D4AF37;
    }
  }
  &__bg-preview {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    border: 2rpx solid rgba(255,255,255,0.1);
  }
  &__bg-name {
    font-size: 20rpx;
    color: rgba(255,255,255,0.5);
  }

  &__skin-list {
    display: flex;
    gap: 24rpx;
    flex-wrap: wrap;
  }
  &__skin-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
    &--active .wf__skin-preview {
      box-shadow: 0 0 0 4rpx #D4AF37;
    }
  }
  &__skin-preview {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: rgba(255,255,255,0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  &__skin-thumb {
    width: 64rpx;
    height: 64rpx;
  }
  &__skin-name {
    font-size: 20rpx;
    color: rgba(255,255,255,0.5);
  }
}

@keyframes wfBounce {
  0%   { transform: scale(1) rotate(0deg); }
  15%  { transform: scale(1.12) rotate(-2deg); }
  40%  { transform: scale(0.93) rotate(1.5deg); }
  65%  { transform: scale(1.03) rotate(-0.5deg); }
  100% { transform: scale(1) rotate(0deg); }
}

@keyframes wfRipple {
  0%   { transform: scale(0.3); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
}

@keyframes wfParticle {
  0%   { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-160rpx) scale(0); opacity: 0; }
}

@keyframes wfFloat {
  0%   { transform: translateY(0) scale(0.8); opacity: 1; }
  50%  { opacity: 1; }
  100% { transform: translateY(-240rpx) scale(1); opacity: 0; }
}

@keyframes wfFloatImg {
  0%   { transform: translateY(0) scale(0.5); opacity: 0; }
  15%  { opacity: 1; transform: translateY(-10rpx) scale(1); }
  100% { transform: translateY(-280rpx) scale(0.8); opacity: 0; }
}

@keyframes wfCountBump {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@keyframes wfFlash {
  0%   { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes wfSlideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>
