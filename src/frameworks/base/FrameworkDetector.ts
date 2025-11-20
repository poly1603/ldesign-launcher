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
 * 框架检测缓存条目
 */
interface DetectionCacheEntry {
  /** 检测结果 */
  results: FrameworkDetectionResult[]
  /** 缓存时间戳 */
  timestamp: number
  /** package.json 修改时间（用于缓存失效） */
  packageJsonMtime?: number
}

/**
 * 框架检测器实现（带缓存）
 */
export class FrameworkDetector implements IFrameworkDetector {
  private logger: Logger
  /** 检测结果缓存 */
  private cache: Map<string, DetectionCacheEntry> = new Map()
  /** 缓存过期时间（毫秒），默认 5 分钟 */
  private cacheExpiry: number = 5 * 60 * 1000

  constructor() {
    this.logger = new Logger('FrameworkDetector')
  }

  /**
   * 自动检测项目使用的所有框架（带缓存）
   *
   * @param cwd - 项目根目录
   * @param skipCache - 是否跳过缓存
   * @returns 检测结果列表（按置信度排序）
   */
  async detectAll(cwd: string, skipCache = false): Promise<FrameworkDetectionResult[]> {
    // 检查缓存
    if (!skipCache) {
      const cached = await this.getCachedResult(cwd)
      if (cached) {
        this.logger.debug(`使用缓存的框架检测结果: ${cwd}`)
        return cached
      }
    }

    this.logger.debug(`开始检测项目框架: ${cwd}`)

    const registry = getFrameworkRegistry()
    const results = await registry.detectFrameworks(cwd)

    // 缓存结果
    await this.cacheResult(cwd, results)

    return results
  }

  /**
   * 检测最可能的框架（带缓存）
   *
   * @param cwd - 项目根目录
   * @param skipCache - 是否跳过缓存
   * @returns 检测结果
   */
  async detectBest(cwd: string, skipCache = false): Promise<FrameworkDetectionResult | null> {
    const results = await this.detectAll(cwd, skipCache)
    return results.length > 0 ? results[0] : null
  }

  /**
   * 获取缓存的检测结果
   *
   * @param cwd - 项目根目录
   * @returns 缓存的结果，如果缓存无效返回 null
   */
  private async getCachedResult(cwd: string): Promise<FrameworkDetectionResult[] | null> {
    const entry = this.cache.get(cwd)
    if (!entry) {
      return null
    }

    // 检查缓存是否过期
    const now = Date.now()
    if (now - entry.timestamp > this.cacheExpiry) {
      this.cache.delete(cwd)
      return null
    }

    // 检查 package.json 是否被修改
    try {
      const { promises: fs } = await import('node:fs')
      const { join } = await import('node:path')
      const packageJsonPath = join(cwd, 'package.json')

      const stats = await fs.stat(packageJsonPath).catch(() => null)
      if (stats && entry.packageJsonMtime) {
        const currentMtime = stats.mtimeMs
        if (currentMtime !== entry.packageJsonMtime) {
          // package.json 已修改，缓存失效
          this.cache.delete(cwd)
          return null
        }
      }
    }
    catch {
      // 忽略文件系统错误
    }

    return entry.results
  }

  /**
   * 缓存检测结果
   *
   * @param cwd - 项目根目录
   * @param results - 检测结果
   */
  private async cacheResult(cwd: string, results: FrameworkDetectionResult[]): Promise<void> {
    try {
      const { promises: fs } = await import('node:fs')
      const { join } = await import('node:path')
      const packageJsonPath = join(cwd, 'package.json')

      const stats = await fs.stat(packageJsonPath).catch(() => null)
      const packageJsonMtime = stats ? stats.mtimeMs : undefined

      this.cache.set(cwd, {
        results,
        timestamp: Date.now(),
        packageJsonMtime,
      })
    }
    catch {
      // 即使缓存失败也不影响功能
      this.cache.set(cwd, {
        results,
        timestamp: Date.now(),
      })
    }
  }

  /**
   * 清除缓存
   *
   * @param cwd - 项目根目录，如果不指定则清除所有缓存
   */
  clearCache(cwd?: string): void {
    if (cwd) {
      this.cache.delete(cwd)
      this.logger.debug(`清除框架检测缓存: ${cwd}`)
    }
    else {
      this.cache.clear()
      this.logger.debug('清除所有框架检测缓存')
    }
  }

  /**
   * 设置缓存过期时间
   *
   * @param ms - 过期时间（毫秒）
   */
  setCacheExpiry(ms: number): void {
    this.cacheExpiry = ms
  }
}

/**
 * 创建框架检测器实例
 */
export function createFrameworkDetector(): FrameworkDetector {
  return new FrameworkDetector()
}
