/**
 * UI 组件工具
 * 
 * 提供终端 UI 组件，包括横幅、二维码、进度条等
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

import pc from 'picocolors'

/**
 * 去除 ANSI 颜色代码
 * 
 * @param str - 输入字符串
 * @returns 去除颜色后的字符串
 */
export function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  const ansiRegex = /[\u001B\u009B][[\]()#;?]*(?:((?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g
  return str.replace(ansiRegex, '')
}

/**
 * 格式化文件大小
 * 
 * @param bytes - 字节数
 * @returns 格式化后的大小字符串
 * @example
 * ```ts
 * formatFileSize(1024) // '1.00 KB'
 * formatFileSize(1048576) // '1.00 MB'
 * ```
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}

/**
 * 服务器信息项
 */
export interface ServerInfoItem {
  /** 标签 */
  label: string
  /** 值 */
  value: string
}

/**
 * 渲染服务器信息横幅
 * 
 * @param title - 标题
 * @param items - 信息项列表
 * @returns 横幅文本行数组
 */
export function renderServerBanner(
  title: string,
  items: ServerInfoItem[]
): string[] {
  const leftPad = '  '
  const labelPad = 4

  const rows = [
    `${pc.green('✔')} ${pc.bold(title)}`,
    ...items.map(({ label, value }) => {
      const l = (label + ':').padEnd(labelPad, ' ')
      return `${pc.dim('•')} ${pc.bold(l)} ${pc.cyan(value)}`
    }),
    `${pc.dim('•')} 提示: 按 ${pc.yellow('Ctrl+C')} 停止服务器`
  ]

  // 根据内容计算盒宽度
  const contentWidth = rows.reduce((m, s) => Math.max(m, stripAnsi(s).length), 0)
  const width = Math.min(Math.max(contentWidth + 4, 38), 80)
  const top = pc.dim('┌' + '─'.repeat(width - 2) + '┐')
  const bottom = pc.dim('└' + '─'.repeat(width - 2) + '┘')

  const padded = rows.map(r => {
    const visible = stripAnsi(r)
    const space = width - 2 - visible.length
    return pc.dim('│') + leftPad + r + ' '.repeat(Math.max(0, space - leftPad.length)) + pc.dim('│')
  })

  return [top, ...padded, bottom]
}

/**
 * 二维码渲染选项
 */
export interface QRCodeOptions {
  /** 是否使用小尺寸 */
  small?: boolean
  /** 是否显示边框 */
  border?: boolean
}

/**
 * 渲染二维码
 * 
 * @param url - 要生成二维码的 URL
 * @param options - 二维码选项
 * @returns 二维码文本，如果失败则返回 null
 */
export async function renderQRCode(
  url: string,
  options: QRCodeOptions = {}
): Promise<string | null> {
  const { small = true, border = true } = options

  if (!url) {
    return null
  }

  // 优先尝试使用 'qrcode' 的终端输出
  try {
    const qrlib: any = await import('qrcode')
    const qrcode = qrlib?.default || qrlib

    // 使用toString方法生成终端二维码
    const terminalQR = await qrcode.toString(url, {
      type: 'terminal',
      small
    })

    if (terminalQR && typeof terminalQR === 'string') {
      return terminalQR
    }
  } catch (e) {
    // 如果 qrcode 失败，尝试 qrcode-terminal
  }

  // 回退到 qrcode-terminal（如已安装）
  try {
    const mod: any = await import('qrcode-terminal')
    const qrt = mod?.default || mod
    let qrOutput = ''

    qrt.generate(url, { small }, (q: string) => {
      qrOutput = q
    })

    if (qrOutput) {
      // 处理 qrcode-terminal 的输出
      const lines = qrOutput.split('\n').filter(line => line.trim())

      if (lines.length > 0 && border) {
        // 确保所有行长度一致
        const maxWidth = Math.max(...lines.map(line => line.length))
        const normalizedLines = lines.map(line => {
          const padding = ' '.repeat(Math.max(0, maxWidth - line.length))
          return line + padding
        })

        // 创建简洁的边框效果
        const borderWidth = maxWidth + 4
        const topBorder = '┌' + '─'.repeat(borderWidth - 2) + '┐'
        const bottomBorder = '└' + '─'.repeat(borderWidth - 2) + '┘'
        const emptyLine = '│' + ' '.repeat(borderWidth - 2) + '│'

        return [
          '',
          topBorder,
          emptyLine,
          ...normalizedLines.map(line => '│ ' + line + ' │'),
          emptyLine,
          bottomBorder,
          ''
        ].join('\n')
      }

      return qrOutput
    }
  } catch (e) {
    // 两个库都失败了
  }

  return null
}

/**
 * 渲染进度条
 * 
 * @param current - 当前进度
 * @param total - 总进度
 * @param width - 进度条宽度
 * @returns 进度条文本
 */
export function renderProgressBar(
  current: number,
  total: number,
  width: number = 30
): string {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100))
  const filled = Math.floor((width * percentage) / 100)
  const empty = width - filled

  const bar = pc.green('█'.repeat(filled)) + pc.dim('░'.repeat(empty))
  const percentText = `${percentage.toFixed(1)}%`

  return `${bar} ${pc.cyan(percentText)}`
}

/**
 * 表格列定义
 */
export interface TableColumn {
  /** 列标题 */
  header: string
  /** 列键 */
  key: string
  /** 列宽度 */
  width?: number
  /** 对齐方式 */
  align?: 'left' | 'right' | 'center'
}

/**
 * 渲染表格
 * 
 * @param columns - 列定义
 * @param rows - 行数据
 * @returns 表格文本行数组
 */
export function renderTable(
  columns: TableColumn[],
  rows: Record<string, any>[]
): string[] {
  if (rows.length === 0) {
    return []
  }

  // 计算每列的实际宽度
  const colWidths = columns.map(col => {
    const headerWidth = col.header.length
    const maxDataWidth = Math.max(
      ...rows.map(row => String(row[col.key] || '').length)
    )
    return col.width || Math.max(headerWidth, maxDataWidth)
  })

  // 格式化单元格
  const formatCell = (value: string, width: number, align: 'left' | 'right' | 'center' = 'left') => {
    const str = String(value || '')
    if (align === 'right') {
      return str.padStart(width, ' ')
    } else if (align === 'center') {
      const totalPad = width - str.length
      const leftPad = Math.floor(totalPad / 2)
      const rightPad = totalPad - leftPad
      return ' '.repeat(leftPad) + str + ' '.repeat(rightPad)
    }
    return str.padEnd(width, ' ')
  }

  // 渲染表头
  const header = columns.map((col, i) =>
    pc.bold(formatCell(col.header, colWidths[i], col.align))
  ).join(' │ ')

  // 分隔线
  const separator = colWidths.map(w => '─'.repeat(w)).join('─┼─')

  // 渲染数据行
  const dataRows = rows.map(row =>
    columns.map((col, i) =>
      formatCell(String(row[col.key] || ''), colWidths[i], col.align)
    ).join(' │ ')
  )

  return [
    pc.dim('┌─' + separator + '─┐'),
    pc.dim('│ ') + header + pc.dim(' │'),
    pc.dim('├─' + separator + '─┤'),
    ...dataRows.map(row => pc.dim('│ ') + row + pc.dim(' │')),
    pc.dim('└─' + separator + '─┘')
  ]
}

/**
 * 渲染分隔线
 * 
 * @param width - 宽度
 * @param char - 字符
 * @returns 分隔线文本
 */
export function renderDivider(width: number = 80, char: string = '─'): string {
  return pc.dim(char.repeat(width))
}

/**
 * 渲染标题
 * 
 * @param text - 标题文本
 * @returns 标题文本
 */
export function renderTitle(text: string): string {
  return pc.bold(pc.cyan(text))
}

/**
 * 渲染错误消息
 * 
 * @param message - 错误消息
 * @returns 错误文本
 */
export function renderError(message: string): string {
  return `${pc.red('✖')} ${pc.red(message)}`
}

/**
 * 渲染成功消息
 * 
 * @param message - 成功消息
 * @returns 成功文本
 */
export function renderSuccess(message: string): string {
  return `${pc.green('✔')} ${pc.green(message)}`
}

/**
 * 渲染警告消息
 * 
 * @param message - 警告消息
 * @returns 警告文本
 */
export function renderWarning(message: string): string {
  return `${pc.yellow('⚠')} ${pc.yellow(message)}`
}

/**
 * 渲染信息消息
 * 
 * @param message - 信息消息
 * @returns 信息文本
 */
export function renderInfo(message: string): string {
  return `${pc.blue('ℹ')} ${message}`
}


