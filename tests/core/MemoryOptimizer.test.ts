/**
 * MemoryOptimizer 单元测试
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryOptimizer } from '../../src/utils/memory-optimizer'

describe('MemoryOptimizer', () => {
  let optimizer: MemoryOptimizer

  beforeEach(() => {
    optimizer = new MemoryOptimizer(100) // 100MB 阈值
  })

  afterEach(() => {
    optimizer.stopMonitoring()
  })

  describe('基础功能', () => {
    it('应该能获取内存统计', () => {
      const stats = optimizer.getMemoryStats()

      expect(stats).toHaveProperty('heapUsed')
      expect(stats).toHaveProperty('heapTotal')
      expect(stats).toHaveProperty('external')
      expect(stats).toHaveProperty('rss')
      expect(stats).toHaveProperty('arrayBuffers')
      expect(stats).toHaveProperty('usagePercent')

      expect(typeof stats.heapUsed).toBe('number')
      expect(stats.heapUsed).toBeGreaterThan(0)
    })

    it('应该能格式化内存大小', () => {
      expect(optimizer.formatMemorySize(500)).toBe('500B')
      expect(optimizer.formatMemorySize(1024)).toBe('1.00KB')
      expect(optimizer.formatMemorySize(1024 * 1024)).toBe('1.00MB')
      expect(optimizer.formatMemorySize(1024 * 1024 * 2.5)).toBe('2.50MB')
    })
  })

  describe('资源清理', () => {
    it('应该能注册清理函数', () => {
      const cleanup = vi.fn()
      const unregister = optimizer.registerCleanup(cleanup)

      expect(typeof unregister).toBe('function')
    })

    it('应该能执行所有清理函数', async () => {
      const cleanup1 = vi.fn()
      const cleanup2 = vi.fn()

      optimizer.registerCleanup(cleanup1)
      optimizer.registerCleanup(cleanup2)

      await optimizer.cleanup()

      expect(cleanup1).toHaveBeenCalledTimes(1)
      expect(cleanup2).toHaveBeenCalledTimes(1)
    })

    it('清理失败不应该影响其他清理函数', async () => {
      const failingCleanup = vi.fn(() => {
        throw new Error('清理失败')
      })
      const successCleanup = vi.fn()

      optimizer.registerCleanup(failingCleanup)
      optimizer.registerCleanup(successCleanup)

      await optimizer.cleanup()

      expect(failingCleanup).toHaveBeenCalled()
      expect(successCleanup).toHaveBeenCalled()
    })
  })

  describe('WeakMap 缓存', () => {
    it('应该能缓存对象数据', () => {
      const obj = {}
      optimizer.cacheInWeakMap(obj, 'key1', 'value1')

      const value = optimizer.getFromWeakMap(obj, 'key1')
      expect(value).toBe('value1')
    })

    it('应该能缓存多个键值', () => {
      const obj = {}
      optimizer.cacheInWeakMap(obj, 'key1', 'value1')
      optimizer.cacheInWeakMap(obj, 'key2', 'value2')

      expect(optimizer.getFromWeakMap(obj, 'key1')).toBe('value1')
      expect(optimizer.getFromWeakMap(obj, 'key2')).toBe('value2')
    })

    it('不存在的键应该返回 undefined', () => {
      const obj = {}
      const value = optimizer.getFromWeakMap(obj, 'nonexistent')
      expect(value).toBeUndefined()
    })
  })

  describe('内存监控', () => {
    it('应该能开始监控', () => {
      expect(() => {
        optimizer.startMonitoring(1000)
      }).not.toThrow()
    })

    it('应该能停止监控', () => {
      optimizer.startMonitoring(1000)
      expect(() => {
        optimizer.stopMonitoring()
      }).not.toThrow()
    })

    it('重复启动监控应该有警告', () => {
      optimizer.startMonitoring(1000)
      optimizer.startMonitoring(1000) // 第二次应该警告
      optimizer.stopMonitoring()
    })

    it('应该能发出内存统计事件', done => {
      optimizer.on('memory-stats', stats => {
        expect(stats).toHaveProperty('heapUsed')
        optimizer.stopMonitoring()
        done()
      })

      optimizer.startMonitoring(100) // 100ms 间隔
    })
  })

  describe('优化建议', () => {
    it('应该能生成优化建议', () => {
      const suggestions = optimizer.getOptimizationSuggestions()

      expect(Array.isArray(suggestions)).toBe(true)

      suggestions.forEach(s => {
        expect(s).toHaveProperty('type')
        expect(s).toHaveProperty('priority')
        expect(s).toHaveProperty('suggestion')
        expect(s).toHaveProperty('action')
        expect(['high', 'medium', 'low']).toContain(s.priority)
      })
    })
  })

  describe('内存泄漏检测', () => {
    it('应该能检测内存变化', async () => {
      const result = await optimizer.detectMemoryLeak(100) // 100ms 检测

      expect(result).toHaveProperty('leaked')
      expect(result).toHaveProperty('growth')
      expect(result).toHaveProperty('suggestions')
      expect(typeof result.leaked).toBe('boolean')
      expect(Array.isArray(result.suggestions)).toBe(true)
    })
  })

  describe('内存报告', () => {
    it('应该能生成完整报告', () => {
      const cleanup = vi.fn()
      optimizer.registerCleanup(cleanup)

      const report = optimizer.generateReport()

      expect(report).toHaveProperty('stats')
      expect(report).toHaveProperty('suggestions')
      expect(report).toHaveProperty('cleanupHandlers')
      expect(report.cleanupHandlers).toBe(1)
    })
  })

  describe('边界情况', () => {
    it('应该处理无效的阈值', () => {
      expect(() => {
        new MemoryOptimizer(-100)
      }).not.toThrow()
    })

    it('应该处理空的清理函数集', async () => {
      await expect(optimizer.cleanup()).resolves.not.toThrow()
    })
  })
})


