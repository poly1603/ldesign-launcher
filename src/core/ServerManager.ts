/**
 * 服务器管理器
 *
 * 负责开发服务器和预览服务器的生命周期管理
 *
 * @author LDesign Team
 * @since 1.1.0
 */

import type { ViteDevServer, PreviewServer as VitePreviewServer } from 'vite'
import type { ViteLauncherConfig } from '../types'
import type { DevServer, PreviewServer } from '../types/engine'
import type { Logger } from '../utils/logger'
import qrcode from 'qrcode-terminal'
import { getPreferredLocalIP } from '../utils/network'

export interface ServerManagerOptions {
  logger: Logger
  cwd: string
}

/**
 * 服务器管理器
 *
 * 管理开发服务器和预览服务器的启动、停止、重启等操作
 */
export class ServerManager {
  private logger: Logger
  private cwd: string
  private devServer: ViteDevServer | null = null
  private previewServer: VitePreviewServer | null = null

  constructor(options: ServerManagerOptions) {
    this.logger = options.logger
    this.cwd = options.cwd
  }

  /**
   * 启动开发服务器
   */
  async startDevServer(config: ViteLauncherConfig, viteModule: any): Promise<ViteDevServer> {
    const { createServer } = viteModule

    this.logger.info('正在启动开发服务器...')

    // 创建并启动服务器
    this.devServer = await createServer(config)
    await this.devServer.listen()

    this.logger.success('开发服务器启动成功')

    return this.devServer
  }

  /**
   * 停止开发服务器
   */
  async stopDevServer(): Promise<void> {
    if (!this.devServer) {
      this.logger.warn('开发服务器未运行')
      return
    }

    this.logger.info('正在停止开发服务器...')
    await this.devServer.close()
    this.devServer = null
    this.logger.success('开发服务器已停止')
  }

  /**
   * 重启开发服务器
   */
  async restartDevServer(config: ViteLauncherConfig, viteModule: any): Promise<ViteDevServer> {
    await this.stopDevServer()
    return this.startDevServer(config, viteModule)
  }

  /**
   * 启动预览服务器
   */
  async startPreviewServer(config: ViteLauncherConfig, viteModule: any): Promise<VitePreviewServer> {
    const { preview } = viteModule

    this.logger.info('正在启动预览服务器...')

    // 创建并启动预览服务器
    this.previewServer = await preview(config)

    this.logger.success('预览服务器启动成功')

    return this.previewServer
  }

  /**
   * 停止预览服务器
   */
  async stopPreviewServer(): Promise<void> {
    if (!this.previewServer) {
      this.logger.warn('预览服务器未运行')
      return
    }

    this.logger.info('正在停止预览服务器...')
    // PreviewServer 没有 close 方法，通过 httpServer 关闭
    if (this.previewServer.httpServer) {
      await new Promise<void>((resolve, reject) => {
        this.previewServer!.httpServer.close((err) => {
          if (err)
            reject(err)
          else resolve()
        })
      })
    }
    this.previewServer = null
    this.logger.success('预览服务器已停止')
  }

  /**
   * 获取当前开发服务器实例
   */
  getDevServer(): ViteDevServer | null {
    return this.devServer
  }

  /**
   * 获取当前预览服务器实例
   */
  getPreviewServer(): VitePreviewServer | null {
    return this.previewServer
  }

  /**
   * 获取服务器 URL
   */
  getServerUrl(server: ViteDevServer | VitePreviewServer): string {
    if ('resolvedUrls' in server && server.resolvedUrls) {
      return server.resolvedUrls.local[0] || ''
    }

    // 预览服务器的 URL 获取
    if ('httpServer' in server && server.httpServer) {
      const address = server.httpServer.address()
      if (address && typeof address === 'object') {
        const host = address.address === '::' || address.address === '0.0.0.0'
          ? 'localhost'
          : address.address
        return `http://${host}:${address.port}`
      }
    }

    return ''
  }

  /**
   * 获取服务器信息（简化版）
   */
  getServerInfo(server: ViteDevServer | VitePreviewServer): { url: string, host: string, port: number, https: boolean } {
    const url = this.getServerUrl(server)
    const urlObj = new URL(url)

    return {
      url,
      host: urlObj.hostname,
      port: Number.parseInt(urlObj.port),
      https: urlObj.protocol === 'https:',
    }
  }

  /**
   * 打印服务器信息（通用版本 - 支持所有引擎）
   */
  printServerInfo(server: DevServer | PreviewServer | ViteDevServer | VitePreviewServer, type: 'dev' | 'preview'): void {
    const typeName = type === 'dev' ? '开发' : '预览'

    // 处理通用 Server 接口（来自 BuildEngine）
    if ('type' in server && 'url' in server && 'port' in server) {
      this.logger.info(`\n🚀 ${typeName}服务器已启动`)
      this.logger.info(`   引擎: ${server.type}`)
      this.logger.info(`   本地访问: ${server.url}`)

      const localIP = getPreferredLocalIP()
      if (localIP && localIP !== 'localhost' && localIP !== '127.0.0.1') {
        const protocol = server.https ? 'https' : 'http'
        const networkUrl = `${protocol}://${localIP}:${server.port}`
        this.logger.info(`   局域网访问: ${networkUrl}`)
        this.printQRCode(networkUrl)
      }
      return
    }

    // 处理 Vite 特定的 Server（向后兼容）
    const info = this.getServerInfo(server as ViteDevServer | VitePreviewServer)
    this.logger.info(`\n🚀 ${typeName}服务器已启动`)
    this.logger.info(`   本地访问: ${info.url}`)

    const localIP = getPreferredLocalIP()
    if (localIP && localIP !== 'localhost' && localIP !== '127.0.0.1') {
      const networkUrl = `http://${localIP}:${info.port}`
      this.logger.info(`   局域网访问: ${networkUrl}`)
      this.printQRCode(networkUrl)
    }
  }

  /**
   * 打印二维码
   */
  private printQRCode(url: string): void {
    if (process.env.CI)
      return

    this.logger.info('\n   扫描二维码访问:')
    try {
      qrcode.generate(url, { small: true }, (qr) => {
        qr.split('\n').forEach((line) => {
          if (line.trim())
            this.logger.info(`   ${line}`)
        })
      })
    }
    catch {
      // 忽略二维码生成错误
    }

    this.logger.info('')
  }

  /**
   * 打印简化的服务器信息（用于重启）
   */
  printSimpleServerInfo(): void {
    if (this.devServer) {
      const info = this.getServerInfo(this.devServer)
      this.logger.success(`✨ 服务器已重启: ${info.url}`)
    }
    else if (this.previewServer) {
      const info = this.getServerInfo(this.previewServer)
      this.logger.success(`✨ 预览服务器已重启: ${info.url}`)
    }
  }

  /**
   * 查找可用端口
   */
  async findAvailablePort(desiredPort: number): Promise<number | null> {
    const { findAvailablePort } = await import('../utils/server')
    return findAvailablePort(desiredPort)
  }

  /**
   * 清理所有服务器
   */
  async cleanup(): Promise<void> {
    await this.stopDevServer()
    await this.stopPreviewServer()
  }
}
