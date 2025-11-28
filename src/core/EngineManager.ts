/**
 * 构建引擎管理器
 *
 * 支持多引擎抽象，当前实现 Vite 引擎
 *
 * @author LDesign Team
 * @since 1.1.0
 */

import type { RollupOutput, RollupWatcher } from 'rollup'
import type { ViteLauncherConfig } from '../types'
import type { Logger } from '../utils/logger'

export type BuildEngineType = 'vite' | 'webpack' | 'rollup'

export interface BuildEngine {
  type: BuildEngineType
  build: (config: any) => Promise<RollupOutput | any>
  buildWatch?: (config: any) => Promise<RollupWatcher | any>
}

export interface EngineManagerOptions {
  logger: Logger
  cwd: string
}

/**
 * 构建引擎管理器
 *
 * 管理不同的构建引擎（Vite, Webpack, Rollup等）
 */
export class EngineManager {
  private logger: Logger
  private cwd: string
  private currentEngine: BuildEngine | null = null
  private buildWatcher: RollupWatcher | null = null

  constructor(options: EngineManagerOptions) {
    this.logger = options.logger
    this.cwd = options.cwd
  }

  /**
   * 创建 Vite 引擎
   */
  async createViteEngine(): Promise<BuildEngine> {
    const { importViteFromCwd } = await import('../utils/vite-resolver')
    const viteModule = await importViteFromCwd(this.cwd)

    const engine: BuildEngine = {
      type: 'vite',
      build: async (config: ViteLauncherConfig): Promise<RollupOutput> => {
        this.logger.info('正在执行 Vite 生产构建...')
        const { build } = viteModule
        return await build(config) as RollupOutput
      },
      buildWatch: async (config: ViteLauncherConfig): Promise<RollupWatcher> => {
        this.logger.info('正在启动 Vite 监听模式构建...')
        const { build } = viteModule

        // 启用监听模式
        if (!config.build) {
          config.build = {}
        }
        config.build.watch = {}

        return await build(config) as RollupWatcher
      },
    }

    this.currentEngine = engine
    return engine
  }

  /**
   * 获取当前引擎
   */
  getCurrentEngine(): BuildEngine | null {
    return this.currentEngine
  }

  /**
   * 执行构建
   */
  async build(config: ViteLauncherConfig): Promise<RollupOutput> {
    if (!this.currentEngine) {
      await this.createViteEngine()
    }

    if (!this.currentEngine) {
      throw new Error('构建引擎未初始化')
    }

    return await this.currentEngine.build(config)
  }

  /**
   * 执行监听模式构建
   */
  async buildWatch(config: ViteLauncherConfig): Promise<RollupWatcher> {
    if (!this.currentEngine) {
      await this.createViteEngine()
    }

    if (!this.currentEngine || !this.currentEngine.buildWatch) {
      throw new Error('当前引擎不支持监听模式')
    }

    const watcher = await this.currentEngine.buildWatch(config)
    this.buildWatcher = watcher
    return watcher
  }

  /**
   * 停止监听模式构建
   */
  async stopBuildWatch(): Promise<void> {
    if (this.buildWatcher) {
      await new Promise<void>((resolve) => {
        this.buildWatcher!.close()
        this.buildWatcher = null
        resolve()
      })
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    await this.stopBuildWatch()
    this.currentEngine = null
  }

  /**
   * 动态导入 Vite 模块（从项目 cwd）
   */
  async importVite(): Promise<any> {
    const { importViteFromCwd } = await import('../utils/vite-resolver')
    return importViteFromCwd(this.cwd)
  }
}

/**
 * 未来可扩展的其他引擎实现示例
 *
 * export class WebpackEngine implements BuildEngine {
 *   type: BuildEngineType = 'webpack'
 *
 *   async build(config: any): Promise<any> {
 *     // Webpack 构建逻辑
 *   }
 * }
 *
 * export class RollupEngine implements BuildEngine {
 *   type: BuildEngineType = 'rollup'
 *
 *   async build(config: any): Promise<any> {
 *     // Rollup 构建逻辑
 *   }
 * }
 */
