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

export interface UseAppConfigReturn {
  config: Accessor<AppConfig>
  environment: Accessor<{
    mode: string
    isDev: boolean
    isProd: boolean
  }>
}

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

