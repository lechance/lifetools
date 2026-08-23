/**
 * API 配置管理
 * 集中管理各工具的 API Key 和自定义配置
 * 用户可在「我的 → API 设置」中自行填写
 */

const STORAGE_KEY = 'lifetool_api_config'

/**
 * 内容安全校验后端基础地址（不含 /api/sec-check/* 路径）
 * 在代码中直接配置（勿通过页面设置）。为空则图片保存前跳过校验（fail-open）。
 * 流程：uni.login 取 code → POST /api/sec-check/image（media + code）→
 *      拿到 trace_id → 轮询 GET /api/sec-check/result?trace_id=... 直到拿到 safe。
 */
export const SEC_CHECK_URL = 'https://mps.zedot.cn'

/**
 * 工具建议提交后端地址
 * 在代码中直接配置（勿通过页面设置）。为空则建议页提示未配置。
 */
export const SUGGESTION_URL = ''

const DEFAULT_CONFIG = {
  weather: {
    apiKey: '',
    label: '天气 API Key',
    placeholder: '留空使用免费接口 wttr.in',
  },
  todayInHistory: {
    apiKey: '',
    label: '历史上的今天 API Key',
    placeholder: '留空使用免费接口 xxapi.cn',
  },
  ancientPoetry: {
    apiKey: '',
    label: '诗泉 API Key',
    placeholder: '留空使用免费接口 poetry.palemoky.com',
  },
  exchangeRate: {
    apiKey: '',
    label: '汇率 API Key',
    placeholder: '留空使用免费接口 er-api.com',
  },
}

let _configCache = null

function loadConfig() {
  if (_configCache) return _configCache
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (raw) {
      _configCache = { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
      return _configCache
    }
  } catch (e) {}
  _configCache = { ...DEFAULT_CONFIG }
  return _configCache
}

function saveConfig(config) {
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(config))
    _configCache = { ...DEFAULT_CONFIG, ...config }
  } catch (e) {}
}

function getApiKey(toolKey) {
  return loadConfig()[toolKey]?.apiKey || ''
}

function setApiKey(toolKey, value) {
  const config = loadConfig()
  if (config[toolKey]) {
    config[toolKey].apiKey = value
    saveConfig(config)
  }
}

function getConfig() {
  return loadConfig()
}

function getSuggestionUrl() {
  return SUGGESTION_URL
}

function getSecCheckUrl() {
  return SEC_CHECK_URL
}

function resetConfig() {
  saveConfig({ ...DEFAULT_CONFIG })
}

export {
  DEFAULT_CONFIG,
  getConfig,
  saveConfig,
  getApiKey,
  setApiKey,
  getSuggestionUrl,
  getSecCheckUrl,
  resetConfig,
}
