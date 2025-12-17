/**
 * SSH/SCP 部署适配器
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type {
  DeployResult,
  DeployCallbacks,
  SSHDeployConfig,
} from '../../types/deploy'
import { BaseAdapter } from './BaseAdapter'
import fs from 'fs-extra'
import path from 'path'

/**
 * SSH/SCP 部署适配器
 *
 * 支持通过 SSH/SCP 上传文件到服务器，支持执行自定义命令
 */
export class SSHAdapter extends BaseAdapter<SSHDeployConfig> {
  name = 'ssh'
  platform = 'ssh' as const
  displayName = 'SSH/SCP'
  icon = '🖥️'
  description = '通过 SSH/SCP 部署到服务器'
  requiresBuild = true

  async validateConfig(config: SSHDeployConfig): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    if (!config.host) {
      errors.push('需要提供 SSH 服务器地址 (host)')
    }

    if (!config.username) {
      errors.push('需要提供 SSH 用户名 (username)')
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

  async deploy(config: SSHDeployConfig, callbacks: DeployCallbacks): Promise<DeployResult> {
    this.callbacks = callbacks
    this.isCancelled = false

    const cwd = process.cwd()
    const distDir = this.getDistDir(config, cwd)

    // 验证构建目录
    const distValidation = await this.validateDistDir(distDir)
    if (!distValidation.valid) {
      return this.createFailedResult(distValidation.error!)
    }

    this.log('info', '准备通过 SSH 部署...', 'prepare')
    this.updateProgress({
      phase: 'prepare',
      progress: 45,
      phaseProgress: 0,
      message: '准备上传文件...',
    })

    try {
      const files = await this.getFilesToUpload(distDir, {
        exclude: config.exclude,
      })
      const totalSize = this.calculateTotalSize(files)
      this.log('info', `共 ${files.length} 个文件，总大小 ${this.formatSize(totalSize)}`, 'prepare')

      return await this.deployWithSSH(config, distDir, files, totalSize)
    } catch (error) {
      return this.createFailedResult((error as Error).message, (error as Error).stack)
    }
  }

  /**
   * 使用 SSH 部署
   */
  private async deployWithSSH(
    config: SSHDeployConfig,
    distDir: string,
    files: { relativePath: string; absolutePath: string; size: number }[],
    _totalSize: number
  ): Promise<DeployResult> {
    this.log('info', `连接到 SSH 服务器: ${config.host}:${config.port || 22}`, 'upload')
    this.updateProgress({
      phase: 'upload',
      progress: 50,
      phaseProgress: 0,
      message: '正在连接 SSH 服务器...',
    })

    try {
      const { NodeSSH } = await import('node-ssh')
      const ssh = new NodeSSH()

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
        connectConfig.privateKey = keyPath
        if (config.passphrase) {
          connectConfig.passphrase = config.passphrase
        }
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await ssh.connect(connectConfig as any)
        this.log('success', 'SSH 连接成功', 'upload')

        // 执行部署前命令
        if (config.preCommands && config.preCommands.length > 0) {
          this.log('info', '执行部署前命令...', 'upload')
          for (const cmd of config.preCommands) {
            this.log('info', `执行: ${cmd}`, 'upload')
            const result = await ssh.execCommand(cmd, { cwd: config.remotePath })
            if (result.stdout) {
              this.log('info', result.stdout, 'upload')
            }
            if (result.stderr) {
              this.log('warn', result.stderr, 'upload')
            }
          }
        }

        // 清空远程目录（如果需要）
        if (config.cleanRemote) {
          this.log('info', `清空远程目录: ${config.remotePath}`, 'upload')
          await ssh.execCommand(`rm -rf ${config.remotePath}/*`)
        }

        // 确保远程目录存在
        await ssh.execCommand(`mkdir -p ${config.remotePath}`)

        // 上传文件
        this.log('info', '开始上传文件...', 'upload')
        let uploadedCount = 0

        // 使用 putDirectory 批量上传（更高效）
        const failed: string[] = []
        const successful: string[] = []

        await ssh.putDirectory(distDir, config.remotePath, {
          recursive: true,
          concurrency: 5,
          validate: (itemPath) => {
            const baseName = path.basename(itemPath)
            return baseName !== 'node_modules' && !baseName.startsWith('.')
          },
          tick: (localPath, _remotePath, error) => {
            if (error) {
              failed.push(localPath)
              this.log('error', `上传失败: ${localPath}`, 'upload')
            } else {
              successful.push(localPath)
              uploadedCount++
              const progress = Math.round((uploadedCount / files.length) * 100)
              this.updateProgress({
                phase: 'upload',
                progress: 50 + progress * 0.4,
                phaseProgress: progress,
                message: `上传中: ${path.basename(localPath)}`,
                filesUploaded: uploadedCount,
                totalFiles: files.length,
              })
            }
          },
        })

        if (failed.length > 0) {
          this.log('warn', `${failed.length} 个文件上传失败`, 'upload')
        }

        this.log('success', `已上传 ${successful.length} 个文件`, 'upload')

        // 执行部署后命令
        if (config.postCommands && config.postCommands.length > 0) {
          this.log('info', '执行部署后命令...', 'process')
          this.updateProgress({
            phase: 'process',
            progress: 92,
            phaseProgress: 0,
            message: '执行部署后命令...',
          })

          for (const cmd of config.postCommands) {
            this.log('info', `执行: ${cmd}`, 'process')
            const result = await ssh.execCommand(cmd, { cwd: config.remotePath })
            if (result.stdout) {
              this.log('info', result.stdout, 'process')
            }
            if (result.stderr) {
              this.log('warn', result.stderr, 'process')
            }
          }
        }

        ssh.dispose()

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
            filesUploaded: successful.length,
            filesFailed: failed.length,
          },
        })
      } catch (error) {
        ssh.dispose()
        throw error
      }
    } catch (error) {
      // 如果 node-ssh 不可用，提示用户安装
      if ((error as Error).message.includes("Cannot find module 'node-ssh'")) {
        return this.createFailedResult(
          'SSH 功能需要安装 node-ssh: npm i node-ssh',
          '请运行: npm install node-ssh 或 pnpm add node-ssh'
        )
      }
      throw error
    }
  }
}
