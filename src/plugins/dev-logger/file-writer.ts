/**
 * 日志文件写入器
 * @description 将日志写入文件，支持文件轮转
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import type { DevLogLevel, FileWriterOptions, LogEntry } from './types'

/** 日志级别名称映射 */
const LEVEL_NAMES: Record<DevLogLevel, string> = {
  0: 'TRACE',
  10: 'DEBUG',
  20: 'INFO',
  30: 'WARN',
  40: 'ERROR',
  50: 'FATAL',
}

/**
 * 日志文件写入器
 */
export class LogFileWriter {
  private options: FileWriterOptions
  private currentFile: string | null = null
  private currentSize = 0
  private writeStream: fs.WriteStream | null = null

  constructor(options: Partial<FileWriterOptions> = {}) {
    this.options = {
      logDir: options.logDir || './logs',
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
      maxFiles: options.maxFiles || 5,
      filePrefix: options.filePrefix || 'app',
    }

    this.ensureLogDir()
  }

  /** 确保日志目录存在 */
  private ensureLogDir(): void {
    if (!fs.existsSync(this.options.logDir)) {
      fs.mkdirSync(this.options.logDir, { recursive: true })
    }
  }

  /** 生成日志文件名 */
  private generateFileName(): string {
    const date = new Date()
    const dateStr = date.toISOString().split('T')[0]
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-')
    return `${this.options.filePrefix}-${dateStr}_${timeStr}.log`
  }

  /** 获取当前写入流 */
  private getWriteStream(): fs.WriteStream {
    // 检查是否需要轮转
    if (this.writeStream && this.currentSize >= this.options.maxFileSize) {
      this.rotateFile()
    }

    if (!this.writeStream) {
      this.currentFile = path.join(this.options.logDir, this.generateFileName())
      this.writeStream = fs.createWriteStream(this.currentFile, { flags: 'a' })
      this.currentSize = 0

      // 写入文件头
      const header = `\n========== Log Session Started: ${new Date().toISOString()} ==========\n\n`
      this.writeStream.write(header)
      this.currentSize += Buffer.byteLength(header)

      // 清理旧文件
      this.cleanOldFiles()
    }

    return this.writeStream
  }

  /** 轮转日志文件 */
  private rotateFile(): void {
    if (this.writeStream) {
      const footer = `\n========== Log Session Ended: ${new Date().toISOString()} ==========\n`
      this.writeStream.write(footer)
      this.writeStream.end()
      this.writeStream = null
      this.currentFile = null
      this.currentSize = 0
    }
  }

  /** 清理旧日志文件 */
  private cleanOldFiles(): void {
    try {
      const files = fs.readdirSync(this.options.logDir)
        .filter(f => f.startsWith(this.options.filePrefix) && f.endsWith('.log'))
        .map(f => ({
          name: f,
          path: path.join(this.options.logDir, f),
          time: fs.statSync(path.join(this.options.logDir, f)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time)

      // 删除超出数量限制的旧文件
      while (files.length > this.options.maxFiles) {
        const oldFile = files.pop()
        if (oldFile) {
          fs.unlinkSync(oldFile.path)
        }
      }
    }
    catch {
      // 忽略清理错误
    }
  }

  /** 格式化日志条目为文本 */
  private formatEntry(entry: LogEntry): string {
    const time = new Date(entry.timestamp).toISOString()
    const level = LEVEL_NAMES[entry.level] || 'UNKNOWN'
    const source = entry.source ? `[${entry.source}]` : ''
    const tags = entry.tags?.length ? `{${entry.tags.join(', ')}}` : ''

    let line = `${time} ${level.padEnd(5)} ${source}${tags} ${entry.message}`

    if (entry.data) {
      line += `\n  Data: ${JSON.stringify(entry.data, null, 2).replace(/\n/g, '\n  ')}`
    }

    if (entry.error) {
      line += `\n  Error: ${entry.error.name}: ${entry.error.message}`
      if (entry.error.stack) {
        line += `\n  Stack:\n    ${entry.error.stack.replace(/\n/g, '\n    ')}`
      }
    }

    return line + '\n'
  }

  /** 写入日志条目 */
  write(entry: LogEntry): void {
    const stream = this.getWriteStream()
    const line = this.formatEntry(entry)
    stream.write(line)
    this.currentSize += Buffer.byteLength(line)
  }

  /** 批量写入日志条目 */
  writeBatch(entries: LogEntry[]): void {
    for (const entry of entries) {
      this.write(entry)
    }
  }

  /** 关闭写入器 */
  async close(): Promise<void> {
    if (this.writeStream) {
      return new Promise((resolve) => {
        const footer = `\n========== Log Session Ended: ${new Date().toISOString()} ==========\n`
        this.writeStream!.write(footer, () => {
          this.writeStream!.end(() => {
            this.writeStream = null
            resolve()
          })
        })
      })
    }
  }
}

