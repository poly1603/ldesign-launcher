/**
 * 日志记录器 (增强版)
 *
 * 支持表格输出、日志分组、spinner动画、进度条等高级功能
 * 保留基础的日志级别、颜色输出、时间戳功能
 *
 * @author LDesign Team
 * @since 2.1.0
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

export interface LoggerOptions {
  level?: LogLevel
  colors?: boolean
  timestamp?: boolean
  prefix?: string
  compact?: boolean // 简洁模式，减少冗余信息
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
 * 日志记录器 (精简版)
 */
export class Logger {
  private level: LogLevel
  private colors: boolean
  private timestamp: boolean
  private groupDepth: number = 0
  private activeSpinner: Ora | null = null

  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    silent: 4,
  }

  constructor(_name: string = 'Logger', options: LoggerOptions = {}) {
    this.level = options.level || 'info'
    this.colors = options.colors !== false
    this.timestamp = options.timestamp !== false
    // prefix 和 compact 参数保留用于未来扩展
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
   * 输出日志（覆盖原方法，添加缩进支持）
   */
  private logWithIndent(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) {
      return
    }

    const indent = this.getIndent()
    const formatted = this.formatMessage(level, message, data)
    const colored = this.applyColor(level, formatted)

    // 根据级别选择输出流
    if (level === 'error') {
      console.error(indent + colored)
    }
    else if (level === 'warn') {
      console.warn(indent + colored)
    }
    else {
      console.log(indent + colored)
    }
  }
}

/**
 * 创建 Logger 实例
 */
export function createLogger(name?: string, options?: LoggerOptions): Logger {
  return new Logger(name, options)
}
