/**
 * 错误处理器 (增强版)
 *
 * 提供错误捕获、格式化、友好提示等功能。
 *
 * 新增功能：
 * - 错误聚合（相同错误不重复输出）
 * - 错误历史记录
 * - 错误统计
 * - 与 src/errors 统一错误系统集成
 *
 * @author LDesign Team
 * @since 2.1.0
 * @version 2.1.0
 */

import {
  ConfigError,
  BuildError,
  ServerError,
  PluginError,
  FileSystemError,
  CLIError,
  LauncherBaseError,
  isLauncherError,
  wrapError,
  type ErrorContext as BaseErrorContext,
} from '../errors'
import { Logger } from './logger'

/**
 * 错误处理器配置选项
 */
export interface ErrorHandlerOptions {
  /** 日志记录器 */
  logger?: Logger
  /** 遇到严重错误时是否退出 */
  exitOnError?: boolean
  /** 是否启用错误聚合 */
  aggregateErrors?: boolean
  /** 聚合时间窗口（毫秒），默认 5000ms */
  aggregateWindow?: number
  /** 最大历史记录数，默认 100 */
  maxHistorySize?: number
}

/**
 * 错误上下文信息
 */
export interface ErrorContext {
  /** 操作名称 */
  operation?: string
  /** 组件名称 */
  component?: string
  /** 附加元数据 */
  metadata?: Record<string, unknown>
  /** 严重程度 */
  severity?: 'low' | 'medium' | 'high' | 'critical'
  /** 用户友好的错误信息 */
  userMessage?: string
  /** 解决方案建议 */
  solutions?: string[]
}

/**
 * 错误历史记录
 */
interface ErrorHistoryEntry {
  /** 错误对象 */
  error: LauncherError | LauncherBaseError
  /** 发生时间 */
  timestamp: number
  /** 出现次数 */
  count: number
}

/**
 * 错误统计信息
 */
export interface ErrorStats {
  /** 总错误数 */
  total: number
  /** 按严重程度统计 */
  bySeverity: Record<string, number>
  /** 按组件统计 */
  byComponent: Record<string, number>
  /** 最后错误时间 */
  lastErrorTime: number | null
}

/**
 * Launcher 错误类（兼容旧版 API）
 *
 * @deprecated 建议使用 src/errors 中的统一错误类
 */
export class LauncherError extends Error {
  public readonly code: string
  public readonly context: ErrorContext
  public readonly originalError?: Error

  constructor(
    message: string,
    code: string = 'LAUNCHER_ERROR',
    context: ErrorContext = {},
    originalError?: Error,
  ) {
    super(message)
    this.name = 'LauncherError'
    this.code = code
    this.context = context
    this.originalError = originalError

    // 保持堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LauncherError)
    }
  }

  /**
   * 转换为新的统一错误类型
   */
  toBaseError(): LauncherBaseError {
    return wrapError(this, this.context as any)
  }
}

/**
 * 错误处理器 (增强版)
 *
 * @example
 * ```typescript
 * const handler = new ErrorHandler({
 *   aggregateErrors: true,
 *   aggregateWindow: 5000,
 * })
 *
 * // 处理错误
 * await handler.handle(error, { component: 'ConfigManager' })
 *
 * // 获取统计
 * const stats = handler.getStats()
 * ```
 */
export class ErrorHandler {
  private logger: Logger
  private exitOnError: boolean

  // 新增：错误聚合
  private aggregateErrors: boolean
  private aggregateWindow: number
  private errorHistory: Map<string, ErrorHistoryEntry> = new Map()
  private maxHistorySize: number

  // 新增：错误统计
  private stats: ErrorStats = {
    total: 0,
    bySeverity: {},
    byComponent: {},
    lastErrorTime: null,
  }

  /**
   * 创建错误处理器
   *
   * @param options - 配置选项
   */
  constructor(options: ErrorHandlerOptions = {}) {
    this.logger = options.logger || new Logger('ErrorHandler')
    this.exitOnError = options.exitOnError !== undefined
      ? options.exitOnError
      : process.env.NODE_ENV === 'production'
    this.aggregateErrors = options.aggregateErrors ?? true
    this.aggregateWindow = options.aggregateWindow ?? 5000
    this.maxHistorySize = options.maxHistorySize ?? 100
  }

  /**
   * 处理错误
   *
   * @param error - 错误对象
   * @param context - 错误上下文
   *
   * @example
   * ```typescript
   * try {
   *   await riskyOperation()
   * } catch (error) {
   *   await handler.handle(error, {
   *     component: 'ConfigManager',
   *     operation: 'loadConfig',
   *     severity: 'high',
   *   })
   * }
   * ```
   */
  async handle(
    error: Error | LauncherError | LauncherBaseError,
    context: ErrorContext = {},
  ): Promise<void> {
    // 统一转换为 LauncherError
    let launcherError: LauncherError
    if (error instanceof LauncherError) {
      launcherError = error
    } else if (isLauncherError(error)) {
      // 从新错误系统转换
      launcherError = new LauncherError(
        error.message,
        String(error.code),
        {
          ...context,
          metadata: error.context as Record<string, unknown>,
        },
        error.cause,
      )
    } else {
      launcherError = new LauncherError(error.message, 'UNKNOWN_ERROR', context, error)
    }

    // 更新统计
    this.updateStats(launcherError)

    // 检查是否应该聚合
    if (this.aggregateErrors) {
      const shouldSkip = this.checkAndAggregate(launcherError)
      if (shouldSkip) {
        return
      }
    }

    // 记录错误
    this.logError(launcherError)

    // 根据严重程度决定是否退出
    if (this.shouldExit(launcherError)) {
      this.logger.error('严重错误，程序即将退出')
      if (this.exitOnError) {
        process.exit(1)
      }
    }
  }

  /**
   * 包装异步函数，自动处理错误
   */
  async wrap<T>(
    fn: () => Promise<T>,
    context: ErrorContext = {},
  ): Promise<T> {
    try {
      return await fn()
    }
    catch (error) {
      await this.handle(error as Error, context)
      throw error
    }
  }

  /**
   * 记录错误信息
   */
  private logError(error: LauncherError): void {
    const { context } = error

    // 构建错误消息
    const parts: string[] = []

    if (context.component) {
      parts.push(`[${context.component}]`)
    }

    if (context.operation) {
      parts.push(`操作: ${context.operation}`)
    }

    parts.push(error.message)

    const message = parts.join(' ')

    // 根据严重程度选择日志级别
    const severity = context.severity || 'medium'
    switch (severity) {
      case 'critical':
      case 'high':
        this.logger.error(message, {
          code: error.code,
          ...context.metadata,
        })
        break
      case 'medium':
        this.logger.warn(message, {
          code: error.code,
          ...context.metadata,
        })
        break
      case 'low':
        this.logger.info(message, {
          code: error.code,
          ...context.metadata,
        })
        break
    }

    // 显示用户友好的错误信息
    if (context.userMessage) {
      this.logger.info(`💡 ${context.userMessage}`)
    }

    // 显示解决方案
    if (context.solutions && context.solutions.length > 0) {
      this.logger.info('可能的解决方案:')
      context.solutions.forEach((solution, index) => {
        this.logger.info(`  ${index + 1}. ${solution}`)
      })
    }

    // 在调试模式显示原始错误堆栈
    if (process.env.DEBUG || process.env.NODE_ENV === 'development') {
      if (error.originalError) {
        this.logger.debug('原始错误:', error.originalError)
      }
    }
  }

  /**
   * 判断是否应该退出程序
   */
  private shouldExit(error: LauncherError): boolean {
    const { severity = 'medium' } = error.context
    return severity === 'critical' || severity === 'high'
  }

  /**
   * 创建 Launcher 错误
   */
  createError(
    message: string,
    code: string,
    context?: ErrorContext,
  ): LauncherError {
    return new LauncherError(message, code, context)
  }

  // ==================== 新增：错误聚合 ====================

  /**
   * 检查并聚合错误
   *
   * @param error - 错误对象
   * @returns 是否应该跳过输出（已聚合）
   */
  private checkAndAggregate(error: LauncherError): boolean {
    const key = this.getErrorKey(error)
    const now = Date.now()
    const existing = this.errorHistory.get(key)

    if (existing && (now - existing.timestamp) < this.aggregateWindow) {
      // 在聚合窗口内，增加计数
      existing.count++
      existing.timestamp = now

      // 每 10 次输出一次聚合信息
      if (existing.count % 10 === 0) {
        this.logger.warn(`错误重复出现 ${existing.count} 次: ${error.message}`)
      }

      return true // 跳过输出
    }

    // 新错误或超出窗口
    this.errorHistory.set(key, {
      error,
      timestamp: now,
      count: 1,
    })

    // 清理过旧的历史记录
    this.pruneHistory()

    return false
  }

  /**
   * 生成错误唯一标识
   */
  private getErrorKey(error: LauncherError): string {
    return `${error.code}:${error.message}:${error.context.component || ''}`
  }

  /**
   * 清理过旧的历史记录
   */
  private pruneHistory(): void {
    if (this.errorHistory.size <= this.maxHistorySize) return

    const now = Date.now()
    const toDelete: string[] = []

    for (const [key, entry] of this.errorHistory) {
      // 删除超过聚合窗口的记录
      if (now - entry.timestamp > this.aggregateWindow * 2) {
        toDelete.push(key)
      }
    }

    for (const key of toDelete) {
      this.errorHistory.delete(key)
    }

    // 如果还是太多，删除最旧的
    if (this.errorHistory.size > this.maxHistorySize) {
      const entries = Array.from(this.errorHistory.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)

      const deleteCount = entries.length - this.maxHistorySize
      for (let i = 0; i < deleteCount; i++) {
        this.errorHistory.delete(entries[i][0])
      }
    }
  }

  // ==================== 新增：错误统计 ====================

  /**
   * 更新错误统计
   */
  private updateStats(error: LauncherError): void {
    this.stats.total++
    this.stats.lastErrorTime = Date.now()

    // 按严重程度统计
    const severity = error.context.severity || 'medium'
    this.stats.bySeverity[severity] = (this.stats.bySeverity[severity] || 0) + 1

    // 按组件统计
    const component = error.context.component || 'unknown'
    this.stats.byComponent[component] = (this.stats.byComponent[component] || 0) + 1
  }

  /**
   * 获取错误统计
   *
   * @returns 错误统计信息
   *
   * @example
   * ```typescript
   * const stats = handler.getStats()
   * console.log(`总错误数: ${stats.total}`)
   * console.log(`严重错误: ${stats.bySeverity.critical || 0}`)
   * ```
   */
  getStats(): ErrorStats {
    return { ...this.stats }
  }

  /**
   * 重置错误统计
   */
  resetStats(): void {
    this.stats = {
      total: 0,
      bySeverity: {},
      byComponent: {},
      lastErrorTime: null,
    }
  }

  /**
   * 获取错误历史
   *
   * @returns 错误历史记录数组
   */
  getHistory(): Array<{ error: LauncherError | LauncherBaseError; count: number; timestamp: number }> {
    return Array.from(this.errorHistory.values()).map(entry => ({
      error: entry.error,
      count: entry.count,
      timestamp: entry.timestamp,
    }))
  }

  /**
   * 清空错误历史
   */
  clearHistory(): void {
    this.errorHistory.clear()
  }

  // ==================== 新增：便捷工厂方法 ====================

  /**
   * 创建配置错误
   */
  createConfigError(message: string, context?: BaseErrorContext): ConfigError {
    return new ConfigError(message, undefined, context)
  }

  /**
   * 创建服务器错误
   */
  createServerError(message: string, context?: BaseErrorContext): ServerError {
    return new ServerError(message, undefined, context)
  }

  /**
   * 创建构建错误
   */
  createBuildError(message: string, context?: BaseErrorContext): BuildError {
    return new BuildError(message, undefined, context)
  }

  /**
   * 创建插件错误
   */
  createPluginError(message: string, pluginName: string, context?: BaseErrorContext): PluginError {
    return new PluginError(
      message,
      undefined,
      { ...context, metadata: { ...(context?.metadata || {}), pluginName } },
    )
  }

  /**
   * 创建文件系统错误
   */
  createFileSystemError(message: string, filePath: string, context?: BaseErrorContext): FileSystemError {
    return new FileSystemError(message, undefined, { ...context, filePath })
  }

  /**
   * 创建 CLI 错误
   */
  createCLIError(message: string, context?: BaseErrorContext): CLIError {
    return new CLIError(message, undefined, context)
  }
}

/**
 * 创建错误处理器
 *
 * @param options - 配置选项
 * @returns ErrorHandler 实例
 */
export function createErrorHandler(options?: ErrorHandlerOptions): ErrorHandler {
  return new ErrorHandler(options)
}

// 重新导出错误类，便于统一引用
export {
  LauncherBaseError,
  ConfigError,
  ServerError,
  BuildError,
  PluginError,
  FileSystemError,
  CLIError,
  isLauncherError,
  wrapError,
}
