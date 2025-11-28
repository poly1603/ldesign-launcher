/**
 * 键盘快捷键监听工具
 * 
 * 用于监听终端键盘输入,实现交互式快捷键功能
 * 
 * @author LDesign Team
 * @since 2.1.0
 */

import chalk from 'chalk'
import { Logger } from './logger'

export interface KeyboardShortcut {
  /** 快捷键 */
  key: string
  /** 描述 */
  description: string
  /** 回调函数 */
  handler: () => void | Promise<void>
}

export interface KeyboardOptions {
  /** 是否显示帮助提示 */
  showHelp?: boolean
  /** Logger 实例 */
  logger?: Logger
}

/**
 * 键盘快捷键管理器
 */
export class KeyboardManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private logger: Logger
  private isListening: boolean = false

  constructor(private options: KeyboardOptions = {}) {
    this.logger = options.logger || new Logger('keyboard')
  }

  /**
   * 注册快捷键
   */
  register(shortcut: KeyboardShortcut): void {
    this.shortcuts.set(shortcut.key.toLowerCase(), shortcut)
  }

  /**
   * 批量注册快捷键
   */
  registerMultiple(shortcuts: KeyboardShortcut[]): void {
    shortcuts.forEach(shortcut => this.register(shortcut))
  }

  /**
   * 取消注册快捷键
   */
  unregister(key: string): void {
    this.shortcuts.delete(key.toLowerCase())
  }

  /**
   * 开始监听键盘输入
   */
  startListening(): void {
    if (this.isListening) {
      return
    }

    if (!process.stdin.isTTY) {
      this.logger.debug('不支持 TTY,无法监听键盘输入')
      return
    }

    this.isListening = true

    // 设置 stdin 为 raw 模式
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    // 监听数据事件
    process.stdin.on('data', this.handleKeyPress.bind(this))

    if (this.options.showHelp) {
      this.showHelp()
    }
  }

  /**
   * 停止监听键盘输入
   */
  stopListening(): void {
    if (!this.isListening) {
      return
    }

    this.isListening = false

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false)
      process.stdin.pause()
    }

    process.stdin.removeAllListeners('data')
  }

  /**
   * 处理按键事件
   */
  private async handleKeyPress(key: string): Promise<void> {
    // Ctrl+C
    if (key === '\u0003') {
      process.exit(0)
    }

    // Ctrl+D
    if (key === '\u0004') {
      process.exit(0)
    }

    const keyLower = key.toLowerCase()
    const shortcut = this.shortcuts.get(keyLower)

    if (shortcut) {
      try {
        await shortcut.handler()
      } catch (error) {
        this.logger.error(`执行快捷键 "${key}" 失败: ${(error as Error).message}`)
      }
    }
  }

  /**
   * 显示帮助信息
   */
  showHelp(): void {
    if (this.shortcuts.size === 0) {
      return
    }

    this.logger.raw(chalk.gray('\n快捷键:'))
    
    this.shortcuts.forEach((shortcut) => {
      this.logger.raw(chalk.gray(`  ${chalk.bold(shortcut.key)} - ${shortcut.description}`))
    })
    
    this.logger.raw('')
  }

  /**
   * 获取所有注册的快捷键
   */
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }

  /**
   * 清空所有快捷键
   */
  clear(): void {
    this.shortcuts.clear()
  }
}

/**
 * 创建键盘管理器
 */
export function createKeyboardManager(options?: KeyboardOptions): KeyboardManager {
  return new KeyboardManager(options)
}