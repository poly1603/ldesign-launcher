/**
 * Mock 命令实现
 *
 * API Mock 服务器管理命令
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type { CliCommandDefinition, CliContext } from '../../types'
import pc from 'picocolors'
import { createMockEnhanced, MockEnhanced } from '../../features/mock-enhanced'
import { Logger } from '../../utils/logger'

export class MockCommand implements CliCommandDefinition {
  name = 'mock'
  aliases = ['m']
  description = 'API Mock 服务器管理'
  usage = 'launcher mock <action> [options]'

  options = [
    {
      name: 'scenario',
      alias: 's',
      description: '场景管理',
      type: 'string' as const,
    },
    {
      name: 'create',
      alias: 'c',
      description: '创建新场景',
      type: 'string' as const,
    },
    {
      name: 'switch',
      description: '切换场景',
      type: 'string' as const,
    },
    {
      name: 'delete',
      alias: 'd',
      description: '删除场景',
      type: 'string' as const,
    },
    {
      name: 'list',
      alias: 'l',
      description: '列出所有场景',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'record',
      alias: 'r',
      description: '开始/停止录制请求',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'generate',
      alias: 'g',
      description: '生成 Mock 文件',
      type: 'string' as const,
    },
    {
      name: 'template',
      alias: 't',
      description: '显示可用模板',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'analyze',
      alias: 'a',
      description: '分析 Mock 使用情况',
      type: 'boolean' as const,
      default: false,
    },
  ]

  examples = [
    {
      description: '列出所有场景',
      command: 'launcher mock --list',
    },
    {
      description: '创建新场景',
      command: 'launcher mock --create my-scenario',
    },
    {
      description: '切换场景',
      command: 'launcher mock --switch my-scenario',
    },
    {
      description: '生成 Mock 文件',
      command: 'launcher mock --generate users',
    },
    {
      description: '显示模板',
      command: 'launcher mock --template',
    },
    {
      description: '分析使用情况',
      command: 'launcher mock --analyze',
    },
  ]

  validate(_context: CliContext): boolean | string {
    return true
  }

  async handler(context: CliContext): Promise<void> {
    const logger = new Logger('mock', {
      level: context.options.silent ? 'silent' : 'info',
      colors: context.terminal.supportsColor,
    })

    const manager = createMockEnhanced(context.cwd)
    await manager.init()

    const options = context.options as any

    try {
      // 列出场景
      if (options.list) {
        const scenarios = manager.listScenarios()

        if (scenarios.length === 0) {
          logger.info('没有可用的场景')
          return
        }

        console.log(`\n${pc.bold('📋 Mock 场景列表:\n')}`)

        for (const scenario of scenarios) {
          const icon = scenario.active ? '✓' : ' '
          const color = scenario.active ? pc.green : pc.gray

          console.log(color(`  [${icon}] ${scenario.name}`))
          if (scenario.description) {
            console.log(`      ${scenario.description}`)
          }
          console.log(`      路由数: ${scenario.routes.length}`)
          console.log()
        }
        return
      }

      // 创建场景
      if (options.create) {
        const inquirer = await import('inquirer')

        const { description } = await inquirer.default.prompt([
          {
            type: 'input',
            name: 'description',
            message: '场景描述 (可选):',
          },
        ])

        await manager.createScenario(options.create, description || undefined)
        return
      }

      // 切换场景
      if (options.switch) {
        await manager.switchScenario(options.switch)
        return
      }

      // 删除场景
      if (options.delete) {
        const inquirer = await import('inquirer')

        const { confirm } = await inquirer.default.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `确认删除场景 "${options.delete}"？`,
            default: false,
          },
        ])

        if (confirm) {
          await manager.deleteScenario(options.delete)
        }
        else {
          logger.info('已取消')
        }
        return
      }

      // 显示模板
      if (options.template) {
        const templates = MockEnhanced.getMockTemplates()

        console.log(`\n${pc.bold('📦 可用的 Mock 模板:\n')}`)

        for (const [name, template] of Object.entries(templates)) {
          console.log(pc.cyan(`  ▸ ${name}`))
          console.log(`    ${template.description}`)
          console.log(pc.gray('    示例:'))
          console.log(pc.gray(`    ${JSON.stringify(template.generator(), null, 2).split('\n').join('\n    ')}`))
          console.log()
        }
        return
      }

      // 生成 Mock 文件
      if (options.generate) {
        const inquirer = await import('inquirer')

        const answers = await inquirer.default.prompt([
          {
            type: 'input',
            name: 'routes',
            message: '路由定义 (格式: method url template, 多个用逗号分隔):',
            default: 'GET /api/users user',
            validate: input => input ? true : '路由定义不能为空',
          },
        ])

        const routes = answers.routes.split(',').map((r: string) => {
          const [method, url, template, count] = r.trim().split(' ')
          return {
            method: method.toUpperCase(),
            url,
            template,
            count: count ? Number.parseInt(count) : undefined,
          }
        })

        await manager.generateMockFile(options.generate, routes)
        return
      }

      // 分析使用情况
      if (options.analyze) {
        const stats = await manager.analyzeUsage()

        console.log(`\n${pc.bold('📊 Mock 使用统计:\n')}`)
        console.log(`  场景总数: ${pc.cyan(String(stats.totalScenarios))}`)
        console.log(`  路由总数: ${pc.cyan(String(stats.totalRoutes))}`)
        console.log(`  录制总数: ${pc.cyan(String(stats.totalRecordings))}`)
        console.log()

        if (stats.scenarioStats.length > 0) {
          console.log(pc.bold('  场景详情:\n'))
          for (const s of stats.scenarioStats) {
            const status = s.active ? pc.green('[激活]') : pc.gray('[未激活]')
            console.log(`    ${status} ${s.name}: ${s.routes} 个路由`)
          }
          console.log()
        }
        return
      }

      // 默认显示帮助
      console.log(`\n${pc.bold('🎭 Mock 服务器管理\n')}`)
      console.log('使用以下命令管理 Mock:\n')
      console.log(`  ${pc.cyan('--list, -l')}           列出所有场景`)
      console.log(`  ${pc.cyan('--create, -c <name>')}  创建新场景`)
      console.log(`  ${pc.cyan('--switch <name>')}      切换场景`)
      console.log(`  ${pc.cyan('--delete, -d <name>')}  删除场景`)
      console.log(`  ${pc.cyan('--generate, -g <name>')} 生成 Mock 文件`)
      console.log(`  ${pc.cyan('--template, -t')}       显示可用模板`)
      console.log(`  ${pc.cyan('--analyze, -a')}        分析使用情况`)
      console.log()
    }
    catch (error) {
      logger.error(`操作失败: ${(error as Error).message}`)
      process.exit(1)
    }
  }
}

export const mockCommand = new MockCommand()
