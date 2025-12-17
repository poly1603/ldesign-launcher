/**
 * Mock Server - 内置 API 模拟服务
 *
 * 提供开发环境下的 API 模拟功能，支持：
 * - 文件级 mock 定义
 * - 动态响应生成
 * - 延迟模拟
 * - RESTful 路由匹配
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import fs from 'fs-extra'

/**
 * Mock 路由处理器
 */
export type MockHandler = (
  req: MockRequest,
  res: MockResponse,
) => void | Promise<void> | Record<string, unknown> | Promise<Record<string, unknown>>

/**
 * Mock 路由定义
 */
export interface MockRoute {
  url: string | RegExp
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | string
  delay?: number
  statusCode?: number
  headers?: Record<string, string>
  response?: unknown | MockHandler
}

/**
 * Mock 请求对象
 */
export interface MockRequest {
  url: string
  method: string
  params: Record<string, string>
  query: Record<string, string>
  body: unknown
  headers: Record<string, string | string[] | undefined>
}

/**
 * Mock 响应对象
 */
export interface MockResponse {
  status: (code: number) => MockResponse
  header: (name: string, value: string) => MockResponse
  headers: (headers: Record<string, string>) => MockResponse
  json: (data: unknown) => void
  send: (data: string | Buffer) => void
  end: () => void
}

/**
 * Mock 配置
 */
export interface MockConfig {
  enable?: boolean
  mockDir?: string
  prefix?: string
  delay?: number
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent'
  watch?: boolean
}

/**
 * Mock Server
 */
export class MockServer {
  private routes: MockRoute[] = []
  private config: Required<MockConfig>
  private watchAbortController?: AbortController

  constructor(config: MockConfig = {}) {
    this.config = {
      enable: config.enable ?? true,
      mockDir: config.mockDir || 'mock',
      prefix: config.prefix || '/api',
      delay: config.delay || 0,
      logLevel: config.logLevel || 'info',
      watch: config.watch ?? true,
    }
  }

  /**
   * 加载 mock 文件
   */
  async loadMocks(cwd: string): Promise<void> {
    const mockDir = path.resolve(cwd, this.config.mockDir)

    if (!await fs.pathExists(mockDir)) {
      this.log('debug', `Mock 目录不存在: ${mockDir}`)
      return
    }

    const files = await this.findMockFiles(mockDir)
    this.routes = []

    for (const file of files) {
      try {
        // 清除缓存以支持热更新
        const fileUrl = pathToFileURL(file).href
        const timestamp = Date.now()
        const module = await import(`${fileUrl}?t=${timestamp}`)
        const routes = module.default || module

        if (Array.isArray(routes)) {
          this.routes.push(...routes)
          this.log('debug', `已加载 mock 文件: ${path.relative(cwd, file)} (${routes.length} 条路由)`)
        }
        else if (typeof routes === 'object') {
          // 支持对象格式: { 'GET /api/users': [...] }
          for (const [key, value] of Object.entries(routes)) {
            const [method, url] = key.split(' ')
            if (url) {
              this.routes.push({
                method: method.toUpperCase(),
                url,
                response: value,
              })
            }
            else {
              this.routes.push({
                url: method, // key 就是 url
                response: value,
              })
            }
          }
          this.log('debug', `已加载 mock 文件: ${path.relative(cwd, file)}`)
        }
      }
      catch (error) {
        this.log('error', `加载 mock 文件失败: ${file} - ${(error as Error).message}`)
      }
    }

    this.log('info', `已加载 ${this.routes.length} 条 mock 路由`)

    // 启动文件监听
    if (this.config.watch) {
      this.startWatching(cwd, mockDir)
    }
  }

  /**
   * 查找 mock 文件
   */
  private async findMockFiles(dir: string): Promise<string[]> {
    const files: string[] = []
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...await this.findMockFiles(fullPath))
      }
      else if (/\.(ts|js|mjs|cjs)$/.test(entry.name) && !entry.name.startsWith('_')) {
        files.push(fullPath)
      }
    }

    return files
  }

  /**
   * 启动文件监听
   */
  private startWatching(cwd: string, mockDir: string): void {
    this.watchAbortController?.abort()
    this.watchAbortController = new AbortController()

    try {
      const watcher = fs.watch(mockDir, { recursive: true }, async (_eventType, filename) => {
        if (filename && /\.(ts|js|mjs|cjs)$/.test(filename)) {
          this.log('info', `Mock 文件变更: ${filename}`)
          await this.loadMocks(cwd)
        }
      })

      this.watchAbortController.signal.addEventListener('abort', () => {
        watcher.close()
      })
    }
    catch (error) {
      this.log('error', `Mock 文件监听错误: ${(error as Error).message}`)
    }
  }

  /**
   * 停止监听
   */
  stopWatching(): void {
    this.watchAbortController?.abort()
  }

  /**
   * 处理请求
   */
  async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    if (!this.config.enable)
      return false

    const url = req.url || ''
    const method = req.method || 'GET'

    // 检查是否匹配前缀
    if (!url.startsWith(this.config.prefix)) {
      return false
    }

    // 查找匹配的路由
    const route = this.findMatchingRoute(url, method)
    if (!route) {
      return false
    }

    // 解析请求
    const mockReq = await this.parseRequest(req, route, url)
    const mockRes = this.createResponse(res)

    this.log('info', `[Mock] ${method} ${url}`)

    // 应用延迟
    const delay = route.delay ?? this.config.delay
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    // 设置状态码
    if (route.statusCode) {
      res.statusCode = route.statusCode
    }

    // 设置响应头
    if (route.headers) {
      for (const [key, value] of Object.entries(route.headers)) {
        res.setHeader(key, value)
      }
    }

    // 生成响应
    try {
      let responseData: unknown

      if (typeof route.response === 'function') {
        responseData = await route.response(mockReq, mockRes)
      }
      else {
        responseData = route.response
      }

      // 如果 handler 没有手动结束响应，则自动发送 JSON
      if (responseData !== undefined && !res.writableEnded) {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(responseData))
      }
    }
    catch (error) {
      this.log('error', `Mock 响应错误: ${(error as Error).message}`)
      res.statusCode = 500
      res.end(JSON.stringify({ error: (error as Error).message }))
    }

    return true
  }

  /**
   * 查找匹配的路由
   */
  private findMatchingRoute(url: string, method: string): MockRoute | undefined {
    const urlPath = url.split('?')[0]

    return this.routes.find((route) => {
      // 检查方法
      if (route.method && route.method.toUpperCase() !== method.toUpperCase()) {
        return false
      }

      // 检查 URL
      if (route.url instanceof RegExp) {
        return route.url.test(urlPath)
      }

      // 支持路径参数 :id 格式
      const pattern = route.url.replace(/:([^/]+)/g, '([^/]+)')
      const regex = new RegExp(`^${pattern}$`)
      return regex.test(urlPath)
    })
  }

  /**
   * 解析请求
   */
  private async parseRequest(
    req: IncomingMessage,
    route: MockRoute,
    url: string,
  ): Promise<MockRequest> {
    const [urlPath, queryString] = url.split('?')
    const query: Record<string, string> = {}
    const params: Record<string, string> = {}

    // 解析查询参数
    if (queryString) {
      const searchParams = new URLSearchParams(queryString)
      searchParams.forEach((value, key) => {
        query[key] = value
      })
    }

    // 解析路径参数
    if (typeof route.url === 'string') {
      const paramNames: string[] = []
      const pattern = route.url.replace(/:([^/]+)/g, (_, name) => {
        paramNames.push(name)
        return '([^/]+)'
      })
      const match = urlPath.match(new RegExp(`^${pattern}$`))
      if (match) {
        paramNames.forEach((name, i) => {
          params[name] = match[i + 1]
        })
      }
    }

    // 解析请求体
    let body: unknown = {}
    if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
      body = await this.parseBody(req)
    }

    return {
      url,
      method: req.method || 'GET',
      params,
      query,
      body,
      headers: req.headers as Record<string, string>,
    }
  }

  /**
   * 解析请求体
   */
  private parseBody(req: IncomingMessage): Promise<unknown> {
    return new Promise((resolve) => {
      let data = ''
      req.on('data', (chunk) => {
        data += chunk
      })
      req.on('end', () => {
        try {
          resolve(JSON.parse(data))
        }
        catch {
          resolve(data)
        }
      })
      req.on('error', () => {
        resolve({})
      })
    })
  }

  /**
   * 创建响应对象
   */
  private createResponse(res: ServerResponse): MockResponse {
    const mockRes: MockResponse = {
      status(code: number) {
        res.statusCode = code
        return mockRes
      },
      header(name: string, value: string) {
        res.setHeader(name, value)
        return mockRes
      },
      headers(headers: Record<string, string>) {
        for (const [key, value] of Object.entries(headers)) {
          res.setHeader(key, value)
        }
        return mockRes
      },
      json(data: unknown) {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(data))
      },
      send(data: string | Buffer) {
        res.end(data)
      },
      end() {
        res.end()
      },
    }
    return mockRes
  }

  /**
   * 添加路由
   */
  addRoute(route: MockRoute): void {
    this.routes.push(route)
  }

  /**
   * 获取所有路由
   */
  getRoutes(): MockRoute[] {
    return [...this.routes]
  }

  /**
   * 日志输出
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    const levels = ['debug', 'info', 'warn', 'error', 'silent']
    if (levels.indexOf(level) < levels.indexOf(this.config.logLevel)) {
      return
    }
    console.log(`[Mock] ${message}`)
  }
}

/**
 * 创建 Mock 中间件 (用于 Vite 插件)
 */
export function createMockMiddleware(config?: MockConfig) {
  const server = new MockServer(config)
  let initialized = false

  return {
    name: 'vite-plugin-mock',
    async configureServer(viteServer: { middlewares: { use: Function }, config: { root: string } }) {
      if (!initialized) {
        await server.loadMocks(viteServer.config.root)
        initialized = true
      }

      viteServer.middlewares.use(async (
        req: IncomingMessage,
        res: ServerResponse,
        next: () => void,
      ) => {
        const handled = await server.handleRequest(req, res)
        if (!handled) {
          next()
        }
      })
    },
  }
}

/**
 * Mock 数据生成工具
 */
export const Mock = {
  /**
   * 生成随机 ID
   */
  id: () => Math.random().toString(36).substring(2, 15),

  /**
   * 生成 UUID
   */
  uuid: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  }),

  /**
   * 生成随机整数
   */
  int: (min = 0, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min,

  /**
   * 生成随机浮点数
   */
  float: (min = 0, max = 100, decimals = 2) =>
    Number.parseFloat((Math.random() * (max - min) + min).toFixed(decimals)),

  /**
   * 生成随机布尔值
   */
  bool: () => Math.random() > 0.5,

  /**
   * 从数组中随机选择
   */
  pick: <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)],

  /**
   * 生成随机字符串
   */
  string: (length = 10) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  },

  /**
   * 生成随机日期
   */
  date: (start?: Date, end?: Date) => {
    const s = start?.getTime() || Date.now() - 365 * 24 * 60 * 60 * 1000
    const e = end?.getTime() || Date.now()
    return new Date(s + Math.random() * (e - s))
  },

  /**
   * 生成随机邮箱
   */
  email: () => `${Mock.string(8).toLowerCase()}@${Mock.pick(['gmail', 'outlook', 'qq', '163'])}.com`,

  /**
   * 生成随机手机号
   */
  phone: () => `1${Mock.pick(['3', '5', '7', '8', '9'])}${Array.from({ length: 9 }, () => Mock.int(0, 9)).join('')}`,

  /**
   * 生成随机中文名
   */
  cname: () => {
    const surnames = ['张', '李', '王', '赵', '刘', '陈', '杨', '黄', '周', '吴']
    const names = ['伟', '芳', '娜', '敏', '静', '秀英', '丽', '强', '磊', '洋']
    return Mock.pick(surnames) + Mock.pick(names) + (Math.random() > 0.5 ? Mock.pick(names) : '')
  },

  /**
   * 生成随机地址
   */
  address: () => {
    const provinces = ['北京市', '上海市', '广东省', '浙江省', '江苏省']
    const cities = ['海淀区', '朝阳区', '浦东新区', '南山区', '西湖区']
    const streets = ['中关村大街', '望京街', '陆家嘴路', '科技园路', '文三路']
    return `${Mock.pick(provinces)}${Mock.pick(cities)}${Mock.pick(streets)}${Mock.int(1, 999)}号`
  },

  /**
   * 生成随机图片 URL
   */
  image: (width = 200, height = 200) =>
    `https://picsum.photos/${width}/${height}?random=${Mock.int(1, 1000)}`,

  /**
   * 生成列表数据
   */
  list: <T>(generator: () => T, count = 10): T[] =>
    Array.from({ length: count }, generator),
}
