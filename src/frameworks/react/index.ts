/**
 * React 框架模块统一导出
 * 
 * @author LDesign Team
 * @since 2.0.0
 */

import type { FrameworkAdapterFactory, FrameworkOptions } from '../../types/framework'
import { ReactAdapter } from './ReactAdapter'

export { ReactAdapter }

export const reactAdapterFactory: FrameworkAdapterFactory = {
  async create(options?: FrameworkOptions) {
    const adapter = new ReactAdapter()
    await adapter.initialize()
    return adapter
  },
  
  async isAvailable(cwd: string) {
    const adapter = new ReactAdapter()
    const result = await adapter.detect(cwd)
    return result.detected
  }
}

