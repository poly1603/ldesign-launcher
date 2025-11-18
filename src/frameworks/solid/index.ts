/**
 * Solid.js 框架模块统一导出
 */

import type { FrameworkAdapterFactory, FrameworkOptions } from '../../types/framework'
import { SolidAdapter } from './SolidAdapter'

export { SolidAdapter }

export const solidAdapterFactory: FrameworkAdapterFactory = {
  async create(_options?: FrameworkOptions) {
    const adapter = new SolidAdapter()
    await adapter.initialize()
    return adapter
  },

  async isAvailable(cwd: string) {
    const adapter = new SolidAdapter()
    const result = await adapter.detect(cwd)
    return result.detected
  },
}
