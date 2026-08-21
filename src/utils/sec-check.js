/**
 * 内容安全校验（微信小程序）
 * 图片内容安全检测（mediaCheckAsync 异步流程）：
 *   1) uni.login 获取 code
 *   2) POST /api/sec-check/image 上传图片 + code → { code, trace_id }
 *   3) 轮询 GET /api/sec-check/result?trace_id=... 直到拿到 { code, safe }
 * 命中违规或校验失败均不允许保存（fail-closed）；未配置后端地址则跳过校验（fail-open）。
 * 检测结果仅提示「含违规内容」，不透传具体违规细节。
 *
 * 使用方式：
 *   - 打开图片时调用 secCheck(path) → 显示「正在验证...」，返回 { safe, error }
 *   - 保存时将结果传给 saveCheckedImage(path, callbacks, { safe, error })，命中 safe 则跳过重复检测
 */
import { getSecCheckUrl } from '@/utils/api-config'
import { showLoading, hideLoading } from '@/utils/helpers'

/** 违规提示（微信要求的安全说明） */
export const SEC_CHECK_RISKY_MSG = '您发布的图片包含违规内容'
/** 检测失败提示 */
export const SEC_CHECK_ERROR_MSG = '内容检测失败，请重试'

/** 结果轮询间隔（ms） */
const POLL_INTERVAL = 2000
/** 结果轮询总超时（ms） */
const POLL_TIMEOUT = 30000

/** 获取 wx.login 临时凭证 */
function getLoginCode() {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (res) => resolve(res.code),
      fail: () => reject(new Error('LOGIN_FAIL'))
    })
  })
}

/** 轮询异步检测结果，直到拿到 safe 或超时 */
function pollResult(baseUrl, traceId) {
  return new Promise((resolve) => {
    const url = `${baseUrl}/api/sec-check/result?trace_id=${encodeURIComponent(traceId)}`
    const startTime = Date.now()
    const tick = () => {
      uni.request({
        url,
        timeout: 10000,
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            if (data && typeof data.safe === 'boolean') {
              resolve({ safe: data.safe, error: data.safe ? '' : 'RISKY' })
              return
            }
            if (Date.now() - startTime >= POLL_TIMEOUT) {
              resolve({ safe: false, error: 'TIMEOUT' })
              return
            }
            setTimeout(tick, POLL_INTERVAL)
          } catch (e) {
            resolve({ safe: false, error: 'BAD_RESPONSE' })
          }
        },
        fail: () => {
          if (Date.now() - startTime >= POLL_TIMEOUT) {
            resolve({ safe: false, error: 'NETWORK' })
            return
          }
          setTimeout(tick, POLL_INTERVAL)
        }
      })
    }
    tick()
  })
}

/**
 * 图片内容安全校验（打开图片时调用）
 * 显示「正在验证...」加载提示，返回 { safe, error }
 * @param {string} tempFilePath 本地图片路径
 * @returns {Promise<{safe: boolean, error: string}>}
 */
export function secCheck(tempFilePath) {
  return new Promise((resolve) => {
    const baseUrl = getSecCheckUrl()
    if (!baseUrl) {
      resolve({ safe: true, error: '' })
      return
    }
    showLoading('正在验证...')
    const done = (result) => {
      hideLoading()
      resolve(result)
    }
    getLoginCode().then((code) => {
      uni.uploadFile({
        url: `${baseUrl}/api/sec-check/image`,
        filePath: tempFilePath,
        name: 'media',
        formData: { code },
        timeout: 15000,
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            if (data && typeof data.safe === 'boolean') {
              done({ safe: data.safe, error: data.safe ? '' : 'RISKY' })
              return
            }
            if (data && data.trace_id) {
              pollResult(baseUrl, data.trace_id).then(done)
              return
            }
            done({ safe: false, error: 'BAD_RESPONSE' })
          } catch (e) {
            done({ safe: false, error: 'BAD_RESPONSE' })
          }
        },
        fail: () => done({ safe: false, error: 'NETWORK' })
      })
    }).catch(() => done({ safe: false, error: 'LOGIN_FAIL' }))
  })
}

/**
 * 校验通过后再保存到相册（微信小程序）
 * 违规 → 提示含违规内容并中止；校验失败 → 提示请重试并中止（fail-closed）；未配置 → 直接保存
 * @param {string} tempFilePath
 * @param {{onSuccess?: Function, onFail?: Function}} callbacks
 * @param {{safe?: boolean, error?: string}|null} preCheck  打开图片时 secCheck 的结果，命中 safe 则跳过检测
 */
export function saveCheckedImage(tempFilePath, { onSuccess, onFail } = {}, preCheck = null) {
  const doSave = () => {
    uni.saveImageToPhotosAlbum({
      filePath: tempFilePath,
      success: onSuccess,
      fail: onFail
    })
  }

  if (preCheck && preCheck.safe) {
    doSave()
    return
  }

  if (preCheck && !preCheck.safe) {
    uni.showToast({
      title: preCheck.error === 'RISKY' ? SEC_CHECK_RISKY_MSG : SEC_CHECK_ERROR_MSG,
      icon: 'none'
    })
    return
  }

  secCheck(tempFilePath).then(({ safe, error }) => {
    if (!safe) {
      uni.showToast({
        title: error === 'RISKY' ? SEC_CHECK_RISKY_MSG : SEC_CHECK_ERROR_MSG,
        icon: 'none'
      })
      return
    }
    doSave()
  })
}