/**
 * 日志记录器 (精简版)
 *
 * 删除了文件轮转、日志历史、性能追踪、子 logger、表格/分组输出等高级功能
 * 保留基础的日志级别、颜色输出、时间戳功能
 *
 * @author LDesign Team
 * @since 2.1.0
 */

/* eslint-disable no-console */

import picocolors from 'picocolors'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

export interface LoggerOptions {
  level?: LogLevel
  colors?: boolean
  timestamp?: boolean
  prefix?: string
  compact?: boolean // 简洁模式，减少冗余信息
}

/**
 * 日志记录器 (精简版)
 */
export class Logger {
  private level: LogLevel
  private colors: boolean
  private timestamp: boolean
  private prefix: string
  private compact: boolean

  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    silent: 4,
  }

  constructor(name: string = 'Logger', options: LoggerOptions = {}) {
    this.level = options.level || 'info'
    this.colors = options.colors !== false
    this.timestamp = options.timestamp !== false
    this.prefix = options.prefix || name
    this.compact = options.compact || false
  }

  /**
   * 判断是否应该输出日志
   */
  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.level]
  }

  /**
   * 时间戳缓存（每秒更新一次，避免频繁格式化）
   */
  private timestampCache: { value: string, expires: number } | null = null

  /**
   * 获取格式化的时间戳（带缓存）
   */
  private getFormattedTimestamp(): string {
    const now = Date.now()

    // 检查缓存是否有效（1秒内）
    if (this.timestampCache && now < this.timestampCache.expires) {
      return this.timestampCache.value
    }

    // 重新生成时间戳
    const date = new Date(now)
    const timeStr = date.toTimeString().slice(0, 8) // HH:MM:SS
    const msStr = String(date.getMilliseconds()).padStart(3, '0')
    const fullTimeStr = `${timeStr}.${msStr}`
    const formatted = this.colors ? picocolors.gray(`[${fullTimeStr}]`) : `[${fullTimeStr}]`

    // 缓存结果（1秒过期）
    this.timestampCache = {
      value: formatted,
      expires: now + 1000,
    }

    return formatted
  }

  /**
   * 格式化消息（优化版）
   */
  private formatMessage(level: LogLevel, message: string, data?: any): string {
    let formatted = ''

    // 添加时间戳（使用缓存）
    if (this.timestamp) {
      formatted += this.getFormattedTimestamp()
      formatted += ' '
    }

    // 添加级别标识
    if (this.colors) {
      switch (level) {
        case 'debug':
          formatted += '🔧 '
          break
        case 'info':
          formatted += 'ℹ️  '
          break
        case 'warn':
          formatted += '⚠️  '
          break
        case 'error':
          formatted += '❌ '
          break
      }
    }
    else {
      switch (level) {
        case 'debug':
          formatted += '[DEBUG] '
          break
        case 'info':
          formatted += '[INFO] '
          break
        case 'warn':
          formatted += '[WARN] '
          break
        case 'error':
          formatted += '[ERROR] '
          break
      }
    }

    formatted += message

    // 添加数据（如果有）
    if (data !== undefined) {
      formatted += ` ${this.formatData(data)}`
    }

    return formatted
  }

  /**
   * 格式化数据
   */
  private formatData(data: any): string {
    if (typeof data === 'string') {
      return data
    }

    if (data instanceof Error) {
      return this.colors ? picocolors.red(data.message) : data.message
    }

    try {
      return JSON.stringify(data)
    }
    catch {
      return String(data)
    }
  }

  /**
   * 应用颜色
   */
  private applyColor(level: LogLevel, message: string): string {
    if (!this.colors) {
      return message
    }

    switch (level) {
      case 'debug':
        return picocolors.cyan(message)
      case 'info':
        return message
      case 'warn':
        return picocolors.yellow(message)
      case 'error':
        return picocolors.red(message)
      default:
        return message
    }
  }

  /**
   * 输出日志
   */
  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) {
      return
    }

    const formatted = this.formatMessage(level, message, data)
    const colored = this.applyColor(level, formatted)

    // 根据级别选择输出流
    if (level === 'error') {
      console.error(colored)
    }
    else if (level === 'warn') {
      console.warn(colored)
    }
    else {
      console.log(colored)
    }
  }

  /**
   * Debug 级别日志
   */
  debug(message: string, data?: any): void {
    this.log('debug', message, data)
  }

  /**
   * Info 级别日志
   */
  info(message: string, data?: any): void {
    this.log('info', message, data)
  }

  /**
   * Warn 级别日志
   */
  warn(message: string, data?: any): void {
    this.log('warn', message, data)
  }

  /**
   * Error 级别日志
   */
  error(message: string, data?: any): void {
    this.log('error', message, data)
  }

  /**
   * Success 日志 (info 级别，绿色)
   */
  success(message: string, data?: any): void {
    if (!this.shouldLog('info')) {
      return
    }

    let formatted = ''
    if (this.timestamp) {
      const now = new Date()
      const timeStr = now.toTimeString().slice(0, 8)
      const msStr = String(now.getMilliseconds()).padStart(3, '0')
      formatted += this.colors ? picocolors.gray(`[${timeStr}.${msStr}]`) : `[${timeStr}.${msStr}]`
      formatted += ' '
    }

    formatted += this.colors ? '✅ ' : '[SUCCESS] '
    formatted += message

    if (data !== undefined) {
      formatted += ` ${this.formatData(data)}`
    }

    console.log(this.colors ? picocolors.green(formatted) : formatted)
  }

  /**
   * 获取当前日志级别
   */
  getLevel(): LogLevel {
    return this.level
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.level = level
  }

  /**
   * 是否启用颜色
   */
  isColorsEnabled(): boolean {
    return this.colors
  }

  /**
   * 设置颜色开关
   */
  setColors(enabled: boolean): void {
    this.colors = enabled
  }

  /**
   * 原样输出消息（无时间戳、无级别前缀），用于 ASCII 布局等 UI 输出
   */
  raw(message: string): void {
    // 遵守日志级别：silent 时不输出
    if (!this.shouldLog('info'))
      return

    console.log(message)
  }
}

/**
 * 创建 Logger 实例
 */
export function createLogger(name?: string, options?: LoggerOptions): Logger {
  return new Logger(name, options)
}
