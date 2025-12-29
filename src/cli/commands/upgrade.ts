/**
 * Upgrade 命令实现
 *
 * 智能依赖升级助手命令
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type { CliCommandDefinition, CliContext } from '../../types'
import pc from 'picocolors'
import { createUpgradeAssistant } from '../../features/upgrade-assistant'
import { Logger } from '../../utils/logger'

export class UpgradeCommand implements CliCommandDefinition {
  name = 'upgrade'
  aliases = ['up', 'update']
  description = '智能依赖升级助手'
  usage = 'launcher upgrade [options]'

  options = [
    {
      name: 'analyze',
      alias: 'a',
      description: '仅分析依赖更新情况',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'safe',
      alias: 's',
      description: '自动升级所有安全更新（minor 和 patch）',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'check',
      alias: 'c',
      description: '检查安全漏洞',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'changelog',
      description: '显示指定包的变更日志',
      type: 'string' as const,
    },
  ]

  examples = [
    {
      description: '交互式升级依赖',
      command: 'launcher upgrade',
    },
    {
      description: '分析依赖更新情况',
      command: 'launcher upgrade --analyze',
    },
    {
      description: '自动升级安全更新',
      command: 'launcher upgrade --safe',
    },
    {
      description: '检查安全漏洞',
      command: 'launcher upgrade --check',
    },
    {
      description: '查看包的变更日志',
      command: 'launcher upgrade --changelog vue',
    },
  ]

  validate(_context: CliContext): boolean | string {
    return true
  }

  async handler(context: CliContext): Promise<void> {
    const logger = new Logger('upgrade', {
      level: context.options.silent ? 'silent' : 'info',
      colors: context.terminal.supportsColor,
    })

    const assistant = createUpgradeAssistant(context.cwd)
    const options = context.options as any

    try {
      // 仅检查安全漏洞
      if (options.check) {
        await assistant.checkVulnerabilities()
        return
      }

      // 查看变更日志
      if (options.changelog) {
        const packageName = options.changelog as string
        logger.info(`正在获取 ${pc.cyan(packageName)} 的变更日志...`)

        const report = await assistant.analyzeUpgrades()
        const dep = report.outdated.find(d => d.name === packageName)

        if (dep) {
          const changelog = await assistant.getChangelog(
            dep.name,
            dep.currentVersion,
            dep.latestVersion,
          )
          console.log(`\n${changelog}`)
        }
        else {
          logger.warn(`未找到 ${packageName} 的更新信息`)
        }
        return
      }

      // 分析依赖
      const report = await assistant.analyzeUpgrades()

      // 仅分析
      if (options.analyze) {
        console.log(assistant.generateReport(report))
        return
      }

      // 自动升级安全更新
      if (options.safe) {
        await assistant.upgradeSafe()
        return
      }

      // 交互式升级
      await assistant.upgradeInteractive(report)
    }
    catch (error) {
      logger.error(`升级失败: ${(error as Error).message}`)
      process.exit(1)
    }
  }
}

export const upgradeCommand = new UpgradeCommand()
