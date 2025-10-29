/**
 * 统一错误处理系统
 * 
 * 提供完整的错误类型层级和错误处理机制
 * 
 * @author LDesign Team
 * @since 2.0.0
 */

/**
 * 错误码枚举
 */
export enum ErrorCode {
  // 配置相关错误 (1000-1999)
  CONFIG_NOT_FOUND = 1000,
  CONFIG_INVALID = 1001,
  CONFIG_PARSE_ERROR = 1002,
  CONFIG_VALIDATION_ERROR = 1003,
  
  // 框架相关错误 (2000-2999)
  FRAMEWORK_NOT_FOUND = 2000,
  FRAMEWORK_DETECTION_FAILED = 2001,
  FRAMEWORK_PLUGIN_ERROR = 2002,
  FRAMEWORK_INCOMPATIBLE = 2003,
  
  // 引擎相关错误 (3000-3999)
  ENGINE_NOT_FOUND = 3000,
  ENGINE_INIT_FAILED = 3001,
  ENGINE_BUILD_FAILED = 3002,
  ENGINE_DEV_FAILED = 3003,
  
  // 插件相关错误 (4000-4999)
  PLUGIN_NOT_FOUND = 4000,
  PLUGIN_LOAD_FAILED = 4001,
  PLUGIN_INCOMPATIBLE = 4002,
  PLUGIN_INSTALL_FAILED = 4003,
  
  // 文件系统错误 (5000-5999)
  FILE_NOT_FOUND = 5000,
  FILE_READ_ERROR = 5001,
  FILE_WRITE_ERROR = 5002,
  DIRECTORY_NOT_FOUND = 5003,
  
  // 网络相关错误 (6000-6999)
  NETWORK_ERROR = 6000,
  PORT_IN_USE = 6001,
  CONNECTION_FAILED = 6002,
  
  // 依赖相关错误 (7000-7999)
  DEPENDENCY_NOT_FOUND = 7000,
  DEPENDENCY_VERSION_MISMATCH = 7001,
  DEPENDENCY_INSTALL_FAILED = 7002,
  
  // 运行时错误 (8000-8999)
  RUNTIME_ERROR = 8000,
  TIMEOUT_ERROR = 8001,
  MEMORY_ERROR = 8002,
  
  // 未知错误
  UNKNOWN_ERROR = 9999
}

/**
 * 错误严重级别
 */
export enum ErrorSeverity {
  /** 致命错误 - 程序必须终止 */
  FATAL = 'fatal',
  /** 错误 - 功能无法继续 */
  ERROR = 'error',
  /** 警告 - 可能影响功能 */
  WARNING = 'warning',
  /** 信息 - 不影响功能 */
  INFO = 'info'
}

/**
 * 基础错误类
 */
export class LauncherError extends Error {
  /** 错误码 */
  code: ErrorCode
  
  /** 错误严重级别 */
  severity: ErrorSeverity
  
  /** 错误上下文 */
  context?: Record<string, any>
  
  /** 错误发生时间 */
  timestamp: number
  
  /** 错误堆栈 */
  stack?: string
  
  /** 原始错误 */
  cause?: Error

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context?: Record<string, any>,
    cause?: Error
  ) {
    super(message)
    this.name = 'LauncherError'
    this.code = code
    this.severity = severity
    this.context = context
    this.timestamp = Date.now()
    this.cause = cause
    
    // 保持正确的堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * 转换为JSON格式
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
      cause: this.cause?.message
    }
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserMessage(): string {
    return `[${this.code}] ${this.message}`
  }
}

/**
 * 配置错误
 */
export class ConfigError extends LauncherError {
  constructor(message: string, code: ErrorCode, context?: Record<string, any>, cause?: Error) {
    super(message, code, ErrorSeverity.ERROR, context, cause)
    this.name = 'ConfigError'
  }
}

/**
 * 框架错误
 */
export class FrameworkError extends LauncherError {
  constructor(message: string, code: ErrorCode, context?: Record<string, any>, cause?: Error) {
    super(message, code, ErrorSeverity.ERROR, context, cause)
    this.name = 'FrameworkError'
  }
}

/**
 * 引擎错误
 */
export class EngineError extends LauncherError {
  constructor(message: string, code: ErrorCode, context?: Record<string, any>, cause?: Error) {
    super(message, code, ErrorSeverity.ERROR, context, cause)
    this.name = 'EngineError'
  }
}

/**
 * 插件错误
 */
export class PluginError extends LauncherError {
  constructor(message: string, code: ErrorCode, context?: Record<string, any>, cause?: Error) {
    super(message, code, ErrorSeverity.ERROR, context, cause)
    this.name = 'PluginError'
  }
}

/**
 * 文件系统错误
 */
export class FileSystemError extends LauncherError {
  constructor(message: string, code: ErrorCode, context?: Record<string, any>, cause?: Error) {
    super(message, code, ErrorSeverity.ERROR, context, cause)
    this.name = 'FileSystemError'
  }
}

/**
 * 网络错误
 */
export class NetworkError extends LauncherError {
  constructor(message: string, code: ErrorCode, context?: Record<string, any>, cause?: Error) {
    super(message, code, ErrorSeverity.ERROR, context, cause)
    this.name = 'NetworkError'
  }
}

/**
 * 依赖错误
 */
export class DependencyError extends LauncherError {
  constructor(message: string, code: ErrorCode, context?: Record<string, any>, cause?: Error) {
    super(message, code, ErrorSeverity.ERROR, context, cause)
    this.name = 'DependencyError'
  }
}

/**
 * 错误恢复策略
 */
export interface RecoveryStrategy {
  /** 策略名称 */
  name: string
  
  /** 策略描述 */
  description: string
  
  /** 执行恢复 */
  execute: () => Promise<void>
}

/**
 * 错误处理器
 */
export class ErrorHandler {
  private static instance: ErrorHandler
  private recoveryStrategies: Map<ErrorCode, RecoveryStrategy[]> = new Map()

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * 注册恢复策略
   */
  registerRecoveryStrategy(code: ErrorCode, strategy: RecoveryStrategy): void {
    const strategies = this.recoveryStrategies.get(code) || []
    strategies.push(strategy)
    this.recoveryStrategies.set(code, strategies)
  }

  /**
   * 处理错误
   */
  async handle(error: Error | LauncherError): Promise<void> {
    // 标准化错误
    const launcherError = this.normalizeError(error)
    
    // 记录错误
    this.logError(launcherError)
    
    // 尝试恢复
    if (launcherError.code !== ErrorCode.UNKNOWN_ERROR) {
      await this.tryRecover(launcherError)
    }
  }

  /**
   * 标准化错误
   */
  private normalizeError(error: Error | LauncherError): LauncherError {
    if (error instanceof LauncherError) {
      return error
    }
    
    return new LauncherError(
      error.message,
      ErrorCode.UNKNOWN_ERROR,
      ErrorSeverity.ERROR,
      { originalError: error.name }
    )
  }

  /**
   * 记录错误
   */
  private logError(error: LauncherError): void {
    const errorInfo = {
      timestamp: new Date(error.timestamp).toISOString(),
      name: error.name,
      code: error.code,
      severity: error.severity,
      message: error.message,
      context: error.context,
      stack: error.stack
    }

    console.error('[LauncherError]', JSON.stringify(errorInfo, null, 2))
  }

  /**
   * 尝试错误恢复
   */
  private async tryRecover(error: LauncherError): Promise<void> {
    const strategies = this.recoveryStrategies.get(error.code)
    
    if (!strategies || strategies.length === 0) {
      return
    }

    for (const strategy of strategies) {
      try {
        console.log(`尝试恢复策略: ${strategy.name}`)
        await strategy.execute()
        console.log('恢复成功')
        return
      } catch (recoveryError) {
        console.error(`恢复策略失败: ${strategy.name}`, recoveryError)
      }
    }
  }

  /**
   * 获取错误建议
   */
  getSuggestions(error: LauncherError): string[] {
    const suggestions: string[] = []

    switch (error.code) {
      case ErrorCode.CONFIG_NOT_FOUND:
        suggestions.push('运行 `launcher init` 创建配置文件')
        suggestions.push('检查当前目录是否为项目根目录')
        break

      case ErrorCode.FRAMEWORK_NOT_FOUND:
        suggestions.push('检查 package.json 中的框架依赖')
        suggestions.push('运行 `npm install` 安装依赖')
        break

      case ErrorCode.PORT_IN_USE:
        suggestions.push('使用 --port 参数指定其他端口')
        suggestions.push('关闭占用该端口的其他程序')
        break

      case ErrorCode.DEPENDENCY_NOT_FOUND:
        suggestions.push('运行 `npm install` 安装缺失的依赖')
        suggestions.push('检查 package.json 中的依赖配置')
        break

      default:
        suggestions.push('查看错误日志获取详细信息')
        suggestions.push('访问文档获取帮助')
    }

    return suggestions
  }
}

/**
 * 创建配置错误
 */
export function createConfigError(
  message: string,
  code: ErrorCode = ErrorCode.CONFIG_INVALID,
  context?: Record<string, any>,
  cause?: Error
): ConfigError {
  return new ConfigError(message, code, context, cause)
}

/**
 * 创建框架错误
 */
export function createFrameworkError(
  message: string,
  code: ErrorCode = ErrorCode.FRAMEWORK_NOT_FOUND,
  context?: Record<string, any>,
  cause?: Error
): FrameworkError {
  return new FrameworkError(message, code, context, cause)
}

/**
 * 创建引擎错误
 */
export function createEngineError(
  message: string,
  code: ErrorCode = ErrorCode.ENGINE_BUILD_FAILED,
  context?: Record<string, any>,
  cause?: Error
): EngineError {
  return new EngineError(message, code, context, cause)
}

/**
 * 创建插件错误
 */
export function createPluginError(
  message: string,
  code: ErrorCode = ErrorCode.PLUGIN_LOAD_FAILED,
  context?: Record<string, any>,
  cause?: Error
): PluginError {
  return new PluginError(message, code, context, cause)
}

/**
 * 导出全局错误处理器实例
 */
export const errorHandler = ErrorHandler.getInstance()
