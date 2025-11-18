/**
 * Launcher 配置管理器 - 客户端运行时
 *
 * 提供响应式的 Launcher 配置访问和自动 HMR 更新
 * 支持所有框架（React、Vue、Svelte、Solid、Preact、Lit、Qwik）
 */

/// <reference types="vite/client" />

/* eslint-disable no-console */

import { notification } from './notification'

/**
 * Launcher 配置接口
 */
export interface LauncherConfig {
  /** 应用名称 */
  name: string
  /** 应用版本 */
  version: string
  /** 当前环境 */
  environment: string
  /** 服务器配置 */
  server?: any
  /** 预览服务器配置 */
  preview?: any
  /** 构建配置 */
  build?: any
  /** 路径解析配置 */
  resolve?: any
  /** CSS 配置 */
  css?: any
  /** 依赖优化配置 */
  optimizeDeps?: any
  /** Launcher 特定配置 */
  launcher?: any
  /** 全局常量定义 */
  define?: any
  /** 环境变量前缀 */
  envPrefix?: string
  /** 代理配置 */
  proxy?: any
  /** 插件数量 */
  pluginsCount?: number
  [key: string]: any
}

type ConfigChangeListener = (config: LauncherConfig) => void

/**
 * Launcher 配置管理器类
 */
class LauncherConfigManager {
  private config: LauncherConfig
  private listeners: Set<ConfigChangeListener> = new Set()
  private hmrInitialized = false

  constructor() {
    // 从 import.meta.env 或 API 获取初始配置
    this.config = this.getInitialConfig()

    // 自动初始化 HMR
    this.initHMR()
  }

  /**
   * 获取初始配置
   */
  private getInitialConfig(): LauncherConfig {
    // 方法1: 从 import.meta.env 获取
    const envConfig = (import.meta.env as any).VITE_LAUNCHER_CONFIG

    if (envConfig) {
      const parsed = typeof envConfig === 'string' ? JSON.parse(envConfig) : envConfig
      if (import.meta.env.DEV) {
        console.log('✅ 从 import.meta.env.VITE_LAUNCHER_CONFIG 加载 Launcher 配置', parsed)
      }
      return parsed
    }

    // 使用默认配置
    if (import.meta.env.DEV) {
      console.warn('⚠️ 未找到 Launcher 配置，使用默认配置')
    }
    return this.getDefaultConfig()
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): LauncherConfig {
    return {
      name: 'LDesign App',
      version: '1.0.0',
      environment: 'development',
    }
  }

  /**
   * 初始化 HMR 监听
   */
  private initHMR() {
    if (this.hmrInitialized)
      return

    if (import.meta.hot) {
      // 监听 launcher 配置更新
      import.meta.hot.on('launcher-config-updated', (newConfig: LauncherConfig) => {
        if (import.meta.env.DEV) {
          console.log('🔄 Launcher 配置已更新:', newConfig)
        }
        this.config = newConfig
        this.notifyListeners()

        // 显示美观的通知
        notification.info(
          '🚀 Launcher 配置已更新',
          '配置文件已重新加载，某些更改可能需要重启服务器',
          4000,
        )
      })

      this.hmrInitialized = true
      if (import.meta.env.DEV) {
        console.log('✅ Launcher 配置 HMR 已启用')
      }
    }
  }

  /**
   * 从 API 加载完整配置
   */
  async loadFromAPI(): Promise<void> {
    try {
      const response = await fetch('/__ldesign_config')
      if (response.ok) {
        const data = await response.json()
        this.config = data.config
        if (import.meta.env.DEV) {
          console.log('✅ 从 API 加载 Launcher 配置成功:', data)
        }
        this.notifyListeners()
      }
    }
    catch (error) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ 无法从 API 获取 Launcher 配置:', error)
      }
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): LauncherConfig {
    return this.config
  }

  /**
   * 订阅配置变化
   * @param listener 配置变化回调函数
   * @returns 取消订阅函数
   */
  subscribe(listener: ConfigChangeListener): () => void {
    this.listeners.add(listener)

    // 返回取消订阅函数
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.config)
      }
      catch (error) {
        if (import.meta.env.DEV) {
          console.error('Launcher 配置监听器执行失败:', error)
        }
      }
    })
  }

  /**
   * 获取环境信息
   */
  getEnvironment() {
    return {
      mode: this.config.environment || import.meta.env.MODE || 'development',
      isDev: import.meta.env.DEV,
      isProd: import.meta.env.PROD,
    }
  }
}

// 创建单例实例
const launcherConfigManager = new LauncherConfigManager()

// 导出管理器实例
export { launcherConfigManager }

// 导出便捷函数
export const getLauncherConfig = () => launcherConfigManager.getConfig()
export const subscribeLauncherConfig = (listener: ConfigChangeListener) => launcherConfigManager.subscribe(listener)
export const getLauncherEnvironment = () => launcherConfigManager.getEnvironment()
