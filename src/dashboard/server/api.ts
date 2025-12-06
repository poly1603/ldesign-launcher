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
  cwd?: string
  projectId?: string
}

// 项目运行状态
interface ProjectRunningState {
  id: string
  name: string
  path: string
  framework: string
  status: 'running' | 'stopped' | 'building' | 'error'
  port?: number
  pid?: number
  startTime?: number
}

const runningProcesses: Map<string, ProcessInfo> = new Map()
const projectStates: Map<string, ProjectRunningState> = new Map()

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
    
    // 配置读取和保存
    this.get('/api/config/launcher/current', this.getLauncherConfig.bind(this))
    this.post('/api/config/launcher', this.saveLauncherConfig.bind(this))
    this.post('/api/config/app', this.saveAppConfig.bind(this))
    
    // 多项目管理
    this.get('/api/workspace/projects', this.getWorkspaceProjects.bind(this))
    this.post('/api/workspace/scan', this.scanWorkspace.bind(this))
    this.post('/api/workspace/project/:id/dev', this.startProjectDev.bind(this))
    this.post('/api/workspace/project/:id/stop', this.stopProjectDev.bind(this))
    this.post('/api/workspace/project/:id/build', this.buildProjectDev.bind(this))
    this.get('/api/workspace/running', this.getRunningProjects.bind(this))
    
    // 工具箱
    this.get('/api/tools/check-port', this.checkPort.bind(this))
    this.post('/api/tools/clear-cache', this.clearCache.bind(this))
    this.get('/api/tools/dependencies', this.getDependencies.bind(this))
    this.post('/api/tools/reinstall', this.reinstallDependencies.bind(this))
    this.post('/api/tools/open-editor', this.openInEditor.bind(this))
    this.post('/api/tools/open-folder', this.openInFolder.bind(this))
    
    // 部署
    this.get('/api/deploy/platforms', this.getDeployPlatforms.bind(this))
    this.get('/api/deploy/configs', this.getDeployConfigs.bind(this))
    this.post('/api/deploy/configs', this.saveDeployConfig.bind(this))
    this.delete('/api/deploy/configs/:name', this.deleteDeployConfig.bind(this))
    this.post('/api/deploy/start', this.startDeploy.bind(this))
    this.post('/api/deploy/cancel', this.cancelDeploy.bind(this))
    this.get('/api/deploy/history', this.getDeployHistory.bind(this))
    this.get('/api/deploy/status', this.getDeployStatus.bind(this))
    
    // 分析
    this.get('/api/analyze/bundle', this.analyzeBundleApi.bind(this))
    this.get('/api/analyze/deps', this.analyzeDepsApi.bind(this))
    
    // 系统监控 (资源)
    this.get('/api/system/resources', this.getSystemResources.bind(this))
    
    // 脚本运行
    this.get('/api/scripts', this.getScripts.bind(this))
    this.post('/api/scripts/run', this.runScript.bind(this))
    this.post('/api/scripts/stop', this.stopScript.bind(this))
    
    // 环境变量
    this.get('/api/env/files', this.getEnvFiles.bind(this))
    this.get('/api/env/file/:name', this.getEnvFile.bind(this))
    this.post('/api/env/file/:name', this.saveEnvFile.bind(this))
    
    // 代码质量
    this.get('/api/quality/tools', this.getQualityTools.bind(this))
    this.post('/api/quality/check', this.runQualityCheck.bind(this))
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
   * 注册 DELETE 路由
   */
  private delete(path: string, handler: RouteHandler): void {
    this.addRoute('DELETE', path, handler)
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
    
    let serverStarted = false
    let actualPort = port
    
    try {
      // 使用 npx launcher dev 命令
      // 关键: 使用 --host 127.0.0.1 确保服务监听在IPv4上，否则Windows默认可能只监听IPv6
      ws.pushLog('info', `执行命令: npx launcher dev --port ${port} --host 127.0.0.1`)
      
      // Windows 下需要使用 cmd.exe 来运行 npx
      const isWindows = process.platform === 'win32'
      const child = isWindows
        ? spawn('cmd.exe', ['/c', 'npx', 'launcher', 'dev', '--port', String(port), '--host', '127.0.0.1'], {
            cwd,
            env: { ...process.env, FORCE_COLOR: '1' },
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: false,
          })
        : spawn('npx', ['launcher', 'dev', '--port', String(port), '--host', '127.0.0.1'], {
            cwd,
            env: { ...process.env, FORCE_COLOR: '1' },
            stdio: ['pipe', 'pipe', 'pipe'],
          })
      
      runningProcesses.set('dev', { process: child, type: 'dev', port })
      
      child.stdout?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(Boolean)
        lines.forEach(line => {
          const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim()
          if (cleanLine) {
            ws.pushLog('info', cleanLine)
            // 检测服务器是否真正启动成功 - 支持中英文输出
            // 英文: "Local: http://localhost:3000"
            // 中文: "本地地址:" 或包含 localhost 的 http URL
            if ((cleanLine.includes('Local:') || cleanLine.includes('本地') || cleanLine.includes('localhost')) && cleanLine.includes('http')) {
              serverStarted = true
              // 提取实际端口
              const portMatch = cleanLine.match(/:(\d+)/)
              if (portMatch) actualPort = parseInt(portMatch[1], 10)
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
      
      // 等待服务器启动，最多等15秒
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 500))
        if (serverStarted) {
          ws.pushLog('info', `✅ 服务器启动成功，端口: ${actualPort}`)
          break
        }
      }
      
      // 验证端口是否真的在监听
      if (serverStarted) {
        try {
          const testUrl = `http://localhost:${actualPort}`
          ws.pushLog('info', `验证服务可访问性: ${testUrl}`)
          // 简单的连接测试
          const http = await import('http')
          await new Promise<void>((resolve) => {
            const req = http.request(testUrl, { method: 'HEAD', timeout: 3000 }, (response) => {
              ws.pushLog('info', `✅ 服务验证成功 (HTTP ${response.statusCode})`)
              resolve()
            })
            req.on('error', () => {
              ws.pushLog('warn', `服务验证失败，但进程仍在运行`)
              resolve() // 不阻止，进程可能还在初始化
            })
            req.on('timeout', () => {
              req.destroy()
              resolve()
            })
            req.end()
          })
        } catch {
          // 忽略验证错误
        }
      }
      
      res.json({
        success: true,
        message: serverStarted ? 'Dev server started' : 'Dev server starting...',
        data: { port: actualPort, host, started: serverStarted },
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
      // 使用 pnpm run build 调用项目的 launcher 脚本
      const child = spawn('pnpm', ['run', 'build'], {
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
            } else if (cleanLine.includes('computing gzip') || cleanLine.includes('built in')) {
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
          ws.pushLog('info', '✅ 构建完成！输出目录: dist/')
        } else {
          ws.pushBuildProgress({ projectId: 'current', phase: 'error', progress: 0 })
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
    
    let serverStarted = false
    let actualPort = port
    
    try {
      // 使用 npx launcher preview，添加 --host 127.0.0.1 确保IPv4监听
      ws.pushLog('info', `执行命令: npx launcher preview --port ${port} --host 127.0.0.1`)
      
      const isWindows = process.platform === 'win32'
      const child = isWindows
        ? spawn('cmd.exe', ['/c', 'npx', 'launcher', 'preview', '--port', String(port), '--host', '127.0.0.1'], {
            cwd,
            env: { ...process.env, FORCE_COLOR: '1' },
            stdio: ['pipe', 'pipe', 'pipe'],
          })
        : spawn('npx', ['launcher', 'preview', '--port', String(port), '--host', '127.0.0.1'], {
            cwd,
            env: { ...process.env, FORCE_COLOR: '1' },
            stdio: ['pipe', 'pipe', 'pipe'],
          })
      
      runningProcesses.set('preview', { process: child, type: 'preview', port })
      
      child.stdout?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(Boolean)
        lines.forEach(line => {
          const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim()
          if (cleanLine) {
            ws.pushLog('info', cleanLine)
            // 检测预览服务器是否真正启动成功
            if (cleanLine.includes('Local:') && cleanLine.includes('http')) {
              serverStarted = true
              const portMatch = cleanLine.match(/:(\d+)/)
              if (portMatch) actualPort = parseInt(portMatch[1], 10)
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
      
      // 等待服务器启动，最多等10秒
      for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 500))
        if (serverStarted) break
      }
      
      if (serverStarted) {
        res.json({
          success: true,
          message: 'Preview server started',
          data: { port: actualPort },
        })
      } else {
        res.json({
          success: true,
          message: 'Preview server starting...',
          data: { port },
        })
      }
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

  private async getLauncherConfig(_req: APIRequest, res: APIResponse): Promise<void> {
    const cwd = process.cwd()
    
    try {
      // 尝试读取 launcher.config.ts 或 launcher.config.js
      const configFiles = ['launcher.config.ts', 'launcher.config.js', 'launcher.config.mjs']
      let configData: any = null
      
      for (const file of configFiles) {
        const configPath = path.join(cwd, file)
        try {
          await fs.access(configPath)
          // 读取配置文件内容
          const content = await fs.readFile(configPath, 'utf-8')
          // 简单解析配置 - 提取 server, build 等对象
          const serverMatch = content.match(/server\s*:\s*\{([^}]+)\}/s)
          const buildMatch = content.match(/build\s*:\s*\{([^}]+)\}/s)
          const baseMatch = content.match(/base\s*:\s*['"]([^'"]+)['"]/)
          
          configData = {
            server: serverMatch ? this.parseSimpleConfig(serverMatch[1]) : {},
            build: buildMatch ? this.parseSimpleConfig(buildMatch[1]) : {},
            base: baseMatch ? baseMatch[1] : '/',
          }
          break
        } catch {
          continue
        }
      }
      
      res.json({
        success: true,
        data: configData || {
          server: { port: 3000, host: 'localhost', strictPort: false, open: true },
          build: { outDir: 'dist', assetsDir: 'assets', sourcemap: false, minify: 'esbuild' },
          base: '/',
          logLevel: 'info',
          clearScreen: true,
        }
      })
    } catch (error) {
      res.json({
        success: true,
        data: {
          server: { port: 3000, host: 'localhost', strictPort: false, open: true },
          build: { outDir: 'dist', assetsDir: 'assets', sourcemap: false, minify: 'esbuild' },
          base: '/',
          logLevel: 'info',
          clearScreen: true,
        }
      })
    }
  }
  
  private parseSimpleConfig(configStr: string): Record<string, any> {
    const result: Record<string, any> = {}
    // 简单解析 key: value 格式
    const matches = configStr.matchAll(/(\w+)\s*:\s*(?:['"]([^'"]+)['"]|(\d+)|(\w+))/g)
    for (const match of matches) {
      const key = match[1]
      const value = match[2] || (match[3] ? parseInt(match[3]) : match[4])
      if (value === 'true') result[key] = true
      else if (value === 'false') result[key] = false
      else result[key] = value
    }
    return result
  }

  private async saveLauncherConfig(req: APIRequest, res: APIResponse): Promise<void> {
    const config = req.body as {
      server?: { port?: number; host?: string; strictPort?: boolean; open?: boolean; https?: boolean }
      build?: { outDir?: string; assetsDir?: string; sourcemap?: string | boolean; minify?: string | boolean }
      base?: string
      logLevel?: string
      clearScreen?: boolean
      proxyRules?: Array<{path: string, target: string, rewrite: boolean, ws: boolean}>
    }
    const ws = getDashboardWebSocket()
    const cwd = process.cwd()
    
    ws.pushLog('info', `保存 Launcher 配置...`)
    
    try {
      // 生成配置文件内容
      const proxyRules = config.proxyRules || []
      const proxyConfig = proxyRules.length > 0 ? this.generateProxyConfig(proxyRules) : ''
      
      const configContent = `import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  server: {
    port: ${config.server?.port || 3000},
    host: '${config.server?.host || 'localhost'}',
    strictPort: ${config.server?.strictPort || false},
    open: ${config.server?.open !== false},
    https: ${config.server?.https || false},${proxyConfig}
  },
  build: {
    outDir: '${config.build?.outDir || 'dist'}',
    assetsDir: '${config.build?.assetsDir || 'assets'}',
    sourcemap: ${config.build?.sourcemap === 'true' ? true : config.build?.sourcemap === 'hidden' ? "'hidden'" : false},
    minify: ${config.build?.minify === 'false' ? false : `'${config.build?.minify || 'esbuild'}'`},
  },
  base: '${config.base || '/'}',
  logLevel: '${config.logLevel || 'info'}',
  clearScreen: ${config.clearScreen !== false},
})
`
      
      const configPath = path.join(cwd, 'launcher.config.ts')
      await fs.writeFile(configPath, configContent, 'utf-8')
      
      ws.pushLog('info', `✅ Launcher 配置已保存到 ${configPath}`)
      res.json({
        success: true,
        message: 'Launcher config saved',
      })
    } catch (error) {
      ws.pushLog('error', `保存配置失败: ${(error as Error).message}`)
      res.json({
        success: false,
        message: (error as Error).message,
      })
    }
  }
  
  private generateProxyConfig(rules: Array<{path: string, target: string, rewrite: boolean, ws: boolean}>): string {
    if (rules.length === 0) return ''
    
    const proxyEntries = rules.map(rule => {
      const rewriteStr = rule.rewrite ? `\n        rewrite: (path) => path.replace(/^${rule.path.replace(/\//g, '\\/')}/, ''),` : ''
      return `      '${rule.path}': {
        target: '${rule.target}',
        changeOrigin: true,${rewriteStr}
        ws: ${rule.ws},
      },`
    }).join('\n')
    
    return `
    proxy: {
${proxyEntries}
    },`
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

  // ========== 多项目管理 API ==========

  private async getWorkspaceProjects(_req: APIRequest, res: APIResponse): Promise<void> {
    const projects = Array.from(projectStates.values())
    res.json({
      success: true,
      data: projects,
    })
  }

  private async scanWorkspace(req: APIRequest, res: APIResponse): Promise<void> {
    const body = req.body as { directory?: string }
    const directory = body.directory || path.join(process.cwd(), 'examples')
    const ws = getDashboardWebSocket()

    ws.pushLog('info', `扫描项目目录: ${directory}`)

    try {
      const entries = await fs.readdir(directory, { withFileTypes: true })
      const projects: ProjectRunningState[] = []

      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue
        }

        const projectPath = path.join(directory, entry.name)
        const packageJsonPath = path.join(projectPath, 'package.json')

        try {
          const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
          const framework = this.detectFramework(packageJson)
          
          // 检查是否已在运行
          const existingState = projectStates.get(entry.name)
          
          const projectState: ProjectRunningState = {
            id: entry.name,
            name: packageJson.name || entry.name,
            path: projectPath,
            framework,
            status: existingState?.status || 'stopped',
            port: existingState?.port,
            pid: existingState?.pid,
            startTime: existingState?.startTime,
          }

          projects.push(projectState)
          projectStates.set(entry.name, projectState)

          ws.pushLog('info', `发现项目: ${projectState.name} (${framework})`)
        } catch {
          // 不是有效项目，跳过
        }
      }

      res.json({ success: true, data: projects })
    } catch (error) {
      ws.pushLog('error', `扫描失败: ${(error as Error).message}`)
      res.json({ success: false, error: (error as Error).message })
    }
  }

  private async startProjectDev(req: APIRequest, res: APIResponse): Promise<void> {
    const projectId = req.params?.id
    const body = req.body as { port?: number } || {}
    const ws = getDashboardWebSocket()
    
    if (!projectId) {
      res.json({ success: false, error: 'Project ID required' })
      return
    }

    const project = projectStates.get(projectId)
    if (!project) {
      res.json({ success: false, error: 'Project not found' })
      return
    }

    // 检查是否已在运行
    const runningKey = `dev-${projectId}`
    if (runningProcesses.has(runningKey)) {
      res.json({ success: false, error: 'Project already running' })
      return
    }

    const port = body.port || (3000 + Math.floor(Math.random() * 1000))
    ws.pushLog('info', `启动项目 ${project.name}...`, projectId)
    ws.pushLog('info', `工作目录: ${project.path}`, projectId)
    ws.pushLog('info', `端口: ${port}`, projectId)

    try {
      // 先安装依赖（如果需要）
      const nodeModulesPath = path.join(project.path, 'node_modules')
      try {
        await fs.access(nodeModulesPath)
      } catch {
        ws.pushLog('info', `安装依赖中...`, projectId)
        await new Promise<void>((resolve, reject) => {
          const install = spawn('pnpm', ['install'], {
            cwd: project.path,
            shell: true,
          })
          install.on('close', (code) => {
            if (code === 0) resolve()
            else reject(new Error(`Install failed with code ${code}`))
          })
          install.on('error', reject)
        })
        ws.pushLog('info', `依赖安装完成`, projectId)
      }

      // 启动开发服务器
      const child = spawn('npx', ['vite', '--port', String(port), '--host', 'localhost'], {
        cwd: project.path,
        shell: true,
        env: { ...process.env, FORCE_COLOR: '1' },
      })

      runningProcesses.set(runningKey, {
        process: child,
        type: 'dev',
        port,
        cwd: project.path,
        projectId,
      })

      // 更新项目状态
      project.status = 'running'
      project.port = port
      project.pid = child.pid
      project.startTime = Date.now()
      projectStates.set(projectId, project)

      child.stdout?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(Boolean)
        lines.forEach(line => {
          const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim()
          if (cleanLine) {
            ws.pushLog('info', `[${project.name}] ${cleanLine}`, projectId)
          }
        })
      })

      child.stderr?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(Boolean)
        lines.forEach(line => {
          const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim()
          if (cleanLine) {
            if (cleanLine.includes('error') || cleanLine.includes('Error')) {
              ws.pushLog('error', `[${project.name}] ${cleanLine}`, projectId)
            } else {
              ws.pushLog('warn', `[${project.name}] ${cleanLine}`, projectId)
            }
          }
        })
      })

      child.on('error', (err) => {
        ws.pushLog('error', `[${project.name}] 启动失败: ${err.message}`, projectId)
        runningProcesses.delete(runningKey)
        project.status = 'error'
        projectStates.set(projectId, project)
      })

      child.on('close', (code) => {
        if (code !== 0 && code !== null) {
          ws.pushLog('warn', `[${project.name}] 进程已退出 (code: ${code})`, projectId)
        }
        runningProcesses.delete(runningKey)
        project.status = 'stopped'
        project.port = undefined
        project.pid = undefined
        projectStates.set(projectId, project)
      })

      // 等待启动
      await new Promise(resolve => setTimeout(resolve, 1500))

      res.json({
        success: true,
        message: `Project ${project.name} started`,
        data: { port, pid: child.pid },
      })
    } catch (err) {
      ws.pushLog('error', `[${project.name}] 启动失败: ${(err as Error).message}`, projectId)
      project.status = 'error'
      projectStates.set(projectId, project)
      res.json({ success: false, error: (err as Error).message })
    }
  }

  private async stopProjectDev(req: APIRequest, res: APIResponse): Promise<void> {
    const projectId = req.params?.id
    const ws = getDashboardWebSocket()

    if (!projectId) {
      res.json({ success: false, error: 'Project ID required' })
      return
    }

    const runningKey = `dev-${projectId}`
    const processInfo = runningProcesses.get(runningKey)
    const project = projectStates.get(projectId)

    if (!processInfo) {
      res.json({ success: false, error: 'Project not running' })
      return
    }

    ws.pushLog('info', `停止项目 ${project?.name || projectId}...`, projectId)

    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(processInfo.process.pid), '/f', '/t'], { shell: true })
      } else {
        processInfo.process.kill('SIGTERM')
      }
      runningProcesses.delete(runningKey)

      if (project) {
        project.status = 'stopped'
        project.port = undefined
        project.pid = undefined
        projectStates.set(projectId, project)
      }

      ws.pushLog('info', `项目 ${project?.name || projectId} 已停止`, projectId)
      res.json({ success: true, message: 'Project stopped' })
    } catch (err) {
      res.json({ success: false, error: (err as Error).message })
    }
  }

  private async buildProjectDev(req: APIRequest, res: APIResponse): Promise<void> {
    const projectId = req.params?.id
    const ws = getDashboardWebSocket()

    if (!projectId) {
      res.json({ success: false, error: 'Project ID required' })
      return
    }

    const project = projectStates.get(projectId)
    if (!project) {
      res.json({ success: false, error: 'Project not found' })
      return
    }

    ws.pushLog('info', `构建项目 ${project.name}...`, projectId)
    ws.pushBuildProgress({ projectId, phase: 'start', progress: 0 })

    project.status = 'building'
    projectStates.set(projectId, project)

    try {
      const child = spawn('npx', ['vite', 'build'], {
        cwd: project.path,
        shell: true,
        env: { ...process.env, FORCE_COLOR: '1' },
      })

      child.stdout?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(Boolean)
        lines.forEach(line => {
          const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim()
          if (cleanLine) {
            ws.pushLog('info', `[${project.name}] ${cleanLine}`, projectId)
            if (cleanLine.includes('transforming')) {
              ws.pushBuildProgress({ projectId, phase: 'transform', progress: 30 })
            } else if (cleanLine.includes('rendering') || cleanLine.includes('bundling')) {
              ws.pushBuildProgress({ projectId, phase: 'bundle', progress: 60 })
            } else if (cleanLine.includes('computing gzip')) {
              ws.pushBuildProgress({ projectId, phase: 'write', progress: 90 })
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
              ws.pushLog('error', `[${project.name}] ${cleanLine}`, projectId)
            } else {
              ws.pushLog('warn', `[${project.name}] ${cleanLine}`, projectId)
            }
          }
        })
      })

      child.on('close', (code) => {
        if (code === 0) {
          ws.pushBuildProgress({ projectId, phase: 'done', progress: 100 })
          ws.pushLog('info', `[${project.name}] ✅ 构建完成！`, projectId)
          project.status = 'stopped'
        } else {
          ws.pushLog('error', `[${project.name}] 构建失败 (code: ${code})`, projectId)
          project.status = 'error'
        }
        projectStates.set(projectId, project)
      })

      res.json({ success: true, message: 'Build started' })
    } catch (err) {
      ws.pushLog('error', `[${project.name}] 构建失败: ${(err as Error).message}`, projectId)
      project.status = 'error'
      projectStates.set(projectId, project)
      res.json({ success: false, error: (err as Error).message })
    }
  }

  private async getRunningProjects(_req: APIRequest, res: APIResponse): Promise<void> {
    const running: Array<{ id: string; type: string; port?: number; pid?: number }> = []
    
    for (const [key, info] of runningProcesses.entries()) {
      running.push({
        id: key,
        type: info.type,
        port: info.port,
        pid: info.process.pid,
      })
    }

    res.json({ success: true, data: running })
  }

  // ========== 部署 API ==========

  private async getDeployPlatforms(_req: APIRequest, res: APIResponse): Promise<void> {
    try {
      const { SUPPORTED_PLATFORMS } = await import('../../deploy/adapters')
      res.json({
        success: true,
        data: SUPPORTED_PLATFORMS,
      })
    } catch (error) {
      res.json({ success: false, error: (error as Error).message })
    }
  }

  private async getDeployConfigs(_req: APIRequest, res: APIResponse): Promise<void> {
    const cwd = process.cwd()
    try {
      const { DeployManager } = await import('../../deploy/DeployManager')
      const manager = new DeployManager(cwd)
      const configs = manager.getSavedConfigs()
      res.json({ success: true, data: configs })
    } catch (error) {
      res.json({ success: false, error: (error as Error).message })
    }
  }

  private async saveDeployConfig(req: APIRequest, res: APIResponse): Promise<void> {
    const body = req.body as { name: string; platform: string; config: Record<string, unknown>; isDefault?: boolean }
    const cwd = process.cwd()
    const ws = getDashboardWebSocket()

    try {
      const { DeployManager } = await import('../../deploy/DeployManager')
      const manager = new DeployManager(cwd)
      await manager.saveConfig(body.name, body.platform as any, body.config as any, body.isDefault)
      ws.pushLog('info', `部署配置已保存: ${body.name}`)
      res.json({ success: true, message: '配置已保存' })
    } catch (error) {
      res.json({ success: false, error: (error as Error).message })
    }
  }

  private async deleteDeployConfig(req: APIRequest, res: APIResponse): Promise<void> {
    const configName = req.params?.name
    const cwd = process.cwd()

    if (!configName) {
      res.json({ success: false, error: '配置名称必填' })
      return
    }

    try {
      const { DeployManager } = await import('../../deploy/DeployManager')
      const manager = new DeployManager(cwd)
      const deleted = await manager.deleteConfig(configName)
      res.json({ success: deleted, message: deleted ? '已删除' : '配置不存在' })
    } catch (error) {
      res.json({ success: false, error: (error as Error).message })
    }
  }

  private async startDeploy(req: APIRequest, res: APIResponse): Promise<void> {
    const body = req.body as { platform: string; config: Record<string, unknown>; buildBeforeDeploy?: boolean }
    const cwd = process.cwd()
    const ws = getDashboardWebSocket()

    ws.pushLog('info', `开始部署到 ${body.platform}...`)

    try {
      const { DeployService } = await import('../../deploy/DeployService')
      const service = new DeployService({ cwd, enableLogs: false })

      // 监听事件并推送到 WebSocket
      service.on('progress', (progress: any) => {
        ws.broadcast({
          type: 'deployProgress',
          payload: progress,
          timestamp: Date.now(),
        })
      })

      service.on('log', (entry: any) => {
        ws.pushLog(entry.level || 'info', entry.message)
      })

      service.on('status', (status: string) => {
        ws.broadcast({
          type: 'deployStatus',
          payload: { status },
          timestamp: Date.now(),
        })
      })

      // 异步执行部署
      const deployConfig = {
        platform: body.platform,
        buildBeforeDeploy: body.buildBeforeDeploy !== false,
        ...body.config,
      } as any

      // 立即返回响应
      res.json({ success: true, message: '部署已启动' })

      // 后台执行部署
      const result = await service.deploy(deployConfig)

      // 推送部署结果
      ws.broadcast({
        type: 'deployResult',
        payload: result,
        timestamp: Date.now(),
      })

      if (result.success) {
        ws.pushLog('info', `✅ 部署成功！${result.url ? `URL: ${result.url}` : ''}`)
      } else {
        ws.pushLog('error', `❌ 部署失败: ${result.error}`)
      }
    } catch (error) {
      ws.pushLog('error', `部署出错: ${(error as Error).message}`)
      ws.broadcast({
        type: 'deployResult',
        payload: { success: false, error: (error as Error).message },
        timestamp: Date.now(),
      })
    }
  }

  private async cancelDeploy(_req: APIRequest, res: APIResponse): Promise<void> {
    const cwd = process.cwd()
    const ws = getDashboardWebSocket()

    try {
      const { DeployService } = await import('../../deploy/DeployService')
      const service = new DeployService({ cwd })
      await service.cancel()
      ws.pushLog('warn', '部署已取消')
      res.json({ success: true, message: '部署已取消' })
    } catch (error) {
      res.json({ success: false, error: (error as Error).message })
    }
  }

  private async getDeployHistory(_req: APIRequest, res: APIResponse): Promise<void> {
    const cwd = process.cwd()

    try {
      const { DeployService } = await import('../../deploy/DeployService')
      const service = new DeployService({ cwd })
      const history = service.getHistory()
      res.json({ success: true, data: history })
    } catch (error) {
      res.json({ success: false, error: (error as Error).message })
    }
  }

  private async getDeployStatus(_req: APIRequest, res: APIResponse): Promise<void> {
    const cwd = process.cwd()

    try {
      const { DeployService } = await import('../../deploy/DeployService')
      const service = new DeployService({ cwd })
      const deployment = service.getCurrentDeployment()
      res.json({
        success: true,
        data: deployment || { status: 'idle' },
      })
    } catch (error) {
      res.json({ success: false, error: (error as Error).message })
    }
  }

  // ========== 工具箱 API ==========
  
  private async checkPort(req: APIRequest, res: APIResponse): Promise<void> {
    const port = parseInt(req.query?.port || '3000', 10)
    const net = await import('net')
    
    const server = net.createServer()
    server.once('error', () => {
      res.json({ success: true, data: { port, inUse: true } })
    })
    server.once('listening', () => {
      server.close()
      res.json({ success: true, data: { port, inUse: false } })
    })
    server.listen(port, '127.0.0.1')
  }

  private async clearCache(req: APIRequest, res: APIResponse): Promise<void> {
    const body = req.body as { type?: string } || {}
    const cwd = process.cwd()
    const ws = getDashboardWebSocket()
    
    try {
      let targetPath: string
      if (body.type === 'vite') {
        targetPath = path.join(cwd, 'node_modules', '.vite')
      } else if (body.type === 'dist') {
        targetPath = path.join(cwd, 'dist')
      } else {
        res.json({ success: false, message: '未知的缓存类型' })
        return
      }
      
      try {
        await fs.access(targetPath)
        await fs.rm(targetPath, { recursive: true, force: true })
        ws.pushLog('info', `已清除: ${targetPath}`)
        res.json({ success: true, message: `已清除 ${body.type} 缓存` })
      } catch {
        res.json({ success: false, message: '目录不存在' })
      }
    } catch (err) {
      res.json({ success: false, error: (err as Error).message })
    }
  }

  private async getDependencies(_req: APIRequest, res: APIResponse): Promise<void> {
    const cwd = process.cwd()
    
    try {
      const pkgPath = path.join(cwd, 'package.json')
      const content = await fs.readFile(pkgPath, 'utf-8')
      const pkg = JSON.parse(content)
      
      res.json({
        success: true,
        data: {
          dependencies: pkg.dependencies || {},
          devDependencies: pkg.devDependencies || {},
        },
      })
    } catch (err) {
      res.json({ success: false, error: (err as Error).message })
    }
  }

  private async reinstallDependencies(_req: APIRequest, res: APIResponse): Promise<void> {
    const cwd = process.cwd()
    const ws = getDashboardWebSocket()
    
    ws.pushLog('info', '开始重新安装依赖...')
    
    try {
      const child = spawn('pnpm', ['install'], {
        cwd,
        shell: true,
        env: { ...process.env, FORCE_COLOR: '1' },
      })
      
      child.stdout?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(Boolean)
        lines.forEach(line => {
          const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim()
          if (cleanLine) ws.pushLog('info', cleanLine)
        })
      })
      
      child.stderr?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(Boolean)
        lines.forEach(line => {
          const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim()
          if (cleanLine) ws.pushLog('warn', cleanLine)
        })
      })
      
      child.on('close', (code) => {
        if (code === 0) {
          ws.pushLog('info', '✅ 依赖安装完成！')
        } else {
          ws.pushLog('error', `依赖安装失败 (code: ${code})`)
        }
      })
      
      res.json({ success: true, message: '安装已启动' })
    } catch (err) {
      res.json({ success: false, error: (err as Error).message })
    }
  }

  private async openInEditor(_req: APIRequest, res: APIResponse): Promise<void> {
    const cwd = process.cwd()
    
    try {
      spawn('code', [cwd], { shell: true, detached: true, stdio: 'ignore' }).unref()
      res.json({ success: true })
    } catch (err) {
      res.json({ success: false, error: (err as Error).message })
    }
  }

  private async openInFolder(_req: APIRequest, res: APIResponse): Promise<void> {
    const cwd = process.cwd()
    
    try {
      // Windows: explorer, macOS: open, Linux: xdg-open
      const cmd = process.platform === 'win32' ? 'explorer' : process.platform === 'darwin' ? 'open' : 'xdg-open'
      spawn(cmd, [cwd], { shell: true, detached: true, stdio: 'ignore' }).unref()
      res.json({ success: true })
    } catch (err) {
      res.json({ success: false, error: (err as Error).message })
    }
  }

  private async analyzeBundleApi(_req: APIRequest, res: APIResponse): Promise<void> {
    const cwd = process.cwd()
    const distDir = path.join(cwd, 'dist')
    
    try {
      // 检查目录是否存在
      try {
        await fs.access(distDir)
      } catch {
        res.json({ success: false, error: '构建目录不存在，请先运行构建' })
        return
      }

      const { BundleAnalyzer } = await import('../../utils/bundle-analyzer')
      const analyzer = new BundleAnalyzer(distDir)
      const result = await analyzer.analyze()
      
      res.json({ success: true, data: result })
    } catch (err) {
      res.json({ success: false, error: (err as Error).message })
    }
  }

  private async analyzeDepsApi(_req: APIRequest, res: APIResponse): Promise<void> {
    const cwd = process.cwd()
    
    try {
      const { DependencyChecker } = await import('../../utils/dependency-checker')
      const checker = new DependencyChecker(cwd)
      const result = await checker.check({
        includeDevDeps: true,
        checkVulnerabilities: false, // 跳过安全检查以加快速度
      })
      
      res.json({ success: true, data: result })
    } catch (err) {
      res.json({ success: false, error: (err as Error).message })
    }
  }

  // ========== 系统监控 API ==========
  private async getSystemResources(_req: APIRequest, res: APIResponse): Promise<void> {
    try {
      const { getSystemStatus } = await import('../../utils/system-monitor')
      const status = getSystemStatus()
      res.json({ success: true, data: status.resources })
    } catch (err) {
      res.json({ success: false, error: (err as Error).message })
    }
  }

  // ========== 脚本运行 API ==========
  private async getScripts(_req: APIRequest, res: APIResponse): Promise<void> {
    const cwd = process.cwd()
    
    try {
      const { ScriptRunner } = await import('../../utils/script-runner')
      const runner = new ScriptRunner(cwd)
      const scripts = await runner.getScripts()
      const running = runner.getRunning()
      
      res.json({ success: true, data: { scripts, running } })
    } catch (err) {
      res.json({ success: false, error: (err as Error).message })
    }
  }

  private async runScript(req: APIRequest, res: APIResponse): Promise<void> {
    const cwd = process.cwd()
    const body = req.body as { name?: string; args?: string[] } || {}
    const ws = getDashboardWebSocket()
    
    if (!body.name) {
      res.json({ success: false, error: '缺少脚本名称' })
      return
    }
    
    try {
      const { ScriptRunner } = await import('../../utils/script-runner')
      const runner = new ScriptRunner(cwd)
      
      runner.on('output', ({ scriptName, type, data }) => {
        data.forEach((line: string) => {
          ws.pushLog(type === 'stderr' ? 'warn' : 'info', `[${scriptName}] ${line}`)
        })
      })
      
      runner.on('close', ({ scriptName, code }) => {
        ws.pushLog(code === 0 ? 'info' : 'error', `[${scriptName}] 执行完成，退出码: ${code}`)
      })
      
      await runner.run(body.name, body.args || [])
      ws.pushLog('info', `脚本 ${body.name} 已启动`)
      
      res.json({ success: true, message: '脚本已启动' })
    } catch (err) {
      res.json({ success: false, error: (err as Error).message })
    }
  }

  private async stopScript(req: APIRequest, res: APIResponse): Promise<void> {
    const cwd = process.cwd()
    const body = req.body as { name?: string } || {}
    
    if (!body.name) {
      res.json({ success: false, error: '缺少脚本名称' })
      return
    }
    
    try {
      const { ScriptRunner } = await import('../../utils/script-runner')
      const runner = new ScriptRunner(cwd)
      const stopped = runner.stop(body.name)
      
      res.json({ success: stopped, message: stopped ? '脚本已停止' : '脚本未在运行' })
    } catch (err) {
      res.json({ success: false, error: (err as Error).message })
    }
  }

  // ========== 环境变量 API ==========
  private async getEnvFiles(_req: APIRequest, res: APIResponse): Promise<void> {
    const cwd = process.cwd()
    
    try {
      const { EnvManager } = await import('../../utils/env-manager')
      const manager = new EnvManager(cwd)
      const files = await manager.getEnvFiles()
      
      res.json({ success: true, data: files })
    } catch (err) {
      res.json({ success: false, error: (err as Error).message })
    }
  }

  private async getEnvFile(req: APIRequest, res: APIResponse): Promise<void> {
    const cwd = process.cwd()
    const params = req.params as { name?: string }
    
    if (!params.name) {
      res.json({ success: false, error: '缺少文件名' })
      return
    }
    
    try {
      const { EnvManager } = await import('../../utils/env-manager')
      const manager = new EnvManager(cwd)
      const file = await manager.getEnvFile(params.name)
      
      res.json({ success: true, data: file })
    } catch (err) {
      res.json({ success: false, error: (err as Error).message })
    }
  }

  private async saveEnvFile(req: APIRequest, res: APIResponse): Promise<void> {
    const cwd = process.cwd()
    const params = req.params as { name?: string }
    const body = req.body as { variables?: Array<{ key: string; value: string; comment?: string }> } || {}
    
    if (!params.name || !body.variables) {
      res.json({ success: false, error: '缺少必要参数' })
      return
    }
    
    try {
      const { EnvManager } = await import('../../utils/env-manager')
      const manager = new EnvManager(cwd)
      await manager.saveEnvFile(params.name, body.variables)
      
      res.json({ success: true, message: '环境变量已保存' })
    } catch (err) {
      res.json({ success: false, error: (err as Error).message })
    }
  }

  // ========== 代码质量 API ==========
  private async getQualityTools(_req: APIRequest, res: APIResponse): Promise<void> {
    const cwd = process.cwd()
    
    try {
      const { CodeQualityChecker } = await import('../../utils/code-quality')
      const checker = new CodeQualityChecker(cwd)
      const tools = await checker.detectTools()
      
      res.json({ success: true, data: tools })
    } catch (err) {
      res.json({ success: false, error: (err as Error).message })
    }
  }

  private async runQualityCheck(req: APIRequest, res: APIResponse): Promise<void> {
    const cwd = process.cwd()
    const body = req.body as { fix?: boolean; paths?: string[] } || {}
    const ws = getDashboardWebSocket()
    
    ws.pushLog('info', '开始代码质量检查...')
    
    try {
      const { CodeQualityChecker } = await import('../../utils/code-quality')
      const checker = new CodeQualityChecker(cwd)
      
      checker.on('progress', ({ tool, status }) => {
        ws.pushLog('info', `[${tool}] ${status}`)
      })
      
      const result = await checker.check({
        fix: body.fix,
        paths: body.paths,
      })
      
      ws.pushLog(result.success ? 'info' : 'warn', 
        `检查完成: ${result.errorCount} 错误, ${result.warningCount} 警告`)
      
      res.json({ success: true, data: result })
    } catch (err) {
      ws.pushLog('error', `检查失败: ${(err as Error).message}`)
      res.json({ success: false, error: (err as Error).message })
    }
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
