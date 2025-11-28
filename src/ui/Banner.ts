/**
 * Banner 横幅组件
 *
 * 用于在终端中显示精美的启动横幅和信息框
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import boxen from 'boxen'
import chalk from 'chalk'
import figures from 'figures'
import gradient from 'gradient-string'
import picocolors from 'picocolors'

export interface BannerOptions {
  /** 标题 */
  title: string
  /** 副标题 */
  subtitle?: string
  /** 版本号 */
  version?: string
  /** 其他信息行 */
  info?: Array<{ label: string, value: string }>
  /** 边框样式 */
  borderStyle?: 'single' | 'double' | 'round' | 'bold' | 'classic'
  /** 边框颜色 */
  borderColor?: 'cyan' | 'green' | 'yellow' | 'red' | 'magenta' | 'blue' | 'gray'
  /** 内边距 */
  padding?: number
  /** 是否使用渐变色 */
  useGradient?: boolean
}

export interface BoxOptions {
  /** 内容 */
  content: string
  /** 标题 */
  title?: string
  /** 边框样式 */
  borderStyle?: 'single' | 'double' | 'round' | 'bold' | 'classic'
  /** 边框颜色 */
  borderColor?: string
  /** 内边距 */
  padding?: number
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right'
}

export class Banner {
  /**
   * 渲染启动横幅
   */
  static renderStartupBanner(options: BannerOptions): string {
    const lines: string[] = []

    // 标题
    if (options.title) {
      const title = options.useGradient
        ? gradient.pastel(options.title)
        : picocolors.bold(picocolors.cyan(options.title))
      lines.push(title)
    }

    // 副标题
    if (options.subtitle) {
      lines.push(picocolors.gray(options.subtitle))
    }

    // 版本号
    if (options.version) {
      lines.push(picocolors.dim(`v${options.version}`))
    }

    // 空行
    if (options.info && options.info.length > 0) {
      lines.push('')
    }

    // 其他信息
    if (options.info) {
      options.info.forEach((item) => {
        const label = picocolors.gray(`${item.label}:`)
        const value = picocolors.cyan(item.value)
        lines.push(`${label} ${value}`)
      })
    }

    const content = lines.join('\n')

    return boxen(content, {
      padding: options.padding ?? 1,
      borderStyle: options.borderStyle || 'round',
      borderColor: options.borderColor || 'cyan',
      align: 'center',
    })
  }

  /**
   * 渲染信息框
   */
  static renderInfoBox(options: BoxOptions): string {
    return boxen(options.content, {
      title: options.title,
      padding: options.padding ?? 1,
      borderStyle: options.borderStyle || 'single',
      borderColor: options.borderColor || 'gray',
      align: options.align || 'left',
    })
  }

  /**
   * 渲染服务器信息框
   */
  static renderServerInfo(data: Array<{ label: string, value: string }>): string {
    const lines: string[] = []

    lines.push(picocolors.bold(picocolors.green('✔ 服务器已启动')))
    lines.push('')

    data.forEach((item) => {
      const bullet = picocolors.dim('•')
      const label = picocolors.bold(`${item.label}:`)
      const value = picocolors.cyan(item.value)
      lines.push(`${bullet} ${label} ${value}`)
    })

    return boxen(lines.join('\n'), {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'green',
      align: 'left',
    })
  }

  /**
   * 渲染成功消息框
   */
  static renderSuccess(message: string, details?: string[]): string {
    const lines: string[] = []
    lines.push(picocolors.bold(picocolors.green('✔ ' + message)))

    if (details && details.length > 0) {
      lines.push('')
      details.forEach((detail) => {
        lines.push(picocolors.gray(`  ${detail}`))
      })
    }

    return boxen(lines.join('\n'), {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'green',
    })
  }

  /**
   * 渲染错误消息框
   */
  static renderError(message: string, details?: string[]): string {
    const lines: string[] = []
    lines.push(picocolors.bold(picocolors.red('✖ ' + message)))

    if (details && details.length > 0) {
      lines.push('')
      details.forEach((detail) => {
        lines.push(picocolors.gray(`  ${detail}`))
      })
    }

    return boxen(lines.join('\n'), {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'red',
    })
  }

  /**
   * 渲染警告消息框
   */
  static renderWarning(message: string, details?: string[]): string {
    const lines: string[] = []
    lines.push(picocolors.bold(picocolors.yellow('⚠ ' + message)))

    if (details && details.length > 0) {
      lines.push('')
      details.forEach((detail) => {
        lines.push(picocolors.gray(`  ${detail}`))
      })
    }

    return boxen(lines.join('\n'), {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'yellow',
    })
  }

  /**
   * 渲染分隔线
   */
  static renderDivider(char: string = '─', length: number = 50, color?: string): string {
    const line = char.repeat(length)
    return color ? this.applyColor(line, color) : picocolors.gray(line)
  }

  /**
   * 渲染标题
   */
  static renderTitle(text: string, level: 1 | 2 | 3 = 1): string {
    switch (level) {
      case 1:
        return picocolors.bold(picocolors.cyan(text))
      case 2:
        return picocolors.bold(text)
      case 3:
        return picocolors.cyan(text)
      default:
        return text
    }
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
      case 'gray':
        return picocolors.gray(text)
      default:
        return text
    }
  }

  /**
   * 渲染 ASCII 艺术字标题
   */
  static renderAsciiTitle(title: string, useGradient: boolean = true): string {
    // 简化的ASCII艺术字生成（使用大号字母）
    const asciiArt = this.generateSimpleAscii(title)
    
    if (useGradient) {
      return gradient.pastel.multiline(asciiArt)
    }
    return picocolors.cyan(asciiArt)
  }

  /**
   * 生成简单的ASCII艺术字
   */
  private static generateSimpleAscii(text: string): string {
    // 为了简化，这里使用一个简单的大号字母实现
    // 实际项目中可以使用 figlet 等库生成更复杂的ASCII艺术字
    const lines = ['', '  ' + text.toUpperCase(), '']
    return lines.join('\n')
  }

  /**
   * 渲染启动信息（增强版）
   */
  static renderStartupInfo(options: {
    title: string
    version?: string
    framework?: string
    engine?: string
    nodeVersion?: string
    startTime?: number
    useGradient?: boolean
  }): string {
    const lines: string[] = []
    const { useGradient = true } = options

    // 标题 - 使用渐变或彩色
    const rocket = figures.play
    const titleLine = `${rocket} ${options.title}${options.version ? ` v${options.version}` : ''}`
    lines.push(useGradient ? gradient.pastel(titleLine) : chalk.bold.cyan(titleLine))
    
    // 子标题
    lines.push(chalk.gray('⚡ Lightning Fast Development Tool'))
    lines.push('')

    // 框架信息
    if (options.framework) {
      lines.push(`${chalk.gray('Framework:')} ${chalk.cyan(options.framework)}`)
    }

    // 引擎信息
    if (options.engine) {
      lines.push(`${chalk.gray('Engine:')} ${chalk.cyan(options.engine)}`)
    }

    // Node版本
    if (options.nodeVersion) {
      lines.push(`${chalk.gray('Node:')} ${chalk.cyan(options.nodeVersion)}`)
    }

    // 启动时间
    if (options.startTime !== undefined) {
      const time = options.startTime < 1000
        ? `${options.startTime}ms`
        : `${(options.startTime / 1000).toFixed(2)}s`
      lines.push('')
      lines.push(`${chalk.gray('Started in:')} ${chalk.green(time)} ${figures.tick}`)
    }

    return boxen(lines.join('\n'), {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: 'round',
      borderColor: 'cyan',
      align: 'left',
    })
  }

  /**
   * 渲染网络地址信息
   */
  static renderNetworkInfo(addresses: {
    local: string
    network?: string[]
  }): string {
    const lines: string[] = []

    lines.push(chalk.bold.green('\n✨ Development server started\n'))

    // 本地地址
    lines.push(`${chalk.gray('➜')} ${chalk.bold('Local:   ')} ${chalk.cyan(addresses.local)}`)

    // 网络地址
    if (addresses.network && addresses.network.length > 0) {
      addresses.network.forEach((addr, index) => {
        const label = index === 0 ? 'Network: ' : '         '
        lines.push(`${chalk.gray('➜')} ${chalk.bold(label)} ${chalk.cyan(addr)}`)
      })
    }

    return lines.join('\n')
  }

  /**
   * 渲染快捷键帮助
   */
  static renderShortcuts(shortcuts: Array<{ key: string, description: string }>): string {
    const lines: string[] = []
    
    lines.push(chalk.gray('\nShortcuts:'))
    shortcuts.forEach(({ key, description }) => {
      lines.push(chalk.gray(`  ${key} ${chalk.dim('-')} ${description}`))
    })

    return lines.join('\n')
  }

  /**
   * 渲染构建统计信息
   */
  static renderBuildStats(stats: {
    duration: number
    fileCount: number
    totalSize: number
    gzipSize?: number
  }): string {
    const lines: string[] = []

    lines.push(chalk.bold.cyan('\n📊 Build Statistics\n'))
    
    const duration = stats.duration < 1000
      ? `${stats.duration}ms`
      : `${(stats.duration / 1000).toFixed(2)}s`
    
    lines.push(`${chalk.gray('Duration:')} ${chalk.green(duration)}`)
    lines.push(`${chalk.gray('Files:')} ${chalk.cyan(stats.fileCount.toString())}`)
    lines.push(`${chalk.gray('Total Size:')} ${chalk.cyan(this.formatSize(stats.totalSize))}`)
    
    if (stats.gzipSize) {
      lines.push(`${chalk.gray('Gzipped:')} ${chalk.cyan(this.formatSize(stats.gzipSize))}`)
    }

    return boxen(lines.join('\n'), {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      align: 'left',
    })
  }

  /**
   * 格式化文件大小
   */
  private static formatSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }
}

/**
 * 快捷方法：创建启动横幅
 */
export function startupBanner(options: BannerOptions): string {
  return Banner.renderStartupBanner(options)
}

/**
 * 快捷方法：创建信息框
 */
export function infoBox(content: string, title?: string): string {
  return Banner.renderInfoBox({ content, title })
}

/**
 * 快捷方法：创建服务器信息框
 */
export function serverInfo(data: Array<{ label: string, value: string }>): string {
  return Banner.renderServerInfo(data)
}