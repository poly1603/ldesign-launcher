/**
 * 插件编排器
 * 
 * 统一管理框架检测、插件加载、插件合并等逻辑
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

import type { Plugin } from 'vite'
import type { Logger } from '../utils/logger'
import type { ViteLauncherConfig } from '../types'
import { PluginManager } from './PluginManager'

export interface PluginOrchestratorOptions {
  logger: Logger
  cwd: string
}

/**
 * 插件编排器
 * 
 * 负责协调框架检测和插件加载的整个流程
 */
export class PluginOrchestrator {
  private logger: Logger
  private cwd: string
  private pluginManager: PluginManager

  constructor(options: PluginOrchestratorOptions) {
    this.logger = options.logger
    this.cwd = options.cwd
    this.pluginManager = new PluginManager(this.cwd, this.logger)
  }

  /**
   * 检测框架并获取推荐插件
   * 
   * @param explicitFramework - 用户明确指定的框架类型
   * @returns 推荐的插件列表
   */
  async detectAndLoadPlugins(explicitFramework?: string): Promise<Plugin[]> {
    this.logger.info('开始智能插件检测...')

    try {
      // 获取智能检测的插件
      const smartPlugins = await this.pluginManager.getRecommendedPlugins(explicitFramework)
      
      this.logger.info('智能插件检测完成', { count: smartPlugins.length })
      
      return smartPlugins
    } catch (error) {
      this.logger.warn('智能插件检测失败', { error: (error as Error).message })
      return []
    }
  }

  /**
   * 增强配置，添加智能检测的插件
   * 
   * @param config - 原始配置
   * @param explicitFramework - 用户明确指定的框架类型
   * @returns 增强后的配置
   */
  async enhanceConfigWithPlugins(
    config: ViteLauncherConfig,
    explicitFramework?: string
  ): Promise<ViteLauncherConfig> {
    try {
      const smartPlugins = await this.detectAndLoadPlugins(explicitFramework)

      if (smartPlugins.length === 0) {
        return config
      }

      // 合并插件（去重）
      const mergedPlugins = this.mergePlugins(config.plugins || [], smartPlugins)

      this.logger.debug('插件增强完成', {
        smartPlugins: smartPlugins.length,
        userPlugins: (config.plugins || []).length,
        total: mergedPlugins.length
      })

      return {
        ...config,
        plugins: mergedPlugins
      }
    } catch (error) {
      this.logger.warn('插件增强失败', { error: (error as Error).message })
      return config
    }
  }

  /**
   * 合并插件列表，按名称去重
   * 
   * @param userPlugins - 用户配置的插件
   * @param smartPlugins - 智能检测的插件
   * @returns 合并后的插件列表
   */
  private mergePlugins(userPlugins: any[], smartPlugins: Plugin[]): any[] {
    // 将可能的嵌套数组拍平
    const flatten = (arr: any[]): any[] => 
      arr.flat ? arr.flat(Infinity) : ([] as any[]).concat(...arr)

    const userFlat = Array.isArray(userPlugins) ? flatten(userPlugins) : [userPlugins]
    const smartFlat = Array.isArray(smartPlugins) ? flatten(smartPlugins) : [smartPlugins]

    // 收集用户插件的名称
    const existingNames = new Set<string>(
      userFlat
        .filter((p: any) => p && typeof p === 'object' && 'name' in p)
        .map((p: any) => p.name as string)
    )

    // 合并插件
    const merged: any[] = [...userFlat]
    for (const plugin of smartFlat) {
      const name = plugin && typeof plugin === 'object' && 'name' in plugin 
        ? (plugin as any).name as string 
        : undefined

      if (!name || !existingNames.has(name)) {
        merged.unshift(plugin) // 智能插件优先，但不覆盖用户已显式配置的插件
        if (name) existingNames.add(name)
      }
    }

    return merged
  }

  /**
   * 获取插件管理器实例（用于向后兼容）
   */
  getPluginManager(): PluginManager {
    return this.pluginManager
  }

  /**
   * 检查用户是否明确指定了框架
   * 
   * @param config - 配置对象
   * @returns 框架类型或 undefined
   */
  getExplicitFramework(config: ViteLauncherConfig): string | undefined {
    // 支持两种配置方式：config.framework.type 和 config.launcher.framework
    const explicitFramework = (config as any).framework?.type || (config as any).launcher?.framework
    
    if (explicitFramework) {
      this.logger.info('检测到用户指定的框架类型', { type: explicitFramework })
    }
    
    return explicitFramework
  }
}
