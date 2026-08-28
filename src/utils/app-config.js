import { ref } from 'vue'
import { getSecCheckUrl } from './api-config'

const STORAGE_KEY = 'lifetool_app_config'

/** 模块级响应式状态：被隐藏的 TAB key 列表 */
const hiddenTabs = ref([])

/** 模块级响应式状态：需要广告的工具 id 列表 */
const adTools = ref([])

/** 模块级响应式状态：需要隐藏的工具 id 列表 */
const hiddenTools = ref([])

/** 当前缓存的配置原始值（用于判断是否变化） */
let cachedJson = ''

/**
 * 初始化应用配置（App.vue onLaunch 调用）
 * 1. 先读本地缓存，立即同步生效
 * 2. 异步请求服务器，成功则更新 ref + 落盘
 * 3. 失败静默，沿用缓存/默认值（fail-open）
 */
export function initAppConfig() {
  // 读缓存同步生效
  try {
    const raw = uni.getStorageSync(STORAGE_KEY) || '{}'
    const cached = JSON.parse(raw)
    if (Array.isArray(cached.hiddenTabs)) {
      hiddenTabs.value = cached.hiddenTabs
    }
    if (Array.isArray(cached.adTools)) {
      adTools.value = cached.adTools
    }
    if (Array.isArray(cached.hiddenTools)) {
      hiddenTools.value = cached.hiddenTools
    }
    cachedJson = raw
  } catch {}

  // 异步刷新
  const baseUrl = getSecCheckUrl()
  if (!baseUrl) return

  uni.request({
    url: baseUrl + '/api/app-config',
    method: 'GET',
    timeout: 8000,
    success: (res) => {
      if (res.statusCode === 200 && res.data && res.data.code === 0) {
        const cfg = res.data.config || {}
        const newTabs = Array.isArray(cfg.hiddenTabs) ? cfg.hiddenTabs : []
        const newAdTools = Array.isArray(cfg.adTools) ? cfg.adTools : []
        const newHiddenTools = Array.isArray(cfg.hiddenTools) ? cfg.hiddenTools : []
        const newJson = JSON.stringify({ hiddenTabs: newTabs, adTools: newAdTools, hiddenTools: newHiddenTools })
        if (newJson !== cachedJson) {
          hiddenTabs.value = newTabs
          adTools.value = newAdTools
          hiddenTools.value = newHiddenTools
          cachedJson = newJson
          try { uni.setStorageSync(STORAGE_KEY, newJson) } catch {}
        }
      }
    },
    fail: () => {}
  })
}

/**
 * 判断某个 TAB 是否被云端隐藏
 */
export function isTabHidden(key) {
  return hiddenTabs.value.includes(key)
}

/**
 * 判断某个工具是否需要看广告
 */
export function toolRequiresAd(toolId) {
  return adTools.value.includes(toolId)
}

/**
 * 判断某个工具是否被云端隐藏
 */
export function isToolHidden(toolId) {
  return hiddenTools.value.includes(toolId)
}

/**
 * 获取当前 hiddenTools 列表
 */
export function getHiddenTools() {
  return hiddenTools
}
