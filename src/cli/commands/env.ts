/**
 * Env 命令实现
 *
 * 环境变量可视化管理命令
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type { CliCommandDefinition, CliContext } from '../../types'
import pc from 'picocolors'
import { createEnvManager } from '../../features/env-manager'
import { Logger } from '../../utils/logger'

export class EnvCommand implements CliCommandDefinition {
  name = 'env'
  aliases = ['e']
  description = '环境变量管理器'
  usage = 'launcher env <action> [options]'

  options = [
    {
      name: 'list',
      alias: 'l',
      description: '列出环境变量',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'file',
      alias: 'f',
      description: '指定环境文件',
      type: 'string' as const,
    },
    {
      name: 'set',
      description: '设置环境变量（格式：KEY=VALUE）',
      type: 'string' as const,
    },
    {
      name: 'get',
      alias: 'g',
      description: '获取环境变量值',
      type: 'string' as const,
    },
    {
      name: 'remove',
      alias: 'r',
      description: '删除环境变量',
      type: 'string' as const,
    },
    {
      name: 'search',
      alias: 's',
      description: '搜索环境变量',
      type: 'string' as const,
    },
    {
      name: 'validate',
      alias: 'v',
      description: '验证环境变量',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'compare',
      description: '比较两个环境文件（格式：file1:file2）',
      type: 'string' as const,
    },
    {
      name: 'copy',
      description: '复制环境文件（格式：from:to）',
      type: 'string' as const,
    },
    {
      name: 'example',
      description: '生成 .env.example 文件',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'export',
      description: '导出为 JSON',
      type: 'string' as const,
    },
    {
      name: 'import',
      description: '从 JSON 导入',
      type: 'string' as const,
    },
  ]

  examples = [
    {
      description: '列出所有环境变量',
      command: 'launcher env --list',
    },
    {
      description: '列出指定文件的变量',
      command: 'launcher env --list --file .env.development',
    },
    {
      description: '设置环境变量',
      command: 'launcher env --set VITE_API_URL=http://localhost:3000 --file .env',
    },
    {
      description: '获取环境变量',
      command: 'launcher env --get VITE_API_URL',
    },
    {
      description: '搜索环境变量',
      command: 'launcher env --search API',
    },
    {
      description: '验证环境变量',
      command: 'launcher env --validate',
    },
    {
      description: '比较环境文件',
      command: 'launcher env --compare .env:.env.production',
    },
    {
      description: '生成示例文件',
      command: 'launcher env --example',
    },
  ]

  validate(_context: CliContext): boolean | string {
    return true
  }

  async handler(context: CliContext): Promise<void> {
    const logger = new Logger('env', {
      level: context.options.silent ? 'silent' : 'info',
      colors: context.terminal.supportsColor,
    })

    const manager = createEnvManager(context.cwd)
    await manager.init()

    const options = context.options as any

    try {
      // 列出环境变量
      if (options.list) {
        const fileName = options.file as string | undefined

        if (fileName) {
          const variables = manager.getVariables(fileName)

          if (variables.length === 0) {
            logger.info(`${fileName} 中没有环境变量`)
            return
          }

          console.log(`\n${pc.bold(`📝 ${fileName}:\n`)}`)

          for (const variable of variables) {
            if (variable.comment) {
              console.log(pc.gray(`  # ${variable.comment}`))
            }
            console.log(`  ${pc.cyan(variable.key)} = ${pc.yellow(variable.value)}`)
          }
        }
        else {
          const allVars = manager.getAllVariables()

          if (allVars.size === 0) {
            logger.info('没有找到环境变量')
            return
          }

          console.log(`\n${pc.bold('📝 所有环境变量:\n')}`)

          for (const [key, variable] of allVars) {
            console.log(`  ${pc.cyan(key)} = ${pc.yellow(variable.value)} ${pc.gray(`(${variable.file})`)}`)
          }
        }

        console.log()
        return
      }

      // 获取单个变量
      if (options.get) {
        const allVars = manager.getAllVariables()
        const variable = allVars.get(options.get)

        if (variable) {
          console.log(variable.value)
        }
        else {
          logger.warn(`变量不存在: ${options.get}`)
        }
        return
      }

      // 设置环境变量
      if (options.set) {
        const match = options.set.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/)
        if (!match) {
          logger.error('格式错误，应为: KEY=VALUE')
          return
        }

        const [, key, value] = match
        const fileName = options.file || '.env'

        const inquirer = await import('inquirer')
        const { comment } = await inquirer.default.prompt([
          {
            type: 'input',
            name: 'comment',
            message: '添加注释 (可选):',
          },
        ])

        await manager.setVariable(fileName, key, value, comment || undefined)
        return
      }

      // 删除环境变量
      if (options.remove) {
        const fileName = options.file || '.env'

        const inquirer = await import('inquirer')
        const { confirm } = await inquirer.default.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `确认删除 ${options.remove}？`,
            default: false,
          },
        ])

        if (confirm) {
          await manager.removeVariable(fileName, options.remove)
        }
        else {
          logger.info('已取消')
        }
        return
      }

      // 搜索环境变量
      if (options.search) {
        const results = manager.searchVariables(options.search)

        if (results.length === 0) {
          logger.info(`未找到包含 "${options.search}" 的环境变量`)
          return
        }

        console.log(`\n${pc.bold(`🔍 搜索结果: "${options.search}"\n`)}`)

        for (const variable of results) {
          console.log(`  ${pc.cyan(variable.key)} = ${pc.yellow(variable.value)}`)
          console.log(`    ${pc.gray(`文件: ${variable.file}`)}`)
          if (variable.comment) {
            console.log(`    ${pc.gray(`注释: ${variable.comment}`)}`)
          }
          console.log()
        }
        return
      }

      // 验证环境变量
      if (options.validate) {
        const { missing, duplicates, invalid } = await manager.validate()

        console.log(`\n${pc.bold('🔍 环境变量验证:\n')}`)

        if (missing.length > 0) {
          console.log(pc.red('❌ 缺少必需变量:'))
          for (const key of missing) {
            console.log(`  - ${key}`)
          }
          console.log()
        }

        if (duplicates.size > 0) {
          console.log(pc.yellow('⚠️  重复定义:'))
          for (const [key, files] of duplicates) {
            console.log(`  - ${key} (${files.join(', ')})`)
          }
          console.log()
        }

        if (invalid.length > 0) {
          console.log(pc.red('❌ 无效变量名:'))
          for (const { key, reason } of invalid) {
            console.log(`  - ${key}: ${reason}`)
          }
          console.log()
        }

        if (missing.length === 0 && duplicates.size === 0 && invalid.length === 0) {
          console.log(pc.green('✅ 所有环境变量都有效\n'))
        }

        return
      }

      // 比较环境文件
      if (options.compare) {
        const [file1, file2] = options.compare.split(':')
        if (!file1 || !file2) {
          logger.error('格式错误，应为: file1:file2')
          return
        }

        const comparison = manager.compareFiles(file1, file2)

        console.log(`\n${pc.bold(`📊 比较 ${file1} 和 ${file2}:\n`)}`)

        if (comparison.onlyInFile1.length > 0) {
          console.log(pc.cyan(`仅在 ${file1}:`))
          for (const key of comparison.onlyInFile1) {
            console.log(`  - ${key}`)
          }
          console.log()
        }

        if (comparison.onlyInFile2.length > 0) {
          console.log(pc.cyan(`仅在 ${file2}:`))
          for (const key of comparison.onlyInFile2) {
            console.log(`  - ${key}`)
          }
          console.log()
        }

        if (comparison.different.length > 0) {
          console.log(pc.yellow('不同的值:'))
          for (const { key, value1, value2 } of comparison.different) {
            console.log(`  - ${key}:`)
            console.log(`    ${file1}: ${value1}`)
            console.log(`    ${file2}: ${value2}`)
          }
          console.log()
        }

        if (comparison.same.length > 0) {
          console.log(pc.green(`相同: ${comparison.same.length} 个变量\n`))
        }

        return
      }

      // 复制环境文件
      if (options.copy) {
        const [from, to] = options.copy.split(':')
        if (!from || !to) {
          logger.error('格式错误，应为: from:to')
          return
        }

        await manager.copyEnvFile(from, to)
        return
      }

      // 生成示例文件
      if (options.example) {
        await manager.generateExample()
        return
      }

      // 导出为 JSON
      if (options.export) {
        const fileName = options.file as string | undefined
        const data = manager.exportToJson(fileName)
        const outputPath = options.export

        await import('node:fs').then(({ promises: fs }) =>
          fs.writeFile(outputPath, JSON.stringify(data, null, 2), 'utf-8'),
        )

        logger.info(pc.green(`✅ 已导出到 ${outputPath}`))
        return
      }

      // 从 JSON 导入
      if (options.import) {
        const fileName = options.file || '.env'
        const inputPath = options.import

        const data = await import('node:fs').then(({ promises: fs }) =>
          fs.readFile(inputPath, 'utf-8').then(JSON.parse),
        )

        await manager.importFromJson(fileName, data)
        return
      }

      // 默认显示帮助
      console.log(`\n${pc.bold('📝 环境变量管理器\n')}`)
      console.log('使用以下命令管理环境变量:\n')
      console.log(`  ${pc.cyan('--list, -l')}         列出环境变量`)
      console.log(`  ${pc.cyan('--set <KEY=VALUE>')}  设置环境变量`)
      console.log(`  ${pc.cyan('--get, -g <KEY>')}    获取环境变量`)
      console.log(`  ${pc.cyan('--remove, -r <KEY>')} 删除环境变量`)
      console.log(`  ${pc.cyan('--search, -s <Q>')}   搜索环境变量`)
      console.log(`  ${pc.cyan('--validate, -v')}     验证环境变量`)
      console.log(`  ${pc.cyan('--compare <f1:f2>')}  比较环境文件`)
      console.log(`  ${pc.cyan('--copy <from:to>')}   复制环境文件`)
      console.log(`  ${pc.cyan('--example')}          生成示例文件`)
      console.log()
    }
    catch (error) {
      logger.error(`操作失败: ${(error as Error).message}`)
      process.exit(1)
    }
  }
}

export const envCommand = new EnvCommand()
