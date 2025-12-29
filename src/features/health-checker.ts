/**
 * 项目健康度检查器
 *
 * 检查项目配置、依赖、代码质量等
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import { spawn } from 'node:child_process'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { FileSystem } from '../utils/file-system'

export interface HealthCheckItem {
  name: string
  category: string
  status: 'pass' | 'warn' | 'fail' | 'skip'
  message: string
  suggestion?: string
  severity: 'info' | 'warning' | 'error'
}

export interface HealthCheckReport {
  summary: {
    total: number
    passed: number
    warnings: number
    failed: number
    skipped: number
    score: number
  }
  items: HealthCheckItem[]
  timestamp: number
}

export class HealthChecker {
  private cwd: string
  private items: HealthCheckItem[] = []

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd
  }

  /**
   * 执行健康检查
   */
  async check(): Promise<HealthCheckReport> {
    this.items = []

    await this.checkPackageJson()
    await this.checkGitIgnore()
    await this.checkNodeModules()
    await this.checkLockFile()
    await this.checkTypeScript()
    await this.checkESLint()
    await this.checkPrettier()
    await this.checkHusky()
    await this.checkVite()
    await this.checkEnvFiles()
    await this.checkDependencies()
    await this.checkSecurity()
    await this.checkPerformance()

    return this.generateReport()
  }

  /**
   * 检查 package.json
   */
  private async checkPackageJson(): Promise<void> {
    const packagePath = path.join(this.cwd, 'package.json')

    if (!await FileSystem.exists(packagePath)) {
      this.addItem({
        name: 'package.json 存在性',
        category: '基础配置',
        status: 'fail',
        message: 'package.json 不存在',
        severity: 'error',
        suggestion: '运行 npm init 创建 package.json',
      })
      return
    }

    try {
      const content = await fs.readFile(packagePath, 'utf-8')
      const pkg = JSON.parse(content)

      // 检查必需字段
      const required = ['name', 'version']
      for (const field of required) {
        if (!pkg[field]) {
          this.addItem({
            name: `package.json.${field}`,
            category: '基础配置',
            status: 'warn',
            message: `缺少 ${field} 字段`,
            severity: 'warning',
            suggestion: `在 package.json 中添加 ${field}`,
          })
        }
      }

      // 检查 scripts
      if (!pkg.scripts || Object.keys(pkg.scripts).length === 0) {
        this.addItem({
          name: 'package.json scripts',
          category: '基础配置',
          status: 'warn',
          message: '没有定义任何 scripts',
          severity: 'warning',
          suggestion: '添加 dev、build 等常用脚本',
        })
      }
      else {
        this.addItem({
          name: 'package.json scripts',
          category: '基础配置',
          status: 'pass',
          message: `定义了 ${Object.keys(pkg.scripts).length} 个脚本`,
          severity: 'info',
        })
      }

      // 检查 dependencies
      const depCount = Object.keys(pkg.dependencies || {}).length
      const devDepCount = Object.keys(pkg.devDependencies || {}).length

      this.addItem({
        name: 'package.json dependencies',
        category: '依赖管理',
        status: 'pass',
        message: `依赖: ${depCount}, 开发依赖: ${devDepCount}`,
        severity: 'info',
      })

      this.addItem({
        name: 'package.json 格式',
        category: '基础配置',
        status: 'pass',
        message: 'package.json 格式正确',
        severity: 'info',
      })
    }
    catch (error) {
      this.addItem({
        name: 'package.json 格式',
        category: '基础配置',
        status: 'fail',
        message: `package.json 格式错误: ${(error as Error).message}`,
        severity: 'error',
        suggestion: '检查 JSON 语法',
      })
    }
  }

  /**
   * 检查 .gitignore
   */
  private async checkGitIgnore(): Promise<void> {
    const gitignorePath = path.join(this.cwd, '.gitignore')

    if (!await FileSystem.exists(gitignorePath)) {
      this.addItem({
        name: '.gitignore',
        category: '版本控制',
        status: 'warn',
        message: '.gitignore 不存在',
        severity: 'warning',
        suggestion: '创建 .gitignore 文件，忽略 node_modules、dist 等',
      })
      return
    }

    const content = await fs.readFile(gitignorePath, 'utf-8')
    const essentials = ['node_modules', 'dist', '.env']
    const missing = essentials.filter(item => !content.includes(item))

    if (missing.length > 0) {
      this.addItem({
        name: '.gitignore 内容',
        category: '版本控制',
        status: 'warn',
        message: `缺少常见忽略项: ${missing.join(', ')}`,
        severity: 'warning',
        suggestion: `添加: ${missing.join(', ')}`,
      })
    }
    else {
      this.addItem({
        name: '.gitignore',
        category: '版本控制',
        status: 'pass',
        message: '包含必要的忽略项',
        severity: 'info',
      })
    }
  }

  /**
   * 检查 node_modules
   */
  private async checkNodeModules(): Promise<void> {
    const nodeModulesPath = path.join(this.cwd, 'node_modules')

    if (!await FileSystem.exists(nodeModulesPath)) {
      this.addItem({
        name: 'node_modules',
        category: '依赖管理',
        status: 'warn',
        message: 'node_modules 不存在',
        severity: 'warning',
        suggestion: '运行 npm install 或 pnpm install',
      })
      return
    }

    // 检查大小
    if (await FileSystem.exists(nodeModulesPath)) {
      this.addItem({
        name: 'node_modules',
        category: '依赖管理',
        status: 'pass',
        message: 'node_modules 已安装',
        severity: 'info',
      })
    }
  }

  /**
   * 检查锁文件
   */
  private async checkLockFile(): Promise<void> {
    const lockFiles = [
      'package-lock.json',
      'pnpm-lock.yaml',
      'yarn.lock',
    ]

    let found = false
    for (const lockFile of lockFiles) {
      if (await FileSystem.exists(path.join(this.cwd, lockFile))) {
        found = true
        this.addItem({
          name: '锁文件',
          category: '依赖管理',
          status: 'pass',
          message: `使用 ${lockFile}`,
          severity: 'info',
        })
        break
      }
    }

    if (!found) {
      this.addItem({
        name: '锁文件',
        category: '依赖管理',
        status: 'warn',
        message: '没有找到锁文件',
        severity: 'warning',
        suggestion: '运行包管理器安装依赖以生成锁文件',
      })
    }
  }

  /**
   * 检查 TypeScript 配置
   */
  private async checkTypeScript(): Promise<void> {
    const tsconfigPath = path.join(this.cwd, 'tsconfig.json')

    if (!await FileSystem.exists(tsconfigPath)) {
      this.addItem({
        name: 'TypeScript 配置',
        category: '代码质量',
        status: 'skip',
        message: '未使用 TypeScript',
        severity: 'info',
      })
      return
    }

    try {
      const content = await fs.readFile(tsconfigPath, 'utf-8')
      JSON.parse(content)

      this.addItem({
        name: 'TypeScript 配置',
        category: '代码质量',
        status: 'pass',
        message: 'tsconfig.json 配置正确',
        severity: 'info',
      })
    }
    catch (error) {
      this.addItem({
        name: 'TypeScript 配置',
        category: '代码质量',
        status: 'fail',
        message: `tsconfig.json 格式错误: ${(error as Error).message}`,
        severity: 'error',
        suggestion: '检查 JSON 语法',
      })
    }
  }

  /**
   * 检查 ESLint
   */
  private async checkESLint(): Promise<void> {
    const configs = [
      '.eslintrc.js',
      '.eslintrc.json',
      '.eslintrc.yaml',
      'eslint.config.js',
    ]

    let found = false
    for (const config of configs) {
      if (await FileSystem.exists(path.join(this.cwd, config))) {
        found = true
        this.addItem({
          name: 'ESLint',
          category: '代码质量',
          status: 'pass',
          message: `使用 ${config}`,
          severity: 'info',
        })
        break
      }
    }

    if (!found) {
      this.addItem({
        name: 'ESLint',
        category: '代码质量',
        status: 'warn',
        message: '未配置 ESLint',
        severity: 'warning',
        suggestion: '运行 eslint --init 配置 ESLint',
      })
    }
  }

  /**
   * 检查 Prettier
   */
  private async checkPrettier(): Promise<void> {
    const configs = [
      '.prettierrc',
      '.prettierrc.js',
      '.prettierrc.json',
      'prettier.config.js',
    ]

    let found = false
    for (const config of configs) {
      if (await FileSystem.exists(path.join(this.cwd, config))) {
        found = true
        this.addItem({
          name: 'Prettier',
          category: '代码质量',
          status: 'pass',
          message: `使用 ${config}`,
          severity: 'info',
        })
        break
      }
    }

    if (!found) {
      this.addItem({
        name: 'Prettier',
        category: '代码质量',
        status: 'warn',
        message: '未配置 Prettier',
        severity: 'warning',
        suggestion: '创建 .prettierrc 配置代码格式化',
      })
    }
  }

  /**
   * 检查 Husky
   */
  private async checkHusky(): Promise<void> {
    const huskyPath = path.join(this.cwd, '.husky')

    if (await FileSystem.exists(huskyPath)) {
      this.addItem({
        name: 'Git Hooks',
        category: '代码质量',
        status: 'pass',
        message: '配置了 Husky',
        severity: 'info',
      })
    }
    else {
      this.addItem({
        name: 'Git Hooks',
        category: '代码质量',
        status: 'skip',
        message: '未使用 Husky',
        severity: 'info',
      })
    }
  }

  /**
   * 检查 Vite 配置
   */
  private async checkVite(): Promise<void> {
    const configs = [
      'vite.config.js',
      'vite.config.ts',
      'vite.config.mjs',
    ]

    let found = false
    for (const config of configs) {
      if (await FileSystem.exists(path.join(this.cwd, config))) {
        found = true
        this.addItem({
          name: 'Vite 配置',
          category: '构建工具',
          status: 'pass',
          message: `使用 ${config}`,
          severity: 'info',
        })
        break
      }
    }

    if (!found) {
      this.addItem({
        name: 'Vite 配置',
        category: '构建工具',
        status: 'skip',
        message: '未使用 Vite',
        severity: 'info',
      })
    }
  }

  /**
   * 检查环境文件
   */
  private async checkEnvFiles(): Promise<void> {
    const envExample = path.join(this.cwd, '.env.example')

    if (await FileSystem.exists(envExample)) {
      this.addItem({
        name: '环境变量示例',
        category: '配置管理',
        status: 'pass',
        message: '提供了 .env.example',
        severity: 'info',
      })
    }
    else {
      this.addItem({
        name: '环境变量示例',
        category: '配置管理',
        status: 'warn',
        message: '缺少 .env.example',
        severity: 'warning',
        suggestion: '创建 .env.example 作为环境变量模板',
      })
    }
  }

  /**
   * 检查依赖更新
   */
  private async checkDependencies(): Promise<void> {
    try {
      const outdated = await this.runCommand('npm', ['outdated', '--json'])
      const data = outdated ? JSON.parse(outdated) : {}
      const count = Object.keys(data).length

      if (count > 0) {
        this.addItem({
          name: '依赖更新',
          category: '依赖管理',
          status: 'warn',
          message: `有 ${count} 个依赖可以更新`,
          severity: 'warning',
          suggestion: '运行 launcher upgrade 查看详情',
        })
      }
      else {
        this.addItem({
          name: '依赖更新',
          category: '依赖管理',
          status: 'pass',
          message: '所有依赖都是最新的',
          severity: 'info',
        })
      }
    }
    catch {
      this.addItem({
        name: '依赖更新',
        category: '依赖管理',
        status: 'skip',
        message: '无法检查依赖更新',
        severity: 'info',
      })
    }
  }

  /**
   * 检查安全漏洞
   */
  private async checkSecurity(): Promise<void> {
    try {
      const audit = await this.runCommand('npm', ['audit', '--json'])
      const data = audit ? JSON.parse(audit) : {}
      const vulnerabilities = data.metadata?.vulnerabilities || {}

      const total = Object.values(vulnerabilities).reduce((sum: number, count) => sum + (count as number), 0)

      if (total > 0) {
        const critical = vulnerabilities.critical || 0
        const high = vulnerabilities.high || 0

        if (critical > 0 || high > 0) {
          this.addItem({
            name: '安全漏洞',
            category: '安全性',
            status: 'fail',
            message: `发现 ${total} 个安全漏洞 (严重: ${critical}, 高危: ${high})`,
            severity: 'error',
            suggestion: '运行 npm audit fix 修复漏洞',
          })
        }
        else {
          this.addItem({
            name: '安全漏洞',
            category: '安全性',
            status: 'warn',
            message: `发现 ${total} 个低危漏洞`,
            severity: 'warning',
            suggestion: '运行 npm audit fix',
          })
        }
      }
      else {
        this.addItem({
          name: '安全漏洞',
          category: '安全性',
          status: 'pass',
          message: '未发现安全漏洞',
          severity: 'info',
        })
      }
    }
    catch {
      this.addItem({
        name: '安全漏洞',
        category: '安全性',
        status: 'skip',
        message: '无法检查安全漏洞',
        severity: 'info',
      })
    }
  }

  /**
   * 检查性能指标
   */
  private async checkPerformance(): Promise<void> {
    const packagePath = path.join(this.cwd, 'package.json')

    try {
      const content = await fs.readFile(packagePath, 'utf-8')
      const pkg = JSON.parse(content)

      const depCount = Object.keys(pkg.dependencies || {}).length
      const devDepCount = Object.keys(pkg.devDependencies || {}).length
      const total = depCount + devDepCount

      if (total > 100) {
        this.addItem({
          name: '依赖数量',
          category: '性能',
          status: 'warn',
          message: `依赖较多 (${total} 个)`,
          severity: 'warning',
          suggestion: '考虑移除不必要的依赖',
        })
      }
      else {
        this.addItem({
          name: '依赖数量',
          category: '性能',
          status: 'pass',
          message: `依赖适中 (${total} 个)`,
          severity: 'info',
        })
      }
    }
    catch {
      // 忽略
    }
  }

  /**
   * 添加检查项
   */
  private addItem(item: Omit<HealthCheckItem, 'name' | 'category' | 'status' | 'severity'> & Partial<HealthCheckItem>): void {
    this.items.push(item as HealthCheckItem)
  }

  /**
   * 生成报告
   */
  private generateReport(): HealthCheckReport {
    const passed = this.items.filter(i => i.status === 'pass').length
    const warnings = this.items.filter(i => i.status === 'warn').length
    const failed = this.items.filter(i => i.status === 'fail').length
    const skipped = this.items.filter(i => i.status === 'skip').length
    const total = this.items.length

    // 计算分数：通过 = 100分，警告 = 50分，失败 = 0分，跳过不计分
    const maxScore = (total - skipped) * 100
    const actualScore = passed * 100 + warnings * 50
    const score = maxScore > 0 ? Math.round((actualScore / maxScore) * 100) : 100

    return {
      summary: {
        total,
        passed,
        warnings,
        failed,
        skipped,
        score,
      },
      items: this.items,
      timestamp: Date.now(),
    }
  }

  /**
   * 运行命令
   */
  private runCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: this.cwd,
        shell: true,
      })

      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        if (code === 0 || stdout) {
          resolve(stdout)
        }
        else {
          reject(new Error(stderr || `Command failed with code ${code}`))
        }
      })
    })
  }
}

/**
 * 创建健康检查器
 */
export function createHealthChecker(cwd?: string): HealthChecker {
  return new HealthChecker(cwd)
}
