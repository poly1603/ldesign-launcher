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
import { Banner } from '../ui/Banner'
import { QRCode } from '../ui/QRCode'
import { NetworkInfo } from '../utils/network-info'

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
  private devServer: ViteDevServer | null = null
  private previewServer: VitePreviewServer | null = null

  constructor(options: ServerManagerOptions) {
    this.logger = options.logger
    // cwd 参数暂未使用,但保留以备将来扩展
  }

  /**
   * 启动开发服务器
   */
  async startDevServer(config: ViteLauncherConfig, viteModule: any): Promise<ViteDevServer> {
    const { createServer } = viteModule

    this.logger.info('正在启动开发服务器...')

    // 创建并启动服务器
    this.devServer = await createServer(config)
    await this.devServer!.listen()

    this.logger.success('开发服务器启动成功')

    if (!this.devServer) {
      throw new Error('开发服务器创建失败')
    }

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

    if (!this.previewServer) {
      throw new Error('预览服务器创建失败')
    }

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
   * 使用增强的 UI 组件美化显示
   */
  printServerInfo(server: DevServer | PreviewServer | ViteDevServer | VitePreviewServer, _type: 'dev' | 'preview', framework?: string, options?: { showQRCode?: boolean, startTime?: number }): void {
    const { showQRCode = true, startTime } = options || {}
    
    // 获取服务器地址信息
    let localUrl: string
    let port: number
    let https = false
    
    // 处理通用 Server 接口（来自 BuildEngine）
    if ('type' in server && 'url' in server && 'port' in server) {
      localUrl = server.url
      port = server.port
      https = server.https || false
    }
    // 处理 Vite 特定的 Server（向后兼容）
    else {
      const info = this.getServerInfo(server as ViteDevServer | VitePreviewServer)
      localUrl = info.url
      port = info.port
      https = info.https
    }

    // 使用 NetworkInfo 格式化地址
    const protocol = https ? 'https' : 'http'
    const addresses = NetworkInfo.formatUrls('localhost', port, protocol)

    // 显示启动信息 Banner
    const bannerInfo = Banner.renderStartupInfo({
      title: 'Launcher',
      version: '2.0.0',
      framework: framework,
      engine: 'Vite 5.0',
      nodeVersion: process.version,
      startTime: startTime,
      useGradient: true,
    })
    this.logger.raw(bannerInfo)

    // 显示网络地址信息
    const networkInfo = Banner.renderNetworkInfo({
      local: localUrl,
      network: addresses.network,
    })
    this.logger.raw(networkInfo)

    // 显示二维码（如果有网络地址且启用）
    if (showQRCode && addresses.network.length > 0 && !process.env.CI) {
      QRCode.display({
        local: localUrl,
        network: addresses.network,
        showUrl: false, // URL已经在上面显示了
      })
    }

    // 显示快捷键帮助
    const shortcuts = Banner.renderShortcuts([
      { key: 'h', description: '显示帮助' },
      { key: 'c', description: '清屏' },
      { key: 'o', description: '在浏览器中打开' },
      { key: 'r', description: '重启服务器' },
      { key: 'q', description: '退出' },
    ])
    this.logger.raw(shortcuts)

    // 复制地址到剪贴板
    NetworkInfo.copyToClipboard(localUrl).then(success => {
      if (success) {
        this.logger.raw('\n')
      }
    })
  }


  /**
   * 打印简化的服务器信息（用于重启）
   * 使用Banner组件美化显示
   */
  printSimpleServerInfo(): void {
    if (this.devServer) {
      const info = this.getServerInfo(this.devServer)
      const banner = Banner.renderSuccess(
        '服务器已重启',
        [`访问地址: ${info.url}`]
      )
      this.logger.raw('\n' + banner)
    }
    else if (this.previewServer) {
      const info = this.getServerInfo(this.previewServer)
      const banner = Banner.renderSuccess(
        '预览服务器已重启',
        [`访问地址: ${info.url}`]
      )
      this.logger.raw('\n' + banner)
    }
  }

  /**
   * 查找可用端口
   */
  async findAvailablePort(desiredPort: number): Promise<number | null> {
    try {
      const port = await NetworkInfo.findAvailablePort(desiredPort)
      return port
    } catch {
      return null
    }
  }

  /**
   * 清理所有服务器
   */
  async cleanup(): Promise<void> {
    await this.stopDevServer()
    await this.stopPreviewServer()
  }
}
