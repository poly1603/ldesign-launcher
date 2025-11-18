/**
 * Qwik 框架适配器导出
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type { FrameworkAdapterFactory } from '../../types/framework'
import { QwikAdapter } from './QwikAdapter'

/**
 * Qwik 适配器工厂
 */
export const qwikAdapterFactory: FrameworkAdapterFactory = {
  async create(_options) {
    const adapter = new QwikAdapter()
    await adapter.initialize()
    return adapter
  },

  async isAvailable(cwd) {
    const adapter = new QwikAdapter()
    const result = await adapter.detect(cwd)
    return result.detected
  },
}

export { QwikAdapter }
