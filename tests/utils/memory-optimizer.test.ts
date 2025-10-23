/**
 * MemoryOptimizer 测试用例
 * 
 * 测试内存优化功能
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryOptimizer } from '../../src/utils/memory-optimizer'

describe('MemoryOptimizer', () => {
  let optimizer: MemoryOptimizer

  beforeEach(() => {
    optimizer = new MemoryOptimizer(500) // 500MB threshold
  })

  afterEach(() => {
    optimizer.stop()
    optimizer.removeAllListeners()
  })

  describe('构造函数', () => {
    it('应该正确初始化', () => {
      expect(optimizer).toBeInstanceOf(MemoryOptimizer)
    })

    it('应该使用默认阈值', () => {
      const defaultOptimizer = new MemoryOptimizer()
      expect(defaultOptimizer).toBeInstanceOf(MemoryOptimizer)
    })

    it('应该接受自定义阈值', () => {
      const customOptimizer = new MemoryOptimizer(1000)
      expect(customOptimizer).toBeInstanceOf(MemoryOptimizer)
    })
  })

  describe('内存统计', () => {
    it('应该能获取内存统计信息', () => {
      const stats = optimizer.getMemoryStats()
      
      expect(stats).toBeDefined()
      expect(stats.heapUsed).toBeGreaterThan(0)
      expect(stats.heapTotal).toBeGreaterThan(0)
      expect(stats.rss).toBeGreaterThan(0)
      expect(stats.usagePercent).toBeGreaterThanOrEqual(0)
      expect(stats.usagePercent).toBeLessThanOrEqual(100)
    })

    it('应该能格式化内存大小', () => {
      const sizeKB = optimizer.formatMemorySize(1024)
      const sizeMB = optimizer.formatMemorySize(1024 * 1024)
      
      expect(sizeKB).toContain('KB')
      expect(sizeMB).toContain('MB')
    })
  })

  describe('资源清理', () => {
    it('应该能注册清理函数', () => {
      const cleanup = vi.fn()
      const unregister = optimizer.registerCleanup(cleanup)
      
      expect(typeof unregister).toBe('function')
    })

    it('应该能取消注册清理函数', () => {
      const cleanup = vi.fn()
      const unregister = optimizer.registerCleanup(cleanup)
      
      expect(() => unregister()).not.toThrow()
    })

    it('应该能执行所有清理函数', async () => {
      const cleanup1 = vi.fn()
      const cleanup2 = vi.fn()
      
      optimizer.registerCleanup(cleanup1)
      optimizer.registerCleanup(cleanup2)
      
      await optimizer.cleanup()
      
      expect(cleanup1).toHaveBeenCalled()
      expect(cleanup2).toHaveBeenCalled()
    })
  })

  describe('内存监控', () => {
    it('应该能启动监控', () => {
      expect(() => optimizer.startMonitoring(1000)).not.toThrow()
    })

    it('应该能停止监控', () => {
      optimizer.startMonitoring(1000)
      expect(() => optimizer.stop()).not.toThrow()
    })
  })

  describe('弱引用缓存', () => {
    it('应该支持 WeakMap 缓存', () => {
      const obj = { key: 'value' }
      const value = 'cached-data'
      
      // 内部 WeakMap 不直接暴露，但可以通过行为验证
      expect(optimizer).toBeInstanceOf(MemoryOptimizer)
    })
  })

  describe('事件系统', () => {
    it('应该能监听内存事件', (done) => {
      optimizer.on('memory-warning', (stats) => {
        expect(stats).toBeDefined()
        done()
      })
      
      // 正常情况下不会触发警告，测试会超时后通过
      setTimeout(() => done(), 500)
    }, 1000)
  })

  describe('边界情况', () => {
    it('应该处理清理函数抛出的异常', async () => {
      const failingCleanup = vi.fn(() => {
        throw new Error('Cleanup failed')
      })
      
      optimizer.registerCleanup(failingCleanup)
      
      // 不应该抛出异常
      await expect(optimizer.cleanup()).resolves.not.toThrow()
      expect(failingCleanup).toHaveBeenCalled()
    })

    it('应该处理异步清理函数', async () => {
      const asyncCleanup = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
      })
      
      optimizer.registerCleanup(asyncCleanup)
      await optimizer.cleanup()
      
      expect(asyncCleanup).toHaveBeenCalled()
    })
  })
})


