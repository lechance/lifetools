/**
 * 用户数据云同步（session 级，仅微信小程序）
 * - 身份：wx.login code → 服务端换 openid，不传输任何自报身份
 * - 时机：App 启动 pull 合并、退后台 push；设置页可「立即同步」
 * - 冲突：last-write-wins，按行比较 updated_at；本地内容未变化时沿用旧时间戳，
 *   避免旧设备把新设备写入的数据覆盖回去（哈希探测变化）
 * - 范围：全局数据（收藏/使用记录/搜索历史/登录资料）+ 按工具勾选的独立存储数据
 * - 后端地址复用 api-config 的 SEC_CHECK_URL 基础地址
 */
import { getSecCheckUrl } from '@/utils/api-config'
import {
  STORAGE_KEYS,
  get as storageGet,
  set as storageSet,
  getUserProfile,
  saveUserProfile,
  getFavorites,
  getRecords,
  getSearchHistory,
} from '@/utils/storage'

const SYNC_ENABLED_KEY = 'lifetool_sync_enabled'
const SYNC_TOOLS_KEY = 'lifetool_sync_tools'
const SYNC_ROW_TS_KEY = 'lifetool_sync_row_ts'
const SYNC_ROW_HASH_KEY = 'lifetool_sync_row_hash'
const SYNC_LAST_AT_KEY = 'lifetool_sync_last_at'

/** 支持按工具同步的独立存储 key（raw 字符串读写，保持各工具自身序列化格式） */
export const TOOL_DATA_KEYS = {
  'todo-list': ['lifetool_todo'],
  memo: ['lifetool_memo'],
  calendar: ['lifetool_calendar'],
  'period-tracker': ['lifetool_period'],
  'shelf-life': ['lifetool_shelf_items'],
  countdown: ['lifetool_custom_dates'],
  decibel: ['lifetool_decibel_records'],
  'birthday-countdown': ['lifetool_birthdays', 'lifetool_birthday_settings'],
}

// #ifdef MP-WEIXIN
const SUPPORTED = true
// #endif
// #ifndef MP-WEIXIN
const SUPPORTED = false
// #endif

function getRowTs() {
  return storageGet(SYNC_ROW_TS_KEY, {})
}
function getRowHash() {
  return storageGet(SYNC_ROW_HASH_KEY, {})
}
function rowKey(scope, type) {
  return `${scope}|${type}`
}

/** djb2 字符串哈希（内容变化探测用，非安全用途） */
function hashString(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0
  }
  return String(h >>> 0)
}

/** ====== 同步开关配置 ====== */

export function isEnabled() {
  return SUPPORTED && !!storageGet(SYNC_ENABLED_KEY, false)
}

export function setEnabled(value) {
  storageSet(SYNC_ENABLED_KEY, !!value)
}

export function getEnabledTools() {
  const list = storageGet(SYNC_TOOLS_KEY, [])
  return Array.isArray(list) ? list.filter((id) => TOOL_DATA_KEYS[id]) : []
}

export function setEnabledTools(ids) {
  storageSet(
    SYNC_TOOLS_KEY,
    (Array.isArray(ids) ? ids : []).filter((id) => TOOL_DATA_KEYS[id])
  )
}

export function getLastSyncAt() {
  return storageGet(SYNC_LAST_AT_KEY, 0)
}

export function isSupported() {
  return SUPPORTED
}

/** ====== 数据收集与回写 ====== */

/** 收集全局行（收藏/记录/搜索历史/资料），data 为 JS 值 */
function collectGlobalItems() {
  const items = []
  const profile = getUserProfile()
  if (profile) items.push({ scope: '_profile', type: 'profile', data: profile })
  items.push({ scope: '_global', type: 'favorites', data: getFavorites() })
  items.push({ scope: '_global', type: 'records', data: getRecords() })
  items.push({ scope: '_global', type: 'search_history', data: getSearchHistory() })
  return items
}

/** 收集已启用工具的原始存储行，data 为 raw 存储字符串（空串跳过） */
function collectToolItems(toolIds) {
  const items = []
  toolIds.forEach((id) => {
    ;(TOOL_DATA_KEYS[id] || []).forEach((key) => {
      const raw = uni.getStorageSync(key)
      if (raw !== '' && raw != null) {
        items.push({ scope: id, type: key, data: String(raw) })
      }
    })
  })
  return items
}

/** 组装 push 载荷：内容有变化的行用当前时间戳，未变化的沿用上次时间戳 */
function buildPushItems() {
  const toolIds = getEnabledTools()
  const rows = [
    ...collectGlobalItems(),
    ...collectToolItems(toolIds),
    { scope: '_sync', type: 'config', data: { enabledToolIds: toolIds } },
  ]
  const tsMap = getRowTs()
  const hashMap = getRowHash()
  const now = Date.now()
  const nextTs = {}
  const nextHash = {}
  const items = rows.map((row) => {
    const key = rowKey(row.scope, row.type)
    const serialized = JSON.stringify(row.data)
    const hash = hashString(serialized)
    let ts
    if (hash !== hashMap[key]) {
      ts = now
    } else {
      ts = tsMap[key] || 0
    }
    nextTs[key] = ts
    nextHash[key] = hash
    return { scope: row.scope, data_type: row.type, data: row.data, updated_at: ts }
  })
  return { items, nextTs, nextHash }
}

/** 应用服务端行到本地；返回发生变动的全局集合标记（供调用方刷新 Vuex） */
function applyIncoming(items) {
  const tsMap = getRowTs()
  const hashMap = getRowHash()
  const nextTs = { ...tsMap }
  const nextHash = { ...hashMap }
  const changed = { favorites: false, records: false, searchHistory: false, tools: [] }

  items.forEach((item) => {
    const { scope, data_type: type, data, updated_at: ts } = item
    if (typeof scope !== 'string' || typeof type !== 'string') return
    const key = rowKey(scope, type)
    const localTs = tsMap[key] || 0
    // 本地较新（或等新）→ 不动本地；推送阶段会以本地为准覆盖服务端
    if (!(ts > localTs)) return

    try {
      if (scope === '_global' && type === 'favorites') {
        if (!Array.isArray(data)) return
        storageSet(STORAGE_KEYS.FAVORITES, data)
        changed.favorites = true
      } else if (scope === '_global' && type === 'records') {
        if (!Array.isArray(data)) return
        storageSet(STORAGE_KEYS.RECORDS, data)
        changed.records = true
      } else if (scope === '_global' && type === 'search_history') {
        if (!Array.isArray(data)) return
        storageSet(STORAGE_KEYS.SEARCH_HISTORY, data)
        changed.searchHistory = true
      } else if (scope === '_profile' && type === 'profile') {
        if (!data || typeof data !== 'object') return
        saveUserProfile(data)
      } else if (scope === '_sync' && type === 'config') {
        if (data && Array.isArray(data.enabledToolIds)) {
          setEnabledTools(data.enabledToolIds)
        }
      } else if (TOOL_DATA_KEYS[scope] && TOOL_DATA_KEYS[scope].includes(type)) {
        if (typeof data !== 'string') return
        uni.setStorageSync(type, data)
        changed.tools.push(scope)
      } else {
        return
      }
      nextTs[key] = ts
      nextHash[key] = hashString(JSON.stringify(data))
    } catch (e) {
      console.error('[sync] 应用云端数据失败', key, e)
    }
  })

  storageSet(SYNC_ROW_TS_KEY, nextTs)
  storageSet(SYNC_ROW_HASH_KEY, nextHash)
  return changed
}

/** ====== 网络 ====== */

function loginCode() {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (res) => (res.code ? resolve(res.code) : reject(new Error('NO_CODE'))),
      fail: () => reject(new Error('LOGIN_FAIL')),
    })
  })
}

function post(path, payload) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${getSecCheckUrl()}/api/sync${path}`,
      method: 'POST',
      timeout: 10000,
      header: { 'content-type': 'application/json' },
      data: payload,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.code === 0) {
          resolve(res.data)
        } else {
          const msg = res.data && res.data.message ? res.data.message : `HTTP ${res.statusCode}`
          reject(new Error(msg))
        }
      },
      fail: () => reject(new Error('NETWORK')),
    })
  })
}

/** ====== 对外主流程（静默失败，离线优先） ====== */

/**
 * 拉取并合并云端数据。返回 { skipped } 或 { changed }
 * changed 标记需要调用方刷新的全局集合（dispatch('reloadUserData')）
 */
export async function pullSync() {
  if (!SUPPORTED || !isEnabled()) return { skipped: true }
  const base = getSecCheckUrl()
  if (!base) return { skipped: true }
  try {
    const code = await loginCode()
    const res = await post('/pull', { code })
    const changed = applyIncoming(res.items || [])
    storageSet(SYNC_LAST_AT_KEY, Date.now())
    return { changed }
  } catch (e) {
    console.log('[sync] pull 跳过:', e.message)
    return { skipped: true }
  }
}

/**
 * 收集本地数据推送到云端。返回 { skipped } 或 { applied, total }
 */
export async function pushSync() {
  if (!SUPPORTED || !isEnabled()) return { skipped: true }
  const base = getSecCheckUrl()
  if (!base) return { skipped: true }
  try {
    const code = await loginCode()
    const { items, nextTs, nextHash } = buildPushItems()
    const res = await post('/push', { code, items })
    storageSet(SYNC_ROW_TS_KEY, nextTs)
    storageSet(SYNC_ROW_HASH_KEY, nextHash)
    storageSet(SYNC_LAST_AT_KEY, Date.now())
    return { applied: res.applied, total: res.total }
  } catch (e) {
    console.log('[sync] push 跳过:', e.message)
    return { skipped: true }
  }
}

/**
 * 完整同步：先 pull 合并（避免覆盖他端新数据），再 push 本地变更。
 * @param {object} store Vuex store 实例，用于合并后刷新全局状态
 */
export async function syncNow(store) {
  const pulled = await pullSync()
  if (pulled.changed && store) {
    store.dispatch('reloadUserData')
  }
  const pushed = await pushSync()
  const ok = !(pulled.skipped && pushed.skipped)
  return { ok }
}

/**
 * 清除云端备份（当前开启范围内的所有行 + 同步配置行）。
 * 返回 { ok, deleted } / { ok:false } / { skipped:true }
 */
export async function clearServerData() {
  if (!SUPPORTED || !isEnabled()) return { skipped: true }
  const base = getSecCheckUrl()
  if (!base) return { skipped: true }
  try {
    const code = await loginCode()
    const items = [
      { scope: '_global', data_type: 'favorites' },
      { scope: '_global', data_type: 'records' },
      { scope: '_global', data_type: 'search_history' },
      { scope: '_profile', data_type: 'profile' },
      { scope: '_sync', data_type: 'config' },
      ...getEnabledTools().flatMap((id) =>
        TOOL_DATA_KEYS[id].map((key) => ({ scope: id, data_type: key }))
      ),
    ]
    const res = await post('/delete', { code, items })
    return { ok: true, deleted: res.deleted }
  } catch (e) {
    console.log('[sync] clear 失败:', e.message)
    return { ok: false }
  }
}
