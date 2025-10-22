/**
 * 缓存系统集成测试
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { CacheManager } from '../../src/core/CacheManager'
import { rm } from 'fs/promises'
import { join } from 'path'

describe('Cache System Integration', () => {
  let cacheManager: CacheManager
  let cacheDir: string

  beforeEach(() => {
    cacheDir = join(process.cwd(), 'test-cache')
    cacheManager = new CacheManager({
      enabled: true,
      cacheDir,
      maxSize: 100, // 100MB
      ttl: 60000, // 60s
      types: ['build', 'deps', 'modules'],
      compression: true,
      autoClean: {
        enabled: false, // 测试时禁用自动清理
        interval: 1,
        threshold: 0.8
      }
    })
  })

  afterEach(async () => {
    await cacheManager.destroy()
    try {
      await rm(cacheDir, { recursive: true, force: true })
    } catch {
      // 忽略清理错误
    }
  })

  describe('基础缓存流程', () => {
    it('应该能完成 set → get 流程', async () => {
      const testData = { foo: 'bar', num: 123 }

      await cacheManager.set('test-key', 'build', testData)
      const retrieved = await cacheManager.get('test-key', 'build')

      expect(retrieved).toEqual(testData)
    })

    it('应该能删除缓存', async () => {
      await cacheManager.set('test-key', 'build', { data: 'test' })
      await cacheManager.delete('test-key', 'build')

      const retrieved = await cacheManager.get('test-key', 'build')
      expect(retrieved).toBeNull()
    })
  })

  describe('缓存预热', () => {
    it('应该能预热多个缓存项', async () => {
      const keys = [
        {
          key: 'config1',
          type: 'build' as const,
          loader: async () => ({ config: 1 })
        },
        {
          key: 'config2',
          type: 'build' as const,
          loader: async () => ({ config: 2 })
        }
      ]

      await cacheManager.warmup(keys)

      const config1 = await cacheManager.get('config1', 'build')
      const config2 = await cacheManager.get('config2', 'build')

      expect(config1).toEqual({ config: 1 })
      expect(config2).toEqual({ config: 2 })
    })

    it('预热失败不应该影响其他项', async () => {
      const keys = [
        {
          key: 'success',
          type: 'build' as const,
          loader: async () => ({ data: 'ok' })
        },
        {
          key: 'fail',
          type: 'build' as const,
          loader: async () => {
            throw new Error('加载失败')
          }
        }
      ]

      await cacheManager.warmup(keys)

      const success = await cacheManager.get('success', 'build')
      expect(success).toEqual({ data: 'ok' })
    })
  })

  describe('智能压缩', () => {
    it('应该能压缩大数据', async () => {
      // 创建大数据（>10KB）
      const largeData = { data: 'x'.repeat(20 * 1024) }

      await cacheManager.set('large-data', 'build', largeData)

      const result = await cacheManager.smartCompress()

      expect(result.compressed).toBeGreaterThan(0)
      expect(result.savedBytes).toBeGreaterThan(0)
    })

    it('压缩后应该能正确解压', async () => {
      const largeData = { data: 'x'.repeat(20 * 1024) }

      await cacheManager.set('large-data', 'build', largeData)
      await cacheManager.smartCompress()

      const retrieved = await cacheManager.get('large-data', 'build')
      expect(retrieved).toEqual(largeData)
    })
  })

  describe('健康检查', () => {
    it('应该能执行健康检查', async () => {
      await cacheManager.set('test1', 'build', { data: 1 })
      await cacheManager.set('test2', 'build', { data: 2 })

      const health = await cacheManager.healthCheck()

      expect(health).toHaveProperty('healthy')
      expect(health).toHaveProperty('issues')
      expect(health).toHaveProperty('stats')
      expect(health).toHaveProperty('recommendations')
      expect(typeof health.healthy).toBe('boolean')
    })
  })

  describe('统计信息', () => {
    it('应该能获取缓存统计', async () => {
      await cacheManager.set('test1', 'build', { data: 1 })
      await cacheManager.set('test2', 'deps', { data: 2 })

      const stats = await cacheManager.getStats()

      expect(stats.totalItems).toBeGreaterThan(0)
      expect(stats.byType).toHaveProperty('build')
      expect(stats.byType).toHaveProperty('deps')
    })
  })
})


