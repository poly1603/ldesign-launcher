/**
 * 应用配置管理器 - 客户端运行时
 *
 * 提供响应式的配置访问和自动 HMR 更新
 * 支持所有框架（React、Vue、Svelte、Solid、Preact、Lit、Qwik）
 */

/// <reference types="vite/client" />

import { notification } from './notification'

export interface AppConfig {
  app: {
    name: string
    version: string
    description: string
  }
  api: {
    baseUrl: string
    timeout: number
  }
  features: {
    enableAnalytics: boolean
    enableDebug: boolean
  }
  [key: string]: any
}

type ConfigChangeListener = (config: AppConfig) => void

class AppConfigManager {
  private config: AppConfig
  private listeners: Set<ConfigChangeListener> = new Set()
  private hmrInitialized = false

  constructor() {
    // 从 import.meta.env 获取初始配置
    this.config = this.getInitialConfig()
    
    // 自动初始化 HMR
    this.initHMR()
  }

  /**
   * 获取初始配置
   */
  private getInitialConfig(): AppConfig {
    const envConfig = (import.meta.env as any).appConfig
    
    // 检查配置是否存在且有内容
    // 如果 envConfig 是 undefined、null、空对象 {}，都使用默认配置
    const isEmpty = !envConfig 
      || typeof envConfig !== 'object' 
      || Object.keys(envConfig).length === 0
      || (envConfig.constructor === Object && Object.keys(envConfig).length === 0)
    
    if (isEmpty) {
      console.warn('⚠️ 未找到应用配置或配置为空，使用默认配置', {
        hasEnvConfig: !!envConfig,
        envConfigType: typeof envConfig,
        envConfigKeys: envConfig ? Object.keys(envConfig) : [],
        envConfigValue: envConfig
      })
      const defaultConfig = this.getDefaultConfig()
      console.log('✅ 使用默认配置:', defaultConfig)
      return defaultConfig
    }
    
    console.log('✅ 从 import.meta.env.appConfig 加载配置', {
      keys: Object.keys(envConfig),
      config: envConfig
    })
    
    return envConfig
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): AppConfig {
    return {
      app: {
        name: 'App',
        version: '1.0.0',
        description: 'Application'
      },
      api: {
        baseUrl: 'http://localhost:8080/api',
        timeout: 30000
      },
      features: {
        enableAnalytics: false,
        enableDebug: true
      }
    }
  }

  /**
   * 初始化 HMR 监听
   */
  private initHMR() {
    if (this.hmrInitialized) return
    
    if (import.meta.hot) {
      import.meta.hot.on('app-config-updated', (newConfig: AppConfig) => {
        console.log('🔄 配置已更新:', newConfig)
        this.config = newConfig
        this.notifyListeners()
        
        // 显示美观的通知
        notification.success(
          '✨ 应用配置已更新',
          '配置文件已重新加载，页面将自动更新',
          3000
        )
      })
      
      this.hmrInitialized = true
      console.log('✅ 应用配置 HMR 已启用')
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): AppConfig {
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
    this.listeners.forEach(listener => {
      try {
        listener(this.config)
      } catch (error) {
        console.error('配置监听器执行失败:', error)
      }
    })
  }

  /**
   * 获取环境信息
   */
  getEnvironment() {
    return {
      mode: import.meta.env.MODE || 'development',
      isDev: import.meta.env.DEV || false,
      isProd: import.meta.env.PROD || false
    }
  }
}

// 创建单例实例
const appConfigManager = new AppConfigManager()

// 导出管理器实例
export { appConfigManager }

// 导出便捷函数
export const getAppConfig = () => appConfigManager.getConfig()
export const subscribeConfig = (listener: ConfigChangeListener) => appConfigManager.subscribe(listener)
export const getEnvironment = () => appConfigManager.getEnvironment()

