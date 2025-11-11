#!/usr/bin/env node

const { execSync } = require('child_process')
const { existsSync, rmSync } = require('fs')
const path = require('path')

console.log('🚀 开始构建 (JS + DTS)...\n')

// 设置环境变量
process.env.NODE_OPTIONS = '--max-old-space-size=32768'
process.env.NODE_ENV = 'production'

try {
  // 步骤 1: 清理 dist 目录
  if (existsSync('dist')) {
    console.log('🧹 清理 dist 目录...')
    rmSync('dist', { recursive: true, force: true })
  }

  // 步骤 2: 构建 JavaScript (不生成 DTS)
  console.log('\n📦 步骤 1/2: 构建 JavaScript 文件...')
  try {
    execSync('npx tsup --no-dts', {
      stdio: 'inherit',
      env: process.env
    })
    console.log('✅ JavaScript 构建成功')
  } catch (error) {
    console.error('❌ JavaScript 构建失败')
    throw error
  }

  // 步骤 3: 使用 TypeScript 编译器生成类型定义
  console.log('\n📝 步骤 2/2: 生成类型定义文件...')
  
  // 创建一个临时的 tsconfig 用于生成 DTS
  const dtsConfig = {
    extends: './tsconfig.json',
    compilerOptions: {
      declaration: true,
      declarationMap: true,
      emitDeclarationOnly: true,
      outDir: './dist',
      rootDir: './src',
      skipLibCheck: true,
      noEmit: false
    },
    include: ['src/**/*.ts'],
    exclude: [
      'dist',
      'node_modules',
      'src/**/*.test.ts',
      'src/**/*.spec.ts',
      'src/**/*.bench.ts',
      'src/__tests__/**/*'
    ]
  }

  // 写入临时配置文件
  const fs = require('fs')
  const tempConfigPath = path.join(__dirname, '..', 'tsconfig.dts.json')
  fs.writeFileSync(tempConfigPath, JSON.stringify(dtsConfig, null, 2))

  try {
    // 使用 TypeScript 编译器生成 DTS
    execSync('npx tsc -p tsconfig.dts.json', {
      stdio: 'inherit',
      env: process.env
    })
    console.log('✅ 类型定义文件生成成功')
  } catch (error) {
    console.error('⚠️  类型定义文件生成失败，但 JavaScript 文件已构建成功')
    console.error('错误信息:', error.message)
  } finally {
    // 删除临时配置文件
    if (existsSync(tempConfigPath)) {
      rmSync(tempConfigPath)
    }
  }

  console.log('\n✨ 构建完成！')
  console.log('📁 输出目录: ./dist')

} catch (error) {
  console.error('\n❌ 构建失败:', error.message)
  process.exit(1)
}