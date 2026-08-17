/**
 * 内容安全校验（微信小程序）
 * 图片保存/导出前调用后端异步检测（mediaCheckAsync）：
 *   1) uni.login 获取 code
 *   2) POST /api/sec-check/image 上传图片 + code → { code, trace_id }
 *   3) 轮询 GET /api/sec-check/result?trace_id=... 直到拿到 { code, safe }
 * 命中违规或校验失败均不允许保存（fail-closed）；未配置后端地址则跳过校验（fail-open）。
 * 检测结果仅提示「含违规信息」，不透传具体违规细节。
 */
import { getSecCheckUrl } from '@/utils/api-config'

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
            // pending / 其它 → 继续轮询
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
          // 网络错误重试直到超时
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
 * 上传图片进行内容安全校验（异步：提交 + 轮询结果）
 * @param {string} tempFilePath 本地图片路径（canvas 导出或选图）
 * @returns {Promise<{safe: boolean, error: string}>}
 *   safe=true 通过；safe=false 未通过或校验失败（error 区分原因）
 */
export function checkImage(tempFilePath) {
  return new Promise((resolve) => {
    const baseUrl = getSecCheckUrl()
    if (!baseUrl) {
      // 未配置后端地址 → 跳过校验，直接放行（fail-open）
      resolve({ safe: true, error: '' })
      return
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
              // 后端同步放行的场景（如服务端走同步检测）
              resolve({ safe: data.safe, error: data.safe ? '' : 'RISKY' })
              return
            }
            if (data && data.trace_id) {
              pollResult(baseUrl, data.trace_id).then(resolve)
              return
            }
            resolve({ safe: false, error: 'BAD_RESPONSE' })
          } catch (e) {
            resolve({ safe: false, error: 'BAD_RESPONSE' })
          }
        },
        fail: () => resolve({ safe: false, error: 'NETWORK' })
      })
    }).catch(() => resolve({ safe: false, error: 'LOGIN_FAIL' }))
  })
}

/**
 * 校验通过后再保存到相册（微信小程序）
 * 违规 → 提示含违规内容并中止；校验失败 → 提示请重试并中止（fail-closed）；未配置 → 直接保存
 * @param {string} tempFilePath
 * @param {{onSuccess?: Function, onFail?: Function}} callbacks
 */
export function saveCheckedImage(tempFilePath, { onSuccess, onFail } = {}) {
  checkImage(tempFilePath).then(({ safe, error }) => {
    if (!safe) {
      uni.showToast({
        title: error === 'RISKY' ? SEC_CHECK_RISKY_MSG : SEC_CHECK_ERROR_MSG,
        icon: 'none'
      })
      return
    }
    uni.saveImageToPhotosAlbum({
      filePath: tempFilePath,
      success: onSuccess,
      fail: onFail
    })
  })
}