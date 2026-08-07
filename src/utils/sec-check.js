/**
 * 内容安全校验（微信小程序）
 * 图片保存/导出前调用后端 /api/sec-check/image，
 * 由后端调微信 imgSecCheck 同步检测。命中违规或校验失败均不允许保存（fail-closed）。
 * 检测结果仅提示「含违规信息」，不透传具体违规细节。
 */
import { getSecCheckUrl } from '@/utils/api-config'

/** 违规提示（微信要求的安全说明） */
export const SEC_CHECK_RISKY_MSG = '您发布的图片包含违规内容'
/** 检测失败提示 */
export const SEC_CHECK_ERROR_MSG = '内容检测失败，请重试'

/**
 * 上传图片进行内容安全校验
 * @param {string} tempFilePath 本地图片路径（canvas 导出或选图）
 * @returns {Promise<{safe: boolean, error: string}>}
 *   safe=true 通过；safe=false 未通过或校验失败（error 区分原因）
 */
export function checkImage(tempFilePath) {
  return new Promise((resolve) => {
    const url = getSecCheckUrl()
    if (!url) {
      resolve({ safe: false, error: 'NOT_CONFIGURED' })
      return
    }
    uni.uploadFile({
      url,
      filePath: tempFilePath,
      name: 'media',
      timeout: 15000,
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data && typeof data.safe === 'boolean') {
            resolve({ safe: data.safe, error: data.safe ? '' : 'RISKY' })
          } else {
            resolve({ safe: false, error: 'BAD_RESPONSE' })
          }
        } catch (e) {
          resolve({ safe: false, error: 'BAD_RESPONSE' })
        }
      },
      fail: () => resolve({ safe: false, error: 'NETWORK' })
    })
  })
}

/**
 * 校验通过后再保存到相册（微信小程序）
 * 违规 → 提示含违规内容并中止；校验失败/未配置 → 提示请重试并中止（fail-closed）
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
