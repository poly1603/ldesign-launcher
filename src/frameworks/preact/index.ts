/**
 * Preact 框架适配器导出
 * 
 * @author LDesign Team
 * @since 2.0.0
 */

import type { FrameworkAdapterFactory } from '../../types/framework'
import { PreactAdapter } from './PreactAdapter'

/**
 * Preact 适配器工厂
 */
export const preactAdapterFactory: FrameworkAdapterFactory = {
  async create(options) {
    const adapter = new PreactAdapter()
    await adapter.initialize()
    return adapter
  },

  async isAvailable(cwd) {
    const adapter = new PreactAdapter()
    const result = await adapter.detect(cwd)
    return result.detected
  }
}

export { PreactAdapter }

