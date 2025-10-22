/**
 * 内存优化工具
 * 
 * 提供内存使用监控、WeakMap 优化和资源释放机制
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

import { EventEmitter } from 'events'
import { Logger } from './logger'

/**
 * 内存使用统计接口
 */
export interface MemoryStats {
  /** 堆内存使用（字节） */
  heapUsed: number
  /** 堆内存总量（字节） */
  heapTotal: number
  /** 外部内存（字节） */
  external: number
  /** RSS 内存（字节） */
  rss: number
  /** 数组缓冲区（字节） */
  arrayBuffers: number
  /** 使用率（百分比） */
  usagePercent: number
}

/**
 * 资源清理接口
 */
export interface CleanupHandler {
  (): void | Promise<void>
}

/**
 * 内存优化器类
 */
export class MemoryOptimizer extends EventEmitter {
  private logger: Logger

  /** 资源清理函数注册表 */
  private cleanupHandlers = new Set<CleanupHandler>()

  /** 大对象弱引用缓存 */
  private weakCache = new WeakMap<object, any>()

  /** 监控定时器 */
  private monitorTimer?: NodeJS.Timeout

  /** 内存阈值（字节） */
  private readonly memoryThreshold: number

  /** 是否正在监控 */
  private isMonitoring = false

  /**
   * 构造函数
   * @param threshold 内存阈值（MB），默认 500MB
   */
  constructor(threshold: number = 500) {
    super()
    this.logger = new Logger('MemoryOptimizer')
    this.memoryThreshold = threshold * 1024 * 1024
  }

  /**
   * 获取当前内存使用统计
   */
  getMemoryStats(): MemoryStats {
    const usage = process.memoryUsage()

    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      arrayBuffers: usage.arrayBuffers,
      usagePercent: (usage.heapUsed / usage.heapTotal) * 100
    }
  }

  /**
   * 格式化内存大小
   */
  formatMemorySize(bytes: number): string {
    const mb = bytes / (1024 * 1024)
    if (mb < 1) {
      return `${(bytes / 1024).toFixed(2)}KB`
    }
    return `${mb.toFixed(2)}MB`
  }

  /**
   * 注册资源清理函数
   * @param handler 清理函数
   * @returns 取消注册的函数
   */
  registerCleanup(handler: CleanupHandler): () => void {
    this.cleanupHandlers.add(handler)

    return () => {
      this.cleanupHandlers.delete(handler)
    }
  }

  /**
   * 执行所有资源清理
   */
  async cleanup(): Promise<void> {
    this.logger.info('开始清理资源...')

    let cleaned = 0
    let failed = 0

    for (const handler of this.cleanupHandlers) {
      try {
        await handler()
        cleaned++
      } catch (error) {
        failed++
        this.logger.debug('清理处理器执行失败', error)
      }
    }

    // 清空清理函数集合
    this.cleanupHandlers.clear()

    // 强制垃圾回收（如果可用）
    if (global.gc) {
      global.gc()
      this.logger.debug('已触发垃圾回收')
    }

    this.logger.success(`资源清理完成: 成功 ${cleaned}, 失败 ${failed}`)
  }

  /**
   * 使用 WeakMap 缓存大对象
   * @param obj 对象引用
   * @param key 缓存键
   * @param value 缓存值
   */
  cacheInWeakMap<K extends object, V>(obj: K, key: string, value: V): void {
    let cache = this.weakCache.get(obj)

    if (!cache) {
      cache = new Map<string, V>()
      this.weakCache.set(obj, cache)
    }

    cache.set(key, value)
  }

  /**
   * 从 WeakMap 获取缓存
   * @param obj 对象引用
   * @param key 缓存键
   */
  getFromWeakMap<K extends object, V>(obj: K, key: string): V | undefined {
    const cache = this.weakCache.get(obj)
    return cache?.get(key)
  }

  /**
   * 检查内存是否超过阈值
   */
  isMemoryExceeded(): boolean {
    const stats = this.getMemoryStats()
    return stats.heapUsed > this.memoryThreshold
  }

  /**
   * 开始内存监控
   * @param interval 监控间隔（毫秒），默认 30 秒
   */
  startMonitoring(interval: number = 30000): void {
    if (this.isMonitoring) {
      this.logger.warn('内存监控已在运行')
      return
    }

    this.isMonitoring = true
    this.logger.info('开始内存监控')

    this.monitorTimer = setInterval(() => {
      const stats = this.getMemoryStats()

      // 记录内存使用
      this.emit('memory-stats', stats)

      // 检查是否超过阈值
      if (stats.heapUsed > this.memoryThreshold) {
        this.logger.warn(
          `⚠️  内存使用过高: ${this.formatMemorySize(stats.heapUsed)} / ${this.formatMemorySize(this.memoryThreshold)}`
        )
        this.emit('memory-threshold-exceeded', stats)

        // 建议清理
        this.logger.info('建议执行资源清理或增加内存限制')
      }

      // Debug 模式下输出详细信息
      if (this.logger.getLevel() === 'debug') {
        this.logger.debug(`内存使用: ${this.formatMemorySize(stats.heapUsed)} (${stats.usagePercent.toFixed(1)}%)`)
      }
    }, interval)
  }

  /**
   * 停止内存监控
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return
    }

    if (this.monitorTimer) {
      clearInterval(this.monitorTimer)
      this.monitorTimer = undefined
    }

    this.isMonitoring = false
    this.logger.info('内存监控已停止')
  }

  /**
   * 获取内存优化建议
   */
  getOptimizationSuggestions(): Array<{
    type: string
    priority: 'high' | 'medium' | 'low'
    suggestion: string
    action: string
  }> {
    const suggestions: Array<{
      type: string
      priority: 'high' | 'medium' | 'low'
      suggestion: string
      action: string
    }> = []

    const stats = this.getMemoryStats()

    // 内存使用过高
    if (stats.usagePercent > 90) {
      suggestions.push({
        type: 'memory-usage',
        priority: 'high',
        suggestion: '内存使用率过高',
        action: '执行资源清理或增加 --max-old-space-size'
      })
    }

    // 外部内存过大
    if (stats.external > 100 * 1024 * 1024) { // >100MB
      suggestions.push({
        type: 'external-memory',
        priority: 'medium',
        suggestion: '外部内存占用较大',
        action: '检查 Buffer 和二进制数据使用'
      })
    }

    // 数组缓冲区过大
    if (stats.arrayBuffers > 50 * 1024 * 1024) { // >50MB
      suggestions.push({
        type: 'array-buffers',
        priority: 'medium',
        suggestion: 'ArrayBuffer 占用较大',
        action: '及时释放不用的二进制数据'
      })
    }

    return suggestions
  }

  /**
   * 内存泄漏检测
   * 对比两次内存快照，识别可能的内存泄漏
   */
  async detectMemoryLeak(
    duration: number = 30000
  ): Promise<{
    leaked: boolean
    growth: number
    suggestions: string[]
  }> {
    this.logger.info('开始内存泄漏检测...')

    // 第一次快照
    const snapshot1 = this.getMemoryStats()

    // 等待一段时间
    await new Promise(resolve => setTimeout(resolve, duration))

    // 第二次快照
    const snapshot2 = this.getMemoryStats()

    // 计算增长
    const growth = snapshot2.heapUsed - snapshot1.heapUsed
    const growthPercent = (growth / snapshot1.heapUsed) * 100

    const suggestions: string[] = []
    let leaked = false

    // 判断是否存在泄漏（增长超过 20%）
    if (growthPercent > 20) {
      leaked = true
      suggestions.push('内存增长异常，可能存在内存泄漏')
      suggestions.push('检查事件监听器是否正确移除')
      suggestions.push('检查定时器是否正确清理')
      suggestions.push('检查大对象是否及时释放')
    }

    this.logger.info(
      `内存泄漏检测完成: ${leaked ? '⚠️  检测到泄漏' : '✅ 正常'} (增长 ${growthPercent.toFixed(2)}%)`
    )

    return {
      leaked,
      growth,
      suggestions
    }
  }

  /**
   * 强制垃圾回收
   * 需要使用 --expose-gc 标志启动 Node.js
   */
  forceGC(): boolean {
    if (global.gc) {
      global.gc()
      this.logger.debug('已执行强制垃圾回收')
      return true
    }

    this.logger.warn('垃圾回收不可用，需要使用 --expose-gc 标志启动')
    return false
  }

  /**
   * 生成内存报告
   */
  generateReport(): {
    stats: MemoryStats
    suggestions: Array<{
      type: string
      priority: 'high' | 'medium' | 'low'
      suggestion: string
      action: string
    }>
    cleanupHandlers: number
  } {
    return {
      stats: this.getMemoryStats(),
      suggestions: this.getOptimizationSuggestions(),
      cleanupHandlers: this.cleanupHandlers.size
    }
  }
}

/**
 * 创建内存优化器实例
 * @param threshold 内存阈值（MB）
 */
export function createMemoryOptimizer(threshold?: number): MemoryOptimizer {
  return new MemoryOptimizer(threshold)
}

/**
 * 全局内存优化器实例
 */
export const memoryOptimizer = new MemoryOptimizer()

