<template>
  <view class="wf" :style="{ background: bgStyle }">
    <!-- 顶部统计 -->
    <view class="wf__top">
      <view class="wf__hamburger" @tap="showSettings = true">
        <view class="wf__hamburger-line" />
        <view class="wf__hamburger-line" />
        <view class="wf__hamburger-line" />
      </view>
    </view>
    <view class="wf__stats">
      <view class="wf__stat">
        <text class="wf__stat-num">{{ today }}</text>
        <text class="wf__stat-lbl">今日</text>
      </view>
      <view class="wf__stat-divider" />
      <view class="wf__stat">
        <text class="wf__stat-num">{{ total }}</text>
        <text class="wf__stat-lbl">累计</text>
      </view>
      <view class="wf__stat-divider" />
      <view class="wf__stat">
        <text class="wf__stat-num">{{ bestCombo }}</text>
        <text class="wf__stat-lbl">最高连击</text>
      </view>
    </view>

    <!-- 木鱼舞台 -->
    <view
      class="wf__stage"
      :style="{ width: canvasW + 'px', height: canvasH + 'px' }"
      @touchstart="onPress"
      @touchend="onRelease"
      @touchcancel="onRelease"
      @touchmove.stop="noop"
      @tap="knock"
    >
      <view v-if="flashActive" class="wf__flash" />

      <!-- 金色粒子 -->
      <view
        v-for="p in particles"
        :key="p.id"
        class="wf__particle"
        :style="{ left: p.x + 'px', top: p.y + 'px', animationDuration: p.dur + 'ms', background: accent, boxShadow: '0 0 8rpx ' + accent }"
      />

      <!-- 功德飘字 -->
      <view
        v-for="f in floaters"
        :key="f.id"
        class="wf__floater"
        :style="{ left: f.x + 'px', top: f.y + 'px', color: accent }"
      >功德 +1</view>

      <!-- 里程碑弹词 -->
      <view v-if="milestoneText" :key="msKey" class="wf__milestone">
        <text class="wf__milestone-text" :style="{ color: accent }">{{ milestoneText }}</text>
      </view>

      <!-- 木鱼图（含 idle 浮动与按压态） -->
      <view
        class="wf__fish-wrap"
        :class="{ 'wf__fish-wrap--pressed': pressed }"
      >
        <view
          class="wf__fish-inner"
          :key="bumpKey"
          :style="{ filter: skin.filter }"
        >
          <image
            class="wf__fish-img"
            src="/static/img/wooden-fish-body.png"
            mode="aspectFit"
          />
        </view>
      </view>
    </view>

    <!-- 计数器 -->
    <view class="wf__counter">
      <view class="wf__combo" :class="{ 'wf__combo--show': combo >= 2 }">
        <text class="wf__combo-text" :style="{ color: accent }">连击 ×{{ combo }}</text>
      </view>
      <text
        class="wf__count"
        :class="{ 'wf__count--bump': bumpKey > 0, 'wf__count--long': total >= 100000 }"
        :key="'c' + bumpKey"
        :style="{ color: accent, textShadow: '0 0 24rpx ' + accentSoft }"
      >{{ total }}</text>
      <text class="wf__label">功 德</text>
      <text v-if="kpm > 0" class="wf__kpm">{{ kpm }} 敲 / 分钟</text>
    </view>

    <!-- 底部工具条 -->
    <view class="wf__bar">
      <view class="wf__btn" :class="{ 'wf__btn--on': zen }" @tap="toggleZen">
        <text class="wf__btn-icon">{{ zen ? '⏸' : '🧘' }}</text>
        <text class="wf__btn-text">{{ zen ? '停止' : '禅模式' }}</text>
      </view>
    </view>

    <text v-if="showHint" class="wf__hint">轻敲木鱼，静心积德</text>

    <!-- 设置面板 -->
    <view v-if="showSettings" class="wf__mask" @tap="showSettings = false">
      <view class="wf__panel" @tap.stop="noop">
        <view class="wf__panel-head">
          <text class="wf__panel-title">设置</text>
          <text class="wf__panel-close" @tap="showSettings = false">✕</text>
        </view>

        <text class="wf__section">外观色调</text>
        <view class="wf__skins">
          <view
            v-for="s in FILTERS"
            :key="s.id"
            class="wf__skin"
            :class="{ 'wf__skin--on': settings.skin === s.id }"
            @tap="pickSkin(s.id)"
          >
            <view class="wf__skin-dot" :style="{ background: s.preview }" />
            <text class="wf__skin-name">{{ s.name }}</text>
          </view>
        </view>

        <text class="wf__section">敲击反馈</text>
        <view class="wf__row" @tap="toggle('sound')">
          <text class="wf__row-label">音效</text>
          <view class="wf__switch" :class="{ 'wf__switch--on': settings.sound }">
            <view class="wf__switch-knob" />
          </view>
        </view>
        <view class="wf__row" @tap="toggle('vibration')">
          <text class="wf__row-label">振动</text>
          <view class="wf__switch" :class="{ 'wf__switch--on': settings.vibration }">
            <view class="wf__switch-knob" />
          </view>
        </view>

        <text class="wf__section">禅模式速度</text>
        <view class="wf__speeds">
          <view
            v-for="(sp, i) in ZEN_SPEEDS"
            :key="i"
            class="wf__speed"
            :class="{ 'wf__speed--on': settings.zenSpeed === i }"
            @tap="pickSpeed(i)"
          >
            <text class="wf__speed-name">{{ sp.name }}</text>
            <text class="wf__speed-desc">{{ sp.desc }}</text>
          </view>
        </view>

        <view class="wf__danger" @tap="resetCount">
          <text class="wf__danger-text">清空功德</text>
        </view>
        <text class="wf__tip">清空后累计与今日功德归零，最高连击记录保留</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { onHide, onShow } from '@dcloudio/uni-app'
import { debounce, showModal, showToast } from '@/utils/helpers'

const KEY = 'lifetool_wooden_fish'

/** 外观色调（CSS filter 实现，不依赖 3D） */
const FILTERS = [
  {
    id: 'warm', name: '暖橙', preview: '#E0A24A',
    filter: 'none',
    accent: '#E8B062', accentSoft: 'rgba(232,176,98,0.35)',
    bg1: '#33231A', bg2: '#181512'
  },
  {
    id: 'amber', name: '暗金', preview: '#A87A3A',
    filter: 'brightness(0.78) sepia(0.55) hue-rotate(-12deg) saturate(1.25)',
    accent: '#D8B070', accentSoft: 'rgba(216,176,112,0.35)',
    bg1: '#2A1F12', bg2: '#15110A'
  },
  {
    id: 'jade', name: '冷青', preview: '#7AA899',
    filter: 'hue-rotate(110deg) saturate(0.55) brightness(0.95)',
    accent: '#9CC8BE', accentSoft: 'rgba(156,200,190,0.35)',
    bg1: '#1F2A28', bg2: '#101413'
  },
  {
    id: 'ink', name: '素描', preview: '#7C7C7C',
    filter: 'grayscale(0.85) contrast(1.08) brightness(0.95)',
    accent: '#C8C8C8', accentSoft: 'rgba(200,200,200,0.30)',
    bg1: '#262626', bg2: '#111111'
  }
]

/** 禅模式速度档位（毫秒） */
const ZEN_SPEEDS = [
  { name: '慢', desc: '1.2 秒', ms: 1200 },
  { name: '中', desc: '0.7 秒', ms: 700 },
  { name: '快', desc: '0.4 秒', ms: 400 }
]

/** 功德里程碑 */
const MILESTONES = [
  [10, '心诚则灵'],
  [50, '福报渐至'],
  [108, '功德圆满'],
  [500, '心如止水'],
  [1000, '明心见性'],
  [5000, '超凡入圣'],
  [10000, '立地成佛']
]

const DEFAULTS = {
  total: 0,
  today: 0,
  todayKey: '',
  bestCombo: 0,
  skin: 'warm',
  sound: true,
  vibration: true,
  zenSpeed: 1,
  msIdx: -1,
  updatedAt: 0
}

// ===== 状态 =====
const settings = reactive({ ...DEFAULTS })
const combo = ref(0)
const bumpKey = ref(0)
const kpm = ref(0)
const zen = ref(false)
const showHint = ref(true)
const showSettings = ref(false)
const flashActive = ref(false)
const pressed = ref(false)
const particles = ref([])
const floaters = ref([])
const milestoneText = ref('')
const msKey = ref(0)
const canvasW = ref(300)
const canvasH = ref(300)
const noop = () => {}

const skin = computed(() => FILTERS.find(s => s.id === settings.skin) || FILTERS[0])
const accent = computed(() => skin.value.accent)
const accentSoft = computed(() => skin.value.accentSoft)
const bgStyle = computed(
  () => `radial-gradient(ellipse at 50% 24%, ${skin.value.bg1} 0%, ${skin.value.bg2} 68%)`
)
const total = computed(() => settings.total)
const today = computed(() => settings.today)
const bestCombo = computed(() => settings.bestCombo)

// ===== 模块级变量 =====
let particleId = 0
let floaterId = 0
let flashTimer = null
let msTimer = null
let zenTimer = null
let comboTimer = null
let knockStamps = []
let lastKnockAt = 0
let audio = null

// ===== 存储 =====
function loadSettings() {
  let raw = ''
  try { raw = uni.getStorageSync(KEY) || '' } catch (e) {}
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      Object.assign(settings, DEFAULTS, parsed)
      return
    }
  } catch (e) {}
  const n = parseInt(raw, 10)
  if (!isNaN(n)) settings.total = n
}

const persist = debounce(() => {
  settings.updatedAt = Date.now()
  try { uni.setStorageSync(KEY, JSON.stringify(settings)) } catch (e) {}
}, 400)

function saveNow() {
  settings.updatedAt = Date.now()
  try { uni.setStorageSync(KEY, JSON.stringify(settings)) } catch (e) {}
}

// ===== 日期 =====
function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}
function ensureToday() {
  const k = todayKey()
  if (settings.todayKey !== k) {
    settings.todayKey = k
    settings.today = 0
  }
}

// ===== 音频 / 振动 =====
function ensureAudio() {
  if (audio) return
  try {
    audio = uni.createInnerAudioContext()
    audio.src = '/static/audio/wooden_fish_click.mp3'
    audio.loop = false
  } catch (e) {}
}
function playSound() {
  if (!settings.sound) return
  ensureAudio()
  if (!audio) return
  try { audio.stop(); audio.seek(0); audio.play() } catch (e) {}
}
function vibrate() {
  if (!settings.vibration) return
  try { uni.vibrateShort({ type: 'light' }) } catch (e) {}
}

// ===== 尺寸 =====
function calcSize() {
  const info = uni.getSystemInfoSync()
  const w = info.windowWidth || 375
  const maxW = Math.floor(w - (64 * w) / 750)
  const size = Math.max(200, Math.min(maxW, 360))
  canvasW.value = size
  canvasH.value = size
}

// ===== 特效 =====
function spawnParticles(cx, cy) {
  const batch = []
  for (let i = 0; i < 5; i++) {
    const id = ++particleId
    batch.push({
      id,
      x: cx + (Math.random() - 0.5) * (canvasW.value * 0.42),
      y: cy + (Math.random() - 0.5) * 40,
      dur: Math.round(700 + Math.random() * 400)
    })
  }
  particles.value = particles.value.concat(batch).slice(-24)
  batch.forEach(p => {
    setTimeout(() => {
      particles.value = particles.value.filter(x => x.id !== p.id)
    }, p.dur)
  })
}

function spawnFloater() {
  const id = ++floaterId
  floaters.value = floaters.value.concat([{
    id,
    x: canvasW.value / 2 - 40 + (Math.random() - 0.5) * 90,
    y: canvasH.value * 0.32
  }]).slice(-5)
  setTimeout(() => {
    floaters.value = floaters.value.filter(f => f.id !== id)
  }, 900)
}

function triggerFlash() {
  flashActive.value = true
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = setTimeout(() => { flashActive.value = false }, 260)
}

function checkMilestone() {
  const next = settings.msIdx + 1
  if (next < MILESTONES.length && settings.total >= MILESTONES[next][0]) {
    settings.msIdx = next
    milestoneText.value = MILESTONES[next][1]
    msKey.value++
    if (msTimer) clearTimeout(msTimer)
    msTimer = setTimeout(() => { milestoneText.value = '' }, 1700)
  }
}

// ===== 敲击 =====
function knock(fromZen) {
  ensureToday()
  showHint.value = false

  settings.total++
  settings.today++
  bumpKey.value++

  const now = Date.now()
  if (!fromZen) {
    if (now - lastKnockAt <= 1600) combo.value++
    else combo.value = 1
    if (combo.value > settings.bestCombo) settings.bestCombo = combo.value
    if (comboTimer) clearTimeout(comboTimer)
    comboTimer = setTimeout(() => { combo.value = 0 }, 1800)
  } else {
    combo.value = 0
  }
  lastKnockAt = now

  knockStamps.push(now)
  knockStamps = knockStamps.filter(t => now - t < 10000)
  kpm.value = knockStamps.length >= 2 ? Math.round((knockStamps.length / 10) * 60) : 0

  spawnParticles(canvasW.value / 2, canvasH.value * 0.42)
  spawnFloater()
  triggerFlash()
  checkMilestone()
  persist()

  playSound()
  vibrate()
}

function onPress() { pressed.value = true }
function onRelease() { pressed.value = false }

// ===== 禅模式 =====
function toggleZen() {
  if (zen.value) stopZen()
  else startZen()
}
function startZen() {
  zen.value = true
  showHint.value = false
  const tick = () => {
    knock(true)
    zenTimer = setTimeout(tick, ZEN_SPEEDS[settings.zenSpeed].ms)
  }
  tick()
}
function stopZen() {
  zen.value = false
  if (zenTimer) { clearTimeout(zenTimer); zenTimer = null }
}
function pickSpeed(i) {
  settings.zenSpeed = i
  persist()
  if (zen.value) { stopZen(); startZen() }
}

// ===== 设置 =====
function toggle(field) {
  settings[field] = !settings[field]
  persist()
  if (field === 'sound' && settings.sound) playSound()
}
function pickSkin(id) {
  if (settings.skin === id) return
  settings.skin = id
  persist()
}

async function resetCount() {
  const ok = await showModal({
    title: '清空功德',
    content: '确定要将累计与今日功德清零吗？此操作不可恢复。',
    confirmText: '清零'
  })
  if (!ok) return
  stopZen()
  settings.total = 0
  settings.today = 0
  settings.todayKey = todayKey()
  settings.msIdx = -1
  combo.value = 0
  knockStamps = []
  kpm.value = 0
  saveNow()
  showToast('功德已清零')
}

// ===== H5 键盘 =====
function onKeyDown(e) {
  if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault()
    if (showSettings.value) return
    knock()
  }
}

// ===== 生命周期 =====
onMounted(() => {
  loadSettings()
  ensureToday()
  calcSize()
  // #ifdef H5
  document.addEventListener('keydown', onKeyDown)
  // #endif
})

onShow(() => {
  ensureToday()
  pressed.value = false
  knockStamps = []
  kpm.value = 0
})

onHide(() => {
  stopZen()
  pressed.value = false
  saveNow()
})

onUnmounted(() => {
  stopZen()
  saveNow()
  if (flashTimer) clearTimeout(flashTimer)
  if (msTimer) clearTimeout(msTimer)
  if (comboTimer) clearTimeout(comboTimer)
  try { audio && audio.destroy() } catch (e) {}
  audio = null
  // #ifdef H5
  document.removeEventListener('keydown', onKeyDown)
  // #endif
})
</script>

<style lang="scss" scoped>
.wf {
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 32rpx;
  padding-top: 24rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  position: relative;
  overflow: hidden;

  /* ===== 顶部导航 ===== */
  &__top {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    padding: 16rpx 24rpx 0;
  }
  &__hamburger {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    padding: 16rpx;
    z-index: 10;
  }
  &__hamburger-line {
    width: 32rpx;
    height: 4rpx;
    border-radius: 2rpx;
    background: rgba(255, 255, 255, 0.35);
    transition: background 0.2s;
  }
  &__hamburger:active &__hamburger-line {
    background: rgba(255, 255, 255, 0.6);
  }

  /* ===== 顶部统计 ===== */
  &__stats {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 32rpx;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 20rpx;
    box-sizing: border-box;
  }
  &__stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rpx;
  }
  &__stat-num {
    font-size: 34rpx;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.2;
  }
  &__stat-lbl {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.38);
  }
  &__stat-divider {
    width: 2rpx;
    height: 44rpx;
    background: rgba(255, 255, 255, 0.08);
  }

  /* ===== 舞台 ===== */
  &__stage {
    position: relative;
    margin-top: 24rpx;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__flash {
    position: absolute;
    left: 0; right: 0; top: 0; bottom: 0;
    background: radial-gradient(circle at 50% 45%, rgba(255, 236, 180, 0.18), transparent 62%);
    pointer-events: none;
    z-index: 4;
    border-radius: 50%;
    animation: wfFlash 0.26s ease-out forwards;
  }

  &__particle {
    position: absolute;
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    pointer-events: none;
    z-index: 5;
    animation-name: wfParticleRise;
    animation-timing-function: ease-out;
    animation-fill-mode: forwards;
  }

  &__floater {
    position: absolute;
    font-size: 26rpx;
    font-weight: 600;
    pointer-events: none;
    z-index: 6;
    text-shadow: 0 0 12rpx rgba(0, 0, 0, 0.6);
    animation: wfFloatUp 0.9s ease-out forwards;
  }

  &__milestone {
    position: absolute;
    left: 0; right: 0;
    top: 34%;
    display: flex;
    justify-content: center;
    pointer-events: none;
    z-index: 7;
    animation: wfMilestone 1.7s ease-out forwards;
  }
  &__milestone-text {
    font-size: 56rpx;
    font-weight: 800;
    letter-spacing: 6rpx;
    text-shadow: 0 0 30rpx rgba(0, 0, 0, 0.7);
  }

  /* ===== 木鱼本体（idle 浮动 + 敲击动画） ===== */
  &__fish-wrap {
    position: relative;
    width: 78%;
    height: 78%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    animation: wfFloat 3.4s ease-in-out infinite;
    transform-origin: 50% 65%;
    will-change: transform;

    &--pressed {
      animation: none;
      transform: scale(0.92);
      transition: transform 0.12s ease;
    }
  }
  &__fish-inner {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: wfHit 0.42s ease-out;
    transform-origin: 50% 60%;
    will-change: transform;
  }
  &__fish-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
  }

  /* ===== 计数器 ===== */
  &__counter {
    margin-top: 20rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    width: 100%;
  }
  &__combo {
    height: 40rpx;
    opacity: 0;
    transition: opacity 0.18s;
    &--show { opacity: 1; }
  }
  &__combo-text {
    font-size: 30rpx;
    font-weight: 700;
    letter-spacing: 2rpx;
  }
  &__count {
    font-size: 116rpx;
    font-weight: 700;
    line-height: 1.08;
    &--long { font-size: 84rpx; }
    &--bump { animation: wfBump 0.28s ease; }
  }
  &__label {
    font-size: 28rpx;
    letter-spacing: 8rpx;
    color: rgba(255, 255, 255, 0.42);
    margin-top: 2rpx;
  }
  &__kpm {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.3);
    margin-top: 10rpx;
  }

  /* ===== 底部工具条 ===== */
  &__bar {
    margin-top: 28rpx;
    display: flex;
    gap: 24rpx;
  }
  &__btn {
    display: flex;
    align-items: center;
    gap: 10rpx;
    padding: 18rpx 40rpx;
    border-radius: 40rpx;
    background: rgba(255, 255, 255, 0.07);
    border: 2rpx solid rgba(255, 255, 255, 0.08);
    transition: all 0.15s;
    &:active { transform: scale(0.95); }
    &--on {
      background: rgba(255, 255, 255, 0.16);
      border-color: rgba(255, 255, 255, 0.28);
    }
  }
  &__btn-icon { font-size: 28rpx; }
  &__btn-text {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.82);
  }

  &__hint {
    margin-top: 24rpx;
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.28);
    animation: wfHintPulse 2s ease-in-out infinite;
  }

  /* ===== 设置面板 ===== */
  &__mask {
    position: fixed;
    left: 0; right: 0; top: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.55);
    z-index: 20;
    display: flex;
    align-items: flex-end;
  }
  &__panel {
    width: 100%;
    background: #232323;
    border-radius: 32rpx 32rpx 0 0;
    padding: 32rpx 40rpx calc(40rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
    animation: wfSheetUp 0.24s ease-out;
  }
  &__panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12rpx;
  }
  &__panel-title {
    font-size: 34rpx;
    font-weight: 700;
    color: #FFFFFF;
  }
  &__panel-close {
    font-size: 30rpx;
    color: rgba(255, 255, 255, 0.4);
    padding: 8rpx 12rpx;
  }
  &__section {
    display: block;
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.35);
    margin: 32rpx 0 16rpx;
  }
  &__skins {
    display: flex;
    gap: 16rpx;
  }
  &__skin {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10rpx;
    padding: 20rpx 0;
    border-radius: 16rpx;
    background: rgba(255, 255, 255, 0.05);
    border: 2rpx solid transparent;
    &--on {
      border-color: rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.12);
    }
  }
  &__skin-dot {
    width: 48rpx;
    height: 48rpx;
    border-radius: 50%;
    border: 2rpx solid rgba(255, 255, 255, 0.25);
  }
  &__skin-name {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.7);
  }
  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 0;
    border-bottom: 2rpx solid rgba(255, 255, 255, 0.06);
  }
  &__row-label {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.85);
  }
  &__switch {
    width: 88rpx;
    height: 48rpx;
    border-radius: 30rpx;
    background: rgba(255, 255, 255, 0.16);
    position: relative;
    transition: background 0.2s;
    &--on { background: #34C759; }
  }
  &__switch-knob {
    position: absolute;
    top: 4rpx;
    left: 4rpx;
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    background: #FFFFFF;
    transition: transform 0.2s;
    box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.25);
  }
  &__switch--on &__switch-knob {
    transform: translateX(40rpx);
  }
  &__speeds {
    display: flex;
    gap: 16rpx;
  }
  &__speed {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rpx;
    padding: 18rpx 0;
    border-radius: 16rpx;
    background: rgba(255, 255, 255, 0.05);
    border: 2rpx solid transparent;
    &--on {
      border-color: rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.12);
    }
  }
  &__speed-name {
    font-size: 26rpx;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.85);
  }
  &__speed-desc {
    font-size: 20rpx;
    color: rgba(255, 255, 255, 0.35);
  }
  &__danger {
    margin-top: 40rpx;
    padding: 24rpx 0;
    border-radius: 16rpx;
    background: rgba(255, 59, 48, 0.14);
    display: flex;
    justify-content: center;
    &:active { opacity: 0.7; }
  }
  &__danger-text {
    font-size: 28rpx;
    color: #FF6B60;
    font-weight: 600;
  }
  &__tip {
    display: block;
    margin-top: 16rpx;
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.3);
    text-align: center;
  }
}

/* ===== idle 浮动（持续循环） ===== */
@keyframes wfFloat {
  0%, 100% { transform: translateY(0) rotate(-1.6deg); }
  50%      { transform: translateY(-14rpx) rotate(1.6deg); }
}

/* ===== 敲击动画（被压下→弹起→回稳） ===== */
@keyframes wfHit {
  0%   { transform: scale(1)    rotate(0deg); }
  10%  { transform: scale(0.84) rotate(-6deg); }
  32%  { transform: scale(1.14) rotate(4deg); }
  58%  { transform: scale(0.97) rotate(-1deg); }
  100% { transform: scale(1)    rotate(0deg); }
}

@keyframes wfBump {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.18); }
  100% { transform: scale(1); }
}

@keyframes wfFlash {
  0%   { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes wfParticleRise {
  0%   { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-130rpx) scale(0); opacity: 0; }
}

@keyframes wfFloatUp {
  0%   { transform: translateY(0); opacity: 0; }
  20%  { opacity: 1; }
  100% { transform: translateY(-110rpx); opacity: 0; }
}

@keyframes wfMilestone {
  0%   { transform: scale(0.6); opacity: 0; }
  22%  { transform: scale(1.05); opacity: 1; }
  70%  { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.1) translateY(-40rpx); opacity: 0; }
}

@keyframes wfHintPulse {
  0%, 100% { opacity: 0.28; }
  50%      { opacity: 0.6; }
}

@keyframes wfSheetUp {
  0%   { transform: translateY(100%); }
  100% { transform: translateY(0); }
}
</style>