/**
 * 工具数据定义
 * 定义所有工具的元数据（名称、图标、分类、路径、颜色等）
 * 注意：第一阶段使用 emoji 作为图标，后期可替换为图片
 */

// 工具颜色映射 - 不同分类使用不同色系
const COLORS = {
  hot: '#4F6EF7',       // 靛蓝 - 热门
  life: '#4CAF50',       // 绿色 - 生活
  fun: '#FF9800',        // 橙色 - 娱乐
  image: '#E91E63',       // 粉色 - 图片
  calc: '#9C27B0',       // 紫色 - 计算
  utility: '#00BCD4'     // 青色 - 实用
}

/** 热门工具 */
const HOT_TOOLS = [
  { id: 'calculator', name: '科学计算器', icon: '🔢', color: COLORS.hot },
  { id: 'flashlight', name: 'SOS手电筒', icon: '🔦', color: COLORS.hot },
  { id: 'countdown', name: '节日倒计时', icon: '⏰', color: COLORS.hot },
  { id: 'today-in-history', name: '历史上的今天', icon: '📜', color: COLORS.hot },
  { id: 'safe-period', name: '安全期计算', icon: '📊', color: COLORS.hot },
  { id: 'shelf-life', name: '保质期计算', icon: '📅', color: COLORS.hot },
  { id: 'pomodoro', name: '番茄专注', icon: '🍅', color: COLORS.hot },
  { id: 'led-marquee', name: 'LED弹幕', icon: '💡', color: COLORS.hot },
  { id: 'date-calc', name: '日期计算器', icon: '📆', color: COLORS.hot },
  { id: 'random', name: '随机数生成', icon: '🎲', color: COLORS.hot },
  { id: 'unit-convert', name: '单位换算', icon: '📐', color: COLORS.hot }
]

/** 生活工具 */
const LIFE_TOOLS = [
  { id: 'weather', name: '天气查询', icon: '🌤️', color: COLORS.life },
  { id: 'calendar', name: '日历日程', icon: '📅', color: COLORS.life },
  { id: 'exchange-rate', name: '汇率换算', icon: '💱', color: COLORS.life },
  { id: 'size-chart', name: '尺码对照', icon: '📏', color: COLORS.life },
  { id: 'period-tracker', name: '生理期记录', icon: '❤️', color: COLORS.life },
  { id: 'garbage-classify', name: '垃圾分类查询', icon: '♻️', color: COLORS.life }
]

/** 娱乐工具 */
const FUN_TOOLS = [
  { id: 'dice', name: '掷骰子', icon: '🎲', color: COLORS.fun },
  { id: 'lottery', name: '抽签摇号', icon: '🎯', color: COLORS.fun },
  { id: 'sudoku', name: '数独游戏', icon: '🧩', color: COLORS.fun },
  { id: 'idiom-chain', name: '成语接龙', icon: '📖', color: COLORS.fun },
  { id: 'guess-number', name: '猜数字', icon: '❓', color: COLORS.fun },
  { id: 'rock-scissors', name: '石头剪刀布', icon: '✊', color: COLORS.fun }
]

/** 图片工具 */
const IMAGE_TOOLS = [
  { id: 'image-compress', name: '图片压缩', icon: '📦', color: COLORS.image },
  { id: 'image-crop', name: '图片裁剪', icon: '✂️', color: COLORS.image },
  { id: 'image-filter', name: '图片滤镜', icon: '🎨', color: COLORS.image },
  { id: 'image-stitch', name: '图片拼接', icon: '🧩', color: COLORS.image },
  { id: 'color-picker', name: '颜色提取器', icon: '🎯', color: COLORS.image },
  { id: 'meme-maker', name: '表情包制作', icon: '😄', color: COLORS.image },
  { id: 'id-photo', name: '证件照制作', icon: '📷', color: COLORS.image },
  { id: 'watermark', name: '图片水印', icon: '💧', color: COLORS.image },
  { id: 'avatar-deco', name: '头像加装饰', icon: '👤', color: COLORS.image }
]

/** 计算工具 */
const CALC_TOOLS = [
  { id: 'calculator', name: '科学计算器', icon: '🔢', color: COLORS.calc },
  { id: 'loan-calc', name: '房贷计算器', icon: '🏠', color: COLORS.calc },
  { id: 'tax-calc', name: '个税计算器', icon: '💰', color: COLORS.calc },
  { id: 'bmi-calc', name: 'BMI计算器', icon: '⚖️', color: COLORS.calc },
  { id: 'age-calc', name: '年龄计算器', icon: '🎂', color: COLORS.calc },
  { id: 'base-convert', name: '进制转换', icon: '🔀', color: COLORS.calc },
  { id: 'amount-upper', name: '金额转大写', icon: '💵', color: COLORS.calc }
]

/** 实用工具 */
const UTILITY_TOOLS = [
  { id: 'todo-list', name: '待办清单', icon: '✅', color: COLORS.utility },
  { id: 'memo', name: '备忘录', icon: '📝', color: COLORS.utility },
  { id: 'timer', name: '计时器', icon: '⏱️', color: COLORS.utility },
  { id: 'pedometer', name: '计步器', icon: '👟', color: COLORS.utility },
  { id: 'ruler', name: '尺子测量', icon: '📐', color: COLORS.utility },
  { id: 'decibel', name: '分贝测试', icon: '🔊', color: COLORS.utility },
  { id: 'plate-lookup', name: '车牌归属地', icon: '🚗', color: COLORS.utility },
  { id: 'id-card', name: '身份证解析', icon: '🆔', color: COLORS.utility },
  { id: 'password-gen', name: '随机密码生成', icon: '🔑', color: COLORS.utility },
  { id: 'qr-code', name: '二维码工具', icon: '📱', color: COLORS.utility }
]

/** 分类定义 */
const CATEGORIES = [
  { key: 'hot', name: '热门', tools: HOT_TOOLS },
  { key: 'life', name: '生活', tools: LIFE_TOOLS },
  { key: 'fun', name: '娱乐', tools: FUN_TOOLS },
  { key: 'image', name: '图片', tools: IMAGE_TOOLS },
  { key: 'calc', name: '计算', tools: CALC_TOOLS },
  { key: 'utility', name: '实用', tools: UTILITY_TOOLS }
]

/** 获取所有工具（扁平数组） */
function getAllTools() {
  const all = []
  const seen = new Set()
  CATEGORIES.forEach(cat => {
    cat.tools.forEach(tool => {
      if (!seen.has(tool.id)) {
        seen.add(tool.id)
        all.push({
          ...tool,
          category: cat.key,
          path: `/pages/tools/${tool.id}/index`
        })
      }
    })
  })
  return all
}

/** 根据分类 key 获取工具列表 */
function getToolsByCategory(categoryKey) {
  const cat = CATEGORIES.find(c => c.key === categoryKey)
  if (!cat) return []
  return cat.tools.map(tool => ({
    ...tool,
    category: cat.key,
    path: `/pages/tools/${tool.id}/index`
  }))
}

/** 根据 ID 获取工具信息 */
function getToolById(toolId) {
  const allTools = getAllTools()
  return allTools.find(t => t.id === toolId) || null
}

/** 搜索工具 */
function searchTools(query) {
  if (!query || !query.trim()) return getAllTools()
  const q = query.trim().toLowerCase()
  return getAllTools().filter(tool =>
    tool.name.toLowerCase().includes(q) ||
    tool.id.toLowerCase().includes(q)
  )
}

export {
  CATEGORIES,
  HOT_TOOLS,
  LIFE_TOOLS,
  FUN_TOOLS,
  IMAGE_TOOLS,
  CALC_TOOLS,
  UTILITY_TOOLS,
  COLORS,
  getAllTools,
  getToolsByCategory,
  getToolById,
  searchTools
}
