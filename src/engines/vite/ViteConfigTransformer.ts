/**
 * Vite 配置转换器
 *
 * 将 ViteLauncherConfig 转换为 Vite 的 UserConfig 格式
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type { UserConfig as ViteUserConfig } from 'vite'
import type { ViteLauncherConfig } from '../../types/config'
import type { ConfigTransformer } from '../../types/engine'
import { Logger } from '../../utils/logger'

/**
 * Vite 配置转换器类
 */
export class ViteConfigTransformer implements ConfigTransformer {
  private logger: Logger

  constructor() {
    this.logger = new Logger('ViteConfigTransformer')
  }

  /**
   * 转换配置
   *
   * @param config - Launcher 统一配置
   * @returns Vite UserConfig
   */
  transform(config: ViteLauncherConfig): ViteUserConfig {
    this.logger.debug('开始转换配置为 Vite 格式')

    // 提取 Vite 原生配置
    const {
      // 移除 Launcher 特有字段
      launcher,
      proxy,
      tools,
      engine,
      framework,
      // 保留所有 Vite 原生字段
      ...viteConfig
    } = config

    // 构建最终的 Vite 配置
    const transformedConfig: ViteUserConfig = {
      ...viteConfig,
      
      // 如果有代理配置，确保正确传递
      server: {
        host: '0.0.0.0', // 默认监听所有接口
        ...viteConfig.server,
        proxy: this.transformProxyConfig(proxy)
      },
      
      // 预览服务器配置
      preview: {
        host: '0.0.0.0', // 默认监听所有接口
        strictPort: false, // 如果端口占用则尝试下一个
        ...viteConfig.preview
      }
    }

    this.logger.debug('配置转换完成')
    return transformedConfig
  }

  /**
   * 验证配置
   * 
   * @param config - Vite UserConfig
   * @returns 是否有效
   */
  validate(config: ViteUserConfig): boolean {
    // 基本验证：确保配置是对象
    if (!config || typeof config !== 'object') {
      this.logger.error('配置必须是一个对象')
      return false
    }

    // 可以添加更多验证逻辑
    return true
  }

  /**
   * 转换代理配置
   * 
   * @param proxyConfig - Launcher 代理配置
   * @returns Vite 代理配置
   */
  private transformProxyConfig(proxyConfig: any): any {
    if (!proxyConfig) {
      return undefined
    }

    // 如果已经是 Vite 格式，直接返回
    if (typeof proxyConfig === 'object' && !Array.isArray(proxyConfig)) {
      return proxyConfig
    }

    // 这里可以添加更复杂的代理配置转换逻辑
    return proxyConfig
  }
}

/**
 * 创建 Vite 配置转换器实例
 */
export function createViteConfigTransformer(): ViteConfigTransformer {
  return new ViteConfigTransformer()
}

