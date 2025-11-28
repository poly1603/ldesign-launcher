/**
 * 服务器工具函数
 *
 * 提供服务器相关的实用工具函数
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import { Logger } from './logger'

const serverLogger = new Logger('Server')

/**
 * 解析服务器 host 配置值
 *
 * 将 Vite 的 host 配置值转换为可用于 URL 的字符串
 * - `true` 或 `0.0.0.0` → `localhost` （服务器监听所有接口，但URL使用localhost）
 * - 字符串值 → 直接返回
 * - 其他值 → 返回默认值 `localhost`
 *
 * @param hostConfig - Vite 的 host 配置值
 * @returns 解析后的 host 字符串
 *
 * @example
 * ```ts
 * resolveServerHost(true) // 'localhost'
 * resolveServerHost('0.0.0.0') // 'localhost'
 * resolveServerHost('127.0.0.1') // '127.0.0.1'
 * resolveServerHost('example.com') // 'example.com'
 * ```
 */
export function resolveServerHost(hostConfig: string | boolean | undefined): string {
  if (hostConfig === true || hostConfig === '0.0.0.0') {
    return 'localhost'
  }
  else if (typeof hostConfig === 'string') {
    return hostConfig
  }
  else {
    return 'localhost'
  }
}

/**
 * 构建服务器 URL
 *
 * @param protocol - 协议 (http 或 https)
 * @param host - 主机地址
 * @param port - 端口号
 * @returns 完整的服务器 URL
 *
 * @example
 * ```ts
 * buildServerUrl('http', 'localhost', 3000) // 'http://localhost:3000'
 * buildServerUrl('https', '127.0.0.1', 443) // 'https://127.0.0.1:443'
 * ```
 */
export function buildServerUrl(
  protocol: 'http' | 'https',
  host: string,
  port: number,
): string {
  return `${protocol}://${host}:${port}`
}

/**
 * 获取服务器 URL
 *
 * 优先使用 Vite 的 resolvedUrls，如果不存在则手动构建
 *
 * @param server - Vite 开发服务器或预览服务器实例（其中的 resolvedUrls.local 会被优先使用）
 * @param server.resolvedUrls - Vite 解析后的 URL 信息（可能包含 local 与 network 等字段）
 * @param server.resolvedUrls.local - 本地访问 URL 列表
 * @param hostConfig - host 配置值
 * @param port - 端口号
 * @param https - 是否使用 HTTPS
 * @returns 服务器 URL
 *
 * @example
 * ```ts
 * getServerUrl(devServer, true, 3000, false) // 'http://localhost:3000'
 * ```
 */
export function getServerUrl(
  server: { resolvedUrls?: { local?: string[] } },
  hostConfig: string | boolean | undefined,
  port: number,
  https: boolean,
): string {
  // 优先使用 Vite 的 resolvedUrls
  if (server.resolvedUrls?.local?.[0]) {
    return server.resolvedUrls.local[0]
  }

  // 回退到手动构建
  const protocol = https ? 'https' : 'http'
  const host = resolveServerHost(hostConfig)
  return buildServerUrl(protocol, host, port)
}

/**
 * 验证 URL 是否有效
 *
 * @param url - 要验证的 URL
 * @returns 是否有效
 *
 * @example
 * ```ts
 * isValidUrl('http://localhost:3000') // true
 * isValidUrl('invalid-url') // false
 * ```
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  }
  catch {
    return false
  }
}

/**
 * 从 URL 中提取端口号
 *
 * @param url - URL 字符串
 * @returns 端口号，如果未指定则返回默认端口 (http: 80, https: 443)
 *
 * @example
 * ```ts
 * extractPortFromUrl('http://localhost:3000') // 3000
 * extractPortFromUrl('https://example.com') // 443
 * ```
 */
export function extractPortFromUrl(url: string): number {
  try {
    const parsed = new URL(url)
    if (parsed.port) {
      return Number.parseInt(parsed.port, 10)
    }
    return parsed.protocol === 'https:' ? 443 : 80
  }
  catch {
    return 80
  }
}

/**
 * 检查端口是否可用
 *
 * @param port - 端口号
 * @param host - 主机地址
 * @returns 端口是否可用
 *
 * @example
 * ```ts
 * await isPortAvailable(3000) // true 或 false
 * ```
 */
export async function isPortAvailable(port: number, host: string = '0.0.0.0'): Promise<boolean> {
  return new Promise((resolve) => {
    (async () => {
      const net = await import('node:net')
      const server = net.createServer()

      server.once('error', () => {
        resolve(false)
      })

      server.once('listening', () => {
        server.close()
        resolve(true)
      })

      server.listen(port, host)
    })().catch(() => {
      resolve(false)
    })
  })
}

/**
 * 查找可用端口
 *
 * @param startPort - 起始端口号
 * @param host - 主机地址
 * @param maxAttempts - 最大尝试次数
 * @returns 可用的端口号，如果未找到则返回 null
 *
 * @example
 * ```ts
 * await findAvailablePort(3000) // 3000, 3001, 3002, ...
 * ```
 */
export async function findAvailablePort(
  startPort: number = 3000,
  host: string = '0.0.0.0',
  maxAttempts: number = 100,
): Promise<number | null> {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    if (await isPortAvailable(port, host)) {
      return port
    }
  }
  return null
}

/**
 * 获取网络 URL 列表
 *
 * @param protocol - 协议
 * @param port - 端口号
 * @returns 网络 URL 列表
 *
 * @example
 * ```ts
 * getNetworkUrls('http', 3000) // ['http://192.168.1.100:3000', ...]
 * ```
 */
export async function getNetworkUrls(protocol: 'http' | 'https', port: number): Promise<string[]> {
  const os = await import('node:os')
  const interfaces = os.networkInterfaces()
  const urls: string[] = []

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // 跳过内部和非 IPv4 地址
      if (iface.family === 'IPv4' && !iface.internal) {
        urls.push(`${protocol}://${iface.address}:${port}`)
      }
    }
  }

  return urls
}

/**
 * 等待服务器就绪
 *
 * @param url - 服务器 URL
 * @param timeout - 超时时间（毫秒）
 * @returns 服务器是否就绪
 *
 * @example
 * ```ts
 * await waitForServer('http://localhost:3000', 5000) // true 或 false
 * ```
 */
export async function waitForServer(url: string, timeout: number = 30000): Promise<boolean> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      if (response.ok) {
        return true
      }
    }
    catch {
      // 忽略错误，继续尝试
    }

    // 等待 500ms 后重试
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return false
}

/**
 * 获取服务器状态
 *
 * @param url - 服务器 URL
 * @returns 服务器状态信息
 *
 * @example
 * ```ts
 * await getServerStatus('http://localhost:3000') // { online: true, statusCode: 200, ... }
 * ```
 */
export async function getServerStatus(url: string): Promise<{
  online: boolean
  statusCode?: number
  responseTime?: number
}> {
  const startTime = Date.now()

  try {
    const response = await fetch(url, { method: 'HEAD' })
    const responseTime = Date.now() - startTime

    return {
      online: true,
      statusCode: response.status,
      responseTime,
    }
  }
  catch {
    return {
      online: false,
    }
  }
}

/**
 * 打开浏览器
 *
 * @param url - 要打开的 URL
 * @returns 是否成功打开
 *
 * @example
 * ```ts
 * await openBrowser('http://localhost:3000')
 * ```
 */
export async function openBrowser(url: string): Promise<boolean> {
  try {
    const open = await import('open')
    await open.default(url)
    return true
  }
  catch {
    return false
  }
}

/**
 * 获取服务器摘要信息
 *
 * @param url - 服务器 URL
 * @param port - 端口号
 * @param host - 主机地址
 * @returns 服务器摘要信息
 *
 * @example
 * ```ts
 * getServerSummary('http://localhost:3000', 3000, 'localhost')
 * ```
 */
export async function getServerSummary(url: string, port: number, host: string): Promise<{
  url: string
  port: number
  host: string
  networkUrls: string[]
}> {
  const protocol = url.startsWith('https') ? 'https' : 'http'
  const networkUrls = await getNetworkUrls(protocol as 'http' | 'https', port)

  return {
    url,
    port,
    host,
    networkUrls,
  }
}

/**
 * 解析 host 配置
 *
 * @param host - host 配置值
 * @returns 解析后的 host 字符串
 *
 * @example
 * ```ts
 * parseHost(true) // '0.0.0.0'
 * parseHost('localhost') // 'localhost'
 * ```
 */
export function parseHost(host: string | boolean | undefined): string {
  if (host === true) {
    return '0.0.0.0'
  }
  else if (typeof host === 'string') {
    return host
  }
  else {
    return 'localhost'
  }
}

/**
 * 记录服务器信息到控制台
 *
 * @param url - 服务器 URL
 * @param port - 端口号
 * @param host - 主机地址
 *
 * @example
 * ```ts
 * logServerInfo('http://localhost:3000', 3000, 'localhost')
 * ```
 */
export async function logServerInfo(url: string, port: number, host: string): Promise<void> {
  serverLogger.raw('\n  服务器已启动:')
  serverLogger.raw(`  - 本地: ${url}`)
  serverLogger.raw(`  - 端口: ${port}`)
  serverLogger.raw(`  - 主机: ${host}`)

  const networkUrls = await getNetworkUrls(url.startsWith('https') ? 'https' : 'http', port)
  if (networkUrls.length > 0) {
    serverLogger.raw(`  - 网络: ${networkUrls[0]}`)
  }
  serverLogger.raw('')
}

/**
 * 获取网络接口信息
 *
 * @returns 网络接口信息
 *
 * @example
 * ```ts
 * getNetworkInterfaces() // { eth0: [...], wlan0: [...], ... }
 * ```
 */
export async function getNetworkInterfaces(): Promise<Record<string, any[]>> {
  const os = await import('node:os')
  const interfaces = os.networkInterfaces()
  const result: Record<string, any[]> = {}

  for (const [key, value] of Object.entries(interfaces)) {
    if (value) {
      result[key] = value
    }
  }

  return result
}
