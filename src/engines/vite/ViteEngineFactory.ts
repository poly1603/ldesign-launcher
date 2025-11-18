/**
 * Vite 引擎工厂
 *
 * 负责创建和管理 Vite 引擎实例
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type { BuildEngine, BuildEngineFactory, BuildEngineOptions } from '../../types/engine'
import { Logger } from '../../utils/logger'
import { ViteEngine } from './ViteEngine'

/**
 * Vite 引擎工厂类
 */
export class ViteEngineFactory implements BuildEngineFactory {
  private logger: Logger

  constructor() {
    this.logger = new Logger('ViteEngineFactory')
  }

  /**
   * 创建 Vite 引擎实例
   *
   * @param options - 引擎选项
   * @returns Vite 引擎实例
   */
  async create(_options?: BuildEngineOptions): Promise<BuildEngine> {
    this.logger.debug('创建 Vite 引擎实例')

    const engine = new ViteEngine()

    // 初始化引擎
    await engine.initialize()

    this.logger.debug('Vite 引擎实例创建完成')
    return engine
  }

  /**
   * 检查 Vite 是否可用
   *
   * @returns 是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      // 尝试导入 Vite
      await import('vite')
      return true
    }
    catch {
      this.logger.warn('Vite 不可用，请确保已安装 vite 包')
      return false
    }
  }
}

/**
 * 创建 Vite 引擎工厂实例
 */
export function createViteEngineFactory(): ViteEngineFactory {
  return new ViteEngineFactory()
}
