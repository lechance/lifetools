/**
 * API 响应缓存工具
 * 基于 storage 持久化，相同请求在 TTL 内直接返回缓存
 */

import { get, set, remove } from '@/utils/storage'

const CACHE_PREFIX = 'lifetool_api_cache_'
const DEFAULT_TTL = 10 * 60 * 1000 // 10 分钟

function makeKey(url, method = 'GET') {
  return CACHE_PREFIX + method + ':' + url
}

/**
 * 带缓存的网络请求
 * @param {string} url
 * @param {object} options - uni.request 选项（不含 url/method）
 * @param {number} ttl - 缓存时间（毫秒），默认 10 分钟
 * @returns {Promise<any>} 响应数据
 */
export function cachedFetch(url, options = {}, ttl = DEFAULT_TTL) {
  const method = (options.method || 'GET').toUpperCase()
  const cacheKey = makeKey(url, method)

  const cached = get(cacheKey)
  if (cached && Date.now() - cached.ts < ttl) {
    return Promise.resolve(cached.data)
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method,
      ...options,
      timeout: options.timeout || 10000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          set(cacheKey, { ts: Date.now(), data: res.data })
          resolve(res.data)
        } else {
          reject(new Error('请求失败: ' + res.statusCode))
        }
      },
      fail: (err) => reject(err)
    })
  })
}

/**
 * 清除指定 URL 的缓存
 */
export function clearFetchCache(url, method = 'GET') {
  remove(makeKey(url, method))
}

/**
 * 清除所有 API 缓存
 */
export function clearAllFetchCache() {
  try {
    const res = uni.getStorageInfoSync()
    res.keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        remove(key)
      }
    })
  } catch (e) {}
}
