/**
 * 服务器管理器
 * 专注于开发服务器和预览服务器的生命周期管理
 * 
 * @author LDesign Team
 * @since 2.1.0
 */

import type { ViteDevServer, PreviewServer } from 'vite'
import type { ViteLauncherConfig } from '../types'
import { Logger } from '../utils/logger'
import { PathUtils } from '../utils/path-utils'

export interface ServerManagerOptions {
  cwd: string
  logger: Logger
  environment?: string
}

export class ServerManager {
  private devServer: ViteDevServer | null = null
  private previewServer: PreviewServer | null = null
  private logger: Logger
  private cwd: string
  private environment?: string

  constructor(options: ServerManagerOptions) {
    this.cwd = options.cwd
    this.logger = options.logger
    this.environment = options.environment
  }

  /**
   * 启动开发服务器
   */
  async startDev(config: ViteLauncherConfig): Promise<ViteDevServer> {
    try {
      this.logger.info('正在启动开发服务器...')

      // 动态导入 Vite
      const { importViteFromCwd } = await import('../utils/vite-resolver')
      const viteMod = await importViteFromCwd(this.cwd)
      const { createServer } = viteMod

      // 创建开发服务器
      this.devServer = await createServer(config)

      // 启动服务器监听
      await this.devServer.listen()

      // 打印 URLs
      if (this.devServer && typeof (this.devServer as any).printUrls === 'function') {
        (this.devServer as any).printUrls()
      }

      this.logger.debug('开发服务器启动成功')
      return this.devServer
    } catch (error) {
      this.logger.error('开发服务器启动失败', { error: (error as Error).message })
      throw error
    }
  }

  /**
   * 停止开发服务器
   */
  async stopDev(): Promise<void> {
    if (!this.devServer) {
      this.logger.warn('开发服务器未运行')
      return
    }

    try {
      this.logger.info('正在停止开发服务器...')
      await this.devServer.close()
      this.devServer = null
      this.logger.success('开发服务器已停止')
    } catch (error) {
      this.logger.error('停止开发服务器失败', { error: (error as Error).message })
      throw error
    }
  }

  /**
   * 重启开发服务器
   */
  async restartDev(config: ViteLauncherConfig): Promise<ViteDevServer> {
    this.logger.info('正在重启开发服务器...')
    await this.stopDev()
    const server = await this.startDev(config)
    this.logger.success('开发服务器重启完成')
    return server
  }

  /**
   * 启动预览服务器
   */
  async startPreview(config: ViteLauncherConfig): Promise<PreviewServer> {
    try {
      this.logger.info('正在启动预览服务器...')

      // 动态导入 Vite
      const { importViteFromCwd } = await import('../utils/vite-resolver')
      const viteMod = await importViteFromCwd(this.cwd)
      const { preview } = viteMod

      // 创建预览服务器
      this.previewServer = await preview(config)

      this.logger.success('预览服务器启动成功')
      return this.previewServer
    } catch (error) {
      this.logger.error('预览服务器启动失败', { error: (error as Error).message })
      throw error
    }
  }

  /**
   * 停止预览服务器
   */
  async stopPreview(): Promise<void> {
    if (!this.previewServer) {
      this.logger.warn('预览服务器未运行')
      return
    }

    try {
      this.logger.info('正在停止预览服务器...')
      await (this.previewServer.httpServer as any).close()
      this.previewServer = null
      this.logger.success('预览服务器已停止')
    } catch (error) {
      this.logger.error('停止预览服务器失败', { error: (error as Error).message })
      throw error
    }
  }

  /**
   * 获取开发服务器实例
   */
  getDevServer(): ViteDevServer | null {
    return this.devServer
  }

  /**
   * 获取预览服务器实例
   */
  getPreviewServer(): PreviewServer | null {
    return this.previewServer
  }

  /**
   * 检查开发服务器是否运行
   */
  isDevServerRunning(): boolean {
    return this.devServer !== null
  }

  /**
   * 检查预览服务器是否运行
   */
  isPreviewServerRunning(): boolean {
    return this.previewServer !== null
  }

  /**
   * 销毁服务器管理器
   */
  async destroy(): Promise<void> {
    await this.stopDev()
    await this.stopPreview()
  }
}
