/**
 * ASCII 图表生成器
 *
 * 用于在终端中显示柱状图、饼图等可视化图表
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import picocolors from 'picocolors'

export interface ChartData {
  label: string
  value: number
  color?: 'cyan' | 'green' | 'yellow' | 'red' | 'magenta' | 'blue'
}

export interface BarChartOptions {
  /** 数据 */
  data: ChartData[]
  /** 最大宽度 */
  maxWidth?: number
  /** 是否显示数值 */
  showValue?: boolean
  /** 是否显示百分比 */
  showPercentage?: boolean
  /** 标签宽度 */
  labelWidth?: number
}

export class Chart {
  /**
   * 渲染柱状图
   */
  static renderBarChart(options: BarChartOptions): string {
    const { data, maxWidth = 40, showValue = true, showPercentage = true, labelWidth = 15 } = options

    if (!data || data.length === 0) {
      return '无数据'
    }

    const maxValue = Math.max(...data.map(d => d.value))
    const total = data.reduce((sum, d) => sum + d.value, 0)
    const lines: string[] = []

    data.forEach((item) => {
      // 计算条形长度
      const barLength = Math.round((item.value / maxValue) * maxWidth)
      const emptyLength = maxWidth - barLength

      // 生成条形
      const bar = '█'.repeat(barLength) + '░'.repeat(emptyLength)
      const coloredBar = this.applyColor(bar, item.color || 'cyan')

      // 格式化标签
      const label = item.label.padEnd(labelWidth, ' ')

      // 构建行
      let line = `${label} ${coloredBar}`

      // 添加数值
      if (showValue) {
        line += ` ${this.formatValue(item.value)}`
      }

      // 添加百分比
      if (showPercentage && total > 0) {
        const percentage = ((item.value / total) * 100).toFixed(1)
        line += ` (${percentage}%)`
      }

      lines.push(line)
    })

    return lines.join('\n')
  }

  /**
   * 渲染饼图（简化版，使用字符显示）
   */
  static renderPieChart(data: ChartData[]): string {
    if (!data || data.length === 0) {
      return '无数据'
    }

    const total = data.reduce((sum, d) => sum + d.value, 0)
    const lines: string[] = []

    data.forEach((item) => {
      const percentage = ((item.value / total) * 100).toFixed(1)
      const segments = Math.round((item.value / total) * 20)
      const indicator = '●'.repeat(segments)
      const coloredIndicator = this.applyColor(indicator, item.color || 'cyan')

      lines.push(`${item.label.padEnd(15, ' ')} ${coloredIndicator} ${percentage}%`)
    })

    return lines.join('\n')
  }

  /**
   * 渲染水平进度条
   */
  static renderProgressBar(current: number, total: number, width: number = 30): string {
    const percentage = (current / total) * 100
    const filled = Math.round((current / total) * width)
    const empty = width - filled

    const bar = '█'.repeat(filled) + '░'.repeat(empty)
    return `${bar} ${percentage.toFixed(1)}%`
  }

  /**
   * 渲染数据表格（简化版）
   */
  static renderTable(data: Array<Record<string, any>>, columns?: string[]): string {
    if (!data || data.length === 0) {
      return '无数据'
    }

    const cols = columns || Object.keys(data[0])
    const lines: string[] = []

    // 表头
    const header = cols.map(col => String(col).padEnd(15, ' ')).join(' ')
    lines.push(header)
    lines.push('─'.repeat(header.length))

    // 数据行
    data.forEach((row) => {
      const line = cols.map(col => String(row[col] || '').padEnd(15, ' ')).join(' ')
      lines.push(line)
    })

    return lines.join('\n')
  }

  /**
   * 渲染趋势线（简化版）
   */
  static renderTrendLine(values: number[], width: number = 50): string {
    if (!values || values.length === 0) {
      return '无数据'
    }

    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min

    if (range === 0) {
      return '─'.repeat(width)
    }

    const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
    const trend = values.map((value) => {
      const normalized = (value - min) / range
      const index = Math.min(Math.floor(normalized * chars.length), chars.length - 1)
      return chars[index]
    }).join('')

    return picocolors.cyan(trend)
  }

  /**
   * 应用颜色
   */
  private static applyColor(text: string, color: string): string {
    switch (color) {
      case 'cyan':
        return picocolors.cyan(text)
      case 'green':
        return picocolors.green(text)
      case 'yellow':
        return picocolors.yellow(text)
      case 'red':
        return picocolors.red(text)
      case 'magenta':
        return picocolors.magenta(text)
      case 'blue':
        return picocolors.blue(text)
      default:
        return text
    }
  }

  /**
   * 格式化数值
   */
  private static formatValue(value: number): string {
    if (value >= 1024 * 1024) {
      return `${(value / (1024 * 1024)).toFixed(2)} MB`
    }
    if (value >= 1024) {
      return `${(value / 1024).toFixed(2)} KB`
    }
    return `${value} B`
  }
}

/**
 * 快捷方法：创建柱状图
 */
export function barChart(data: ChartData[], options?: Omit<BarChartOptions, 'data'>): string {
  return Chart.renderBarChart({ data, ...options })
}

/**
 * 快捷方法：创建饼图
 */
export function pieChart(data: ChartData[]): string {
  return Chart.renderPieChart(data)
}

/**
 * 快捷方法：创建进度条
 */
export function progressBar(current: number, total: number, width?: number): string {
  return Chart.renderProgressBar(current, total, width)
}
