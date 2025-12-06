/**
 * 代码质量检查
 *
 * 集成 ESLint、Prettier、TypeScript 检查
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import { spawn } from 'node:child_process'
import { EventEmitter } from 'node:events'
import path from 'node:path'
import fs from 'fs-extra'

/**
 * 检查问题
 */
export interface LintIssue {
  file: string
  line: number
  column: number
  severity: 'error' | 'warning' | 'info'
  message: string
  rule?: string
  source?: 'eslint' | 'typescript' | 'prettier'
}

/**
 * 检查结果
 */
export interface LintResult {
  success: boolean
  issues: LintIssue[]
  errorCount: number
  warningCount: number
  fixedCount?: number
  duration: number
}

/**
 * 检查配置
 */
export interface LintConfig {
  eslint?: boolean
  typescript?: boolean
  prettier?: boolean
  fix?: boolean
  paths?: string[]
}

/**
 * 代码质量检查器
 */
export class CodeQualityChecker extends EventEmitter {
  private cwd: string

  constructor(cwd: string) {
    super()
    this.cwd = cwd
  }

  /**
   * 检测可用的检查工具
   */
  async detectTools(): Promise<{
    eslint: boolean
    prettier: boolean
    typescript: boolean
    eslintConfig?: string
    prettierConfig?: string
  }> {
    const pkgPath = path.join(this.cwd, 'package.json')
    const pkg = await fs.pathExists(pkgPath) ? await fs.readJson(pkgPath) : {}
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }

    // 检查 ESLint
    const eslint = 'eslint' in deps
    let eslintConfig: string | undefined
    const eslintConfigs = [
      '.eslintrc.js',
      '.eslintrc.cjs',
      '.eslintrc.json',
      '.eslintrc.yaml',
      '.eslintrc.yml',
      'eslint.config.js',
      'eslint.config.mjs',
    ]
    for (const config of eslintConfigs) {
      if (await fs.pathExists(path.join(this.cwd, config))) {
        eslintConfig = config
        break
      }
    }

    // 检查 Prettier
    const prettier = 'prettier' in deps
    let prettierConfig: string | undefined
    const prettierConfigs = [
      '.prettierrc',
      '.prettierrc.js',
      '.prettierrc.cjs',
      '.prettierrc.json',
      'prettier.config.js',
      'prettier.config.mjs',
    ]
    for (const config of prettierConfigs) {
      if (await fs.pathExists(path.join(this.cwd, config))) {
        prettierConfig = config
        break
      }
    }

    // 检查 TypeScript
    const typescript = 'typescript' in deps
      || await fs.pathExists(path.join(this.cwd, 'tsconfig.json'))

    return {
      eslint,
      prettier,
      typescript,
      eslintConfig,
      prettierConfig,
    }
  }

  /**
   * 运行完整检查
   */
  async check(config: LintConfig = {}): Promise<LintResult> {
    const startTime = Date.now()
    const issues: LintIssue[] = []
    let errorCount = 0
    let warningCount = 0
    let fixedCount = 0

    const tools = await this.detectTools()
    const paths = config.paths || ['src']

    // ESLint 检查
    if ((config.eslint !== false) && tools.eslint) {
      this.emit('progress', { tool: 'eslint', status: 'running' })
      try {
        const eslintResult = await this.runEslint(paths, config.fix)
        issues.push(...eslintResult.issues)
        errorCount += eslintResult.errorCount
        warningCount += eslintResult.warningCount
        fixedCount += eslintResult.fixedCount || 0
        this.emit('progress', { tool: 'eslint', status: 'done', result: eslintResult })
      }
      catch (error) {
        this.emit('progress', { tool: 'eslint', status: 'error', error })
      }
    }

    // TypeScript 检查
    if ((config.typescript !== false) && tools.typescript) {
      this.emit('progress', { tool: 'typescript', status: 'running' })
      try {
        const tsResult = await this.runTypeCheck()
        issues.push(...tsResult.issues)
        errorCount += tsResult.errorCount
        this.emit('progress', { tool: 'typescript', status: 'done', result: tsResult })
      }
      catch (error) {
        this.emit('progress', { tool: 'typescript', status: 'error', error })
      }
    }

    // Prettier 检查
    if ((config.prettier !== false) && tools.prettier) {
      this.emit('progress', { tool: 'prettier', status: 'running' })
      try {
        const prettierResult = await this.runPrettier(paths, config.fix)
        issues.push(...prettierResult.issues)
        warningCount += prettierResult.warningCount
        fixedCount += prettierResult.fixedCount || 0
        this.emit('progress', { tool: 'prettier', status: 'done', result: prettierResult })
      }
      catch (error) {
        this.emit('progress', { tool: 'prettier', status: 'error', error })
      }
    }

    const duration = Date.now() - startTime

    return {
      success: errorCount === 0,
      issues,
      errorCount,
      warningCount,
      fixedCount,
      duration,
    }
  }

  /**
   * 运行 ESLint
   */
  private runEslint(paths: string[], fix = false): Promise<LintResult & { issues: LintIssue[] }> {
    return new Promise((resolve) => {
      const args = ['eslint', ...paths, '--format', 'json']
      if (fix)
        args.push('--fix')

      const child = spawn('npx', args, {
        cwd: this.cwd,
        shell: true,
      })

      let stdout = ''
      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      child.on('close', () => {
        const issues: LintIssue[] = []
        let errorCount = 0
        let warningCount = 0

        try {
          const results = JSON.parse(stdout)
          for (const file of results) {
            for (const msg of file.messages) {
              const severity = msg.severity === 2 ? 'error' : 'warning'
              if (severity === 'error')
                errorCount++
              else warningCount++

              issues.push({
                file: path.relative(this.cwd, file.filePath),
                line: msg.line || 1,
                column: msg.column || 1,
                severity,
                message: msg.message,
                rule: msg.ruleId,
                source: 'eslint',
              })
            }
          }
        }
        catch {
          // JSON 解析失败，忽略
        }

        resolve({
          success: errorCount === 0,
          issues,
          errorCount,
          warningCount,
          duration: 0,
        })
      })
    })
  }

  /**
   * 运行 TypeScript 检查
   */
  private runTypeCheck(): Promise<LintResult & { issues: LintIssue[] }> {
    return new Promise((resolve) => {
      const child = spawn('npx', ['tsc', '--noEmit', '--pretty', 'false'], {
        cwd: this.cwd,
        shell: true,
      })

      let output = ''
      child.stdout?.on('data', (data) => {
        output += data.toString()
      })
      child.stderr?.on('data', (data) => {
        output += data.toString()
      })

      child.on('close', (code) => {
        const issues: LintIssue[] = []
        let errorCount = 0

        // 解析 TypeScript 输出
        const lines = output.split('\n')
        for (const line of lines) {
          // 格式: src/file.ts(10,5): error TS2345: ...
          const match = line.match(/^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+TS\d+:\s+(.+)$/)
          if (match) {
            errorCount++
            issues.push({
              file: match[1],
              line: Number.parseInt(match[2], 10),
              column: Number.parseInt(match[3], 10),
              severity: match[4] as 'error' | 'warning',
              message: match[5],
              source: 'typescript',
            })
          }
        }

        resolve({
          success: code === 0,
          issues,
          errorCount,
          warningCount: 0,
          duration: 0,
        })
      })
    })
  }

  /**
   * 运行 Prettier 检查
   */
  private runPrettier(paths: string[], fix = false): Promise<LintResult & { issues: LintIssue[] }> {
    return new Promise((resolve) => {
      const args = ['prettier', ...paths, fix ? '--write' : '--check']

      const child = spawn('npx', args, {
        cwd: this.cwd,
        shell: true,
      })

      let output = ''
      child.stdout?.on('data', (data) => {
        output += data.toString()
      })
      child.stderr?.on('data', (data) => {
        output += data.toString()
      })

      child.on('close', (code) => {
        const issues: LintIssue[] = []
        let warningCount = 0
        let fixedCount = 0

        // 解析 Prettier 输出
        const lines = output.split('\n')
        for (const line of lines) {
          if (line.includes('[warn]') || line.includes('Checking')) {
            // 跳过信息行
            continue
          }
          if (line.trim() && !line.includes('All matched files') && !line.includes('Code style issues')) {
            warningCount++
            issues.push({
              file: line.trim(),
              line: 1,
              column: 1,
              severity: 'warning',
              message: '格式化不一致',
              source: 'prettier',
            })
          }
        }

        if (fix && code === 0) {
          fixedCount = warningCount
          warningCount = 0
        }

        resolve({
          success: code === 0,
          issues: fix ? [] : issues,
          errorCount: 0,
          warningCount,
          fixedCount,
          duration: 0,
        })
      })
    })
  }

  /**
   * 快速修复
   */
  async fix(paths: string[] = ['src']): Promise<LintResult> {
    return this.check({ paths, fix: true })
  }

  /**
   * 格式化检查结果
   */
  formatResult(result: LintResult): string {
    const lines: string[] = []

    if (result.issues.length === 0) {
      lines.push('✅ 没有发现问题！')
    }
    else {
      // 按文件分组
      const byFile = new Map<string, LintIssue[]>()
      for (const issue of result.issues) {
        const issues = byFile.get(issue.file) || []
        issues.push(issue)
        byFile.set(issue.file, issues)
      }

      for (const [file, issues] of byFile) {
        lines.push(`\n📄 ${file}`)
        for (const issue of issues) {
          const icon = issue.severity === 'error' ? '❌' : '⚠️'
          const rule = issue.rule ? ` (${issue.rule})` : ''
          lines.push(`   ${icon} ${issue.line}:${issue.column} ${issue.message}${rule}`)
        }
      }
    }

    lines.push('')
    lines.push(`📊 结果: ${result.errorCount} 错误, ${result.warningCount} 警告`)
    if (result.fixedCount) {
      lines.push(`🔧 已修复: ${result.fixedCount} 个问题`)
    }
    lines.push(`⏱️ 用时: ${result.duration}ms`)

    return lines.join('\n')
  }
}

/**
 * 快速代码检查
 */
export async function checkCode(cwd: string, config?: LintConfig): Promise<LintResult> {
  const checker = new CodeQualityChecker(cwd)
  return checker.check(config)
}
