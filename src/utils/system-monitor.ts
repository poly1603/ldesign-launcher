/**
 * 系统资源监控
 *
 * 监控 CPU、内存、进程等系统资源
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import { EventEmitter } from 'node:events'
import os from 'node:os'

/**
 * 系统信息
 */
export interface SystemInfo {
  platform: string
  arch: string
  hostname: string
  nodeVersion: string
  cpuModel: string
  cpuCores: number
  totalMemory: number
  uptime: number
}

/**
 * 资源使用情况
 */
export interface ResourceUsage {
  cpu: {
    usage: number // 0-100
    loadAvg: number[] // 1, 5, 15 分钟负载
  }
  memory: {
    total: number
    used: number
    free: number
    usagePercent: number
  }
  process: {
    pid: number
    memory: number // RSS in bytes
    memoryPercent: number
    uptime: number // seconds
    cpuUsage: NodeJS.CpuUsage
  }
  timestamp: number
}

/**
 * 监控配置
 */
export interface MonitorConfig {
  interval?: number // 采样间隔 (ms)
  history?: number // 历史记录数量
}

/**
 * 系统资源监控器
 */
export class SystemMonitor extends EventEmitter {
  private config: Required<MonitorConfig>
  private timer: NodeJS.Timeout | null = null
  private history: ResourceUsage[] = []
  private lastCpuInfo: { idle: number, total: number } | null = null
  private lastCpuUsage: NodeJS.CpuUsage | null = null

  constructor(config: MonitorConfig = {}) {
    super()
    this.config = {
      interval: config.interval || 2000,
      history: config.history || 60,
    }
  }

  /**
   * 获取系统信息
   */
  getSystemInfo(): SystemInfo {
    const cpus = os.cpus()
    return {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      nodeVersion: process.version,
      cpuModel: cpus[0]?.model || 'Unknown',
      cpuCores: cpus.length,
      totalMemory: os.totalmem(),
      uptime: os.uptime(),
    }
  }

  /**
   * 获取当前资源使用情况
   */
  getResourceUsage(): ResourceUsage {
    const memInfo = this.getMemoryInfo()
    const cpuInfo = this.getCpuUsage()
    const processInfo = this.getProcessInfo()

    return {
      cpu: cpuInfo,
      memory: memInfo,
      process: processInfo,
      timestamp: Date.now(),
    }
  }

  /**
   * 获取内存信息
   */
  private getMemoryInfo(): ResourceUsage['memory'] {
    const total = os.totalmem()
    const free = os.freemem()
    const used = total - free

    return {
      total,
      used,
      free,
      usagePercent: (used / total) * 100,
    }
  }

  /**
   * 获取 CPU 使用率
   */
  private getCpuUsage(): ResourceUsage['cpu'] {
    const cpus = os.cpus()
    let idle = 0
    let total = 0

    for (const cpu of cpus) {
      for (const type of Object.keys(cpu.times) as (keyof typeof cpu.times)[]) {
        total += cpu.times[type]
      }
      idle += cpu.times.idle
    }

    let usage = 0
    if (this.lastCpuInfo) {
      const idleDiff = idle - this.lastCpuInfo.idle
      const totalDiff = total - this.lastCpuInfo.total
      usage = totalDiff > 0 ? (1 - idleDiff / totalDiff) * 100 : 0
    }

    this.lastCpuInfo = { idle, total }

    return {
      usage: Math.round(usage * 10) / 10,
      loadAvg: os.loadavg(),
    }
  }

  /**
   * 获取进程信息
   */
  private getProcessInfo(): ResourceUsage['process'] {
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage(this.lastCpuUsage || undefined)
    this.lastCpuUsage = process.cpuUsage()

    return {
      pid: process.pid,
      memory: memUsage.rss,
      memoryPercent: (memUsage.rss / os.totalmem()) * 100,
      uptime: process.uptime(),
      cpuUsage,
    }
  }

  /**
   * 开始监控
   */
  start(): void {
    if (this.timer)
      return

    // 初始采样
    this.sample()

    this.timer = setInterval(() => {
      this.sample()
    }, this.config.interval)
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  /**
   * 采样
   */
  private sample(): void {
    const usage = this.getResourceUsage()

    // 保存历史
    this.history.push(usage)
    if (this.history.length > this.config.history) {
      this.history.shift()
    }

    // 发送事件
    this.emit('sample', usage)

    // 检查警告
    if (usage.memory.usagePercent > 90) {
      this.emit('warning', { type: 'memory', message: '内存使用率超过 90%', usage })
    }
    if (usage.cpu.usage > 90) {
      this.emit('warning', { type: 'cpu', message: 'CPU 使用率超过 90%', usage })
    }
  }

  /**
   * 获取历史记录
   */
  getHistory(): ResourceUsage[] {
    return [...this.history]
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    avgCpuUsage: number
    avgMemoryUsage: number
    maxCpuUsage: number
    maxMemoryUsage: number
    minCpuUsage: number
    minMemoryUsage: number
  } {
    if (this.history.length === 0) {
      return {
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
        maxCpuUsage: 0,
        maxMemoryUsage: 0,
        minCpuUsage: 0,
        minMemoryUsage: 0,
      }
    }

    const cpuUsages = this.history.map(h => h.cpu.usage)
    const memUsages = this.history.map(h => h.memory.usagePercent)

    return {
      avgCpuUsage: cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length,
      avgMemoryUsage: memUsages.reduce((a, b) => a + b, 0) / memUsages.length,
      maxCpuUsage: Math.max(...cpuUsages),
      maxMemoryUsage: Math.max(...memUsages),
      minCpuUsage: Math.min(...cpuUsages),
      minMemoryUsage: Math.min(...memUsages),
    }
  }

  /**
   * 格式化字节
   */
  static formatBytes(bytes: number): string {
    if (bytes < 1024)
      return `${bytes} B`
    if (bytes < 1024 * 1024)
      return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  /**
   * 格式化时长
   */
  static formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    const parts: string[] = []
    if (days > 0)
      parts.push(`${days}天`)
    if (hours > 0)
      parts.push(`${hours}小时`)
    if (minutes > 0)
      parts.push(`${minutes}分`)
    if (secs > 0 || parts.length === 0)
      parts.push(`${secs}秒`)

    return parts.join(' ')
  }
}

// 单例
let monitorInstance: SystemMonitor | null = null

export function getSystemMonitor(config?: MonitorConfig): SystemMonitor {
  if (!monitorInstance) {
    monitorInstance = new SystemMonitor(config)
  }
  return monitorInstance
}

/**
 * 快速获取系统状态
 */
export function getSystemStatus(): {
  system: SystemInfo
  resources: ResourceUsage
} {
  const monitor = new SystemMonitor()
  return {
    system: monitor.getSystemInfo(),
    resources: monitor.getResourceUsage(),
  }
}
