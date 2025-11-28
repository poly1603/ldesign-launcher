/**
 * Spinner 加载动画组件
 * 
 * 基于 ora 实现的加载动画效果
 * 
 * @author LDesign Team
 * @since 2.1.0
 */

import type { Ora, Options as OraOptions } from 'ora'
import ora from 'ora'

export interface SpinnerOptions {
  /** 显示文本 */
  text: string
  /** 动画类型 */
  spinner?: 'dots' | 'line' | 'star' | 'arrow' | 'bouncingBar' | 'bouncingBall'
  /** 颜色 */
  color?: 'cyan' | 'green' | 'yellow' | 'red' | 'magenta' | 'blue'
  /** 是否立即启动 */
  autoStart?: boolean
}

export class Spinner {
  private ora: Ora

  constructor(options: SpinnerOptions) {
    const oraOptions: OraOptions = {
      text: options.text,
      spinner: options.spinner || 'dots',
      color: options.color || 'cyan',
    }

    this.ora = ora(oraOptions)

    if (options.autoStart !== false) {
      this.start()
    }
  }

  /**
   * 启动动画
   */
  start(text?: string): this {
    if (text) {
      this.ora.text = text
    }
    this.ora.start()
    return this
  }

  /**
   * 停止动画
   */
  stop(): this {
    this.ora.stop()
    return this
  }

  /**
   * 成功并停止
   */
  succeed(text?: string): this {
    this.ora.succeed(text)
    return this
  }

  /**
   * 失败并停止
   */
  fail(text?: string): this {
    this.ora.fail(text)
    return this
  }

  /**
   * 警告并停止
   */
  warn(text?: string): this {
    this.ora.warn(text)
    return this
  }

  /**
   * 信息并停止
   */
  info(text?: string): this {
    this.ora.info(text)
    return this
  }

  /**
   * 更新文本
   */
  updateText(text: string): this {
    this.ora.text = text
    return this
  }

  /**
   * 更改颜色
   */
  updateColor(color: string): this {
    this.ora.color = color as any
    return this
  }

  /**
   * 更改动画类型
   */
  updateSpinner(spinner: string): this {
    this.ora.spinner = spinner as any
    return this
  }

  /**
   * 清除输出
   */
  clear(): this {
    this.ora.clear()
    return this
  }

  /**
   * 获取原始 ora 实例
   */
  getOra(): Ora {
    return this.ora
  }
}

/**
 * 创建 Spinner 实例
 */
export function createSpinner(options: SpinnerOptions): Spinner {
  return new Spinner(options)
}

/**
 * 快捷方法：创建并启动一个 spinner
 */
export function startSpinner(text: string, spinner?: string): Spinner {
  return new Spinner({
    text,
    spinner: spinner as any,
    autoStart: true,
  })
}