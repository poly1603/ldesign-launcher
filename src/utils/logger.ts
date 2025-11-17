/**
 * 日志记录器
 * 
 * @author LDesign Team
 * @since 1.0.0
 */

import { createWriteStream, WriteStream } from 'fs'
import picocolors from 'picocolors'
import { performance } from 'perf_hooks'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent' | 'trace' | 'verbose'

export interface LoggerOptions {
  level?: LogLevel
  colors?: boolean
  timestamp?: boolean
  prefix?: string
  logFile?: string
  compact?: boolean // 简洁模式，减少冗余信息
  maxFileSize?: number // 日志文件最大大小（字节）
  maxLogHistory?: number // 保留的历史日志条数
  enablePerformance?: boolean // 是否启用性能追踪
  filter?: (level: LogLevel, message: string) => boolean // 日志过滤器
}

export interface LogMetadata {
  timestamp: number
  level: LogLevel
  message: string
  data?: any
  duration?: number
  memory?: { used: number; total: number }
  context?: string
}

export class Logger {
  private level: LogLevel
  private colors: boolean
  private timestamp: boolean
  private prefix: string
  private logFile?: string
  private fileStream?: WriteStream
  private compact: boolean
  private maxFileSize: number
  private maxLogHistory: number
  private enablePerformance: boolean
  private filter?: (level: LogLevel, message: string) => boolean
  private logHistory: LogMetadata[] = []
  private performanceMarks = new Map<string, number>()

  private readonly levels: Record<LogLevel, number> = {
    trace: -1,
    debug: 0,
    verbose: 0.5,
    info: 1,
    warn: 2,
    error: 3,
    silent: 4
  }

  constructor(name: string = 'Logger', options: LoggerOptions = {}) {
    this.level = options.level || 'info'
    this.colors = options.colors !== false
    this.timestamp = options.timestamp !== false
    this.prefix = options.prefix || name
    this.logFile = options.logFile
    this.compact = options.compact || false
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024 // 10MB 默认
    this.maxLogHistory = options.maxLogHistory || 1000
    this.enablePerformance = options.enablePerformance || false
    this.filter = options.filter

    if (this.logFile) {
      this.initFileStream()
    }

    // 启用性能监控时，记录初始化时间
    if (this.enablePerformance) {
      this.performanceMarks.set('init', performance.now())
    }
  }

  /**
   * 初始化文件流
   */
  private initFileStream(): void {
    if (this.logFile) {
      this.fileStream = createWriteStream(this.logFile, { flags: 'a' })
      this.checkFileSize()
    }
  }

  /**
   * 检查文件大小并轮转
   */
  private async checkFileSize(): Promise<void> {
    if (!this.logFile) return

    try {
      const { stat } = await import('fs/promises')
      const stats = await stat(this.logFile)
      
      if (stats.size > this.maxFileSize) {
        await this.rotateLogFile()
      }
    } catch (error) {
      // 文件不存在或其他错误，忽略
    }
  }

  /**
   * 轮转日志文件
   */
  private async rotateLogFile(): Promise<void> {
    if (!this.logFile) return

    try {
      const { rename } = await import('fs/promises')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupFile = `${this.logFile}.${timestamp}`
      
      // 关闭当前流
      if (this.fileStream) {
        this.fileStream.end()
      }
      
      // 重命名旧文件
      await rename(this.logFile, backupFile)
      
      // 创建新流
      this.initFileStream()
    } catch (error) {
      // 轮转失败，继续使用当前文件
      console.error('日志轮转失败:', error)
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.level]
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    let formatted = ''

    // 添加时间戳
    if (this.timestamp) {
      const now = new Date()
      const timeStr = now.toTimeString().slice(0, 8) // HH:MM:SS
      const msStr = String(now.getMilliseconds()).padStart(3, '0')
      const fullTimeStr = `${timeStr}.${msStr}`
      formatted += this.colors ? picocolors.gray(`[${fullTimeStr}]`) : `[${fullTimeStr}]`
      formatted += ' '
    }

    // 添加级别对应的emoji（简化输出）
    if (this.colors && !this.compact) {
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
    } else if (!this.colors) {
      // 无颜色模式下使用文字标识
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

    // 在compact模式下不显示额外数据，除非是错误
    if (data !== undefined && (!this.compact || level === 'error') && this.shouldShowSimpleData(data)) {
      formatted += ' ' + this.formatSimpleData(data)
    }

    return formatted
  }

  /**
   * 判断是否应该显示简单数据
   */
  private shouldShowSimpleData(data: any): boolean {
    // 只显示字符串和数字
    return typeof data === 'string' || typeof data === 'number'
  }

  /**
   * 格式化简单数据
   */
  private formatSimpleData(data: any): string {
    if (typeof data === 'string' || typeof data === 'number') {
      return String(data)
    }
    return ''
  }

  private log(level: LogLevel, message: string, data?: any): void {
    // 应用过滤器
    if (this.filter && !this.filter(level, message)) {
      return
    }

    if (!this.shouldLog(level)) {
      return
    }

    // 创建日志元数据
    const metadata: LogMetadata = {
      timestamp: Date.now(),
      level,
      message,
      data
    }

    // 添加内存信息（性能模式）
    if (this.enablePerformance && level === 'error') {
      const memUsage = process.memoryUsage()
      metadata.memory = {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024)
      }
    }

    // 保存到历史记录
    this.addToHistory(metadata)

    const formatted = this.formatMessage(level, message, data)

    // 输出到控制台
    switch (level) {
      case 'trace':
      case 'debug':
        console.debug(formatted)
        break
      case 'verbose':
      case 'info':
        console.log(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'error':
        console.error(formatted)
        break
    }

    // 输出到文件
    if (this.fileStream) {
      this.fileStream.write(formatted + '\n')
    }
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(metadata: LogMetadata): void {
    this.logHistory.push(metadata)
    
    // 限制历史记录数量
    if (this.logHistory.length > this.maxLogHistory) {
      this.logHistory.shift()
    }
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data)
  }

  info(message: string, data?: any): void {
    this.log('info', message, data)
  }

  success(message: string, data?: any): void {
    const successMessage = this.colors ? picocolors.green(message) : message
    this.log('info', successMessage, data)
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data)
  }

  error(message: string, data?: any): void {
    this.log('error', message, data)
  }

  setLevel(level: LogLevel): void {
    this.level = level
  }

  getLevel(): LogLevel {
    return this.level
  }

  setCompact(compact: boolean): void {
    this.compact = compact
  }

  getCompact(): boolean {
    return this.compact
  }

  /**
   * 记录性能标记
   */
  mark(name: string): void {
    if (this.enablePerformance) {
      this.performanceMarks.set(name, performance.now())
    }
  }

  /**
   * 测量两个标记之间的时间
   */
  measure(name: string, startMark: string, endMark?: string): number {
    if (!this.enablePerformance) return 0

    const start = this.performanceMarks.get(startMark)
    const end = endMark ? this.performanceMarks.get(endMark) : performance.now()

    if (start && end) {
      const duration = end - (start as number)
      this.debug(`Performance [${name}]: ${duration.toFixed(2)}ms`)
      return duration
    }

    return 0
  }

  /**
   * 计时器
   */
  time(label: string): void {
    this.mark(`timer_${label}`)
  }

  /**
   * 结束计时并记录
   */
  timeEnd(label: string): void {
    const duration = this.measure(label, `timer_${label}`)
    if (duration > 0) {
      this.info(`${label}: ${duration.toFixed(2)}ms`)
    }
  }

  /**
   * 获取历史日志
   */
  getHistory(filter?: { level?: LogLevel; limit?: number }): LogMetadata[] {
    let history = [...this.logHistory]

    if (filter?.level) {
      history = history.filter(log => log.level === filter.level)
    }

    if (filter?.limit) {
      history = history.slice(-filter.limit)
    }

    return history
  }

  /**
   * 清空历史记录
   */
  clearHistory(): void {
    this.logHistory = []
  }

  /**
   * 创建子日志器
   */
  child(name: string, options?: Partial<LoggerOptions>): Logger {
    return new Logger(`${this.prefix}:${name}`, {
      level: options?.level || this.level,
      colors: options?.colors ?? this.colors,
      timestamp: options?.timestamp ?? this.timestamp,
      logFile: options?.logFile || this.logFile,
      compact: options?.compact ?? this.compact,
      maxFileSize: options?.maxFileSize ?? this.maxFileSize,
      maxLogHistory: options?.maxLogHistory ?? this.maxLogHistory,
      enablePerformance: options?.enablePerformance ?? this.enablePerformance,
      filter: options?.filter || this.filter
    })
  }

  /**
   * 输出表格数据
   */
  table(data: any[], columns?: string[]): void {
    if (!this.shouldLog('info')) return

    if (this.colors) {
      console.table(data, columns)
    } else {
      // 无颜色模式下的简单表格输出
      this.info('Table data:', data)
    }
  }

  /**
   * 分组日志
   */
  group(label: string): void {
    if (!this.shouldLog('info')) return
    console.group(this.colors ? picocolors.bold(label) : label)
  }

  /**
   * 结束分组
   */
  groupEnd(): void {
    console.groupEnd()
  }

  /**
   * 追踪日志（trace 级别）
   */
  trace(message: string, data?: any): void {
    this.log('trace', message, data)
  }

  /**
   * 详细日志（verbose 级别）
   */
  verbose(message: string, data?: any): void {
    this.log('verbose', message, data)
  }

  close(): void {
    if (this.fileStream) {
      this.fileStream.end()
      this.fileStream = undefined
    }
    this.performanceMarks.clear()
    this.logHistory = []
  }
}

// 创建默认实例（使用简洁模式）
export const logger = new Logger('Launcher', {
  compact: process.env.NODE_ENV !== 'development'
})

// 便捷函数
export const debug = (message: string, data?: any) => logger.debug(message, data)
export const info = (message: string, data?: any) => logger.info(message, data)
export const success = (message: string, data?: any) => logger.success(message, data)
export const warn = (message: string, data?: any) => logger.warn(message, data)
export const error = (message: string, data?: any) => logger.error(message, data)
