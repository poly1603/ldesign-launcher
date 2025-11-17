/**
 * PerformanceProfiler 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PerformanceProfiler } from '../../src/utils/performance-profiler'

describe('PerformanceProfiler', () => {
  let profiler: PerformanceProfiler

  beforeEach(() => {
    profiler = new PerformanceProfiler()
  })

  describe('基础功能', () => {
    it('应该能够启动和停止性能分析', () => {
      expect(profiler.isEnabled()).toBe(false)
      
      profiler.start()
      expect(profiler.isEnabled()).toBe(true)
      
      profiler.stop()
      expect(profiler.isEnabled()).toBe(false)
    })

    it('应该能够记录性能阶段', () => {
      profiler.start()
      profiler.markStart('test-stage')
      profiler.markEnd('test-stage')
      
      const record = profiler.getRecord('test-stage')
      expect(record).toBeDefined()
      expect(record?.name).toBe('test-stage')
      expect(record?.duration).toBeGreaterThanOrEqual(0)
    })

    it('未启用时不应记录数据', () => {
      profiler.markStart('test-stage')
      profiler.markEnd('test-stage')
      
      const record = profiler.getRecord('test-stage')
      expect(record).toBeUndefined()
    })

    it('应该能够重置记录', () => {
      profiler.start()
      profiler.markStart('test-stage')
      profiler.markEnd('test-stage')
      
      expect(profiler.getAllRecords()).toHaveLength(1)
      
      profiler.reset()
      expect(profiler.getAllRecords()).toHaveLength(0)
    })
  })

  describe('同步测量', () => {
    it('应该能够测量同步操作', () => {
      profiler.start()
      
      const result = profiler.measureSync('sync-test', () => {
        let sum = 0
        for (let i = 0; i < 1000; i++) {
          sum += i
        }
        return sum
      })
      
      expect(result).toBe(499500)
      
      const record = profiler.getRecord('sync-test')
      expect(record).toBeDefined()
      expect(record?.duration).toBeGreaterThanOrEqual(0)
    })

    it('同步测量应该传播错误', () => {
      profiler.start()
      
      expect(() => {
        profiler.measureSync('error-test', () => {
          throw new Error('Test error')
        })
      }).toThrow('Test error')
      
      const record = profiler.getRecord('error-test')
      expect(record).toBeDefined()
      expect(record?.metadata?.error).toBe('Test error')
    })
  })

  describe('异步测量', () => {
    it('应该能够测量异步操作', async () => {
      profiler.start()
      
      const result = await profiler.measure('async-test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return 'done'
      })
      
      expect(result).toBe('done')
      
      const record = profiler.getRecord('async-test')
      expect(record).toBeDefined()
      expect(record?.duration).toBeGreaterThanOrEqual(10)
    })

    it('异步测量应该传播错误', async () => {
      profiler.start()
      
      await expect(
        profiler.measure('async-error-test', async () => {
          throw new Error('Async test error')
        })
      ).rejects.toThrow('Async test error')
      
      const record = profiler.getRecord('async-error-test')
      expect(record).toBeDefined()
      expect(record?.metadata?.error).toBe('Async test error')
    })
  })

  describe('性能报告', () => {
    it('应该生成正确的性能报告', () => {
      profiler.start()
      
      profiler.markStart('stage1')
      profiler.markEnd('stage1')
      
      profiler.markStart('stage2')
      profiler.markEnd('stage2')
      
      const report = profiler.getReport()
      
      expect(report.records).toHaveLength(2)
      expect(report.totalDuration).toBeGreaterThanOrEqual(0)
      expect(report.timeline).toHaveLength(2)
    })

    it('应该识别性能瓶颈 (>10%)', () => {
      profiler.start()
      
      // 创建一个占用 >10% 的阶段
      profiler.markStart('bottleneck')
      // 模拟 100ms 耗时
      const startTime = Date.now()
      while (Date.now() - startTime < 100) {
        // 忙等待
      }
      profiler.markEnd('bottleneck')
      
      profiler.markStart('fast')
      profiler.markEnd('fast')
      
      const report = profiler.getReport()
      
      // bottleneck 应该被识别为瓶颈
      const bottleneck = report.bottlenecks.find(b => b.name === 'bottleneck')
      expect(bottleneck).toBeDefined()
      expect(bottleneck?.percentage).toBeGreaterThan(10)
    })

    it('应该生成文本报告', () => {
      profiler.start()
      
      profiler.markStart('test')
      profiler.markEnd('test')
      
      const textReport = profiler.exportReport()
      
      expect(textReport).toContain('📊 性能分析报告')
      expect(textReport).toContain('总耗时')
      expect(textReport).toContain('🔍 各阶段耗时')
      expect(textReport).toContain('test')
    })
  })

  describe('元数据', () => {
    it('应该能够存储和检索元数据', () => {
      profiler.start()
      
      const metadata = { framework: 'react', version: '18.0.0' }
      profiler.markStart('with-metadata', metadata)
      profiler.markEnd('with-metadata', { status: 'success' })
      
      const record = profiler.getRecord('with-metadata')
      expect(record?.metadata).toMatchObject({
        framework: 'react',
        version: '18.0.0',
        status: 'success'
      })
    })
  })

  describe('边界情况', () => {
    it('应该处理未找到的记录', () => {
      const record = profiler.getRecord('non-existent')
      expect(record).toBeUndefined()
    })

    it('应该处理空报告', () => {
      profiler.start()
      const report = profiler.getReport()
      
      expect(report.records).toHaveLength(0)
      expect(report.totalDuration).toBe(0)
      expect(report.bottlenecks).toHaveLength(0)
      expect(report.timeline).toHaveLength(0)
    })

    it('应该处理只有 markStart 没有 markEnd 的情况', () => {
      profiler.start()
      profiler.markStart('incomplete')
      
      const report = profiler.getReport()
      // 不完整的记录不应该包含在报告中
      expect(report.records).toHaveLength(0)
    })
  })
})
