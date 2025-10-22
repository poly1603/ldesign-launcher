/**
 * 性能监控系统集成测试
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

import { describe, it, expect } from 'vitest'
import { PerformanceMonitor } from '../../src/core/PerformanceMonitor'

describe('Performance Monitor Integration', () => {
  describe('完整监控流程', () => {
    it('应该能开始和停止监控', () => {
      const monitor = new PerformanceMonitor()

      expect(() => {
        monitor.startMonitoring()
        monitor.stopMonitoring()
      }).not.toThrow()
    })

    it('应该能记录构建时间', () => {
      const monitor = new PerformanceMonitor()

      monitor.startBuildTracking()

      // 模拟构建过程
      const buildTime = 1000

      monitor.endBuildTracking()

      const metrics = monitor.getMetrics()
      expect(metrics.buildTime).toBeGreaterThan(0)
    })

    it('应该能生成性能报告', () => {
      const monitor = new PerformanceMonitor()

      monitor.startBuildTracking()
      monitor.endBuildTracking()

      const report = monitor.generateReport()

      expect(report).toHaveProperty('timestamp')
      expect(report).toHaveProperty('projectInfo')
      expect(report).toHaveProperty('metrics')
      expect(report).toHaveProperty('score')
      expect(report).toHaveProperty('recommendations')
    })
  })

  describe('性能指标追踪', () => {
    it('应该能追踪内存使用', () => {
      const monitor = new PerformanceMonitor()

      monitor.trackMemoryUsage()

      const metrics = monitor.getMetrics()
      expect(metrics.memoryUsage).toBeDefined()
      expect(metrics.memoryUsage?.heapUsed).toBeGreaterThan(0)
    })

    it('应该能添加自定义阶段', () => {
      const monitor = new PerformanceMonitor()

      monitor.startPhase('custom-phase')
      monitor.endPhase('custom-phase')

      const metrics = monitor.getMetrics()
      expect(metrics.phases).toHaveProperty('custom-phase')
    })
  })
})


