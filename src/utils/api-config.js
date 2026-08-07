/**
 * API 配置管理
 * 集中管理各工具的 API Key 和自定义配置
 * 用户可在「我的 → API 设置」中自行填写
 */

const STORAGE_KEY = 'lifetool_api_config'

/**
 * 生日倒计时 - 微信订阅消息模板 ID
 * 在微信公众平台「订阅消息」申请模板后，将模板 ID 填入此处。
 * 注意：本仓库为纯前端，requestSubscribeMessage 仅完成用户订阅授权；
 * 实际推送需服务端调用 subscribeMessage.send 接口下发（需部署后端 + 模板 ID + openid）。
 */
export const BIRTHDAY_TEMPLATE_ID = ''

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
    label: '古诗文 API Key',
    placeholder: '留空使用免费接口 poetry.palemoky.com',
  },
  exchangeRate: {
    apiKey: '',
    label: '汇率 API Key',
    placeholder: '留空使用免费接口 er-api.com',
  },
  suggestion: {
    url: '',
    label: '工具建议提交地址',
    placeholder: '填写接收建议的接口地址（POST）',
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
  return loadConfig().suggestion?.url || ''
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
  resetConfig,
}
