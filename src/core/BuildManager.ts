/**
 * 构建管理器
 * 专注于生产构建和构建监听的管理
 * 
 * @author LDesign Team
 * @since 2.1.0
 */

import type { RollupOutput, RollupWatcher } from 'rollup'
import type { ViteLauncherConfig } from '../types'
import { Logger } from '../utils/logger'

export interface BuildManagerOptions {
  cwd: string
  logger: Logger
  environment?: string
}

export class BuildManager {
  private buildWatcher: RollupWatcher | null = null
  private logger: Logger
  private cwd: string
  private environment?: string

  constructor(options: BuildManagerOptions) {
    this.cwd = options.cwd
    this.logger = options.logger
    this.environment = options.environment
  }

  /**
   * 执行生产构建
   */
  async build(config: ViteLauncherConfig): Promise<RollupOutput> {
    try {
      const buildStartTime = Date.now()
      this.logger.info('正在执行生产构建...')

      // 动态导入 Vite
      const { importViteFromCwd } = await import('../utils/vite-resolver')
      const viteMod = await importViteFromCwd(this.cwd)
      const { build } = viteMod

      // 执行构建
      const result = await build(config) as RollupOutput

      const duration = Date.now() - buildStartTime
      this.logger.success(`生产构建完成，耗时 ${duration}ms`)

      return result
    } catch (error) {
      this.logger.error('生产构建失败', { error: (error as Error).message })
      throw error
    }
  }

  /**
   * 启动监听模式构建
   */
  async buildWatch(config: ViteLauncherConfig): Promise<RollupWatcher> {
    try {
      this.logger.info('正在启动监听模式构建...')

      // 合并配置，启用监听模式
      const watchConfig = {
        ...config,
        build: {
          ...config.build,
          watch: {}
        }
      }

      // 动态导入 Vite
      const { importViteFromCwd } = await import('../utils/vite-resolver')
      const viteMod = await importViteFromCwd(this.cwd)
      const { build } = viteMod

      // 执行监听构建
      this.buildWatcher = await build(watchConfig) as RollupWatcher

      this.logger.success('监听模式构建已启动')
      return this.buildWatcher
    } catch (error) {
      this.logger.error('启动监听模式构建失败', { error: (error as Error).message })
      throw error
    }
  }

  /**
   * 停止监听模式构建
   */
  async stopBuildWatch(): Promise<void> {
    if (!this.buildWatcher) {
      this.logger.warn('监听模式构建未运行')
      return
    }

    try {
      this.logger.info('正在停止监听模式构建...')
      await this.buildWatcher.close()
      this.buildWatcher = null
      this.logger.success('监听模式构建已停止')
    } catch (error) {
      this.logger.error('停止监听模式构建失败', { error: (error as Error).message })
      throw error
    }
  }

  /**
   * 获取构建监听器实例
   */
  getBuildWatcher(): RollupWatcher | null {
    return this.buildWatcher
  }

  /**
   * 检查监听模式构建是否运行
   */
  isBuildWatchRunning(): boolean {
    return this.buildWatcher !== null
  }

  /**
   * 销毁构建管理器
   */
  async destroy(): Promise<void> {
    await this.stopBuildWatch()
  }
}
