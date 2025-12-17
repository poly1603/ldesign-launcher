/**
 * launcher deploy 命令
 *
 * 支持部署到多种平台：
 * - 云平台：Netlify, Vercel, Cloudflare Pages, GitHub Pages, Surge
 * - 自定义服务器：FTP, SFTP, SSH/SCP
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type { CliContext } from '../../types'
import type { DeployPlatform, DeployConfig, DeployProgress, DeployLogEntry } from '../../types/deploy'
import chalk from 'chalk'
import boxen from 'boxen'
import ora from 'ora'
import inquirer from 'inquirer'
import { DeployService } from '../../deploy/DeployService'
import { DeployManager } from '../../deploy/DeployManager'
import { SUPPORTED_PLATFORMS, getPlatformInfo } from '../../deploy/adapters'

interface DeployCommandOptions {
  platform?: string
  config?: string
  prod?: boolean
  preview?: boolean
  build?: boolean
  noBuild?: boolean
  open?: boolean
  token?: string
  site?: string
  host?: string
  port?: number
  username?: string
  password?: string
  key?: string
  path?: string
  clean?: boolean
  list?: boolean
  history?: boolean
  interactive?: boolean
}

/**
 * 显示部署 Banner
 */
function showBanner(): void {
  const banner = boxen(
    `
${chalk.bold.cyan('🚀 LDesign Launcher Deploy')}

${chalk.gray('支持的平台:')}
${SUPPORTED_PLATFORMS.map(p => `  ${p.icon} ${p.name}`).join('\n')}
`.trim(),
    {
      padding: 1,
      margin: { top: 1, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'cyan',
    }
  )
  console.log(banner)
}

/**
 * 显示进度条
 */
function showProgress(progress: DeployProgress): void {
  const filled = Math.round(progress.progress / 5)
  const empty = 20 - filled
  const bar = chalk.cyan('█'.repeat(filled)) + chalk.gray('░'.repeat(empty))

  const filesInfo = progress.totalFiles
    ? ` [${progress.filesUploaded || 0}/${progress.totalFiles}]`
    : ''

  const sizeInfo = progress.totalBytes
    ? ` ${formatSize(progress.bytesUploaded || 0)}/${formatSize(progress.totalBytes)}`
    : ''

  process.stdout.write(`\r${bar} ${progress.progress}%${filesInfo}${sizeInfo} - ${progress.message}`.padEnd(80))
}

/**
 * 格式化文件大小
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

/**
 * 交互式选择部署平台
 */
async function selectPlatform(): Promise<DeployPlatform> {
  const { platform } = await inquirer.prompt([
    {
      type: 'list',
      name: 'platform',
      message: '选择部署平台:',
      choices: SUPPORTED_PLATFORMS.map(p => ({
        name: `${p.icon} ${p.name} - ${p.description}`,
        value: p.id,
      })),
    },
  ])
  return platform
}

/**
 * 交互式收集平台配置
 */
async function collectPlatformConfig(platform: DeployPlatform): Promise<Partial<DeployConfig>> {
  const platformInfo = getPlatformInfo(platform)
  if (!platformInfo) {
    throw new Error(`未知平台: ${platform}`)
  }

  const config: Record<string, unknown> = { platform }

  // 收集必填字段
  const requiredFields = platformInfo.configFields.filter(f => f.required)
  if (requiredFields.length > 0) {
    console.log(chalk.yellow(`\n📋 配置 ${platformInfo.name}:\n`))

    for (const field of requiredFields) {
      // 先检查环境变量
      if (field.envVar && process.env[field.envVar]) {
        console.log(chalk.gray(`  ${field.label}: (已从环境变量 ${field.envVar} 获取)`))
        config[field.name] = process.env[field.envVar]
        continue
      }

      const { value } = await inquirer.prompt([
        {
          type: field.type === 'password' ? 'password' : 'input',
          name: 'value',
          message: `${field.label}:`,
          default: field.default as string,
          validate: (input: string) => {
            if (field.required && !input) {
              return `${field.label} 是必填项`
            }
            if (field.pattern && !new RegExp(field.pattern).test(input)) {
              return `${field.label} 格式不正确`
            }
            return true
          },
        },
      ])
      config[field.name] = value
    }
  }

  // 询问可选配置
  const optionalFields = platformInfo.configFields.filter(f => !f.required)
  if (optionalFields.length > 0) {
    const { configureOptional } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'configureOptional',
        message: '是否配置高级选项?',
        default: false,
      },
    ])

    if (configureOptional) {
      for (const field of optionalFields) {
        if (field.type === 'boolean') {
          const { value } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'value',
              message: `${field.label}:`,
              default: field.default as boolean,
            },
          ])
          config[field.name] = value
        } else {
          const { value } = await inquirer.prompt([
            {
              type: field.type === 'password' ? 'password' : 'input',
              name: 'value',
              message: `${field.label} (可选):`,
              default: field.default as string,
            },
          ])
          if (value) {
            config[field.name] = value
          }
        }
      }
    }
  }

  return config as Partial<DeployConfig>
}

/**
 * 部署命令处理类
 */
export class DeployCommand {
  name = 'deploy'
  description = '部署项目到指定平台'
  options = [
    { name: 'platform', alias: 'p', description: '部署平台 (netlify, vercel, cloudflare, github-pages, surge, ftp, sftp, ssh, custom)', type: 'string' as const },
    { name: 'config', alias: 'c', description: '使用保存的配置名称', type: 'string' as const },
    { name: 'prod', description: '部署到生产环境', type: 'boolean' as const },
    { name: 'preview', description: '部署为预览版本', type: 'boolean' as const },
    { name: 'build', alias: 'b', description: '部署前构建项目', type: 'boolean' as const, default: true },
    { name: 'no-build', description: '跳过构建步骤', type: 'boolean' as const },
    { name: 'open', alias: 'o', description: '部署后打开浏览器', type: 'boolean' as const },
    { name: 'token', alias: 't', description: '平台访问令牌', type: 'string' as const },
    { name: 'site', alias: 's', description: '站点 ID 或名称', type: 'string' as const },
    { name: 'host', description: '服务器地址 (FTP/SFTP/SSH)', type: 'string' as const },
    { name: 'port', description: '服务器端口', type: 'string' as const },
    { name: 'username', alias: 'u', description: '用户名', type: 'string' as const },
    { name: 'password', description: '密码', type: 'string' as const },
    { name: 'key', alias: 'k', description: '私钥路径', type: 'string' as const },
    { name: 'path', description: '远程目录路径', type: 'string' as const },
    { name: 'clean', description: '清空远程目录', type: 'boolean' as const },
    { name: 'list', alias: 'l', description: '列出已保存的配置', type: 'boolean' as const },
    { name: 'history', description: '查看部署历史', type: 'boolean' as const },
    { name: 'interactive', alias: 'i', description: '交互式部署', type: 'boolean' as const },
  ]

  async handler(ctx: CliContext): Promise<void> {
    const options = ctx.options as DeployCommandOptions
    const cwd = ctx.cwd

    // 显示 Banner
    showBanner()

    const deployManager = new DeployManager(cwd)
    const deployService = new DeployService({ cwd })

    // 列出已保存的配置
    if (options.list) {
      await this.listConfigs(deployManager)
      return
    }

    // 显示部署历史
    if (options.history) {
      await this.showHistory(deployService)
      return
    }

    let deployConfig: DeployConfig

    // 使用保存的配置
    if (options.config) {
      const savedConfig = deployManager.getConfig(options.config)
      if (!savedConfig) {
        console.log(chalk.red(`\n❌ 未找到配置: ${options.config}`))
        console.log(chalk.gray('使用 --list 查看已保存的配置'))
        return
      }
      deployConfig = savedConfig.config as DeployConfig
      console.log(chalk.green(`\n✅ 使用配置: ${savedConfig.name}`))
    }
    // 交互式模式
    else if (options.interactive || !options.platform) {
      const platform = await selectPlatform()
      const config = await collectPlatformConfig(platform)

      // 询问是否保存配置
      const { shouldSave } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldSave',
          message: '是否保存此配置以便下次使用?',
          default: false,
        },
      ])

      if (shouldSave) {
        const { configName } = await inquirer.prompt([
          {
            type: 'input',
            name: 'configName',
            message: '配置名称:',
            default: `${platform}-default`,
          },
        ])
        await deployManager.saveConfig(configName, platform, config, true)
        console.log(chalk.green(`✅ 配置已保存: ${configName}`))
      }

      deployConfig = {
        ...config,
        platform,
        buildBeforeDeploy: options.build !== false && !options.noBuild,
        openAfterDeploy: options.open,
      } as DeployConfig
    }
    // 命令行参数模式
    else {
      const platform = options.platform as DeployPlatform
      const platformInfo = getPlatformInfo(platform)

      if (!platformInfo) {
        console.log(chalk.red(`\n❌ 不支持的平台: ${platform}`))
        console.log(chalk.gray('支持的平台: ' + SUPPORTED_PLATFORMS.map(p => p.id).join(', ')))
        return
      }

      deployConfig = this.buildConfigFromOptions(platform, options)
    }

    // 验证配置
    console.log(chalk.cyan('\n🔍 验证配置...'))
    const validation = await deployService.validateConfig(deployConfig)
    if (!validation.valid) {
      console.log(chalk.red('\n❌ 配置验证失败:'))
      validation.errors.forEach(err => console.log(chalk.red(`  - ${err}`)))
      return
    }
    console.log(chalk.green('✅ 配置验证通过'))

    // 确认部署
    const platformInfo = getPlatformInfo(deployConfig.platform)
    console.log(chalk.cyan(`\n📦 准备部署到 ${platformInfo?.icon || ''} ${platformInfo?.name || deployConfig.platform}`))

    const { confirmDeploy } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmDeploy',
        message: '确认开始部署?',
        default: true,
      },
    ])

    if (!confirmDeploy) {
      console.log(chalk.yellow('\n⚠️ 部署已取消'))
      return
    }

    // 执行部署
    console.log(chalk.cyan('\n🚀 开始部署...\n'))

    const spinner = ora({ spinner: 'dots' }).start()

    // 监听进度
    deployService.on('progress', (progress: DeployProgress) => {
      spinner.stop()
      showProgress(progress)
    })

    // 监听日志
    deployService.on('log', (entry: DeployLogEntry) => {
      spinner.stop()
      process.stdout.write('\n')
      const prefix = {
        info: chalk.blue('ℹ'),
        warn: chalk.yellow('⚠'),
        error: chalk.red('✖'),
        success: chalk.green('✔'),
        debug: chalk.gray('🔧'),
      }[entry.level]
      console.log(`${prefix} ${entry.message}`)
    })

    // 监听状态变化
    deployService.on('status', (status: string) => {
      if (status === 'building') {
        spinner.text = '构建中...'
        spinner.start()
      } else if (status === 'uploading') {
        spinner.text = '上传中...'
        spinner.start()
      }
    })

    try {
      const result = await deployService.deploy(deployConfig)
      spinner.stop()
      process.stdout.write('\n\n')

      if (result.success) {
        const successBox = boxen(
          `
${chalk.bold.green('✨ 部署成功！')}

${result.url ? chalk.cyan(`🌐 URL: ${result.url}`) : ''}
${result.previewUrl && result.previewUrl !== result.url ? chalk.gray(`👀 预览: ${result.previewUrl}`) : ''}
${result.duration ? chalk.gray(`⏱️  用时: ${(result.duration / 1000).toFixed(1)}s`) : ''}
`.trim(),
          {
            padding: 1,
            margin: { top: 1, bottom: 1, left: 0, right: 0 },
            borderStyle: 'round',
            borderColor: 'green',
          }
        )
        console.log(successBox)

        // 复制 URL 到剪贴板
        if (result.url) {
          try {
            const { default: clipboardy } = await import('clipboardy')
            await clipboardy.write(result.url)
            console.log(chalk.gray('📋 URL 已复制到剪贴板'))
          } catch {
            // 剪贴板不可用
          }
        }
      } else {
        const failBox = boxen(
          `
${chalk.bold.red('❌ 部署失败')}

${chalk.red(result.error || '未知错误')}
${result.errorDetails ? chalk.gray(result.errorDetails.slice(0, 200)) : ''}
`.trim(),
          {
            padding: 1,
            margin: { top: 1, bottom: 1, left: 0, right: 0 },
            borderStyle: 'round',
            borderColor: 'red',
          }
        )
        console.log(failBox)
      }
    } catch (error) {
      spinner.stop()
      console.log(chalk.red(`\n❌ 部署出错: ${(error as Error).message}`))
    }
  }

  /**
   * 从命令行选项构建配置
   */
  private buildConfigFromOptions(platform: DeployPlatform, options: DeployCommandOptions): DeployConfig {
    const base = {
      platform,
      buildBeforeDeploy: options.build !== false && !options.noBuild,
      openAfterDeploy: options.open,
    }

    switch (platform) {
      case 'netlify':
        return {
          ...base,
          platform: 'netlify',
          authToken: options.token,
          siteId: options.site,
          prod: options.prod,
        }

      case 'vercel':
        return {
          ...base,
          platform: 'vercel',
          token: options.token,
          projectName: options.site,
          prod: options.prod,
        }

      case 'cloudflare':
        return {
          ...base,
          platform: 'cloudflare',
          apiToken: options.token,
          projectName: options.site,
        }

      case 'github-pages':
        return {
          ...base,
          platform: 'github-pages',
          token: options.token,
          repo: options.site,
        }

      case 'surge':
        return {
          ...base,
          platform: 'surge',
          token: options.token,
          domain: options.site,
        }

      case 'ftp':
        return {
          ...base,
          platform: 'ftp',
          host: options.host || '',
          port: options.port || 21,
          username: options.username || '',
          password: options.password || '',
          remotePath: options.path || '',
          cleanRemote: options.clean,
        }

      case 'sftp':
        return {
          ...base,
          platform: 'sftp',
          host: options.host || '',
          port: options.port || 22,
          username: options.username || '',
          password: options.password,
          privateKey: options.key,
          remotePath: options.path || '',
          cleanRemote: options.clean,
        }

      case 'ssh':
        return {
          ...base,
          platform: 'ssh',
          host: options.host || '',
          port: options.port || 22,
          username: options.username || '',
          password: options.password,
          privateKey: options.key,
          remotePath: options.path || '',
          cleanRemote: options.clean,
        }

      case 'custom':
        return {
          ...base,
          platform: 'custom',
          command: options.path || '',
        }

      default:
        throw new Error(`未知平台: ${platform}`)
    }
  }

  /**
   * 列出保存的配置
   */
  private async listConfigs(manager: DeployManager): Promise<void> {
    const configs = manager.getSavedConfigs()

    if (configs.length === 0) {
      console.log(chalk.yellow('\n📭 暂无保存的配置'))
      console.log(chalk.gray('使用 launcher deploy -i 交互式创建配置'))
      return
    }

    console.log(chalk.cyan('\n📋 已保存的配置:\n'))

    for (const config of configs) {
      const platformInfo = getPlatformInfo(config.platform)
      const defaultTag = config.isDefault ? chalk.green(' [默认]') : ''
      const lastDeploy = config.lastDeployAt
        ? chalk.gray(` (上次部署: ${new Date(config.lastDeployAt).toLocaleString()})`)
        : ''

      console.log(`  ${platformInfo?.icon || '📦'} ${chalk.bold(config.name)}${defaultTag}`)
      console.log(`     平台: ${platformInfo?.name || config.platform}${lastDeploy}`)
    }

    console.log(chalk.gray('\n使用: launcher deploy --config <配置名称>'))
  }

  /**
   * 显示部署历史
   */
  private async showHistory(service: DeployService): Promise<void> {
    const history = service.getHistory()

    if (history.length === 0) {
      console.log(chalk.yellow('\n📭 暂无部署历史'))
      return
    }

    console.log(chalk.cyan('\n📜 部署历史:\n'))

    for (const entry of history.slice(0, 10)) {
      const platformInfo = getPlatformInfo(entry.platform)
      const statusIcon = ({
        success: chalk.green('✔'),
        failed: chalk.red('✖'),
        cancelled: chalk.yellow('⚠'),
        idle: chalk.gray('○'),
        preparing: chalk.blue('◐'),
        building: chalk.cyan('◑'),
        uploading: chalk.magenta('◒'),
        processing: chalk.yellow('◓'),
      } as Record<string, string>)[entry.status] || chalk.gray('○')

      const duration = entry.endTime
        ? chalk.gray(`${((entry.endTime - entry.startTime) / 1000).toFixed(1)}s`)
        : ''

      console.log(`  ${statusIcon} ${platformInfo?.icon || ''} ${new Date(entry.startTime).toLocaleString()} ${duration}`)
      if (entry.result?.url) {
        console.log(`     ${chalk.cyan(entry.result.url)}`)
      }
      if (entry.status === 'failed' && entry.result?.error) {
        console.log(`     ${chalk.red(entry.result.error)}`)
      }
    }

    if (history.length > 10) {
      console.log(chalk.gray(`\n  ... 还有 ${history.length - 10} 条记录`))
    }
  }
}

export default DeployCommand
