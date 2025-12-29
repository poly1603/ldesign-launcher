/**
 * 缓存管理器
 *
 * 提供配置和框架检测结果的缓存功能，减少重复 IO 操作
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type { ViteLauncherConfig } from '../types'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Logger } from './logger'

/**
 * 缓存条目接口
 */
interface CacheEntry<T> {
  /** 缓存数据 */
  data: T
  /** 创建时间戳 */
  createdAt: number
  /** 过期时间戳 */
  expiresAt: number
  /** 数据哈希（用于验证） */
  hash: string
}

/**
 * 缓存配置选项
 */
export interface CacheManagerOptions {
  /** 缓存目录（相对于项目根目录） */
  cacheDir?: string
  /** 默认过期时间（毫秒），默认 1 小时 */
  defaultTTL?: number
  /** 是否启用磁盘缓存 */
  enableDiskCache?: boolean
  /** 最大内存缓存条目数 */
  maxMemoryEntries?: number
  /** 日志记录器 */
  logger?: Logger
}

/**
 * 缓存管理器类
 *
 * 实现两级缓存策略：内存缓存 + 磁盘缓存
 */
export class CacheManager {
  private memoryCache: Map<string, CacheEntry<any>> = new Map()
  private cacheDir: string
  private defaultTTL: number
  private enableDiskCache: boolean
  private maxMemoryEntries: number
  private logger: Logger
  private initialized: boolean = false

  constructor(cwd: string, options: CacheManagerOptions = {}) {
    this.cacheDir = path.join(cwd, options.cacheDir || '.launcher-cache')
    this.defaultTTL = options.defaultTTL || 3600000 // 1 小时
    this.enableDiskCache = options.enableDiskCache ?? true
    this.maxMemoryEntries = options.maxMemoryEntries || 100
    this.logger = options.logger || new Logger('CacheManager')
  }

  /**
   * 初始化缓存目录
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized)
      return

    if (this.enableDiskCache) {
      try {
        await fs.mkdir(this.cacheDir, { recursive: true })
      }
      catch (error) {
        this.logger.warn('无法创建缓存目录，仅使用内存缓存', {
          error: (error as Error).message,
        })
        this.enableDiskCache = false
      }
    }

    this.initialized = true
  }

  /**
   * 生成缓存键的哈希
   */
  private hashKey(key: string): string {
    return crypto.createHash('md5').update(key).digest('hex')
  }

  /**
   * 生成数据哈希
   */
  private hashData(data: any): string {
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex')
  }

  /**
   * 获取缓存文件路径
   */
  private getCachePath(key: string): string {
    const hashedKey = this.hashKey(key)
    return path.join(this.cacheDir, `${hashedKey}.json`)
  }

  /**
   * 获取缓存数据
   *
   * @param key - 缓存键
   * @returns 缓存的数据，如果不存在或已过期返回 null
   */
  async get<T>(key: string): Promise<T | null> {
    await this.ensureInitialized()

    // 1. 首先检查内存缓存
    const memoryEntry = this.memoryCache.get(key)
    if (memoryEntry) {
      if (Date.now() < memoryEntry.expiresAt) {
        this.logger.debug(`内存缓存命中: ${key}`)
        return memoryEntry.data as T
      }
      // 已过期，删除
      this.memoryCache.delete(key)
    }

    // 2. 检查磁盘缓存
    if (this.enableDiskCache) {
      try {
        const cachePath = this.getCachePath(key)
        const content = await fs.readFile(cachePath, 'utf-8')
        const entry: CacheEntry<T> = JSON.parse(content)

        if (Date.now() < entry.expiresAt) {
          // 恢复到内存缓存
          this.memoryCache.set(key, entry)
          this.logger.debug(`磁盘缓存命中: ${key}`)
          return entry.data
        }

        // 已过期，删除文件
        await fs.unlink(cachePath).catch(() => {})
      }
      catch {
        // 文件不存在或读取失败，忽略
      }
    }

    return null
  }

  /**
   * 设置缓存数据
   *
   * @param key - 缓存键
   * @param data - 要缓存的数据
   * @param ttl - 过期时间（毫秒），默认使用 defaultTTL
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    await this.ensureInitialized()

    const now = Date.now()
    const expiresAt = now + (ttl || this.defaultTTL)

    const entry: CacheEntry<T> = {
      data,
      createdAt: now,
      expiresAt,
      hash: this.hashData(data),
    }

    // 内存缓存容量控制
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      // 删除最旧的条目
      const oldestKey = this.memoryCache.keys().next().value
      if (oldestKey) {
        this.memoryCache.delete(oldestKey)
      }
    }

    // 保存到内存缓存
    this.memoryCache.set(key, entry)

    // 保存到磁盘缓存
    if (this.enableDiskCache) {
      try {
        const cachePath = this.getCachePath(key)
        await fs.writeFile(cachePath, JSON.stringify(entry, null, 2), 'utf-8')
        this.logger.debug(`缓存已保存: ${key}`)
      }
      catch (error) {
        this.logger.warn('无法写入磁盘缓存', {
          key,
          error: (error as Error).message,
        })
      }
    }
  }

  /**
   * 删除指定缓存
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key)

    if (this.enableDiskCache) {
      try {
        await fs.unlink(this.getCachePath(key))
      }
      catch {
        // 忽略
      }
    }
  }

  /**
   * 清除所有缓存
   */
  async clear(): Promise<void> {
    this.memoryCache.clear()

    if (this.enableDiskCache) {
      try {
        const files = await fs.readdir(this.cacheDir)
        await Promise.all(
          files
            .filter(f => f.endsWith('.json'))
            .map(f => fs.unlink(path.join(this.cacheDir, f)).catch(() => {})),
        )
        this.logger.info('缓存已清除')
      }
      catch {
        // 忽略
      }
    }
  }

  /**
   * 获取或设置缓存（带自动填充）
   *
   * @param key - 缓存键
   * @param factory - 如果缓存不存在，用于生成数据的工厂函数
   * @param ttl - 过期时间
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await factory()
    await this.set(key, data, ttl)
    return data
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { memoryEntries: number, diskEnabled: boolean } {
    return {
      memoryEntries: this.memoryCache.size,
      diskEnabled: this.enableDiskCache,
    }
  }
}

/**
 * 配置缓存 - 专门用于缓存配置文件
 */
export class ConfigCache {
  private cache: CacheManager
  private logger: Logger

  constructor(cwd: string, logger?: Logger) {
    this.logger = logger || new Logger('ConfigCache')
    this.cache = new CacheManager(cwd, {
      cacheDir: '.launcher-cache/config',
      defaultTTL: 1800000, // 30 分钟
      logger: this.logger,
    })
  }

  /**
   * 获取配置缓存键
   */
  private getCacheKey(configPath: string, mtime: number): string {
    return `config:${configPath}:${mtime}`
  }

  /**
   * 获取缓存的配置
   */
  async get(configPath: string): Promise<ViteLauncherConfig | null> {
    try {
      const stat = await fs.stat(configPath)
      const key = this.getCacheKey(configPath, stat.mtimeMs)
      return this.cache.get<ViteLauncherConfig>(key)
    }
    catch {
      return null
    }
  }

  /**
   * 缓存配置
   */
  async set(configPath: string, config: ViteLauncherConfig): Promise<void> {
    try {
      const stat = await fs.stat(configPath)
      const key = this.getCacheKey(configPath, stat.mtimeMs)
      await this.cache.set(key, config)
    }
    catch (error) {
      this.logger.warn('无法缓存配置', { error: (error as Error).message })
    }
  }

  /**
   * 清除配置缓存
   */
  async clear(): Promise<void> {
    await this.cache.clear()
  }
}

/**
 * 框架检测缓存
 */
export class FrameworkDetectionCache {
  private cache: CacheManager

  constructor(cwd: string, logger?: Logger) {
    this.cache = new CacheManager(cwd, {
      cacheDir: '.launcher-cache/detection',
      defaultTTL: 300000, // 5 分钟（框架变化不频繁）
      logger: logger || new Logger('FrameworkDetectionCache'),
    })
  }

  /**
   * 获取缓存键（基于 package.json 的 mtime）
   */
  private async getCacheKey(cwd: string): Promise<string | null> {
    try {
      const pkgPath = path.join(cwd, 'package.json')
      const stat = await fs.stat(pkgPath)
      return `framework:${cwd}:${stat.mtimeMs}`
    }
    catch {
      return null
    }
  }

  /**
   * 获取缓存的框架检测结果
   */
  async get(cwd: string): Promise<string | null> {
    const key = await this.getCacheKey(cwd)
    if (!key)
      return null
    return this.cache.get<string>(key)
  }

  /**
   * 缓存框架检测结果
   */
  async set(cwd: string, framework: string): Promise<void> {
    const key = await this.getCacheKey(cwd)
    if (key) {
      await this.cache.set(key, framework)
    }
  }

  /**
   * 清除检测缓存
   */
  async clear(): Promise<void> {
    await this.cache.clear()
  }
}

/**
 * 创建全局缓存管理器实例
 */
let globalCacheManager: CacheManager | null = null

export function getGlobalCacheManager(cwd: string): CacheManager {
  if (!globalCacheManager) {
    globalCacheManager = new CacheManager(cwd)
  }
  return globalCacheManager
}
