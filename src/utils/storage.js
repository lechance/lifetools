/**
 * 本地存储工具函数
 * 封装 uni-app 的本地存储 API，带模块级缓存避免重复读写
 */

const _cache = {}

/**
 * 通用存储读取（带缓存）
 * @param {string} key
 * @param {*} defaultValue
 * @returns {*}
 */
function get(key, defaultValue = null) {
  if (_cache[key] !== undefined) return _cache[key]
  try {
    const raw = uni.getStorageSync(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      _cache[key] = parsed
      return parsed
    }
  } catch (e) {}
  return defaultValue
}

/**
 * 通用存储写入（自动失效缓存）
 * @param {string} key
 * @param {*} value
 */
function set(key, value) {
  try {
    uni.setStorageSync(key, JSON.stringify(value))
    _cache[key] = value
  } catch (e) {}
}

/**
 * 通用存储删除（自动失效缓存）
 * @param {string} key
 */
function remove(key) {
  try {
    uni.removeStorageSync(key)
    delete _cache[key]
  } catch (e) {}
}

/**
 * 批量预热缓存（App 启动时调用一次）
 * @param {string[]} keys
 */
function warmup(keys) {
  keys.forEach(key => {
    if (_cache[key] === undefined) get(key)
  })
}

const STORAGE_KEYS = {
  FAVORITES: 'lifetool_favorites',
  RECORDS: 'lifetool_records',
  SEARCH_HISTORY: 'lifetool_search_history'
}

/** ========== 收藏管理 ========== */

function getFavorites() {
  return get(STORAGE_KEYS.FAVORITES, [])
}

function toggleFavorite(toolId) {
  const favorites = getFavorites()
  const index = favorites.indexOf(toolId)
  if (index > -1) {
    favorites.splice(index, 1)
  } else {
    favorites.push(toolId)
  }
  set(STORAGE_KEYS.FAVORITES, favorites)
  return favorites.includes(toolId)
}

function isFavorited(toolId) {
  return getFavorites().includes(toolId)
}

/** ========== 使用记录管理 ========== */

function addRecord(toolId, toolName) {
  const records = getRecords()
  const filtered = records.filter(r => r.toolId !== toolId)
  filtered.unshift({
    id: `record_${Date.now()}`,
    toolId,
    toolName,
    timestamp: Date.now()
  })
  const trimmed = filtered.slice(0, 50)
  set(STORAGE_KEYS.RECORDS, trimmed)
  return trimmed
}

function getRecords() {
  return get(STORAGE_KEYS.RECORDS, [])
}

function clearRecords() {
  set(STORAGE_KEYS.RECORDS, [])
  return true
}

/** ========== 搜索历史管理 ========== */

function addSearchHistory(keyword) {
  if (!keyword || !keyword.trim()) return
  const history = getSearchHistory()
  const filtered = history.filter(h => h !== keyword.trim())
  filtered.unshift(keyword.trim())
  set(STORAGE_KEYS.SEARCH_HISTORY, filtered.slice(0, 20))
}

function getSearchHistory() {
  return get(STORAGE_KEYS.SEARCH_HISTORY, [])
}

function clearSearchHistory() {
  set(STORAGE_KEYS.SEARCH_HISTORY, [])
}

export {
  STORAGE_KEYS,
  get,
  set,
  remove,
  warmup,
  getFavorites,
  toggleFavorite,
  isFavorited,
  addRecord,
  getRecords,
  clearRecords,
  addSearchHistory,
  getSearchHistory,
  clearSearchHistory
}
