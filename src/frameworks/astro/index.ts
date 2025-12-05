/**
 * Astro 框架模块统一导出
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type { FrameworkAdapterFactory, FrameworkOptions } from '../../types/framework'
import { AstroAdapter } from './AstroAdapter'

export { AstroAdapter }

export const astroAdapterFactory: FrameworkAdapterFactory = {
  async create(_options?: FrameworkOptions) {
    const adapter = new AstroAdapter()
    await adapter.initialize()
    return adapter
  },

  async isAvailable(cwd: string) {
    const adapter = new AstroAdapter()
    const result = await adapter.detect(cwd)
    return result.detected
  },
}
