/**
 * CacheManager 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CacheManager, CacheType, CacheItem } from '../../src/core/CacheManager'
import * as fs from 'fs-extra'
import path from 'path'

// Mock fs-extra
vi.mock('fs-extra')

describe('CacheManager', () => {
  let cacheManager: CacheManager
  const testCacheDir = path.join(process.cwd(), '.test-cache')

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fs.ensureDir).mockResolvedValue(undefined)
    vi.mocked(fs.pathExists).mockResolvedValue(false)

    cacheManager = new CacheManager({
      enabled: true,
      dir: testCacheDir,
      maxSize: 100 * 1024 * 1024, // 100MB
      ttl: 3600,
      compression: false,
      types: [CacheType.BUILD, CacheType.MODULE, CacheType.TRANSFORM]
    })
  })

  afterEach(async () => {
    await cacheManager.destroy()
  })

  describe('set 和 get', () => {
    it('应该能够设置和获取缓存', async () => {
      const testData = { message: 'Hello, Cache!' }

      await cacheManager.set('test-key', CacheType.BUILD, testData)

      const retrieved = await cacheManager.get<typeof testData>('test-key', CacheType.BUILD)

      expect(retrieved).toEqual(testData)
    })

    it('应该遵守 TTL 设置', async () => {
      const testData = { value: 42 }

      // 设置 1 秒后过期的缓存
      await cacheManager.set('ttl-test', CacheType.MODULE, testData, 1)

      // 立即获取应该成功
      const immediate = await cacheManager.get('ttl-test', CacheType.MODULE)
      expect(immediate).toEqual(testData)

      // 等待 1.1 秒后应该过期
      await new Promise(resolve => setTimeout(resolve, 1100))
      const expired = await cacheManager.get('ttl-test', CacheType.MODULE)
      expect(expired).toBeNull()
    })

    it('禁用缓存时不应该存储', async () => {
      const disabledCache = new CacheManager({
        enabled: false,
        dir: testCacheDir
      })

      await disabledCache.set('test', CacheType.BUILD, { data: 'test' })
      const result = await disabledCache.get('test', CacheType.BUILD)

      expect(result).toBeNull()

      await disabledCache.destroy()
    })

    it('应该处理磁盘保存失败', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('磁盘写入失败'))

      const testData = { test: 'data' }

      // 即使磁盘保存失败，内存缓存应该成功
      await cacheManager.set('disk-fail', CacheType.BUILD, testData)

      // 从内存获取应该成功
      const retrieved = await cacheManager.get('disk-fail', CacheType.BUILD)
      expect(retrieved).toEqual(testData)
    })
  })

  describe('has 和 delete', () => {
    it('应该正确检查缓存是否存在', async () => {
      await cacheManager.set('exists', CacheType.BUILD, { data: 'test' })

      expect(await cacheManager.has('exists', CacheType.BUILD)).toBe(true)
      expect(await cacheManager.has('not-exists', CacheType.BUILD)).toBe(false)
    })

    it('应该能够删除缓存', async () => {
      await cacheManager.set('to-delete', CacheType.MODULE, { data: 'test' })

      expect(await cacheManager.has('to-delete', CacheType.MODULE)).toBe(true)

      await cacheManager.delete('to-delete', CacheType.MODULE)

      expect(await cacheManager.has('to-delete', CacheType.MODULE)).toBe(false)
    })
  })

  describe('clear', () => {
    it('应该清除所有缓存', async () => {
      await cacheManager.set('item1', CacheType.BUILD, { data: 1 })
      await cacheManager.set('item2', CacheType.MODULE, { data: 2 })
      await cacheManager.set('item3', CacheType.TRANSFORM, { data: 3 })

      await cacheManager.clear()

      expect(await cacheManager.has('item1', CacheType.BUILD)).toBe(false)
      expect(await cacheManager.has('item2', CacheType.MODULE)).toBe(false)
      expect(await cacheManager.has('item3', CacheType.TRANSFORM)).toBe(false)
    })

    it('应该能够按类型清除缓存', async () => {
      await cacheManager.set('build1', CacheType.BUILD, { data: 1 })
      await cacheManager.set('module1', CacheType.MODULE, { data: 2 })

      await cacheManager.clear(CacheType.BUILD)

      expect(await cacheManager.has('build1', CacheType.BUILD)).toBe(false)
      expect(await cacheManager.has('module1', CacheType.MODULE)).toBe(true)
    })
  })

  describe('getStats', () => {
    it('应该返回正确的统计信息', async () => {
      await cacheManager.set('item1', CacheType.BUILD, { data: 'test1' })
      await cacheManager.set('item2', CacheType.MODULE, { data: 'test2' })

      const stats = cacheManager.getStats()

      expect(stats.totalItems).toBe(2)
      expect(stats.totalSize).toBeGreaterThan(0)
      expect(stats.byType[CacheType.BUILD].count).toBe(1)
      expect(stats.byType[CacheType.MODULE].count).toBe(1)
    })

    it('应该计算正确的命中率', async () => {
      await cacheManager.set('hit-test', CacheType.BUILD, { data: 'test' })

      // 命中一次
      await cacheManager.get('hit-test', CacheType.BUILD)
      // 未命中一次
      await cacheManager.get('miss-test', CacheType.BUILD)

      const stats = cacheManager.getStats()

      expect(stats.hitRate).toBe(0.5) // 50% 命中率
    })
  })

  describe('validateCacheIntegrity', () => {
    it('应该验证有效的缓存项', () => {
      const validItem: CacheItem = {
        key: 'test',
        type: CacheType.BUILD,
        data: { test: 'data' },
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 1,
        size: 100,
        expiresAt: Date.now() + 3600000
      }

      const isValid = cacheManager['validateCacheIntegrity'](validItem)
      expect(isValid).toBe(true)
    })

    it('应该拒绝无效的缓存项', () => {
      const invalidItem = {
        key: 'test',
        // 缺少必要字段
        data: { test: 'data' }
      } as any

      const isValid = cacheManager['validateCacheIntegrity'](invalidItem)
      expect(isValid).toBe(false)
    })
  })

  describe('repairCacheItem', () => {
    it('应该修复部分损坏的缓存项', () => {
      const partialItem = {
        key: 'test',
        type: CacheType.BUILD,
        data: { test: 'data' }
      }

      const repaired = cacheManager['repairCacheItem'](partialItem)

      expect(repaired).toBeDefined()
      expect(repaired?.key).toBe('test')
      expect(repaired?.createdAt).toBeDefined()
      expect(repaired?.lastAccessed).toBeDefined()
      expect(repaired?.accessCount).toBe(0)
    })

    it('严重损坏的项应该返回 null', () => {
      const severelyDamaged = {
        // 缺少关键字段
        someField: 'value'
      }

      const repaired = cacheManager['repairCacheItem'](severelyDamaged)
      expect(repaired).toBeNull()
    })
  })

  describe('performIntegrityCheck', () => {
    it('应该执行完整性检查并修复', async () => {
      // 模拟一些缓存项
      const validItem: CacheItem = {
        key: 'valid',
        type: CacheType.BUILD,
        data: { test: 'data' },
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 1,
        size: 100,
        expiresAt: Date.now() + 3600000
      }

      const repairableItem = {
        key: 'repairable',
        type: CacheType.MODULE,
        data: { test: 'data' }
      }

      // 添加到缓存
      cacheManager['cache'].set('build:valid', validItem)
      cacheManager['cache'].set('module:repairable', repairableItem as any)

      const result = await cacheManager.performIntegrityCheck()

      expect(result.total).toBe(2)
      expect(result.valid).toBeGreaterThanOrEqual(1)
      expect(result.repaired).toBeGreaterThanOrEqual(0)
      expect(result.removed).toBeGreaterThanOrEqual(0)
    })
  })

  describe('warmup', () => {
    it('应该预热缓存', async () => {
      const loaders = [
        {
          key: 'warmup1',
          type: CacheType.BUILD,
          loader: async () => ({ data: 'warmup1' })
        },
        {
          key: 'warmup2',
          type: CacheType.MODULE,
          loader: async () => ({ data: 'warmup2' })
        }
      ]

      await cacheManager.warmup(loaders)

      const item1 = await cacheManager.get('warmup1', CacheType.BUILD)
      const item2 = await cacheManager.get('warmup2', CacheType.MODULE)

      expect(item1).toEqual({ data: 'warmup1' })
      expect(item2).toEqual({ data: 'warmup2' })
    })

    it('预热失败不应该影响其他项', async () => {
      const loaders = [
        {
          key: 'success',
          type: CacheType.BUILD,
          loader: async () => ({ data: 'success' })
        },
        {
          key: 'fail',
          type: CacheType.MODULE,
          loader: async () => {
            throw new Error('加载失败')
          }
        }
      ]

      await cacheManager.warmup(loaders)

      const success = await cacheManager.get('success', CacheType.BUILD)
      const fail = await cacheManager.get('fail', CacheType.MODULE)

      expect(success).toEqual({ data: 'success' })
      expect(fail).toBeNull()
    })
  })

  describe('自动清理', () => {
    it('应该根据大小限制清理缓存', async () => {
      const smallCache = new CacheManager({
        enabled: true,
        dir: testCacheDir,
        maxSize: 200, // 非常小的限制
        autoClean: {
          enabled: true,
          threshold: 0.8
        }
      })

      // 添加多个项直到超过阈值
      await smallCache.set('item1', CacheType.BUILD, { data: 'x'.repeat(50) })
      await smallCache.set('item2', CacheType.BUILD, { data: 'x'.repeat(50) })
      await smallCache.set('item3', CacheType.BUILD, { data: 'x'.repeat(50) })
      await smallCache.set('item4', CacheType.BUILD, { data: 'x'.repeat(50) })

      // 触发清理
      await smallCache['performCleanup']()

      const stats = smallCache.getStats()
      expect(stats.totalSize).toBeLessThanOrEqual(200 * 0.6) // 清理到60%

      await smallCache.destroy()
    })

    it('应该优先清理最少使用的项', async () => {
      await cacheManager.set('frequently-used', CacheType.BUILD, { data: 'test' })
      await cacheManager.set('rarely-used', CacheType.BUILD, { data: 'test' })

      // 多次访问 frequently-used
      for (let i = 0; i < 5; i++) {
        await cacheManager.get('frequently-used', CacheType.BUILD)
      }

      // 模拟需要清理的情况
      const items = Array.from(cacheManager['cache'].values())
      const sorted = items.sort((a, b) => {
        const scoreA = a.accessCount / (Date.now() - a.lastAccessed + 1)
        const scoreB = b.accessCount / (Date.now() - b.lastAccessed + 1)
        return scoreA - scoreB
      })

      // rarely-used 应该有更低的分数
      expect(sorted[0].key).toBe('rarely-used')
    })
  })
})






