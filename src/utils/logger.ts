/**
 * 日志记录器 (增强版)
 *
 * 支持表格输出、日志分组、spinner动画、进度条等高级功能
 * 保留基础的日志级别、颜色输出、时间戳功能
 *
 * 新增功能：
 * - 日志过滤（按模块名、关键词过滤）
 * - 日志缓冲区（批量输出优化性能）
 * - 日志统计信息
 *
 * @author LDesign Team
 * @since 2.1.0
 * @version 2.1.0
 */

/* eslint-disable no-console */

import type { Options as BoxenOptions } from 'boxen'
import type { Ora } from 'ora'
import ansiEscapes from 'ansi-escapes'
import boxen from 'boxen'
import chalk from 'chalk'
import Table from 'cli-table3'
import figures from 'figures'
import gradient from 'gradient-string'
import ora from 'ora'
import picocolors from 'picocolors'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

/**
 * 日志过滤器函数类型
 */
export type LogFilter = (level: LogLevel, message: string, data?: unknown) => boolean

/**
 * Logger 配置选项
 */
export interface LoggerOptions {
  /** 日志级别 */
  level?: LogLevel
  /** 是否启用颜色输出 */
  colors?: boolean
  /** 是否显示时间戳 */
  timestamp?: boolean
  /** 日志前缀 */
  prefix?: string
  /** 简洁模式，减少冗余信息 */
  compact?: boolean
  /** 自定义日志过滤器 */
  filter?: LogFilter
  /** 是否启用缓冲区（批量输出） */
  buffered?: boolean
  /** 缓冲区大小，默认 100 */
  bufferSize?: number
}

/**
 * 日志统计信息
 */
export interface LogStats {
  /** 各级别日志数量 */
  counts: Record<LogLevel, number>
  /** 开始时间 */
  startTime: number
  /** 最后日志时间 */
  lastLogTime: number
}

export interface TableColumn {
  header: string
  key: string
  width?: number
  align?: 'left' | 'center' | 'right'
}

export interface TableOptions {
  columns?: TableColumn[]
  style?: {
    head?: string[]
    border?: string[]
  }
}

/**
 * 日志记录器 (增强版)
 *
 * @example
 * ```typescript
 * // 基础用法
 * const logger = new Logger('MyModule')
 * logger.info('开始处理')
 * logger.error('出错了', { code: 'ERR_001' })
 *
 * // 带过滤器
 * const logger = new Logger('MyModule', {
 *   filter: (level, message) => !message.includes('debug'),
 * })
 *
 * // 缓冲模式
 * const logger = new Logger('MyModule', {
 *   buffered: true,
 *   bufferSize: 50,
 * })
 * ```
 */
export class Logger {
  private level: LogLevel
  private colors: boolean
  private timestamp: boolean
  private groupDepth: number = 0
  private activeSpinner: Ora | null = null
  private readonly name: string

  // 新增：日志过滤
  private filter: LogFilter | null = null

  // 新增：日志缓冲区
  private buffered: boolean = false
  private buffer: string[] = []
  private readonly bufferSize: number
  private flushTimer: ReturnType<typeof setTimeout> | null = null

  // 新增：日志统计
  private stats: LogStats = {
    counts: { debug: 0, info: 0, warn: 0, error: 0, silent: 0 },
    startTime: Date.now(),
    lastLogTime: Date.now(),
  }

  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    silent: 4,
  }

  /**
   * 创建 Logger 实例
   *
   * @param name - 日志器名称，用于标识日志来源
   * @param options - 配置选项
   */
  constructor(name: string = 'Logger', options: LoggerOptions = {}) {
    this.name = name
    this.level = options.level || 'info'
    this.colors = options.colors !== false
    this.timestamp = options.timestamp !== false
    this.filter = options.filter || null
    this.buffered = options.buffered || false
    this.bufferSize = options.bufferSize || 100
  }

  /**
   * 判断是否应该输出日志
   *
   * @param level - 日志级别
   * @param message - 日志消息（可选，用于过滤器）
   * @param data - 附加数据（可选，用于过滤器）
   */
  private shouldLog(level: LogLevel, message?: string, data?: unknown): boolean {
    // 检查级别
    if (this.levels[level] < this.levels[this.level]) {
      return false
    }

    // 检查自定义过滤器
    if (this.filter && message !== undefined) {
      return this.filter(level, message, data)
    }

    return true
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
   * Debug 级别日志
   */
  debug(message: string, data?: any): void {
    this.logWithIndent('debug', message, data)
  }

  /**
   * Info 级别日志
   */
  info(message: string, data?: any): void {
    this.logWithIndent('info', message, data)
  }

  /**
   * Warn 级别日志
   */
  warn(message: string, data?: any): void {
    this.logWithIndent('warn', message, data)
  }

  /**
   * Error 级别日志
   */
  error(message: string, data?: any): void {
    this.logWithIndent('error', message, data)
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
   * 获取 Logger 名称
   */
  getName(): string {
    return this.name
  }

  // ==================== 新增：日志过滤 ====================

  /**
   * 设置日志过滤器
   *
   * @param filter - 过滤器函数，返回 true 表示允许输出
   *
   * @example
   * ```typescript
   * // 过滤掉包含敏感信息的日志
   * logger.setFilter((level, message) => {
   *   return !message.includes('password')
   * })
   *
   * // 只输出特定模块的日志
   * logger.setFilter((level, message) => {
   *   return message.startsWith('[ConfigManager]')
   * })
   * ```
   */
  setFilter(filter: LogFilter | null): void {
    this.filter = filter
  }

  /**
   * 获取当前过滤器
   */
  getFilter(): LogFilter | null {
    return this.filter
  }

  /**
   * 清除过滤器
   */
  clearFilter(): void {
    this.filter = null
  }

  /**
   * 创建关键词过滤器
   *
   * @param keywords - 要过滤的关键词列表（包含任一关键词的日志会被过滤掉）
   * @param mode - 'exclude' 排除包含关键词的日志，'include' 只包含包含关键词的日志
   *
   * @example
   * ```typescript
   * // 排除包含敏感词的日志
   * logger.setKeywordFilter(['password', 'token', 'secret'], 'exclude')
   *
   * // 只显示配置相关的日志
   * logger.setKeywordFilter(['config', 'Config'], 'include')
   * ```
   */
  setKeywordFilter(keywords: string[], mode: 'exclude' | 'include' = 'exclude'): void {
    this.filter = (_level: LogLevel, message: string) => {
      const hasKeyword = keywords.some(kw =>
        message.toLowerCase().includes(kw.toLowerCase()),
      )
      return mode === 'exclude' ? !hasKeyword : hasKeyword
    }
  }

  // ==================== 新增：日志统计 ====================

  /**
   * 获取日志统计信息
   *
   * @returns 日志统计
   *
   * @example
   * ```typescript
   * const stats = logger.getStats()
   * console.log(`错误数: ${stats.counts.error}`)
   * console.log(`运行时间: ${Date.now() - stats.startTime}ms`)
   * ```
   */
  getStats(): LogStats {
    return { ...this.stats }
  }

  /**
   * 重置日志统计
   */
  resetStats(): void {
    this.stats = {
      counts: { debug: 0, info: 0, warn: 0, error: 0, silent: 0 },
      startTime: Date.now(),
      lastLogTime: Date.now(),
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(level: LogLevel): void {
    this.stats.counts[level]++
    this.stats.lastLogTime = Date.now()
  }

  // ==================== 新增：日志缓冲 ====================

  /**
   * 启用/禁用缓冲模式
   *
   * @param enabled - 是否启用
   */
  setBuffered(enabled: boolean): void {
    if (this.buffered && !enabled) {
      // 关闭缓冲时刷新
      this.flush()
    }
    this.buffered = enabled
  }

  /**
   * 刷新缓冲区到控制台
   */
  flush(): void {
    if (this.buffer.length === 0) return

    // 清除定时器
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }

    // 批量输出
    const output = this.buffer.join('\n')
    console.log(output)

    // 清空缓冲区
    this.buffer = []
  }

  /**
   * 添加到缓冲区或立即输出
   */
  private outputOrBuffer(output: string, level: LogLevel): void {
    if (this.buffered) {
      this.buffer.push(output)

      // 缓冲区满时自动刷新
      if (this.buffer.length >= this.bufferSize) {
        this.flush()
      } else if (!this.flushTimer) {
        // 设置定时刷新（100ms）
        this.flushTimer = setTimeout(() => this.flush(), 100)
      }
    } else {
      // 直接输出
      if (level === 'error') {
        console.error(output)
      } else if (level === 'warn') {
        console.warn(output)
      } else {
        console.log(output)
      }
    }
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

  /**
   * 输出表格
   */
  table(data: Array<Record<string, any>>, options?: TableOptions): void {
    if (!this.shouldLog('info'))
      return

    if (!data || data.length === 0) {
      this.warn('表格数据为空')
      return
    }

    try {
      // 自动提取列
      const columns: TableColumn[] = options?.columns || Object.keys(data[0]).map(key => ({
        header: key,
        key,
      }))

      // 创建表格
      const table = new Table({
        head: columns.map(col => col.header),
        style: {
          head: options?.style?.head || (this.colors ? ['cyan'] : []),
          border: options?.style?.border || (this.colors ? ['gray'] : []),
        },
        colWidths: columns.map(col => col.width || null) as (number | null)[],
        colAligns: columns.map(col => col.align || 'left') as any,
      })

      // 添加数据行
      data.forEach((row) => {
        const values = columns.map(col => String(row[col.key] ?? ''))
        table.push(values)
      })

      console.log(table.toString())
    }
    catch (error) {
      this.error('表格输出失败', { error: (error as Error).message })
    }
  }

  /**
   * 日志分组开始
   */
  group(label: string): void {
    if (!this.shouldLog('info'))
      return

    const indent = '  '.repeat(this.groupDepth)
    const symbol = this.colors ? figures.info : '[GROUP]'
    console.log(`${indent}${symbol} ${this.colors ? picocolors.bold(label) : label}`)
    this.groupDepth++
  }

  /**
   * 日志分组结束
   */
  groupEnd(): void {
    if (this.groupDepth > 0) {
      this.groupDepth--
    }
  }

  /**
   * 带自动结束的分组
   */
  groupCollapsed(label: string, callback: () => void): void {
    this.group(label)
    try {
      callback()
    }
    finally {
      this.groupEnd()
    }
  }

  /**
   * 创建 spinner 加载动画
   */
  spinner(text: string, options?: { spinner?: string }): Ora {
    // 停止之前的 spinner
    if (this.activeSpinner) {
      this.activeSpinner.stop()
    }

    this.activeSpinner = ora({
      text,
      spinner: options?.spinner as any || 'dots',
      color: 'cyan',
    }).start()

    return this.activeSpinner
  }

  /**
   * 停止当前 spinner
   */
  stopSpinner(symbol?: 'succeed' | 'fail' | 'warn' | 'info', text?: string): void {
    if (!this.activeSpinner)
      return

    if (symbol) {
      this.activeSpinner[symbol](text)
    }
    else {
      this.activeSpinner.stop()
    }

    this.activeSpinner = null
  }

  /**
   * 更新同一行内容（覆盖式输出）
   */
  updateLine(message: string): void {
    if (!this.shouldLog('info'))
      return

    // 使用 \r 回到行首，然后清除行内容
    process.stdout.write(`\r\x1B[K${message}`)
  }

  /**
   * 清除当前行
   */
  clearLine(): void {
    process.stdout.write('\r\x1B[K')
  }

  /**
   * 输出分隔线
   */
  divider(char: string = '─', length: number = 50): void {
    if (!this.shouldLog('info'))
      return

    const line = char.repeat(length)
    console.log(this.colors ? picocolors.gray(line) : line)
  }

  /**
   * 输出空行
   */
  newline(count: number = 1): void {
    if (!this.shouldLog('info'))
      return

    for (let i = 0; i < count; i++) {
      console.log()
    }
  }

  /**
   * 输出边框盒子
   */
  box(content: string, options?: BoxenOptions): void {
    if (!this.shouldLog('info'))
      return

    const boxOptions: BoxenOptions = {
      padding: 1,
      margin: { top: 1, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'cyan',
      ...options,
    }
    console.log(boxen(content, boxOptions))
  }

  /**
   * 输出渐变文字
   */
  gradient(text: string, colors?: string[]): void {
    if (!this.shouldLog('info'))
      return

    if (!this.colors) {
      console.log(text)
      return
    }

    const gradientColors = colors || ['#ff6b6b', '#4ecdc4', '#45b7d1']
    const gradientText = gradient(gradientColors)(text)
    console.log(gradientText)
  }

  /**
   * 清屏
   */
  clearScreen(): void {
    if (!this.shouldLog('info'))
      return

    console.log(ansiEscapes.clearScreen)
  }

  /**
   * 移动光标到指定位置
   */
  cursorTo(x: number, y?: number): void {
    if (y !== undefined) {
      process.stdout.write(ansiEscapes.cursorTo(x, y))
    }
    else {
      process.stdout.write(ansiEscapes.cursorTo(x))
    }
  }

  /**
   * 输出彩色文本（使用chalk）
   */
  color(text: string, color: string): string {
    if (!this.colors)
      return text

    // 支持链式调用，如 'bold.green'
    const parts = color.split('.')
    let result: any = chalk
    for (const part of parts) {
      result = result[part as keyof typeof chalk]
    }
    return typeof result === 'function' ? result(text) : text
  }

  /**
   * 输出图标（使用figures）
   */
  icon(name: keyof typeof figures): string {
    return this.colors ? figures[name] : `[${name.toUpperCase()}]`
  }

  /**
   * 输出带图标的消息
   */
  iconMsg(icon: keyof typeof figures, message: string, color?: string): void {
    if (!this.shouldLog('info'))
      return

    const iconChar = this.icon(icon)
    const msg = `${iconChar} ${message}`
    console.log(color ? this.color(msg, color) : msg)
  }

  /**
   * 带缩进的日志输出
   */
  private getIndent(): string {
    return '  '.repeat(this.groupDepth)
  }

  /**
   * 输出日志（增强版，支持缓冲、统计、过滤）
   */
  private logWithIndent(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level, message, data)) {
      return
    }

    // 更新统计
    this.updateStats(level)

    const indent = this.getIndent()
    const formatted = this.formatMessage(level, message, data)
    const colored = this.applyColor(level, formatted)
    const output = indent + colored

    // 使用缓冲或直接输出
    this.outputOrBuffer(output, level)
  }

  /**
   * 销毁 Logger，清理资源
   */
  destroy(): void {
    // 刷新缓冲区
    this.flush()

    // 停止 spinner
    if (this.activeSpinner) {
      this.activeSpinner.stop()
      this.activeSpinner = null
    }

    // 清除定时器
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
  }
}

/**
 * 创建 Logger 实例
 */
export function createLogger(name?: string, options?: LoggerOptions): Logger {
  return new Logger(name, options)
}
