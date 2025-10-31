/**
 * Vue 3 Composable - useAppConfig
 * 
 * 使用方式：
 * ```vue
 * <script setup>
 * import { useAppConfig } from '@ldesign/launcher/client/vue'
 * 
 * const { config, environment } = useAppConfig()
 * </script>
 * 
 * <template>
 *   <div>{{ config.app.name }}</div>
 * </template>
 * ```
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { appConfigManager, AppConfig } from '../app-config'

export interface UseAppConfigReturn {
  config: import('vue').Ref<AppConfig>
  environment: import('vue').Ref<{
    mode: string
    isDev: boolean
    isProd: boolean
  }>
}

export function useAppConfig(): UseAppConfigReturn {
  const config = ref<AppConfig>(appConfigManager.getConfig())
  const environment = ref(appConfigManager.getEnvironment())

  let unsubscribe: (() => void) | null = null

  onMounted(() => {
    // 订阅配置变化
    unsubscribe = appConfigManager.subscribe((newConfig) => {
      config.value = newConfig
    })
  })

  onUnmounted(() => {
    // 组件卸载时取消订阅
    if (unsubscribe) {
      unsubscribe()
    }
  })

  return {
    config,
    environment
  }
}

