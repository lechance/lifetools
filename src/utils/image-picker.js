/**
 * 图片选择统一封装
 * 替代各工具页散落的 uni.chooseImage / uni.chooseMessageFile，
 * 提供与 watermark 工具一致的三来源选择（拍摄 / 相册 / 聊天记录）。
 */

/**
 * 选择图片
 * @param {Object} opts
 * @param {'camera'|'album'|'message'} opts.source - 图片来源
 * @param {number} [opts.count=1] - 可选数量
 * @returns {Promise<{ paths: string[], tempFiles?: any[] }>}
 *   paths - 选中的图片路径数组；tempFiles - chooseImage 的原始文件信息（含 size，供压缩等场景使用）
 */
export function pickImage({ source, count = 1 }) {
  return new Promise((resolve, reject) => {
    // 从聊天记录选择（仅微信小程序）
    if (source === 'message') {
      uni.chooseMessageFile({
        count,
        type: 'image',
        success: (res) => {
          const tempFiles = res.tempFiles || []
          resolve({
            paths: tempFiles.map((f) => f.path).filter(Boolean),
            tempFiles
          })
        },
        fail: reject
      })
      return
    }

    // 拍摄 / 从相册选择
    uni.chooseImage({
      count,
      sizeType: ['original', 'compressed'],
      sourceType: source === 'camera' ? ['camera'] : ['album'],
      success: (res) => {
        resolve({
          paths: res.tempFilePaths || [],
          tempFiles: res.tempFiles
        })
      },
      fail: reject
    })
  })
}
