/**
 * Angular 框架适配器导出
 */
import type { FrameworkAdapterFactory } from '../../types/framework'
import { AngularAdapter } from './AngularAdapter'

export const angularAdapterFactory: FrameworkAdapterFactory = {
  async create() {
    const adapter = new AngularAdapter()
    await adapter.initialize()
    return adapter
  },
  async isAvailable(cwd) {
    const adapter = new AngularAdapter()
    const result = await adapter.detect(cwd)
    return result.detected
  },
}

export { AngularAdapter }
