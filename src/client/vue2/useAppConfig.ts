/**
 * Vue 2 Mixin - useAppConfig
 * 
 * 使用方式：
 * ```vue
 * <script>
 * import { appConfigMixin } from '@ldesign/launcher/client/vue2'
 * 
 * export default {
 *   mixins: [appConfigMixin],
 *   mounted() {
 *     console.log(this.appConfig.app.name)
 *   }
 * }
 * </script>
 * 
 * <template>
 *   <div>{{ appConfig.app.name }}</div>
 * </template>
 * ```
 */

import { appConfigManager, AppConfig } from '../app-config'

export interface AppConfigData {
  appConfig: AppConfig
  appEnvironment: {
    mode: string
    isDev: boolean
    isProd: boolean
  }
  _unsubscribeAppConfig: (() => void) | null
}

export const appConfigMixin = {
  data(): AppConfigData {
    return {
      appConfig: appConfigManager.getConfig(),
      appEnvironment: appConfigManager.getEnvironment(),
      _unsubscribeAppConfig: null
    }
  },

  mounted(this: any) {
    // 订阅配置变化
    this._unsubscribeAppConfig = appConfigManager.subscribe((newConfig: AppConfig) => {
      this.appConfig = newConfig
    })
  },

  beforeDestroy(this: any) {
    // 组件销毁时取消订阅
    if (this._unsubscribeAppConfig) {
      this._unsubscribeAppConfig()
    }
  }
}

// 也提供函数式 API（需要手动管理订阅）
export function getAppConfig() {
  return appConfigManager.getConfig()
}

export function subscribeAppConfig(callback: (config: AppConfig) => void) {
  return appConfigManager.subscribe(callback)
}

