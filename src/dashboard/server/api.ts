/**
 * Dashboard REST API
 * 提供项目管理、配置、模板等功能的 HTTP 接口
 */
import type { IncomingMessage, ServerResponse } from 'http'
import { promises as fs } from 'fs'
import path from 'path'
import { spawn, type ChildProcess } from 'child_process'
import { getDashboardWebSocket, type ProjectStatus } from './websocket'

// 进程管理
interface ProcessInfo {
  process: ChildProcess
  type: 'dev' | 'preview' | 'build'
  port?: number
}

const runningProcesses: Map<string, ProcessInfo> = new Map()

interface APIRequest extends IncomingMessage {
  body?: unknown
  params?: Record<string, string>
  query?: Record<string, string>
}

interface APIResponse extends ServerResponse {
  json: (data: unknown) => void
  error: (status: number, message: string) => void
}

type RouteHandler = (req: APIRequest, res: APIResponse) => Promise<void> | void

interface Route {
  method: string
  pattern: RegExp
  handler: RouteHandler
  params?: string[]
}

/**
 * Dashboard API 服务器
 */
export class DashboardAPI {
  private routes: Route[] = []

  constructor() {
    this.registerRoutes()
  }

  /**
   * 注册所有路由
   */
  private registerRoutes(): void {
    // 项目相关
    this.get('/api/projects', this.getProjects.bind(this))
    this.get('/api/projects/:id', this.getProject.bind(this))
    this.post('/api/projects/:id/start', this.startProject.bind(this))
    this.post('/api/projects/:id/stop', this.stopProject.bind(this))
    this.post('/api/projects/:id/restart', this.restartProject.bind(this))
    this.post('/api/projects/:id/build', this.buildProject.bind(this))
    this.post('/api/projects/scan', this.scanProjects.bind(this))

    // 配置相关
    this.get('/api/config/:id', this.getConfig.bind(this))
    this.put('/api/config/:id', this.updateConfig.bind(this))

    // 模板相关
    this.get('/api/templates', this.getTemplates.bind(this))
    this.post('/api/templates/create', this.createFromTemplate.bind(this))

    // 系统信息
    this.get('/api/system/info', this.getSystemInfo.bind(this))
    this.get('/api/system/health', this.healthCheck.bind(this))

    // 依赖分析
    this.get('/api/analyze/:id/dependencies', this.analyzeDependencies.bind(this))
    this.get('/api/analyze/:id/bundle', this.analyzeBundle.bind(this))

    // 项目操作 (当前目录)
    this.get('/api/project/detect', this.detectCurrentProject.bind(this))
    this.post('/api/action/dev', this.actionDev.bind(this))
    this.post('/api/action/build', this.actionBuild.bind(this))
    this.post('/api/action/preview', this.actionPreview.bind(this))
    this.post('/api/action/stop', this.actionStop.bind(this))
    
    // 配置保存
    this.post('/api/config/launcher', this.saveLauncherConfig.bind(this))
    this.post('/api/config/app', this.saveAppConfig.bind(this))
  }

  /**
   * 注册 GET 路由
   */
  private get(path: string, handler: RouteHandler): void {
    this.addRoute('GET', path, handler)
  }

  /**
   * 注册 POST 路由
   */
  private post(path: string, handler: RouteHandler): void {
    this.addRoute('POST', path, handler)
  }

  /**
   * 注册 PUT 路由
   */
  private put(path: string, handler: RouteHandler): void {
    this.addRoute('PUT', path, handler)
  }

  /**
   * 添加路由
   */
  private addRoute(method: string, path: string, handler: RouteHandler): void {
    const params: string[] = []
    const pattern = path.replace(/:(\w+)/g, (_, param) => {
      params.push(param)
      return '([^/]+)'
    })
    this.routes.push({
      method,
      pattern: new RegExp(`^${pattern}$`),
      handler,
      params,
    })
  }

  /**
   * 处理 HTTP 请求
   */
  async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const url = new URL(req.url || '/', `http://${req.headers.host}`)

    // 只处理 /api 开头的请求
    if (!url.pathname.startsWith('/api')) {
      return false
    }

    // 扩展 response
    const apiRes = res as APIResponse
    apiRes.json = (data: unknown) => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(data))
    }
    apiRes.error = (status: number, message: string) => {
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: message }))
    }

    // 解析请求体
    const apiReq = req as APIRequest
    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        apiReq.body = await this.parseBody(req)
      } catch {
        apiRes.error(400, 'Invalid JSON body')
        return true
      }
    }

    // 解析查询参数
    apiReq.query = Object.fromEntries(url.searchParams)

    // 匹配路由
    for (const route of this.routes) {
      if (route.method !== req.method) continue

      const match = url.pathname.match(route.pattern)
      if (match) {
        // 提取路径参数
        apiReq.params = {}
        route.params?.forEach((param, index) => {
          apiReq.params![param] = match[index + 1]
        })

        try {
          await route.handler(apiReq, apiRes)
        } catch (error) {
          console.error('[Dashboard API] Error:', error)
          apiRes.error(500, 'Internal server error')
        }
        return true
      }
    }

    apiRes.error(404, 'API endpoint not found')
    return true
  }

  /**
   * 解析请求体
   */
  private parseBody(req: IncomingMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
      let body = ''
      req.on('data', (chunk) => (body += chunk))
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {})
        } catch {
          reject(new Error('Invalid JSON'))
        }
      })
      req.on('error', reject)
    })
  }

  // ========== 项目管理 API ==========

  private async getProjects(_req: APIRequest, res: APIResponse): Promise<void> {
    const ws = getDashboardWebSocket()
    res.json({
      success: true,
      data: ws.getProjects(),
    })
  }

  private async getProject(req: APIRequest, res: APIResponse): Promise<void> {
    const ws = getDashboardWebSocket()
    const project = ws.getProjects().find((p) => p.id === req.params?.id)
    if (!project) {
      res.error(404, 'Project not found')
      return
    }
    res.json({ success: true, data: project })
  }

  private async startProject(req: APIRequest, res: APIResponse): Promise<void> {
    const projectId = req.params?.id
    const ws = getDashboardWebSocket()

    ws.emit('startProject', { projectId })
    ws.pushLog('info', `Starting project: ${projectId}`, projectId)

    res.json({ success: true, message: 'Project start requested' })
  }

  private async stopProject(req: APIRequest, res: APIResponse): Promise<void> {
    const projectId = req.params?.id
    const ws = getDashboardWebSocket()

    ws.emit('stopProject', { projectId })
    ws.pushLog('info', `Stopping project: ${projectId}`, projectId)

    res.json({ success: true, message: 'Project stop requested' })
  }

  private async restartProject(req: APIRequest, res: APIResponse): Promise<void> {
    const projectId = req.params?.id
    const ws = getDashboardWebSocket()

    ws.emit('restartProject', { projectId })
    ws.pushLog('info', `Restarting project: ${projectId}`, projectId)

    res.json({ success: true, message: 'Project restart requested' })
  }

  private async buildProject(req: APIRequest, res: APIResponse): Promise<void> {
    const projectId = req.params?.id
    const ws = getDashboardWebSocket()

    ws.emit('buildProject', { projectId })
    ws.pushLog('info', `Building project: ${projectId}`, projectId)

    res.json({ success: true, message: 'Build started' })
  }

  private async scanProjects(req: APIRequest, res: APIResponse): Promise<void> {
    const body = req.body as { directory?: string }
    const directory = body.directory || process.cwd()

    try {
      const projects = await this.findProjects(directory)
      res.json({ success: true, data: projects })
    } catch (error) {
      res.error(500, `Failed to scan: ${(error as Error).message}`)
    }
  }

  private async findProjects(directory: string): Promise<Partial<ProjectStatus>[]> {
    const projects: Partial<ProjectStatus>[] = []

    try {
      const entries = await fs.readdir(directory, { withFileTypes: true })

      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue
        }

        const projectPath = path.join(directory, entry.name)
        const packageJsonPath = path.join(projectPath, 'package.json')

        try {
          const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
          const framework = this.detectFramework(packageJson)

          projects.push({
            id: entry.name,
            name: packageJson.name || entry.name,
            path: projectPath,
            framework,
            status: 'stopped',
          })
        } catch {
          // 不是有效项目，跳过
        }
      }
    } catch {
      // 目录读取失败
    }

    return projects
  }

  private detectFramework(packageJson: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }): string {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

    if (deps.vue) return deps.vue.includes('2.') ? 'vue2' : 'vue3'
    if (deps.react) return 'react'
    if (deps.svelte) return 'svelte'
    if (deps['solid-js']) return 'solid'
    if (deps.preact) return 'preact'
    if (deps['@angular/core']) return 'angular'
    if (deps.astro) return 'astro'
    if (deps['@remix-run/react']) return 'remix'

    return 'vanilla'
  }

  // ========== 配置 API ==========

  private async getConfig(req: APIRequest, res: APIResponse): Promise<void> {
    const projectId = req.params?.id
    // 这里需要根据 projectId 获取项目路径并读取配置
    res.json({
      success: true,
      data: {
        projectId,
        config: {},
      },
    })
  }

  private async updateConfig(req: APIRequest, res: APIResponse): Promise<void> {
    const projectId = req.params?.id
    const config = req.body
    // 这里需要更新配置文件
    res.json({
      success: true,
      message: `Config updated for ${projectId}`,
      data: config,
    })
  }

  // ========== 模板 API ==========

  private async getTemplates(_req: APIRequest, res: APIResponse): Promise<void> {
    const templates = [
      { id: 'vue3', name: 'Vue 3', description: 'Vue 3 + TypeScript + Vite', icon: '🟢' },
      { id: 'react', name: 'React', description: 'React 18 + TypeScript + Vite', icon: '⚛️' },
      { id: 'svelte', name: 'Svelte', description: 'Svelte 4 + TypeScript + Vite', icon: '🔥' },
      { id: 'solid', name: 'Solid', description: 'SolidJS + TypeScript + Vite', icon: '💎' },
      { id: 'preact', name: 'Preact', description: 'Preact + TypeScript + Vite', icon: '⚡' },
      { id: 'vanilla', name: 'Vanilla', description: 'Vanilla TypeScript + Vite', icon: '🌟' },
    ]
    res.json({ success: true, data: templates })
  }

  private async createFromTemplate(req: APIRequest, res: APIResponse): Promise<void> {
    const body = req.body as { template: string; name: string; directory: string }
    // 这里需要实现模板创建逻辑
    res.json({
      success: true,
      message: `Project ${body.name} created from ${body.template} template`,
    })
  }

  // ========== 系统 API ==========

  private async getSystemInfo(_req: APIRequest, res: APIResponse): Promise<void> {
    const ws = getDashboardWebSocket()
    res.json({
      success: true,
      data: {
        version: '2.0.0',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        activeProjects: ws.getProjects().filter((p) => p.status === 'running').length,
        totalProjects: ws.getProjects().length,
        connections: ws.getConnectionCount(),
      },
    })
  }

  private async healthCheck(_req: APIRequest, res: APIResponse): Promise<void> {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: Date.now(),
    })
  }

  // ========== 分析 API ==========

  private async analyzeDependencies(req: APIRequest, res: APIResponse): Promise<void> {
    const projectId = req.params?.id
    // 这里需要实现依赖分析逻辑
    res.json({
      success: true,
      data: {
        projectId,
        dependencies: [],
        devDependencies: [],
        outdated: [],
        vulnerabilities: [],
      },
    })
  }

  private async analyzeBundle(req: APIRequest, res: APIResponse): Promise<void> {
    const projectId = req.params?.id
    // 这里需要实现包分析逻辑
    res.json({
      success: true,
      data: {
        projectId,
        totalSize: 0,
        chunks: [],
        assets: [],
      },
    })
  }

  // ========== 项目操作 API ==========

  private async detectCurrentProject(_req: APIRequest, res: APIResponse): Promise<void> {
    const cwd = process.cwd()
    const packageJsonPath = path.join(cwd, 'package.json')

    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(content)
      const framework = this.detectFramework(packageJson)
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
      
      res.json({
        success: true,
        data: {
          name: packageJson.name || path.basename(cwd),
          framework,
          version: deps[framework === 'vue3' ? 'vue' : framework === 'vue2' ? 'vue' : framework] || '',
          path: cwd,
        },
      })
    } catch {
      res.json({
        success: true,
        data: {
          name: path.basename(cwd),
          framework: 'vanilla',
          version: '',
          path: cwd,
        },
      })
    }
  }

  private async actionDev(req: APIRequest, res: APIResponse): Promise<void> {
    const body = req.body as { port?: number; host?: string; open?: boolean } || {}
    const ws = getDashboardWebSocket()
    const cwd = process.cwd()
    const port = body.port || 3000
    const host = body.host || 'localhost'
    
    // 先停止已有的 dev 进程
    this.killProcess('dev')
    
    ws.pushLog('info', `正在启动开发服务器...`)
    ws.pushLog('info', `工作目录: ${cwd}`)
    ws.pushLog('info', `端口: ${port}, 主机: ${host}`)
    
    try {
      // 使用 npx vite 或检测 package.json scripts
      const args = ['vite', '--port', String(port), '--host', host]
      if (body.open) args.push('--open')
      
      const child = spawn('npx', args, {
        cwd,
        shell: true,
        env: { ...process.env, FORCE_COLOR: '1' },
      })
      
      runningProcesses.set('dev', { process: child, type: 'dev', port })
      
      child.stdout?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(Boolean)
        lines.forEach(line => {
          // 清理 ANSI 颜色码
          const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim()
          if (cleanLine) {
            ws.pushLog('info', cleanLine)
          }
        })
      })
      
      child.stderr?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(Boolean)
        lines.forEach(line => {
          const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim()
          if (cleanLine) {
            // Vite 的一些输出可能在 stderr
            if (cleanLine.includes('error') || cleanLine.includes('Error')) {
              ws.pushLog('error', cleanLine)
            } else {
              ws.pushLog('warn', cleanLine)
            }
          }
        })
      })
      
      child.on('error', (err) => {
        ws.pushLog('error', `启动失败: ${err.message}`)
        runningProcesses.delete('dev')
      })
      
      child.on('close', (code) => {
        if (code !== 0 && code !== null) {
          ws.pushLog('warn', `开发服务器已退出 (code: ${code})`)
        }
        runningProcesses.delete('dev')
      })
      
      // 等待一小段时间确认启动成功
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      res.json({
        success: true,
        message: 'Dev server started',
        data: { port, host },
      })
    } catch (err) {
      ws.pushLog('error', `启动失败: ${(err as Error).message}`)
      res.json({
        success: false,
        error: (err as Error).message,
      })
    }
  }

  private async actionBuild(_req: APIRequest, res: APIResponse): Promise<void> {
    const ws = getDashboardWebSocket()
    const cwd = process.cwd()
    
    ws.pushLog('info', '开始构建项目...')
    ws.pushLog('info', `工作目录: ${cwd}`)
    ws.pushBuildProgress({ projectId: 'current', phase: 'start', progress: 0 })
    
    try {
      const child = spawn('npx', ['vite', 'build'], {
        cwd,
        shell: true,
        env: { ...process.env, FORCE_COLOR: '1' },
      })
      
      runningProcesses.set('build', { process: child, type: 'build' })
      
      child.stdout?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(Boolean)
        lines.forEach(line => {
          const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim()
          if (cleanLine) {
            ws.pushLog('info', cleanLine)
            // 解析构建进度
            if (cleanLine.includes('transforming')) {
              ws.pushBuildProgress({ projectId: 'current', phase: 'transform', progress: 30 })
            } else if (cleanLine.includes('rendering') || cleanLine.includes('bundling')) {
              ws.pushBuildProgress({ projectId: 'current', phase: 'bundle', progress: 60 })
            } else if (cleanLine.includes('computing gzip')) {
              ws.pushBuildProgress({ projectId: 'current', phase: 'write', progress: 90 })
            }
          }
        })
      })
      
      child.stderr?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(Boolean)
        lines.forEach(line => {
          const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim()
          if (cleanLine) {
            if (cleanLine.includes('error') || cleanLine.includes('Error')) {
              ws.pushLog('error', cleanLine)
            } else {
              ws.pushLog('warn', cleanLine)
            }
          }
        })
      })
      
      child.on('close', (code) => {
        runningProcesses.delete('build')
        if (code === 0) {
          ws.pushBuildProgress({ projectId: 'current', phase: 'done', progress: 100 })
          ws.pushLog('info', '✅ 构建完成！')
        } else {
          ws.pushLog('error', `构建失败 (code: ${code})`)
        }
      })
      
      res.json({
        success: true,
        message: 'Build started',
      })
    } catch (err) {
      ws.pushLog('error', `构建失败: ${(err as Error).message}`)
      res.json({
        success: false,
        error: (err as Error).message,
      })
    }
  }

  private async actionPreview(req: APIRequest, res: APIResponse): Promise<void> {
    const body = req.body as { port?: number } || {}
    const ws = getDashboardWebSocket()
    const cwd = process.cwd()
    const port = body.port || 4173
    
    // 先停止已有的预览进程
    this.killProcess('preview')
    
    ws.pushLog('info', `正在启动预览服务器...`)
    ws.pushLog('info', `工作目录: ${cwd}`)
    ws.pushLog('info', `端口: ${port}`)
    
    try {
      const child = spawn('npx', ['vite', 'preview', '--port', String(port)], {
        cwd,
        shell: true,
        env: { ...process.env, FORCE_COLOR: '1' },
      })
      
      runningProcesses.set('preview', { process: child, type: 'preview', port })
      
      child.stdout?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(Boolean)
        lines.forEach(line => {
          const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim()
          if (cleanLine) {
            ws.pushLog('info', cleanLine)
          }
        })
      })
      
      child.stderr?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(Boolean)
        lines.forEach(line => {
          const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim()
          if (cleanLine) {
            if (cleanLine.includes('error') || cleanLine.includes('Error')) {
              ws.pushLog('error', cleanLine)
            } else {
              ws.pushLog('warn', cleanLine)
            }
          }
        })
      })
      
      child.on('error', (err) => {
        ws.pushLog('error', `启动失败: ${err.message}`)
        runningProcesses.delete('preview')
      })
      
      child.on('close', (code) => {
        if (code !== 0 && code !== null) {
          ws.pushLog('warn', `预览服务器已退出 (code: ${code})`)
        }
        runningProcesses.delete('preview')
      })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      res.json({
        success: true,
        message: 'Preview server started',
        data: { port },
      })
    } catch (err) {
      ws.pushLog('error', `启动失败: ${(err as Error).message}`)
      res.json({
        success: false,
        error: (err as Error).message,
      })
    }
  }

  private async actionStop(_req: APIRequest, res: APIResponse): Promise<void> {
    const ws = getDashboardWebSocket()
    
    let stopped = false
    
    // 停止所有运行中的进程
    for (const [key, info] of runningProcesses.entries()) {
      ws.pushLog('info', `正在停止 ${info.type} 进程...`)
      this.killProcess(key)
      stopped = true
    }
    
    if (stopped) {
      ws.pushLog('info', '✅ 所有服务已停止')
    } else {
      ws.pushLog('info', '没有运行中的服务')
    }
    
    res.json({
      success: true,
      message: 'Server stopped',
    })
  }
  
  private killProcess(key: string): void {
    const info = runningProcesses.get(key)
    if (info) {
      try {
        // Windows 上需要用 taskkill 来杀死进程树
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', String(info.process.pid), '/f', '/t'], { shell: true })
        } else {
          info.process.kill('SIGTERM')
        }
        runningProcesses.delete(key)
      } catch {
        // 忽略错误
      }
    }
  }

  private async saveLauncherConfig(req: APIRequest, res: APIResponse): Promise<void> {
    const config = req.body
    const ws = getDashboardWebSocket()
    
    ws.pushLog('info', `保存 Launcher 配置: ${JSON.stringify(config)}`)
    
    // TODO: 实际保存到 launcher.config.ts
    res.json({
      success: true,
      message: 'Launcher config saved',
    })
  }

  private async saveAppConfig(req: APIRequest, res: APIResponse): Promise<void> {
    const config = req.body
    const ws = getDashboardWebSocket()
    
    ws.pushLog('info', `保存 App 配置: ${JSON.stringify(config)}`)
    
    // TODO: 实际保存到 app.config.ts
    res.json({
      success: true,
      message: 'App config saved',
    })
  }
}

// 单例
let apiInstance: DashboardAPI | null = null

export function getDashboardAPI(): DashboardAPI {
  if (!apiInstance) {
    apiInstance = new DashboardAPI()
  }
  return apiInstance
}
