/**
 * Vue 框架模块统一导出
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type { FrameworkAdapterFactory, FrameworkOptions } from '../../types/framework'
import { Vue2Adapter } from './Vue2Adapter'
import { Vue3Adapter } from './Vue3Adapter'

export { Vue2Adapter, Vue3Adapter }

/**
 * Vue 2 适配器工厂
 */
export const vue2AdapterFactory: FrameworkAdapterFactory = {
  async create(_options?: FrameworkOptions) {
    const adapter = new Vue2Adapter()
    await adapter.initialize()
    return adapter
  },

  async isAvailable(cwd: string) {
    const adapter = new Vue2Adapter()
    const result = await adapter.detect(cwd)
    return result.detected
  },
}

/**
 * Vue 3 适配器工厂
 */
export const vue3AdapterFactory: FrameworkAdapterFactory = {
  async create(_options?: FrameworkOptions) {
    const adapter = new Vue3Adapter()
    await adapter.initialize()
    return adapter
  },

  async isAvailable(cwd: string) {
    const adapter = new Vue3Adapter()
    const result = await adapter.detect(cwd)
    return result.detected
  },
}
