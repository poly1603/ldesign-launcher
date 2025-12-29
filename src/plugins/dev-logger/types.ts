/**
 * 开发日志插件类型定义
 */

/**
 * 开发日志级别
 * @description 用于开发日志桥接的日志级别枚举
 */
export enum DevLogLevel {
  TRACE = 0,
  DEBUG = 10,
  INFO = 20,
  WARN = 30,
  ERROR = 40,
  FATAL = 50,
}

/**
 * 日志条目
 */
export interface LogEntry {
  /** 日志 ID */
  id: string
  /** 时间戳 */
  timestamp: number
  /** 日志级别 */
  level: DevLogLevel
  /** 日志消息 */
  message: string
  /** 来源 */
  source?: string
  /** 标签 */
  tags?: string[]
  /** 附加数据 */
  data?: unknown
  /** 错误信息 */
  error?: {
    name: string
    message: string
    stack?: string
  }
  /** 堆栈信息 */
  stack?: string
}

/**
 * 桥接消息
 */
export interface BridgeMessage {
  /** 消息类型 */
  type: 'log' | 'batch' | 'ping' | 'pong'
  /** 日志条目或条目数组 */
  payload: LogEntry | LogEntry[]
  /** 时间戳 */
  timestamp: number
  /** 客户端 ID */
  clientId?: string
}

/**
 * 开发日志插件配置
 */
export interface DevLoggerPluginOptions {
  /** WebSocket 服务器端口 */
  port?: number
  /** WebSocket 路径 */
  path?: string
  /** 日志文件目录 */
  logDir?: string
  /** 单个日志文件最大大小（字节） */
  maxFileSize?: number
  /** 最大日志文件数量 */
  maxFiles?: number
  /** 日志文件前缀 */
  filePrefix?: string
  /** 是否启用控制台输出 */
  enableConsole?: boolean
  /** 最低日志级别 */
  minLevel?: DevLogLevel
  /** 是否启用 */
  enabled?: boolean
}

/**
 * 日志文件写入器配置
 */
export interface FileWriterOptions {
  /** 日志文件目录 */
  logDir: string
  /** 单个日志文件最大大小（字节） */
  maxFileSize: number
  /** 最大日志文件数量 */
  maxFiles: number
  /** 日志文件前缀 */
  filePrefix: string
}

/**
 * WebSocket 服务器配置
 */
export interface WebSocketServerOptions {
  /** 端口 */
  port: number
  /** 路径 */
  path: string
  /** 心跳间隔（毫秒） */
  heartbeatInterval?: number
}
