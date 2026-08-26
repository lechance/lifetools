import { AD_UNIT_ID } from './api-config'
import { toolRequiresAd } from './app-config'
import { addRecord } from './storage'

/** 会话级解锁记录（冷启动后每个工具只需看一次广告） */
const unlocked = new Set()

/** 每个页面缓存独立的广告实例（微信页面内单例限制） */
const adInstances = {}

/**
 * 获取或创建当前页面的广告实例
 * 首次创建后绑定 onClose 监听器；后续复用同一实例
 */
function getAdInstance(pageRoute) {
  if (adInstances[pageRoute]) return adInstances[pageRoute]
  try {
    const ad = wx.createRewardedVideoAd({ adUnitId: AD_UNIT_ID, multiton: true })
    ad.onError((err) => {
      console.warn('[ad-gate] onError', err)
    })
    ad.onLoad(() => {
      console.log('[ad-gate] onLoad')
    })
    adInstances[pageRoute] = ad
    return ad
  } catch (e) {
    console.warn('[ad-gate] createRewardedVideoAd failed:', e)
    return null
  }
}

/**
 * 播放激励视频广告，返回是否完整观看
 * @returns {Promise<boolean>}
 */
function showRewardedAd(pageRoute) {
  return new Promise((resolve) => {
    const ad = getAdInstance(pageRoute)
    if (!ad) { resolve(true); return } // fail-open

    let settled = false
    const done = (val) => {
      if (settled) return
      settled = true
      resolve(val)
    }

    const onLoad = () => {
      ad.show().catch(() => done(true)) // show 失败 → fail-open
    }
    const onError = (err) => {
      ad.offLoad(onLoad)
      ad.offError(onError)
      ad.offClose(onClose)
      console.warn('[ad-gate] load error:', err)
      done(true) // fail-open
    }
    const onClose = (res) => {
      ad.offLoad(onLoad)
      ad.offError(onError)
      ad.offClose(onClose)
      done((res && res.isEnded) || res === undefined)
    }

    ad.onLoad(onLoad)
    ad.onError(onError)
    ad.onClose(onClose)

    ad.load().catch(() => {
      ad.offLoad(onLoad)
      ad.offError(onError)
      ad.offClose(onClose)
      done(true) // fail-open
    })

    // 超时兜底（8 秒）
    setTimeout(() => done(true), 8000)
  })
}

/**
 * 打开工具页（统一入口）
 * @param {Object} tool - 工具元数据 { id, name, ... }
 * @param {string} pageRoute - 当前页面路由（用于广告实例隔离）
 */
export async function openTool(tool, pageRoute) {
  if (!tool || !tool.id) return

  // 记录使用
  try { addRecord(tool.id) } catch {}

  const needsAd = AD_UNIT_ID && toolRequiresAd(tool.id) && !unlocked.has(tool.id)

  if (needsAd) {
    try {
      const confirmed = await new Promise((resolve) => {
        uni.showModal({
          title: '观看广告',
          content: '该工具需观看一段视频广告后使用，是否继续？',
          confirmText: '观看',
          cancelText: '取消',
          success: (res) => resolve(res.confirm),
          fail: () => resolve(false)
        })
      })

      if (!confirmed) return

      const watched = await showRewardedAd(pageRoute)
      if (!watched) {
        uni.showToast({ title: '需完整观看广告', icon: 'none', duration: 2000 })
        return
      }
      unlocked.add(tool.id)
    } catch {}
  }

  uni.navigateTo({ url: `/pages/tools/${tool.id}/index` })
}
