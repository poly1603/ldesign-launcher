/**
 * 部署服务核心类
 *
 * 负责管理部署流程、进度追踪和日志记录
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type {
  DeployConfig,
  DeployResult,
  DeployProgress,
  DeployStatus,
  DeployPhase,
  DeployLogEntry,
  DeployLogLevel,
  DeployHistoryEntry,
  DeployCallbacks,
  DeployServiceConfig,
  DeployAdapter,
  DeployPlatform,
} from '../types/deploy'
import { EventEmitter } from 'events'
import path from 'path'
import fs from 'fs-extra'
import { Logger } from '../utils/logger'
import { getAdapter, getPlatformInfo, SUPPORTED_PLATFORMS } from './adapters'

/**
 * 部署服务
 *
 * 提供统一的部署接口，支持多种部署目标
 */
export class DeployService extends EventEmitter {
  private config: Required<DeployServiceConfig>
  private logger: Logger
  private currentDeployment: {
    id: string
    config: DeployConfig
    status: DeployStatus
    progress: DeployProgress
    logs: DeployLogEntry[]
    startTime: number
    adapter?: DeployAdapter
  } | null = null
  private history: DeployHistoryEntry[] = []
  private isCancelled = false

  constructor(config: DeployServiceConfig) {
    super()
    this.config = {
      cwd: config.cwd,
      defaultDistDir: config.defaultDistDir || 'dist',
      historyPath: config.historyPath || path.join(config.cwd, '.launcher', 'deploy-history.json'),
      maxHistoryEntries: config.maxHistoryEntries || 50,
      enableLogs: config.enableLogs !== false,
      logLevel: config.logLevel || 'info',
    }
    // Map deploy log level to logger level (exclude 'success' which Logger doesn't support)
    const loggerLevel = this.config.logLevel === 'success' ? 'info' : this.config.logLevel
    this.logger = new Logger('Deploy', { level: loggerLevel as 'info' | 'warn' | 'error' | 'debug' })
    this.loadHistory()
  }

  /**
   * 获取所有支持的平台信息
   */
  getSupportedPlatforms() {
    return SUPPORTED_PLATFORMS
  }

  /**
   * 获取平台信息
   */
  getPlatformInfo(platform: DeployPlatform) {
    return getPlatformInfo(platform)
  }

  /**
   * 验证部署配置
   */
  async validateConfig(config: DeployConfig): Promise<{ valid: boolean; errors: string[] }> {
    const adapter = getAdapter(config.platform)
    if (!adapter) {
      return { valid: false, errors: [`不支持的部署平台: ${config.platform}`] }
    }
    return adapter.validateConfig(config)
  }

  /**
   * 执行部署
   */
  async deploy(config: DeployConfig): Promise<DeployResult> {
    // 生成部署 ID
    const deployId = this.generateDeployId()
    this.isCancelled = false

    // 初始化当前部署状态
    this.currentDeployment = {
      id: deployId,
      config,
      status: 'preparing',
      progress: {
        phase: 'init',
        progress: 0,
        phaseProgress: 0,
        message: '准备部署...',
      },
      logs: [],
      startTime: Date.now(),
    }

    const callbacks: DeployCallbacks = {
      onProgress: (progress) => this.updateProgress(progress),
      onLog: (entry) => this.addLog(entry),
      onStatusChange: (status) => this.updateStatus(status),
    }

    try {
      // 发出开始事件
      this.emit('start', { deployId, config })
      this.log('info', `开始部署到 ${config.platform}`, 'init')
      this.updateStatus('preparing')

      // 验证配置
      this.updateProgress({
        phase: 'validate',
        progress: 5,
        phaseProgress: 0,
        message: '验证配置...',
      })

      const adapter = getAdapter(config.platform)
      if (!adapter) {
        throw new Error(`不支持的部署平台: ${config.platform}`)
      }

      this.currentDeployment.adapter = adapter

      const validation = await adapter.validateConfig(config)
      if (!validation.valid) {
        throw new Error(`配置验证失败: ${validation.errors.join(', ')}`)
      }

      this.updateProgress({
        phase: 'validate',
        progress: 10,
        phaseProgress: 100,
        message: '配置验证通过',
      })

      // 检查取消
      if (this.isCancelled) {
        return this.createCancelledResult(deployId)
      }

      // 构建（如果需要）
      if (config.buildBeforeDeploy !== false && adapter.requiresBuild) {
        await this.runBuild(config)
      }

      // 检查取消
      if (this.isCancelled) {
        return this.createCancelledResult(deployId)
      }

      // 执行部署
      this.updateStatus('uploading')
      const result = await adapter.deploy(config, callbacks)

      // 记录结果
      const duration = Date.now() - this.currentDeployment.startTime
      const finalResult: DeployResult = {
        ...result,
        deployId,
        duration,
        timestamp: Date.now(),
      }

      if (result.success) {
        this.updateStatus('success')
        this.log('success', `部署成功！URL: ${result.url || '(无)'}`, 'complete')
        this.emit('success', finalResult)

        // 部署后打开 URL
        if (config.openAfterDeploy && result.url) {
          import('open').then(({ default: open }) => open(result.url!)).catch(() => { })
        }

        // 执行部署后钩子
        if (config.afterDeploy) {
          await config.afterDeploy(finalResult)
        }
      } else {
        this.updateStatus('failed')
        this.log('error', `部署失败: ${result.error}`, 'complete')
        this.emit('failed', finalResult)
      }

      // 保存历史记录
      this.saveToHistory(finalResult)

      return finalResult
    } catch (error) {
      const errorMessage = (error as Error).message
      this.updateStatus('failed')
      this.log('error', `部署出错: ${errorMessage}`, 'complete')

      const failedResult: DeployResult = {
        success: false,
        error: errorMessage,
        errorDetails: (error as Error).stack,
        deployId,
        duration: Date.now() - this.currentDeployment.startTime,
        timestamp: Date.now(),
      }

      this.emit('failed', failedResult)
      this.saveToHistory(failedResult)

      return failedResult
    } finally {
      this.currentDeployment = null
    }
  }

  /**
   * 取消当前部署
   */
  async cancel(): Promise<void> {
    if (!this.currentDeployment) {
      return
    }

    this.isCancelled = true
    this.log('warn', '正在取消部署...', this.currentDeployment.progress.phase)

    if (this.currentDeployment.adapter?.cancel) {
      await this.currentDeployment.adapter.cancel()
    }

    this.updateStatus('cancelled')
    this.emit('cancelled', { deployId: this.currentDeployment.id })
  }

  /**
   * 获取当前部署状态
   */
  getCurrentDeployment() {
    if (!this.currentDeployment) {
      return null
    }

    return {
      id: this.currentDeployment.id,
      platform: this.currentDeployment.config.platform,
      status: this.currentDeployment.status,
      progress: this.currentDeployment.progress,
      logsCount: this.currentDeployment.logs.length,
      startTime: this.currentDeployment.startTime,
      duration: Date.now() - this.currentDeployment.startTime,
    }
  }

  /**
   * 获取当前部署日志
   */
  getCurrentLogs(): DeployLogEntry[] {
    return this.currentDeployment?.logs || []
  }

  /**
   * 获取部署历史
   */
  getHistory(): DeployHistoryEntry[] {
    return this.history
  }

  /**
   * 清空历史记录
   */
  async clearHistory(): Promise<void> {
    this.history = []
    await this.saveHistory()
  }

  /**
   * 运行构建
   */
  private async runBuild(_config: DeployConfig): Promise<void> {
    this.updateProgress({
      phase: 'build',
      progress: 15,
      phaseProgress: 0,
      message: '正在构建项目...',
    })
    this.log('info', '开始构建项目...', 'build')
    this.updateStatus('building')

    const { spawn } = await import('child_process')

    return new Promise((resolve, reject) => {
      const isWindows = process.platform === 'win32'
      const child = isWindows
        ? spawn('cmd.exe', ['/c', 'pnpm', 'run', 'build'], {
          cwd: this.config.cwd,
          env: { ...process.env, FORCE_COLOR: '1' },
          stdio: ['pipe', 'pipe', 'pipe'],
        })
        : spawn('pnpm', ['run', 'build'], {
          cwd: this.config.cwd,
          env: { ...process.env, FORCE_COLOR: '1' },
          stdio: ['pipe', 'pipe', 'pipe'],
        })

      let buildProgress = 0

      child.stdout?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(Boolean)
        lines.forEach((line) => {
          const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim()
          if (cleanLine) {
            this.log('info', cleanLine, 'build')

            // 解析构建进度
            if (cleanLine.includes('transforming')) {
              buildProgress = 30
            } else if (cleanLine.includes('rendering') || cleanLine.includes('bundling')) {
              buildProgress = 60
            } else if (cleanLine.includes('computing gzip') || cleanLine.includes('built in')) {
              buildProgress = 90
            }

            this.updateProgress({
              phase: 'build',
              progress: 15 + (buildProgress * 0.25),
              phaseProgress: buildProgress,
              message: cleanLine.slice(0, 100),
            })
          }
        })
      })

      child.stderr?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(Boolean)
        lines.forEach((line) => {
          const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim()
          if (cleanLine) {
            if (cleanLine.toLowerCase().includes('error')) {
              this.log('error', cleanLine, 'build')
            } else {
              this.log('warn', cleanLine, 'build')
            }
          }
        })
      })

      child.on('close', (code) => {
        if (code === 0) {
          this.log('success', '构建完成', 'build')
          this.updateProgress({
            phase: 'build',
            progress: 40,
            phaseProgress: 100,
            message: '构建完成',
          })
          resolve()
        } else {
          reject(new Error(`构建失败，退出码: ${code}`))
        }
      })

      child.on('error', (err) => {
        reject(new Error(`构建进程出错: ${err.message}`))
      })
    })
  }

  /**
   * 更新进度
   */
  private updateProgress(progress: DeployProgress): void {
    if (this.currentDeployment) {
      this.currentDeployment.progress = progress
      this.emit('progress', progress)
    }
  }

  /**
   * 更新状态
   */
  private updateStatus(status: DeployStatus): void {
    if (this.currentDeployment) {
      this.currentDeployment.status = status
      this.emit('status', status)
    }
  }

  /**
   * 添加日志
   */
  private log(level: DeployLogLevel, message: string, phase?: DeployPhase): void {
    const entry: DeployLogEntry = {
      timestamp: Date.now(),
      level,
      message,
      phase,
    }
    this.addLog(entry)
  }

  /**
   * 添加日志条目
   */
  private addLog(entry: DeployLogEntry): void {
    if (this.currentDeployment) {
      this.currentDeployment.logs.push(entry)
      this.emit('log', entry)
    }

    // 输出到控制台
    if (this.config.enableLogs) {
      switch (entry.level) {
        case 'error':
          this.logger.error(entry.message)
          break
        case 'warn':
          this.logger.warn(entry.message)
          break
        case 'success':
          this.logger.info(`✅ ${entry.message}`)
          break
        case 'debug':
          this.logger.debug(entry.message)
          break
        default:
          this.logger.info(entry.message)
      }
    }
  }

  /**
   * 生成部署 ID
   */
  private generateDeployId(): string {
    return `deploy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }

  /**
   * 创建取消结果
   */
  private createCancelledResult(deployId: string): DeployResult {
    return {
      success: false,
      error: '部署已取消',
      deployId,
      timestamp: Date.now(),
    }
  }

  /**
   * 保存到历史记录
   */
  private saveToHistory(result: DeployResult): void {
    if (!this.currentDeployment) return

    const entry: DeployHistoryEntry = {
      id: this.currentDeployment.id,
      platform: this.currentDeployment.config.platform,
      status: this.currentDeployment.status,
      result,
      config: this.sanitizeConfig(this.currentDeployment.config),
      startTime: this.currentDeployment.startTime,
      endTime: Date.now(),
      logs: this.currentDeployment.logs,
    }

    this.history.unshift(entry)

    // 限制历史记录数量
    if (this.history.length > this.config.maxHistoryEntries) {
      this.history = this.history.slice(0, this.config.maxHistoryEntries)
    }

    this.saveHistory()
  }

  /**
   * 脱敏配置（移除敏感信息）
   */
  private sanitizeConfig(config: DeployConfig): Partial<DeployConfig> {
    const sanitized: Record<string, unknown> = { ...config }
    const sensitiveKeys = ['password', 'token', 'authToken', 'apiToken', 'privateKey', 'passphrase']

    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '***'
      }
    }

    return sanitized as Partial<DeployConfig>
  }

  /**
   * 加载历史记录
   */
  private loadHistory(): void {
    try {
      if (fs.existsSync(this.config.historyPath)) {
        const data = fs.readFileSync(this.config.historyPath, 'utf-8')
        this.history = JSON.parse(data)
      }
    } catch (error) {
      this.logger.warn('加载部署历史记录失败:', error)
      this.history = []
    }
  }

  /**
   * 保存历史记录
   */
  private async saveHistory(): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.config.historyPath))
      await fs.writeFile(this.config.historyPath, JSON.stringify(this.history, null, 2))
    } catch (error) {
      this.logger.warn('保存部署历史记录失败:', error)
    }
  }
}
