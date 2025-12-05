/**
 * 诊断命令
 * 检查项目环境、配置、依赖等
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import picocolors from 'picocolors'
import { ConfigManager } from '../../core/ConfigManager'
import { Logger } from '../../utils/logger'

interface DiagnosticResult {
  category: string
  items: DiagnosticItem[]
  hasIssues: boolean
}

interface DiagnosticItem {
  name: string
  status: 'success' | 'warning' | 'error'
  message: string
  suggestion?: string
}

/**
 * 检查命令是否可用
 */
async function checkCommand(command: string): Promise<boolean> {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' })
    return true
  }
  catch {
    return false
  }
}

/**
 * 检查环境
 */
async function checkEnvironment(): Promise<DiagnosticResult> {
  const items: DiagnosticItem[] = []

  // 检查 Node.js 版本
  const nodeVersion = process.version
  const nodeMajorVersion = Number.parseInt(nodeVersion.slice(1).split('.')[0])

  items.push({
    name: 'Node.js 版本',
    status: nodeMajorVersion >= 16 ? 'success' : 'error',
    message: `${nodeVersion} ${nodeMajorVersion >= 16 ? '✓' : '✗ 需要 >= 16.0.0'}`,
    suggestion: nodeMajorVersion < 16 ? '请升级 Node.js 到 16.0.0 或更高版本' : undefined,
  })

  // 检查包管理器
  const hasPnpm = await checkCommand('pnpm')
  const hasNpm = await checkCommand('npm')
  const hasYarn = await checkCommand('yarn')

  items.push({
    name: 'pnpm',
    status: hasPnpm ? 'success' : 'warning',
    message: hasPnpm ? '已安装 ✓' : '未安装',
    suggestion: !hasPnpm ? '推荐安装 pnpm: npm install -g pnpm' : undefined,
  })

  items.push({
    name: 'npm',
    status: hasNpm ? 'success' : 'error',
    message: hasNpm ? '已安装 ✓' : '未安装 ✗',
  })

  items.push({
    name: 'yarn',
    status: hasYarn ? 'success' : 'warning',
    message: hasYarn ? '已安装 ✓' : '未安装',
  })

  // 检查 Git
  const hasGit = await checkCommand('git')
  items.push({
    name: 'Git',
    status: hasGit ? 'success' : 'warning',
    message: hasGit ? '已安装 ✓' : '未安装',
    suggestion: !hasGit ? '建议安装 Git 以便版本控制' : undefined,
  })

  return {
    category: '环境检查',
    items,
    hasIssues: items.some(item => item.status === 'error'),
  }
}

/**
 * 检查配置文件
 */
async function checkConfig(cwd: string): Promise<DiagnosticResult> {
  const items: DiagnosticItem[] = []
  const logger = new Logger('Doctor', { level: 'silent' })
  const configManager = new ConfigManager({ cwd, logger })

  // 检查配置文件是否存在
  const possibleConfigFiles = [
    '.ldesign/launcher.config.ts',
    '.ldesign/launcher.config.js',
    'launcher.config.ts',
    'launcher.config.js',
  ]

  let configFileExists = false
  let configFilePath = ''

  for (const file of possibleConfigFiles) {
    const fullPath = join(cwd, file)
    if (existsSync(fullPath)) {
      configFileExists = true
      configFilePath = file
      break
    }
  }

  items.push({
    name: '配置文件',
    status: configFileExists ? 'success' : 'warning',
    message: configFileExists ? `找到 ${configFilePath} ✓` : '未找到配置文件',
    suggestion: !configFileExists ? '运行 "launcher config init" 创建配置文件' : undefined,
  })

  // 如果配置文件存在，验证配置
  if (configFileExists) {
    try {
      const config = await configManager.load({ cwd })
      const validation = await configManager.validate(config)

      items.push({
        name: '配置验证',
        status: validation.valid ? 'success' : 'error',
        message: validation.valid ? '配置有效 ✓' : `配置无效 ✗ (${validation.errors.length} 个错误)`,
        suggestion: !validation.valid ? validation.errors.join(', ') : undefined,
      })

      if (validation.warnings.length > 0) {
        items.push({
          name: '配置警告',
          status: 'warning',
          message: `${validation.warnings.length} 个警告`,
          suggestion: validation.warnings.join(', '),
        })
      }
    }
    catch (error) {
      items.push({
        name: '配置加载',
        status: 'error',
        message: '配置加载失败 ✗',
        suggestion: (error as Error).message,
      })
    }
  }

  return {
    category: '配置检查',
    items,
    hasIssues: items.some(item => item.status === 'error'),
  }
}

/**
 * 检查依赖
 */
async function checkDependencies(cwd: string): Promise<DiagnosticResult> {
  const items: DiagnosticItem[] = []
  const packageJsonPath = join(cwd, 'package.json')

  if (!existsSync(packageJsonPath)) {
    items.push({
      name: 'package.json',
      status: 'error',
      message: '未找到 package.json ✗',
      suggestion: '运行 "npm init" 创建 package.json',
    })

    return {
      category: '依赖检查',
      items,
      hasIssues: true,
    }
  }

  items.push({
    name: 'package.json',
    status: 'success',
    message: '找到 package.json ✓',
  })

  // 检查 node_modules
  const nodeModulesExists = existsSync(join(cwd, 'node_modules'))
  items.push({
    name: 'node_modules',
    status: nodeModulesExists ? 'success' : 'warning',
    message: nodeModulesExists ? '依赖已安装 ✓' : '依赖未安装',
    suggestion: !nodeModulesExists ? '运行 "pnpm install" 或 "npm install" 安装依赖' : undefined,
  })

  // 检查 @ldesign/launcher
  const launcherInstalled = existsSync(join(cwd, 'node_modules/@ldesign/launcher'))
  items.push({
    name: '@ldesign/launcher',
    status: launcherInstalled ? 'success' : 'error',
    message: launcherInstalled ? '已安装 ✓' : '未安装 ✗',
    suggestion: !launcherInstalled ? '运行 "pnpm add -D @ldesign/launcher"' : undefined,
  })

  return {
    category: '依赖检查',
    items,
    hasIssues: items.some(item => item.status === 'error'),
  }
}

/**
 * 检查端口
 */
async function checkPorts(): Promise<DiagnosticResult> {
  const items: DiagnosticItem[] = []
  const { isPortAvailable } = await import('../../utils/server')

  // 检查常用端口
  const commonPorts = [3000, 4173, 5173, 8080]

  for (const port of commonPorts) {
    const available = await isPortAvailable(port)
    items.push({
      name: `端口 ${port}`,
      status: available ? 'success' : 'warning',
      message: available ? '可用 ✓' : '已被占用',
    })
  }

  return {
    category: '端口检查',
    items,
    hasIssues: false, // 端口被占用不算严重问题
  }
}

/**
 * 检查框架
 */
async function checkFramework(cwd: string): Promise<DiagnosticResult> {
  const items: DiagnosticItem[] = []
  const { PluginManager } = await import('../../core/PluginManager')
  const logger = new Logger('Doctor', { level: 'silent' })
  const pluginManager = new PluginManager(cwd, logger)

  try {
    const projectType = await pluginManager.detectProjectType()

    items.push({
      name: '框架检测',
      status: 'success',
      message: `检测到 ${projectType} 项目 ✓`,
    })

    // 检查框架特定依赖
    const frameworkDeps: Record<string, string[]> = {
      vue3: ['vue', '@vitejs/plugin-vue'],
      vue2: ['vue', '@vitejs/plugin-vue2'],
      react: ['react', 'react-dom', '@vitejs/plugin-react'],
      svelte: ['svelte', '@sveltejs/vite-plugin-svelte'],
      solid: ['solid-js', 'vite-plugin-solid'],
      angular: ['@angular/core', '@analogjs/vite-plugin-angular'],
      astro: ['astro'],
      remix: ['@remix-run/react', '@remix-run/vite'],
    }

    const requiredDeps = frameworkDeps[projectType] || []
    for (const dep of requiredDeps) {
      const depPath = join(cwd, 'node_modules', dep)
      const installed = existsSync(depPath)
      if (!installed) {
        items.push({
          name: `依赖 ${dep}`,
          status: 'error',
          message: '未安装 ✗',
          suggestion: `运行 "pnpm add ${dep.startsWith('@') ? '' : '-D '}${dep}"`,
        })
      }
    }
  }
  catch (error) {
    items.push({
      name: '框架检测',
      status: 'warning',
      message: '无法检测框架',
      suggestion: (error as Error).message,
    })
  }

  return {
    category: '框架检查',
    items,
    hasIssues: items.some(item => item.status === 'error'),
  }
}

/**
 * 检查性能相关配置
 */
async function checkPerformance(cwd: string): Promise<DiagnosticResult> {
  const items: DiagnosticItem[] = []
  const packageJsonPath = join(cwd, 'package.json')

  if (!existsSync(packageJsonPath)) {
    return {
      category: '性能检查',
      items: [{
        name: 'package.json',
        status: 'error',
        message: '未找到 ✗',
      }],
      hasIssues: true,
    }
  }

  try {
    const packageJson = JSON.parse(require('node:fs').readFileSync(packageJsonPath, 'utf-8'))
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies }

    // 检查是否有大型依赖可以按需加载
    const heavyDeps = ['moment', 'lodash', 'antd', 'element-plus', '@mui/material']
    const lightAlternatives: Record<string, string> = {
      moment: 'dayjs',
      lodash: 'lodash-es (配合 tree-shaking)',
    }

    for (const dep of heavyDeps) {
      if (allDeps[dep]) {
        const alternative = lightAlternatives[dep]
        items.push({
          name: `依赖 ${dep}`,
          status: 'warning',
          message: '检测到较大的依赖',
          suggestion: alternative ? `考虑使用 ${alternative} 替代` : '确保配置了按需加载',
        })
      }
    }

    // 检查是否配置了 TypeScript
    const hasTsConfig = existsSync(join(cwd, 'tsconfig.json'))
    items.push({
      name: 'TypeScript',
      status: hasTsConfig ? 'success' : 'warning',
      message: hasTsConfig ? '已配置 ✓' : '未配置',
      suggestion: !hasTsConfig ? '推荐使用 TypeScript 以获得更好的开发体验' : undefined,
    })

    // 检查 ESLint
    const hasEslint = existsSync(join(cwd, '.eslintrc.js'))
      || existsSync(join(cwd, '.eslintrc.json'))
      || existsSync(join(cwd, 'eslint.config.js'))
      || allDeps.eslint
    items.push({
      name: 'ESLint',
      status: hasEslint ? 'success' : 'warning',
      message: hasEslint ? '已配置 ✓' : '未配置',
      suggestion: !hasEslint ? '推荐配置 ESLint 以保证代码质量' : undefined,
    })

    // 检查构建产物大小（如果存在 dist 目录）
    const distPath = join(cwd, 'dist')
    if (existsSync(distPath)) {
      items.push({
        name: '构建产物',
        status: 'success',
        message: '已存在 dist 目录 ✓',
        suggestion: '运行 "launcher build --analyze" 分析构建产物',
      })
    }

    if (items.length === 0) {
      items.push({
        name: '性能配置',
        status: 'success',
        message: '未发现明显问题 ✓',
      })
    }
  }
  catch (error) {
    items.push({
      name: '性能检查',
      status: 'error',
      message: '检查失败 ✗',
      suggestion: (error as Error).message,
    })
  }

  return {
    category: '性能检查',
    items,
    hasIssues: items.some(item => item.status === 'error'),
  }
}

/**
 * 检查安全性
 */
async function checkSecurity(cwd: string): Promise<DiagnosticResult> {
  const items: DiagnosticItem[] = []

  // 检查 .env 文件是否在 .gitignore 中
  const gitignorePath = join(cwd, '.gitignore')
  if (existsSync(gitignorePath)) {
    const gitignoreContent = require('node:fs').readFileSync(gitignorePath, 'utf-8')
    const hasEnvIgnored = gitignoreContent.includes('.env')
      || gitignoreContent.includes('*.env')
      || gitignoreContent.includes('.env.local')

    items.push({
      name: '.env 文件',
      status: hasEnvIgnored ? 'success' : 'warning',
      message: hasEnvIgnored ? '已在 .gitignore 中 ✓' : '可能未被 Git 忽略',
      suggestion: !hasEnvIgnored ? '确保 .env 文件不会被提交到版本控制' : undefined,
    })
  }

  // 检查是否有 lockfile
  const hasLockfile = existsSync(join(cwd, 'pnpm-lock.yaml'))
    || existsSync(join(cwd, 'package-lock.json'))
    || existsSync(join(cwd, 'yarn.lock'))

  items.push({
    name: 'Lockfile',
    status: hasLockfile ? 'success' : 'warning',
    message: hasLockfile ? '已存在 ✓' : '未找到',
    suggestion: !hasLockfile ? '建议使用 lockfile 锁定依赖版本' : undefined,
  })

  // 检查 node_modules 是否在 .gitignore 中
  if (existsSync(gitignorePath)) {
    const gitignoreContent = require('node:fs').readFileSync(gitignorePath, 'utf-8')
    const hasNodeModulesIgnored = gitignoreContent.includes('node_modules')

    items.push({
      name: 'node_modules',
      status: hasNodeModulesIgnored ? 'success' : 'error',
      message: hasNodeModulesIgnored ? '已在 .gitignore 中 ✓' : '未被 Git 忽略 ✗',
      suggestion: !hasNodeModulesIgnored ? '将 node_modules 添加到 .gitignore' : undefined,
    })
  }

  return {
    category: '安全检查',
    items,
    hasIssues: items.some(item => item.status === 'error'),
  }
}

/**
 * 打印诊断结果
 */
function printDiagnosticResult(result: DiagnosticResult, logger: Logger): void {
  logger.raw(`\n${picocolors.bold(result.category)}`)
  logger.raw('─'.repeat(50))

  for (const item of result.items) {
    const icon = item.status === 'success'
      ? picocolors.green('✓')
      : item.status === 'warning'
        ? picocolors.yellow('⚠')
        : picocolors.red('✗')

    logger.raw(`  ${icon} ${item.name}: ${item.message}`)

    if (item.suggestion) {
      logger.raw(`    ${picocolors.gray(`→ ${item.suggestion}`)}`)
    }
  }
}

/**
 * 诊断命令
 */
export async function doctorCommand(cwd: string = process.cwd()): Promise<void> {
  const logger = new Logger('doctor', {
    level: 'info',
    colors: true,
  })

  logger.raw(picocolors.bold('\n🔍 @ldesign/launcher 诊断工具\\n'))

  const results: DiagnosticResult[] = []

  // 执行所有检查
  results.push(await checkEnvironment())
  results.push(await checkConfig(cwd))
  results.push(await checkDependencies(cwd))
  results.push(await checkFramework(cwd))
  results.push(await checkPerformance(cwd))
  results.push(await checkSecurity(cwd))
  results.push(await checkPorts())

  // 打印结果
  for (const result of results) {
    printDiagnosticResult(result, logger)
  }

  // 总结
  const hasErrors = results.some(r => r.hasIssues)
  const totalIssues = results.reduce((acc, r) =>
    acc + r.items.filter(i => i.status === 'error' || i.status === 'warning').length, 0)

  logger.raw(`\n${'─'.repeat(50)}`)

  if (hasErrors) {
    logger.raw(picocolors.red(`\n✗ 发现 ${totalIssues} 个问题，请根据上述建议进行修复\n`))
    process.exit(1)
  }
  else if (totalIssues > 0) {
    logger.raw(picocolors.yellow(`\n⚠ 发现 ${totalIssues} 个警告，建议优化\n`))
  }
  else {
    logger.raw(picocolors.green('\n✓ 一切正常！\n'))
  }
}
