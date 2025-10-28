/**
 * Angular 框架模块统一导出
 */

import type { FrameworkAdapterFactory, FrameworkOptions } from '../../types/framework'
import { AngularAdapter } from './AngularAdapter'

export { AngularAdapter }

export const angularAdapterFactory: FrameworkAdapterFactory = {
  async create(options?: FrameworkOptions) {
    const adapter = new AngularAdapter()
    await adapter.initialize()
    return adapter
  },
  
  async isAvailable(cwd: string) {
    const adapter = new AngularAdapter()
    const result = await adapter.detect(cwd)
    return result.detected
  }
}

