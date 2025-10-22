/**
 * 警告抑制器
 * 
 * 统一管理 Node.js 和第三方库的警告输出
 * 支持临时抑制和恢复，防止内存泄漏
 * 
 * @author LDesign Team
 * @since 1.1.1
 */

/**
 * 警告过滤规则
 */
export interface WarningFilter {
  /** 包含的关键词（满足任一即抑制） */
  includes?: string[]
  /** 排除的关键词（满足任一则不抑制） */
  excludes?: string[]
  /** 是否启用 */
  enabled?: boolean
}

/**
 * 警告抑制器选项
 */
export interface WarningSuppressorOptions {
  /** 自定义过滤规则 */
  filters?: WarningFilter[]
  /** 是否在 debug 模式下显示被抑制的警告 */
  showSuppressed?: boolean
}

/**
 * 警告抑制器类
 */
export class WarningSuppressor {
  private originalEmitWarning: typeof process.emitWarning
  private originalConsoleWarn: typeof console.warn
  private originalConsoleError: typeof console.error
  private isActive: boolean = false
  private filters: WarningFilter[]
  private showSuppressed: boolean
  private suppressedCount: number = 0

  constructor(options: WarningSuppressorOptions = {}) {
    this.originalEmitWarning = process.emitWarning
    this.originalConsoleWarn = console.warn
    this.originalConsoleError = console.error
    this.showSuppressed = options.showSuppressed || false

    // 默认过滤规则
    this.filters = options.filters || [
      {
        // Node.js ESM 相关警告
        includes: [
          'To load an ES module',
          'set "type": "module"',
          'use the .mjs extension'
        ],
        enabled: true
      },
      {
        // Vite CJS API 警告
        includes: [
          'CJS build of Vite',
          'Node API is deprecated',
          'vite-cjs-node-api-deprecated',
          'deprecated'
        ],
        enabled: true
      },
      {
        // 浏览器兼容性警告
        includes: [
          'externalized for browser compatibility',
          'Module "node:process" has been externalized',
          'Module "node:path" has been externalized',
          'Module "node:url" has been externalized'
        ],
        enabled: true
      },
      {
        // Sourcemap 警告
        includes: [
          'Sourcemap for',
          'points to missing source files'
        ],
        enabled: true
      },
      {
        // 实验性功能警告
        includes: [
          'ExperimentalWarning',
          'experimental'
        ],
        enabled: true
      }
    ]
  }

  /**
   * 检查是否应该抑制警告
   * 
   * @param message - 警告消息
   * @returns 是否抑制
   */
  private shouldSuppress(message: string): boolean {
    for (const filter of this.filters) {
      if (!filter.enabled) continue

      // 检查排除规则
      if (filter.excludes?.some(keyword => message.includes(keyword))) {
        return false
      }

      // 检查包含规则
      if (filter.includes?.some(keyword => message.includes(keyword))) {
        return true
      }
    }

    return false
  }

  /**
   * 激活警告抑制
   */
  activate(): void {
    if (this.isActive) return

    this.isActive = true
    this.suppressedCount = 0

    // 覆盖 process.emitWarning
    process.emitWarning = (warning: any, ...args: any[]) => {
      const warningStr = typeof warning === 'string'
        ? warning
        : warning?.message || String(warning)

      if (this.shouldSuppress(warningStr)) {
        this.suppressedCount++
        if (this.showSuppressed) {
          console.debug(`[Suppressed Warning] ${warningStr}`)
        }
        return
      }

      return this.originalEmitWarning.call(process, warning, ...args)
    }

    // 覆盖 console.warn
    console.warn = (...args: any[]) => {
      const message = args.join(' ')

      if (this.shouldSuppress(message)) {
        this.suppressedCount++
        if (this.showSuppressed) {
          console.debug(`[Suppressed console.warn] ${message}`)
        }
        return
      }

      return this.originalConsoleWarn.apply(console, args)
    }

    // 过滤 console.error 中的某些警告级别的错误
    console.error = (...args: any[]) => {
      const message = args.join(' ')

      // 只抑制明确标记为警告的错误消息
      if (message.includes('Warning:') && this.shouldSuppress(message)) {
        this.suppressedCount++
        if (this.showSuppressed) {
          console.debug(`[Suppressed console.error] ${message}`)
        }
        return
      }

      return this.originalConsoleError.apply(console, args)
    }
  }

  /**
   * 停用警告抑制，恢复原始行为
   */
  deactivate(): void {
    if (!this.isActive) return

    this.isActive = false

    // 恢复原始函数
    process.emitWarning = this.originalEmitWarning
    console.warn = this.originalConsoleWarn
    console.error = this.originalConsoleError

    if (this.showSuppressed && this.suppressedCount > 0) {
      console.debug(`[WarningSuppressor] 总共抑制了 ${this.suppressedCount} 个警告`)
    }
  }

  /**
   * 获取被抑制的警告数量
   */
  getSuppressedCount(): number {
    return this.suppressedCount
  }

  /**
   * 临时执行某个操作并抑制警告
   * 
   * @param fn - 要执行的函数
   * @returns 函数返回值
   */
  async withSuppression<T>(fn: () => T | Promise<T>): Promise<T> {
    this.activate()
    try {
      return await fn()
    } finally {
      this.deactivate()
    }
  }

  /**
   * 添加自定义过滤规则
   * 
   * @param filter - 过滤规则
   */
  addFilter(filter: WarningFilter): void {
    this.filters.push(filter)
  }

  /**
   * 移除过滤规则
   * 
   * @param index - 规则索引
   */
  removeFilter(index: number): void {
    this.filters.splice(index, 1)
  }

  /**
   * 清空所有过滤规则
   */
  clearFilters(): void {
    this.filters = []
  }
}

/**
 * 创建警告抑制器实例
 * 
 * @param options - 选项
 * @returns 警告抑制器实例
 */
export function createWarningSuppressor(options?: WarningSuppressorOptions): WarningSuppressor {
  return new WarningSuppressor(options)
}

/**
 * 全局警告抑制器实例（单例）
 */
let globalSuppressor: WarningSuppressor | null = null

/**
 * 获取全局警告抑制器
 * 
 * @returns 全局警告抑制器实例
 */
export function getGlobalSuppressor(): WarningSuppressor {
  if (!globalSuppressor) {
    globalSuppressor = new WarningSuppressor({
      showSuppressed: process.env.DEBUG_WARNINGS === 'true'
    })
  }
  return globalSuppressor
}

/**
 * 激活全局警告抑制
 */
export function activateGlobalSuppression(): void {
  getGlobalSuppressor().activate()
}

/**
 * 停用全局警告抑制
 */
export function deactivateGlobalSuppression(): void {
  getGlobalSuppressor().deactivate()
}

/**
 * 在全局抑制下执行函数
 * 
 * @param fn - 要执行的函数
 * @returns 函数返回值
 */
export async function withGlobalSuppression<T>(fn: () => T | Promise<T>): Promise<T> {
  return getGlobalSuppressor().withSuppression(fn)
}

