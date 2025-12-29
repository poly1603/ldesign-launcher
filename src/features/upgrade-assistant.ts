/**
 * 智能依赖升级助手
 *
 * 自动分析依赖更新、检测破坏性变更、提供交互式升级
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import { spawn } from 'node:child_process'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import pc from 'picocolors'
import { Logger } from '../utils/logger'

export interface DependencyInfo {
  name: string
  currentVersion: string
  latestVersion: string
  wantedVersion: string
  type: 'dependencies' | 'devDependencies'
  updateType: 'major' | 'minor' | 'patch'
  hasBreakingChanges: boolean
  changelog?: string
  vulnerabilities?: number
}

export interface UpgradeReport {
  total: number
  outdated: DependencyInfo[]
  safeUpgrades: DependencyInfo[]
  majorUpgrades: DependencyInfo[]
  vulnerabilities: DependencyInfo[]
}

export class UpgradeAssistant {
  private logger: Logger
  private cwd: string

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd
    this.logger = new Logger('UpgradeAssistant')
  }

  /**
   * 分析可升级的依赖
   */
  async analyzeUpgrades(): Promise<UpgradeReport> {
    this.logger.info('🔍 正在分析依赖更新...')

    const outdated = await this.getOutdatedDependencies()
    const safeUpgrades = outdated.filter(dep => !dep.hasBreakingChanges && dep.updateType !== 'major')
    const majorUpgrades = outdated.filter(dep => dep.updateType === 'major')
    const vulnerabilities = outdated.filter(dep => dep.vulnerabilities && dep.vulnerabilities > 0)

    return {
      total: outdated.length,
      outdated,
      safeUpgrades,
      majorUpgrades,
      vulnerabilities,
    }
  }

  /**
   * 获取过时的依赖
   */
  private async getOutdatedDependencies(): Promise<DependencyInfo[]> {
    const packageJsonPath = path.join(this.cwd, 'package.json')

    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(content)

      const deps = packageJson.dependencies || {}
      const devDeps = packageJson.devDependencies || {}

      const allDeps = [
        ...Object.entries(deps).map(([name, version]) => ({ name, version: version as string, type: 'dependencies' as const })),
        ...Object.entries(devDeps).map(([name, version]) => ({ name, version: version as string, type: 'devDependencies' as const })),
      ]

      const outdatedList: DependencyInfo[] = []

      // 使用 npm outdated 获取过时依赖
      const outdatedData = await this.runNpmOutdated()

      for (const dep of allDeps) {
        const outdatedInfo = outdatedData[dep.name]
        if (outdatedInfo) {
          const updateType = this.determineUpdateType(
            outdatedInfo.current,
            outdatedInfo.latest,
          )

          outdatedList.push({
            name: dep.name,
            currentVersion: outdatedInfo.current,
            latestVersion: outdatedInfo.latest,
            wantedVersion: outdatedInfo.wanted,
            type: dep.type,
            updateType,
            hasBreakingChanges: updateType === 'major',
            vulnerabilities: 0, // 需要单独检查
          })
        }
      }

      return outdatedList
    }
    catch (error) {
      this.logger.error(`分析依赖失败: ${(error as Error).message}`)
      return []
    }
  }

  /**
   * 运行 npm outdated 命令（带超时和重试）
   */
  private async runNpmOutdated(): Promise<Record<string, { current: string, wanted: string, latest: string }>> {
    const maxRetries = 3
    const timeout = 30000 // 30秒超时

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.runNpmOutdatedOnce(timeout)
      }
      catch (error) {
        if (attempt === maxRetries) {
          this.logger.warn(`npm outdated 执行失败（${maxRetries}次重试后）: ${(error as Error).message}`)
          return {}
        }
        this.logger.debug(`npm outdated 第${attempt}次尝试失败，正在重试...`)
        // 等待1秒后重试
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    return {}
  }

  /**
   * 执行一次 npm outdated 命令
   */
  private async runNpmOutdatedOnce(timeout: number): Promise<Record<string, { current: string, wanted: string, latest: string }>> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        child.kill()
        reject(new Error('npm outdated 执行超时'))
      }, timeout)

      const child = spawn('npm', ['outdated', '--json'], {
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

      child.on('close', () => {
        clearTimeout(timeoutId)
        try {
          const data = stdout ? JSON.parse(stdout) : {}
          resolve(data)
        }
        catch (error) {
          if (stderr) {
            reject(new Error(`npm outdated 解析失败: ${stderr}`))
          }
          else {
            reject(error)
          }
        }
      })

      child.on('error', (error) => {
        clearTimeout(timeoutId)
        reject(error)
      })
    })
  }

  /**
   * 确定更新类型
   */
  private determineUpdateType(current: string, latest: string): 'major' | 'minor' | 'patch' {
    const currentParts = current.replace(/[^0-9.]/g, '').split('.').map(Number)
    const latestParts = latest.replace(/[^0-9.]/g, '').split('.').map(Number)

    if (latestParts[0] > currentParts[0])
      return 'major'
    if (latestParts[1] > currentParts[1])
      return 'minor'
    return 'patch'
  }

  /**
   * 交互式升级依赖
   */
  async upgradeInteractive(report: UpgradeReport): Promise<void> {
    const inquirer = await import('inquirer')

    if (report.total === 0) {
      this.logger.info(pc.green('✅ 所有依赖都是最新的！'))
      return
    }

    console.log(`\n${pc.bold('📦 依赖更新概览:')}`)
    console.log(`  总计: ${report.total} 个`)
    console.log(`  ${pc.green('安全更新')}: ${report.safeUpgrades.length} 个`)
    console.log(`  ${pc.yellow('主版本更新')}: ${report.majorUpgrades.length} 个`)
    if (report.vulnerabilities.length > 0) {
      console.log(`  ${pc.red('存在漏洞')}: ${report.vulnerabilities.length} 个`)
    }

    const choices = report.outdated.map((dep) => {
      const icon = dep.updateType === 'major' ? '⚠️ ' : '✅'
      const color = dep.updateType === 'major' ? pc.yellow : pc.green

      return {
        name: color(`${icon} ${dep.name}: ${dep.currentVersion} → ${dep.latestVersion} (${dep.updateType})`),
        value: dep.name,
        checked: !dep.hasBreakingChanges,
      }
    })

    const { selected } = await inquirer.default.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message: '选择要升级的依赖（使用空格选择）：',
        choices,
        pageSize: 15,
      },
    ])

    if (selected.length === 0) {
      this.logger.info('未选择任何依赖')
      return
    }

    // 确认升级
    const { confirm } = await inquirer.default.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `确认升级 ${selected.length} 个依赖？`,
        default: true,
      },
    ])

    if (!confirm) {
      this.logger.info('已取消升级')
      return
    }

    // 执行升级
    for (const name of selected) {
      await this.upgradeDependency(name)
    }

    this.logger.info(pc.green(`\n✅ 成功升级 ${selected.length} 个依赖`))
  }

  /**
   * 升级单个依赖（带超时控制）
   */
  async upgradeDependency(name: string): Promise<void> {
    this.logger.info(`📦 正在升级 ${pc.cyan(name)}...`)

    const timeout = 120000 // 2分钟超时

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        child.kill()
        reject(new Error(`升级 ${name} 超时（${timeout / 1000}秒）`))
      }, timeout)

      const child = spawn('pnpm', ['update', name], {
        cwd: this.cwd,
        shell: true,
        stdio: 'inherit',
      })

      child.on('close', (code) => {
        clearTimeout(timeoutId)
        if (code === 0) {
          this.logger.info(pc.green(`✅ ${name} 升级完成`))
          resolve()
        }
        else {
          reject(new Error(`升级 ${name} 失败（退出码: ${code}）`))
        }
      })

      child.on('error', (error) => {
        clearTimeout(timeoutId)
        reject(new Error(`升级 ${name} 失败: ${error.message}`))
      })
    })
  }

  /**
   * 自动升级安全更新
   */
  async upgradeSafe(): Promise<void> {
    const report = await this.analyzeUpgrades()

    if (report.safeUpgrades.length === 0) {
      this.logger.info(pc.green('✅ 没有可安全升级的依赖'))
      return
    }

    this.logger.info(`📦 发现 ${report.safeUpgrades.length} 个安全更新`)

    for (const dep of report.safeUpgrades) {
      await this.upgradeDependency(dep.name)
    }

    this.logger.info(pc.green(`\n✅ 成功升级 ${report.safeUpgrades.length} 个依赖`))
  }

  /**
   * 获取依赖的变更日志（带超时和降级处理）
   */
  async getChangelog(name: string, fromVersion: string, toVersion: string): Promise<string> {
    const timeout = 10000 // 10秒超时

    try {
      // 使用 AbortController 实现超时
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(`https://registry.npmjs.org/${name}`, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const changelog = data.versions?.[toVersion]?.changelog

      if (changelog) {
        return changelog
      }

      // 如果没有 changelog，返回版本信息
      return `${name}@${fromVersion} → ${toVersion}\n\n查看完整变更: https://www.npmjs.com/package/${name}/v/${toVersion}`
    }
    catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      this.logger.debug(`获取 ${name} 变更日志失败: ${errorMsg}`)
      return `无法获取 ${name} 的变更日志（${errorMsg}）`
    }
  }

  /**
   * 检查安全漏洞（带超时控制）
   */
  async checkVulnerabilities(): Promise<void> {
    this.logger.info('🔒 正在检查安全漏洞...')

    const timeout = 60000 // 60秒超时

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        child.kill()
        this.logger.warn('安全审计超时，已取消')
        resolve()
      }, timeout)

      const child = spawn('npm', ['audit', '--json'], {
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

      child.on('close', () => {
        clearTimeout(timeoutId)
        try {
          const audit = JSON.parse(stdout)
          const vulnerabilities = audit.metadata?.vulnerabilities || {}

          const total = Object.values(vulnerabilities).reduce((sum: number, count) => sum + (count as number), 0)

          if (total === 0) {
            this.logger.info(pc.green('✅ 未发现安全漏洞'))
          }
          else {
            this.logger.warn(pc.yellow(`⚠️  发现 ${total} 个安全漏洞`))
            if (vulnerabilities.critical) {
              this.logger.error(pc.red(`  严重: ${vulnerabilities.critical}`))
            }
            if (vulnerabilities.high) {
              this.logger.warn(pc.yellow(`  高危: ${vulnerabilities.high}`))
            }
            if (vulnerabilities.moderate) {
              this.logger.info(pc.blue(`  中危: ${vulnerabilities.moderate}`))
            }
            if (vulnerabilities.low) {
              this.logger.info(pc.gray(`  低危: ${vulnerabilities.low}`))
            }
          }

          resolve()
        }
        catch (error) {
          const errorMsg = error instanceof Error ? error.message : '未知错误'
          this.logger.error(`无法解析安全审计结果: ${errorMsg}`)
          if (stderr) {
            this.logger.debug(`stderr: ${stderr}`)
          }
          resolve()
        }
      })

      child.on('error', (error) => {
        clearTimeout(timeoutId)
        this.logger.error(`安全审计执行失败: ${error.message}`)
        resolve()
      })
    })
  }

  /**
   * 生成升级报告
   */
  generateReport(report: UpgradeReport): string {
    const lines: string[] = []

    lines.push(pc.bold('\n📊 依赖升级报告\n'))
    lines.push(`总依赖数: ${report.total}`)
    lines.push(`可升级: ${report.outdated.length}`)
    lines.push(`安全更新: ${pc.green(String(report.safeUpgrades.length))}`)
    lines.push(`主版本更新: ${pc.yellow(String(report.majorUpgrades.length))}`)

    if (report.vulnerabilities.length > 0) {
      lines.push(`存在漏洞: ${pc.red(String(report.vulnerabilities.length))}`)
    }

    if (report.outdated.length > 0) {
      lines.push(`\n${pc.bold('📦 详细列表:')}`)

      for (const dep of report.outdated) {
        const icon = dep.updateType === 'major' ? '⚠️ ' : '✅'
        const color = dep.updateType === 'major' ? pc.yellow : pc.green

        lines.push(color(`  ${icon} ${dep.name}: ${dep.currentVersion} → ${dep.latestVersion}`))
      }
    }

    return lines.join('\n')
  }
}

/**
 * 创建升级助手实例
 */
export function createUpgradeAssistant(cwd?: string): UpgradeAssistant {
  return new UpgradeAssistant(cwd)
}
