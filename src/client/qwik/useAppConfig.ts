/**
 * Qwik Hook - useAppConfig
 * 
 * 使用方式：
 * ```tsx
 * import { useAppConfig } from '@ldesign/launcher/client/qwik'
 * 
 * export default component$(() => {
 *   const { config, environment } = useAppConfig()
 *   return <div>{config.value.app.name}</div>
 * })
 * ```
 */

import { useSignal, useVisibleTask$, Signal } from '@builder.io/qwik'
import { appConfigManager, AppConfig } from '../app-config'

export interface UseAppConfigReturn {
  config: Signal<AppConfig>
  environment: Signal<{
    mode: string
    isDev: boolean
    isProd: boolean
  }>
}

export function useAppConfig(): UseAppConfigReturn {
  const config = useSignal<AppConfig>(appConfigManager.getConfig())
  const environment = useSignal(appConfigManager.getEnvironment())

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    // 订阅配置变化
    const unsubscribe = appConfigManager.subscribe((newConfig) => {
      config.value = newConfig
    })

    // 组件卸载时取消订阅
    return unsubscribe
  })

  return {
    config,
    environment
  }
}

