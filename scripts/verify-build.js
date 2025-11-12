#!/usr/bin/env node
/**
 * 验证构建产物的完整性
 */

import { existsSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')
const distDir = join(rootDir, 'dist')

console.log('🔍 验证构建产物...\n')

const requiredFiles = [
  // 核心文件
  'index.js',
  'index.cjs',
  'index.d.ts',

  // CLI
  'cli/index.js',
  'cli/index.cjs',
  'cli/index.d.ts',
  'cli/commands/doctor.js',
  'cli/commands/doctor.d.ts',

  // 核心模块
  'core/index.js',
  'core/index.d.ts',
  'core/ViteLauncher.js',
  'core/ViteLauncher.d.ts',
  'core/ConfigManager.js',
  'core/ConfigManager.d.ts',
  'core/ServerManager.js',
  'core/ServerManager.d.ts',
  'core/BuildManager.js',
  'core/BuildManager.d.ts',

  // 工具模块
  'utils/index.js',
  'utils/index.d.ts',
  'utils/config-merger.js',
  'utils/config-merger.d.ts',

  // 常量
  'constants/index.js',
  'constants/index.d.ts',

  // 类型
  'types/index.js',
  'types/index.d.ts',
]

let hasError = false

for (const file of requiredFiles) {
  const filePath = join(distDir, file)
  if (!existsSync(filePath)) {
    console.error(`❌ 缺少文件: ${file}`)
    hasError = true
  } else {
    console.log(`✅ ${file}`)
  }
}

if (hasError) {
  console.error('\n❌ 构建验证失败！\n')
  process.exit(1)
} else {
  console.log('\n✅ 构建验证成功！所有必需文件都已生成。\n')
  process.exit(0)
}
