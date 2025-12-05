/**
 * Dashboard 服务器入口
 * 整合 HTTP 服务器、WebSocket 和静态文件服务
 */
import { createServer, type Server } from 'http'
import { promises as fs } from 'fs'
import path from 'path'
import { getDashboardWebSocket, type DashboardWebSocket } from './websocket'
import { getDashboardAPI, type DashboardAPI } from './api'
import { getDashboardTemplate } from './dashboard-template'

interface DashboardServerOptions {
  port?: number
  host?: string
  open?: boolean
  staticDir?: string
}

/**
 * Dashboard 服务器
 */
export class DashboardServer {
  private server: Server | null = null
  private ws: DashboardWebSocket
  private api: DashboardAPI
  private options: Required<DashboardServerOptions>

  constructor(options: DashboardServerOptions = {}) {
    this.options = {
      port: options.port ?? 5555,
      host: options.host ?? '0.0.0.0',
      open: options.open ?? true,
      staticDir: options.staticDir ?? path.join(__dirname, '../client/dist'),
    }

    this.ws = getDashboardWebSocket()
    this.api = getDashboardAPI()

    // 监听项目操作事件
    this.setupEventHandlers()
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    this.ws.on('startProject', async (data: { projectId: string }) => {
      console.log(`[Dashboard] Start project requested: ${data.projectId}`)
      // 这里可以调用 ViteLauncher 启动项目
    })

    this.ws.on('stopProject', async (data: { projectId: string }) => {
      console.log(`[Dashboard] Stop project requested: ${data.projectId}`)
      // 这里可以停止项目进程
    })

    this.ws.on('restartProject', async (data: { projectId: string }) => {
      console.log(`[Dashboard] Restart project requested: ${data.projectId}`)
    })

    this.ws.on('buildProject', async (data: { projectId: string }) => {
      console.log(`[Dashboard] Build project requested: ${data.projectId}`)
    })
  }

  /**
   * 启动服务器
   */
  async start(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.server = createServer(async (req, res) => {
        // CORS 头
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        // 尝试处理 API 请求
        const handled = await this.api.handleRequest(req, res)
        if (handled) return

        // 静态文件服务
        await this.serveStatic(req, res)
      })

      // 启动 WebSocket
      this.ws.start(this.server)

      this.server.listen(this.options.port, this.options.host, () => {
        const url = `http://localhost:${this.options.port}`
        console.log(`\n🚀 Dashboard server running at ${url}\n`)

        if (this.options.open) {
          import('open').then(({ default: open }) => open(url)).catch(() => {})
        }

        resolve(url)
      })

      this.server.on('error', (error) => {
        reject(error)
      })
    })
  }

  /**
   * 静态文件服务
   */
  private async serveStatic(
    req: { url?: string },
    res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (d?: string | Buffer) => void }
  ): Promise<void> {
    const url = new URL(req.url || '/', 'http://localhost')
    let filePath = path.join(this.options.staticDir, url.pathname)

    // 默认 index.html
    if (url.pathname === '/' || url.pathname === '') {
      filePath = path.join(this.options.staticDir, 'index.html')
    }

    try {
      const stat = await fs.stat(filePath)
      if (stat.isDirectory()) {
        filePath = path.join(filePath, 'index.html')
      }

      const content = await fs.readFile(filePath)
      const ext = path.extname(filePath).toLowerCase()
      const mimeTypes: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
      }

      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
      res.end(content)
    } catch {
      // 对于 SPA，返回 index.html
      try {
        const indexPath = path.join(this.options.staticDir, 'index.html')
        const content = await fs.readFile(indexPath)
        res.setHeader('Content-Type', 'text/html')
        res.end(content)
      } catch {
        res.statusCode = 404
        res.setHeader('Content-Type', 'text/html')
        res.end(this.getEmbeddedHTML())
      }
    }
  }

  /**
   * 获取嵌入式 HTML（当静态文件不存在时使用）
   */
  private getEmbeddedHTML(): string {
    const cwd = process.cwd()
    const projectName = path.basename(cwd)
    return getDashboardTemplate(projectName, cwd)
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    this.ws.close()
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.server = null
          console.log('[Dashboard] Server stopped')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  /**
   * 获取 WebSocket 实例
   */
  getWebSocket(): DashboardWebSocket {
    return this.ws
  }
}

/**
 * 创建并启动 Dashboard 服务器
 */
export async function startDashboard(options?: DashboardServerOptions): Promise<DashboardServer> {
  const server = new DashboardServer(options)
  await server.start()
  return server
}

export { getDashboardWebSocket, getDashboardAPI }
export type { ProjectStatus } from './websocket'
export type { DashboardServerOptions }
