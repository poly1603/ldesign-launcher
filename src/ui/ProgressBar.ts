/**
 * 进度条组件
 *
 * 基于 cli-progress 实现的通用进度条功能
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import { Presets, SingleBar } from 'cli-progress'
import picocolors from 'picocolors'

export interface ProgressBarOptions {
  /** 总数 */
  total: number
  /** 显示消息 */
  message?: string
  /** 进度条格式 */
  format?: string
  /** 是否显示百分比 */
  showPercentage?: boolean
  /** 是否显示 ETA */
  showETA?: boolean
  /** 自定义颜色 */
  barColor?: 'cyan' | 'green' | 'yellow' | 'red' | 'magenta'
}

export class ProgressBar {
  private bar: SingleBar
  private total: number
  private current: number = 0

  constructor(options: ProgressBarOptions) {
    this.total = options.total

    // 构建格式字符串
    let format = options.format
    if (!format) {
      const message = options.message || '进度'
      const barColorFn = this.getColorFunction(options.barColor || 'cyan')

      format = `${message} ${barColorFn('{bar}')} {percentage}%`

      if (options.showETA !== false) {
        format += ' | ETA: {eta_formatted}'
      }

      format += ' | {value}/{total}'
    }

    // 创建进度条
    this.bar = new SingleBar({
      format,
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
      clearOnComplete: false,
      stopOnComplete: true,
    }, Presets.shades_classic)

    this.bar.start(this.total, 0)
  }

  /**
   * 更新进度
   */
  update(current: number, payload?: Record<string, any>): void {
    this.current = current
    this.bar.update(current, payload)
  }

  /**
   * 增加进度
   */
  increment(delta: number = 1, payload?: Record<string, any>): void {
    this.current += delta
    this.bar.increment(delta, payload)
  }

  /**
   * 设置总数
   */
  setTotal(total: number): void {
    this.total = total
    this.bar.setTotal(total)
  }

  /**
   * 停止进度条
   */
  stop(): void {
    this.bar.stop()
  }

  /**
   * 完成进度条
   */
  complete(): void {
    this.bar.update(this.total)
    this.bar.stop()
  }

  /**
   * 获取颜色函数
   */
  private getColorFunction(color: string): (text: string) => string {
    switch (color) {
      case 'cyan':
        return picocolors.cyan
      case 'green':
        return picocolors.green
      case 'yellow':
        return picocolors.yellow
      case 'red':
        return picocolors.red
      case 'magenta':
        return picocolors.magenta
      default:
        return picocolors.cyan
    }
  }

  /**
   * 获取当前进度
   */
  getCurrent(): number {
    return this.current
  }

  /**
   * 获取总数
   */
  getTotal(): number {
    return this.total
  }

  /**
   * 获取百分比
   */
  getPercentage(): number {
    return Math.round((this.current / this.total) * 100)
  }
}

/**
 * 创建进度条
 */
export function createProgressBar(options: ProgressBarOptions): ProgressBar {
  return new ProgressBar(options)
}
