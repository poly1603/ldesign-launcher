/**
 * Surge 部署适配器
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type {
  DeployResult,
  DeployCallbacks,
  SurgeDeployConfig,
} from '../../types/deploy'
import { BaseAdapter } from './BaseAdapter'

/**
 * Surge 部署适配器
 */
export class SurgeAdapter extends BaseAdapter<SurgeDeployConfig> {
  name = 'surge'
  platform = 'surge' as const
  displayName = 'Surge'
  icon = '⚡'
  description = '部署到 Surge.sh'
  requiresBuild = true

  async validateConfig(config: SurgeDeployConfig): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    if (!config.token && !process.env.SURGE_TOKEN) {
      errors.push('需要提供 Surge Token (token) 或设置 SURGE_TOKEN 环境变量。运行 `surge token` 获取')
    }

    if (!config.domain) {
      errors.push('需要提供域名 (domain)，例如: your-site.surge.sh')
    }

    return { valid: errors.length === 0, errors }
  }

  async deploy(config: SurgeDeployConfig, callbacks: DeployCallbacks): Promise<DeployResult> {
    this.callbacks = callbacks
    this.isCancelled = false

    const cwd = process.cwd()
    const distDir = this.getDistDir(config, cwd)

    // 验证构建目录
    const distValidation = await this.validateDistDir(distDir)
    if (!distValidation.valid) {
      return this.createFailedResult(distValidation.error!)
    }

    this.log('info', '准备部署到 Surge...', 'prepare')
    this.updateProgress({
      phase: 'prepare',
      progress: 45,
      phaseProgress: 0,
      message: '准备上传文件...',
    })

    try {
      const files = await this.getFilesToUpload(distDir)
      const totalSize = this.calculateTotalSize(files)
      this.log('info', `共 ${files.length} 个文件，总大小 ${this.formatSize(totalSize)}`, 'prepare')

      return await this.deployWithCli(config, distDir)
    } catch (error) {
      return this.createFailedResult((error as Error).message, (error as Error).stack)
    }
  }

  /**
   * 使用 Surge CLI 部署
   */
  private async deployWithCli(config: SurgeDeployConfig, distDir: string): Promise<DeployResult> {
    this.log('info', '使用 Surge CLI 部署...', 'upload')
    this.updateProgress({
      phase: 'upload',
      progress: 50,
      phaseProgress: 0,
      message: '正在上传到 Surge...',
    })

    const args = ['surge', distDir, config.domain!]

    const env: Record<string, string> = {}
    const token = config.token || process.env.SURGE_TOKEN
    if (token) {
      env.SURGE_TOKEN = token
    }

    const result = await this.execCommand('npx', args, {
      env,
      onStdout: (data) => {
        const lines = data.split('\n').filter(Boolean)
        for (const line of lines) {
          const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim()
          if (cleanLine) {
            this.log('info', cleanLine, 'upload')

            if (cleanLine.includes('Uploading')) {
              this.updateProgress({
                phase: 'upload',
                progress: 60,
                phaseProgress: 30,
                message: '正在上传文件...',
              })
            } else if (cleanLine.includes('Success')) {
              this.updateProgress({
                phase: 'complete',
                progress: 100,
                phaseProgress: 100,
                message: '部署完成！',
              })
            }
          }
        }
      },
      onStderr: (data) => {
        const lines = data.split('\n').filter(Boolean)
        for (const line of lines) {
          const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim()
          if (cleanLine && !cleanLine.includes('npm warn')) {
            this.log('warn', cleanLine, 'upload')
          }
        }
      },
    })

    if (result.code !== 0) {
      return this.createFailedResult('Surge 部署失败', result.stderr)
    }

    const deployUrl = config.domain!.startsWith('http') ? config.domain! : `https://${config.domain}`

    return this.createSuccessResult(deployUrl)
  }
}
