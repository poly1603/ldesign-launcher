/**
 * Cloudflare Pages 部署适配器
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type {
  DeployResult,
  DeployCallbacks,
  CloudflareDeployConfig,
} from '../../types/deploy'
import { BaseAdapter } from './BaseAdapter'

/**
 * Cloudflare Pages 部署适配器
 */
export class CloudflareAdapter extends BaseAdapter<CloudflareDeployConfig> {
  name = 'cloudflare'
  platform = 'cloudflare' as const
  displayName = 'Cloudflare Pages'
  icon = '☁️'
  description = '部署到 Cloudflare Pages'
  requiresBuild = true

  async validateConfig(config: CloudflareDeployConfig): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    if (!config.apiToken && !process.env.CLOUDFLARE_API_TOKEN) {
      errors.push('需要提供 Cloudflare API 令牌 (apiToken) 或设置 CLOUDFLARE_API_TOKEN 环境变量')
    }

    if (!config.accountId && !process.env.CLOUDFLARE_ACCOUNT_ID) {
      errors.push('需要提供 Cloudflare 账户 ID (accountId) 或设置 CLOUDFLARE_ACCOUNT_ID 环境变量')
    }

    if (!config.projectName) {
      errors.push('需要提供项目名称 (projectName)')
    }

    return { valid: errors.length === 0, errors }
  }

  async deploy(config: CloudflareDeployConfig, callbacks: DeployCallbacks): Promise<DeployResult> {
    this.callbacks = callbacks
    this.isCancelled = false

    const cwd = process.cwd()
    const distDir = this.getDistDir(config, cwd)

    // 验证构建目录
    const distValidation = await this.validateDistDir(distDir)
    if (!distValidation.valid) {
      return this.createFailedResult(distValidation.error!)
    }

    this.log('info', '准备部署到 Cloudflare Pages...', 'prepare')
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
   * 使用 Wrangler CLI 部署
   */
  private async deployWithCli(config: CloudflareDeployConfig, distDir: string): Promise<DeployResult> {
    this.log('info', '使用 Wrangler CLI 部署...', 'upload')
    this.updateProgress({
      phase: 'upload',
      progress: 50,
      phaseProgress: 0,
      message: '正在上传到 Cloudflare Pages...',
    })

    const args = ['wrangler', 'pages', 'deploy', distDir, '--project-name', config.projectName!]

    if (config.branch) {
      args.push('--branch', config.branch)
    }

    if (config.commitMessage) {
      args.push('--commit-message', config.commitMessage)
    }

    const env: Record<string, string> = {}
    const apiToken = config.apiToken || process.env.CLOUDFLARE_API_TOKEN
    const accountId = config.accountId || process.env.CLOUDFLARE_ACCOUNT_ID

    if (apiToken) {
      env.CLOUDFLARE_API_TOKEN = apiToken
    }
    if (accountId) {
      env.CLOUDFLARE_ACCOUNT_ID = accountId
    }

    let deployUrl = ''

    const result = await this.execCommand('npx', args, {
      env,
      onStdout: (data) => {
        const lines = data.split('\n').filter(Boolean)
        for (const line of lines) {
          const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim()
          if (cleanLine) {
            this.log('info', cleanLine, 'upload')

            // 解析 URL
            const urlMatch = cleanLine.match(/(https?:\/\/[^\s]+\.pages\.dev)/)
            if (urlMatch) {
              deployUrl = urlMatch[1]
            }

            // 解析进度
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
      return this.createFailedResult('Cloudflare Pages 部署失败', result.stderr)
    }

    return this.createSuccessResult(deployUrl)
  }
}
