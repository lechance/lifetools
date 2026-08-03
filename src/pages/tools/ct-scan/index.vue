/**
 * CT检查 - 娱乐模拟
 * 选择检查部位 → 提示贴近手机 → 扫描动画 → 用 canvas 绘制类似 CT 片子的结果图
 * 注意：仅为娱乐模拟，非真实医疗诊断
 */
<template>
  <view class="page">
    <!-- ====== 1. 选择部位 ====== -->
    <view v-if="stage === 'select'">
      <view class="card">
        <text class="title">选择要检查的部位</text>
        <view class="parts">
          <view
            v-for="p in parts"
            :key="p.key"
            class="part"
            @tap="selectPart(p)"
          >
            <text class="part-icon">{{ p.icon }}</text>
            <text class="part-name">{{ p.name }}</text>
          </view>
        </view>
      </view>
      <view class="card tip-card">
        <text class="tip">⚠️ 本工具为娱乐模拟，扫描结果非真实医疗诊断。</text>
      </view>
    </view>

    <!-- ====== 2. 提示贴近 ====== -->
    <view v-else-if="stage === 'ready'">
      <view class="card">
        <view class="ready-icon">{{ selected.icon }}</view>
        <text class="ready-title">请将手机贴近你的{{ selected.name }}</text>
        <text class="ready-sub">保持静止，开始扫描</text>
        <view class="ready-actions">
          <view class="btn btn--primary" @tap="startScan">开始扫描</view>
          <view class="btn btn--ghost" @tap="backToSelect">返回选择部位</view>
        </view>
      </view>
      <view class="card tip-card">
        <text class="tip">提示：模拟扫描，将手机贴近检查部位并保持稳定。</text>
      </view>
    </view>

    <!-- ====== 3. 扫描中 ====== -->
    <view v-else-if="stage === 'scanning'">
      <view class="card">
        <view class="scan-area">
          <canvas canvas-id="ctCanvas" id="ctCanvas" class="ct-canvas" :style="canvasStyle"></canvas>
          <view class="ct-scanline"></view>
        </view>
        <view class="progress-row">
          <text class="progress-label">扫描中</text>
          <view class="progress-track">
            <view class="progress-fill" :style="{ width: progress + '%' }"></view>
          </view>
          <text class="progress-val">{{ progress }}%</text>
        </view>
      </view>
    </view>

    <!-- ====== 4. 结果 ====== -->
    <view v-else>
      <view class="card">
        <view class="scan-area">
          <canvas canvas-id="ctCanvas" id="ctCanvas" class="ct-canvas" :style="canvasStyle"></canvas>
        </view>
        <view class="diagnosis">
          <text class="diagnosis-icon">✅</text>
          <text class="diagnosis-text">{{ diagnosis }}</text>
        </view>
        <view class="actions">
          <view class="btn btn--primary" @tap="rescan">重新扫描</view>
          <view class="btn btn--ghost" @tap="saveImage">保存图片</view>
          <view class="btn btn--ghost" @tap="backToSelect">换个部位</view>
        </view>
      </view>
      <view class="card tip-card">
        <text class="tip">⚠️ 娱乐模拟结果，不构成任何医疗建议。</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, nextTick, onUnmounted } from 'vue'
import { showToast, showSuccess, showLoading, hideLoading } from '@/utils/helpers'

// ========== 画布尺寸 ==========
const CANVAS_W = 340
const CANVAS_H = 260

// ========== 检查部位 ==========
const parts = [
  { key: 'head',    name: '头部', icon: '🫀' },
  { key: 'chest',   name: '胸部', icon: '🫁' },
  { key: 'abdomen', name: '腹部', icon: '🫃' },
  { key: 'spine',   name: '脊柱', icon: '🦴' },
  { key: 'pelvis',  name: '骨盆', icon: '🦵' },
  { key: 'arm',     name: '手臂', icon: '💪' },
  { key: 'leg',     name: '腿部', icon: '🦿' },
  { key: 'full',    name: '全身', icon: '🧍' }
]

// ========== 趣味诊断语（健康向） ==========
const DIAGNOSES = [
  '各项指标未见异常，骨骼密度良好 ✅',
  '扫描显示一切正常，请继续保持健康生活 💪',
  '各组织器官轮廓清晰，未见明显异常 👍',
  '骨骼对齐良好，无需担心 😄',
  '检测到强烈的健康信号，状态极佳 🌟'
]

// ========== 状态 ==========
const stage = ref('select')   // select | ready | scanning | result
const selected = ref(null)
const progress = ref(0)
const scanNo = ref(0)
const diagnosis = ref('')

let scanTimer = null

const canvasStyle = computed(() => ({
  width: CANVAS_W + 'px',
  height: CANVAS_H + 'px'
}))

// ========== 流程 ==========
function selectPart(p) {
  selected.value = p
  stage.value = 'ready'
}

function backToSelect() {
  stopScan()
  stage.value = 'select'
}

function startScan() {
  if (!selected.value) return
  scanNo.value++
  diagnosis.value = ''
  stage.value = 'scanning'
  progress.value = 0
  drawSilhouette()

  let tick = 0
  const TOTAL = 80
  const INTERVAL = 50 // 80×50ms ≈ 4s
  stopScan()
  scanTimer = setInterval(() => {
    tick++
    progress.value = Math.min(100, Math.round(tick / TOTAL * 100))
    if (tick >= TOTAL) {
      stopScan()
      finishScan()
    }
  }, INTERVAL)
}

function rescan() {
  startScan()
}

function finishScan() {
  uni.vibrateShort && uni.vibrateShort({ type: 'medium' })
  diagnosis.value = DIAGNOSES[Math.floor(Math.random() * DIAGNOSES.length)]
  stage.value = 'result'
  drawFilm()
}

function stopScan() {
  if (scanTimer) {
    clearInterval(scanTimer)
    scanTimer = null
  }
}

// ========== 绘制 ==========

/** 绘制扫描中的纯剪影（黑底 + 部位） */
function drawSilhouette() {
  nextTick(() => {
    const ctx = uni.createCanvasContext('ctCanvas')
    ctx.setFillStyle('#05080c')
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    drawBodyPart(ctx, selected.value.key)
    ctx.draw()
  })
}

/** 绘制最终 CT 片子（剪影 + 纹理 + 刻度 + 元信息） */
function drawFilm() {
  nextTick(() => {
    const ctx = uni.createCanvasContext('ctCanvas')
    ctx.setFillStyle('#05080c')
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    drawBodyPart(ctx, selected.value.key)
    drawTexture(ctx)
    drawMarkers(ctx)
    drawMeta(ctx)
    ctx.draw()
  })
}

/** 各部位风格化 X 光剪影 */
function drawBodyPart(ctx, key) {
  const W = CANVAS_W
  const H = CANVAS_H
  const cx = W / 2
  const cy = H / 2
  const bone = '#dfe9ef'
  const dim = 'rgba(175,195,210,0.5)'
  const soft = 'rgba(110,150,175,0.22)'

  const oval = (x, y, rx, ry, style) => {
    ctx.setFillStyle(style)
    ctx.beginPath()
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  switch (key) {
    case 'head': {
      ctx.setFillStyle(bone)
      ctx.beginPath(); ctx.arc(cx, cy - 6, 56, 0, Math.PI * 2); ctx.fill()
      ctx.setFillStyle('#060a0e')
      ctx.beginPath(); ctx.arc(cx, cy - 6, 44, 0, Math.PI * 2); ctx.fill()
      ctx.setFillStyle(bone)
      ctx.beginPath(); ctx.arc(cx - 25, cy - 14, 11, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx + 25, cy - 14, 11, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx, cy + 6, 6, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx, cy + 42, 18, 0, Math.PI); ctx.fill()
      ctx.setFillStyle('#f4f8fa')
      for (let i = -4; i <= 4; i++) ctx.fillRect(cx + i * 4 - 1, cy + 22, 2, 8)
      break
    }
    case 'chest': {
      oval(cx - 38, cy, 34, 58, soft)
      oval(cx + 38, cy, 34, 58, soft)
      oval(cx, cy + 8, 16, 22, dim)
      ctx.setStrokeStyle(bone); ctx.setLineWidth(2)
      for (let i = 0; i < 6; i++) {
        const y = cy - 30 + i * 14
        ctx.beginPath(); ctx.arc(cx, y, 46, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke()
      }
      ctx.setFillStyle(bone)
      for (let i = 0; i < 6; i++) ctx.fillRect(cx - 4, cy - 36 + i * 13, 8, 9)
      ctx.beginPath(); ctx.moveTo(cx - 40, cy - 44); ctx.lineTo(cx + 40, cy - 44); ctx.stroke()
      break
    }
    case 'abdomen': {
      ctx.beginPath(); ctx.ellipse(cx, cy, 46, 74, 0, 0, Math.PI * 2)
      ctx.setFillStyle(dim); ctx.fill()
      oval(cx - 20, cy - 18, 24, 30, bone)
      oval(cx - 30, cy + 22, 8, 14, 'rgba(150,175,190,0.6)')
      oval(cx + 30, cy + 22, 8, 14, 'rgba(150,175,190,0.6)')
      ctx.setFillStyle(bone)
      for (let i = 0; i < 6; i++) ctx.fillRect(cx - 4, cy - 50 + i * 17, 8, 10)
      break
    }
    case 'spine': {
      ctx.setStrokeStyle(bone); ctx.setLineWidth(10)
      ctx.beginPath()
      ctx.moveTo(cx - 30, 22)
      ctx.quadraticCurveTo(cx + 8, H / 2, cx - 28, H - 22)
      ctx.stroke()
      ctx.setFillStyle(bone)
      for (let i = 0; i < 12; i++) {
        const t = i / 11
        const x = cx - 30 + 44 * t * t
        const y = 26 + t * (H - 50)
        ctx.fillRect(x - 8, y - 6, 16, 12)
      }
      break
    }
    case 'pelvis': {
      oval(cx - 42, cy + 4, 34, 44, bone)
      oval(cx + 42, cy + 4, 34, 44, bone)
      oval(cx, cy - 8, 20, 26, dim)
      ctx.setFillStyle(bone)
      ctx.beginPath(); ctx.arc(cx - 42, cy + 48, 12, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx + 42, cy + 48, 12, 0, Math.PI * 2); ctx.fill()
      break
    }
    case 'arm': {
      ctx.setStrokeStyle(bone); ctx.setLineWidth(12); ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(cx - 10, 26); ctx.lineTo(cx - 10, cy + 34); ctx.stroke()
      ctx.setLineWidth(7)
      ctx.beginPath(); ctx.moveTo(cx - 26, cy + 44); ctx.lineTo(cx - 6, H - 26); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + 6, cy + 44); ctx.lineTo(cx + 22, H - 26); ctx.stroke()
      ctx.setLineWidth(4)
      for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(cx + 2 + i * 4, H - 22); ctx.lineTo(cx - 4 + i * 6, H - 6); ctx.stroke()
      }
      break
    }
    case 'leg': {
      ctx.setStrokeStyle(bone); ctx.setLineWidth(13); ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(cx, 22); ctx.lineTo(cx - 8, cy + 30); ctx.stroke()
      ctx.setLineWidth(7)
      ctx.beginPath(); ctx.moveTo(cx - 18, cy + 42); ctx.lineTo(cx - 12, H - 20); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + 2, cy + 42); ctx.lineTo(cx + 8, H - 20); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - 8, H - 16); ctx.lineTo(cx + 22, H - 12); ctx.stroke()
      break
    }
    case 'full': {
      ctx.setFillStyle(bone)
      ctx.beginPath(); ctx.arc(cx, 34, 20, 0, Math.PI * 2); ctx.fill()
      ctx.setFillStyle('#060a0e')
      ctx.beginPath(); ctx.arc(cx, 34, 14, 0, Math.PI * 2); ctx.fill()
      ctx.setStrokeStyle(bone); ctx.setLineWidth(5)
      ctx.beginPath(); ctx.moveTo(cx, 52); ctx.lineTo(cx, H - 18); ctx.stroke()
      ctx.setLineWidth(2)
      for (let i = 0; i < 4; i++) {
        const y = 66 + i * 14
        ctx.beginPath(); ctx.arc(cx, y, 30, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke()
      }
      ctx.setLineWidth(5)
      ctx.beginPath(); ctx.moveTo(cx - 26, 60); ctx.lineTo(cx - 46, 120); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + 26, 60); ctx.lineTo(cx + 46, 120); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - 10, H - 22); ctx.lineTo(cx - 34, H - 4); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + 10, H - 22); ctx.lineTo(cx + 34, H - 4); ctx.stroke()
      oval(cx - 22, H - 34, 16, 12, dim)
      oval(cx + 22, H - 34, 16, 12, dim)
      break
    }
  }
}

/** 微弱扫描线纹理，模拟 CT 片质感 */
function drawTexture(ctx) {
  ctx.setStrokeStyle('rgba(120,200,235,0.05)')
  ctx.setLineWidth(1)
  for (let y = 0; y < CANVAS_H; y += 4) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke()
  }
}

/** 四角刻度标记 */
function drawMarkers(ctx) {
  ctx.setStrokeStyle('rgba(140,220,255,0.55)')
  ctx.setLineWidth(1.5)
  const s = 12
  const o = 6
  const corners = [
    [[o, o], [o + s, o], [o, o], [o, o + s]],
    [[CANVAS_W - o, o], [CANVAS_W - o - s, o], [CANVAS_W - o, o], [CANVAS_W - o, o + s]],
    [[o, CANVAS_H - o], [o + s, CANVAS_H - o], [o, CANVAS_H - o], [o, CANVAS_H - o - s]],
    [[CANVAS_W - o, CANVAS_H - o], [CANVAS_W - o - s, CANVAS_H - o], [CANVAS_W - o, CANVAS_H - o], [CANVAS_W - o, CANVAS_H - o - s]]
  ]
  corners.forEach(([a, b, c, d]) => {
    ctx.beginPath()
    ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1])
    ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1])
    ctx.stroke()
  })
}

/** 元信息文字（CT SCAN / 编号 / 部位 / 时间） */
function drawMeta(ctx) {
  const cyan = 'rgba(140,220,255,0.9)'
  ctx.setFillStyle(cyan)
  ctx.setFontSize(11)
  ctx.setTextAlign('left')
  ctx.fillText('CT SCAN', 12, 18)
  ctx.fillText('HEAD-MED SIM', 12, 32)
  ctx.setTextAlign('right')
  ctx.fillText('SCAN-' + String(scanNo.value).padStart(3, '0'), CANVAS_W - 12, 18)

  const now = new Date()
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  ctx.setTextAlign('left')
  ctx.fillText((selected.value ? selected.value.name : '') + ' · 横断面', 12, CANVAS_H - 12)
  ctx.setTextAlign('right')
  ctx.fillText(dateStr + ' ' + timeStr, CANVAS_W - 12, CANVAS_H - 12)
}

// ========== 保存图片 ==========
function saveImage() {
  showLoading('保存中...')
  uni.canvasToTempFilePath({
    canvasId: 'ctCanvas',
    destWidth: CANVAS_W,
    destHeight: CANVAS_H,
    success: (res) => {
      hideLoading()
      // #ifdef H5
      const link = document.createElement('a')
      link.href = res.tempFilePath
      link.download = 'ct-scan.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showSuccess('已下载')
      // #endif
      // #ifdef MP-WEIXIN
      uni.saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
        success: () => showSuccess('已保存到相册'),
        fail: () => showToast('保存失败')
      })
      // #endif
    },
    fail: () => { hideLoading(); showToast('生成失败') }
  })
}

onUnmounted(() => {
  stopScan()
})
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
.title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 20rpx;
}

// 部位网格
.parts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
}
.part {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0 16rpx;
  background: #F5F5F7;
  border-radius: 16rpx;
  &:active { background: #E5E5EA; }
}
.part-icon {
  font-size: 52rpx;
  line-height: 1.2;
}
.part-name {
  font-size: 24rpx;
  color: #1D1D1F;
  margin-top: 8rpx;
}

// 提示贴近
.ready-icon {
  font-size: 96rpx;
  text-align: center;
  padding: 20rpx 0 8rpx;
}
.ready-title {
  display: block;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #1D1D1F;
  padding: 8rpx 0;
}
.ready-sub {
  display: block;
  text-align: center;
  font-size: 24rpx;
  color: #86868B;
  margin-bottom: 28rpx;
}

// 扫描区域
.scan-area {
  position: relative;
  width: 340px;
  height: 260px;
  margin: 0 auto 20rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background: #05080c;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.35);
}
.ct-canvas {
  display: block;
  width: 340px;
  height: 260px;
}

// 扫描线
.ct-scanline {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 3px;
  background: rgba(90, 225, 255, 0.95);
  box-shadow: 0 0 14px rgba(90, 225, 255, 0.85), 0 6px 18px rgba(90, 225, 255, 0.35);
  animation: ctScan 1.2s linear infinite;
  pointer-events: none;
}

// 进度条
.progress-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.progress-label {
  font-size: 24rpx;
  color: #1D1D1F;
  min-width: 64rpx;
}
.progress-track {
  flex: 1;
  height: 16rpx;
  background: #F0F0F2;
  border-radius: 8rpx;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00B0FF, #39FF14);
  border-radius: 8rpx;
  transition: width 0.05s linear;
}
.progress-val {
  font-size: 24rpx;
  color: #1D1D1F;
  min-width: 56rpx;
  text-align: right;
  font-family: monospace;
}

// 结果
.diagnosis {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  background: #F5F5F7;
  border-radius: 14rpx;
  padding: 20rpx 16rpx;
  margin-bottom: 20rpx;
}
.diagnosis-icon { font-size: 32rpx; }
.diagnosis-text {
  font-size: 26rpx;
  color: #1D1D1F;
  line-height: 1.4;
}
.actions {
  display: flex;
  gap: 16rpx;
}

// 提示页操作按钮（纵排）
.ready-actions {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

// 按钮
.btn {
  flex: 1;
  padding: 18rpx 0;
  border-radius: 14rpx;
  font-size: 28rpx;
  text-align: center;
  &:active { opacity: 0.8; }
  &--primary {
    background: #1D1D1F;
    color: #fff;
    font-weight: 600;
  }
  &--ghost {
    background: #F5F5F7;
    color: #3A3A3C;
  }
}

// 提示卡
.tip-card { padding: 20rpx 28rpx; }
.tip {
  font-size: 24rpx;
  color: #86868B;
  line-height: 1.6;
}

@keyframes ctScan {
  0%   { transform: translateY(0); }
  100% { transform: translateY(257px); }
}
</style>
