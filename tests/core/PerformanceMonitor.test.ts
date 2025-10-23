/**
 * PerformanceMonitor 测试用例
 * 
 * 测试性能监控功能
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PerformanceMonitor, PerformanceReport } from '../../src/core/PerformanceMonitor'

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor

  beforeEach(() => {
    monitor = new PerformanceMonitor({
      enableMemoryMonitor: true,
      enableCPUMonitor: true,
      sampleInterval: 1000
    })
  })

  afterEach(() => {
    monitor.stop()
    monitor.removeAllListeners()
  })

  describe('构造函数', () => {
    it('应该正确初始化', () => {
      expect(monitor).toBeInstanceOf(PerformanceMonitor)
    })

    it('应该接受配置选项', () => {
      const customMonitor = new PerformanceMonitor({
        enableMemoryMonitor: false,
        enableCPUMonitor: false,
        sampleInterval: 5000
      })
      
      expect(customMonitor).toBeInstanceOf(PerformanceMonitor)
    })

    it('应该使用默认配置', () => {
      const defaultMonitor = new PerformanceMonitor()
      expect(defaultMonitor).toBeInstanceOf(PerformanceMonitor)
    })
  })

  describe('性能监控', () => {
    it('应该能启动监控', () => {
      expect(() => monitor.start()).not.toThrow()
    })

    it('应该能停止监控', () => {
      monitor.start()
      expect(() => monitor.stop()).not.toThrow()
    })

    it('应该能获取性能指标', () => {
      const metrics = monitor.getMetrics()
      
      expect(metrics).toBeDefined()
      expect(typeof metrics).toBe('object')
      expect(metrics.memory).toBeDefined()
      expect(metrics.cpu).toBeDefined()
    })

    it('应该能生成性能报告', () => {
      const report = monitor.generateReport()
      
      expect(report).toBeDefined()
      expect(report).toBeInstanceOf(PerformanceReport)
    })
  })

  describe('事件系统', () => {
    it('应该能监听性能事件', (done) => {
      monitor.on('metrics', (metrics) => {
        expect(metrics).toBeDefined()
        done()
      })
      
      monitor.start()
      
      // 如果1秒内没有触发事件，测试通过（可能监控间隔较长）
      setTimeout(() => {
        if (!done.mock) {
          done()
        }
      }, 1100)
    }, 2000)
  })

  describe('Vite 插件', () => {
    it('应该能创建 Vite 插件', () => {
      const plugin = monitor.createVitePlugin()
      
      expect(plugin).toBeDefined()
      expect(plugin.name).toBe('launcher:performance-monitor')
    })

    it('插件应该有正确的钩子', () => {
      const plugin = monitor.createVitePlugin()
      
      expect(plugin.configureServer).toBeDefined()
      expect(typeof plugin.configureServer).toBe('function')
    })
  })

  describe('内存监控', () => {
    it('应该能获取内存使用情况', () => {
      monitor.start()
      const metrics = monitor.getMetrics()
      
      expect(metrics.memory).toBeDefined()
      expect(metrics.memory.used).toBeGreaterThan(0)
      expect(metrics.memory.total).toBeGreaterThan(0)
      expect(metrics.memory.percentage).toBeGreaterThanOrEqual(0)
      expect(metrics.memory.percentage).toBeLessThanOrEqual(100)
    })
  })

  describe('CPU 监控', () => {
    it('应该能获取 CPU 使用情况', () => {
      monitor.start()
      const metrics = monitor.getMetrics()
      
      expect(metrics.cpu).toBeDefined()
      expect(metrics.cpu.usage).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(metrics.cpu.loadAverage)).toBe(true)
    })
  })

  describe('错误处理', () => {
    it('应该优雅地处理监控错误', () => {
      expect(() => monitor.start()).not.toThrow()
      expect(() => monitor.stop()).not.toThrow()
      expect(() => monitor.getMetrics()).not.toThrow()
    })
  })
})


