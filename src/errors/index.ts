/**
 * @ldesign/launcher 统一错误处理系统
 *
 * 提供完整的错误类层次结构、错误码映射和工具函数
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import { ErrorCode, ErrorSeverity, ErrorCategory, ErrorRecoveryStrategy } from '../constants/errors'

// ==================== 错误上下文类型 ====================

/**
 * 错误上下文接口
 * 用于传递错误发生时的详细信息
 */
export interface ErrorContext {
  /** 操作名称 */
  operation?: string
  /** 组件名称 */
  component?: string
  /** 文件路径 */
  filePath?: string
  /** 行号 */
  line?: number
  /** 列号 */
  column?: number
  /** 额外元数据 */
  metadata?: Record<string, unknown>
  /** 错误严重程度 */
  severity?: ErrorSeverity
  /** 用户友好的错误消息 */
  userMessage?: string
  /** 建议的解决方案 */
  solutions?: string[]
  /** 相关文档链接 */
  docsUrl?: string
  /** 错误发生时间戳 */
  timestamp?: number
}

/**
 * 序列化后的错误对象
 */
export interface SerializedError {
  name: string
  message: string
  code: string
  category: ErrorCategory
  severity: ErrorSeverity
  context?: ErrorContext
  stack?: string
  cause?: SerializedError
}

// ==================== 基础错误类 ====================

/**
 * Launcher 基础错误类
 *
 * 所有 Launcher 相关错误的基类，提供：
 * - 错误码支持
 * - 错误分类
 * - 严重程度标记
 * - 上下文信息
 * - 错误链追踪
 * - 序列化支持
 *
 * @example
 * ```typescript
 * throw new LauncherBaseError(
 *   '配置加载失败',
 *   ErrorCode.CONFIG_LOAD_FAILED,
 *   ErrorCategory.CONFIG,
 *   {
 *     severity: ErrorSeverity.HIGH,
 *     filePath: '/path/to/config.ts',
 *     solutions: ['检查配置文件语法', '确保文件存在']
 *   }
 * )
 * ```
 */
export class LauncherBaseError extends Error {
  /** 错误码 */
  public readonly code: ErrorCode
  /** 错误分类 */
  public readonly category: ErrorCategory
  /** 严重程度 */
  public readonly severity: ErrorSeverity
  /** 错误上下文 */
  public readonly context: ErrorContext
  /** 恢复策略 */
  public readonly recoveryStrategy: ErrorRecoveryStrategy
  /** 是否可重试 */
  public readonly retryable: boolean
  /** 错误发生时间戳 */
  public readonly timestamp: number
  /** 原始错误（错误链） */
  public readonly cause?: Error

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    context: ErrorContext = {},
    cause?: Error,
  ) {
    super(message)
    this.name = 'LauncherBaseError'
    this.code = code
    this.category = category
    this.severity = context.severity || ErrorSeverity.MEDIUM
    this.context = {
      ...context,
      timestamp: context.timestamp || Date.now(),
    }
    this.timestamp = this.context.timestamp!
    this.recoveryStrategy = this.determineRecoveryStrategy()
    this.retryable = this.isRetryable()

    // 设置错误链
    if (cause) {
      this.cause = cause
    }

    // 保持堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * 确定恢复策略
   */
  private determineRecoveryStrategy(): ErrorRecoveryStrategy {
    switch (this.category) {
      case ErrorCategory.CONFIG:
        return ErrorRecoveryStrategy.USER_INTERVENTION
      case ErrorCategory.NETWORK:
        return ErrorRecoveryStrategy.RETRY
      case ErrorCategory.FILESYSTEM:
        return ErrorRecoveryStrategy.FALLBACK
      case ErrorCategory.BUILD:
        return ErrorRecoveryStrategy.RESTART
      case ErrorCategory.PLUGIN:
        return ErrorRecoveryStrategy.FALLBACK
      default:
        return ErrorRecoveryStrategy.NONE
    }
  }

  /**
   * 判断是否可重试
   */
  private isRetryable(): boolean {
    const retryableCodes = [
      ErrorCode.TIMEOUT,
      ErrorCode.NETWORK_CONNECTION_FAILED,
      ErrorCode.RESPONSE_TIMEOUT,
      ErrorCode.CACHE_CONNECTION_FAILED,
      ErrorCode.DEPENDENCY_DOWNLOAD_FAILED,
    ]
    return retryableCodes.includes(this.code)
  }

  /**
   * 序列化错误对象
   *
   * @returns 序列化后的错误对象
   */
  toJSON(): SerializedError {
    const result: SerializedError = {
      name: this.name,
      message: this.message,
      code: ErrorCode[this.code] || String(this.code),
      category: this.category,
      severity: this.severity,
      context: this.context,
      stack: this.stack,
    }

    if (this.cause instanceof LauncherBaseError) {
      result.cause = this.cause.toJSON()
    } else if (this.cause instanceof Error) {
      result.cause = {
        name: this.cause.name,
        message: this.cause.message,
        code: 'UNKNOWN',
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.MEDIUM,
        stack: this.cause.stack,
      }
    }

    return result
  }

  /**
   * 获取完整的错误消息（包含上下文）
   */
  getFullMessage(): string {
    const parts: string[] = [this.message]

    if (this.context.operation) {
      parts.unshift(`[${this.context.operation}]`)
    }

    if (this.context.component) {
      parts.unshift(`[${this.context.component}]`)
    }

    if (this.context.filePath) {
      let location = this.context.filePath
      if (this.context.line) {
        location += `:${this.context.line}`
        if (this.context.column) {
          location += `:${this.context.column}`
        }
      }
      parts.push(`at ${location}`)
    }

    return parts.join(' ')
  }

  /**
   * 获取错误链中的所有错误
   */
  getErrorChain(): Error[] {
    const chain: Error[] = [this]
    let current: Error | undefined = this.cause as Error | undefined

    while (current) {
      chain.push(current)
      current = (current as any).cause
    }

    return chain
  }
}

// ==================== 细化错误类 ====================

/**
 * 配置错误
 *
 * 用于配置文件加载、解析、验证等相关错误
 *
 * @example
 * ```typescript
 * throw new ConfigError(
 *   '配置文件语法错误',
 *   ErrorCode.CONFIG_INVALID_FORMAT,
 *   { filePath: 'launcher.config.ts', line: 10 }
 * )
 * ```
 */
export class ConfigError extends LauncherBaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.CONFIG_LOAD_FAILED,
    context: ErrorContext = {},
    cause?: Error,
  ) {
    super(message, code, ErrorCategory.CONFIG, context, cause)
    this.name = 'ConfigError'
  }

  /**
   * 创建配置未找到错误
   */
  static notFound(filePath: string, cause?: Error): ConfigError {
    return new ConfigError(
      `配置文件未找到: ${filePath}`,
      ErrorCode.CONFIG_NOT_FOUND,
      {
        filePath,
        severity: ErrorSeverity.HIGH,
        solutions: [
          '创建配置文件 launcher.config.ts 或 launcher.config.js',
          '使用 --config 参数指定配置文件路径',
          '检查文件路径是否正确',
        ],
        docsUrl: 'https://launcher.dev/docs/config',
      },
      cause,
    )
  }

  /**
   * 创建配置验证失败错误
   */
  static validationFailed(errors: string[], filePath?: string): ConfigError {
    return new ConfigError(
      `配置验证失败: ${errors.join('; ')}`,
      ErrorCode.CONFIG_VALIDATION_FAILED,
      {
        filePath,
        severity: ErrorSeverity.HIGH,
        metadata: { errors },
        solutions: [
          '检查配置项的类型和值是否正确',
          '参考文档了解配置选项的要求',
        ],
      },
    )
  }

  /**
   * 创建配置格式错误
   */
  static invalidFormat(filePath: string, detail: string, cause?: Error): ConfigError {
    return new ConfigError(
      `配置文件格式错误: ${detail}`,
      ErrorCode.CONFIG_INVALID_FORMAT,
      {
        filePath,
        severity: ErrorSeverity.HIGH,
        solutions: [
          '检查 JSON/JavaScript 语法',
          '确保导出正确的配置对象',
          '使用 TypeScript 获得更好的类型检查',
        ],
      },
      cause,
    )
  }
}

/**
 * 服务器错误
 *
 * 用于开发服务器和预览服务器相关错误
 *
 * @example
 * ```typescript
 * throw new ServerError(
 *   '端口 3000 已被占用',
 *   ErrorCode.PORT_IN_USE,
 *   { metadata: { port: 3000 } }
 * )
 * ```
 */
export class ServerError extends LauncherBaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.SERVER_START_FAILED,
    context: ErrorContext = {},
    cause?: Error,
  ) {
    super(message, code, ErrorCategory.NETWORK, context, cause)
    this.name = 'ServerError'
  }

  /**
   * 创建端口占用错误
   */
  static portInUse(port: number, cause?: Error): ServerError {
    return new ServerError(
      `端口 ${port} 已被占用`,
      ErrorCode.PORT_IN_USE,
      {
        severity: ErrorSeverity.MEDIUM,
        metadata: { port },
        solutions: [
          `使用不同的端口: launcher dev --port ${port + 1}`,
          '查找并终止占用端口的进程',
          '使用 --strictPort=false 自动选择可用端口',
        ],
      },
      cause,
    )
  }

  /**
   * 创建服务器启动失败错误
   */
  static startFailed(reason: string, cause?: Error): ServerError {
    return new ServerError(
      `服务器启动失败: ${reason}`,
      ErrorCode.SERVER_START_FAILED,
      {
        severity: ErrorSeverity.HIGH,
        solutions: [
          '检查网络配置',
          '确保没有防火墙阻止',
          '查看详细错误日志',
        ],
      },
      cause,
    )
  }

  /**
   * 创建 SSL 证书错误
   */
  static sslError(detail: string, cause?: Error): ServerError {
    return new ServerError(
      `SSL 证书错误: ${detail}`,
      ErrorCode.SSL_CERTIFICATE_ERROR,
      {
        severity: ErrorSeverity.MEDIUM,
        solutions: [
          '重新生成 SSL 证书',
          '检查证书文件权限',
          '使用 --https=false 禁用 HTTPS',
        ],
      },
      cause,
    )
  }
}

/**
 * 构建错误
 *
 * 用于生产构建相关错误
 *
 * @example
 * ```typescript
 * throw new BuildError(
 *   '模块解析失败',
 *   ErrorCode.MODULE_NOT_FOUND,
 *   { filePath: 'src/main.ts', metadata: { module: 'lodash' } }
 * )
 * ```
 */
export class BuildError extends LauncherBaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.BUILD_FAILED,
    context: ErrorContext = {},
    cause?: Error,
  ) {
    super(message, code, ErrorCategory.BUILD, context, cause)
    this.name = 'BuildError'
  }

  /**
   * 创建模块未找到错误
   */
  static moduleNotFound(moduleName: string, importedFrom?: string, cause?: Error): BuildError {
    let message = `模块未找到: ${moduleName}`
    if (importedFrom) {
      message += ` (从 ${importedFrom} 导入)`
    }

    return new BuildError(
      message,
      ErrorCode.MODULE_NOT_FOUND,
      {
        severity: ErrorSeverity.HIGH,
        metadata: { moduleName, importedFrom },
        solutions: [
          `安装依赖: npm install ${moduleName}`,
          '检查导入路径是否正确',
          '检查 tsconfig.json 路径别名配置',
        ],
      },
      cause,
    )
  }

  /**
   * 创建语法错误
   */
  static syntaxError(filePath: string, line: number, column: number, detail: string, cause?: Error): BuildError {
    return new BuildError(
      `语法错误: ${detail}`,
      ErrorCode.SYNTAX_ERROR,
      {
        filePath,
        line,
        column,
        severity: ErrorSeverity.HIGH,
        solutions: [
          '检查代码语法',
          '使用 IDE 的语法检查功能',
          '确保使用正确的文件扩展名',
        ],
      },
      cause,
    )
  }

  /**
   * 创建构建超时错误
   */
  static timeout(duration: number, cause?: Error): BuildError {
    return new BuildError(
      `构建超时 (${Math.round(duration / 1000)}秒)`,
      ErrorCode.BUILD_TIMEOUT,
      {
        severity: ErrorSeverity.HIGH,
        metadata: { duration },
        solutions: [
          '优化代码和依赖减少构建时间',
          '增加构建超时时间限制',
          '检查是否有死循环或无限递归',
        ],
      },
      cause,
    )
  }
}

/**
 * 插件错误
 *
 * 用于插件加载、执行相关错误
 *
 * @example
 * ```typescript
 * throw new PluginError(
 *   '插件执行失败',
 *   ErrorCode.PLUGIN_EXECUTION_FAILED,
 *   { metadata: { pluginName: 'my-plugin' } }
 * )
 * ```
 */
export class PluginError extends LauncherBaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.PLUGIN_EXECUTION_FAILED,
    context: ErrorContext = {},
    cause?: Error,
  ) {
    super(message, code, ErrorCategory.PLUGIN, context, cause)
    this.name = 'PluginError'
  }

  /**
   * 创建插件加载失败错误
   */
  static loadFailed(pluginName: string, reason: string, cause?: Error): PluginError {
    return new PluginError(
      `插件 "${pluginName}" 加载失败: ${reason}`,
      ErrorCode.PLUGIN_LOAD_FAILED,
      {
        severity: ErrorSeverity.MEDIUM,
        metadata: { pluginName },
        solutions: [
          `检查插件 "${pluginName}" 是否已安装`,
          '检查插件版本兼容性',
          '查看插件文档了解配置要求',
        ],
      },
      cause,
    )
  }

  /**
   * 创建插件版本不兼容错误
   */
  static versionIncompatible(pluginName: string, required: string, actual: string): PluginError {
    return new PluginError(
      `插件 "${pluginName}" 版本不兼容: 需要 ${required}, 实际 ${actual}`,
      ErrorCode.PLUGIN_VERSION_INCOMPATIBLE,
      {
        severity: ErrorSeverity.MEDIUM,
        metadata: { pluginName, required, actual },
        solutions: [
          `更新插件: npm update ${pluginName}`,
          '检查 package.json 中的版本约束',
          '查看插件更新日志了解变更',
        ],
      },
    )
  }

  /**
   * 创建插件冲突错误
   */
  static conflict(pluginNames: string[], reason: string): PluginError {
    return new PluginError(
      `插件冲突: ${pluginNames.join(', ')} - ${reason}`,
      ErrorCode.PLUGIN_CONFLICT,
      {
        severity: ErrorSeverity.MEDIUM,
        metadata: { pluginNames },
        solutions: [
          '移除冲突的插件之一',
          '检查插件配置是否有重叠',
          '查看插件文档了解兼容性',
        ],
      },
    )
  }
}

/**
 * 文件系统错误
 *
 * 用于文件读写、目录操作相关错误
 *
 * @example
 * ```typescript
 * throw new FileSystemError(
 *   '文件读取失败',
 *   ErrorCode.FILE_READ_FAILED,
 *   { filePath: '/path/to/file.ts' }
 * )
 * ```
 */
export class FileSystemError extends LauncherBaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.FILE_NOT_FOUND,
    context: ErrorContext = {},
    cause?: Error,
  ) {
    super(message, code, ErrorCategory.FILESYSTEM, context, cause)
    this.name = 'FileSystemError'
  }

  /**
   * 创建文件未找到错误
   */
  static fileNotFound(filePath: string, cause?: Error): FileSystemError {
    return new FileSystemError(
      `文件未找到: ${filePath}`,
      ErrorCode.FILE_NOT_FOUND,
      {
        filePath,
        severity: ErrorSeverity.MEDIUM,
        solutions: [
          '检查文件路径是否正确',
          '确保文件存在',
          '检查文件权限',
        ],
      },
      cause,
    )
  }

  /**
   * 创建文件权限错误
   */
  static permissionDenied(filePath: string, operation: string, cause?: Error): FileSystemError {
    return new FileSystemError(
      `权限不足: 无法${operation}文件 ${filePath}`,
      ErrorCode.FILE_PERMISSION_ERROR,
      {
        filePath,
        operation,
        severity: ErrorSeverity.HIGH,
        solutions: [
          '检查文件/目录权限',
          '以管理员身份运行',
          '检查文件是否被其他程序占用',
        ],
      },
      cause,
    )
  }

  /**
   * 创建磁盘空间不足错误
   */
  static diskSpaceInsufficient(required: number, available: number): FileSystemError {
    const formatSize = (bytes: number) => {
      const units = ['B', 'KB', 'MB', 'GB']
      let size = bytes
      let unitIndex = 0
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024
        unitIndex++
      }
      return `${size.toFixed(1)} ${units[unitIndex]}`
    }

    return new FileSystemError(
      `磁盘空间不足: 需要 ${formatSize(required)}, 可用 ${formatSize(available)}`,
      ErrorCode.DISK_SPACE_INSUFFICIENT,
      {
        severity: ErrorSeverity.CRITICAL,
        metadata: { required, available },
        solutions: [
          '清理磁盘空间',
          '删除不需要的文件和缓存',
          '更换输出目录到其他磁盘',
        ],
      },
    )
  }
}

/**
 * CLI 错误
 *
 * 用于命令行相关错误
 */
export class CLIError extends LauncherBaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.COMMAND_EXECUTION_FAILED,
    context: ErrorContext = {},
    cause?: Error,
  ) {
    super(message, code, ErrorCategory.USER_INPUT, context, cause)
    this.name = 'CLIError'
  }

  /**
   * 创建未知命令错误
   */
  static unknownCommand(command: string, suggestions?: string[]): CLIError {
    const error = new CLIError(
      `未知命令: ${command}`,
      ErrorCode.COMMAND_NOT_FOUND,
      {
        severity: ErrorSeverity.LOW,
        metadata: { command, suggestions },
        solutions: suggestions
          ? [`你是否想输入: ${suggestions.join(', ')}?`, '使用 --help 查看可用命令']
          : ['使用 --help 查看可用命令'],
      },
    )
    return error
  }

  /**
   * 创建参数无效错误
   */
  static invalidArgument(name: string, value: unknown, expected: string): CLIError {
    return new CLIError(
      `参数无效: ${name}=${String(value)}, 期望 ${expected}`,
      ErrorCode.INVALID_COMMAND_ARGUMENT,
      {
        severity: ErrorSeverity.LOW,
        metadata: { name, value, expected },
        solutions: [
          `提供正确的 ${name} 参数值`,
          '使用 --help 查看参数说明',
        ],
      },
    )
  }
}

// ==================== 工具函数 ====================

/**
 * 判断是否为 Launcher 错误
 *
 * @param error - 要检查的错误
 * @returns 是否为 LauncherBaseError 实例
 *
 * @example
 * ```typescript
 * try {
 *   await launcher.startDev()
 * } catch (error) {
 *   if (isLauncherError(error)) {
 *     console.log(error.code, error.category)
 *   }
 * }
 * ```
 */
export function isLauncherError(error: unknown): error is LauncherBaseError {
  return error instanceof LauncherBaseError
}

/**
 * 判断是否为特定类型的 Launcher 错误
 *
 * @param error - 要检查的错误
 * @param ErrorClass - 错误类构造函数
 * @returns 是否为指定类型的错误
 */
export function isErrorType<T extends LauncherBaseError>(
  error: unknown,
  ErrorClass: new (...args: any[]) => T,
): error is T {
  return error instanceof ErrorClass
}

/**
 * 包装错误为 Launcher 错误
 *
 * 将普通 Error 或未知错误包装为 LauncherBaseError
 *
 * @param error - 原始错误
 * @param context - 额外的上下文信息
 * @returns LauncherBaseError 实例
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation()
 * } catch (error) {
 *   throw wrapError(error, { operation: 'someOperation' })
 * }
 * ```
 */
export function wrapError(
  error: unknown,
  context: ErrorContext = {},
): LauncherBaseError {
  if (error instanceof LauncherBaseError) {
    // 如果已经是 LauncherBaseError，合并上下文
    return new LauncherBaseError(
      error.message,
      error.code,
      error.category,
      { ...error.context, ...context },
      error.cause as Error | undefined,
    )
  }

  if (error instanceof Error) {
    return new LauncherBaseError(
      error.message,
      ErrorCode.UNKNOWN_ERROR,
      ErrorCategory.SYSTEM,
      context,
      error,
    )
  }

  return new LauncherBaseError(
    String(error),
    ErrorCode.UNKNOWN_ERROR,
    ErrorCategory.SYSTEM,
    context,
  )
}

/**
 * 断言值非空
 *
 * @param value - 要检查的值
 * @param message - 错误消息
 * @throws LauncherBaseError 如果值为 null 或 undefined
 *
 * @example
 * ```typescript
 * const config = getConfig()
 * assertNonNull(config, '配置不能为空')
 * // config 现在类型为非空
 * ```
 */
export function assertNonNull<T>(
  value: T | null | undefined,
  message: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new LauncherBaseError(
      message,
      ErrorCode.INVALID_ARGUMENT,
      ErrorCategory.USER_INPUT,
      { severity: ErrorSeverity.HIGH },
    )
  }
}

/**
 * 断言条件为真
 *
 * @param condition - 要检查的条件
 * @param message - 错误消息
 * @param code - 错误码
 * @throws LauncherBaseError 如果条件为假
 */
export function assert(
  condition: boolean,
  message: string,
  code: ErrorCode = ErrorCode.INVALID_STATE,
): asserts condition {
  if (!condition) {
    throw new LauncherBaseError(
      message,
      code,
      ErrorCategory.SYSTEM,
      { severity: ErrorSeverity.HIGH },
    )
  }
}

/**
 * 获取错误消息
 *
 * 安全地从未知错误中提取错误消息
 *
 * @param error - 未知错误
 * @returns 错误消息字符串
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return String(error)
}

/**
 * 安全执行异步函数
 *
 * 包装异步函数，自动捕获错误并转换为 LauncherBaseError
 *
 * @param fn - 要执行的异步函数
 * @param context - 错误上下文
 * @returns Promise 包装的结果
 *
 * @example
 * ```typescript
 * const result = await safeAsync(
 *   async () => await loadConfig(),
 *   { operation: 'loadConfig' }
 * )
 * ```
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  context: ErrorContext = {},
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    throw wrapError(error, context)
  }
}

/**
 * 安全执行同步函数
 *
 * @param fn - 要执行的同步函数
 * @param context - 错误上下文
 * @returns 函数返回值
 */
export function safeSync<T>(
  fn: () => T,
  context: ErrorContext = {},
): T {
  try {
    return fn()
  } catch (error) {
    throw wrapError(error, context)
  }
}

/**
 * 创建错误工厂函数
 *
 * @param ErrorClass - 错误类构造函数
 * @param defaultCode - 默认错误码
 * @param defaultContext - 默认上下文
 * @returns 创建错误的工厂函数
 */
export function createErrorFactory<T extends LauncherBaseError>(
  ErrorClass: new (message: string, code: ErrorCode, context: ErrorContext, cause?: Error) => T,
  defaultCode: ErrorCode,
  defaultContext: Partial<ErrorContext> = {},
): (message: string, context?: ErrorContext, cause?: Error) => T {
  return (message: string, context: ErrorContext = {}, cause?: Error) => {
    return new ErrorClass(
      message,
      defaultCode,
      { ...defaultContext, ...context },
      cause,
    )
  }
}

// ==================== 导出 ====================

// 重新导出常量中的错误相关内容
export { ErrorCode, ErrorSeverity, ErrorCategory, ErrorRecoveryStrategy }
