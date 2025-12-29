/**
 * 自定义命令部署适配器
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type {
  CustomDeployConfig,
  DeployCallbacks,
  DeployResult,
} from '../../types/deploy'
import { BaseAdapter } from './BaseAdapter'

/**
 * 自定义命令部署适配器
 *
 * 支持执行任意部署命令
 */
export class CustomAdapter extends BaseAdapter<CustomDeployConfig> {
  name = 'custom'
  platform = 'custom' as const
  displayName = '自定义命令'
  icon = '⚙️'
  description = '使用自定义命令部署'
  requiresBuild = true

  async validateConfig(config: CustomDeployConfig): Promise<{ valid: boolean, errors: string[] }> {
    const errors: string[] = []

    if (!config.command) {
      errors.push('需要提供部署命令 (command)')
    }

    return { valid: errors.length === 0, errors }
  }

  async deploy(config: CustomDeployConfig, callbacks: DeployCallbacks): Promise<DeployResult> {
    this.callbacks = callbacks
    this.isCancelled = false

    this.log('info', '准备执行自定义部署命令...', 'prepare')
    this.updateProgress({
      phase: 'prepare',
      progress: 45,
      phaseProgress: 0,
      message: '准备执行部署命令...',
    })

    try {
      return await this.executeCustomCommand(config)
    }
    catch (error) {
      return this.createFailedResult((error as Error).message, (error as Error).stack)
    }
  }

  /**
   * 执行自定义命令
   */
  private async executeCustomCommand(config: CustomDeployConfig): Promise<DeployResult> {
    const cwd = config.cwd || process.cwd()
    const command = config.command
    const args = config.args || []

    this.log('info', `执行命令: ${command} ${args.join(' ')}`, 'upload')
    this.log('info', `工作目录: ${cwd}`, 'upload')
    this.updateProgress({
      phase: 'upload',
      progress: 50,
      phaseProgress: 0,
      message: '正在执行部署命令...',
    })

    // 解析命令
    let cmd: string
    let cmdArgs: string[]

    if (args.length > 0) {
      cmd = command
      cmdArgs = args
    }
    else {
      // 尝试解析命令字符串
      const parts = command.split(/\s+/)
      cmd = parts[0]
      cmdArgs = parts.slice(1)
    }

    // 处理 npm/pnpm/yarn 命令
    if (['npm', 'pnpm', 'yarn'].includes(cmd)) {
      cmdArgs = ['run', ...cmdArgs]
    }

    let hasOutput = false

    const result = await this.execCommand(cmd, cmdArgs, {
      cwd,
      env: config.env,
      onStdout: (data) => {
        const lines = data.split('\n').filter(Boolean)
        for (const line of lines) {
          const cleanLine = line.replace(/\x1B\[[0-9;]*m/g, '').trim()
          if (cleanLine) {
            hasOutput = true
            this.log('info', cleanLine, 'upload')

            // 尝试解析进度
            if (cleanLine.includes('%')) {
              const match = cleanLine.match(/(\d+)%/)
              if (match) {
                const progress = Number.parseInt(match[1], 10)
                this.updateProgress({
                  phase: 'upload',
                  progress: 50 + progress * 0.45,
                  phaseProgress: progress,
                  message: cleanLine.slice(0, 100),
                })
              }
            }
          }
        }
      },
      onStderr: (data) => {
        const lines = data.split('\n').filter(Boolean)
        for (const line of lines) {
          const cleanLine = line.replace(/\x1B\[[0-9;]*m/g, '').trim()
          if (cleanLine) {
            if (cleanLine.toLowerCase().includes('error')) {
              this.log('error', cleanLine, 'upload')
            }
            else {
              this.log('warn', cleanLine, 'upload')
            }
          }
        }
      },
    })

    if (result.code !== 0) {
      return this.createFailedResult(
        `命令执行失败，退出码: ${result.code}`,
        result.stderr || result.stdout,
      )
    }

    this.updateProgress({
      phase: 'complete',
      progress: 100,
      phaseProgress: 100,
      message: '部署完成！',
    })

    // 尝试从输出中提取 URL
    let deployUrl: string | undefined
    const urlMatch = result.stdout.match(/(https?:\/\/\S+)/g)
    if (urlMatch && urlMatch.length > 0) {
      // 取最后一个 URL（通常是部署后的地址）
      deployUrl = urlMatch[urlMatch.length - 1]
    }

    return this.createSuccessResult(deployUrl, {
      platformInfo: {
        command: config.command,
        hasOutput,
      },
    })
  }
}
