/**
 * 构建缓存管理器
 * 
 * 提供智能的增量构建缓存、预热和统计功能
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { EventEmitter } from 'events'
import { createHash } from 'crypto'
import { Logger } from '../utils/logger'
import { FileSystem, PathUtils } from '../utils'

/**
 * 缓存条目
 */
interface CacheEntry {
  key: string
  hash: string
  timestamp: number
  size: number
  hits: number
  lastAccess: number
  mtime?: number      // 修改时间
  created?: number    // 创建时间
  accessed?: number   // 访问时间
}

/**
 * 缓存统计
 */
export interface CacheStats {
  totalEntries: number
  totalSize: number
  hits: number
  misses: number
  hitRate: number
  oldestEntry: number
  newestEntry: number
}

/**
 * 构建缓存管理器
 */
export class BuildCache extends EventEmitter {
  private logger: Logger
  private cacheDir: string
  private entries: Map<string, CacheEntry> = new Map()
  private hits: number = 0
  private misses: number = 0
  private readonly MAX_CACHE_SIZE = 500 * 1024 * 1024 // 500MB
  private readonly MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000 // 7天

  constructor(cacheDir?: string) {
    super()

    this.logger = new Logger('BuildCache')
    this.cacheDir = cacheDir || PathUtils.resolve(process.cwd(), '.launcher-cache', 'build')

    this.initialize().catch(error => {
      this.logger.warn('缓存初始化失败', { error: error.message })
    })
  }

  /**
   * 初始化缓存
   */
  private async initialize(): Promise<void> {
    try {
      // 确保缓存目录存在
      await FileSystem.ensureDir(this.cacheDir)

      // 加载缓存索引
      await this.loadIndex()

      // 清理过期缓存
      await this.pruneExpired()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error('缓存初始化失败', { error: errorMessage })

      // 创建临时缓存目录作为降级方案
      this.cacheDir = PathUtils.resolve(process.cwd(), '.temp-build-cache')
      // this.enabled = false // 标记缓存系统不可用 - enabled 是私有属性

      this.logger.warn('构建缓存系统降级运行', { tempDir: this.cacheDir })
    }
  }

  /**
   * 加载缓存索引
   */
  private async loadIndex(): Promise<void> {
    const indexFile = PathUtils.resolve(this.cacheDir, 'index.json')

    try {
      if (await FileSystem.exists(indexFile)) {
        const content = await FileSystem.readFile(indexFile)
        const data = JSON.parse(content)

        this.entries = new Map(Object.entries(data.entries || {}))
        this.hits = data.hits || 0
        this.misses = data.misses || 0
      }
    } catch (error) {
      this.logger.debug('加载缓存索引失败', { error: (error as Error).message })
    }
  }

  /**
   * 保存缓存索引
   */
  private async saveIndex(): Promise<void> {
    const indexFile = PathUtils.resolve(this.cacheDir, 'index.json')

    try {
      const data = {
        entries: Object.fromEntries(this.entries),
        hits: this.hits,
        misses: this.misses,
        updatedAt: Date.now()
      }

      await FileSystem.writeFile(indexFile, JSON.stringify(data, null, 2))
    } catch (error) {
      this.logger.error('保存缓存索引失败', { error: (error as Error).message })
    }
  }

  /**
   * 计算内容哈希
   */
  private calculateHash(content: string | Buffer): string {
    return createHash('sha256').update(content).digest('hex').substring(0, 16)
  }

  /**
   * 获取缓存
   */
  async get(key: string): Promise<Buffer | null> {
    const entry = this.entries.get(key)

    if (!entry) {
      this.misses++
      this.emit('miss', { key })
      return null
    }

    const cacheFile = PathUtils.resolve(this.cacheDir, entry.hash)

    try {
      if (await FileSystem.exists(cacheFile)) {
        const content = await FileSystem.readFile(cacheFile, { encoding: null })

        // 更新访问统计
        entry.hits++
        entry.lastAccess = Date.now()
        this.hits++

        this.emit('hit', { key, entry })

        return Buffer.isBuffer(content) ? content : Buffer.from(content)
      } else {
        // 缓存文件不存在，移除索引
        this.entries.delete(key)
        this.misses++
        return null
      }
    } catch (error) {
      this.logger.error('读取缓存失败', { key, error: (error as Error).message })
      this.misses++
      return null
    }
  }

  /**
   * 设置缓存
   */
  async set(key: string, content: string | Buffer): Promise<void> {
    try {
      const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content)
      const hash = this.calculateHash(buffer)
      const cacheFile = PathUtils.resolve(this.cacheDir, hash)

      // 写入缓存文件
      await FileSystem.writeFile(cacheFile, buffer)

      // 获取文件大小
      const stats = await FileSystem.stat(cacheFile)

      // 更新索引
      const entry: CacheEntry = {
        key,
        hash,
        timestamp: Date.now(),
        size: stats.size,
        hits: 0,
        lastAccess: Date.now()
      }

      this.entries.set(key, entry)

      this.emit('set', { key, entry })

      // 保存索引
      await this.saveIndex()

      // 检查缓存大小
      await this.checkCacheSize()

    } catch (error) {
      this.logger.error('设置缓存失败', { key, error: (error as Error).message })
    }
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    const entry = this.entries.get(key)

    if (entry) {
      const cacheFile = PathUtils.resolve(this.cacheDir, entry.hash)

      try {
        if (await FileSystem.exists(cacheFile)) {
          await FileSystem.remove(cacheFile)
        }

        this.entries.delete(key)
        await this.saveIndex()

        this.emit('delete', { key })
      } catch (error) {
        this.logger.error('删除缓存失败', { key, error: (error as Error).message })
      }
    }
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    try {
      await FileSystem.remove(this.cacheDir)
      await FileSystem.ensureDir(this.cacheDir)

      this.entries.clear()
      this.hits = 0
      this.misses = 0

      await this.saveIndex()

      this.emit('clear')
      this.logger.success('缓存已清空')
    } catch (error) {
      this.logger.error('清空缓存失败', { error: (error as Error).message })
    }
  }

  /**
   * 清理过期缓存
   */
  async pruneExpired(): Promise<number> {
    const now = Date.now()
    let prunedCount = 0

    for (const [key, entry] of this.entries) {
      // 删除超过 7 天未访问的缓存
      if (now - entry.lastAccess > this.MAX_CACHE_AGE) {
        await this.delete(key)
        prunedCount++
      }
    }

    if (prunedCount > 0) {
      this.logger.info(`清理了 ${prunedCount} 个过期缓存`)
      this.emit('prune', { count: prunedCount })
    }

    return prunedCount
  }

  /**
   * 检查缓存大小并清理
   */
  private async checkCacheSize(): Promise<void> {
    const totalSize = Array.from(this.entries.values())
      .reduce((sum, entry) => sum + entry.size, 0)

    if (totalSize > this.MAX_CACHE_SIZE) {
      // 按最少使用和最旧优先删除
      const sorted = Array.from(this.entries.entries())
        .sort(([, a], [, b]) => {
          // 先按命中率排序
          const hitRateA = a.hits / Math.max(1, (Date.now() - a.timestamp) / 86400000)
          const hitRateB = b.hits / Math.max(1, (Date.now() - b.timestamp) / 86400000)

          if (hitRateA !== hitRateB) {
            return hitRateA - hitRateB
          }

          // 再按时间排序
          return a.lastAccess - b.lastAccess
        })

      // 删除前 20% 的缓存
      const toDelete = Math.ceil(sorted.length * 0.2)
      for (let i = 0; i < toDelete; i++) {
        const [key] = sorted[i]
        await this.delete(key)
      }

      this.logger.info(`缓存超限，清理了 ${toDelete} 个条目`)
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    const entries = Array.from(this.entries.values())
    const totalSize = entries.reduce((sum, e) => sum + e.size, 0)
    const timestamps = entries.map(e => e.timestamp)

    return {
      totalEntries: this.entries.size,
      totalSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0
        ? (this.hits / (this.hits + this.misses)) * 100
        : 0,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0
    }
  }

  /**
   * 缓存预热
   */
  async warmup(files: string[]): Promise<void> {
    this.logger.info(`预热缓存，文件数: ${files.length}`)

    let warmed = 0
    for (const file of files) {
      try {
        if (await FileSystem.exists(file)) {
          const content = await FileSystem.readFile(file, { encoding: null })
          const key = PathUtils.relative(process.cwd(), file)
          const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content)
          await this.set(key, buffer)
          warmed++
        }
      } catch (error) {
        this.logger.debug(`预热文件失败: ${file}`, { error: (error as Error).message })
      }
    }

    this.logger.success(`缓存预热完成，成功: ${warmed}/${files.length}`)
    this.emit('warmup', { total: files.length, warmed })
  }

  /**
   * 验证缓存条目完整性
   */
  private validateEntry(entry: CacheEntry): boolean {
    try {
      // 检查必要字段
      if (!entry.hash || !entry.size || !entry.mtime || !entry.created) {
        return false
      }

      // 检查时间戳合理性
      const now = Date.now()
      if (entry.created > now || entry.mtime > now || entry.accessed > now) {
        return false
      }

      // 检查大小合理性
      if (entry.size < 0 || entry.size > 1024 * 1024 * 1024) { // 最大1GB
        return false
      }

      // 检查访问计数
      if (entry.hits < 0) {
        return false
      }

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 修复损坏的缓存条目
   */
  private repairEntry(entry: Partial<CacheEntry>): CacheEntry | null {
    try {
      const now = Date.now()

      const repaired: CacheEntry = {
        hash: entry.hash || '',
        size: Math.max(0, entry.size || 0),
        mtime: entry.mtime && entry.mtime <= now ? entry.mtime : now,
        created: entry.created && entry.created <= now ? entry.created : now,
        accessed: entry.accessed && entry.accessed <= now ? entry.accessed : now,
        hits: Math.max(0, entry.hits || 0)
      }

      if (this.validateEntry(repaired) && repaired.hash) {
        return repaired
      }

      return null
    } catch (error) {
      return null
    }
  }

  /**
   * 执行完整性检查
   */
  async performIntegrityCheck(): Promise<{
    total: number
    valid: number
    repaired: number
    removed: number
  }> {
    const result = {
      total: 0,
      valid: 0,
      repaired: 0,
      removed: 0
    }

    try {
      // 检查所有缓存条目
      for (const [key, entry] of this.entries.entries()) {
        result.total++

        if (this.validateEntry(entry)) {
          result.valid++
        } else {
          // 尝试修复
          const repaired = this.repairEntry(entry)
          if (repaired) {
            this.entries.set(key, repaired)
            result.repaired++
          } else {
            // 无法修复，删除
            this.entries.delete(key)
            result.removed++
          }
        }
      }

      // 检查孤立的缓存文件
      const files = await FileSystem.readDir(this.cacheDir)
      for (const file of files) {
        if (file.endsWith('.cache') && !file.includes('index')) {
          const key = file.replace('.cache', '')

          if (!this.entries.has(key)) {
            // 孤立文件，删除
            await FileSystem.remove(PathUtils.resolve(this.cacheDir, file))
            result.removed++
          }
        }
      }

      // 保存更新后的索引
      await this.saveIndex()

      this.logger.info('构建缓存完整性检查完成', result)
      return result
    } catch (error) {
      this.logger.error('构建缓存完整性检查失败', { error: (error as Error).message })
      return result
    }
  }
}

/**
 * 创建构建缓存实例
 */
export function createBuildCache(cacheDir?: string): BuildCache {
  return new BuildCache(cacheDir)
}

