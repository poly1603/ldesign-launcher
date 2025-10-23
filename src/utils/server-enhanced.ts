/**
 * 服务器增强工具
 * 
 * 提供自动端口分配、健康检查等增强功能
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { Logger } from './logger'
import { findPortInRange, checkServerHealth, openInBrowser } from './server'
import type { ViteDevServer } from 'vite'

/**
 * 服务器增强选项
 */
export interface ServerEnhancedOptions {
  /** 自动端口范围 */
  autoPortRange?: [number, number]
  /** 是否启用健康检查 */
  healthCheck?: boolean
  /** 健康检查间隔（毫秒） */
  healthCheckInterval?: number
  /** 浏览器配置 */
  browser?: {
    name?: 'chrome' | 'edge' | 'firefox' | 'safari'
    incognito?: boolean
  }
}

/**
 * 服务器增强管理器
 */
export class ServerEnhanced {
  private logger: Logger
  private options: ServerEnhancedOptions
  private healthCheckTimer?: NodeJS.Timeout

  constructor(options: ServerEnhancedOptions = {}) {
    this.logger = new Logger('ServerEnhanced')
    this.options = {
      autoPortRange: options.autoPortRange || [3000, 3100],
      healthCheck: options.healthCheck !== false,
      healthCheckInterval: options.healthCheckInterval || 30000,
      browser: options.browser || {}
    }
  }

  /**
   * 自动分配可用端口
   */
  async allocatePort(preferredPort: number): Promise<number> {
    const [start, end] = this.options.autoPortRange!

    try {
      // 先尝试首选端口
      const { isPortAvailable } = await import('./server')
      if (await isPortAvailable(preferredPort)) {
        return preferredPort
      }

      // 在范围内查找可用端口
      this.logger.info(`端口 ${preferredPort} 被占用，自动查找可用端口...`)
      const availablePort = await findPortInRange(this.options.autoPortRange!)

      this.logger.success(`找到可用端口: ${availablePort}`)
      return availablePort

    } catch (error) {
      this.logger.error('端口分配失败', { error: (error as Error).message })
      throw error
    }
  }

  /**
   * 启动健康检查
   */
  startHealthCheck(server: ViteDevServer): void {
    if (!this.options.healthCheck) {
      return
    }

    const checkHealth = async () => {
      try {
        const url = server.resolvedUrls?.local?.[0]
        if (!url) return

        const healthy = await checkServerHealth(url)

        if (!healthy) {
          this.logger.warn('服务器健康检查失败')
          this.emit('unhealthy', { url })
        } else {
          this.logger.debug('服务器健康检查通过')
        }
      } catch (error) {
        this.logger.debug('健康检查异常', { error: (error as Error).message })
      }
    }

    // 立即检查一次
    checkHealth()

    // 定期检查
    this.healthCheckTimer = setInterval(checkHealth, this.options.healthCheckInterval)
  }

  /**
   * 停止健康检查
   */
  stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = undefined
    }
  }

  /**
   * 在浏览器中打开
   */
  async openBrowser(url: string): Promise<void> {
    try {
      await openInBrowser(
        url,
        this.options.browser?.name,
        { incognito: this.options.browser?.incognito }
      )

      this.logger.success(`已在浏览器中打开: ${url}`)
    } catch (error) {
      this.logger.warn('打开浏览器失败', { error: (error as Error).message })
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.stopHealthCheck()
    this.removeAllListeners()
  }

  // 继承 EventEmitter 的方法
  private emit(event: string, data?: unknown): boolean {
    return true
  }

  private removeAllListeners(): void {
    // 清理监听器
  }
}

/**
 * 创建服务器增强实例
 */
export function createServerEnhanced(options?: ServerEnhancedOptions): ServerEnhanced {
  return new ServerEnhanced(options)
}

