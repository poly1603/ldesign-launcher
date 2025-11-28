/**
 * 友好错误处理工具
 *
 * 提供友好的错误提示和解决方案建议
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import chalk from 'chalk'
import { Logger } from './logger'

export interface ErrorSolution {
  /** 问题描述 */
  problem: string
  /** 解决方案列表 */
  solutions: string[]
  /** 相关文档链接 */
  docs?: string
}

export interface FriendlyErrorOptions {
  /** 是否显示堆栈信息 */
  showStack?: boolean
  /** 是否使用彩色输出 */
  useColors?: boolean
  /** Logger 实例 */
  logger?: Logger
}

/**
 * 友好错误处理器
 */
export class FriendlyErrorHandler {
  private logger: Logger
  private errorSolutions: Map<string, ErrorSolution> = new Map()

  constructor(private options: FriendlyErrorOptions = {}) {
    this.logger = options.logger || new Logger('error')
    this.initializeErrorSolutions()
  }

  /**
   * 初始化常见错误解决方案
   */
  private initializeErrorSolutions(): void {
    // 端口占用错误
    this.registerSolution('EADDRINUSE', {
      problem: '端口已被占用',
      solutions: [
        '使用不同的端口: launcher dev --port 8080',
        '查找并终止占用端口的进程',
        '使用 --strictPort 选项禁用自动端口选择',
      ],
      docs: 'https://launcher.dev/docs/troubleshooting/port-in-use',
    })

    // 权限错误
    this.registerSolution('EACCES', {
      problem: '权限不足',
      solutions: [
        '检查文件和目录的访问权限',
        '使用管理员权限运行命令',
        '确保没有其他进程锁定文件',
      ],
      docs: 'https://launcher.dev/docs/troubleshooting/permissions',
    })

    // 模块未找到
    this.registerSolution('MODULE_NOT_FOUND', {
      problem: '模块未找到',
      solutions: [
        '运行: pnpm install 安装依赖',
        '检查 package.json 中的依赖配置',
        '清除 node_modules 后重新安装: rm -rf node_modules && pnpm install',
        '检查导入路径是否正确',
      ],
      docs: 'https://launcher.dev/docs/troubleshooting/module-not-found',
    })

    // 内存溢出
    this.registerSolution('HEAP_OUT_OF_MEMORY', {
      problem: '内存不足',
      solutions: [
        '增加 Node.js 内存限制: NODE_OPTIONS="--max-old-space-size=4096"',
        '减少并发构建任务',
        '优化代码和依赖',
        '检查是否有内存泄漏',
      ],
      docs: 'https://launcher.dev/docs/troubleshooting/memory',
    })

    // 文件未找到
    this.registerSolution('ENOENT', {
      problem: '文件或目录不存在',
      solutions: [
        '检查文件路径是否正确',
        '确保文件已创建',
        '对于构建产物,先运行: launcher build',
        '检查配置文件中的路径设置',
      ],
      docs: 'https://launcher.dev/docs/troubleshooting/file-not-found',
    })

    // 配置错误
    this.registerSolution('CONFIG_ERROR', {
      problem: '配置文件错误',
      solutions: [
        '检查配置文件语法是否正确',
        '参考文档中的配置示例',
        '使用 --config 指定正确的配置文件',
        '运行: launcher doctor 诊断配置问题',
      ],
      docs: 'https://launcher.dev/docs/config',
    })

    // 网络错误
    this.registerSolution('NETWORK_ERROR', {
      problem: '网络连接失败',
      solutions: [
        '检查网络连接是否正常',
        '配置代理: HTTP_PROXY=http://proxy:port',
        '尝试使用其他 npm 镜像源',
        '检查防火墙设置',
      ],
      docs: 'https://launcher.dev/docs/troubleshooting/network',
    })
  }

  /**
   * 注册错误解决方案
   */
  registerSolution(errorCode: string, solution: ErrorSolution): void {
    this.errorSolutions.set(errorCode.toUpperCase(), solution)
  }

  /**
   * 处理错误
   */
  handleError(error: Error, context?: string): void {
    const useColors = this.options.useColors !== false

    // 显示错误标题
    const errorIcon = useColors ? chalk.red('✖') : '✖'
    const errorTitle = useColors
      ? chalk.bold.red(`错误${context ? ` (${context})` : ''}`)
      : `错误${context ? ` (${context})` : ''}`

    this.logger.raw('')
    this.logger.raw(`${errorIcon} ${errorTitle}`)
    this.logger.raw('')

    // 显示错误消息
    const message = useColors ? chalk.red(error.message) : error.message
    this.logger.raw(`  ${message}`)
    this.logger.raw('')

    // 查找匹配的解决方案
    const solution = this.findSolution(error)

    if (solution) {
      this.displaySolution(solution, useColors)
    }

    // 显示堆栈信息
    if (this.options.showStack && error.stack) {
      this.logger.raw(chalk.gray('\n堆栈信息:'))
      const stackLines = error.stack.split('\n').slice(1, 5) // 只显示前4行
      stackLines.forEach((line) => {
        this.logger.raw(chalk.gray(`  ${line.trim()}`))
      })
      this.logger.raw('')
    }
  }

  /**
   * 查找匹配的解决方案
   */
  private findSolution(error: Error): ErrorSolution | null {
    const errorMessage = error.message.toUpperCase()
    const errorName = error.name.toUpperCase()

    // 精确匹配错误代码
    if (this.errorSolutions.has(errorName)) {
      return this.errorSolutions.get(errorName)!
    }

    // 模糊匹配错误消息
    for (const [code, solution] of this.errorSolutions.entries()) {
      if (errorMessage.includes(code) || errorName.includes(code)) {
        return solution
      }
    }

    // 关键词匹配
    if (errorMessage.includes('PORT') || errorMessage.includes('ADDRINUSE')) {
      return this.errorSolutions.get('EADDRINUSE') || null
    }

    if (errorMessage.includes('PERMISSION') || errorMessage.includes('ACCESS')) {
      return this.errorSolutions.get('EACCES') || null
    }

    if (errorMessage.includes('MODULE') || errorMessage.includes('CANNOT FIND')) {
      return this.errorSolutions.get('MODULE_NOT_FOUND') || null
    }

    if (errorMessage.includes('MEMORY') || errorMessage.includes('HEAP')) {
      return this.errorSolutions.get('HEAP_OUT_OF_MEMORY') || null
    }

    if (errorMessage.includes('CONFIG')) {
      return this.errorSolutions.get('CONFIG_ERROR') || null
    }

    if (errorMessage.includes('NETWORK') || errorMessage.includes('TIMEOUT')) {
      return this.errorSolutions.get('NETWORK_ERROR') || null
    }

    return null
  }

  /**
   * 显示解决方案
   */
  private displaySolution(solution: ErrorSolution, useColors: boolean): void {
    // 问题描述
    const problemIcon = useColors ? chalk.yellow('⚠') : '⚠'
    const problemText = useColors
      ? chalk.bold.yellow(solution.problem)
      : solution.problem

    this.logger.raw(`${problemIcon} ${problemText}`)
    this.logger.raw('')

    // 解决方案
    const solutionIcon = useColors ? chalk.cyan('💡') : '💡'
    const solutionTitle = useColors
      ? chalk.bold.cyan('可能的解决方案:')
      : '可能的解决方案:'

    this.logger.raw(`${solutionIcon} ${solutionTitle}`)

    solution.solutions.forEach((sol, index) => {
      const number = useColors ? chalk.cyan(`${index + 1}.`) : `${index + 1}.`
      this.logger.raw(`  ${number} ${sol}`)
    })
    this.logger.raw('')

    // 文档链接
    if (solution.docs) {
      const docsIcon = useColors ? chalk.blue('📚') : '📚'
      const docsText = useColors
        ? `相关文档: ${chalk.underline.blue(solution.docs)}`
        : `相关文档: ${solution.docs}`

      this.logger.raw(`${docsIcon} ${docsText}`)
      this.logger.raw('')
    }
  }

  /**
   * 创建友好的错误对象
   */
  static createError(message: string, code?: string): Error {
    const error = new Error(message)
    if (code) {
      error.name = code
    }
    return error
  }
}

/**
 * 创建友好错误处理器
 */
export function createFriendlyErrorHandler(options?: FriendlyErrorOptions): FriendlyErrorHandler {
  return new FriendlyErrorHandler(options)
}

/**
 * 快捷方法:处理错误
 */
export function handleFriendlyError(error: Error, context?: string, options?: FriendlyErrorOptions): void {
  const handler = new FriendlyErrorHandler(options)
  handler.handleError(error, context)
}
