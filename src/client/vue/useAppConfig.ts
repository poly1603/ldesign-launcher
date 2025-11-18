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

import type { AppConfig } from '../app-config'
import { onMounted, onUnmounted, ref } from 'vue'
import { appConfigManager } from '../app-config'

/**
 * useAppConfig Composable 返回值类型
 *
 * @interface UseAppConfigReturn
 */
export interface UseAppConfigReturn {
  /** 应用配置对象（响应式） */
  config: import('vue').Ref<AppConfig>

  /** 环境信息（响应式） */
  environment: import('vue').Ref<{
    /** 当前运行模式 (development/production/test) */
    mode: string
    /** 是否为开发环境 */
    isDev: boolean
    /** 是否为生产环境 */
    isProd: boolean
  }>
}

/**
 * Vue 3 Composition API 获取应用配置
 *
 * 提供响应式的应用配置访问，当配置更新时自动触发视图更新。
 *
 * @returns {UseAppConfigReturn} 响应式配置对象和环境信息
 */
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
    environment,
  }
}
