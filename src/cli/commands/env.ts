/**
 * 环境管理命令
 * 
 * 提供环境配置快速切换和管理功能
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { Logger } from '../../utils/logger'
import { FileSystem, PathUtils } from '../../utils'
import { ConfigManager } from '../../core/ConfigManager'
import pc from 'picocolors'
import type { ViteLauncherConfig } from '../../types'

/**
 * 环境历史记录
 */
interface EnvironmentHistory {
  lastEnvironment: string
  history: Array<{
    environment: string
    timestamp: number
  }>
}

/**
 * 环境管理器
 */
class EnvironmentManager {
  private logger: Logger
  private historyFile: string

  constructor() {
    this.logger = new Logger('EnvironmentManager')
    this.historyFile = PathUtils.resolve(process.cwd(), '.ldesign', 'env-history.json')
  }

  /**
   * 保存环境历史
   */
  async saveHistory(environment: string): Promise<void> {
    try {
      const history: EnvironmentHistory = await this.loadHistory()

      history.lastEnvironment = environment
      history.history.unshift({
        environment,
        timestamp: Date.now()
      })

      // 只保留最近 10 条记录
      history.history = history.history.slice(0, 10)

      // 确保目录存在
      const dir = PathUtils.dirname(this.historyFile)
      await FileSystem.ensureDir(dir)

      await FileSystem.writeFile(
        this.historyFile,
        JSON.stringify(history, null, 2)
      )
    } catch (error) {
      this.logger.debug('保存环境历史失败', { error: (error as Error).message })
    }
  }

  /**
   * 加载环境历史
   */
  async loadHistory(): Promise<EnvironmentHistory> {
    try {
      if (await FileSystem.exists(this.historyFile)) {
        const content = await FileSystem.readFile(this.historyFile)
        return JSON.parse(content)
      }
    } catch (error) {
      this.logger.debug('加载环境历史失败', { error: (error as Error).message })
    }

    return {
      lastEnvironment: 'development',
      history: []
    }
  }

  /**
   * 获取上次使用的环境
   */
  async getLastEnvironment(): Promise<string> {
    const history = await this.loadHistory()
    return history.lastEnvironment
  }

  /**
   * 获取环境历史
   */
  async getHistory(): Promise<EnvironmentHistory['history']> {
    const history = await this.loadHistory()
    return history.history
  }
}

/**
 * 环境管理命令类
 */
export class EnvCommand {
  name = 'env'
  description = '环境配置管理'
  alias = ['environment']

  private envManager: EnvironmentManager
  private logger: Logger

  constructor() {
    this.envManager = new EnvironmentManager()
    this.logger = new Logger('EnvCommand')
  }

  /**
   * 执行命令
   */
  async execute(context: {
    cwd: string
    options: {
      current?: boolean
      list?: boolean
      diff?: string[]
      validate?: boolean
      history?: boolean
      set?: string
    }
  }): Promise<void> {
    try {
      const { options, cwd } = context

      // 查看当前环境
      if (options.current) {
        await this.showCurrent()
        return
      }

      // 列出可用环境
      if (options.list) {
        await this.listEnvironments(cwd)
        return
      }

      // 对比环境配置
      if (options.diff && options.diff.length === 2) {
        await this.compareEnvironments(cwd, options.diff[0], options.diff[1])
        return
      }

      // 验证环境配置
      if (options.validate) {
        await this.validateEnvironments(cwd)
        return
      }

      // 查看历史
      if (options.history) {
        await this.showHistory()
        return
      }

      // 设置当前环境
      if (options.set) {
        await this.envManager.saveHistory(options.set)
        this.logger.success(`当前环境已设置为: ${options.set}`)
        return
      }

      // 默认显示帮助
      this.showHelp()

    } catch (error) {
      this.logger.error('环境管理命令执行失败', { error: (error as Error).message })
      throw error
    }
  }

  /**
   * 显示当前环境
   */
  private async showCurrent(): Promise<void> {
    const current = await this.envManager.getLastEnvironment()

    this.logger.info(pc.cyan('\n📍 当前环境:\n'))
    this.logger.info(`  ${pc.green('●')} ${pc.bold(current)}`)
    this.logger.info('')
  }

  /**
   * 列出可用环境
   */
  private async listEnvironments(cwd: string): Promise<void> {
    const { getEnvironmentConfigFiles } = await import('../../constants')

    // 标准环境
    const standardEnvs = ['development', 'production', 'test', 'staging']

    this.logger.info(pc.cyan('\n🌍 可用环境:\n'))

    for (const env of standardEnvs) {
      const configFiles = getEnvironmentConfigFiles(env)
      let hasConfig = false

      for (const file of configFiles) {
        const filePath = PathUtils.resolve(cwd, file)
        if (await FileSystem.exists(filePath)) {
          hasConfig = true
          this.logger.info(`  ${pc.green('●')} ${pc.bold(env)} ${pc.dim(`(${file})`)}`)
          break
        }
      }

      if (!hasConfig) {
        this.logger.info(`  ${pc.gray('○')} ${pc.dim(env)} ${pc.gray('(无配置文件)')}`)
      }
    }

    this.logger.info('')

    // 显示上次使用的环境
    const last = await this.envManager.getLastEnvironment()
    this.logger.info(pc.dim(`💡 上次使用: ${last}`))
    this.logger.info('')
  }

  /**
   * 对比环境配置
   */
  private async compareEnvironments(cwd: string, env1: string, env2: string): Promise<void> {
    const configManager = new ConfigManager({ logger: this.logger })

    this.logger.info(pc.cyan(`\n📊 对比环境配置: ${env1} vs ${env2}\n`))

    try {
      const config1 = await configManager.load({ cwd, environment: env1 })
      const config2 = await configManager.load({ cwd, environment: env2 })

      this.displayConfigDiff(env1, config1, env2, config2)
    } catch (error) {
      this.logger.error('加载环境配置失败', { error: (error as Error).message })
    }
  }

  /**
   * 显示配置差异
   */
  private displayConfigDiff(
    env1: string,
    config1: ViteLauncherConfig,
    env2: string,
    config2: ViteLauncherConfig
  ): void {
    const getDiff = (path: string, val1: unknown, val2: unknown) => {
      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        return {
          path,
          [env1]: val1,
          [env2]: val2
        }
      }
      return null
    }

    const diffs: Array<{ path: string;[key: string]: unknown }> = []

    // 对比 server 配置
    if (config1.server?.port !== config2.server?.port) {
      diffs.push(getDiff('server.port', config1.server?.port, config2.server?.port)!)
    }
    if (config1.server?.host !== config2.server?.host) {
      diffs.push(getDiff('server.host', config1.server?.host, config2.server?.host)!)
    }

    // 对比 build 配置
    if (config1.build?.outDir !== config2.build?.outDir) {
      diffs.push(getDiff('build.outDir', config1.build?.outDir, config2.build?.outDir)!)
    }
    if (config1.build?.sourcemap !== config2.build?.sourcemap) {
      diffs.push(getDiff('build.sourcemap', config1.build?.sourcemap, config2.build?.sourcemap)!)
    }

    // 对比 launcher 配置
    if (config1.launcher?.logLevel !== config2.launcher?.logLevel) {
      diffs.push(getDiff('launcher.logLevel', config1.launcher?.logLevel, config2.launcher?.logLevel)!)
    }

    if (diffs.length === 0) {
      this.logger.info(pc.green('  ✓ 配置完全相同'))
    } else {
      this.logger.info(pc.yellow(`  发现 ${diffs.length} 处差异:\n`))

      diffs.forEach(diff => {
        this.logger.info(pc.dim(`  ${diff.path}:`))
        this.logger.info(`    ${pc.cyan(env1)}: ${JSON.stringify(diff[env1])}`)
        this.logger.info(`    ${pc.magenta(env2)}: ${JSON.stringify(diff[env2])}`)
        this.logger.info('')
      })
    }
  }

  /**
   * 验证环境配置
   */
  private async validateEnvironments(cwd: string): Promise<void> {
    const { validateLauncherConfig } = await import('../../utils/config-schemas')
    const { getEnvironmentConfigFiles } = await import('../../constants')
    const configManager = new ConfigManager({ logger: this.logger })

    this.logger.info(pc.cyan('\n✅ 验证环境配置\n'))

    const envs = ['development', 'production', 'test', 'staging']

    for (const env of envs) {
      const configFiles = getEnvironmentConfigFiles(env)
      let found = false

      for (const file of configFiles) {
        const filePath = PathUtils.resolve(cwd, file)
        if (await FileSystem.exists(filePath)) {
          found = true

          try {
            const config = await configManager.load({ cwd, environment: env })
            const result = validateLauncherConfig(config)

            if (result.success) {
              this.logger.info(`  ${pc.green('✓')} ${pc.bold(env)} ${pc.dim(`(${file})`)} - 有效`)
            } else {
              this.logger.error(`  ${pc.red('✗')} ${pc.bold(env)} ${pc.dim(`(${file})`)} - 无效`)
              result.error.errors.forEach(err => {
                this.logger.error(`    ${pc.red('→')} ${err.path.join('.')}: ${err.message}`)
              })
            }
          } catch (error) {
            this.logger.error(`  ${pc.red('✗')} ${pc.bold(env)} - 加载失败`)
            this.logger.error(`    ${pc.red('→')} ${(error as Error).message}`)
          }

          break
        }
      }

      if (!found) {
        this.logger.info(`  ${pc.gray('○')} ${pc.dim(env)} - 无配置文件`)
      }
    }

    this.logger.info('')
  }

  /**
   * 显示环境历史
   */
  private async showHistory(): Promise<void> {
    const history = await this.envManager.getHistory()

    this.logger.info(pc.cyan('\n📜 环境切换历史:\n'))

    if (history.length === 0) {
      this.logger.info(pc.dim('  暂无历史记录'))
    } else {
      history.forEach((record, index) => {
        const date = new Date(record.timestamp).toLocaleString('zh-CN')
        this.logger.info(`  ${pc.dim(`${index + 1}.`)} ${pc.bold(record.environment)} ${pc.gray(`- ${date}`)}`)
      })
    }

    this.logger.info('')
  }

  /**
   * 显示帮助信息
   */
  private showHelp(): void {
    this.logger.info(pc.cyan('\n🌍 环境管理命令\n'))
    this.logger.info('用法:')
    this.logger.info('  launcher env [选项]\n')
    this.logger.info('选项:')
    this.logger.info('  --current            查看当前环境')
    this.logger.info('  --list               列出所有可用环境')
    this.logger.info('  --diff <env1> <env2> 对比两个环境的配置')
    this.logger.info('  --validate           验证所有环境配置')
    this.logger.info('  --history            查看环境切换历史')
    this.logger.info('  --set <env>          设置当前环境')
    this.logger.info('\n示例:')
    this.logger.info('  launcher env --current')
    this.logger.info('  launcher env --list')
    this.logger.info('  launcher env --diff development production')
    this.logger.info('  launcher env --validate')
    this.logger.info('')
  }
}

export const envCommand = new EnvCommand()

