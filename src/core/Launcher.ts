/**
 * 引擎无关的 Launcher
 * 
 * 协调各个 Manager，提供统一的启动接口，支持多引擎（Vite/Rspack/Webpack/Turbopack）
 * 
 * @author LDesign Team
 * @since 2.0.0
 */

import { EventEmitter } from 'events'
import type { ViteLauncherConfig, LauncherConfigOptions } from '../types'
import type { 
  BuildEngine, 
  BuildEngineType, 
  DevServer, 
  PreviewServer, 
  EngineBuildResult 
} from '../types/engine'
import { Logger, type LogLevel } from '../utils/logger'
import { ConfigManager } from './ConfigManager'
import { PluginOrchestrator } from './PluginOrchestrator'
import { getEngineRegistry } from '../registry'
import { getServerUrl, resolveServerHost } from '../utils/server'
import { getPreferredLocalIP } from '../utils/network'
import qrcode from 'qrcode-terminal'

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
  private configManager: ConfigManager
  private pluginOrchestrator: PluginOrchestrator
  
  // 当前引擎实例
  private currentEngine: BuildEngine | null = null
  private currentDevServer: DevServer | null = null
  private currentPreviewServer: PreviewServer | null = null
  
  // 日志和配置
  private logger: Logger
  private cwd: string
  private options: LauncherOptions
  
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
      onConfigChange: options.onConfigChange
    })
    
    // 初始化 PluginOrchestrator
    this.pluginOrchestrator = new PluginOrchestrator({
      logger: this.logger,
      cwd: this.cwd
    })
    
    this.logger.debug('Launcher 初始化完成', {
      cwd: this.cwd,
      configFile: options.configFile
    })
  }
  
  /**
   * 启动开发服务器
   * 
   * 流程：
   * 1. 加载配置
   * 2. 检测框架并加载插件
   * 3. 确定引擎类型
   * 4. 创建引擎实例
   * 5. 启动开发服务器
   * 6. 打印服务器信息
   */
  async dev(): Promise<DevServer> {
    this.logger.info('🚀 启动开发服务器...')
    
    try {
      // 1. 加载配置
      let config = await this.configManager.loadConfig()
      
      // 合并内联配置
      if (this.options.inlineConfig) {
        config = this.mergeConfig(config, this.options.inlineConfig)
      }
      
      // 2. 检测框架并加载插件
      const explicitFramework = this.pluginOrchestrator.getExplicitFramework(config)
      config = await this.pluginOrchestrator.enhanceConfigWithPlugins(config, explicitFramework)
      
      // 3. 确定引擎类型
      const engineType = this.getEngineType(config)
      this.logger.debug(`使用构建引擎: ${engineType}`)
      
      // 4. 创建引擎实例
      const engine = await this.createEngine(engineType)
      this.currentEngine = engine
      
      // 5. 启动开发服务器
      const devServer = await engine.dev(config)
      this.currentDevServer = devServer
      
      // 6. 打印服务器信息
      this.printServerInfo(devServer, 'dev')
      
      // 发送启动成功事件
      this.emit('dev:started', devServer)
      
      return devServer
      
    } catch (error) {
      this.logger.error('启动开发服务器失败', error)
      this.emit('dev:error', error)
      throw error
    }
  }
  
  /**
   * 执行生产构建
   * 
   * 流程：
   * 1. 加载配置
   * 2. 检测框架并加载插件
   * 3. 确定引擎类型
   * 4. 创建引擎实例
   * 5. 执行构建
   */
  async build(): Promise<EngineBuildResult> {
    this.logger.info('🔨 开始生产构建...')
    
    try {
      // 1. 加载配置
      let config = await this.configManager.loadConfig()
      
      // 合并内联配置
      if (this.options.inlineConfig) {
        config = this.mergeConfig(config, this.options.inlineConfig)
      }
      
      // 2. 检测框架并加载插件
      const explicitFramework = this.pluginOrchestrator.getExplicitFramework(config)
      config = await this.pluginOrchestrator.enhanceConfigWithPlugins(config, explicitFramework)
      
      // 3. 确定引擎类型
      const engineType = this.getEngineType(config)
      this.logger.debug(`使用构建引擎: ${engineType}`)
      
      // 4. 创建引擎实例
      const engine = await this.createEngine(engineType)
      this.currentEngine = engine
      
      // 5. 执行构建
      const result = await engine.build(config)
      
      // 打印构建统计信息
      this.printBuildStats(result)
      
      // 发送构建成功事件
      this.emit('build:done', result)
      
      return result
      
    } catch (error) {
      this.logger.error('生产构建失败', error)
      this.emit('build:error', error)
      throw error
    }
  }
  
  /**
   * 启动预览服务器
   * 
   * 流程：
   * 1. 加载配置
   * 2. 确定引擎类型
   * 3. 创建引擎实例
   * 4. 启动预览服务器
   * 5. 打印服务器信息
   */
  async preview(): Promise<PreviewServer> {
    this.logger.info('🔍 启动预览服务器...')
    
    try {
      // 1. 加载配置
      let config = await this.configManager.loadConfig()
      
      // 合并内联配置
      if (this.options.inlineConfig) {
        config = this.mergeConfig(config, this.options.inlineConfig)
      }
      
      // 2. 确定引擎类型
      const engineType = this.getEngineType(config)
      this.logger.debug(`使用构建引擎: ${engineType}`)
      
      // 3. 创建引擎实例
      const engine = await this.createEngine(engineType)
      this.currentEngine = engine
      
      // 4. 启动预览服务器
      const previewServer = await engine.preview(config)
      this.currentPreviewServer = previewServer
      
      // 5. 打印服务器信息
      this.printServerInfo(previewServer, 'preview')
      
      // 发送启动成功事件
      this.emit('preview:started', previewServer)
      
      return previewServer
      
    } catch (error) {
      this.logger.error('启动预览服务器失败', error)
      this.emit('preview:error', error)
      throw error
    }
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
      
    } catch (error) {
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
   * 创建引擎实例
   */
  private async createEngine(type: BuildEngineType): Promise<BuildEngine> {
    const registry = getEngineRegistry()
    
    try {
      const engine = await registry.createEngine(type)
      await engine.initialize()
      return engine
    } catch (error) {
      this.logger.error(`创建引擎 "${type}" 失败`, error)
      throw error
    }
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
   * 合并配置
   */
  private mergeConfig(
    baseConfig: ViteLauncherConfig,
    inlineConfig: ViteLauncherConfig
  ): ViteLauncherConfig {
    // 简单合并，优先使用 inlineConfig
    return {
      ...baseConfig,
      ...inlineConfig,
      // 特殊处理嵌套对象
      launcher: {
        ...(baseConfig.launcher || {}),
        ...(inlineConfig.launcher || {})
      },
      engine: {
        ...(baseConfig.engine || {}),
        ...(inlineConfig.engine || {})
      },
      // 合并插件数组
      plugins: [
        ...(baseConfig.plugins || []),
        ...(inlineConfig.plugins || [])
      ]
    }
  }
  
  /**
   * 打印服务器信息
   */
  private printServerInfo(
    server: DevServer | PreviewServer,
    type: 'dev' | 'preview'
  ): void {
    const typeName = type === 'dev' ? '开发' : '预览'
    
    this.logger.info(`\n🚀 ${typeName}服务器已启动`)
    this.logger.info(`   引擎: ${server.type}`)
    this.logger.info(`   本地访问: ${server.url}`)
    
    // 获取局域网 IP
    const localIP = getPreferredLocalIP()
    if (localIP && localIP !== 'localhost' && localIP !== '127.0.0.1') {
      const protocol = server.https ? 'https' : 'http'
      const networkUrl = `${protocol}://${localIP}:${server.port}`
      this.logger.info(`   局域网访问: ${networkUrl}`)
      
      // 生成二维码（只在非 CI 环境）
      if (!process.env.CI) {
        this.logger.info('\n   扫描二维码访问:')
        try {
          qrcode.generate(networkUrl, { small: true }, (qr) => {
            // 将二维码每行缩进
            const lines = qr.split('\n')
            lines.forEach(line => {
              if (line.trim()) {
                this.logger.info(`   ${line}`)
              }
            })
          })
        } catch (error) {
          // 忽略二维码生成错误
        }
      }
    }
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
      const stats = result.stats
      this.logger.info(`   总文件数: ${stats.totalFiles}`)
      this.logger.info(`   总大小: ${this.formatBytes(stats.totalSize)}`)
      
      if (stats.jsSize > 0) {
        this.logger.info(`   JS 大小: ${this.formatBytes(stats.jsSize)}`)
      }
      if (stats.cssSize > 0) {
        this.logger.info(`   CSS 大小: ${this.formatBytes(stats.cssSize)}`)
      }
      if (stats.assetSize > 0) {
        this.logger.info(`   资源大小: ${this.formatBytes(stats.assetSize)}`)
      }
    }
    
    this.logger.success('\n✨ 构建成功!')
  }
  
  /**
   * 格式化字节数
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }
}
