/**
 * Mock 服务插件集成
 *
 * 提供开发环境的 Mock 数据服务支持
 * 支持 vite-plugin-mock 和自定义 Mock 文件
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type { Plugin } from 'vite'
import type { MockOptions } from '../../types/config'
import { FileSystem } from '../../utils/file-system'
import { Logger } from '../../utils/logger'
import { PathUtils } from '../../utils/path-utils'

const logger = new Logger('MockPlugin')

/**
 * Mock 路由定义接口
 */
export interface MockRoute {
  /** 请求路径（支持正则表达式） */
  url: string | RegExp
  /** 请求方法 */
  method?: 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head'
  /** 响应数据或响应函数 */
  response?: any | ((req: any) => any)
  /** 响应状态码 */
  statusCode?: number
  /** 响应延迟（毫秒） */
  timeout?: number
  /** 响应头 */
  headers?: Record<string, string>
}

/**
 * 创建 Mock 插件
 *
 * @param options - Mock 配置选项
 * @param cwd - 工作目录
 * @returns Vite 插件或 null
 */
export async function createMockPlugin(
  options: MockOptions,
  cwd: string,
): Promise<Plugin | null> {
  if (!options.enabled) {
    return null
  }

  const mockDir = options.mockDir || 'mock'
  const mockPath = PathUtils.resolve(cwd, mockDir)

  // 检查 mock 目录是否存在
  if (!(await FileSystem.exists(mockPath))) {
    logger.warn(`Mock 目录不存在: ${mockPath}，跳过 Mock 插件`)
    return null
  }

  // 尝试使用 vite-plugin-mock
  try {
    // @ts-expect-error - vite-plugin-mock 是可选依赖
    const viteMockModule = await import('vite-plugin-mock')
    const { viteMockServe } = viteMockModule

    logger.info('使用 vite-plugin-mock 提供 Mock 服务')

    return viteMockServe({
      mockPath: mockDir,
      enable: options.enabled,
      watchFiles: options.watchFiles ?? true,
      logger: options.logger ?? true,
      supportTs: true,
      prodEnabled: options.prodEnabled ?? false,
      injectCode: options.prodEnabled
        ? `
          import { setupProdMockServer } from './${mockDir}/mockProdServer';
          setupProdMockServer();
        `
        : undefined,
      ignore: options.ignore
        ? (fileName: string) => {
            const ignorePatterns = options.ignore || []
            return ignorePatterns.some((pattern) => {
              if (typeof pattern === 'string') {
                return fileName.includes(pattern)
              }
              return pattern.test(fileName)
            })
          }
        : undefined,
    }) as unknown as Plugin
  }
  catch {
    logger.warn('vite-plugin-mock 未安装，使用内置 Mock 中间件')

    // 使用内置的简单 Mock 中间件
    return createBuiltinMockPlugin(options, mockPath)
  }
}

/**
 * 创建内置 Mock 插件（当 vite-plugin-mock 不可用时）
 */
function createBuiltinMockPlugin(options: MockOptions, mockPath: string): Plugin {
  let mockRoutes: MockRoute[] = []

  return {
    name: 'ldesign:mock',
    apply: 'serve',

    async configureServer(server) {
      // 加载 Mock 路由
      mockRoutes = await loadMockRoutes(mockPath)
      logger.info(`已加载 ${mockRoutes.length} 个 Mock 路由`)

      // 监听 Mock 文件变化
      if (options.watchFiles !== false) {
        server.watcher.add(mockPath)
        server.watcher.on('change', async (file) => {
          if (file.startsWith(mockPath)) {
            logger.info(`Mock 文件变更: ${file}，重新加载...`)
            mockRoutes = await loadMockRoutes(mockPath)
            logger.info(`已重新加载 ${mockRoutes.length} 个 Mock 路由`)
          }
        })
      }

      // 添加 Mock 中间件
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        const method = (req.method || 'GET').toLowerCase()
        const prefix = options.prefix || '/api'

        // 检查是否匹配 Mock 路由
        if (!url.startsWith(prefix)) {
          return next()
        }

        const matchedRoute = mockRoutes.find((route) => {
          const routeMethod = (route.method || 'get').toLowerCase()
          if (routeMethod !== method) {
            return false
          }

          if (typeof route.url === 'string') {
            return url === route.url || url.startsWith(`${route.url}?`)
          }
          return route.url.test(url)
        })

        if (!matchedRoute) {
          return next()
        }

        // 日志输出
        if (options.logger !== false) {
          logger.debug(`Mock 请求: ${method.toUpperCase()} ${url}`)
        }

        // 处理延迟
        const delay = matchedRoute.timeout || options.generator?.delay || 0
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        // 设置响应头
        res.setHeader('Content-Type', 'application/json')
        if (matchedRoute.headers) {
          Object.entries(matchedRoute.headers).forEach(([key, value]) => {
            res.setHeader(key, value)
          })
        }

        // 设置状态码
        const statusCode = matchedRoute.statusCode || options.generator?.defaultStatus || 200
        res.statusCode = statusCode

        // 生成响应数据
        let responseData: any
        if (typeof matchedRoute.response === 'function') {
          try {
            responseData = await matchedRoute.response({
              url,
              method,
              headers: req.headers,
              query: parseQuery(url),
              body: await parseBody(req),
            })
          }
          catch (error) {
            logger.error(`Mock 响应函数执行失败: ${(error as Error).message}`)
            res.statusCode = 500
            responseData = { error: 'Mock 响应函数执行失败' }
          }
        }
        else {
          responseData = matchedRoute.response
        }

        res.end(JSON.stringify(responseData))
      })
    },
  }
}

/**
 * 加载 Mock 路由文件
 */
async function loadMockRoutes(mockPath: string): Promise<MockRoute[]> {
  const routes: MockRoute[] = []

  try {
    const files = await FileSystem.readDir(mockPath)
    const mockFiles = files.filter(
      file => file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.mjs'),
    )

    for (const file of mockFiles) {
      try {
        const filePath = PathUtils.join(mockPath, file)
        // 清除缓存以支持热重载
        delete require.cache[require.resolve(filePath)]

        const module = await import(filePath)
        const mockData = module.default || module

        if (Array.isArray(mockData)) {
          routes.push(...mockData)
        }
        else if (typeof mockData === 'object') {
          routes.push(mockData)
        }
      }
      catch (error) {
        logger.warn(`加载 Mock 文件失败: ${file}`, { error: (error as Error).message })
      }
    }
  }
  catch (error) {
    logger.error(`读取 Mock 目录失败: ${mockPath}`, { error: (error as Error).message })
  }

  return routes
}

/**
 * 解析 URL 查询参数
 */
function parseQuery(url: string): Record<string, string> {
  const query: Record<string, string> = {}
  const queryIndex = url.indexOf('?')

  if (queryIndex === -1) {
    return query
  }

  const queryString = url.slice(queryIndex + 1)
  queryString.split('&').forEach((pair) => {
    const [key, value] = pair.split('=')
    if (key) {
      query[decodeURIComponent(key)] = decodeURIComponent(value || '')
    }
  })

  return query
}

/**
 * 解析请求体
 */
function parseBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      }
      catch {
        resolve(body)
      }
    })
    req.on('error', () => {
      resolve({})
    })
  })
}

/**
 * 生成 Mock 文件模板
 */
export function generateMockTemplate(): string {
  return `/**
 * Mock 数据示例
 *
 * @see https://github.com/vbenjs/vite-plugin-mock
 */

import type { MockMethod } from 'vite-plugin-mock'

export default [
  {
    url: '/api/users',
    method: 'get',
    response: () => {
      return {
        code: 0,
        message: 'success',
        data: [
          { id: 1, name: '张三', email: 'zhangsan@example.com' },
          { id: 2, name: '李四', email: 'lisi@example.com' },
        ],
      }
    },
  },
  {
    url: '/api/user/:id',
    method: 'get',
    response: ({ query }) => {
      return {
        code: 0,
        message: 'success',
        data: {
          id: query.id,
          name: '用户' + query.id,
          email: \`user\${query.id}@example.com\`,
        },
      }
    },
  },
  {
    url: '/api/user',
    method: 'post',
    timeout: 500,
    response: ({ body }) => {
      return {
        code: 0,
        message: '创建成功',
        data: {
          id: Date.now(),
          ...body,
        },
      }
    },
  },
] as MockMethod[]
`
}
