/**
 * 本地存储工具函数
 * 封装 uni-app 的本地存储 API，管理收藏和使用记录
 */

const STORAGE_KEYS = {
  FAVORITES: 'lifetool_favorites',
  RECORDS: 'lifetool_records',
  SEARCH_HISTORY: 'lifetool_search_history'
}

/** ========== 收藏管理 ========== */

/** 获取所有收藏的工具 ID 列表 */
function getFavorites() {
  try {
    const data = uni.getStorageSync(STORAGE_KEYS.FAVORITES)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('获取收藏失败:', e)
    return []
  }
}

/** 切换收藏状态（收藏/取消收藏） */
function toggleFavorite(toolId) {
  const favorites = getFavorites()
  const index = favorites.indexOf(toolId)
  if (index > -1) {
    favorites.splice(index, 1)
  } else {
    favorites.push(toolId)
  }
  uni.setStorageSync(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites))
  return favorites.includes(toolId)
}

/** 检查工具是否已收藏 */
function isFavorited(toolId) {
  const favorites = getFavorites()
  return favorites.includes(toolId)
}

/** ========== 使用记录管理 ========== */

/** 添加使用记录 */
function addRecord(toolId, toolName) {
  try {
    const records = getRecords()
    // 移除已有相同工具的记录（避免重复）
    const filtered = records.filter(r => r.toolId !== toolId)
    // 在最前面插入新记录
    filtered.unshift({
      id: `record_${Date.now()}`,
      toolId,
      toolName,
      timestamp: Date.now()
    })
    // 只保留最近50条记录
    const trimmed = filtered.slice(0, 50)
    uni.setStorageSync(STORAGE_KEYS.RECORDS, JSON.stringify(trimmed))
    return trimmed
  } catch (e) {
    console.error('添加使用记录失败:', e)
    return []
  }
}

/** 获取使用记录列表 */
function getRecords() {
  try {
    const data = uni.getStorageSync(STORAGE_KEYS.RECORDS)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('获取使用记录失败:', e)
    return []
  }
}

/** 清空使用记录 */
function clearRecords() {
  try {
    uni.setStorageSync(STORAGE_KEYS.RECORDS, JSON.stringify([]))
    return true
  } catch (e) {
    console.error('清空记录失败:', e)
    return false
  }
}

/** ========== 搜索历史管理 ========== */

/** 添加搜索历史 */
function addSearchHistory(keyword) {
  if (!keyword || !keyword.trim()) return
  try {
    const history = getSearchHistory()
    const filtered = history.filter(h => h !== keyword.trim())
    filtered.unshift(keyword.trim())
    const trimmed = filtered.slice(0, 20)
    uni.setStorageSync(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(trimmed))
  } catch (e) {
    console.error('保存搜索历史失败:', e)
  }
}

/** 获取搜索历史 */
function getSearchHistory() {
  try {
    const data = uni.getStorageSync(STORAGE_KEYS.SEARCH_HISTORY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    return []
  }
}

/** 清空搜索历史 */
function clearSearchHistory() {
  try {
    uni.setStorageSync(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify([]))
  } catch (e) {
    console.error('清空搜索历史失败:', e)
  }
}

export {
  STORAGE_KEYS,
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
