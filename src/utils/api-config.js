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

// 默认配置（留空表示使用免费接口，无需填写）
const DEFAULT_CONFIG = {
  // 天气查询 - 可替换为和风天气等付费 API
  weather: {
    apiKey: '',
    label: '天气 API Key',
    placeholder: '留空使用免费接口 wttr.in',
  },
  // 历史上的今天 - 可替换为聚合数据等付费 API
  todayInHistory: {
    apiKey: '',
    label: '历史上的今天 API Key',
    placeholder: '留空使用免费接口 xxapi.cn',
  },
  // 古诗文 - 可替换为诗泉付费 API
  ancientPoetry: {
    apiKey: '',
    label: '古诗文 API Key',
    placeholder: '留空使用免费接口 poetry.palemoky.com',
  },
  // 汇率换算 - 可替换为 ExchangeRate-API 付费计划
  exchangeRate: {
    apiKey: '',
    label: '汇率 API Key',
    placeholder: '留空使用免费接口 er-api.com',
  },
  // 工具建议 - 提交建议的 HTTP 接口地址
  suggestion: {
    url: '',
    label: '工具建议提交地址',
    placeholder: '填写接收建议的接口地址（POST）',
  },
}

function loadConfig() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      return { ...DEFAULT_CONFIG, ...saved }
    }
  } catch (e) {}
  return { ...DEFAULT_CONFIG }
}

function saveConfig(config) {
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(config))
  } catch (e) {}
}

function getApiKey(toolKey) {
  const config = loadConfig()
  return config[toolKey]?.apiKey || ''
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
