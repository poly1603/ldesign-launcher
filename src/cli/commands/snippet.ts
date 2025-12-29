/**
 * Snippet 命令实现
 *
 * 代码片段管理命令
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type { CliCommandDefinition, CliContext } from '../../types'
import pc from 'picocolors'
import { createSnippetManager } from '../../features/snippet-manager'
import { Logger } from '../../utils/logger'

export class SnippetCommand implements CliCommandDefinition {
  name = 'snippet'
  aliases = ['snip', 's']
  description = '代码片段管理器'
  usage = 'launcher snippet <action> [options]'

  options = [
    {
      name: 'list',
      alias: 'l',
      description: '列出所有代码片段',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'search',
      description: '搜索代码片段',
      type: 'string' as const,
    },
    {
      name: 'use',
      alias: 'u',
      description: '使用代码片段（指定ID）',
      type: 'string' as const,
    },
    {
      name: 'add',
      alias: 'a',
      description: '添加新代码片段',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'remove',
      alias: 'r',
      description: '删除代码片段（指定ID）',
      type: 'string' as const,
    },
    {
      name: 'export',
      description: '导出代码片段（格式：id:path）',
      type: 'string' as const,
    },
    {
      name: 'import',
      description: '导入代码片段（指定JSON文件路径）',
      type: 'string' as const,
    },
    {
      name: 'language',
      description: '按语言过滤',
      type: 'string' as const,
    },
    {
      name: 'category',
      description: '按类别过滤',
      type: 'string' as const,
    },
  ]

  examples = [
    {
      description: '列出所有代码片段',
      command: 'launcher snippet --list',
    },
    {
      description: '搜索Vue相关片段',
      command: 'launcher snippet --search vue',
    },
    {
      description: '使用指定片段',
      command: 'launcher snippet --use vue-component',
    },
    {
      description: '添加新片段',
      command: 'launcher snippet --add',
    },
    {
      description: '删除片段',
      command: 'launcher snippet --remove vue-component',
    },
    {
      description: '导出片段',
      command: 'launcher snippet --export vue-component:./my-snippet.json',
    },
    {
      description: '导入片段',
      command: 'launcher snippet --import ./my-snippet.json',
    },
  ]

  validate(_context: CliContext): boolean | string {
    return true
  }

  async handler(context: CliContext): Promise<void> {
    const logger = new Logger('snippet', {
      level: context.options.silent ? 'silent' : 'info',
      colors: context.terminal.supportsColor,
    })

    const manager = createSnippetManager()
    await manager.init()

    const options = context.options as any

    try {
      // 列出所有片段
      if (options.list) {
        const filter: any = {}
        if (options.language)
          filter.language = options.language
        if (options.category)
          filter.category = options.category

        const snippets = manager.list(filter)

        if (snippets.length === 0) {
          logger.info('未找到代码片段')
          return
        }

        console.log(`\n${pc.bold('📚 代码片段列表:\n')}`)

        for (const snippet of snippets) {
          console.log(pc.cyan(`  ▸ ${snippet.name}`))
          console.log(`    ID: ${pc.gray(snippet.id)}`)
          console.log(`    语言: ${pc.yellow(snippet.language)}`)
          if (snippet.description) {
            console.log(`    描述: ${snippet.description}`)
          }
          if (snippet.category) {
            console.log(`    类别: ${snippet.category}`)
          }
          console.log(`    使用次数: ${snippet.usageCount}`)
          console.log()
        }
        return
      }

      // 搜索片段
      if (options.search) {
        const snippets = manager.search(options.search)

        if (snippets.length === 0) {
          logger.info(`未找到包含 "${options.search}" 的代码片段`)
          return
        }

        console.log(`\n${pc.bold(`🔍 搜索结果: "${options.search}"\n`)}`)

        for (const snippet of snippets) {
          console.log(pc.cyan(`  ▸ ${snippet.name}`))
          console.log(`    ID: ${pc.gray(snippet.id)}`)
          console.log(`    语言: ${pc.yellow(snippet.language)}`)
          console.log()
        }
        return
      }

      // 使用片段
      if (options.use) {
        const snippet = manager.get(options.use)
        if (!snippet) {
          logger.error(`代码片段不存在: ${options.use}`)
          return
        }

        const inquirer = await import('inquirer')
        const variables: Record<string, string> = {}

        if (snippet.variables && snippet.variables.length > 0) {
          console.log(`\n${pc.bold('📝 请填写变量:\n')}`)

          for (const variable of snippet.variables) {
            const answer = await inquirer.default.prompt([
              {
                type: 'input',
                name: 'value',
                message: `${variable.name}${variable.description ? ` (${variable.description})` : ''}:`,
                default: variable.default,
                validate: (input) => {
                  if (variable.required && !input) {
                    return '该变量是必填的'
                  }
                  return true
                },
              },
            ])
            variables[variable.name] = answer.value
          }
        }

        const code = await manager.use(options.use, variables)
        console.log(`\n${pc.bold('✨ 生成的代码:\n')}`)
        console.log(pc.gray('────────────────────────────────'))
        console.log(code)
        console.log(pc.gray('────────────────────────────────'))
        return
      }

      // 添加片段
      if (options.add) {
        const inquirer = await import('inquirer')

        const answers = await inquirer.default.prompt([
          {
            type: 'input',
            name: 'name',
            message: '代码片段名称:',
            validate: input => input ? true : '名称不能为空',
          },
          {
            type: 'input',
            name: 'description',
            message: '描述 (可选):',
          },
          {
            type: 'input',
            name: 'language',
            message: '编程语言:',
            default: 'typescript',
          },
          {
            type: 'input',
            name: 'category',
            message: '类别 (可选):',
          },
          {
            type: 'input',
            name: 'tags',
            message: '标签 (用逗号分隔):',
            filter: input => input ? input.split(',').map((t: string) => t.trim()) : [],
          },
          {
            type: 'editor',
            name: 'code',
            message: '代码内容 (将打开编辑器):',
            validate: input => input ? true : '代码不能为空',
          },
        ])

        await manager.add(answers)
        logger.info(pc.green('✅ 代码片段已添加'))
        return
      }

      // 删除片段
      if (options.remove) {
        await manager.remove(options.remove)
        return
      }

      // 导出片段
      if (options.export) {
        const [id, outputPath] = options.export.split(':')
        if (!id || !outputPath) {
          logger.error('导出格式错误，应为: id:path')
          return
        }
        await manager.export(id, outputPath)
        return
      }

      // 导入片段
      if (options.import) {
        await manager.import(options.import)
        return
      }

      // 默认显示帮助
      console.log(`\n${pc.bold('📚 代码片段管理器\n')}`)
      console.log('使用以下命令管理代码片段:\n')
      console.log(`  ${pc.cyan('--list, -l')}      列出所有代码片段`)
      console.log(`  ${pc.cyan('--search <query>')} 搜索代码片段`)
      console.log(`  ${pc.cyan('--use, -u <id>')}   使用代码片段`)
      console.log(`  ${pc.cyan('--add, -a')}        添加新代码片段`)
      console.log(`  ${pc.cyan('--remove, -r <id>')} 删除代码片段`)
      console.log(`  ${pc.cyan('--export <id:path>')} 导出代码片段`)
      console.log(`  ${pc.cyan('--import <path>')}  导入代码片段`)
      console.log()
    }
    catch (error) {
      logger.error(`操作失败: ${(error as Error).message}`)
      process.exit(1)
    }
  }
}

export const snippetCommand = new SnippetCommand()
