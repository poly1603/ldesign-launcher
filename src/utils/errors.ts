/**
 * 统一错误类定义
 * 
 * 为 launcher 提供统一的错误处理机制
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

/**
 * Launcher 基础错误类
 */
export class LauncherError extends Error {
  public readonly code: string
  public readonly context?: Record<string, unknown>
  public readonly suggestion?: string
  public readonly errorCause?: Error

  constructor(
    message: string,
    options?: {
      code?: string
      context?: Record<string, unknown>
      suggestion?: string
      cause?: Error
    }
  ) {
    super(message)
    this.name = 'LauncherError'
    this.code = options?.code || 'LAUNCHER_ERROR'
    this.context = options?.context
    this.suggestion = options?.suggestion

    // 保持原始错误链
    if (options?.cause) {
      this.errorCause = options.cause
    }

    // 确保正确的堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * 格式化错误消息
   */
  format(): string {
    let formatted = `[${this.code}] ${this.message}`

    if (this.context) {
      formatted += `\n上下文: ${JSON.stringify(this.context, null, 2)}`
    }

    if (this.suggestion) {
      formatted += `\n建议: ${this.suggestion}`
    }

    if (this.errorCause) {
      formatted += `\n原因: ${this.errorCause.message}`
    }

    return formatted
  }
}

/**
 * 配置错误
 */
export class ConfigError extends LauncherError {
  constructor(message: string, options?: Omit<ConstructorParameters<typeof LauncherError>[1], 'code'>) {
    super(message, { ...options, code: 'CONFIG_ERROR' })
    this.name = 'ConfigError'
  }
}

/**
 * 插件错误
 */
export class PluginError extends LauncherError {
  public readonly pluginName?: string

  constructor(
    message: string,
    options?: Omit<ConstructorParameters<typeof LauncherError>[1], 'code'> & {
      pluginName?: string
    }
  ) {
    super(message, { ...options, code: 'PLUGIN_ERROR' })
    this.name = 'PluginError'
    this.pluginName = options?.pluginName
  }
}

/**
 * 服务器错误
 */
export class ServerError extends LauncherError {
  public readonly port?: number
  public readonly host?: string

  constructor(
    message: string,
    options?: Omit<ConstructorParameters<typeof LauncherError>[1], 'code'> & {
      port?: number
      host?: string
    }
  ) {
    super(message, { ...options, code: 'SERVER_ERROR' })
    this.name = 'ServerError'
    this.port = options?.port
    this.host = options?.host
  }
}

/**
 * 构建错误
 */
export class BuildError extends LauncherError {
  constructor(message: string, options?: Omit<ConstructorParameters<typeof LauncherError>[1], 'code'>) {
    super(message, { ...options, code: 'BUILD_ERROR' })
    this.name = 'BuildError'
  }
}

/**
 * 验证错误
 */
export class ValidationError extends LauncherError {
  public readonly field?: string

  constructor(
    message: string,
    options?: Omit<ConstructorParameters<typeof LauncherError>[1], 'code'> & {
      field?: string
    }
  ) {
    super(message, { ...options, code: 'VALIDATION_ERROR' })
    this.name = 'ValidationError'
    this.field = options?.field
  }
}

/**
 * 网络错误
 */
export class NetworkError extends LauncherError {
  public readonly url?: string
  public readonly statusCode?: number

  constructor(
    message: string,
    options?: Omit<ConstructorParameters<typeof LauncherError>[1], 'code'> & {
      url?: string
      statusCode?: number
    }
  ) {
    super(message, { ...options, code: 'NETWORK_ERROR' })
    this.name = 'NetworkError'
    this.url = options?.url
    this.statusCode = options?.statusCode
  }
}

/**
 * 文件系统错误
 */
export class FileSystemError extends LauncherError {
  public readonly path?: string
  public readonly operation?: 'read' | 'write' | 'delete' | 'create'

  constructor(
    message: string,
    options?: Omit<ConstructorParameters<typeof LauncherError>[1], 'code'> & {
      path?: string
      operation?: 'read' | 'write' | 'delete' | 'create'
    }
  ) {
    super(message, { ...options, code: 'FILESYSTEM_ERROR' })
    this.name = 'FileSystemError'
    this.path = options?.path
    this.operation = options?.operation
  }
}

/**
 * 判断是否为 Launcher 错误
 */
export function isLauncherError(error: unknown): error is LauncherError {
  return error instanceof LauncherError
}

/**
 * 错误工厂函数
 */
export const createError = {
  config: (message: string, options?: Omit<ConstructorParameters<typeof ConfigError>[1], 'code'>) =>
    new ConfigError(message, options),

  plugin: (message: string, options?: Omit<ConstructorParameters<typeof PluginError>[1], 'code'>) =>
    new PluginError(message, options),

  server: (message: string, options?: Omit<ConstructorParameters<typeof ServerError>[1], 'code'>) =>
    new ServerError(message, options),

  build: (message: string, options?: Omit<ConstructorParameters<typeof BuildError>[1], 'code'>) =>
    new BuildError(message, options),

  validation: (message: string, options?: Omit<ConstructorParameters<typeof ValidationError>[1], 'code'>) =>
    new ValidationError(message, options),

  network: (message: string, options?: Omit<ConstructorParameters<typeof NetworkError>[1], 'code'>) =>
    new NetworkError(message, options),

  filesystem: (message: string, options?: Omit<ConstructorParameters<typeof FileSystemError>[1], 'code'>) =>
    new FileSystemError(message, options),
}


