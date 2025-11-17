/**
 * 性能监控工具
 * 
 * 用于跟踪和分析 Launcher 各阶段的性能指标
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

export interface PerformanceRecord {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

export interface PerformanceReport {
  totalDuration: number
  records: PerformanceRecord[]
  bottlenecks: Array<{
    name: string
    duration: number
    percentage: number
  }>
  timeline: Array<{
    stage: string
    duration: number
    startOffset: number
  }>
}

/**
 * 性能分析器
 */
export class PerformanceProfiler {
  private records: Map<string, PerformanceRecord> = new Map()
  private startTime: number = 0
  private enabled: boolean = false

  /**
   * 开始性能分析
   */
  start(): void {
    this.enabled = true
    this.startTime = Date.now()
    this.records.clear()
  }

  /**
   * 停止性能分析
   */
  stop(): void {
    this.enabled = false
  }

  /**
   * 标记一个阶段的开始
   * 
   * @param name - 阶段名称
   * @param metadata - 附加元数据
   */
  markStart(name: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return

    this.records.set(name, {
      name,
      startTime: Date.now(),
      metadata
    })
  }

  /**
   * 标记一个阶段的结束
   * 
   * @param name - 阶段名称
   * @param metadata - 附加元数据
   */
  markEnd(name: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return

    const record = this.records.get(name)
    if (record) {
      record.endTime = Date.now()
      record.duration = record.endTime - record.startTime
      if (metadata) {
        record.metadata = { ...record.metadata, ...metadata }
      }
    }
  }

  /**
   * 测量一个异步操作的耗时
   * 
   * @param name - 操作名称
   * @param fn - 异步函数
   * @param metadata - 附加元数据
   * @returns 函数执行结果
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.markStart(name, metadata)
    try {
      const result = await fn()
      this.markEnd(name)
      return result
    } catch (error) {
      this.markEnd(name, { error: (error as Error).message })
      throw error
    }
  }

  /**
   * 测量一个同步操作的耗时
   * 
   * @param name - 操作名称
   * @param fn - 同步函数
   * @param metadata - 附加元数据
   * @returns 函数执行结果
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    this.markStart(name, metadata)
    try {
      const result = fn()
      this.markEnd(name)
      return result
    } catch (error) {
      this.markEnd(name, { error: (error as Error).message })
      throw error
    }
  }

  /**
   * 获取性能报告
   * 
   * @returns 性能报告
   */
  getReport(): PerformanceReport {
    const records = Array.from(this.records.values())
      .filter(r => r.duration !== undefined)
      .sort((a, b) => a.startTime - b.startTime)

    const totalDuration = records.reduce((sum, r) => sum + (r.duration || 0), 0)

    // 找出性能瓶颈（耗时超过10%的阶段）
    const bottlenecks = records
      .map(r => ({
        name: r.name,
        duration: r.duration || 0,
        percentage: ((r.duration || 0) / totalDuration) * 100
      }))
      .filter(b => b.percentage > 10)
      .sort((a, b) => b.duration - a.duration)

    // 生成时间线
    const timeline = records.map(r => ({
      stage: r.name,
      duration: r.duration || 0,
      startOffset: r.startTime - this.startTime
    }))

    return {
      totalDuration,
      records,
      bottlenecks,
      timeline
    }
  }

  /**
   * 导出性能报告为文本
   * 
   * @returns 格式化的文本报告
   */
  exportReport(): string {
    const report = this.getReport()
    const lines: string[] = []

    lines.push('📊 性能分析报告')
    lines.push('━'.repeat(60))
    lines.push(`总耗时: ${report.totalDuration}ms`)
    lines.push('')

    lines.push('🔍 各阶段耗时:')
    for (const record of report.timeline) {
      const bar = '█'.repeat(Math.ceil(record.duration / 10))
      const percentage = ((record.duration / report.totalDuration) * 100).toFixed(1)
      lines.push(`  ${record.stage.padEnd(25)} ${record.duration.toString().padStart(6)}ms  ${percentage.padStart(5)}%  ${bar}`)
    }
    lines.push('')

    if (report.bottlenecks.length > 0) {
      lines.push('⚠️  性能瓶颈 (>10%):')
      for (const bottleneck of report.bottlenecks) {
        lines.push(`  ${bottleneck.name.padEnd(25)} ${bottleneck.duration.toString().padStart(6)}ms  ${bottleneck.percentage.toFixed(1).padStart(5)}%`)
      }
      lines.push('')
    }

    lines.push('━'.repeat(60))

    return lines.join('\n')
  }

  /**
   * 重置性能记录
   */
  reset(): void {
    this.records.clear()
    this.startTime = 0
  }

  /**
   * 是否启用
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * 获取特定阶段的记录
   * 
   * @param name - 阶段名称
   * @returns 性能记录
   */
  getRecord(name: string): PerformanceRecord | undefined {
    return this.records.get(name)
  }

  /**
   * 获取所有记录
   * 
   * @returns 所有性能记录
   */
  getAllRecords(): PerformanceRecord[] {
    return Array.from(this.records.values())
  }
}

/**
 * 全局性能分析器实例
 */
export const globalProfiler = new PerformanceProfiler()
