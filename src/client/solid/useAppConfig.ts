/**
 * Solid.js Hook - useAppConfig
 * 
 * 使用方式：
 * ```tsx
 * import { useAppConfig } from '@ldesign/launcher/client/solid'
 * 
 * function MyComponent() {
 *   const { config, environment } = useAppConfig()
 *   return <div>{config().app.name}</div>
 * }
 * ```
 */

import { createSignal, onMount, onCleanup, Accessor } from 'solid-js'
import { appConfigManager, AppConfig } from '../app-config'

/**
 * useAppConfig Hook 返回值类型
 * 
 * @interface UseAppConfigReturn
 */
export interface UseAppConfigReturn {
  /** 应用配置对象（Signal） */
  config: Accessor<AppConfig>
  
  /** 环境信息（Signal） */
  environment: Accessor<{
    /** 当前运行模式 (development/production/test) */
    mode: string
    /** 是否为开发环境 */
    isDev: boolean
    /** 是否为生产环境 */
    isProd: boolean
  }>
}

/**
 * Solid.js Hook 获取应用配置
 * 
 * 提供响应式的应用配置访问，当配置更新时自动触发组件更新。
 * 
 * @returns {UseAppConfigReturn} Signal 配置对象和环境信息
 */
export function useAppConfig(): UseAppConfigReturn {
  const [config, setConfig] = createSignal<AppConfig>(appConfigManager.getConfig())
  const [environment] = createSignal(appConfigManager.getEnvironment())

  onMount(() => {
    // 订阅配置变化
    const unsubscribe = appConfigManager.subscribe((newConfig) => {
      setConfig(newConfig)
    })

    // 组件卸载时取消订阅
    onCleanup(unsubscribe)
  })

  return {
    config,
    environment
  }
}

