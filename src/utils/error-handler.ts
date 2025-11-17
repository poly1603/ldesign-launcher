/**
 * 错误处理器 (精简版)
 * 
 * 删除了错误历史、恢复策略和统计功能
 * 保留基础的错误捕获、格式化和友好提示
 * 
 * @author LDesign Team
 * @since 2.1.0
 */

import { Logger } from './logger'

export interface ErrorHandlerOptions {
  logger?: Logger
  exitOnError?: boolean
}

export interface ErrorContext {
  operation?: string
  component?: string
  metadata?: Record<string, any>
  severity?: 'low' | 'medium' | 'high' | 'critical'
  userMessage?: string
  solutions?: string[]
}

/**
 * Launcher 错误类
 */
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
    this.context = context
    this.originalError = originalError

    // 保持堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LauncherError)
    }
  }
}

/**
 * 错误处理器 (精简版)
 */
export class ErrorHandler {
  private logger: Logger
  private exitOnError: boolean

  constructor(options: ErrorHandlerOptions = {}) {
    this.logger = options.logger || new Logger('ErrorHandler')
    this.exitOnError = options.exitOnError !== undefined 
      ? options.exitOnError 
      : process.env.NODE_ENV === 'production'
  }

  /**
   * 处理错误
   */
  async handle(error: Error | LauncherError, context: ErrorContext = {}): Promise<void> {
    const launcherError = error instanceof LauncherError 
      ? error 
      : new LauncherError(error.message, 'UNKNOWN_ERROR', context, error)

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
    context: ErrorContext = {}
  ): Promise<T> {
    try {
      return await fn()
    } catch (error) {
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
          ...context.metadata
        })
        break
      case 'medium':
        this.logger.warn(message, {
          code: error.code,
          ...context.metadata
        })
        break
      case 'low':
        this.logger.info(message, {
          code: error.code,
          ...context.metadata
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
    context?: ErrorContext
  ): LauncherError {
    return new LauncherError(message, code, context)
  }
}

/**
 * 创建错误处理器
 */
export function createErrorHandler(options?: ErrorHandlerOptions): ErrorHandler {
  return new ErrorHandler(options)
}
