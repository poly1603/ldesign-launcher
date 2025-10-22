/**
 * ConfigCache 单元测试
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ConfigCache, createConfigCache } from '../../src/utils/config-cache'
import { writeFile, unlink, mkdir, rm } from 'fs/promises'
import { join } from 'path'

describe('ConfigCache', () => {
  let cache: ConfigCache
  let testDir: string
  let testFile: string

  beforeEach(async () => {
    cache = new ConfigCache(5000, true)
    testDir = join(process.cwd(), 'test-temp')
    testFile = join(testDir, 'test-config.ts')

    await mkdir(testDir, { recursive: true })
    await writeFile(testFile, 'export default { test: true }', 'utf-8')
  })

  afterEach(async () => {
    cache.clear()
    try {
      await rm(testDir, { recursive: true, force: true })
    } catch {
      // 忽略清理错误
    }
  })

  describe('基础功能', () => {
    it('应该能设置和获取缓存', async () => {
      const config = { test: true }
      await cache.set(testFile, config, 'content')

      const cached = await cache.get(testFile)
      expect(cached).toEqual(config)
    })

    it('缓存未命中应该返回 null', async () => {
      const result = await cache.get('nonexistent.ts')
      expect(result).toBeNull()
    })

    it('应该能删除缓存', async () => {
      const config = { test: true }
      await cache.set(testFile, config)

      cache.delete(testFile)

      const cached = await cache.get(testFile)
      expect(cached).toBeNull()
    })

    it('应该能清空所有缓存', async () => {
      await cache.set('file1.ts', { a: 1 })
      await cache.set('file2.ts', { b: 2 })

      cache.clear()

      const stats = cache.getStats()
      expect(stats.size).toBe(0)
    })
  })

  describe('TTL 过期', () => {
    it('过期的缓存应该返回 null', async () => {
      const shortTTL = new ConfigCache(100, true) // 100ms TTL
      const config = { test: true }

      await shortTTL.set(testFile, config)

      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 150))

      const cached = await shortTTL.get(testFile)
      expect(cached).toBeNull()
    })
  })

  describe('文件修改检测', () => {
    it('文件被修改后缓存应该失效', async () => {
      const config = { test: true }
      await cache.set(testFile, config)

      // 修改文件
      await new Promise(resolve => setTimeout(resolve, 10))
      await writeFile(testFile, 'export default { modified: true }', 'utf-8')

      const cached = await cache.get(testFile)
      expect(cached).toBeNull()
    })
  })

  describe('缓存统计', () => {
    it('应该能获取缓存统计', async () => {
      await cache.set('file1.ts', { a: 1 })
      await cache.set('file2.ts', { b: 2 })

      const stats = cache.getStats()

      expect(stats.size).toBe(2)
      expect(stats.items).toHaveLength(2)
      expect(stats.items[0]).toHaveProperty('path')
      expect(stats.items[0]).toHaveProperty('age')
    })
  })

  describe('启用/禁用', () => {
    it('禁用后不应该设置缓存', async () => {
      cache.setEnabled(false)

      await cache.set(testFile, { test: true })
      const cached = await cache.get(testFile)

      expect(cached).toBeNull()
    })

    it('应该能检查启用状态', () => {
      expect(cache.isEnabled()).toBe(true)

      cache.setEnabled(false)
      expect(cache.isEnabled()).toBe(false)
    })

    it('禁用时应该清空缓存', async () => {
      await cache.set('file1.ts', { a: 1 })

      cache.setEnabled(false)

      const stats = cache.getStats()
      expect(stats.size).toBe(0)
    })
  })

  describe('内容哈希验证', () => {
    it('应该能验证缓存完整性', async () => {
      const content = 'test content'
      const config = { test: true }

      await cache.set(testFile, config, content)

      const isValid = await cache.validate(testFile, content)
      expect(isValid).toBe(true)
    })

    it('内容变化应该验证失败', async () => {
      const content = 'test content'
      const config = { test: true }

      await cache.set(testFile, config, content)

      const isValid = await cache.validate(testFile, 'modified content')
      expect(isValid).toBe(false)
    })
  })

  describe('清理过期缓存', () => {
    it('应该能清理过期缓存', async () => {
      const shortTTL = new ConfigCache(100, true)

      await shortTTL.set('file1.ts', { a: 1 })
      await shortTTL.set('file2.ts', { b: 2 })

      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 150))

      const removed = shortTTL.cleanup()
      expect(removed).toBe(2)
    })
  })

  describe('工厂函数', () => {
    it('createConfigCache 应该创建实例', () => {
      const instance = createConfigCache(1000, true)
      expect(instance).toBeInstanceOf(ConfigCache)
    })
  })
})


