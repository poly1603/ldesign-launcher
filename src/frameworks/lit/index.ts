/**
 * Lit 框架适配器导出
 * 
 * @author LDesign Team
 * @since 2.0.0
 */

import type { FrameworkAdapterFactory } from '../../types/framework'
import { LitAdapter } from './LitAdapter'

/**
 * Lit 适配器工厂
 */
export const litAdapterFactory: FrameworkAdapterFactory = {
  async create(options) {
    const adapter = new LitAdapter()
    await adapter.initialize()
    return adapter
  },

  async isAvailable(cwd) {
    const adapter = new LitAdapter()
    const result = await adapter.detect(cwd)
    return result.detected
  }
}

export { LitAdapter }

