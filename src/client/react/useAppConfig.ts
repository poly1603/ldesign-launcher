/**
 * React Hook - useAppConfig
 * 
 * 使用方式：
 * ```tsx
 * import { useAppConfig } from '@ldesign/launcher/client/react'
 * 
 * function MyComponent() {
 *   const { config, environment } = useAppConfig()
 *   return <div>{config.app.name}</div>
 * }
 * ```
 */

import { useState, useEffect } from 'react'
import { appConfigManager, AppConfig } from '../app-config'

export interface UseAppConfigReturn {
  config: AppConfig
  environment: {
    mode: string
    isDev: boolean
    isProd: boolean
  }
}

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

