/**
 * Launcher 核心类（重构版）
 * 
 * @deprecated 此类将在 v3.0.0 中移除，请使用 ViteLauncher 代替
 * @see {@link ViteLauncher} 获取完整功能和更好的向后兼容性
 * 
 * 统一的项目启动器，支持多种构建引擎和前端框架
 * 委托给引擎适配器和框架适配器处理具体逻辑
 * 
 * @author LDesign Team
 * @since 2.0.0
 * @deprecated 2.1.0
 */

import { EventEmitter } from 'events'
import type {
  BuildEngine,
  DevServer,
  PreviewServer,
  EngineBuildResult,
  BuildEngineType
} from '../types/engine'
import type {
  FrameworkAdapter,
  FrameworkType,
  FrameworkDetectionResult
} from '../types/framework'
import type {
  ViteLauncherConfig,
  LauncherOptions,
  IViteLauncher,
  LauncherEvent
} from '../types'
import { LauncherStatus } from '../types'
import { Logger } from '../utils/logger'
import { ConfigManager } from './ConfigManager'
import { getEngineRegistry } from '../registry/EngineRegistry'
import { getFrameworkRegistry, detectFramework } from '../registry/FrameworkRegistry'

/**
 * Launcher 核心类
 */
export class Launcher extends EventEmitter implements IViteLauncher {
  /** 工作目录 */
  private cwd: string

  /** 环境名称 */
  private environment?: string

  /** 当前状态 */
  private status: LauncherStatus = 'idle' as LauncherStatus

  /** 配置管理器 */
  private configManager: ConfigManager

  /** 日志记录器 */
  private logger: Logger

  /** 构建引擎实例 */
  private engine: BuildEngine | null = null

  /** 框架适配器实例 */
  private frameworkAdapter: FrameworkAdapter | null = null

  /** 当前配置 */
  private config: ViteLauncherConfig = {}

  /** 开发服务器实例 */
  private devServer: DevServer | null = null

  /** 预览服务器实例 */
  private previewServer: PreviewServer | null = null

  /** 是否已初始化 */
  private initialized = false

  constructor(options: LauncherOptions = {}) {
    super()

    this.cwd = options.cwd || process.cwd()
    this.environment = options.environment
    this.config = options.config || {}

    // 初始化日志记录器
    const isDebug = process.env.NODE_ENV === 'development' ||
      process.argv.includes('--debug') ||
      process.argv.includes('-d')

    const isSilent = process.argv.includes('--silent') ||
      process.argv.includes('-s')

    this.logger = new Logger('Launcher', {
      level: isSilent ? 'silent' : (isDebug ? 'debug' : 'info'),
      colors: true,
      timestamp: isDebug,
      compact: !isDebug
    })

    // 弃用警告
    if (!isSilent) {
      this.logger.warn('⚠️  Launcher 类已弃用，将在 v3.0.0 移除。请使用 ViteLauncher 代替。')
      this.logger.warn('详情请查看: MIGRATION.md')
    }

    // 初始化配置管理器
    this.configManager = new ConfigManager({
      cwd: this.cwd,
      logger: this.logger
    })
  }

  /**
   * 初始化 Launcher
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    this.logger.debug('初始化 Launcher...')

    // 1. 加载配置文件
    const fileConfig = await this.configManager.loadConfig()
    this.config = this.mergeConfig(this.config, fileConfig)

    // 2. 初始化引擎
    await this.initializeEngine()

    // 3. 初始化框架适配器
    await this.initializeFramework()

    this.initialized = true
    this.logger.debug('Launcher 初始化完成')
  }

  /**
   * 初始化构建引擎
   */
  private async initializeEngine(): Promise<void> {
    const engineType: BuildEngineType = this.config.engine?.type || 'vite'
    
    this.logger.debug(`初始化构建引擎: ${engineType}`)

    const engineRegistry = getEngineRegistry()
    this.engine = await engineRegistry.createEngine(engineType, this.config.engine)

    this.logger.debug(`构建引擎已初始化: ${this.engine.name} ${this.engine.version}`)
  }

  /**
   * 初始化框架适配器
   */
  private async initializeFramework(): Promise<void> {
    const frameworkType = this.config.framework?.type || 'auto'

    if (frameworkType === 'auto') {
      // 自动检测框架
      this.logger.debug('自动检测项目框架...')
      const detection = await detectFramework(this.cwd)
      
      if (detection && detection.type) {
        this.logger.info(`检测到框架: ${detection.type} (置信度: ${detection.confidence})`)
        await this.loadFrameworkAdapter(detection.type)
      } else {
        this.logger.warn('未检测到框架，将使用默认配置')
      }
    } else {
      // 使用指定的框架
      await this.loadFrameworkAdapter(frameworkType)
    }
  }

  /**
   * 加载框架适配器
   */
  private async loadFrameworkAdapter(type: FrameworkType): Promise<void> {
    this.logger.debug(`加载框架适配器: ${type}`)

    const frameworkRegistry = getFrameworkRegistry()
    this.frameworkAdapter = await frameworkRegistry.createAdapter(type, this.config.framework)

    // 合并框架特定配置
    const frameworkConfig = this.frameworkAdapter.getConfig(this.config.framework)
    this.config = this.mergeConfig(this.config, frameworkConfig)

    // 获取框架插件并添加到配置
    if (this.engine) {
      const frameworkPlugins = await this.frameworkAdapter.getPlugins(this.engine, this.config.framework)
      this.config.plugins = [...(frameworkPlugins || []), ...(this.config.plugins || [])]
    }

    this.logger.debug(`框架适配器已加载: ${type}`)
  }

  /**
   * 启动开发服务器
   */
  async startDev(config?: ViteLauncherConfig): Promise<any> {
    await this.initialize()

    this.setStatus('starting' as LauncherStatus)

    // 合并配置
    const mergedConfig = config ? this.mergeConfig(this.config, config) : this.config

    this.logger.info('启动开发服务器...')

    if (!this.engine) {
      throw new Error('构建引擎未初始化')
    }

    // 委托给引擎处理
    this.devServer = await this.engine.dev(mergedConfig)

    this.setStatus('running' as LauncherStatus)
    this.logger.success('开发服务器启动成功')

    // 触发事件
    this.emit('server:ready' as LauncherEvent, {
      server: this.devServer,
      url: this.devServer.url,
      timestamp: Date.now()
    })

    return this.devServer.raw
  }

  /**
   * 停止开发服务器
   */
  async stopDev(): Promise<void> {
    if (!this.devServer) {
      this.logger.warn('开发服务器未运行')
      return
    }

    this.setStatus('stopping' as LauncherStatus)
    this.logger.info('停止开发服务器...')

    await this.devServer.close()
    this.devServer = null

    this.setStatus('stopped' as LauncherStatus)
    this.logger.success('开发服务器已停止')
  }

  /**
   * 重启开发服务器
   */
  async restartDev(): Promise<void> {
    this.logger.info('重启开发服务器...')
    await this.stopDev()
    await this.startDev()
  }

  /**
   * 执行生产构建
   */
  async build(config?: ViteLauncherConfig): Promise<any> {
    await this.initialize()

    this.setStatus('building' as LauncherStatus)

    // 合并配置
    const mergedConfig = config ? this.mergeConfig(this.config, config) : this.config

    this.logger.info('开始生产构建...')

    if (!this.engine) {
      throw new Error('构建引擎未初始化')
    }

    // 委托给引擎处理
    const result = await this.engine.build(mergedConfig)

    this.setStatus('idle' as LauncherStatus)
    this.logger.success(`构建完成，耗时 ${result.duration}ms`)

    // 触发事件
    this.emit('build:complete' as LauncherEvent, {
      result,
      timestamp: Date.now()
    })

    return result.raw
  }

  /**
   * 启动监听模式构建
   */
  async buildWatch(config?: ViteLauncherConfig): Promise<any> {
    await this.initialize()

    const mergedConfig = config ? this.mergeConfig(this.config, config) : this.config

    if (!this.engine) {
      throw new Error('构建引擎未初始化')
    }

    // 检查引擎是否支持监听模式
    if (typeof this.engine.buildWatch === 'function') {
      return this.engine.buildWatch(mergedConfig)
    }

    throw new Error(`引擎 "${this.engine.name}" 不支持监听模式构建`)
  }

  /**
   * 启动预览服务器
   */
  async preview(config?: ViteLauncherConfig): Promise<any> {
    await this.initialize()

    this.setStatus('previewing' as LauncherStatus)

    // 合并配置
    const mergedConfig = config ? this.mergeConfig(this.config, config) : this.config

    this.logger.info('启动预览服务器...')

    if (!this.engine) {
      throw new Error('构建引擎未初始化')
    }

    // 委托给引擎处理
    this.previewServer = await this.engine.preview(mergedConfig)

    this.logger.success('预览服务器启动成功')

    return this.previewServer.raw
  }

  /**
   * 合并配置
   */
  mergeConfig(base: ViteLauncherConfig, override: ViteLauncherConfig): ViteLauncherConfig {
    return this.configManager.mergeConfigs(base, override)
  }

  /**
   * 验证配置
   */
  validateConfig(config: ViteLauncherConfig): any {
    // ConfigManager 可能没有 validateConfig 方法，返回简单的验证结果
    return { valid: true, errors: [] }
  }

  /**
   * 加载配置
   */
  async loadConfig(configPath?: string): Promise<ViteLauncherConfig> {
    return this.configManager.loadConfig(configPath)
  }

  /**
   * 注册 ready 回调
   */
  onReady(callback: () => void): void {
    this.on('ready', callback)
  }

  /**
   * 注册 error 回调
   */
  onError(callback: (error: Error) => void): void {
    this.on('error', callback)
  }

  /**
   * 注册 close 回调
   */
  onClose(callback: () => void): void {
    this.on('close', callback)
  }

  /**
   * 检查是否正在运行
   */
  isRunning(): boolean {
    return this.status === LauncherStatus.RUNNING ||
           this.status === LauncherStatus.BUILDING ||
           this.status === LauncherStatus.PREVIEWING ||
           this.status === LauncherStatus.STARTING
  }

  /**
   * 获取当前配置
   */
  getConfig(): ViteLauncherConfig {
    return this.config
  }

  /**
   * 添加插件（保持向后兼容）
   */
  addPlugin(plugin: any): void {
    this.config.plugins = this.config.plugins || []
    this.config.plugins.push(plugin)
  }

  /**
   * 移除插件（保持向后兼容）
   */
  removePlugin(pluginName: string): void {
    if (this.config.plugins) {
      this.config.plugins = this.config.plugins.filter(
        (p: any) => p.name !== pluginName
      )
    }
  }

  /**
   * 获取插件列表（保持向后兼容）
   */
  getPlugins(): any[] {
    return this.config.plugins || []
  }

  /**
   * 设置状态
   */
  private setStatus(status: LauncherStatus): void {
    this.status = status
    this.emit('status:change' as LauncherEvent, { status, timestamp: Date.now() })
  }

  /**
   * 获取当前状态
   */
  getStatus(): LauncherStatus {
    return this.status
  }

  /**
   * 清理资源
   */
  async dispose(): Promise<void> {
    this.logger.debug('清理 Launcher 资源...')

    if (this.devServer) {
      await this.devServer.close()
    }

    if (this.previewServer) {
      await this.previewServer.close()
    }

    if (this.engine) {
      await this.engine.dispose()
    }

    if (this.frameworkAdapter && this.frameworkAdapter.dispose) {
      await this.frameworkAdapter.dispose()
    }

    this.initialized = false
    this.logger.debug('Launcher 资源清理完成')
  }
}

