/**
 * ViteLauncher 核心类
 * 
 * 封装 Vite JavaScript API，提供统一的开发服务器、构建和预览功能
 * 
 * @author LDesign Team
 * @since 1.0.0
 */

import { EventEmitter } from 'events'
import path from 'path'
import type {
  ViteDevServer,
  PreviewServer,
  Plugin
} from 'vite'

import type { RollupOutput, RollupWatcher } from 'rollup'

// 导入内部工具
import { Logger } from '../utils/logger'
import { ErrorHandler } from '../utils/error-handler'
import { FileSystem } from '../utils/file-system'
import { PathUtils } from '../utils/path-utils'
import { ConfigManager } from './ConfigManager'
import { SmartPluginManager } from './SmartPluginManager'
import { createConfigInjectionPlugin, getClientConfigUtils } from '../plugins/config-injection'
import { environmentManager } from '../utils/env'
import { createSSLManager, type SSLConfig } from '../utils/ssl'
import { AliasManager } from './AliasManager'
import { getPreferredLocalIP } from '../utils/network.js'

// 导入类型定义
import type {
  IViteLauncher,
  ViteLauncherConfig,
  LauncherHooks,
  LauncherEventData,
  LauncherOptions,
  LauncherStats,
  PerformanceMetrics,
  ServerInfo
} from '../types'
import { LauncherStatus, LauncherEvent, ServerType } from '../types'

// 导入常量
import {
  DEFAULT_VITE_LAUNCHER_CONFIG,
  DEFAULT_PORT,
  DEFAULT_HOST,
  DEFAULT_LOG_LEVEL
} from '../constants'

/**
 * ViteLauncher 核心类
 * 
 * 提供完整的 Vite 项目启动、构建和预览功能
 * 支持插件系统、配置管理、生命周期钩子等高级特性
 */
export class ViteLauncher extends EventEmitter implements IViteLauncher {
  /** 当前状态 */
  private status: LauncherStatus = LauncherStatus.IDLE

  /** 当前配置 */
  private config: ViteLauncherConfig

  /** 开发服务器实例 */
  private devServer: ViteDevServer | null = null

  /** 预览服务器实例 */
  private previewServer: PreviewServer | null = null

  /** 构建监听器实例 */
  private buildWatcher: RollupWatcher | null = null

  /** 日志记录器 */
  private logger: Logger

  /** 错误处理器 */
  private errorHandler: ErrorHandler

  /** 配置管理器 */
  private configManager: ConfigManager

  /** 插件列表 */
  private plugins: Plugin[] = []

  /** 统计信息 */
  private stats: LauncherStats = {
    startCount: 0,
    buildCount: 0,
    errorCount: 0,
    totalRuntime: 0,
    averageStartTime: 0,
    averageBuildTime: 0,
    lastActivity: Date.now()
  }

  /** 性能监控数据 */
  private performanceMetrics: PerformanceMetrics = {
    memory: { used: 0, total: 0, percentage: 0 },
    cpu: { usage: 0, loadAverage: [] },
    startupTime: 0,
    buildTime: 0,
    hmrTime: 0,
    fileChangeResponseTime: 0
  }

  /** 启动时间 */
  private startTime: number = 0

  /** 工作目录 */
  private cwd: string

  /** 环境名称 */
  private environment?: string

  /** 智能插件管理器 */
  private smartPluginManager: SmartPluginManager

  /** 初始化状态 */
  private initialized: boolean = false



  /**
   * 构造函数
   * 
   * @param options - 启动器选项
   */
  constructor(options: LauncherOptions = {}) {
    super()

    // 设置工作目录
    this.cwd = options.cwd || process.cwd()

    // 设置环境名称
    this.environment = options.environment

    // 初始化配置
    this.config = this.mergeConfig(DEFAULT_VITE_LAUNCHER_CONFIG, options.config || {})

    // 初始化日志记录器
    const isDebug = process.env.NODE_ENV === 'development' ||
      process.argv.includes('--debug') ||
      process.argv.includes('-d')

    const isSilent = process.argv.includes('--silent') ||
      process.argv.includes('-s')

    this.logger = new Logger('ViteLauncher', {
      level: isSilent ? 'silent' : (this.config.launcher?.logLevel || DEFAULT_LOG_LEVEL),
      colors: true,
      timestamp: isDebug, // 只在 debug 模式显示时间戳
      compact: !isDebug   // 非 debug 模式使用简洁输出
    })

    // 初始化错误处理器
    this.errorHandler = new ErrorHandler({
      logger: this.logger,
      exitOnError: false
    })

    // 初始化配置管理器
    const configLogger = new Logger('ConfigManager', {
      level: isSilent ? 'silent' : this.logger.getLevel(),
      colors: true,
      timestamp: isDebug,
      compact: !isDebug
    })
    // 确定配置文件路径
    const configFile = this.config.launcher?.configFile ||
      PathUtils.resolve(this.cwd, '.ldesign', `launcher.${this.environment}.config.ts`)

    // 只在dev模式下启用文件监听，build和preview模式不需要监听
    const shouldWatch = (this.config.launcher?.autoRestart || false) &&
      (this.environment === 'development' ||
        (process.env.NODE_ENV === 'development' && this.environment !== 'production'))

    this.configManager = new ConfigManager({
      configFile,
      watch: shouldWatch,
      logger: configLogger,
      onConfigChange: (newConfig) => {
        // 延迟重启，确保配置文件写入完成
        setTimeout(() => {
          this.restartDevWithConfig(newConfig).catch(error => {
            this.logger.error('自动重启失败', error)
          })
        }, 200)
      }
    })

    // 只在debug模式下输出调试信息
    if (isDebug) {
      this.logger.debug('ConfigManager 初始化完成')
    }

    // 初始化智能插件管理器
    const smartLogger = new Logger('SmartPluginManager', {
      level: isSilent ? 'silent' : this.logger.getLevel(),
      colors: true,
      timestamp: isDebug,
      compact: !isDebug
    })
    this.smartPluginManager = new SmartPluginManager(this.cwd, smartLogger)



    // 设置事件监听器
    this.setupEventListeners(options.listeners)

    // 默认监听 error 事件，避免未监听时抛出异常
    // 注意：不要在此处再次调用 handleError，否则会与 handleError 内部的 emit('error') 形成递归
    this.on('error', (err: unknown) => {
      try {
        // 如果是内部 emit 传递的事件负载
        if (err && typeof err === 'object' && 'error' in err) {
          const errorPayload = err as { error: unknown; context?: string }
          const e = errorPayload.error
          const ctx = errorPayload.context || '运行时错误'
          const real = e instanceof Error ? e : new Error(String(e))
          this.logger.error(ctx, { error: real.message, stack: real.stack })
          return
        }
        // 其他未知来源错误：仅记录，避免递归
        const real = err instanceof Error ? err : new Error(String(err))
        this.logger.error('运行时错误', { error: real.message, stack: real.stack })
      } catch { }
    })

    // 设置错误处理
    this.setupErrorHandling()

    this.logger.debug('ViteLauncher 基础初始化完成')
  }

  /**
   * 异步初始化方法
   * 加载配置文件并完成完整初始化
   */
  async initialize(): Promise<void> {
    // 避免重复初始化
    if (this.initialized) {
      return
    }

    try {
      // 优先使用显式指定的配置文件，其次自动查找
      const specified = this.config.launcher?.configFile

      // 只在debug模式下输出详细信息
      if (this.logger.getLevel() === 'debug') {
        this.logger.debug('ViteLauncher.initialize 开始', {
          cwd: this.cwd,
          environment: this.environment,
          configFile: specified || '无'
        })
      }

      if (specified) {
        if (this.logger.getLevel() === 'debug') {
          this.logger.debug(`使用指定配置文件: ${specified}`)
        }
        // 加载并合并用户配置到当前配置（修复：之前未合并导致用户 plugins 等失效）
        const loaded = await this.configManager.loadConfig(specified)
        if (loaded && typeof loaded === 'object') {
          this.config = this.mergeConfig(this.config, loaded)
        }
      } else {
        if (this.logger.getLevel() === 'debug') {
          this.logger.debug(`使用自动配置加载`)
        }
        try {
          // autoLoadConfig 内部已合并到 this.config
          await this.autoLoadConfig()
        } catch (autoLoadError) {
          this.logger.error('自动配置加载失败', { error: (autoLoadError as Error).message })
          throw autoLoadError
        }
      }

      this.initialized = true
      if (this.logger.getLevel() === 'debug') {
        this.logger.debug('ViteLauncher 初始化完成')
      }
    } catch (error) {
      this.logger.error('配置文件加载失败，使用默认配置', { error: (error as Error).message })
    }
  }

  /**
   * 启动开发服务器
   * 
   * @param config - 可选的配置覆盖
   * @returns 开发服务器实例
   */
  async startDev(config?: ViteLauncherConfig): Promise<ViteDevServer> {
    try {
      // 确保已初始化（加载配置文件）
      await this.initialize()

      this.setStatus(LauncherStatus.STARTING)
      this.startTime = Date.now()

      // 合并配置
      let mergedConfig = config ? this.mergeConfig(this.config, config) : this.config

      // 应用别名配置（dev 阶段）
      mergedConfig = this.applyAliasConfig(mergedConfig, 'dev')

      // 添加智能检测的插件
      mergedConfig = await this.enhanceConfigWithSmartPlugins(mergedConfig)

      // 处理HTTPS配置
      mergedConfig = await this.processHTTPSConfig(mergedConfig)

      // 执行启动前钩子
      await this.executeHook('beforeStart')

      // 打印最终的Vite配置用于调试
      if (this.logger.getLevel() === 'debug') {
        this.displayFinalConfig(mergedConfig)

        // 只在debug模式下输出详细的watch配置信息
        this.logger.debug(`server.watch配置:`, {
          ignoredType: typeof mergedConfig.server?.watch?.ignored,
          usePolling: mergedConfig.server?.watch?.usePolling,
          interval: mergedConfig.server?.watch?.interval
        })
      }

      // 动态导入 Vite（优先从项目 cwd 解析）
      // 激活警告抑制器以避免 Vite CJS API 警告
      const { getGlobalSuppressor } = await import('../utils/warning-suppressor')
      const suppressor = getGlobalSuppressor()
      suppressor.activate()

      const { importViteFromCwd } = await import('../utils/vite-resolver')
      const viteMod = await importViteFromCwd(this.cwd)
      const { createServer } = viteMod

      // 注入配置信息插件
      const currentEnvironment = this.environment || process.env.NODE_ENV || 'development'

      // 注入 app.config 插件
      const { createAppConfigPlugin } = await import('../plugins/app-config')
      const appCfgPlugin = createAppConfigPlugin({
        cwd: this.cwd,
        environment: currentEnvironment
      })

      const configInjectionPlugin = createConfigInjectionPlugin({
        config: mergedConfig,
        environment: currentEnvironment,
        verbose: mergedConfig.launcher?.debug || false
      })

      mergedConfig.plugins = [appCfgPlugin, configInjectionPlugin, ...(mergedConfig.plugins || [])]

      // 创建开发服务器
      this.devServer = await createServer(mergedConfig)

      // 启动服务器
      await this.devServer!.listen()

      // 在服务端打印 appConfig 载入信息（调试）
      try {
        await import('../plugins/app-config')
        this.logger.debug('app-config 插件已注入')
      } catch { }

      // 更新统计信息
      this.updateStats('start')

      // 设置状态
      this.setStatus(LauncherStatus.RUNNING)

      // 执行启动后钩子
      await this.executeHook('afterStart')

      // 触发服务器就绪事件
      this.emit(LauncherEvent.SERVER_READY, {
        server: this.devServer,
        url: this.devServer ? this.getServerUrl(this.devServer) : '',
        timestamp: Date.now()
      } as LauncherEventData[LauncherEvent.SERVER_READY])

      // 简化启动成功日志，避免重复输出（compact 模式下不输出）
      if (!process.env.LAUNCHER_RESTART_MODE && this.logger.getLevel() === 'debug') {
        this.logger.debug('开发服务器启动成功')
      }

      return this.devServer as ViteDevServer

    } catch (error) {
      this.handleError(error as Error, '开发服务器启动失败')
      throw error
    }
  }

  /**
   * 停止开发服务器
   */
  async stopDev(): Promise<void> {
    try {
      if (!this.devServer) {
        this.logger.warn('开发服务器未运行')
        return
      }

      this.setStatus(LauncherStatus.STOPPING)

      if (this.logger.getLevel() === 'debug') {
        this.logger.debug('正在停止开发服务器...')
      }

      // 执行关闭前钩子
      await this.executeHook('beforeClose')

      // 关闭服务器
      await this.devServer.close()
      this.devServer = null

      // 设置状态
      this.setStatus(LauncherStatus.STOPPED)

      // 执行关闭后钩子
      await this.executeHook('afterClose')

      if (this.logger.getLevel() === 'debug') {
        this.logger.debug('开发服务器已停止')
      }

    } catch (error) {
      this.handleError(error as Error, '停止开发服务器失败')
      throw error
    }
  }

  /**
   * 重启开发服务器
   */
  async restartDev(): Promise<void> {
    try {
      this.logger.info('正在重启开发服务器...')

      // 保存当前配置
      const currentConfig = { ...this.config }

      // 停止服务器
      await this.stopDev()

      // 重新启动
      await this.startDev(currentConfig)

      this.logger.success('开发服务器重启完成')

    } catch (error) {
      this.handleError(error as Error, '重启开发服务器失败')
      throw error
    }
  }

  /**
   * 使用新配置重启开发服务器
   */
  async restartDevWithConfig(newConfig: ViteLauncherConfig): Promise<void> {
    try {
      // 完全使用新配置，而不是合并
      this.config = newConfig

      // 停止服务器
      await this.stopDev()

      // 设置重启模式标识，避免重复输出启动日志
      process.env.LAUNCHER_RESTART_MODE = 'true'

      try {
        // 使用新配置重新启动
        await this.startDev(newConfig)

        // 输出简化的重启成功信息
        this.printSimpleServerInfo()
      } finally {
        // 清除重启模式标识
        delete process.env.LAUNCHER_RESTART_MODE
      }

    } catch (error) {
      // 确保清除重启模式标识
      delete process.env.LAUNCHER_RESTART_MODE
      this.handleError(error as Error, '配置重启失败')
      throw error
    }
  }

  /**
   * 执行生产构建
   * 
   * @param config - 可选的配置覆盖
   * @returns 构建结果
   */
  async build(config?: ViteLauncherConfig): Promise<RollupOutput> {
    try {
      // 确保已初始化（加载配置文件）
      await this.initialize()

      this.setStatus(LauncherStatus.BUILDING)
      const buildStartTime = Date.now()

      // 合并配置
      let mergedConfig = config ? this.mergeConfig(this.config, config) : this.config

      // 应用别名配置（build 阶段）
      mergedConfig = this.applyAliasConfig(mergedConfig, 'build')

      // 添加智能检测的插件
      mergedConfig = await this.enhanceConfigWithSmartPlugins(mergedConfig)

      // 执行构建前钩子
      await this.executeHook('beforeBuild')

      // 调试：输出最终插件列表
      try {
        const names = (mergedConfig.plugins || [])
          .map((p: unknown) => (p && typeof p === 'object' && 'name' in p) ? (p as { name: string }).name : String(p))
        // 只在 debug 模式显示
        if (this.logger.getLevel() === 'debug') {
          this.logger.debug('已加载插件', { count: names.length, plugins: names })
        }
      } catch { }

      if (this.logger.getLevel() === 'debug') {
        this.logger.debug('正在执行生产构建...')
      }

      // 激活警告抑制器
      const { getGlobalSuppressor } = await import('../utils/warning-suppressor')
      const suppressor = getGlobalSuppressor()
      suppressor.activate()

      // 触发构建开始事件
      this.emit(LauncherEvent.BUILD_START, {
        config: mergedConfig,
        timestamp: Date.now()
      } as LauncherEventData[LauncherEvent.BUILD_START])

      // 动态导入 Vite（优先从项目 cwd 解析）
      const { importViteFromCwd } = await import('../utils/vite-resolver')
      const viteMod = await importViteFromCwd(this.cwd)
      const { build } = viteMod

      // 注入 app.config 插件
      const currentEnvironment = this.environment || process.env.NODE_ENV || 'production'
      const { createAppConfigPlugin } = await import('../plugins/app-config')
      const appCfgPlugin = createAppConfigPlugin({
        cwd: this.cwd,
        environment: currentEnvironment
      })
      mergedConfig.plugins = [appCfgPlugin, ...(mergedConfig.plugins || [])]

      // 执行构建
      const result = await build(mergedConfig) as RollupOutput

      // 更新统计信息
      this.updateStats('build', Date.now() - buildStartTime)

      // 输出 appConfig 大小（调试）
      try {
        const { DEFAULT_APP_CONFIG_FILES } = await import('../constants')
        const possible = DEFAULT_APP_CONFIG_FILES.map(p => PathUtils.resolve(this.cwd, p))
        const exist = await Promise.all(possible.map(p => FileSystem.exists(p)))
        const found = possible.find((p, i) => exist[i])
        if (found) this.logger.debug('使用的 app.config', { path: found })
      } catch { }

      // 设置状态
      this.setStatus(LauncherStatus.IDLE)

      // 执行构建后钩子
      await this.executeHook('afterBuild')

      // 触发构建完成事件
      this.emit(LauncherEvent.BUILD_END, {
        result,
        duration: Date.now() - buildStartTime,
        timestamp: Date.now()
      } as LauncherEventData[LauncherEvent.BUILD_END])

      this.logger.success('生产构建完成')

      return result

    } catch (error) {
      this.handleError(error as Error, '生产构建失败')
      throw error
    }
  }

  /**
   * 启动监听模式构建
   * 
   * @param config - 可选的配置覆盖
   * @returns 构建监听器
   */
  async buildWatch(config?: ViteLauncherConfig): Promise<RollupWatcher> {
    try {
      // 合并配置，启用监听模式
      const mergedConfig = config ? this.mergeConfig(this.config, config) : this.config
      if (mergedConfig.build) {
        mergedConfig.build.watch = {}
      }

      this.logger.info('正在启动监听模式构建...')

      // 动态导入 Vite
      const { build } = await import('vite')

      // 执行监听构建
      this.buildWatcher = await build(mergedConfig) as RollupWatcher

      this.logger.success('监听模式构建已启动')

      return this.buildWatcher

    } catch (error) {
      this.handleError(error as Error, '启动监听模式构建失败')
      throw error
    }
  }

  /**
   * 启动预览服务器
   *
   * @param config - 可选的配置覆盖
   * @returns 预览服务器实例
   */
  async preview(config?: ViteLauncherConfig): Promise<PreviewServer> {
    try {
      // 确保已初始化（加载配置文件）
      await this.initialize()

      this.setStatus(LauncherStatus.PREVIEWING)

      // 合并配置
      let mergedConfig = config ? this.mergeConfig(this.config, config) : this.config

      // 应用别名配置（preview 阶段）
      mergedConfig = this.applyAliasConfig(mergedConfig, 'preview')

      // 处理HTTPS配置
      mergedConfig = await this.processHTTPSConfig(mergedConfig)

      // 执行预览前钩子
      await this.executeHook('beforePreview')

      this.logger.info('正在启动预览服务器...')

      // 动态导入 Vite（优先从项目 cwd 解析）
      const { importViteFromCwd } = await import('../utils/vite-resolver')
      const viteMod = await importViteFromCwd(this.cwd)
      const { preview } = viteMod

      // 注入 app.config 插件
      const currentEnvironment = this.environment || process.env.NODE_ENV || 'production'
      const { createAppConfigPlugin } = await import('../plugins/app-config')
      const appCfgPlugin = createAppConfigPlugin({
        cwd: this.cwd,
        environment: currentEnvironment
      })
      mergedConfig.plugins = [appCfgPlugin, ...(mergedConfig.plugins || [])]

      // 创建预览服务器
      this.previewServer = await preview(mergedConfig)

      // 执行预览后钩子
      await this.executeHook('afterPreview')

      // 调试输出 app-config 注入
      this.logger.debug('app-config 插件在 preview 中已注入')

      // 触发服务器就绪事件
      this.emit(LauncherEvent.SERVER_READY, {
        server: this.previewServer,
        url: this.previewServer ? this.getServerUrl(this.previewServer) : '',
        timestamp: Date.now()
      } as LauncherEventData[LauncherEvent.SERVER_READY])

      this.logger.success('预览服务器启动成功')

      // 输出服务器信息和二维码（类似dev方法）
      this.printPreviewServerInfo()

      return this.previewServer as PreviewServer

    } catch (error) {
      this.handleError(error as Error, '预览服务器启动失败')
      throw error
    }
  }

  /**
   * 合并配置
   *
   * @param base - 基础配置
   * @param override - 覆盖配置
   * @returns 合并后的配置
   */
  mergeConfig(base: ViteLauncherConfig, override: ViteLauncherConfig): ViteLauncherConfig {
    // 检查参数有效性
    if (!base) base = {}
    if (!override) return base

    // 简单的深度合并实现
    const deepMerge = (target: ViteLauncherConfig, source: Partial<ViteLauncherConfig>): ViteLauncherConfig => {
      if (!target) target = {}
      if (!source) return target

      const result = { ...target }

      for (const key in source) {
        const sourceValue = source[key]
        const targetValue = target[key]

        if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
          // 对象类型，递归合并
          result[key] = deepMerge(
            (targetValue || {}) as ViteLauncherConfig,
            sourceValue as Partial<ViteLauncherConfig>
          ) as ViteLauncherConfig[Extract<keyof ViteLauncherConfig, string>]
        } else if (Array.isArray(sourceValue)) {
          // 数组类型，特殊处理
          if (key === 'alias' && Array.isArray(targetValue)) {
            // 对于 resolve.alias，合并数组而不是覆盖
            result[key] = [...(targetValue || []), ...sourceValue] as ViteLauncherConfig[Extract<keyof ViteLauncherConfig, string>]
          } else {
            // 其他数组直接覆盖
            result[key] = sourceValue as ViteLauncherConfig[Extract<keyof ViteLauncherConfig, string>]
          }
        } else {
          // 基本类型，直接覆盖
          result[key] = sourceValue as ViteLauncherConfig[Extract<keyof ViteLauncherConfig, string>]
        }
      }

      return result
    }

    return deepMerge(base, override)
  }

  /**
   * 验证配置
   *
   * @param config - 要验证的配置
   * @returns 验证结果
   */
  validateConfig(config: ViteLauncherConfig): import('../types').ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // 验证基本配置
      if (config.server?.port && (config.server.port < 1 || config.server.port > 65535)) {
        errors.push('服务器端口号必须在 1-65535 范围内')
      }

      if (config.preview?.port && (config.preview.port < 1 || config.preview.port > 65535)) {
        errors.push('预览服务器端口号必须在 1-65535 范围内')
      }

      // 验证构建配置
      if (config.build?.outDir && !PathUtils.isAbsolute(config.build.outDir)) {
        // 相对路径是允许的，但给出警告
        warnings.push('建议使用绝对路径作为输出目录')
      }

      // 验证 launcher 特有配置
      if (config.launcher?.logLevel && !['silent', 'error', 'warn', 'info', 'debug'].includes(config.launcher.logLevel)) {
        errors.push('日志级别必须是 silent、error、warn、info 或 debug 之一')
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      }

    } catch (error) {
      return {
        valid: false,
        errors: [`配置验证过程中发生错误: ${(error as Error).message}`],
        warnings
      }
    }
  }

  /**
   * 加载配置文件
   *
   * @param configPath - 配置文件路径
   * @returns 加载的配置
   */
  async loadConfig(configPath?: string): Promise<ViteLauncherConfig> {
    try {
      if (configPath) {
        // 加载指定的配置文件
        const configExists = await FileSystem.exists(configPath)
        if (!configExists) {
          throw new Error(`配置文件不存在: ${configPath}`)
        }

        this.logger.info('正在加载配置文件', { path: configPath })

        // 使用配置管理器加载
        const loadedConfig = await this.configManager.loadConfig(configPath)

        // 合并到当前配置
        this.config = this.mergeConfig(this.config, loadedConfig)

        // 验证配置
        const validation = this.validateConfig(this.config)
        if (!validation.valid) {
          this.logger.warn('配置验证失败', { errors: validation.errors })
        }

        if (validation.warnings.length > 0) {
          this.logger.warn('配置警告', { warnings: validation.warnings })
        }

        // 只在 debug 模式显示
        if (this.logger.getLevel() === 'debug') {
          this.logger.debug('配置文件加载成功')
        }

        return this.config
      } else {
        // 自动查找配置文件
        return await this.autoLoadConfig()
      }

    } catch (error) {
      this.handleError(error as Error, '加载配置文件失败')
      throw error
    }
  }

  /**
   * 添加插件
   *
   * @param plugin - 要添加的插件
   */
  addPlugin(plugin: Plugin): void {
    try {
      // 检查插件是否已存在
      const existingIndex = this.plugins.findIndex(p => p.name === plugin.name)

      if (existingIndex >= 0) {
        this.logger.warn('插件已存在，将被替换', { name: plugin.name })
        this.plugins[existingIndex] = plugin
      } else {
        this.plugins.push(plugin)
        this.logger.info('插件已添加', { name: plugin.name })
      }

      // 更新配置中的插件列表
      if (!this.config.plugins) {
        this.config.plugins = []
      }

      // 确保插件在配置中
      const configPluginIndex = this.config.plugins.findIndex(p =>
        p && typeof p === 'object' && 'name' in p && p.name === plugin.name
      )
      if (configPluginIndex >= 0) {
        this.config.plugins[configPluginIndex] = plugin
      } else {
        this.config.plugins.push(plugin)
      }

    } catch (error) {
      this.handleError(error as Error, '添加插件失败')
    }
  }

  /**
   * 移除插件
   *
   * @param pluginName - 要移除的插件名称
   */
  removePlugin(pluginName: string): void {
    try {
      const index = this.plugins.findIndex(p => p.name === pluginName)

      if (index >= 0) {
        this.plugins.splice(index, 1)
        this.logger.info('插件已移除', { name: pluginName })

        // 从配置中移除
        if (this.config.plugins) {
          const configIndex = this.config.plugins.findIndex(p =>
            p && typeof p === 'object' && 'name' in p && p.name === pluginName
          )
          if (configIndex >= 0) {
            this.config.plugins.splice(configIndex, 1)
          }
        }
      } else {
        this.logger.warn('插件不存在', { name: pluginName })
      }

    } catch (error) {
      this.handleError(error as Error, '移除插件失败')
    }
  }

  /**
   * 获取插件列表
   *
   * @returns 插件列表
   */
  getPlugins(): Plugin[] {
    return [...this.plugins]
  }

  /**
   * 注册生命周期钩子 - 就绪回调
   *
   * @param callback - 回调函数
   */
  onReady(callback: () => void): void {
    this.on(LauncherEvent.SERVER_READY, callback)
  }

  /**
   * 注册生命周期钩子 - 错误回调
   *
   * @param callback - 错误处理回调
   */
  onError(callback: (error: Error) => void): void {
    this.on('error', callback)
  }

  /**
   * 注册生命周期钩子 - 关闭回调
   *
   * @param callback - 关闭回调
   */
  onClose(callback: () => void): void {
    this.on('close', callback)
  }

  /**
   * 获取当前状态
   *
   * @returns 当前状态
   */
  getStatus(): LauncherStatus {
    return this.status
  }

  /**
   * 检查是否正在运行
   *
   * @returns 是否正在运行
   */
  isRunning(): boolean {
    return this.status === LauncherStatus.RUNNING ||
      this.status === LauncherStatus.BUILDING ||
      this.status === LauncherStatus.PREVIEWING
  }

  /**
   * 获取当前配置
   *
   * @returns 当前配置
   */
  getConfig(): ViteLauncherConfig {
    return { ...this.config }
  }

  /**
   * 获取统计信息
   *
   * @returns 统计信息
   */
  getStats(): LauncherStats {
    return { ...this.stats }
  }

  /**
   * 获取性能指标
   *
   * @returns 性能指标
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  /**
   * 获取服务器信息
   *
   * @returns 服务器信息
   */
  getServerInfo(): ServerInfo | null {
    if (!this.devServer) {
      return null
    }

    // 正确处理 host 配置
    const getResolvedHost = (hostConfig: string | boolean | undefined): string => {
      if (typeof hostConfig === 'string') {
        return hostConfig
      } else if (hostConfig === true) {
        return '0.0.0.0'
      } else {
        return DEFAULT_HOST
      }
    }

    const resolvedHost = getResolvedHost(this.config.server?.host)

    return {
      type: ServerType.DEV,
      status: this.status as unknown as import('../types').ServerStatus,
      instance: this.devServer,
      config: {
        type: ServerType.DEV,
        host: resolvedHost,
        port: this.config.server?.port || DEFAULT_PORT,
        https: typeof this.config.server?.https === 'boolean' ? this.config.server.https : false
      },
      url: this.getServerUrl(this.devServer),
      host: resolvedHost,
      port: this.config.server?.port || DEFAULT_PORT,
      https: typeof this.config.server?.https === 'boolean' ? this.config.server.https : false,
      startTime: this.startTime
    }
  }

  /**
   * 设置状态
   *
   * @param newStatus - 新状态
   */
  private setStatus(newStatus: LauncherStatus): void {
    const oldStatus = this.status
    this.status = newStatus

    // 更新最后活动时间
    this.stats.lastActivity = Date.now()

    // 触发状态变更事件
    this.emit(LauncherEvent.STATUS_CHANGE, {
      from: oldStatus,
      to: newStatus,
      timestamp: Date.now()
    } as LauncherEventData[LauncherEvent.STATUS_CHANGE])

    this.logger.debug('状态变更', { from: oldStatus, to: newStatus })
  }

  /**
   * 执行生命周期钩子
   *
   * @param hookName - 钩子名称
   */
  private async executeHook(hookName: keyof LauncherHooks): Promise<void> {
    try {
      const hook = this.config.launcher?.hooks?.[hookName]
      if (hook && typeof hook === 'function') {
        await Promise.resolve((hook as () => void | Promise<void>)())
        this.logger.debug('生命周期钩子执行完成', { hook: hookName })
      }
    } catch (error) {
      this.logger.error('生命周期钩子执行失败', {
        hook: hookName,
        error: (error as Error).message
      })
      // 钩子执行失败不应该阻止主流程
    }
  }

  /**
   * 处理错误
   *
   * @param error - 错误对象
   * @param context - 错误上下文
   */
  private handleError(error: Error, context: string): void {
    // 更新错误统计
    this.stats.errorCount++

    // 设置错误状态
    this.setStatus(LauncherStatus.ERROR)

    // 记录错误日志
    this.logger.error(context + ': ' + error.message)

    // 使用错误处理器处理
    this.errorHandler.handle(error, { operation: context })

    // 触发错误事件
    this.emit(LauncherEvent.ERROR, {
      error,
      context,
      timestamp: Date.now()
    } as LauncherEventData[LauncherEvent.ERROR])

    // 执行错误钩子
    this.executeHook('onError')
  }

  /**
   * 更新统计信息
   *
   * @param operation - 操作类型
   * @param duration - 持续时间（可选）
   */
  private updateStats(operation: 'start' | 'build', duration?: number): void {
    switch (operation) {
      case 'start':
        this.stats.startCount++
        if (duration) {
          this.stats.averageStartTime =
            (this.stats.averageStartTime * (this.stats.startCount - 1) + duration) / this.stats.startCount
        }
        break

      case 'build':
        this.stats.buildCount++
        if (duration) {
          this.stats.averageBuildTime =
            (this.stats.averageBuildTime * (this.stats.buildCount - 1) + duration) / this.stats.buildCount
        }
        break
    }

    this.stats.lastActivity = Date.now()
  }

  /**
   * 设置事件监听器
   *
   * @param listeners - 事件监听器映射
   */
  private setupEventListeners(listeners?: Partial<{
    [K in LauncherEvent]: (data: LauncherEventData[K]) => void
  }>): void {
    if (!listeners) return

    // 注册所有提供的监听器
    Object.entries(listeners).forEach(([event, listener]) => {
      if (listener) {
        this.on(event, listener)
      }
    })
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandling(): void {
    // 测试环境下避免重复注册全局监听器导致的内存告警
    if (process.env.NODE_ENV === 'test') return

    // 监听未捕获的异常
    process.on('uncaughtException', (error) => {
      this.handleError(error, '未捕获的异常')
    })

    // 监听未处理的 Promise 拒绝
    process.on('unhandledRejection', (reason) => {
      const error = reason instanceof Error ? reason : new Error(String(reason))
      this.handleError(error, '未处理的 Promise 拒绝')
    })
  }

  /**
   * 自动加载配置文件
   *
   * @returns 加载的配置
   */
  private async autoLoadConfig(): Promise<ViteLauncherConfig> {
    try {
      // 只在debug模式下输出详细信息
      if (this.logger.getLevel() === 'debug') {
        this.logger.debug('ViteLauncher.autoLoadConfig 开始', {
          cwd: this.cwd,
          environment: this.environment
        })
      }

      // 使用 ConfigManager 的多环境配置加载功能
      const loadedConfig = await this.configManager.load({
        cwd: this.cwd,
        environment: this.environment
      })

      // 合并到当前配置
      const oldAliasCount = this.config.resolve?.alias?.length || 0
      this.config = this.mergeConfig(this.config, loadedConfig)
      const newAliasCount = this.config.resolve?.alias?.length || 0

      // 只在debug模式下输出详细信息
      if (this.logger.getLevel() === 'debug') {
        this.logger.debug('配置合并完成', {
          oldAliasCount,
          newAliasCount,
          loadedAliasCount: loadedConfig.resolve?.alias?.length || 0
        })
      }

      // 只在 debug 模式显示
      if (this.logger.getLevel() === 'debug') {
        this.logger.debug('配置文件加载成功')
      }

      return this.config
    } catch (error) {
      this.logger.warn('配置文件加载失败，使用默认配置', {
        error: (error as Error).message,
        environment: this.environment
      })
      return this.config
    }
  }

  /**
   * 获取服务器 URL
   *
   * @param server - 服务器实例
   * @returns 服务器 URL
   */
  private getServerUrl(server: ViteDevServer | PreviewServer): string {
    try {
      if (server.resolvedUrls?.local?.[0]) {
        return server.resolvedUrls.local[0]
      }

      // 回退到手动构建 URL
      const host = this.config.server?.host || DEFAULT_HOST
      const port = this.config.server?.port || DEFAULT_PORT
      const protocol = this.config.server?.https ? 'https' : 'http'

      return `${protocol}://${host}:${port}`
    } catch (error) {
      this.logger.warn('获取服务器 URL 失败', { error: (error as Error).message })
      return 'http://localhost:3000'
    }
  }

  /**
   * 获取预览服务器 URL
   *
   * @param server - 预览服务器实例
   * @returns 预览服务器 URL
   */
  private getPreviewServerUrl(server: PreviewServer): string {
    try {
      if (server.resolvedUrls?.local?.[0]) {
        return server.resolvedUrls.local[0]
      }

      // 回退到手动构建 URL
      const host = this.config.preview?.host || DEFAULT_HOST
      const port = this.config.preview?.port || 4173
      const protocol = this.config.preview?.https ? 'https' : 'http'

      return `${protocol}://${host}:${port}`
    } catch (error) {
      this.logger.warn('获取预览服务器 URL 失败', { error: (error as Error).message })
      return 'http://localhost:4173'
    }
  }

  /**
   * 销毁实例
   * 清理资源和事件监听器
   */
  async destroy(): Promise<void> {
    try {
      this.logger.info('正在销毁 ViteLauncher 实例...')

      // 停止所有服务
      if (this.devServer) {
        await this.stopDev()
      }

      if (this.buildWatcher) {
        this.buildWatcher.close()
        this.buildWatcher = null
      }

      if (this.previewServer) {
        await this.previewServer.close()
        this.previewServer = null
      }

      // 移除所有事件监听器
      this.removeAllListeners()

      // 清理配置管理器
      if (this.configManager) {
        this.configManager.removeAllListeners()
      }

      this.setStatus(LauncherStatus.STOPPED)

      this.logger.success('ViteLauncher 实例已销毁')

    } catch (error) {
      this.handleError(error as Error, '销毁实例失败')
      throw error
    }
  }

  /**
   * 美化显示最终配置信息
   */
  private displayFinalConfig(config: ViteLauncherConfig): void {
    this.logger.debug('🔍 最终Vite配置调试信息:')

    // 显示别名配置
    const aliasCount = Array.isArray(config.resolve?.alias) ? config.resolve.alias.length : 0
    this.logger.debug(`📁 resolve.alias配置: 共${aliasCount}个别名`)

    if (Array.isArray(config.resolve?.alias) && config.resolve.alias.length > 0) {
      const firstFewAliases = config.resolve.alias.slice(0, 5)
      firstFewAliases.forEach((alias, index) => {
        if (typeof alias === 'object') {
          this.logger.debug(`  ${index + 1}. ${alias.find} -> ${alias.replacement}`)
        }
      })
      if (config.resolve.alias.length > 5) {
        this.logger.debug(`  ... 还有${config.resolve.alias.length - 5}个别名`)
      }
    }

    // 显示服务器配置
    if (config.server) {
      this.logger.debug(`🌐 server配置:`, {
        port: config.server.port,
        host: config.server.host,
        https: !!config.server.https,
        open: config.server.open
      })
    }

    // 显示watch配置
    this.logger.debug(`👀 watch配置:`, {
      ignoredType: typeof config.server?.watch?.ignored,
      usePolling: config.server?.watch?.usePolling,
      interval: config.server?.watch?.interval
    })
  }

  /**
   * 应用别名配置
   *
   * @param config - 原始配置
   * @param stage - 当前阶段
   * @returns 应用别名后的配置
   */
  private applyAliasConfig(config: ViteLauncherConfig, stage: 'dev' | 'build' | 'preview'): ViteLauncherConfig {
    // 只在debug模式下输出调试信息
    if (this.logger.getLevel() === 'debug') {
      const existingAliases = config.resolve?.alias || []
      this.logger.debug('applyAliasConfig调试', {
        stage,
        aliasCount: Array.isArray(existingAliases) ? existingAliases.length : 0,
        aliases: existingAliases
      })
    }

    // 确保 resolve 配置存在
    if (!config.resolve) {
      config.resolve = {}
    }

    // 处理用户配置的别名
    let userAliases: import('../utils/aliases').AliasEntry[] = []
    if (config.resolve.alias) {
      if (Array.isArray(config.resolve.alias)) {
        userAliases = [...config.resolve.alias]
        if (this.logger.getLevel() === 'debug') {
          const ldesignAliases = userAliases.filter(a => a.find && typeof a.find === 'string' && a.find.startsWith('@ldesign'))
          this.logger.debug('用户别名（数组格式）', {
            totalCount: userAliases.length,
            ldesignCount: ldesignAliases.length,
            currentStage: stage,
            count: userAliases.length,
            first10: userAliases.slice(0, 10).map(a => ({ find: a.find, replacement: a.replacement, stages: a.stages })),
            ldesignAliases: ldesignAliases.map(a => ({ find: a.find, replacement: a.replacement, stages: a.stages }))
          })
        }
      } else {
        // 如果是对象格式，转换为数组格式以便统一处理
        userAliases = Object.entries(config.resolve.alias).map(([find, replacement]) => ({
          find,
          replacement: String(replacement)
        }))
        if (this.logger.getLevel() === 'debug') {
          this.logger.debug('用户别名（对象格式转换）', {
            count: userAliases.length,
            first5: userAliases.slice(0, 5)
          })
        }
      }
    }

    // 创建 AliasManager 实例
    const aliasManager = new AliasManager(this.cwd)

    // 生成内置别名（@ -> src, ~ -> 项目根目录）
    const builtinAliases = aliasManager.generateBuiltinAliases(['dev', 'build', 'preview'])

    // 合并内置别名和用户别名
    const allAliases = [...builtinAliases, ...userAliases]

    // 根据当前阶段过滤别名
    const filteredAliases = aliasManager.filterAliasesByStage(allAliases, stage)

    if (this.logger.getLevel() === 'debug') {
      const ldesignFiltered = filteredAliases.filter(a => a.find && typeof a.find === 'string' && a.find.startsWith('@ldesign'))
      this.logger.debug('别名过滤结果调试', {
        stage,
        beforeFilter: allAliases.length,
        afterFilter: filteredAliases.length,
        ldesignCount: ldesignFiltered.length
      })
      this.logger.debug('别名过滤结果', {
        stage,
        beforeFilter: allAliases.length,
        afterFilter: filteredAliases.length,
        first10: filteredAliases.slice(0, 10).map(a => ({ find: a.find, replacement: a.replacement })),
        ldesignFiltered: ldesignFiltered.map(a => ({ find: a.find, replacement: a.replacement }))
      })
    }

    // 应用过滤后的别名配置
    config.resolve.alias = filteredAliases

    // 调试：输出最终的别名配置（只在 debug 模式）
    if (this.logger.getLevel() === 'debug') {
      const finalAliases = config.resolve?.alias || []
      this.logger.debug(`别名配置已处理 (${stage})，最终别名数量: ${Array.isArray(finalAliases) ? finalAliases.length : 0}`)

      this.logger.debug('最终别名配置', {
        stage,
        aliases: finalAliases
      })
    }

    return config
  }



  /**
   * 使用智能插件增强配置
   *
   * @param config - 原始配置
   * @returns 增强后的配置
   */
  private async enhanceConfigWithSmartPlugins(config: ViteLauncherConfig): Promise<ViteLauncherConfig> {
    try {
      // 只在 debug 模式显示
      if (this.logger.getLevel() === 'debug') {
        this.logger.debug('开始智能插件检测...')
      }
      // 获取智能检测的插件
      const smartPlugins = await this.smartPluginManager.getRecommendedPlugins()
      // 只在 debug 模式显示
      if (this.logger.getLevel() === 'debug') {
        this.logger.debug('智能插件检测完成', { count: smartPlugins.length })
      }

      if (smartPlugins.length > 0) {
        // 合并用户配置的插件和智能检测的插件（按名称去重，避免重复注册）
        const userPluginsRaw = config.plugins || []

        // 将可能的嵌套数组拍平
        const flatten = (arr: unknown[]): Plugin[] => {
          if (arr.flat) {
            return arr.flat(Infinity) as Plugin[]
          }
          return ([] as Plugin[]).concat(...(arr as Plugin[][]))
        }
        const userPlugins = Array.isArray(userPluginsRaw) ? flatten(userPluginsRaw) : [userPluginsRaw]
        const smartFlat = Array.isArray(smartPlugins) ? flatten(smartPlugins) : [smartPlugins]

        const exists = new Set<string>(
          userPlugins
            .filter((p: unknown): p is Plugin & { name: string } => p !== null && typeof p === 'object' && 'name' in p)
            .map((p) => p.name)
        )

        const merged: Plugin[] = [...userPlugins]
        for (const p of smartFlat) {
          const name = p && typeof p === 'object' && 'name' in p ? (p as { name: string }).name : undefined
          if (!name || !exists.has(name)) {
            merged.unshift(p) // 智能插件优先，但不覆盖用户已显式配置的插件
            if (name) exists.add(name)
          }
        }

        this.logger.debug('智能插件增强完成', {
          smartPlugins: smartFlat.length,
          userPlugins: userPlugins.length,
          total: merged.length
        })

        return {
          ...config,
          plugins: merged
        }
      }

      return config
    } catch (error) {
      this.logger.warn('智能插件增强失败', { error: (error as Error).message })
      return config
    }
  }

  /**
   * 处理HTTPS配置
   *
   * @param config - 原始配置
   * @returns 处理后的配置
   */
  private async processHTTPSConfig(config: ViteLauncherConfig): Promise<ViteLauncherConfig> {
    try {
      // 检查是否启用了HTTPS
      if (!config.server?.https) {
        return config
      }

      // 如果是boolean值true，则自动生成SSL证书
      if (typeof config.server.https === 'boolean' && config.server.https === true) {
        this.logger.debug('检测到HTTPS配置，正在检查SSL证书...')

        // 获取证书存储目录
        const { LDESIGN_DIR } = await import('../constants')
        const certDir = PathUtils.resolve(this.cwd, LDESIGN_DIR, 'ssl')

        // 创建SSL管理器
        const sslManager = createSSLManager(certDir, this.logger)

        try {
          // 生成或获取SSL证书
          const sslConfig = await sslManager.getOrCreateSSLConfig({
            domains: ['localhost', '127.0.0.1', '::1'],
            days: 365,
            force: false
          })

          this.logger.debug('SSL证书准备完成')

          // 更新配置
          return {
            ...config,
            server: {
              ...config.server,
              https: {
                key: await FileSystem.readFile(sslConfig.key),
                cert: await FileSystem.readFile(sslConfig.cert)
              }
            }
          }
        } catch (sslError) {
          this.logger.warn('SSL证书生成失败，回退到Vite内置HTTPS支持', {
            error: (sslError as Error).message
          })

          // 回退到Vite内置的HTTPS支持
          return {
            ...config,
            server: {
              ...config.server,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              https: true as any
            }
          }
        }
      }

      // 如果是对象配置，直接使用
      return config

    } catch (error) {
      this.logger.error('HTTPS配置处理失败', { error: (error as Error).message })
      this.logger.warn('将回退到HTTP模式')

      // 回退到HTTP
      const { https, ...serverConfig } = config.server || {}
      return {
        ...config,
        server: serverConfig
      }
    }
  }

  /**
   * 输出简化的服务器信息（仅地址和二维码）
   */
  private printSimpleServerInfo(): void {
    const serverInfo = this.getServerInfo()
    if (!serverInfo) return

    const localUrl = serverInfo.url || ''

    // 获取本地IP地址
    const localIP = getPreferredLocalIP()

    // 构建网络 URL - 总是显示网络地址
    let networkUrl: string | null = null
    try {
      const url = new URL(localUrl)
      // 如果本地URL使用localhost，替换为实际IP
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        networkUrl = `${url.protocol}//${localIP}:${url.port}${url.pathname}`
      } else if (url.hostname === '0.0.0.0') {
        networkUrl = localUrl.replace('0.0.0.0', localIP)
      } else {
        // 如果已经是IP地址，直接使用
        networkUrl = localUrl
      }
    } catch {
      const protocol = serverInfo.https ? 'https' : 'http'
      networkUrl = `${protocol}://${localIP}:${serverInfo.port}/`
    }

    // 输出简化的服务器信息
    this.logger.info('\n🚀 服务器已重启')
    this.logger.info('📍 本地地址: ' + localUrl)
    if (networkUrl) {
      this.logger.info('🌐 网络地址: ' + networkUrl)
    }

    // 生成二维码 - 优先使用网络地址
    const qrTarget = networkUrl || localUrl
    this.generateQRCode(qrTarget)
  }

  /**
   * 生成二维码（带白色边框美化）
   */
  private async generateQRCode(url: string): Promise<void> {
    if (!url) return

    try {
      // 优先使用 qrcode 库
      try {
        const qrlib = await import('qrcode') as { default?: typeof import('qrcode') } & typeof import('qrcode')
        const qrcode = qrlib?.default || qrlib

        // 使用toString方法生成终端二维码
        const terminalQR = await qrcode.toString(url, {
          type: 'terminal',
          small: true
        })

        if (terminalQR && typeof terminalQR === 'string') {
          this.logger.info('二维码（扫码在手机上打开）：')
          console.log()
          console.log(terminalQR)
          console.log()
          return
        }
      } catch (e1) {
        // 静默处理，尝试下一个方法
      }

      // 回退到 qrcode-terminal
      try {
        const mod = await import('qrcode-terminal') as {
          default?: { generate: (text: string, opts: { small: boolean }, callback: (qr: string) => void) => void }
          generate?: (text: string, opts: { small: boolean }, callback: (qr: string) => void) => void
        }
        const qrt = mod?.default || mod
        let qrOutput = ''
        qrt.generate?.(url, { small: true }, (q: string) => {
          qrOutput = q
        })
        if (qrOutput) {
          this.printQRCodeWithBorder(qrOutput)
        }
      } catch (e2) {
        // 静默处理
      }
    } catch (error) {
      // 静默处理二维码生成失败
    }
  }

  /**
   * 打印带白色边框的二维码
   */
  private printQRCodeWithBorder(qrCode: string): void {
    const lines = qrCode.split('\n').filter(line => line.trim())
    if (lines.length === 0) return

    // 确保所有行长度一致
    const maxWidth = Math.max(...lines.map(line => line.length))
    const normalizedLines = lines.map(line => {
      const padding = ' '.repeat(Math.max(0, maxWidth - line.length))
      return line + padding
    })

    this.logger.info('二维码（扫码在手机上打开）：')
    console.log()

    // 创建简洁的边框效果
    const borderWidth = maxWidth + 4
    const topBorder = '┌' + '─'.repeat(borderWidth - 2) + '┐'
    const bottomBorder = '└' + '─'.repeat(borderWidth - 2) + '┘'
    const emptyLine = '│' + ' '.repeat(borderWidth - 2) + '│'

    // 上边框
    console.log(topBorder)
    console.log(emptyLine)

    // 二维码内容
    normalizedLines.forEach(line => {
      console.log('│ ' + line + ' │')
    })

    // 下边框
    console.log(emptyLine)
    console.log(bottomBorder)
    console.log()
  }

  /**
   * 输出预览服务器信息（地址和二维码）
   */
  private printPreviewServerInfo(): void {
    if (!this.previewServer) return

    try {
      // 获取预览服务器URL
      const localUrl = this.getPreviewServerUrl(this.previewServer)

      // 获取本地IP地址
      const localIP = getPreferredLocalIP()

      // 构建网络 URL
      let networkUrl: string | null = null
      try {
        const url = new URL(localUrl)
        // 如果本地URL使用localhost，替换为实际IP
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          networkUrl = `${url.protocol}//${localIP}:${url.port}${url.pathname}`
        } else if (url.hostname === '0.0.0.0') {
          networkUrl = localUrl.replace('0.0.0.0', localIP)
        } else {
          networkUrl = localUrl
        }
      } catch (error) {
        // 如果URL解析失败，手动构建网络地址
        const protocol = this.config.preview?.https ? 'https' : 'http'
        const port = this.config.preview?.port || 4173
        networkUrl = `${protocol}://${localIP}:${port}/`
      }

      // 输出服务器信息框
      console.log('\n' + '┌────────────────────────────────────┐')
      console.log('│ ✔ 预览服务器已启动                │')
      console.log(`│ • 本地: ${localUrl.padEnd(22)} │`)
      if (networkUrl) {
        console.log(`│ • 网络: ${networkUrl.padEnd(22)} │`)
      }
      console.log('│ • 提示: 按 Ctrl+C 停止服务器      │')
      console.log('└────────────────────────────────────┘')

      // 生成二维码 - 优先使用网络地址
      const qrTarget = networkUrl || localUrl
      this.generateQRCode(qrTarget)

    } catch (error) {
      this.logger.warn('输出预览服务器信息失败', { error: (error as Error).message })
    }
  }


}
