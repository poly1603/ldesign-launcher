/**
 * 智能错误诊断工具
 * 
 * 提供错误检测、诊断和自动恢复功能
 * 
 * @author LDesign Team
 * @since 1.1.1
 */

import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { Logger } from './logger'
import { FileSystem } from './file-system'
import { PathUtils } from './path-utils'
import pc from 'picocolors'

const execAsync = promisify(exec)

/**
 * 诊断结果
 */
export interface DiagnosticResult {
  /** 是否通过检查 */
  passed: boolean
  /** 问题描述 */
  issue?: string
  /** 解决建议 */
  suggestion?: string
  /** 自动修复函数 */
  autoFix?: () => Promise<void>
}

/**
 * 诊断报告
 */
export interface DiagnosticReport {
  /** 检查项名称 */
  name: string
  /** 检查结果 */
  results: DiagnosticResult[]
  /** 总体状态 */
  status: 'success' | 'warning' | 'error'
}

/**
 * 错误诊断器类
 */
export class Diagnostics {
  private logger: Logger

  constructor(logger?: Logger) {
    this.logger = logger || new Logger('Diagnostics', { compact: true })
  }

  /**
   * 检查端口是否被占用
   * 
   * @param port - 端口号
   * @returns 诊断结果
   */
  async checkPort(port: number): Promise<DiagnosticResult> {
    try {
      // Windows 系统
      if (process.platform === 'win32') {
        const { stdout } = await execAsync(`netstat -ano | findstr :${port}`)
        if (stdout.trim()) {
          const lines = stdout.trim().split('\n')
          const pid = lines[0].split(/\s+/).pop()

          return {
            passed: false,
            issue: `端口 ${port} 已被占用（PID: ${pid}）`,
            suggestion: `使用其他端口或结束占用进程：\n  taskkill /F /PID ${pid}`,
            autoFix: async () => {
              this.logger.info(`正在尝试终止进程 ${pid}...`)
              await execAsync(`taskkill /F /PID ${pid}`)
              this.logger.success(`进程 ${pid} 已终止`)
            }
          }
        }
      } else {
        // Unix/Linux/Mac 系统
        const { stdout } = await execAsync(`lsof -i :${port}`)
        if (stdout.trim()) {
          const lines = stdout.trim().split('\n')
          if (lines.length > 1) {
            const pid = lines[1].split(/\s+/)[1]

            return {
              passed: false,
              issue: `端口 ${port} 已被占用（PID: ${pid}）`,
              suggestion: `使用其他端口或结束占用进程：\n  kill -9 ${pid}`,
              autoFix: async () => {
                this.logger.info(`正在尝试终止进程 ${pid}...`)
                await execAsync(`kill -9 ${pid}`)
                this.logger.success(`进程 ${pid} 已终止`)
              }
            }
          }
        }
      }

      return { passed: true }
    } catch (error) {
      // 命令执行失败通常意味着端口未被占用
      return { passed: true }
    }
  }

  /**
   * 检查依赖是否安装
   * 
   * @param cwd - 工作目录
   * @returns 诊断结果
   */
  async checkDependencies(cwd: string): Promise<DiagnosticResult> {
    const packageJsonPath = PathUtils.join(cwd, 'package.json')

    if (!(await FileSystem.exists(packageJsonPath))) {
      return {
        passed: false,
        issue: '未找到 package.json 文件',
        suggestion: '请确保在正确的项目目录中'
      }
    }

    const nodeModulesPath = PathUtils.join(cwd, 'node_modules')

    if (!(await FileSystem.exists(nodeModulesPath))) {
      return {
        passed: false,
        issue: '依赖未安装',
        suggestion: '运行以下命令安装依赖：\n  pnpm install',
        autoFix: async () => {
          this.logger.info('正在安装依赖...')
          await execAsync('pnpm install', { cwd })
          this.logger.success('依赖安装完成')
        }
      }
    }

    return { passed: true }
  }

  /**
   * 检查 Node.js 版本
   * 
   * @param minVersion - 最低版本要求
   * @returns 诊断结果
   */
  async checkNodeVersion(minVersion: string = '16.0.0'): Promise<DiagnosticResult> {
    const currentVersion = process.version.slice(1) // 移除 'v' 前缀

    if (!this.compareVersions(currentVersion, minVersion)) {
      return {
        passed: false,
        issue: `Node.js 版本过低（当前: ${currentVersion}，要求: ${minVersion}）`,
        suggestion: `请升级 Node.js 到 ${minVersion} 或更高版本`
      }
    }

    return { passed: true }
  }

  /**
   * 检查磁盘空间
   * 
   * @param cwd - 工作目录
   * @param minSpace - 最小可用空间（MB）
   * @returns 诊断结果
   */
  async checkDiskSpace(cwd: string, minSpace: number = 500): Promise<DiagnosticResult> {
    try {
      // 这是一个简化的实现，实际项目中可以使用 check-disk-space 包
      if (process.platform === 'win32') {
        const drive = PathUtils.parse(cwd).root
        const { stdout } = await execAsync(`wmic logicaldisk where "DeviceID='${drive.replace('\\', '')}'" get FreeSpace`)
        const freeSpace = parseInt(stdout.split('\n')[1].trim()) / (1024 * 1024) // 转换为 MB

        if (freeSpace < minSpace) {
          return {
            passed: false,
            issue: `磁盘空间不足（可用: ${freeSpace.toFixed(2)} MB）`,
            suggestion: `清理磁盘空间，至少需要 ${minSpace} MB`
          }
        }
      }

      return { passed: true }
    } catch (error) {
      // 如果检查失败，假设空间充足
      return { passed: true }
    }
  }

  /**
   * 检查配置文件
   * 
   * @param cwd - 工作目录
   * @returns 诊断结果
   */
  async checkConfigFile(cwd: string): Promise<DiagnosticResult> {
    const configFiles = [
      '.ldesign/launcher.config.ts',
      '.ldesign/launcher.config.js',
      'launcher.config.ts',
      'launcher.config.js'
    ]

    for (const file of configFiles) {
      const filePath = PathUtils.join(cwd, file)
      if (await FileSystem.exists(filePath)) {
        // 检查配置文件语法
        try {
          await FileSystem.readFile(filePath)
          return { passed: true }
        } catch (error) {
          return {
            passed: false,
            issue: `配置文件读取失败: ${file}`,
            suggestion: '请检查配置文件格式是否正确'
          }
        }
      }
    }

    return {
      passed: true,
      issue: '未找到配置文件（将使用默认配置）',
      suggestion: '可以创建 .ldesign/launcher.config.ts 文件来自定义配置'
    }
  }

  /**
   * 检查内存使用情况
   * 
   * @param minAvailable - 最小可用内存（MB）
   * @returns 诊断结果
   */
  async checkMemory(minAvailable: number = 512): Promise<DiagnosticResult> {
    const freeMem = process.memoryUsage().heapTotal / (1024 * 1024)
    const totalMem = require('os').totalmem() / (1024 * 1024)
    const availableMem = require('os').freemem() / (1024 * 1024)

    if (availableMem < minAvailable) {
      return {
        passed: false,
        issue: `可用内存不足（可用: ${availableMem.toFixed(2)} MB，总计: ${totalMem.toFixed(2)} MB）`,
        suggestion: `关闭其他应用程序或增加系统内存，建议至少 ${minAvailable} MB 可用内存`
      }
    }

    return { passed: true }
  }

  /**
   * 执行完整诊断
   * 
   * @param cwd - 工作目录
   * @param port - 端口号
   * @returns 诊断报告
   */
  async runFullDiagnostics(cwd: string, port?: number): Promise<DiagnosticReport> {
    this.logger.info('正在执行系统诊断...\n')

    const results: DiagnosticResult[] = []

    // 1. 检查 Node.js 版本
    this.logger.info('检查 Node.js 版本...')
    results.push(await this.checkNodeVersion())

    // 2. 检查依赖
    this.logger.info('检查项目依赖...')
    results.push(await this.checkDependencies(cwd))

    // 3. 检查配置文件
    this.logger.info('检查配置文件...')
    results.push(await this.checkConfigFile(cwd))

    // 4. 检查内存
    this.logger.info('检查系统内存...')
    results.push(await this.checkMemory())

    // 5. 检查磁盘空间
    this.logger.info('检查磁盘空间...')
    results.push(await this.checkDiskSpace(cwd))

    // 6. 检查端口（如果指定）
    if (port) {
      this.logger.info(`检查端口 ${port}...`)
      results.push(await this.checkPort(port))
    }

    // 统计结果
    const errors = results.filter(r => !r.passed && r.issue && !r.issue.includes('未找到配置文件'))
    const warnings = results.filter(r => !r.passed && r.issue && r.issue.includes('未找到配置文件'))

    const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'success'

    return {
      name: '系统诊断',
      results,
      status
    }
  }

  /**
   * 打印诊断报告
   * 
   * @param report - 诊断报告
   */
  printReport(report: DiagnosticReport): void {
    console.log('\n' + pc.bold(pc.cyan('━'.repeat(60))))
    console.log(pc.bold(pc.cyan(`  ${report.name}`)))
    console.log(pc.bold(pc.cyan('━'.repeat(60))) + '\n')

    let index = 1
    for (const result of report.results) {
      if (result.passed) {
        console.log(`${pc.green('✓')} ${pc.dim(`检查项 ${index}`)} ${pc.green('通过')}`)
      } else {
        console.log(`${pc.red('✗')} ${pc.dim(`检查项 ${index}`)} ${pc.red('失败')}`)
        if (result.issue) {
          console.log(`  ${pc.yellow('问题:')} ${result.issue}`)
        }
        if (result.suggestion) {
          console.log(`  ${pc.cyan('建议:')} ${result.suggestion}`)
        }
        if (result.autoFix) {
          console.log(`  ${pc.magenta('提示:')} 可以使用自动修复功能`)
        }
        console.log()
      }
      index++
    }

    console.log(pc.bold(pc.cyan('━'.repeat(60))))

    const statusColor = report.status === 'success' ? 'green' : report.status === 'warning' ? 'yellow' : 'red'
    const statusText = report.status === 'success' ? '通过' : report.status === 'warning' ? '警告' : '失败'
    console.log(pc.bold(pc[statusColor](`  总体状态: ${statusText}`)))
    console.log(pc.bold(pc.cyan('━'.repeat(60))) + '\n')
  }

  /**
   * 自动修复问题
   * 
   * @param results - 诊断结果列表
   */
  async autoFixIssues(results: DiagnosticResult[]): Promise<void> {
    const fixable = results.filter(r => !r.passed && r.autoFix)

    if (fixable.length === 0) {
      this.logger.info('没有可以自动修复的问题')
      return
    }

    this.logger.info(`发现 ${fixable.length} 个可以自动修复的问题\n`)

    for (const result of fixable) {
      if (result.autoFix) {
        try {
          await result.autoFix()
        } catch (error) {
          this.logger.error(`自动修复失败: ${(error as Error).message}`)
        }
      }
    }

    this.logger.success('\n自动修复完成')
  }

  /**
   * 比较版本号
   * 
   * @param current - 当前版本
   * @param required - 要求版本
   * @returns 是否满足要求
   */
  private compareVersions(current: string, required: string): boolean {
    const currentParts = current.split('.').map(Number)
    const requiredParts = required.split('.').map(Number)

    for (let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
      const curr = currentParts[i] || 0
      const req = requiredParts[i] || 0

      if (curr > req) return true
      if (curr < req) return false
    }

    return true
  }
}

/**
 * 创建诊断器实例
 * 
 * @param logger - 日志记录器
 * @returns 诊断器实例
 */
export function createDiagnostics(logger?: Logger): Diagnostics {
  return new Diagnostics(logger)
}

/**
 * 快速诊断（便捷函数）
 * 
 * @param cwd - 工作目录
 * @param port - 端口号
 * @returns 诊断报告
 */
export async function quickDiagnostics(cwd: string, port?: number): Promise<DiagnosticReport> {
  const diagnostics = createDiagnostics()
  const report = await diagnostics.runFullDiagnostics(cwd, port)
  diagnostics.printReport(report)
  return report
}

