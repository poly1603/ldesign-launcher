/**
 * Svelte Store - appConfig
 * 
 * 使用方式：
 * ```svelte
 * <script>
 * import { appConfig, appEnvironment } from '@ldesign/launcher/client/svelte'
 * </script>
 * 
 * <div>{$appConfig.app.name}</div>
 * <div>环境: {$appEnvironment.mode}</div>
 * ```
 */

import { writable, readable } from 'svelte/store'
import { appConfigManager, AppConfig } from '../app-config'

// 创建可写的配置 store
function createAppConfigStore() {
  const { subscribe, set } = writable<AppConfig>(appConfigManager.getConfig())

  // 订阅配置管理器的变化
  appConfigManager.subscribe((newConfig) => {
    set(newConfig)
  })

  return {
    subscribe
  }
}

// 创建只读的环境 store
function createEnvironmentStore() {
  return readable(appConfigManager.getEnvironment())
}

// 导出 stores
export const appConfig = createAppConfigStore()
export const appEnvironment = createEnvironmentStore()

// 也提供函数式 API
export { getAppConfig, subscribeConfig } from '../app-config'

