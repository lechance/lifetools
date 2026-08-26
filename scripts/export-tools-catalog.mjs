#!/usr/bin/env node

/**
 * 从 tools-data.js 提取工具目录 → JSON 文件给 mpserver admin 面板
 *
 * 用法：
 *   node scripts/export-tools-catalog.mjs                    # 默认写到 ../mpserver/src/tools-catalog.json
 *   node scripts/export-tools-catalog.mjs /custom/out.json   # 自定义输出路径
 *
 * 每次新增/删除工具后需重跑此脚本
 */

import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { CATEGORIES } from '../src/utils/tools-data.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const defaultOut = resolve(__dirname, '../../mpserver/src/tools-catalog.json')
const outPath = process.argv[2] || defaultOut

/** 全局去重（同一 id 不同分类只保留首次出现） */
const seen = new Set()
const catalog = CATEGORIES.map(cat => ({
  key: cat.key,
  name: cat.name,
  tools: cat.tools
    .filter(t => {
      if (seen.has(t.id)) return false
      seen.add(t.id)
      return true
    })
    .map(t => ({ id: t.id, name: t.name, icon: t.icon }))
}))

const total = catalog.reduce((n, c) => n + c.tools.length, 0)
writeFileSync(outPath, JSON.stringify(catalog, null, 2) + '\n', 'utf8')
console.log(`✅ 已生成 ${total} 个工具 → ${outPath}`)
