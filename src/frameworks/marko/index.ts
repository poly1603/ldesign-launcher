/**
 * Marko 框架适配器导出
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type { FrameworkAdapterFactory } from '../../types/framework'
import { MarkoAdapter } from './MarkoAdapter'

/**
 * Marko 适配器工厂
 */
export const markoAdapterFactory: FrameworkAdapterFactory = {
  /**
   * 创建 Marko 适配器实例
   */
  create: async (_options) => {
    const adapter = new MarkoAdapter()
    await adapter.initialize()
    return adapter
  },

  /**
   * 检查 Marko 是否可用
   */
  isAvailable: async (cwd) => {
    try {
      const adapter = new MarkoAdapter()
      const result = await adapter.detect(cwd)
      return result.detected
    }
    catch {
      return false
    }
  },
}

// 导出适配器类
export { MarkoAdapter }
