/**
 * 进程执行工具
 * 
 * 使用 execa 提供更好的进程执行体验
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

import { Logger } from './logger'

/**
 * 进程执行选项
 */
export interface ProcessExecutorOptions {
  /** 工作目录 */
  cwd?: string
  /** 环境变量 */
  env?: Record<string, string>
  /** 超时时间（毫秒） */
  timeout?: number
  /** 是否继承标准输入输出 */
  stdio?: 'inherit' | 'pipe' | 'ignore'
  /** 是否在shell中执行 */
  shell?: boolean
  /** 是否显示输出 */
  verbose?: boolean
}

/**
 * 进程执行结果
 */
export interface ProcessResult {
  /** 退出码 */
  exitCode: number
  /** 标准输出 */
  stdout: string
  /** 标准错误 */
  stderr: string
  /** 执行是否成功 */
  success: boolean
  /** 执行时长（毫秒） */
  duration: number
}

/**
 * 进程执行器类
 */
export class ProcessExecutor {
  private logger: Logger

  constructor(logger?: Logger) {
    this.logger = logger || new Logger('ProcessExecutor')
  }

  /**
   * 执行命令
   * @param command 命令
   * @param args 参数
   * @param options 选项
   */
  async execute(
    command: string,
    args: string[] = [],
    options: ProcessExecutorOptions = {}
  ): Promise<ProcessResult> {
    const startTime = Date.now()

    try {
      // 动态导入 execa
      const { execa } = await import('execa')

      if (options.verbose) {
        this.logger.info(`执行命令: ${command} ${args.join(' ')}`)
      }

      const result = await execa(command, args, {
        cwd: options.cwd || process.cwd(),
        env: options.env,
        timeout: options.timeout,
        shell: options.shell,
        stdio: options.stdio,
        reject: false // 不自动抛出错误
      })

      const duration = Date.now() - startTime

      if (options.verbose) {
        if (result.exitCode === 0) {
          this.logger.success(`✅ 命令执行成功 (${duration}ms)`)
        } else {
          this.logger.error(`❌ 命令执行失败 (退出码: ${result.exitCode})`)
        }
      }

      return {
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        success: result.exitCode === 0,
        duration
      }
    } catch (error) {
      const duration = Date.now() - startTime

      this.logger.error('命令执行异常', error)

      return {
        exitCode: 1,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        success: false,
        duration
      }
    }
  }

  /**
   * 执行命令并返回输出
   * @param command 完整命令字符串
   * @param options 选项
   */
  async executeShell(
    command: string,
    options: ProcessExecutorOptions = {}
  ): Promise<ProcessResult> {
    try {
      const { execa } = await import('execa')

      if (options.verbose) {
        this.logger.info(`执行 Shell 命令: ${command}`)
      }

      const startTime = Date.now()
      const result = await execa(command, {
        shell: true,
        cwd: options.cwd || process.cwd(),
        env: options.env,
        timeout: options.timeout,
        stdio: options.stdio,
        reject: false
      })

      const duration = Date.now() - startTime

      return {
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        success: result.exitCode === 0,
        duration
      }
    } catch (error) {
      this.logger.error('Shell 命令执行异常', error)

      return {
        exitCode: 1,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        success: false,
        duration: 0
      }
    }
  }

  /**
   * 并发执行多个命令
   * @param commands 命令列表
   * @param options 选项
   * @param concurrency 并发数，默认 3
   */
  async executeConcurrent(
    commands: Array<{ command: string; args?: string[] }>,
    options: ProcessExecutorOptions = {},
    concurrency: number = 3
  ): Promise<ProcessResult[]> {
    const { default: pLimit } = await import('p-limit')
    const limit = pLimit(concurrency)

    this.logger.info(`并发执行 ${commands.length} 个命令 (并发数: ${concurrency})`)

    const results = await Promise.all(
      commands.map(cmd =>
        limit(() => this.execute(cmd.command, cmd.args || [], options))
      )
    )

    const successCount = results.filter(r => r.success).length
    this.logger.info(`批量执行完成: ${successCount}/${commands.length} 成功`)

    return results
  }

  /**
   * 执行 npm/pnpm/yarn 命令
   * @param packageManager 包管理器
   * @param command 命令（如 install, build）
   * @param args 额外参数
   * @param options 选项
   */
  async executePackageManager(
    packageManager: 'npm' | 'pnpm' | 'yarn',
    command: string,
    args: string[] = [],
    options: ProcessExecutorOptions = {}
  ): Promise<ProcessResult> {
    const fullArgs = [command, ...args]

    this.logger.info(`执行 ${packageManager} ${fullArgs.join(' ')}`)

    return this.execute(packageManager, fullArgs, {
      ...options,
      verbose: true
    })
  }

  /**
   * 检查命令是否可用
   * @param command 命令名
   */
  async isCommandAvailable(command: string): Promise<boolean> {
    try {
      const result = await this.execute(
        process.platform === 'win32' ? 'where' : 'which',
        [command],
        { stdio: 'pipe' }
      )

      return result.success
    } catch {
      return false
    }
  }
}

/**
 * 创建进程执行器实例
 */
export function createProcessExecutor(logger?: Logger): ProcessExecutor {
  return new ProcessExecutor(logger)
}

/**
 * 全局进程执行器实例
 */
export const processExecutor = new ProcessExecutor()


