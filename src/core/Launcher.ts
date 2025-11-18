/**
 * 引擎无关的 Launcher
 *
 * 协调各个 Manager，提供统一的启动接口，支持多引擎（Vite/Rspack/Webpack/Turbopack）
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type { ViteLauncherConfig } from '../types'
import type {
  BuildEngine,
  BuildEngineType,
  DevServer,
  EngineBuildResult,
  PreviewServer,
} from '../types/engine'
import type { LogLevel } from '../utils/logger'
import { EventEmitter } from 'node:events'
import { getEngineRegistry } from '../registry'
import { deepMerge } from '../utils/config-merger'
import { formatFileSize } from '../utils/format'
import { Logger } from '../utils/logger'
import { ConfigManager } from './ConfigManager'
import { PluginOrchestrator } from './PluginOrchestrator'
import { ServerManager } from './ServerManager'

/**
 * Launcher 配置选项
 */
export interface LauncherOptions {
  /** 配置文件路径 */
  configFile?: string

  /** 工作目录 */
  cwd?: string

  /** 日志级别 */
  logLevel?: string

  /** 是否启用调试模式 */
  debug?: boolean

  /** 运行模式 */
  mode?: string

  /** 是否监听配置文件变化 */
  watch?: boolean

  /** 配置变化回调 */
  onConfigChange?: (config: ViteLauncherConfig) => void

  /** 额外的内联配置（会与文件配置合并） */
  inlineConfig?: ViteLauncherConfig
}

/**
 * 引擎无关的 Launcher 类
 *
 * 职责：
 * - 协调 ConfigManager、PluginOrchestrator 和 EngineRegistry
 * - 提供统一的 dev、build、preview 接口
 * - 支持多引擎切换
 * - 打印服务器信息
 */
export class Launcher extends EventEmitter {
  // 核心 Manager
  private readonly configManager: ConfigManager
  private readonly pluginOrchestrator: PluginOrchestrator
  private readonly serverManager: ServerManager

  // 当前引擎实例
  private currentEngine: BuildEngine | null = null
  private currentDevServer: DevServer | null = null
  private currentPreviewServer: PreviewServer | null = null

  // 日志和配置
  private readonly logger: Logger
  private readonly cwd: string
  private readonly options: LauncherOptions

  constructor(options: LauncherOptions = {}) {
    super()

    this.options = options
    this.cwd = options.cwd || process.cwd()

    // 初始化日志
    this.logger = new Logger('Launcher')
    if (options.logLevel) {
      this.logger.setLevel(options.logLevel as LogLevel)
    }

    // 初始化 ConfigManager
    this.configManager = new ConfigManager({
      configFile: options.configFile,
      watch: options.watch,
      logger: this.logger,
      cwd: this.cwd,
      onConfigChange: options.onConfigChange,
    })

    // 初始化 PluginOrchestrator
    this.pluginOrchestrator = new PluginOrchestrator({
      logger: this.logger,
      cwd: this.cwd,
    })

    // 初始化 ServerManager
    this.serverManager = new ServerManager({
      logger: this.logger,
      cwd: this.cwd,
    })

    this.logger.debug('Launcher 初始化完成', {
      cwd: this.cwd,
      configFile: options.configFile,
    })
  }

  /**
   * 启动开发服务器
   */
  async dev(): Promise<DevServer> {
    return this.execute('dev', async (config, engine) => {
      const devServer = await engine.dev(config)
      this.currentDevServer = devServer
      this.serverManager.printServerInfo(devServer, 'dev')
      return devServer
    })
  }

  /**
   * 执行生产构建
   */
  async build(): Promise<EngineBuildResult> {
    return this.execute('build', async (config, engine) => {
      const result = await engine.build(config)
      this.printBuildStats(result)
      return result
    })
  }

  /**
   * 启动预览服务器
   */
  async preview(): Promise<PreviewServer> {
    return this.execute('preview', async (config, engine) => {
      const previewServer = await engine.preview(config)
      this.currentPreviewServer = previewServer
      this.serverManager.printServerInfo(previewServer, 'preview')
      return previewServer
    })
  }

  /**
   * 清理资源
   */
  async destroy(): Promise<void> {
    this.logger.info('清理 Launcher 资源...')

    try {
      // 关闭开发服务器
      if (this.currentDevServer) {
        await this.currentDevServer.close()
        this.currentDevServer = null
      }

      // 关闭预览服务器
      if (this.currentPreviewServer) {
        await this.currentPreviewServer.close()
        this.currentPreviewServer = null
      }

      // 清理引擎
      if (this.currentEngine) {
        await this.currentEngine.dispose()
        this.currentEngine = null
      }

      // 发送清理完成事件
      this.emit('destroyed')

      this.logger.success('资源清理完成')
    }
    catch (error) {
      this.logger.error('资源清理失败', error)
      throw error
    }
  }

  /**
   * 获取当前配置
   */
  async getConfig(): Promise<ViteLauncherConfig> {
    return this.configManager.loadConfig()
  }

  /**
   * 获取当前引擎
   */
  getCurrentEngine(): BuildEngine | null {
    return this.currentEngine
  }

  /**
   * 获取当前开发服务器
   */
  getCurrentDevServer(): DevServer | null {
    return this.currentDevServer
  }

  /**
   * 获取当前预览服务器
   */
  getCurrentPreviewServer(): PreviewServer | null {
    return this.currentPreviewServer
  }

  // ==================== 私有方法 ====================

  /**
   * 通用执行方法 - 消除重复代码
   */
  private async execute<T>(
    operation: 'dev' | 'build' | 'preview',
    handler: (config: ViteLauncherConfig, engine: BuildEngine) => Promise<T>,
  ): Promise<T> {
    const operationName = {
      dev: '🚀 启动开发服务器',
      build: '🔨 开始生产构建',
      preview: '🔍 启动预览服务器',
    }[operation]

    this.logger.info(`${operationName}...`)

    try {
      // 1. 准备配置
      const config = await this.prepareConfig()

      // 2. 创建引擎
      const engineType = this.getEngineType(config)
      this.logger.debug(`使用构建引擎: ${engineType}`)

      const engine = await this.createEngine(engineType)
      this.currentEngine = engine

      // 3. 执行操作
      const result = await handler(config, engine)

      // 4. 发送成功事件
      this.emit(`${operation}:started`, result)
      if (operation === 'build') {
        this.emit('build:done', result)
      }

      return result
    }
    catch (error) {
      this.logger.error(`${operationName}失败`, error)
      this.emit(`${operation}:error`, error)
      throw error
    }
  }

  /**
   * 准备配置 - 加载、合并、增强
   */
  private async prepareConfig(): Promise<ViteLauncherConfig> {
    // 加载配置
    let config = await this.configManager.loadConfig()

    // 合并内联配置
    if (this.options.inlineConfig) {
      config = deepMerge(config, this.options.inlineConfig) as ViteLauncherConfig
    }

    // 检测框架并加载插件
    const explicitFramework = this.pluginOrchestrator.getExplicitFramework(config)
    config = await this.pluginOrchestrator.enhanceConfigWithPlugins(config, explicitFramework)

    return config
  }

  /**
   * 创建引擎实例
   */
  private async createEngine(type: BuildEngineType): Promise<BuildEngine> {
    const registry = getEngineRegistry()
    const engine = await registry.createEngine(type)
    await engine.initialize()
    return engine
  }

  /**
   * 确定引擎类型
   */
  private getEngineType(config: ViteLauncherConfig): BuildEngineType {
    // 1. 优先使用 launcher.engine 配置
    const launcherEngine = (config as any).launcher?.engine
    if (launcherEngine) {
      return launcherEngine as BuildEngineType
    }

    // 2. 使用 engine.type 配置
    const engineType = (config as any).engine?.type
    if (engineType) {
      return engineType as BuildEngineType
    }

    // 3. 默认使用 vite
    return 'vite'
  }

  /**
   * 打印构建统计信息
   */
  private printBuildStats(result: EngineBuildResult): void {
    this.logger.info('\n📊 构建统计:')
    this.logger.info(`   引擎: ${result.type}`)
    this.logger.info(`   输出目录: ${result.outDir}`)
    this.logger.info(`   构建耗时: ${result.duration}ms`)

    if (result.stats) {
      const { totalFiles, totalSize, jsSize, cssSize, assetSize } = result.stats
      this.logger.info(`   总文件数: ${totalFiles}`)
      this.logger.info(`   总大小: ${formatFileSize(totalSize)}`)

      if (jsSize > 0)
        this.logger.info(`   JS 大小: ${formatFileSize(jsSize)}`)
      if (cssSize > 0)
        this.logger.info(`   CSS 大小: ${formatFileSize(cssSize)}`)
      if (assetSize > 0)
        this.logger.info(`   资源大小: ${formatFileSize(assetSize)}`)
    }

    this.logger.success('\n✨ 构建成功!')
  }
}
