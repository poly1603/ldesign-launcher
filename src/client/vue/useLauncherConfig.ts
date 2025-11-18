/**
 * Vue 3 Composable - useLauncherConfig
 *
 * 使用方式：
 * ```vue
 * <script setup>
 * import { useLauncherConfig } from '@ldesign/launcher/client/vue'
 *
 * const { config, environment } = useLauncherConfig()
 * </script>
 *
 * <template>
 *   <div>{{ config.name }}</div>
 *   <div>服务器端口: {{ config.server?.port }}</div>
 * </template>
 * ```
 */

import type { LauncherConfig } from '../launcher-config'
import { onMounted, onUnmounted, ref } from 'vue'
import { launcherConfigManager } from '../launcher-config'

/**
 * useLauncherConfig Composable 返回值类型
 *
 * @interface UseLauncherConfigReturn
 */
export interface UseLauncherConfigReturn {
  /** Launcher 配置对象（响应式） */
  config: import('vue').Ref<LauncherConfig>

  /** 环境信息（响应式） */
  environment: import('vue').Ref<{
    /** 当前运行模式 (development/production/test) */
    mode: string
    /** 是否为开发环境 */
    isDev: boolean
    /** 是否为生产环境 */
    isProd: boolean
  }>

  /** 从 API 重新加载配置 */
  reload: () => Promise<void>
}

/**
 * Vue 3 Composition API 获取 Launcher 配置
 *
 * 提供响应式的 Launcher 配置访问，当配置更新时自动触发视图更新。
 *
 * @returns {UseLauncherConfigReturn} 响应式配置对象和环境信息
 */
export function useLauncherConfig(): UseLauncherConfigReturn {
  const config = ref<LauncherConfig>(launcherConfigManager.getConfig())
  const environment = ref(launcherConfigManager.getEnvironment())

  let unsubscribe: (() => void) | null = null

  onMounted(async () => {
    // 从 API 加载完整配置
    await launcherConfigManager.loadFromAPI()
    config.value = launcherConfigManager.getConfig()

    // 订阅配置变化
    unsubscribe = launcherConfigManager.subscribe((newConfig) => {
      config.value = newConfig
      environment.value = launcherConfigManager.getEnvironment()
    })
  })

  onUnmounted(() => {
    // 组件卸载时取消订阅
    if (unsubscribe) {
      unsubscribe()
    }
  })

  // 重新加载配置
  const reload = async () => {
    await launcherConfigManager.loadFromAPI()
    config.value = launcherConfigManager.getConfig()
    environment.value = launcherConfigManager.getEnvironment()
  }

  return {
    config,
    environment,
    reload,
  }
}
