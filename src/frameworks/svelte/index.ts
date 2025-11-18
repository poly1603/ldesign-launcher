/**
 * Svelte 框架模块统一导出
 */

import type { FrameworkAdapterFactory, FrameworkOptions } from '../../types/framework'
import { SvelteAdapter } from './SvelteAdapter'

export { SvelteAdapter }

export const svelteAdapterFactory: FrameworkAdapterFactory = {
  async create(_options?: FrameworkOptions) {
    const adapter = new SvelteAdapter()
    await adapter.initialize()
    return adapter
  },

  async isAvailable(cwd: string) {
    const adapter = new SvelteAdapter()
    const result = await adapter.detect(cwd)
    return result.detected
  },
}
