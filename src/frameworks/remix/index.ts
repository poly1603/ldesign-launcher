/**
 * Remix 框架模块统一导出
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type { FrameworkAdapterFactory, FrameworkOptions } from '../../types/framework'
import { RemixAdapter } from './RemixAdapter'

export { RemixAdapter }

export const remixAdapterFactory: FrameworkAdapterFactory = {
  async create(_options?: FrameworkOptions) {
    const adapter = new RemixAdapter()
    await adapter.initialize()
    return adapter
  },

  async isAvailable(cwd: string) {
    const adapter = new RemixAdapter()
    const result = await adapter.detect(cwd)
    return result.detected
  },
}
