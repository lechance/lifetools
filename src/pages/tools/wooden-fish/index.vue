<template>
  <view class="wf">
    <!-- 背景闪光 -->
    <view v-if="flashActive" class="wf__flash" />

    <!-- 木鱼舞台 -->
    <view class="wf__stage" @tap="knock">
      <!-- 金色粒子 -->
      <view
        v-for="p in particles"
        :key="p.id"
        class="wf__particle"
        :style="{ left: p.x + 'px', top: p.y + 'px', animationDuration: p.dur + 'ms' }"
      />
      <!-- 3D Canvas -->
      <canvas
        id="wfCanvas"
        type="webgl"
        class="wf__canvas"
        :style="{ width: canvasW + 'px', height: canvasH + 'px' }"
      />
    </view>

    <!-- 计数器 -->
    <view class="wf__counter">
      <text
        class="wf__count"
        :class="{ 'wf__count--bump': bumpKey > 0 }"
        :key="bumpKey"
      >{{ count }}</text>
      <text class="wf__label">功德</text>
      <text v-if="kpm > 0" class="wf__kpm">{{ kpm }} 敲/分钟</text>
    </view>

    <!-- 点击提示（首次敲击前显示） -->
    <text v-if="showHint" class="wf__hint">轻敲木鱼</text>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onHide } from '@dcloudio/uni-app'

// #ifdef H5
import * as THREE from 'three'
// #endif

// #ifdef MP-WEIXIN
import { createScopedThreejs } from 'threejs-miniprogram-tn'
// #endif

const COUNT_KEY = 'lifetool_wooden_fish'

const count = ref(0)
const bumpKey = ref(0)
const canvasW = ref(300)
const canvasH = ref(300)
const kpm = ref(0)
const showHint = ref(true)
const flashActive = ref(false)
const particles = ref([])

let threeLib = null
let scene = null
let camera = null
let renderer = null
let fishGroup = null
let handleMesh = null
let canvasEl = null
let rafId = null
let audio = null
let knockAnimId = null
let particleId = 0
let knockTimestamps = []

// === Storage ===
function loadCount() {
  try { return parseInt(uni.getStorageSync(COUNT_KEY) || '0', 10) || 0 } catch (e) { return 0 }
}
function saveCount() {
  try { uni.setStorageSync(COUNT_KEY, String(count.value)) } catch (e) {}
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
  ensureAudio()
  try { audio.play() } catch (e) {}
}

// === Canvas sizing ===
function calcSize() {
  const info = uni.getSystemInfoSync()
  const maxW = info.windowWidth - 64
  const size = Math.min(maxW, 380)
  canvasW.value = size
  canvasH.value = size
}

// === Particles ===
function spawnParticles(cx, cy) {
  for (let i = 0; i < 6; i++) {
    const id = ++particleId
    const ox = (Math.random() - 0.5) * 120
    const oy = -(Math.random() * 60 + 10)
    const dur = 800 + Math.random() * 400
    particles.value.push({ id, x: cx + ox, y: cy + oy, dur })
    setTimeout(() => { particles.value = particles.value.filter(p => p.id !== id) }, dur)
  }
}

function triggerFlash() {
  flashActive.value = true
  setTimeout(() => { flashActive.value = false }, 300)
}

// === Three.js scene ===
function buildScene(THREE, canvas) {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1A1A1A)

  camera = new THREE.PerspectiveCamera(45, canvasW.value / canvasH.value, 0.1, 100)
  camera.position.set(0, 1.2, 3.2)
  camera.lookAt(0, -0.1, 0)

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setSize(canvasW.value, canvasH.value)
  renderer.setPixelRatio(uni.getSystemInfoSync().pixelRatio || 2)
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const ambient = new THREE.AmbientLight(0xfff5e6, 0.6)
  scene.add(ambient)

  const dir = new THREE.DirectionalLight(0xffffff, 0.9)
  dir.position.set(2, 3, 2)
  scene.add(dir)

  const rim = new THREE.DirectionalLight(0xffd700, 0.3)
  rim.position.set(-2, 1, -1)
  scene.add(rim)

  fishGroup = new THREE.Group()

  const bodyPts = []
  for (let i = 0; i <= 24; i++) {
    const t = i / 24
    const r = Math.sin(t * Math.PI) * (1.05 - 0.35 * t) * 0.85
    const y = t * 2.0 - 1.0
    bodyPts.push(new THREE.Vector2(r, y))
  }
  const bodyGeo = new THREE.LatheGeometry(bodyPts, 36)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x8B4513,
    roughness: 0.75,
    metalness: 0.08,
  })
  fishGroup.add(new THREE.Mesh(bodyGeo, bodyMat))

  const ringGeo = new THREE.TorusGeometry(0.42, 0.025, 8, 36)
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xD4AF37,
    roughness: 0.4,
    metalness: 0.6,
  })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.position.y = -0.15
  ring.rotation.x = Math.PI / 2
  fishGroup.add(ring)

  const topGeo = new THREE.SphereGeometry(0.12, 12, 8)
  const topMat = new THREE.MeshStandardMaterial({
    color: 0xD4AF37,
    roughness: 0.5,
    metalness: 0.5,
  })
  const topKnob = new THREE.Mesh(topGeo, topMat)
  topKnob.position.y = 1.0
  fishGroup.add(topKnob)

  const handleGeo = new THREE.CylinderGeometry(0.025, 0.02, 1.3, 8)
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x654321,
    roughness: 0.7,
    metalness: 0.05,
  })
  handleMesh = new THREE.Mesh(handleGeo, handleMat)
  handleMesh.position.set(0.55, 0.6, 0)
  handleMesh.rotation.z = -0.65
  fishGroup.add(handleMesh)

  const headGeo = new THREE.SphereGeometry(0.06, 10, 8)
  const head = new THREE.Mesh(headGeo, handleMat)
  head.position.set(0.95, 1.08, 0)
  fishGroup.add(head)

  scene.add(fishGroup)

  function animate() {
    rafId = scheduleFrame(animate)
    renderer.render(scene, camera)
  }
  animate()
}

function scheduleFrame(cb) {
  // #ifdef H5
  return requestAnimationFrame(cb)
  // #endif
  // #ifdef MP-WEIXIN
  return canvasEl.requestAnimationFrame(cb)
  // #endif
}

// === Knock animation ===
function knock() {
  showHint.value = false
  count.value++
  bumpKey.value++
  saveCount()

  // KPM
  const now = Date.now()
  knockTimestamps.push(now)
  knockTimestamps = knockTimestamps.filter(t => now - t < 10000)
  kpm.value = knockTimestamps.length > 1 ? Math.round((knockTimestamps.length / 10) * 60) : 0

  // Visual effects
  spawnParticles(canvasW.value / 2, canvasH.value / 2)
  triggerFlash()

  if (!fishGroup) return

  const startTime = Date.now()
  const duration = 400

  if (knockAnimId) cancelAnimationFrame(knockAnimId)

  function tick() {
    const elapsed = Date.now() - startTime
    const t = Math.min(elapsed / duration, 1)

    const bounce = Math.sin(t * Math.PI)
    const scale = 1 + 0.14 * bounce * (1 - t)
    fishGroup.scale.set(scale, scale, scale)
    fishGroup.rotation.z = 0.06 * Math.sin(t * Math.PI * 2) * (1 - t)

    if (handleMesh) {
      const stickAngle = -0.65 + 0.35 * bounce * (1 - t)
      handleMesh.rotation.z = stickAngle
    }

    if (t < 1) {
      knockAnimId = scheduleFrame(tick)
    } else {
      fishGroup.scale.set(1, 1, 1)
      fishGroup.rotation.z = 0
      if (handleMesh) handleMesh.rotation.z = -0.65
      knockAnimId = null
    }
  }
  tick()

  playSound()
  try { uni.vibrateShort({ type: 'light' }) } catch (e) {}
}

// === Init ===
onMounted(async () => {
  count.value = loadCount()
  calcSize()

  await new Promise(r => setTimeout(r, 120))

  // #ifdef H5
  canvasEl = document.getElementById('wfCanvas')
  threeLib = THREE
  if (canvasEl) buildScene(threeLib, canvasEl)
  // #endif

  // #ifdef MP-WEIXIN
  canvasEl = await new Promise(resolve => {
    wx.createSelectorQuery()
      .select('#wfCanvas')
      .node()
      .exec(res => resolve(res[0].node))
  })
  threeLib = createScopedThreejs(canvasEl)
  buildScene(threeLib, canvasEl)
  // #endif
})

onHide(() => {
  if (knockAnimId) { cancelAnimationFrame(knockAnimId); knockAnimId = null }
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  if (knockAnimId) cancelAnimationFrame(knockAnimId)
  try { audio && audio.destroy() } catch (e) {}
  if (renderer) {
    renderer.dispose()
    renderer.forceContextLoss()
  }
})
</script>

<style lang="scss" scoped>
.wf {
  min-height: 100vh;
  background: radial-gradient(ellipse at 50% 30%, #2A2218 0%, #1A1A1A 70%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  position: relative;

  &__flash {
    position: fixed;
    left: 0; top: 0; right: 0; bottom: 0;
    background: radial-gradient(circle at 50% 40%, rgba(212,175,55,0.15), transparent 60%);
    pointer-events: none;
    z-index: 1;
    animation: wfFlash 0.3s ease-out forwards;
  }

  &__stage {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;

    &::after {
      content: '';
      position: absolute;
      width: 80%;
      height: 60%;
      background: radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      z-index: -1;
    }
  }

  &__canvas {
    display: block;
  }

  &__particle {
    position: absolute;
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: #D4AF37;
    box-shadow: 0 0 8rpx rgba(212,175,55,0.6);
    pointer-events: none;
    z-index: 3;
    animation: wfParticleRise 1s ease-out forwards;
  }

  &__counter {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 32rpx;
    z-index: 2;
  }

  &__count {
    font-size: 112rpx;
    font-weight: 700;
    line-height: 1.1;
    color: #D4AF37;
    text-shadow: 0 0 20rpx rgba(212,175,55,0.4);

    &--bump {
      animation: wfBump 0.25s ease;
    }
  }

  &__label {
    font-size: 32rpx;
    color: rgba(255, 255, 255, 0.45);
    margin-top: 4rpx;
  }

  &__kpm {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.35);
    margin-top: 8rpx;
  }

  &__hint {
    position: absolute;
    bottom: calc(180rpx + env(safe-area-inset-bottom));
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.3);
    animation: wfHintPulse 2s ease-in-out infinite;
  }
}

@keyframes wfBump {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@keyframes wfFlash {
  0%   { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes wfParticleRise {
  0%   { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-120rpx) scale(0); opacity: 0; }
}

@keyframes wfHintPulse {
  0%, 100% { opacity: 0.3; }
  50%      { opacity: 0.6; }
}
</style>
