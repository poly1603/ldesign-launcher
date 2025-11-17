/**
 * 错误处理器
 * 
 * @author LDesign Team
 * @since 1.0.0
 */

import { Logger } from './logger'

export interface ErrorHandlerOptions {
  logger?: Logger
  exitOnError?: boolean
  maxRetries?: number
  retryDelay?: number
}

export interface ErrorContext {
  operation?: string
  component?: string
  metadata?: Record<string, any>
  timestamp?: number
  severity?: 'low' | 'medium' | 'high' | 'critical'
  recoverable?: boolean
  userMessage?: string
  solutions?: string[]
}

export class LauncherError extends Error {
  public readonly code: string
  public readonly context: ErrorContext
  public readonly originalError?: Error

  constructor(
    message: string,
    code: string = 'LAUNCHER_ERROR',
    context: ErrorContext = {},
    originalError?: Error
  ) {
    super(message)
    this.name = 'LauncherError'
    this.code = code
    this.context = {
      ...context,
      timestamp: context.timestamp || Date.now()
    }
    this.originalError = originalError

    // 保持堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LauncherError)
    }
  }
}

export class ErrorHandler {
  private logger: Logger
  private exitOnError: boolean
  private maxRetries: number
  private retryDelay: number
  private retryCount = new Map<string, number>()
  private errorHistory: LauncherError[] = []
  private errorHandlers = new Map<string, (error: LauncherError) => void | Promise<void>>()
  private recoveryStrategies = new Map<string, () => Promise<void>>()

  constructor(options: ErrorHandlerOptions = {}) {
    this.logger = options.logger || new Logger('ErrorHandler')
    // 区分环境：开发环境默认不退出，生产环境默认退出
    this.exitOnError = options.exitOnError !== undefined 
      ? options.exitOnError 
      : process.env.NODE_ENV === 'production'
    this.maxRetries = options.maxRetries || 3
    this.retryDelay = options.retryDelay || 1000
    
    // 注册默认错误处理器
    this.registerDefaultHandlers()
  }

  /**
   * 注册默认错误处理器
   */
  private registerDefaultHandlers(): void {
    // 配置错误处理器
    this.registerErrorHandler('CONFIG_INVALID', async (error) => {
      this.logger.warn('检测到配置错误，尝试使用默认配置')
    })

    // 网络错误处理器
    this.registerErrorHandler('NETWORK_ERROR', async (error) => {
      this.logger.warn('网络连接失败，请检查网络连接')
    })

    // 文件系统错误处理器
    this.registerErrorHandler('FILE_NOT_FOUND', async (error) => {
      this.logger.warn('文件不存在，请检查文件路径')
    })
  }

  /**
   * 注册错误处理器
   */
  registerErrorHandler(code: string, handler: (error: LauncherError) => void | Promise<void>): void {
    this.errorHandlers.set(code, handler)
  }

  /**
   * 注册恢复策略
   */
  registerRecoveryStrategy(errorCode: string, strategy: () => Promise<void>): void {
    this.recoveryStrategies.set(errorCode, strategy)
  }

  /**
   * 处理错误
   */
  async handle(error: Error | LauncherError, context: ErrorContext = {}): Promise<void> {
    const launcherError = error instanceof LauncherError 
      ? error 
      : new LauncherError(error.message, 'UNKNOWN_ERROR', context, error)

    // 添加到错误历史
    this.addToHistory(launcherError)

    // 记录错误
    this.logError(launcherError)

    // 执行自定义错误处理器
    const handler = this.errorHandlers.get(launcherError.code)
    if (handler) {
      try {
        await Promise.resolve(handler(launcherError))
      } catch (handlerError) {
        this.logger.error('错误处理器执行失败', handlerError)
      }
    }

    // 尝试恢复
    if (launcherError.context.recoverable) {
      await this.tryRecover(launcherError)
    }

    // 根据错误类型决定是否退出
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
    context: ErrorContext = {}
  ): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      this.handle(error as Error, context)
      throw error
    }
  }

  /**
   * 带重试的异步函数执行
   */
  async retry<T>(
    fn: () => Promise<T>,
    context: ErrorContext = {},
    maxRetries?: number
  ): Promise<T> {
    const retries = maxRetries || this.maxRetries
    const operation = context.operation || 'unknown'
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await fn()
        // 成功后重置重试计数
        this.retryCount.delete(operation)
        return result
      } catch (error) {
        const isLastAttempt = attempt === retries
        
        if (isLastAttempt) {
          this.handle(error as Error, {
            ...context,
            metadata: {
              ...context.metadata,
              attempts: attempt,
              maxRetries: retries
            }
          })
          throw error
        }

        this.logger.warn(`操作失败，正在重试 (${attempt}/${retries})`, {
          operation,
          error: (error as Error).message
        })

        // 等待后重试
        await this.delay(this.retryDelay * attempt)
      }
    }

    throw new LauncherError('重试次数已用完', 'MAX_RETRIES_EXCEEDED', context)
  }

  /**
   * 创建错误
   */
  createError(
    message: string,
    code: string = 'LAUNCHER_ERROR',
    context: ErrorContext = {}
  ): LauncherError {
    return new LauncherError(message, code, context)
  }

  /**
   * 检查是否为特定类型的错误
   */
  isErrorType(error: Error, code: string): boolean {
    return error instanceof LauncherError && error.code === code
  }

  /**
   * 获取错误的详细信息
   */
  getErrorDetails(error: Error): {
    message: string
    code: string
    context: ErrorContext
    stack?: string
  } {
    if (error instanceof LauncherError) {
      return {
        message: error.message,
        code: error.code,
        context: error.context,
        stack: error.stack
      }
    }

    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
      context: {},
      stack: error.stack
    }
  }

  private logError(error: LauncherError): void {
    const details = {
      code: error.code,
      context: error.context,
      originalError: error.originalError?.message
    }

    this.logger.error(error.message, details)

    // 在调试模式下显示堆栈跟踪
    if (process.env.DEBUG || process.env.NODE_ENV === 'development') {
      this.logger.debug('错误堆栈跟踪:', error.stack)
      if (error.originalError?.stack) {
        this.logger.debug('原始错误堆栈:', error.originalError.stack)
      }
    }
  }

  private shouldExit(error: LauncherError): boolean {
    // 定义需要退出的错误类型
    const fatalErrorCodes = [
      'INIT_FAILED',
      'CONFIG_INVALID',
      'DEPENDENCY_MISSING',
      'PERMISSION_DENIED'
    ]

    return fatalErrorCodes.includes(error.code)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 添加到错误历史
   */
  private addToHistory(error: LauncherError): void {
    this.errorHistory.push(error)
    
    // 限制历史记录数量（保留最近100条）
    if (this.errorHistory.length > 100) {
      this.errorHistory.shift()
    }
  }

  /**
   * 尝试恢复
   */
  private async tryRecover(error: LauncherError): Promise<void> {
    const strategy = this.recoveryStrategies.get(error.code)
    
    if (strategy) {
      try {
        this.logger.info(`尝试执行恢复策略: ${error.code}`)
        await strategy()
        this.logger.success(`恢复策略执行成功: ${error.code}`)
      } catch (recoveryError) {
        this.logger.error(`恢复策略执行失败: ${error.code}`, recoveryError)
      }
    }
  }

  /**
   * 获取错误历史
   */
  getErrorHistory(filter?: {
    code?: string
    severity?: ErrorContext['severity']
    limit?: number
  }): LauncherError[] {
    let history = [...this.errorHistory]

    if (filter?.code) {
      history = history.filter(e => e.code === filter.code)
    }

    if (filter?.severity) {
      history = history.filter(e => e.context.severity === filter.severity)
    }

    if (filter?.limit) {
      history = history.slice(-filter.limit)
    }

    return history
  }

  /**
   * 清空错误历史
   */
  clearErrorHistory(): void {
    this.errorHistory = []
  }

  /**
   * 获取错误统计
   */
  getErrorStats(): {
    total: number
    byCode: Record<string, number>
    bySeverity: Record<string, number>
    recentErrors: LauncherError[]
  } {
    const byCode: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}

    this.errorHistory.forEach(error => {
      // 按错误类型统计
      byCode[error.code] = (byCode[error.code] || 0) + 1

      // 按严重程度统计
      const severity = error.context.severity || 'medium'
      bySeverity[severity] = (bySeverity[severity] || 0) + 1
    })

    return {
      total: this.errorHistory.length,
      byCode,
      bySeverity,
      recentErrors: this.errorHistory.slice(-10)
    }
  }

  /**
   * 格式化错误信息（用户友好）
   */
  formatUserMessage(error: LauncherError): string {
    const lines: string[] = []

    // 用户消息或默认消息
    lines.push(error.context.userMessage || error.message)

    // 添加解决方案
    if (error.context.solutions && error.context.solutions.length > 0) {
      lines.push('')
      lines.push('建议解决方案:')
      error.context.solutions.forEach((solution, index) => {
        lines.push(`  ${index + 1}. ${solution}`)
      })
    }

    // 添加错误代码
    if (error.code !== 'UNKNOWN_ERROR') {
      lines.push('')
      lines.push(`错误代码: ${error.code}`)
    }

    return lines.join('\n')
  }

  /**
   * 生成错误报告
   */
  generateErrorReport(): string {
    const stats = this.getErrorStats()
    const lines: string[] = []

    lines.push('═══════════════════════════════════════════')
    lines.push('          错误报告')
    lines.push('═══════════════════════════════════════════')
    lines.push('')

    lines.push(`总错误数: ${stats.total}`)
    lines.push('')

    // 按类型统计
    if (Object.keys(stats.byCode).length > 0) {
      lines.push('按类型分组:')
      Object.entries(stats.byCode)
        .sort(([, a], [, b]) => b - a)
        .forEach(([code, count]) => {
          lines.push(`  • ${code}: ${count} 次`)
        })
      lines.push('')
    }

    // 按严重程度统计
    if (Object.keys(stats.bySeverity).length > 0) {
      lines.push('按严重程度分组:')
      Object.entries(stats.bySeverity)
        .sort(([, a], [, b]) => b - a)
        .forEach(([severity, count]) => {
          lines.push(`  • ${severity}: ${count} 次`)
        })
      lines.push('')
    }

    // 最近错误
    if (stats.recentErrors.length > 0) {
      lines.push('最近错误:')
      stats.recentErrors.slice(-5).forEach((error, index) => {
        lines.push(`  ${index + 1}. [${error.code}] ${error.message}`)
      })
    }

    lines.push('')
    lines.push('═══════════════════════════════════════════')

    return lines.join('\n')
  }
}

// 创建默认实例
export const errorHandler = new ErrorHandler()

// 便捷函数
export const handleError = (error: Error, context?: ErrorContext) => 
  errorHandler.handle(error, context)

export const createError = (message: string, code?: string, context?: ErrorContext) =>
  errorHandler.createError(message, code, context)

export const withErrorHandling = <T>(fn: () => Promise<T>, context?: ErrorContext) =>
  errorHandler.wrap(fn, context)

export const withRetry = <T>(fn: () => Promise<T>, context?: ErrorContext, maxRetries?: number) =>
  errorHandler.retry(fn, context, maxRetries)
