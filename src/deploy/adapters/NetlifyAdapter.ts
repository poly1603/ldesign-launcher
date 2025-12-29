/**
 * Netlify 部署适配器
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type {
  DeployCallbacks,
  DeployResult,
  NetlifyDeployConfig,
} from '../../types/deploy'
import { BaseAdapter } from './BaseAdapter'

/**
 * Netlify 部署适配器
 *
 * 支持通过 Netlify CLI 或 API 部署
 */
export class NetlifyAdapter extends BaseAdapter<NetlifyDeployConfig> {
  name = 'netlify'
  platform = 'netlify' as const
  displayName = 'Netlify'
  icon = '🔷'
  description = '部署到 Netlify'
  requiresBuild = true

  async validateConfig(config: NetlifyDeployConfig): Promise<{ valid: boolean, errors: string[] }> {
    const errors: string[] = []

    if (!config.authToken && !process.env.NETLIFY_AUTH_TOKEN) {
      errors.push('需要提供 Netlify 访问令牌 (authToken) 或设置 NETLIFY_AUTH_TOKEN 环境变量')
    }

    return { valid: errors.length === 0, errors }
  }

  async deploy(config: NetlifyDeployConfig, callbacks: DeployCallbacks): Promise<DeployResult> {
    this.callbacks = callbacks
    this.isCancelled = false

    const cwd = process.cwd()
    const distDir = this.getDistDir(config, cwd)

    // 验证构建目录
    const distValidation = await this.validateDistDir(distDir)
    if (!distValidation.valid) {
      return this.createFailedResult(distValidation.error!)
    }

    this.log('info', '准备部署到 Netlify...', 'prepare')
    this.updateProgress({
      phase: 'prepare',
      progress: 45,
      phaseProgress: 0,
      message: '准备上传文件...',
    })

    try {
      // 获取文件列表
      const files = await this.getFilesToUpload(distDir)
      const totalSize = this.calculateTotalSize(files)
      this.log('info', `共 ${files.length} 个文件，总大小 ${this.formatSize(totalSize)}`, 'prepare')

      // 检查是否安装了 netlify-cli
      const hasNetlifyCli = await this.checkNetlifyCli()

      if (hasNetlifyCli) {
        return await this.deployWithCli(config, distDir, files.length)
      }
      else {
        return await this.deployWithApi(config, distDir, files)
      }
    }
    catch (error) {
      return this.createFailedResult((error as Error).message, (error as Error).stack)
    }
  }

  /**
   * 检查是否安装了 netlify-cli
   */
  private async checkNetlifyCli(): Promise<boolean> {
    try {
      const result = await this.execCommand('npx', ['netlify', '--version'])
      return result.code === 0
    }
    catch {
      return false
    }
  }

  /**
   * 使用 CLI 部署
   */
  private async deployWithCli(
    config: NetlifyDeployConfig,
    distDir: string,
    fileCount: number,
  ): Promise<DeployResult> {
    this.log('info', '使用 Netlify CLI 部署...', 'upload')
    this.updateProgress({
      phase: 'upload',
      progress: 50,
      phaseProgress: 0,
      message: '正在上传到 Netlify...',
    })

    const args = ['netlify', 'deploy', '--dir', distDir]

    if (config.prod) {
      args.push('--prod')
    }

    if (config.siteId) {
      args.push('--site', config.siteId)
    }

    if (config.alias) {
      args.push('--alias', config.alias)
    }

    if (config.functionsDir) {
      args.push('--functions', config.functionsDir)
    }

    const authToken = config.authToken || process.env.NETLIFY_AUTH_TOKEN
    const env: Record<string, string> = {}
    if (authToken) {
      env.NETLIFY_AUTH_TOKEN = authToken
    }

    let deployUrl = ''
    let siteUrl = ''

    const result = await this.execCommand('npx', args, {
      env,
      onStdout: (data) => {
        const lines = data.split('\n').filter(Boolean)
        for (const line of lines) {
          const cleanLine = line.replace(/\x1B\[[0-9;]*m/g, '').trim()
          if (cleanLine) {
            this.log('info', cleanLine, 'upload')

            // 解析 URL
            const draftMatch = cleanLine.match(/Website Draft URL:\s*(https?:\/\/\S+)/)
            const prodMatch = cleanLine.match(/Website URL:\s*(https?:\/\/\S+)/)
            const uniqueMatch = cleanLine.match(/Unique Deploy URL:\s*(https?:\/\/\S+)/)

            if (draftMatch)
              deployUrl = draftMatch[1]
            if (prodMatch)
              siteUrl = prodMatch[1]
            if (uniqueMatch)
              deployUrl = uniqueMatch[1]

            // 解析进度
            if (cleanLine.includes('Uploading')) {
              this.updateProgress({
                phase: 'upload',
                progress: 60,
                phaseProgress: 30,
                message: '正在上传文件...',
                totalFiles: fileCount,
              })
            }
            else if (cleanLine.includes('Deploy is live')) {
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
      return this.createFailedResult('Netlify CLI 部署失败', result.stderr)
    }

    return this.createSuccessResult(config.prod ? siteUrl : deployUrl, {
      previewUrl: deployUrl,
      platformInfo: {
        siteUrl,
        deployUrl,
      },
    })
  }

  /**
   * 使用 API 部署
   */
  private async deployWithApi(
    config: NetlifyDeployConfig,
    distDir: string,
    files: { relativePath: string, absolutePath: string, size: number }[],
  ): Promise<DeployResult> {
    this.log('info', '使用 Netlify API 部署...', 'upload')

    // 这里实现直接调用 Netlify API
    // 由于需要复杂的文件上传逻辑，建议用户安装 netlify-cli
    this.log('warn', '建议安装 netlify-cli 以获得更好的部署体验: npm i -g netlify-cli', 'upload')

    // 使用 npx 临时安装并执行
    return this.deployWithCli(config, distDir, files.length)
  }
}
