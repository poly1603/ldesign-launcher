/**
 * WebSocket 日志服务器
 * @description 接收前端日志并转发给文件写入器
 */

import { WebSocketServer, WebSocket } from 'ws'
import type { IncomingMessage } from 'node:http'
import type { BridgeMessage, LogEntry, WebSocketServerOptions } from './types'
import { LogFileWriter } from './file-writer'
import { createLogger } from '../../utils/logger'

/** 创建日志器实例 */
const logger = createLogger('DevLoggerWS')

/**
 * 开发日志 WebSocket 服务器
 */
export class DevLoggerWebSocketServer {
  private wss: WebSocketServer | null = null
  private fileWriter: LogFileWriter
  private options: WebSocketServerOptions
  private heartbeatTimer: NodeJS.Timeout | null = null
  private clients = new Set<WebSocket>()

  constructor(
    options: Partial<WebSocketServerOptions> = {},
    fileWriter?: LogFileWriter,
  ) {
    this.options = {
      port: options.port || 9527,
      path: options.path || '/__dev_logger',
      heartbeatInterval: options.heartbeatInterval || 30000,
    }
    this.fileWriter = fileWriter || new LogFileWriter()
  }

  /** 启动服务器 */
  start(): void {
    if (this.wss) {
      return
    }

    this.wss = new WebSocketServer({
      port: this.options.port,
      path: this.options.path,
    })

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req)
    })

    this.wss.on('error', (error) => {
      logger.error(`[DevLogger] WebSocket 服务器错误: ${error.message}`)
    })

    // 启动心跳检测
    this.startHeartbeat()

    logger.info(`[DevLogger] WebSocket 服务器已启动: ws://localhost:${this.options.port}${this.options.path}`)
  }

  /** 处理新连接 */
  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const clientIp = req.socket.remoteAddress || 'unknown'
    logger.debug(`[DevLogger] 新客户端连接: ${clientIp}`)

    this.clients.add(ws)

    ws.on('message', (data: Buffer) => {
      this.handleMessage(ws, data)
    })

    ws.on('close', () => {
      this.clients.delete(ws)
      logger.debug(`[DevLogger] 客户端断开连接: ${clientIp}`)
    })

    ws.on('error', (error) => {
      logger.error(`[DevLogger] 客户端错误: ${error.message}`)
      this.clients.delete(ws)
    })
  }

  /** 处理消息 */
  private handleMessage(_ws: WebSocket, data: Buffer): void {
    try {
      const message = JSON.parse(data.toString()) as BridgeMessage

      switch (message.type) {
        case 'log':
          this.handleLogEntry(message.payload as LogEntry)
          break
        case 'batch':
          this.handleBatchEntries(message.payload as LogEntry[])
          break
        case 'pong':
          // 心跳响应，不做处理
          break
        default:
          logger.warn(`[DevLogger] 未知消息类型: ${message.type}`)
      }
    }
    catch (error) {
      logger.error(`[DevLogger] 消息解析错误: ${(error as Error).message}`)
    }
  }

  /** 处理单条日志 */
  private handleLogEntry(entry: LogEntry): void {
    this.fileWriter.write(entry)
    this.outputToConsole(entry)
  }

  /** 处理批量日志 */
  private handleBatchEntries(entries: LogEntry[]): void {
    this.fileWriter.writeBatch(entries)
    for (const entry of entries) {
      this.outputToConsole(entry)
    }
  }

  /** 输出到控制台 */
  private outputToConsole(entry: LogEntry): void {
    const levelColors: Record<number, string> = {
      0: '\x1b[90m',  // TRACE - gray
      10: '\x1b[36m', // DEBUG - cyan
      20: '\x1b[32m', // INFO - green
      30: '\x1b[33m', // WARN - yellow
      40: '\x1b[31m', // ERROR - red
      50: '\x1b[35m', // FATAL - magenta
    }
    const reset = '\x1b[0m'
    const color = levelColors[entry.level] || reset
    const source = entry.source ? `[${entry.source}]` : ''
    console.log(`${color}[Browser]${source} ${entry.message}${reset}`)
  }

  /** 启动心跳检测 */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const pingMessage: BridgeMessage = {
        type: 'ping',
        payload: [],
        timestamp: Date.now(),
      }
      for (const client of this.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(pingMessage))
        }
      }
    }, this.options.heartbeatInterval)
  }

  /** 停止服务器 */
  async stop(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }

    for (const client of this.clients) {
      client.close()
    }
    this.clients.clear()

    if (this.wss) {
      await new Promise<void>((resolve) => {
        this.wss!.close(() => resolve())
      })
      this.wss = null
    }

    await this.fileWriter.close()
    logger.info('[DevLogger] WebSocket 服务器已停止')
  }
}

