/**
 * 配置缓存工具
 * 
 * 提供配置文件的缓存机制，优化配置加载性能
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

import { createHash } from 'crypto'
import { stat } from 'fs/promises'
import type { ViteLauncherConfig } from '../types'

/**
 * 配置缓存项接口
 */
export interface ConfigCacheItem {
  /** 配置内容 */
  config: ViteLauncherConfig
  /** 文件修改时间 */
  mtime: number
  /** 内容哈希值 */
  hash: string
  /** 缓存时间 */
  cachedAt: number
}

/**
 * 配置缓存管理器
 */
export class ConfigCache {
  /** 缓存存储 */
  private cache = new Map<string, ConfigCacheItem>()

  /** 缓存 TTL（毫秒） */
  private readonly ttl: number

  /** 是否启用缓存 */
  private enabled: boolean

  /**
   * 构造函数
   * @param ttl 缓存生存时间（毫秒），默认 5 分钟
   * @param enabled 是否启用缓存，默认 true
   */
  constructor(ttl: number = 5 * 60 * 1000, enabled: boolean = true) {
    this.ttl = ttl
    this.enabled = enabled
  }

  /**
   * 获取缓存的配置
   * @param filePath 配置文件路径
   * @returns 缓存的配置或 null
   */
  async get(filePath: string): Promise<ViteLauncherConfig | null> {
    if (!this.enabled) {
      return null
    }

    const cached = this.cache.get(filePath)
    if (!cached) {
      return null
    }

    // 检查缓存是否过期
    if (Date.now() - cached.cachedAt > this.ttl) {
      this.cache.delete(filePath)
      return null
    }

    // 检查文件是否被修改
    try {
      const stats = await stat(filePath)
      const currentMtime = stats.mtimeMs

      if (currentMtime !== cached.mtime) {
        // 文件已被修改，删除缓存
        this.cache.delete(filePath)
        return null
      }

      // 缓存有效
      return cached.config
    } catch {
      // 文件读取失败，删除缓存
      this.cache.delete(filePath)
      return null
    }
  }

  /**
   * 设置配置缓存
   * @param filePath 配置文件路径
   * @param config 配置内容
   * @param content 配置文件内容（用于计算哈希）
   */
  async set(
    filePath: string,
    config: ViteLauncherConfig,
    content?: string
  ): Promise<void> {
    if (!this.enabled) {
      return
    }

    try {
      // 获取文件修改时间
      const stats = await stat(filePath)
      const mtime = stats.mtimeMs

      // 计算内容哈希
      const hash = content
        ? createHash('sha256').update(content).digest('hex')
        : ''

      // 存储到缓存
      this.cache.set(filePath, {
        config,
        mtime,
        hash,
        cachedAt: Date.now()
      })
    } catch (error) {
      // 缓存失败不影响主流程
      console.debug('设置配置缓存失败', error)
    }
  }

  /**
   * 删除指定文件的缓存
   * @param filePath 配置文件路径
   */
  delete(filePath: string): void {
    this.cache.delete(filePath)
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    size: number
    items: Array<{ path: string; age: number }>
  } {
    const items: Array<{ path: string; age: number }> = []

    for (const [path, item] of this.cache) {
      items.push({
        path,
        age: Date.now() - item.cachedAt
      })
    }

    return {
      size: this.cache.size,
      items
    }
  }

  /**
   * 启用或禁用缓存
   * @param enabled 是否启用
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled

    if (!enabled) {
      this.clear()
    }
  }

  /**
   * 检查缓存是否启用
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * 验证缓存的完整性
   * @param filePath 配置文件路径
   * @param content 当前文件内容
   * @returns 缓存是否有效
   */
  async validate(filePath: string, content: string): Promise<boolean> {
    const cached = this.cache.get(filePath)
    if (!cached) {
      return false
    }

    // 计算当前内容的哈希
    const currentHash = createHash('sha256').update(content).digest('hex')

    return cached.hash === currentHash
  }

  /**
   * 清理过期缓存
   * 删除所有超过 TTL 的缓存项
   */
  cleanup(): number {
    const now = Date.now()
    let removed = 0

    for (const [path, item] of this.cache) {
      if (now - item.cachedAt > this.ttl) {
        this.cache.delete(path)
        removed++
      }
    }

    return removed
  }
}

/**
 * 创建配置缓存实例
 * @param ttl 缓存生存时间（毫秒）
 * @param enabled 是否启用缓存
 */
export function createConfigCache(
  ttl?: number,
  enabled?: boolean
): ConfigCache {
  return new ConfigCache(ttl, enabled)
}

/**
 * 全局配置缓存实例
 */
export const globalConfigCache = new ConfigCache()


