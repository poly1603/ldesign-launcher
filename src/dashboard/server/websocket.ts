/**
 * Dashboard WebSocket 服务器
 * 用于实时推送日志、状态和性能数据
 */
import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'
import { EventEmitter } from 'events'

export interface WSMessage {
  type: 'log' | 'status' | 'performance' | 'error' | 'project' | 'build'
  payload: unknown
  timestamp: number
}

export interface ProjectStatus {
  id: string
  name: string
  path: string
  framework: string
  status: 'running' | 'stopped' | 'building' | 'error'
  port?: number
  pid?: number
  startTime?: number
  buildTime?: number
  memory?: number
}

export class DashboardWebSocket extends EventEmitter {
  private wss: WebSocketServer | null = null
  private clients: Set<WebSocket> = new Set()
  private projects: Map<string, ProjectStatus> = new Map()
  private logBuffer: WSMessage[] = []
  private maxLogBuffer = 1000

  /**
   * 启动 WebSocket 服务器
   */
  start(server: Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' })

    this.wss.on('connection', (ws) => {
      this.clients.add(ws)
      console.log(`[Dashboard WS] Client connected (total: ${this.clients.size})`)

      // 发送初始状态
      this.sendToClient(ws, {
        type: 'status',
        payload: {
          projects: Array.from(this.projects.values()),
          connected: true,
        },
        timestamp: Date.now(),
      })

      // 发送历史日志
      this.logBuffer.forEach((log) => this.sendToClient(ws, log))

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString())
          this.handleClientMessage(ws, message)
        } catch {
          console.error('[Dashboard WS] Invalid message received')
        }
      })

      ws.on('close', () => {
        this.clients.delete(ws)
        console.log(`[Dashboard WS] Client disconnected (total: ${this.clients.size})`)
      })

      ws.on('error', (error) => {
        console.error('[Dashboard WS] Client error:', error.message)
        this.clients.delete(ws)
      })
    })

    console.log('[Dashboard WS] WebSocket server started')
  }

  /**
   * 处理客户端消息
   */
  private handleClientMessage(ws: WebSocket, message: { action: string; payload?: unknown }): void {
    switch (message.action) {
      case 'ping':
        this.sendToClient(ws, { type: 'status', payload: { pong: true }, timestamp: Date.now() })
        break
      case 'getProjects':
        this.sendToClient(ws, {
          type: 'project',
          payload: Array.from(this.projects.values()),
          timestamp: Date.now(),
        })
        break
      case 'startProject':
        this.emit('startProject', message.payload)
        break
      case 'stopProject':
        this.emit('stopProject', message.payload)
        break
      case 'restartProject':
        this.emit('restartProject', message.payload)
        break
      case 'buildProject':
        this.emit('buildProject', message.payload)
        break
      default:
        console.warn('[Dashboard WS] Unknown action:', message.action)
    }
  }

  /**
   * 发送消息到单个客户端
   */
  private sendToClient(ws: WebSocket, message: WSMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  /**
   * 广播消息到所有客户端
   */
  broadcast(message: WSMessage): void {
    const data = JSON.stringify(message)
    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data)
      }
    })

    // 缓存日志消息
    if (message.type === 'log') {
      this.logBuffer.push(message)
      if (this.logBuffer.length > this.maxLogBuffer) {
        this.logBuffer.shift()
      }
    }
  }

  /**
   * 推送日志
   */
  pushLog(level: 'info' | 'warn' | 'error' | 'debug', message: string, projectId?: string): void {
    this.broadcast({
      type: 'log',
      payload: { level, message, projectId },
      timestamp: Date.now(),
    })
  }

  /**
   * 更新项目状态
   */
  updateProject(project: ProjectStatus): void {
    this.projects.set(project.id, project)
    this.broadcast({
      type: 'project',
      payload: project,
      timestamp: Date.now(),
    })
  }

  /**
   * 移除项目
   */
  removeProject(projectId: string): void {
    this.projects.delete(projectId)
    this.broadcast({
      type: 'project',
      payload: { id: projectId, removed: true },
      timestamp: Date.now(),
    })
  }

  /**
   * 推送性能数据
   */
  pushPerformance(data: {
    projectId: string
    memory: number
    cpu?: number
    requests?: number
    buildTime?: number
  }): void {
    this.broadcast({
      type: 'performance',
      payload: data,
      timestamp: Date.now(),
    })
  }

  /**
   * 推送构建进度
   */
  pushBuildProgress(data: {
    projectId: string
    phase: 'start' | 'transform' | 'bundle' | 'write' | 'done' | 'error'
    progress: number
    message?: string
  }): void {
    this.broadcast({
      type: 'build',
      payload: data,
      timestamp: Date.now(),
    })
  }

  /**
   * 获取所有项目
   */
  getProjects(): ProjectStatus[] {
    return Array.from(this.projects.values())
  }

  /**
   * 获取连接数
   */
  getConnectionCount(): number {
    return this.clients.size
  }

  /**
   * 关闭服务器
   */
  close(): void {
    this.clients.forEach((ws) => ws.close())
    this.clients.clear()
    this.wss?.close()
    this.wss = null
    console.log('[Dashboard WS] WebSocket server closed')
  }
}

// 单例实例
let instance: DashboardWebSocket | null = null

export function getDashboardWebSocket(): DashboardWebSocket {
  if (!instance) {
    instance = new DashboardWebSocket()
  }
  return instance
}

export function createDashboardWebSocket(): DashboardWebSocket {
  return new DashboardWebSocket()
}
