/**
 * 框架检测器
 *
 * 提供自动检测项目使用框架的功能
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type {
  FrameworkDetectionResult,
  FrameworkDetector as IFrameworkDetector,
} from '../../types/framework'
import { getFrameworkRegistry } from '../../registry/FrameworkRegistry'
import { Logger } from '../../utils/logger'

/**
 * 框架检测器实现
 */
export class FrameworkDetector implements IFrameworkDetector {
  private logger: Logger

  constructor() {
    this.logger = new Logger('FrameworkDetector')
  }

  /**
   * 自动检测项目使用的所有框架
   *
   * @param cwd - 项目根目录
   * @returns 检测结果列表（按置信度排序）
   */
  async detectAll(cwd: string): Promise<FrameworkDetectionResult[]> {
    this.logger.debug(`开始检测项目框架: ${cwd}`)

    const registry = getFrameworkRegistry()
    return registry.detectFrameworks(cwd)
  }

  /**
   * 检测最可能的框架
   *
   * @param cwd - 项目根目录
   * @returns 检测结果
   */
  async detectBest(cwd: string): Promise<FrameworkDetectionResult | null> {
    this.logger.debug(`检测最佳匹配框架: ${cwd}`)

    const registry = getFrameworkRegistry()
    return registry.detectBestFramework(cwd)
  }
}

/**
 * 创建框架检测器实例
 */
export function createFrameworkDetector(): FrameworkDetector {
  return new FrameworkDetector()
}
