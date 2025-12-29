/**
 * FTP 部署适配器
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type {
  DeployCallbacks,
  DeployResult,
  FTPDeployConfig,
} from '../../types/deploy'
import { BaseAdapter } from './BaseAdapter'

/**
 * FTP 部署适配器
 *
 * 支持通过 FTP 上传文件到服务器
 */
export class FTPAdapter extends BaseAdapter<FTPDeployConfig> {
  name = 'ftp'
  platform = 'ftp' as const
  displayName = 'FTP 服务器'
  icon = '📂'
  description = '通过 FTP 上传到服务器'
  requiresBuild = true

  async validateConfig(config: FTPDeployConfig): Promise<{ valid: boolean, errors: string[] }> {
    const errors: string[] = []

    if (!config.host) {
      errors.push('需要提供 FTP 服务器地址 (host)')
    }

    if (!config.username) {
      errors.push('需要提供 FTP 用户名 (username)')
    }

    if (!config.password) {
      errors.push('需要提供 FTP 密码 (password)')
    }

    if (!config.remotePath) {
      errors.push('需要提供远程目录路径 (remotePath)')
    }

    return { valid: errors.length === 0, errors }
  }

  async deploy(config: FTPDeployConfig, callbacks: DeployCallbacks): Promise<DeployResult> {
    this.callbacks = callbacks
    this.isCancelled = false

    const cwd = process.cwd()
    const distDir = this.getDistDir(config, cwd)

    // 验证构建目录
    const distValidation = await this.validateDistDir(distDir)
    if (!distValidation.valid) {
      return this.createFailedResult(distValidation.error!)
    }

    this.log('info', '准备通过 FTP 部署...', 'prepare')
    this.updateProgress({
      phase: 'prepare',
      progress: 45,
      phaseProgress: 0,
      message: '准备上传文件...',
    })

    try {
      const files = await this.getFilesToUpload(distDir, {
        exclude: config.exclude,
        include: config.include,
      })
      const totalSize = this.calculateTotalSize(files)
      this.log('info', `共 ${files.length} 个文件，总大小 ${this.formatSize(totalSize)}`, 'prepare')

      return await this.uploadWithFtp(config, distDir, files, totalSize)
    }
    catch (error) {
      return this.createFailedResult((error as Error).message, (error as Error).stack)
    }
  }

  /**
   * 使用 basic-ftp 上传文件
   */
  private async uploadWithFtp(
    config: FTPDeployConfig,
    distDir: string,
    files: { relativePath: string, absolutePath: string, size: number }[],
    totalSize: number,
  ): Promise<DeployResult> {
    this.log('info', `连接到 FTP 服务器: ${config.host}:${config.port || 21}`, 'upload')
    this.updateProgress({
      phase: 'upload',
      progress: 50,
      phaseProgress: 0,
      message: '正在连接 FTP 服务器...',
    })

    // 使用 basic-ftp 库（需要动态导入）
    try {
      const { Client } = await import('basic-ftp')
      const client = new Client()
      client.ftp.verbose = false

      try {
        // 连接
        await client.access({
          host: config.host,
          port: config.port || 21,
          user: config.username,
          password: config.password,
          secure: config.secure,
        })

        this.log('success', 'FTP 连接成功', 'upload')

        // 清空远程目录（如果需要）
        if (config.cleanRemote) {
          this.log('info', `清空远程目录: ${config.remotePath}`, 'upload')
          try {
            await client.ensureDir(config.remotePath)
            await client.clearWorkingDir()
          }
          catch {
            // 目录可能不存在，忽略错误
          }
        }

        // 确保远程目录存在
        await client.ensureDir(config.remotePath)

        // 上传文件
        let uploadedSize = 0
        let uploadedCount = 0

        for (const file of files) {
          if (this.isCancelled) {
            throw new Error('部署已取消')
          }

          const remotePath = `${config.remotePath}/${file.relativePath}`.replace(/\\/g, '/')
          const remoteDir = remotePath.substring(0, remotePath.lastIndexOf('/'))

          // 确保远程目录存在
          await client.ensureDir(remoteDir)

          // 上传文件
          await client.uploadFrom(file.absolutePath, remotePath)

          uploadedSize += file.size
          uploadedCount++

          const progress = Math.round((uploadedSize / totalSize) * 100)
          this.updateProgress({
            phase: 'upload',
            progress: 50 + progress * 0.45,
            phaseProgress: progress,
            message: `上传中: ${file.relativePath}`,
            filesUploaded: uploadedCount,
            totalFiles: files.length,
            bytesUploaded: uploadedSize,
            totalBytes: totalSize,
          })
        }

        this.log('success', `已上传 ${uploadedCount} 个文件`, 'upload')

        client.close()

        this.updateProgress({
          phase: 'complete',
          progress: 100,
          phaseProgress: 100,
          message: '部署完成！',
        })

        // FTP 部署没有 URL
        return this.createSuccessResult(undefined, {
          platformInfo: {
            host: config.host,
            remotePath: config.remotePath,
            filesUploaded: uploadedCount,
          },
        })
      }
      catch (error) {
        client.close()
        throw error
      }
    }
    catch (error) {
      // 如果 basic-ftp 不可用，尝试使用 ftp-deploy
      if ((error as Error).message.includes('Cannot find module \'basic-ftp\'')) {
        this.log('warn', 'basic-ftp 不可用，尝试使用 ftp-deploy...', 'upload')
        return this.uploadWithFtpDeploy(config, distDir, files.length)
      }
      throw error
    }
  }

  /**
   * 使用 ftp-deploy 包上传
   */
  private async uploadWithFtpDeploy(
    config: FTPDeployConfig,
    distDir: string,
    fileCount: number,
  ): Promise<DeployResult> {
    const args = [
      'ftp-deploy',
      '--server',
      config.host,
      '--username',
      config.username,
      '--password',
      config.password,
      '--local-dir',
      distDir,
      '--server-dir',
      config.remotePath,
    ]

    if (config.port) {
      args.push('--port', String(config.port))
    }

    if (config.cleanRemote) {
      args.push('--delete')
    }

    const result = await this.execCommand('npx', args, {
      onStdout: (data) => {
        const lines = data.split('\n').filter(Boolean)
        for (const line of lines) {
          const cleanLine = line.replace(/\x1B\[[0-9;]*m/g, '').trim()
          if (cleanLine) {
            this.log('info', cleanLine, 'upload')
          }
        }
      },
      onStderr: (data) => {
        const lines = data.split('\n').filter(Boolean)
        for (const line of lines) {
          const cleanLine = line.replace(/\x1B\[[0-9;]*m/g, '').trim()
          if (cleanLine && !cleanLine.includes('npm warn')) {
            this.log('warn', cleanLine, 'upload')
          }
        }
      },
    })

    if (result.code !== 0) {
      return this.createFailedResult('FTP 部署失败', result.stderr)
    }

    return this.createSuccessResult(undefined, {
      platformInfo: {
        host: config.host,
        remotePath: config.remotePath,
        filesUploaded: fileCount,
      },
    })
  }
}
