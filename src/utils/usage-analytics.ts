/**
 * 使用分析工具
 * 
 * 收集和分析工具使用数据，帮助改进产品
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

import { EventEmitter } from 'events'
import { Logger } from './logger'
import { FileSystem } from './file-system'
import { PathUtils } from './path-utils'

/**
 * 使用事件接口
 */
export interface UsageEvent {
  /** 事件类型 */
  type: 'command' | 'api' | 'error' | 'performance'
  /** 事件名称 */
  name: string
  /** 时间戳 */
  timestamp: number
  /** 持续时间（毫秒） */
  duration?: number
  /** 是否成功 */
  success?: boolean
  /** 元数据 */
  metadata?: Record<string, any>
}

/**
 * 使用统计接口
 */
export interface UsageStats {
  /** 总事件数 */
  totalEvents: number
  /** 命令使用统计 */
  commands: Record<string, number>
  /** API 调用统计 */
  apiCalls: Record<string, number>
  /** 错误统计 */
  errors: Record<string, number>
  /** 平均执行时间 */
  averageDuration: Record<string, number>
  /** 成功率 */
  successRate: number
}

/**
 * 使用分析器类
 */
export class UsageAnalytics extends EventEmitter {
  private logger: Logger
  private events: UsageEvent[] = []
  private dataPath: string
  private enabled: boolean

  constructor(options: {
    enabled?: boolean
    dataPath?: string
    logger?: Logger
  } = {}) {
    super()
    this.logger = options.logger || new Logger('Analytics')
    this.enabled = options.enabled !== false
    this.dataPath = options.dataPath || PathUtils.join(process.cwd(), '.launcher/analytics.json')

    if (this.enabled) {
      this.loadHistory()
    }
  }

  /**
   * 记录事件
   */
  track(event: Omit<UsageEvent, 'timestamp'>): void {
    if (!this.enabled) return

    const fullEvent: UsageEvent = {
      ...event,
      timestamp: Date.now()
    }

    this.events.push(fullEvent)
    this.emit('event', fullEvent)

    // 定期保存到磁盘
    if (this.events.length % 10 === 0) {
      this.save()
    }
  }

  /**
   * 记录命令使用
   */
  trackCommand(name: string, duration?: number, success?: boolean): void {
    this.track({
      type: 'command',
      name,
      duration,
      success
    })
  }

  /**
   * 记录 API 调用
   */
  trackAPI(name: string, duration?: number): void {
    this.track({
      type: 'api',
      name,
      duration
    })
  }

  /**
   * 记录错误
   */
  trackError(name: string, metadata?: Record<string, any>): void {
    this.track({
      type: 'error',
      name,
      metadata,
      success: false
    })
  }

  /**
   * 获取统计数据
   */
  getStats(period?: number): UsageStats {
    const now = Date.now()
    const startTime = period ? now - period : 0

    const filteredEvents = this.events.filter(e => e.timestamp >= startTime)

    const commands: Record<string, number> = {}
    const apiCalls: Record<string, number> = {}
    const errors: Record<string, number> = {}
    const durations: Record<string, number[]> = {}

    let successCount = 0
    let totalWithSuccess = 0

    for (const event of filteredEvents) {
      // 统计命令
      if (event.type === 'command') {
        commands[event.name] = (commands[event.name] || 0) + 1
      }

      // 统计 API
      if (event.type === 'api') {
        apiCalls[event.name] = (apiCalls[event.name] || 0) + 1
      }

      // 统计错误
      if (event.type === 'error') {
        errors[event.name] = (errors[event.name] || 0) + 1
      }

      // 统计持续时间
      if (event.duration) {
        if (!durations[event.name]) {
          durations[event.name] = []
        }
        durations[event.name].push(event.duration)
      }

      // 统计成功率
      if (event.success !== undefined) {
        totalWithSuccess++
        if (event.success) {
          successCount++
        }
      }
    }

    // 计算平均持续时间
    const averageDuration: Record<string, number> = {}
    for (const [name, times] of Object.entries(durations)) {
      const sum = times.reduce((a, b) => a + b, 0)
      averageDuration[name] = sum / times.length
    }

    return {
      totalEvents: filteredEvents.length,
      commands,
      apiCalls,
      errors,
      averageDuration,
      successRate: totalWithSuccess > 0 ? successCount / totalWithSuccess : 1
    }
  }

  /**
   * 生成热力图数据
   */
  getHeatmapData(): Array<{
    hour: number
    day: number
    count: number
  }> {
    const heatmap: Array<{ hour: number; day: number; count: number }> = []
    const data = new Map<string, number>()

    for (const event of this.events) {
      const date = new Date(event.timestamp)
      const hour = date.getHours()
      const day = date.getDay()
      const key = `${day}-${hour}`

      data.set(key, (data.get(key) || 0) + 1)
    }

    for (const [key, count] of data) {
      const [day, hour] = key.split('-').map(Number)
      heatmap.push({ hour, day, count })
    }

    return heatmap
  }

  /**
   * 生成趋势数据
   */
  getTrendData(metric: string, period: number = 7 * 24 * 60 * 60 * 1000): Array<{
    date: string
    value: number
  }> {
    const now = Date.now()
    const startTime = now - period

    const dailyData = new Map<string, number[]>()

    for (const event of this.events) {
      if (event.timestamp < startTime) continue

      const date = new Date(event.timestamp).toISOString().split('T')[0]

      if (!dailyData.has(date)) {
        dailyData.set(date, [])
      }

      if (event.duration) {
        dailyData.get(date)!.push(event.duration)
      }
    }

    const trend: Array<{ date: string; value: number }> = []

    for (const [date, values] of dailyData) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      trend.push({ date, value: avg })
    }

    return trend.sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * 保存数据到磁盘
   */
  private async save(): Promise<void> {
    if (!this.enabled) return

    try {
      await FileSystem.ensureDir(PathUtils.dirname(this.dataPath))
      await FileSystem.writeFile(this.dataPath, JSON.stringify(this.events, null, 2))
    } catch (error) {
      this.logger.debug('保存分析数据失败', error)
    }
  }

  /**
   * 加载历史数据
   */
  private async loadHistory(): Promise<void> {
    try {
      if (await FileSystem.exists(this.dataPath)) {
        const content = await FileSystem.readFile(this.dataPath)
        const data = JSON.parse(content)

        if (Array.isArray(data)) {
          this.events = data
          this.logger.debug(`加载了 ${this.events.length} 条历史记录`)
        }
      }
    } catch (error) {
      this.logger.debug('加载历史数据失败', error)
    }
  }

  /**
   * 清理旧数据
   * @param maxAge 最大保留时间（毫秒）
   */
  cleanup(maxAge: number = 30 * 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAge
    const before = this.events.length

    this.events = this.events.filter(e => e.timestamp >= cutoff)

    const removed = before - this.events.length

    if (removed > 0) {
      this.save()
      this.logger.info(`清理了 ${removed} 条旧数据`)
    }

    return removed
  }
}

/**
 * 创建使用分析器实例
 */
export function createUsageAnalytics(options?: {
  enabled?: boolean
  dataPath?: string
  logger?: Logger
}): UsageAnalytics {
  return new UsageAnalytics(options)
}

/**
 * 全局使用分析器实例
 */
export const usageAnalytics = new UsageAnalytics()

