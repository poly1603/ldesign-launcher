/**
 * 格式化工具函数
 *
 * 提供各种数据格式化功能
 *
 * @author LDesign Team
 * @since 1.0.0
 */

/** JSON 值类型（用于格式化输出） */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

/** 表格行类型 */
export type TableRow = Record<string, unknown>

/** 命令行参数值类型 */
export type CliArgValue = string | number | boolean | null | undefined

/**
 * 格式化文件大小
 *
 * @param bytes - 字节数
 * @param decimals - 小数位数
 * @returns 格式化后的大小
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0)
    return '0 B'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}

/**
 * 格式化时间持续
 *
 * @param ms - 毫秒数
 * @returns 格式化后的时间
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  }
  else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  else {
    return `${seconds}s`
  }
}

/**
 * 格式化相对时间
 *
 * @param timestamp - 时间戳
 * @returns 相对时间字符串
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 1000) {
    return '刚刚'
  }

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}天前`
  }
  else if (hours > 0) {
    return `${hours}小时前`
  }
  else if (minutes > 0) {
    return `${minutes}分钟前`
  }
  else {
    return `${seconds}秒前`
  }
}

/**
 * 格式化百分比
 *
 * @param value - 数值（0-1）
 * @param decimals - 小数位数
 * @returns 百分比字符串
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * 格式化数字
 *
 * @param num - 数字
 * @param options - 格式化选项
 * @param options.decimals - 小数位数（默认 0）
 * @param options.separator - 千分位分隔符（默认 ','）
 * @param options.prefix - 前缀字符串（例如货币符号）
 * @param options.suffix - 后缀字符串（例如单位）
 * @returns 格式化后的数字
 */
export function formatNumber(num: number, options: {
  decimals?: number
  separator?: string
  prefix?: string
  suffix?: string
} = {}): string {
  const {
    decimals = 0,
    separator = ',',
    prefix = '',
    suffix = '',
  } = options

  const formatted = num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, separator)
  return prefix + formatted + suffix
}

/**
 * 格式化 URL
 *
 * @param url - URL 字符串
 * @param options - 格式化选项
 * @param options.removeProtocol - 是否移除协议部分（http/https）
 * @param options.removeWww - 是否移除开头的 www.
 * @param options.removeTrailingSlash - 是否移除末尾斜线
 * @returns 格式化后的 URL
 */
export function formatUrl(url: string, options: {
  removeProtocol?: boolean
  removeWww?: boolean
  removeTrailingSlash?: boolean
} = {}): string {
  let formatted = url

  if (options.removeProtocol) {
    formatted = formatted.replace(/^https?:\/\//, '')
  }

  if (options.removeWww) {
    formatted = formatted.replace(/^www\./, '')
  }

  if (options.removeTrailingSlash) {
    formatted = formatted.replace(/\/$/, '')
  }

  return formatted
}

/**
 * 格式化路径
 *
 * @param path - 文件路径
 * @param maxLength - 最大长度
 * @returns 格式化后的路径
 */
export function formatPath(path: string, maxLength: number = 50): string {
  if (path.length <= maxLength) {
    return path
  }

  const parts = path.split(/[/\\]/)

  if (parts.length <= 2) {
    return `...${path.slice(-(maxLength - 3))}`
  }

  let result = parts[0]
  const remaining = parts.slice(1)

  while (remaining.length > 0) {
    const next = remaining.shift()!
    const candidate = `${result}/${next}`

    if (candidate.length > maxLength - 3) {
      return `${result}/.../${remaining[remaining.length - 1]}`
    }

    result = candidate
  }

  return result
}

/**
 * 格式化 JSON
 *
 * @param obj - 对象
 * @param options - 格式化选项
 * @param options.indent - 缩进空格数（默认 2）
 * @param options.sortKeys - 是否按 key 排序输出
 * @param options.removeQuotes - 是否移除属性名上的引号（仅对合法标识符生效）
 * @returns 格式化后的 JSON 字符串
 */
export function formatJson(obj: JsonValue, options: {
  indent?: number
  sortKeys?: boolean
  removeQuotes?: boolean
} = {}): string {
  const {
    indent = 2,
    sortKeys = false,
    removeQuotes = false,
  } = options

  // 仅在对象类型（非数组）时启用 key 排序
  const shouldSortKeys = sortKeys
    && obj !== null
    && typeof obj === 'object'
    && !Array.isArray(obj)

  const replacer = shouldSortKeys
    ? Object.keys(obj as Record<string, unknown>).sort()
    : null

  let json = JSON.stringify(obj, replacer, indent)

  if (removeQuotes) {
    // 移除属性名的引号（仅适用于有效的标识符）
    json = json.replace(/"([a-z_$][\w$]*)":/gi, '$1:')
  }

  return json
}

/**
 * 格式化表格
 *
 * @param data - 表格数据
 * @param options - 格式化选项
 * @param options.headers - 列头名称数组，默认使用首行对象的 key
 * @param options.align - 对齐方式（left/center/right），默认 left
 * @param options.border - 是否绘制边框，默认 true
 * @returns 格式化后的表格字符串
 */
export function formatTable<T extends TableRow>(data: T[], options: {
  headers?: string[]
  align?: 'left' | 'center' | 'right'
  border?: boolean
} = {}): string {
  if (data.length === 0) {
    return ''
  }

  const firstRow = data[0] as TableRow

  const {
    headers = Object.keys(firstRow),
    align = 'left',
    border = true,
  } = options

  // 计算列宽
  const columnWidths = headers.map((header) => {
    const headerWidth = header.length
    const dataWidth = Math.max(
      ...data.map((row) => {
        const value = (row as TableRow)[header]
        return String(value ?? '').length
      }),
    )
    return Math.max(headerWidth, dataWidth)
  })

  // 格式化行
  const formatRow = (row: string[], widths: number[]) => {
    const cells = row.map((cell, i) => {
      const width = widths[i]
      switch (align) {
        case 'center':
          return cell.padStart((width + cell.length) / 2).padEnd(width)
        case 'right':
          return cell.padStart(width)
        default:
          return cell.padEnd(width)
      }
    })

    return border ? `| ${cells.join(' | ')} |` : cells.join('  ')
  }

  // 生成表格
  const lines: string[] = []

  // 表头
  lines.push(formatRow(headers, columnWidths))

  // 分隔线
  if (border) {
    const separator = columnWidths.map(width => '-'.repeat(width)).join('-+-')
    lines.push(`|-${separator}-|`)
  }

  // 数据行
  data.forEach((row) => {
    const cells = headers.map((header) => {
      const value = (row as TableRow)[header]
      return String(value ?? '')
    })
    lines.push(formatRow(cells, columnWidths))
  })

  return lines.join('\n')
}

/**
 * 格式化代码
 *
 * @param code - 代码字符串
 * @param _language - 语言类型
 * @returns 格式化后的代码
 */
export function formatCode(code: string, _language: string = 'javascript'): string {
  // 简单的代码格式化（实际项目中可以使用 prettier 等工具）
  let formatted = code

  // 移除多余的空行
  formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n')

  // 统一缩进
  const lines = formatted.split('\n')
  let indent = 0
  const indentSize = 2

  const formattedLines = lines.map((line) => {
    const trimmed = line.trim()

    if (trimmed === '') {
      return ''
    }

    // 减少缩进
    if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
      indent = Math.max(0, indent - indentSize)
    }

    const result = ' '.repeat(indent) + trimmed

    // 增加缩进
    if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
      indent += indentSize
    }

    return result
  })

  return formattedLines.join('\n')
}

/**
 * 格式化错误信息
 *
 * @param error - 错误对象
 * @param options - 格式化选项
 * @param options.includeStack - 是否包含堆栈信息
 * @param options.maxStackLines - 堆栈最大行数（默认 10）
 * @param options.includeTimestamp - 是否包含时间戳前缀
 * @returns 格式化后的错误信息
 */
export function formatError(error: Error, options: {
  includeStack?: boolean
  maxStackLines?: number
  includeTimestamp?: boolean
} = {}): string {
  const {
    includeStack = false,
    maxStackLines = 10,
    includeTimestamp = false,
  } = options

  let formatted = error.message

  if (includeTimestamp) {
    const timestamp = new Date().toISOString()
    formatted = `[${timestamp}] ${formatted}`
  }

  if (includeStack && error.stack) {
    const stackLines = error.stack.split('\n').slice(1, maxStackLines + 1)
    formatted += `\n${stackLines.join('\n')}`
  }

  return formatted
}

/**
 * 格式化命令行参数
 *
 * @param args - 参数对象
 * @returns 格式化后的参数字符串
 */
export function formatCliArgs(args: Record<string, CliArgValue>): string {
  const parts: string[] = []

  for (const [key, value] of Object.entries(args)) {
    if (value === true) {
      parts.push(`--${key}`)
    }
    else if (value !== false && value !== undefined && value !== null) {
      parts.push(`--${key} ${String(value)}`)
    }
  }

  return parts.join(' ')
}
