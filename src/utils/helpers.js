/**
 * 通用工具函数集
 */

/** 防抖函数 */
function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

/** 节流函数 */
function throttle(fn, delay = 300) {
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last >= delay) {
      last = now
      fn.apply(this, args)
    }
  }
}

/** 格式化时间戳 */
function formatTimestamp(timestamp, format = 'YYYY-MM-DD HH:mm:ss') {
  const date = new Date(timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  const map = {
    'YYYY': date.getFullYear(),
    'MM': pad(date.getMonth() + 1),
    'DD': pad(date.getDate()),
    'HH': pad(date.getHours()),
    'mm': pad(date.getMinutes()),
    'ss': pad(date.getSeconds())
  }
  let result = format
  Object.keys(map).forEach(key => {
    result = result.replace(key, map[key])
  })
  return result
}

/** 生成随机 ID */
function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/** 显示轻提示 */
function showToast(title, icon = 'none', duration = 2000) {
  uni.showToast({ title, icon, duration })
}

/** 显示成功提示 */
function showSuccess(title) {
  uni.showToast({ title, icon: 'success', duration: 1500 })
}

/** 显示加载中 */
function showLoading(title = '加载中...') {
  uni.showLoading({ title, mask: true })
}

/** 隐藏加载 */
function hideLoading() {
  uni.hideLoading()
}

/** 显示模态对话框 */
function showModal(options) {
  return new Promise((resolve) => {
    uni.showModal({
      title: options.title || '提示',
      content: options.content || '',
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

export {
  debounce,
  throttle,
  formatTimestamp,
  generateId,
  showToast,
  showSuccess,
  showLoading,
  hideLoading,
  showModal
}
