/**
 * Vercel 部署适配器
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type {
  DeployCallbacks,
  DeployResult,
  VercelDeployConfig,
} from '../../types/deploy'
import { BaseAdapter } from './BaseAdapter'

/**
 * Vercel 部署适配器
 */
export class VercelAdapter extends BaseAdapter<VercelDeployConfig> {
  name = 'vercel'
  platform = 'vercel' as const
  displayName = 'Vercel'
  icon = '▲'
  description = '部署到 Vercel'
  requiresBuild = true

  async validateConfig(config: VercelDeployConfig): Promise<{ valid: boolean, errors: string[] }> {
    const errors: string[] = []

    if (!config.token && !process.env.VERCEL_TOKEN) {
      errors.push('需要提供 Vercel 访问令牌 (token) 或设置 VERCEL_TOKEN 环境变量')
    }

    return { valid: errors.length === 0, errors }
  }

  async deploy(config: VercelDeployConfig, callbacks: DeployCallbacks): Promise<DeployResult> {
    this.callbacks = callbacks
    this.isCancelled = false

    const cwd = process.cwd()
    const distDir = this.getDistDir(config, cwd)

    // 验证构建目录
    const distValidation = await this.validateDistDir(distDir)
    if (!distValidation.valid) {
      return this.createFailedResult(distValidation.error!)
    }

    this.log('info', '准备部署到 Vercel...', 'prepare')
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
    }
    catch (error) {
      return this.createFailedResult((error as Error).message, (error as Error).stack)
    }
  }

  /**
   * 使用 Vercel CLI 部署
   */
  private async deployWithCli(config: VercelDeployConfig, distDir: string): Promise<DeployResult> {
    this.log('info', '使用 Vercel CLI 部署...', 'upload')
    this.updateProgress({
      phase: 'upload',
      progress: 50,
      phaseProgress: 0,
      message: '正在上传到 Vercel...',
    })

    const args = ['vercel', distDir, '--yes']

    if (config.prod) {
      args.push('--prod')
    }

    if (config.projectName) {
      args.push('--name', config.projectName)
    }

    const token = config.token || process.env.VERCEL_TOKEN
    if (token) {
      args.push('--token', token)
    }

    // 添加环境变量
    if (config.env) {
      for (const [key, value] of Object.entries(config.env)) {
        args.push('--env', `${key}=${value}`)
      }
    }

    let deployUrl = ''

    const result = await this.execCommand('npx', args, {
      onStdout: (data) => {
        const lines = data.split('\n').filter(Boolean)
        for (const line of lines) {
          const cleanLine = line.replace(/\x1B\[[0-9;]*m/g, '').trim()
          if (cleanLine) {
            this.log('info', cleanLine, 'upload')

            // 解析 URL
            const urlMatch = cleanLine.match(/(https?:\/\/\S+\.vercel\.app)/)
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
            }
            else if (cleanLine.includes('Building')) {
              this.updateProgress({
                phase: 'process',
                progress: 75,
                phaseProgress: 50,
                message: 'Vercel 构建中...',
              })
            }
            else if (cleanLine.includes('Ready')) {
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
          const cleanLine = line.replace(/\x1B\[[0-9;]*m/g, '').trim()
          if (cleanLine && !cleanLine.includes('npm warn')) {
            this.log('warn', cleanLine, 'upload')
          }
        }
      },
    })

    if (result.code !== 0) {
      return this.createFailedResult('Vercel CLI 部署失败', result.stderr)
    }

    return this.createSuccessResult(deployUrl)
  }
}
