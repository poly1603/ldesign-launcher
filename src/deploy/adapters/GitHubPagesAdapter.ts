/**
 * GitHub Pages 部署适配器
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type {
  DeployCallbacks,
  DeployResult,
  GitHubPagesDeployConfig,
} from '../../types/deploy'
import path from 'node:path'
import fs from 'fs-extra'
import { BaseAdapter } from './BaseAdapter'

/**
 * GitHub Pages 部署适配器
 */
export class GitHubPagesAdapter extends BaseAdapter<GitHubPagesDeployConfig> {
  name = 'github-pages'
  platform = 'github-pages' as const
  displayName = 'GitHub Pages'
  icon = '🐙'
  description = '部署到 GitHub Pages'
  requiresBuild = true

  async validateConfig(config: GitHubPagesDeployConfig): Promise<{ valid: boolean, errors: string[] }> {
    const errors: string[] = []

    if (!config.token && !process.env.GITHUB_TOKEN && !process.env.GH_TOKEN) {
      errors.push('需要提供 GitHub Token (token) 或设置 GITHUB_TOKEN 环境变量')
    }

    if (!config.repo) {
      errors.push('需要提供仓库名称 (repo)，格式: owner/repo')
    }
    else if (!config.repo.includes('/')) {
      errors.push('仓库名称格式错误，应为: owner/repo')
    }

    return { valid: errors.length === 0, errors }
  }

  async deploy(config: GitHubPagesDeployConfig, callbacks: DeployCallbacks): Promise<DeployResult> {
    this.callbacks = callbacks
    this.isCancelled = false

    const cwd = process.cwd()
    const distDir = this.getDistDir(config, cwd)

    // 验证构建目录
    const distValidation = await this.validateDistDir(distDir)
    if (!distValidation.valid) {
      return this.createFailedResult(distValidation.error!)
    }

    this.log('info', '准备部署到 GitHub Pages...', 'prepare')
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

      // 添加 .nojekyll 文件
      if (config.nojekyll !== false) {
        const nojekyllPath = path.join(distDir, '.nojekyll')
        if (!await fs.pathExists(nojekyllPath)) {
          await fs.writeFile(nojekyllPath, '')
          this.log('info', '添加 .nojekyll 文件', 'prepare')
        }
      }

      // 添加 CNAME 文件
      if (config.cname) {
        const cnamePath = path.join(distDir, 'CNAME')
        await fs.writeFile(cnamePath, config.cname)
        this.log('info', `添加 CNAME 文件: ${config.cname}`, 'prepare')
      }

      return await this.deployWithGhPages(config, distDir)
    }
    catch (error) {
      return this.createFailedResult((error as Error).message, (error as Error).stack)
    }
  }

  /**
   * 使用 gh-pages 包部署
   */
  private async deployWithGhPages(config: GitHubPagesDeployConfig, distDir: string): Promise<DeployResult> {
    this.log('info', '使用 gh-pages 部署...', 'upload')
    this.updateProgress({
      phase: 'upload',
      progress: 50,
      phaseProgress: 0,
      message: '正在上传到 GitHub Pages...',
    })

    const token = config.token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN
    const branch = config.branch || 'gh-pages'
    const [owner, repoName] = config.repo!.split('/')
    const commitMessage = config.commitMessage || `Deploy to GitHub Pages - ${new Date().toISOString()}`

    // 使用 gh-pages CLI
    const args = [
      'gh-pages',
      '-d',
      distDir,
      '-b',
      branch,
      '-m',
      commitMessage,
    ]

    if (token) {
      // 设置远程仓库 URL 带 token
      args.push('-r', `https://x-access-token:${token}@github.com/${owner}/${repoName}.git`)
    }

    let deployUrl = ''

    const result = await this.execCommand('npx', args, {
      onStdout: (data) => {
        const lines = data.split('\n').filter(Boolean)
        for (const line of lines) {
          const cleanLine = line.replace(/\x1B\[[0-9;]*m/g, '').trim()
          if (cleanLine) {
            this.log('info', cleanLine, 'upload')

            if (cleanLine.includes('Cloning')) {
              this.updateProgress({
                phase: 'upload',
                progress: 55,
                phaseProgress: 10,
                message: '克隆仓库...',
              })
            }
            else if (cleanLine.includes('Copying')) {
              this.updateProgress({
                phase: 'upload',
                progress: 65,
                phaseProgress: 40,
                message: '复制文件...',
              })
            }
            else if (cleanLine.includes('Pushing')) {
              this.updateProgress({
                phase: 'upload',
                progress: 80,
                phaseProgress: 70,
                message: '推送到 GitHub...',
              })
            }
            else if (cleanLine.includes('Published')) {
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
      return this.createFailedResult('GitHub Pages 部署失败', result.stderr)
    }

    // 构建部署 URL
    if (config.cname) {
      deployUrl = `https://${config.cname}`
    }
    else {
      // 判断是否是 username.github.io 仓库
      if (repoName === `${owner}.github.io`) {
        deployUrl = `https://${owner}.github.io`
      }
      else {
        deployUrl = `https://${owner}.github.io/${repoName}`
      }
    }

    return this.createSuccessResult(deployUrl, {
      platformInfo: {
        repo: config.repo,
        branch,
      },
    })
  }
}
