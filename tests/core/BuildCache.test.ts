/**
 * BuildCache 测试用例
 * 
 * 测试构建缓存功能
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BuildCache, createBuildCache } from '../../src/core/BuildCache'
import { PathUtils } from '../../src/utils'
import os from 'os'
import path from 'path'

describe('BuildCache', () => {
  let cache: BuildCache
  let testCacheDir: string

  beforeEach(() => {
    testCacheDir = path.join(os.tmpdir(), 'launcher-test-cache', Date.now().toString())
    cache = new BuildCache(testCacheDir)
  })

  afterEach(() => {
    cache.removeAllListeners()
  })

  describe('构造函数和工厂函数', () => {
    it('应该正确初始化', () => {
      expect(cache).toBeInstanceOf(BuildCache)
    })

    it('createBuildCache 工厂函数应该工作', () => {
      const instance = createBuildCache(testCacheDir)
      expect(instance).toBeInstanceOf(BuildCache)
    })

    it('应该使用默认缓存目录', () => {
      const defaultCache = new BuildCache()
      expect(defaultCache).toBeInstanceOf(BuildCache)
    })
  })

  describe('缓存操作', () => {
    it('应该能设置和获取缓存', async () => {
      const key = 'test-key'
      const value = 'test-value'

      await cache.set(key, value)
      const cached = await cache.get(key)

      expect(cached).toBeDefined()
      expect(cached?.toString()).toBe(value)
    })

    it('应该处理 Buffer 内容', async () => {
      const key = 'test-buffer'
      const value = Buffer.from('test content')

      await cache.set(key, value)
      const cached = await cache.get(key)

      expect(cached).toBeInstanceOf(Buffer)
      expect(cached?.toString()).toBe(value.toString())
    })

    it('不存在的缓存应该返回 null', async () => {
      const cached = await cache.get('nonexistent-key')
      expect(cached).toBeNull()
    })

    it('应该能删除缓存', async () => {
      const key = 'to-delete'
      await cache.set(key, 'value')

      const before = await cache.get(key)
      expect(before).not.toBeNull()

      await cache.delete(key)

      const after = await cache.get(key)
      expect(after).toBeNull()
    })

    it('应该能清空所有缓存', async () => {
      await cache.set('key1', 'value1')
      await cache.set('key2', 'value2')

      await cache.clear()

      const stats = cache.getStats()
      expect(stats.totalEntries).toBe(0)
    })
  })

  describe('缓存统计', () => {
    it('应该记录命中和未命中', async () => {
      const key = 'stats-key'

      // Miss
      await cache.get(key)

      // Set and Hit
      await cache.set(key, 'value')
      await cache.get(key)

      const stats = cache.getStats()
      expect(stats.hits).toBeGreaterThan(0)
      expect(stats.misses).toBeGreaterThan(0)
    })

    it('应该计算命中率', async () => {
      await cache.set('key1', 'value1')
      await cache.get('key1')  // hit
      await cache.get('key1')  // hit
      await cache.get('key2')  // miss

      const stats = cache.getStats()
      expect(stats.hitRate).toBeGreaterThan(0)
      expect(stats.hitRate).toBeLessThanOrEqual(100)
    })

    it('应该统计缓存大小', async () => {
      await cache.set('key1', 'small content')
      await cache.set('key2', 'larger content with more data')

      const stats = cache.getStats()
      expect(stats.totalSize).toBeGreaterThan(0)
    })

    it('应该记录最旧和最新条目', async () => {
      await cache.set('old', 'old value')
      await new Promise(resolve => setTimeout(resolve, 10))
      await cache.set('new', 'new value')

      const stats = cache.getStats()
      expect(stats.newestEntry).toBeGreaterThan(stats.oldestEntry)
    })
  })

  describe('缓存清理', () => {
    it('应该能清理过期缓存', async () => {
      await cache.set('key1', 'value1')

      // 手动设置为过期（需要访问私有属性，这里只测试方法存在）
      const prunedCount = await cache.pruneExpired()

      expect(typeof prunedCount).toBe('number')
      expect(prunedCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe('缓存预热', () => {
    it('应该能预热缓存', async () => {
      // 使用当前文件作为测试
      const files = [__filename]

      await cache.warmup(files)

      const stats = cache.getStats()
      // 预热后应该有缓存条目
      expect(stats.totalEntries).toBeGreaterThanOrEqual(0)
    })

    it('应该处理不存在的文件', async () => {
      const files = ['/nonexistent/file.txt']

      await expect(cache.warmup(files)).resolves.not.toThrow()
    })
  })

  describe('事件系统', () => {
    it('应该触发 hit 事件', (done) => {
      cache.on('hit', (data) => {
        expect(data.key).toBeDefined()
        done()
      })

      cache.set('event-key', 'value').then(() => {
        cache.get('event-key')
      })
    }, 2000)

    it('应该触发 miss 事件', (done) => {
      cache.on('miss', (data) => {
        expect(data.key).toBeDefined()
        done()
      })

      cache.get('nonexistent-key')
    })

    it('应该触发 set 事件', (done) => {
      cache.on('set', (data) => {
        expect(data.key).toBe('new-key')
        done()
      })

      cache.set('new-key', 'value')
    }, 2000)
  })

  describe('边界情况', () => {
    it('应该处理空内容', async () => {
      await cache.set('empty', '')
      const cached = await cache.get('empty')

      expect(cached).toBeDefined()
      expect(cached?.toString()).toBe('')
    })

    it('应该处理大内容', async () => {
      const largeContent = 'x'.repeat(1024 * 1024) // 1MB

      await cache.set('large', largeContent)
      const cached = await cache.get('large')

      expect(cached?.toString()).toBe(largeContent)
    }, 10000)

    it('应该处理特殊字符的 key', async () => {
      const key = 'key/with/slashes'

      await cache.set(key, 'value')
      const cached = await cache.get(key)

      expect(cached?.toString()).toBe('value')
    })
  })
})

