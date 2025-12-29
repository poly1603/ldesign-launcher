/**
 * SFTP 部署适配器
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type {
  DeployCallbacks,
  DeployResult,
  SFTPDeployConfig,
} from '../../types/deploy'
import path from 'node:path'
import fs from 'fs-extra'
import { BaseAdapter } from './BaseAdapter'

/**
 * SFTP 部署适配器
 *
 * 支持通过 SFTP 安全上传文件到服务器
 */
export class SFTPAdapter extends BaseAdapter<SFTPDeployConfig> {
  name = 'sftp'
  platform = 'sftp' as const
  displayName = 'SFTP 服务器'
  icon = '🔐'
  description = '通过 SFTP 安全上传到服务器'
  requiresBuild = true

  async validateConfig(config: SFTPDeployConfig): Promise<{ valid: boolean, errors: string[] }> {
    const errors: string[] = []

    if (!config.host) {
      errors.push('需要提供 SFTP 服务器地址 (host)')
    }

    if (!config.username) {
      errors.push('需要提供 SFTP 用户名 (username)')
    }

    if (!config.password && !config.privateKey) {
      errors.push('需要提供密码 (password) 或私钥路径 (privateKey)')
    }

    if (config.privateKey) {
      const keyPath = config.privateKey.replace('~', process.env.HOME || process.env.USERPROFILE || '')
      if (!await fs.pathExists(keyPath)) {
        errors.push(`私钥文件不存在: ${config.privateKey}`)
      }
    }

    if (!config.remotePath) {
      errors.push('需要提供远程目录路径 (remotePath)')
    }

    return { valid: errors.length === 0, errors }
  }

  async deploy(config: SFTPDeployConfig, callbacks: DeployCallbacks): Promise<DeployResult> {
    this.callbacks = callbacks
    this.isCancelled = false

    const cwd = process.cwd()
    const distDir = this.getDistDir(config, cwd)

    // 验证构建目录
    const distValidation = await this.validateDistDir(distDir)
    if (!distValidation.valid) {
      return this.createFailedResult(distValidation.error!)
    }

    this.log('info', '准备通过 SFTP 部署...', 'prepare')
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

      return await this.uploadWithSftp(config, distDir, files, totalSize)
    }
    catch (error) {
      return this.createFailedResult((error as Error).message, (error as Error).stack)
    }
  }

  /**
   * 使用 ssh2-sftp-client 上传文件
   */
  private async uploadWithSftp(
    config: SFTPDeployConfig,
    _distDir: string,
    files: { relativePath: string, absolutePath: string, size: number }[],
    totalSize: number,
  ): Promise<DeployResult> {
    this.log('info', `连接到 SFTP 服务器: ${config.host}:${config.port || 22}`, 'upload')
    this.updateProgress({
      phase: 'upload',
      progress: 50,
      phaseProgress: 0,
      message: '正在连接 SFTP 服务器...',
    })

    try {
      const SftpClient = (await import('ssh2-sftp-client')).default
      const sftp = new SftpClient()

      // 准备连接配置
      const connectConfig: Record<string, unknown> = {
        host: config.host,
        port: config.port || 22,
        username: config.username,
      }

      if (config.password) {
        connectConfig.password = config.password
      }

      if (config.privateKey) {
        const keyPath = config.privateKey.replace('~', process.env.HOME || process.env.USERPROFILE || '')
        connectConfig.privateKey = await fs.readFile(keyPath)
        if (config.passphrase) {
          connectConfig.passphrase = config.passphrase
        }
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await sftp.connect(connectConfig as any)
        this.log('success', 'SFTP 连接成功', 'upload')

        // 清空远程目录（如果需要）
        if (config.cleanRemote) {
          this.log('info', `清空远程目录: ${config.remotePath}`, 'upload')
          try {
            const exists = await sftp.exists(config.remotePath)
            if (exists) {
              await sftp.rmdir(config.remotePath, true)
            }
          }
          catch {
            // 目录可能不存在，忽略错误
          }
        }

        // 确保远程目录存在
        await sftp.mkdir(config.remotePath, true)

        // 上传文件
        let uploadedSize = 0
        let uploadedCount = 0

        for (const file of files) {
          if (this.isCancelled) {
            throw new Error('部署已取消')
          }

          const remotePath = `${config.remotePath}/${file.relativePath}`.replace(/\\/g, '/')
          const remoteDir = path.posix.dirname(remotePath)

          // 确保远程目录存在
          try {
            await sftp.mkdir(remoteDir, true)
          }
          catch {
            // 目录可能已存在
          }

          // 上传文件
          await sftp.put(file.absolutePath, remotePath)

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

        await sftp.end()

        this.updateProgress({
          phase: 'complete',
          progress: 100,
          phaseProgress: 100,
          message: '部署完成！',
        })

        return this.createSuccessResult(undefined, {
          platformInfo: {
            host: config.host,
            remotePath: config.remotePath,
            filesUploaded: uploadedCount,
          },
        })
      }
      catch (error) {
        await sftp.end().catch(() => { })
        throw error
      }
    }
    catch (error) {
      // 如果 ssh2-sftp-client 不可用，提示用户安装
      if ((error as Error).message.includes('Cannot find module \'ssh2-sftp-client\'')) {
        return this.createFailedResult(
          'SFTP 功能需要安装 ssh2-sftp-client: npm i ssh2-sftp-client',
          '请运行: npm install ssh2-sftp-client 或 pnpm add ssh2-sftp-client',
        )
      }
      throw error
    }
  }
}
