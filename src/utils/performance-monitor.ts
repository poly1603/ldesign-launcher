/**
 * 性能监控工具
 * 
 * 提供完整的性能监控、分析和报告功能
 * 
 * @author LDesign Team
 * @since 2.1.0
 */

import { EventEmitter } from 'events'
import { performance, PerformanceObserver } from 'perf_hooks'
import { Logger } from './logger'
import v8 from 'v8'
import os from 'os'

export interface PerformanceMetrics {
  memory: {
    used: number
    total: number
    percentage: number
    rss: number
    external: number
    arrayBuffers: number
  }
  cpu: {
    usage: number
    loadAverage: number[]
    cores: number
  }
  timing: {
    startupTime: number
    buildTime: number
    hmrTime: number
    fileChangeResponseTime: number
  }
  heap: {
    totalHeapSize: number
    totalHeapSizeExecutable: number
    totalPhysicalSize: number
    usedHeapSize: number
    heapSizeLimit: number
    mallocedMemory: number
    peakMallocedMemory: number
  }
  requests?: {
    total: number
    successful: number
    failed: number
    averageResponseTime: number
  }
}

export interface PerformanceThresholds {
  memory?: {
    maxUsagePercent?: number
    maxHeapUsedMB?: number
  }
  cpu?: {
    maxUsagePercent?: number
  }
  timing?: {
    maxStartupMs?: number
    maxBuildMs?: number
    maxHmrMs?: number
  }
}

export interface PerformanceMonitorOptions {
  enabled?: boolean
  sampleInterval?: number
  thresholds?: PerformanceThresholds
  logger?: Logger
  autoReport?: boolean
  reportInterval?: number
  collectHeapSnapshot?: boolean
}

export class PerformanceMonitor extends EventEmitter {
  private enabled: boolean
  private sampleInterval: number
  private thresholds: PerformanceThresholds
  private logger: Logger
  private autoReport: boolean
  private reportInterval: number
  private collectHeapSnapshot: boolean
  
  private metrics: PerformanceMetrics
  private marks = new Map<string, number>()
  private measures = new Map<string, number[]>()
  private samplingTimer?: NodeJS.Timeout
  private reportTimer?: NodeJS.Timeout
  private observer?: PerformanceObserver
  private startTime: number
  private cpuUsageStart?: NodeJS.CpuUsage
  
  constructor(options: PerformanceMonitorOptions = {}) {
    super()
    
    this.enabled = options.enabled ?? true
    this.sampleInterval = options.sampleInterval || 5000 // 5秒采样间隔
    this.thresholds = options.thresholds || {}
    this.logger = options.logger || new Logger('PerformanceMonitor')
    this.autoReport = options.autoReport ?? false
    this.reportInterval = options.reportInterval || 60000 // 1分钟报告间隔
    this.collectHeapSnapshot = options.collectHeapSnapshot ?? false
    
    this.startTime = Date.now()
    
    // 初始化metrics
    this.metrics = this.createEmptyMetrics()
    
    if (this.enabled) {
      this.start()
    }
  }
  
  /**
   * 创建空的metrics对象
   */
  private createEmptyMetrics(): PerformanceMetrics {
    return {
      memory: {
        used: 0,
        total: 0,
        percentage: 0,
        rss: 0,
        external: 0,
        arrayBuffers: 0
      },
      cpu: {
        usage: 0,
        loadAverage: [0, 0, 0],
        cores: os.cpus().length
      },
      timing: {
        startupTime: 0,
        buildTime: 0,
        hmrTime: 0,
        fileChangeResponseTime: 0
      },
      heap: {
        totalHeapSize: 0,
        totalHeapSizeExecutable: 0,
        totalPhysicalSize: 0,
        usedHeapSize: 0,
        heapSizeLimit: 0,
        mallocedMemory: 0,
        peakMallocedMemory: 0
      }
    }
  }
  
  /**
   * 启动性能监控
   */
  start(): void {
    if (!this.enabled) return
    
    this.logger.debug('性能监控已启动')
    
    // 记录初始CPU使用
    this.cpuUsageStart = process.cpuUsage()
    
    // 设置性能观察器
    this.setupPerformanceObserver()
    
    // 开始定期采样
    this.startSampling()
    
    // 开始定期报告
    if (this.autoReport) {
      this.startAutoReporting()
    }
    
    this.emit('started')
  }
  
  /**
   * 停止性能监控
   */
  stop(): void {
    this.logger.debug('性能监控已停止')
    
    if (this.samplingTimer) {
      clearInterval(this.samplingTimer)
      this.samplingTimer = undefined
    }
    
    if (this.reportTimer) {
      clearInterval(this.reportTimer)
      this.reportTimer = undefined
    }
    
    if (this.observer) {
      this.observer.disconnect()
      this.observer = undefined
    }
    
    this.emit('stopped')
  }
  
  /**
   * 设置性能观察器
   */
  private setupPerformanceObserver(): void {
    this.observer = new PerformanceObserver((items) => {
      items.getEntries().forEach((entry) => {
        this.logger.trace(`Performance entry: ${entry.name} (${entry.duration}ms)`)
        
        // 记录到measures
        if (!this.measures.has(entry.name)) {
          this.measures.set(entry.name, [])
        }
        this.measures.get(entry.name)?.push(entry.duration)
      })
    })
    
    this.observer.observe({ entryTypes: ['measure', 'mark'] })
  }
  
  /**
   * 开始采样
   */
  private startSampling(): void {
    this.samplingTimer = setInterval(() => {
      this.collectMetrics()
    }, this.sampleInterval)
    
    // 立即采样一次
    this.collectMetrics()
  }
  
  /**
   * 收集性能指标
   */
  private collectMetrics(): void {
    // 收集内存信息
    const memUsage = process.memoryUsage()
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    
    this.metrics.memory = {
      used: Math.round(usedMem / 1024 / 1024),
      total: Math.round(totalMem / 1024 / 1024),
      percentage: Math.round((usedMem / totalMem) * 100),
      rss: Math.round(memUsage.rss / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024)
    }
    
    // 收集CPU信息
    if (this.cpuUsageStart) {
      const cpuUsage = process.cpuUsage(this.cpuUsageStart)
      const totalUsage = (cpuUsage.user + cpuUsage.system) / 1000 // 微秒转毫秒
      const elapsed = Date.now() - this.startTime
      this.metrics.cpu.usage = Math.min(100, Math.round((totalUsage / elapsed) * 100))
    }
    
    this.metrics.cpu.loadAverage = os.loadavg()
    
    // 收集堆信息
    const heapStats = v8.getHeapStatistics()
    this.metrics.heap = {
      totalHeapSize: Math.round(heapStats.total_heap_size / 1024 / 1024),
      totalHeapSizeExecutable: Math.round(heapStats.total_heap_size_executable / 1024 / 1024),
      totalPhysicalSize: Math.round(heapStats.total_physical_size / 1024 / 1024),
      usedHeapSize: Math.round(heapStats.used_heap_size / 1024 / 1024),
      heapSizeLimit: Math.round(heapStats.heap_size_limit / 1024 / 1024),
      mallocedMemory: Math.round(heapStats.malloced_memory / 1024 / 1024),
      peakMallocedMemory: Math.round(heapStats.peak_malloced_memory / 1024 / 1024)
    }
    
    // 检查阈值
    this.checkThresholds()
    
    this.emit('metrics', this.metrics)
  }
  
  /**
   * 检查性能阈值
   */
  private checkThresholds(): void {
    // 检查内存阈值
    if (this.thresholds.memory) {
      if (this.thresholds.memory.maxUsagePercent && 
          this.metrics.memory.percentage > this.thresholds.memory.maxUsagePercent) {
        this.logger.warn(`内存使用率超过阈值: ${this.metrics.memory.percentage}%`)
        this.emit('threshold:memory', this.metrics.memory)
      }
      
      if (this.thresholds.memory.maxHeapUsedMB && 
          this.metrics.heap.usedHeapSize > this.thresholds.memory.maxHeapUsedMB) {
        this.logger.warn(`堆内存使用超过阈值: ${this.metrics.heap.usedHeapSize}MB`)
        this.emit('threshold:heap', this.metrics.heap)
      }
    }
    
    // 检查CPU阈值
    if (this.thresholds.cpu?.maxUsagePercent && 
        this.metrics.cpu.usage > this.thresholds.cpu.maxUsagePercent) {
      this.logger.warn(`CPU使用率超过阈值: ${this.metrics.cpu.usage}%`)
      this.emit('threshold:cpu', this.metrics.cpu)
    }
  }
  
  /**
   * 开始自动报告
   */
  private startAutoReporting(): void {
    this.reportTimer = setInterval(() => {
      this.generateReport()
    }, this.reportInterval)
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
    } catch (error) {
      // 忽略错误（标记可能已被清理）
    }
    
    return duration
  }
  
  /**
   * 记录计时
   */
  recordTiming(type: 'startup' | 'build' | 'hmr' | 'fileChange', duration: number): void {
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
      case 'fileChange':
        this.metrics.timing.fileChangeResponseTime = duration
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
   * 生成性能报告
   */
  generateReport(): string {
    const report: string[] = []
    
    report.push('═══════════════════════════════════════════')
    report.push('          性能监控报告')
    report.push('═══════════════════════════════════════════')
    report.push('')
    
    // 内存信息
    report.push('📊 内存使用:')
    report.push(`  • 系统内存: ${this.metrics.memory.used}MB / ${this.metrics.memory.total}MB (${this.metrics.memory.percentage}%)`)
    report.push(`  • RSS内存: ${this.metrics.memory.rss}MB`)
    report.push(`  • 堆内存: ${this.metrics.heap.usedHeapSize}MB / ${this.metrics.heap.heapSizeLimit}MB`)
    report.push('')
    
    // CPU信息
    report.push('💻 CPU使用:')
    report.push(`  • 使用率: ${this.metrics.cpu.usage}%`)
    report.push(`  • 负载均衡: ${this.metrics.cpu.loadAverage.map(l => l.toFixed(2)).join(', ')}`)
    report.push(`  • 核心数: ${this.metrics.cpu.cores}`)
    report.push('')
    
    // 计时信息
    if (this.metrics.timing.startupTime > 0 || this.metrics.timing.buildTime > 0) {
      report.push('⏱️ 性能计时:')
      if (this.metrics.timing.startupTime > 0) {
        report.push(`  • 启动时间: ${this.metrics.timing.startupTime}ms`)
      }
      if (this.metrics.timing.buildTime > 0) {
        report.push(`  • 构建时间: ${this.metrics.timing.buildTime}ms`)
      }
      if (this.metrics.timing.hmrTime > 0) {
        report.push(`  • HMR时间: ${this.metrics.timing.hmrTime}ms`)
      }
      report.push('')
    }
    
    // 统计信息
    const stats = this.getStats()
    if (Object.keys(stats.averages).length > 0) {
      report.push('📈 性能统计:')
      Object.entries(stats.averages).forEach(([name, avg]) => {
        report.push(`  • ${name}: 平均 ${avg.toFixed(2)}ms (共 ${stats.counts[name]} 次)`)
      })
      report.push('')
    }
    
    report.push('═══════════════════════════════════════════')
    
    const reportStr = report.join('\n')
    
    if (this.autoReport) {
      console.log(reportStr)
    }
    
    this.emit('report', reportStr)
    
    return reportStr
  }
  
  /**
   * 生成堆快照
   */
  async generateHeapSnapshot(): Promise<string | null> {
    if (!this.collectHeapSnapshot) {
      this.logger.warn('堆快照收集未启用')
      return null
    }
    
    try {
      const { writeHeapSnapshot } = await import('v8')
      const filename = `heap-${Date.now()}.heapsnapshot`
      const filepath = writeHeapSnapshot(filename)
      this.logger.info(`堆快照已保存: ${filepath}`)
      return filepath
    } catch (error) {
      this.logger.error('生成堆快照失败', error)
      return null
    }
  }
  
  /**
   * 重置所有指标
   */
  reset(): void {
    this.metrics = this.createEmptyMetrics()
    this.marks.clear()
    this.measures.clear()
    this.startTime = Date.now()
    this.cpuUsageStart = process.cpuUsage()
    
    this.logger.debug('性能指标已重置')
    this.emit('reset')
  }
  
  /**
   * 销毁监控器
   */
  destroy(): void {
    this.stop()
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

// 导出默认实例
export const performanceMonitor = new PerformanceMonitor({
  enabled: process.env.NODE_ENV === 'development' || process.env.PERF_MONITOR === 'true',
  autoReport: process.env.PERF_REPORT === 'true'
})