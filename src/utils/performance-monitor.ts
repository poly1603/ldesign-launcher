/**
 * 性能监控工具 (精简版)
 *
 * 提供基础的性能计时和报告功能
 * 删除了 CPU/内存/堆监控等过度工程化功能
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import { EventEmitter } from 'node:events'
import { performance } from 'node:perf_hooks'
import { Logger } from './logger'

/**
 * 性能指标接口 (精简版)
 */
export interface PerformanceMetrics {
  timing: {
    startupTime: number
    buildTime: number
    hmrTime: number
  }
}

/**
 * 性能监控器选项
 */
export interface PerformanceMonitorOptions {
  enabled?: boolean
  logger?: Logger
}

/**
 * 性能监控器 (精简版)
 */
export class PerformanceMonitor extends EventEmitter {
  private enabled: boolean
  private logger: Logger
  private metrics: PerformanceMetrics
  private marks = new Map<string, number>()
  private measures = new Map<string, number[]>()

  constructor(options: PerformanceMonitorOptions = {}) {
    super()

    this.enabled = options.enabled ?? true
    this.logger = options.logger || new Logger('PerformanceMonitor')

    // 初始化metrics
    this.metrics = {
      timing: {
        startupTime: 0,
        buildTime: 0,
        hmrTime: 0,
      },
    }
  }

  /**
   * 记录性能标记
   */
  mark(name: string): void {
    this.marks.set(name, performance.now())
    performance.mark(name)
  }

  /**
   * 测量性能
   */
  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark)
    if (!start) {
      this.logger.warn(`性能标记不存在: ${startMark}`)
      return 0
    }

    const end = endMark ? this.marks.get(endMark) : performance.now()
    if (!end) {
      this.logger.warn(`性能标记不存在: ${endMark}`)
      return 0
    }

    const duration = end - start

    // 记录到measures
    if (!this.measures.has(name)) {
      this.measures.set(name, [])
    }
    this.measures.get(name)?.push(duration)

    // 使用performance API记录
    try {
      performance.measure(name, startMark, endMark)
    }
    catch {
      // 忽略错误（标记可能已被清理）
    }

    return duration
  }

  /**
   * 记录计时
   */
  recordTiming(type: 'startup' | 'build' | 'hmr', duration: number): void {
    if (!this.enabled)
      return

    switch (type) {
      case 'startup':
        this.metrics.timing.startupTime = duration
        break
      case 'build':
        this.metrics.timing.buildTime = duration
        break
      case 'hmr':
        this.metrics.timing.hmrTime = duration
        break
    }

    this.logger.debug(`计时记录 [${type}]: ${duration}ms`)
  }

  /**
   * 获取当前指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    averages: Record<string, number>
    totals: Record<string, number>
    counts: Record<string, number>
  } {
    const averages: Record<string, number> = {}
    const totals: Record<string, number> = {}
    const counts: Record<string, number> = {}

    this.measures.forEach((durations, name) => {
      if (durations.length > 0) {
        const total = durations.reduce((a, b) => a + b, 0)
        totals[name] = total
        counts[name] = durations.length
        averages[name] = total / durations.length
      }
    })

    return { averages, totals, counts }
  }

  /**
   * 生成性能报告 (精简版)
   */
  generateReport(): string {
    const report: string[] = []

    report.push('=== 性能报告 ===')

    // 计时信息
    if (this.metrics.timing.startupTime > 0 || this.metrics.timing.buildTime > 0) {
      if (this.metrics.timing.startupTime > 0) {
        report.push(`启动时间: ${this.metrics.timing.startupTime}ms`)
      }
      if (this.metrics.timing.buildTime > 0) {
        report.push(`构建时间: ${this.metrics.timing.buildTime}ms`)
      }
      if (this.metrics.timing.hmrTime > 0) {
        report.push(`HMR时间: ${this.metrics.timing.hmrTime}ms`)
      }
    }

    // 统计信息
    const stats = this.getStats()
    if (Object.keys(stats.averages).length > 0) {
      report.push('---')
      Object.entries(stats.averages).forEach(([name, avg]) => {
        report.push(`${name}: ${avg.toFixed(2)}ms (共${stats.counts[name]}次)`)
      })
    }

    const reportStr = report.join('\n')
    this.emit('report', reportStr)
    return reportStr
  }

  /**
   * 重置所有指标
   */
  reset(): void {
    this.metrics = {
      timing: {
        startupTime: 0,
        buildTime: 0,
        hmrTime: 0,
      },
    }
    this.marks.clear()
    this.measures.clear()
    this.logger.debug('性能指标已重置')
  }

  /**
   * 销毁监控器
   */
  destroy(): void {
    this.removeAllListeners()
    this.reset()
  }
}

/**
 * 创建性能监控器实例
 */
export function createPerformanceMonitor(options?: PerformanceMonitorOptions): PerformanceMonitor {
  return new PerformanceMonitor(options)
}

// 导出默认实例 (默认禁用，需要时开启)
export const performanceMonitor = new PerformanceMonitor({
  enabled: process.env.PERF_MONITOR === 'true',
})
