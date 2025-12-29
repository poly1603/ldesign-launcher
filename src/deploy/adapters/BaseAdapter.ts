/**
 * 部署适配器基类
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type {
  BaseDeployConfig,
  DeployAdapter,
  DeployCallbacks,
  DeployLogEntry,
  DeployLogLevel,
  DeployPhase,
  DeployPlatform,
  DeployProgress,
  DeployResult,
} from '../../types/deploy'
import path from 'node:path'
import fg from 'fast-glob'
import fs from 'fs-extra'

/**
 * 适配器基类
 */
export abstract class BaseAdapter<T extends BaseDeployConfig = BaseDeployConfig>
implements DeployAdapter<T> {
  abstract name: string
  abstract platform: DeployPlatform
  abstract displayName: string
  abstract icon: string
  abstract description: string
  abstract requiresBuild: boolean

  protected callbacks?: DeployCallbacks
  protected isCancelled = false

  /**
   * 验证配置
   */
  abstract validateConfig(config: T): Promise<{ valid: boolean, errors: string[] }>

  /**
   * 执行部署
   */
  abstract deploy(config: T, callbacks: DeployCallbacks): Promise<DeployResult>

  /**
   * 取消部署
   */
  async cancel(): Promise<void> {
    this.isCancelled = true
  }

  /**
   * 发送进度更新
   */
  protected updateProgress(progress: Partial<DeployProgress>): void {
    if (this.callbacks) {
      this.callbacks.onProgress({
        phase: 'upload',
        progress: 0,
        phaseProgress: 0,
        message: '',
        ...progress,
      })
    }
  }

  /**
   * 发送日志
   */
  protected log(level: DeployLogLevel, message: string, phase?: DeployPhase, data?: unknown): void {
    if (this.callbacks) {
      const entry: DeployLogEntry = {
        timestamp: Date.now(),
        level,
        message,
        phase,
        data,
      }
      this.callbacks.onLog(entry)
    }
  }

  /**
   * 获取构建目录路径
   */
  protected getDistDir(config: T, cwd: string): string {
    return path.resolve(cwd, config.distDir || 'dist')
  }

  /**
   * 验证构建目录存在
   */
  protected async validateDistDir(distDir: string): Promise<{ valid: boolean, error?: string }> {
    if (!await fs.pathExists(distDir)) {
      return { valid: false, error: `构建目录不存在: ${distDir}` }
    }

    const files = await fs.readdir(distDir)
    if (files.length === 0) {
      return { valid: false, error: `构建目录为空: ${distDir}` }
    }

    return { valid: true }
  }

  /**
   * 获取要上传的文件列表
   */
  protected async getFilesToUpload(
    distDir: string,
    options?: { exclude?: string[], include?: string[] },
  ): Promise<{ relativePath: string, absolutePath: string, size: number }[]> {
    const patterns = options?.include || ['**/*']
    const ignore = options?.exclude || []

    const files = await fg(patterns, {
      cwd: distDir,
      dot: true,
      ignore: ['**/node_modules/**', ...ignore],
      onlyFiles: true,
    })

    const result: { relativePath: string, absolutePath: string, size: number }[] = []

    for (const file of files) {
      const absolutePath = path.join(distDir, file)
      const stat = await fs.stat(absolutePath)
      result.push({
        relativePath: file,
        absolutePath,
        size: stat.size,
      })
    }

    return result
  }

  /**
   * 计算总文件大小
   */
  protected calculateTotalSize(files: { size: number }[]): number {
    return files.reduce((sum, f) => sum + f.size, 0)
  }

  /**
   * 格式化文件大小
   */
  protected formatSize(bytes: number): string {
    if (bytes < 1024)
      return `${bytes} B`
    if (bytes < 1024 * 1024)
      return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  /**
   * 创建成功结果
   */
  protected createSuccessResult(
    url?: string,
    extra?: Partial<DeployResult>,
  ): DeployResult {
    return {
      success: true,
      url,
      timestamp: Date.now(),
      ...extra,
    }
  }

  /**
   * 创建失败结果
   */
  protected createFailedResult(error: string, details?: string): DeployResult {
    return {
      success: false,
      error,
      errorDetails: details,
      timestamp: Date.now(),
    }
  }

  /**
   * 执行命令
   */
  protected async execCommand(
    command: string,
    args: string[],
    options?: {
      cwd?: string
      env?: Record<string, string>
      onStdout?: (data: string) => void
      onStderr?: (data: string) => void
    },
  ): Promise<{ code: number, stdout: string, stderr: string }> {
    const { spawn } = await import('node:child_process')

    return new Promise((resolve, reject) => {
      const isWindows = process.platform === 'win32'
      const proc = isWindows
        ? spawn('cmd.exe', ['/c', command, ...args], {
            cwd: options?.cwd,
            env: { ...process.env, ...options?.env },
            stdio: ['pipe', 'pipe', 'pipe'],
          })
        : spawn(command, args, {
            cwd: options?.cwd,
            env: { ...process.env, ...options?.env },
            stdio: ['pipe', 'pipe', 'pipe'],
          })

      let stdout = ''
      let stderr = ''

      proc.stdout?.on('data', (data: Buffer) => {
        const text = data.toString()
        stdout += text
        options?.onStdout?.(text)
      })

      proc.stderr?.on('data', (data: Buffer) => {
        const text = data.toString()
        stderr += text
        options?.onStderr?.(text)
      })

      proc.on('close', (code) => {
        resolve({ code: code || 0, stdout, stderr })
      })

      proc.on('error', (err) => {
        reject(err)
      })
    })
  }
}
