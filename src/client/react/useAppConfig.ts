/**
 * React Hook - useAppConfig
 * 
 * 提供对应用配置的访问，当配置变化时自动更新组件。
 * 
 * @module @ldesign/launcher/client/react
 * @author LDesign Team
 * @since 1.0.0
 * 
 * @example
 * ```tsx
 * import { useAppConfig } from '@ldesign/launcher/client/react'
 * 
 * function MyComponent() {
 *   const { config, environment } = useAppConfig()
 *   
 *   return (
 *     <div>
 *       <h1>{config.app.name}</h1>
 *       <p>环境: {environment.mode}</p>
 *       <p>开发模式: {environment.isDev ? '是' : '否'}</p>
 *     </div>
 *   )
 * }
 * ```
 */

import { useState, useEffect } from 'react'
import { appConfigManager, AppConfig } from '../app-config'

/**
 * useAppConfig Hook 返回值类型
 * 
 * @interface UseAppConfigReturn
 */
export interface UseAppConfigReturn {
  /** 应用配置对象 */
  config: AppConfig
  
  /** 环境信息 */
  environment: {
    /** 当前运行模式 (development/production/test) */
    mode: string
    /** 是否为开发环境 */
    isDev: boolean
    /** 是否为生产环境 */
    isProd: boolean
  }
}

/**
 * React Hook 获取应用配置
 * 
 * 自动订阅配置变化，当配置更新时会触发组件重新渲染。
 * 
 * @returns {UseAppConfigReturn} 配置对象和环境信息
 */
export function useAppConfig(): UseAppConfigReturn {
  const [config, setConfig] = useState<AppConfig>(() => appConfigManager.getConfig())
  const [environment] = useState(() => appConfigManager.getEnvironment())

  useEffect(() => {
    // 订阅配置变化
    const unsubscribe = appConfigManager.subscribe((newConfig) => {
      setConfig(newConfig)
    })

    // 组件卸载时取消订阅
    return unsubscribe
  }, [])

  return {
    config,
    environment
  }
}

