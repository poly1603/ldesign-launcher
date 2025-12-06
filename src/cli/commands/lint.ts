/**
 * launcher lint 命令
 *
 * 代码质量检查
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type { CliContext } from '../../types'
import chalk from 'chalk'
import ora from 'ora'
import { CodeQualityChecker } from '../../utils/code-quality'

interface LintCommandOptions {
  fix?: boolean
  eslint?: boolean
  typescript?: boolean
  prettier?: boolean
  path?: string
}

/**
 * Lint 命令处理类
 */
export class LintCommand {
  name = 'lint'
  description = '代码质量检查'
  options = [
    { name: 'fix', alias: 'f', description: '自动修复问题', type: 'boolean' as const },
    { name: 'eslint', description: '运行 ESLint', type: 'boolean' as const },
    { name: 'typescript', alias: 'ts', description: '运行 TypeScript 检查', type: 'boolean' as const },
    { name: 'prettier', description: '运行 Prettier 检查', type: 'boolean' as const },
    { name: 'path', alias: 'p', description: '检查路径', type: 'string' as const },
  ]

  async handler(ctx: CliContext): Promise<void> {
    const options = ctx.options as LintCommandOptions
    const cwd = ctx.cwd

    console.log(chalk.bold.cyan('\n🔍 Launcher Lint\n'))

    const checker = new CodeQualityChecker(cwd)

    // 检测可用工具
    const spinner = ora('检测可用工具...').start()
    const tools = await checker.detectTools()
    spinner.succeed('工具检测完成')

    console.log()
    console.log(chalk.bold('可用工具:'))
    console.log(`  ${tools.eslint ? chalk.green('✓') : chalk.gray('✗')} ESLint ${tools.eslintConfig ? chalk.gray(`(${tools.eslintConfig})`) : ''}`)
    console.log(`  ${tools.typescript ? chalk.green('✓') : chalk.gray('✗')} TypeScript`)
    console.log(`  ${tools.prettier ? chalk.green('✓') : chalk.gray('✗')} Prettier ${tools.prettierConfig ? chalk.gray(`(${tools.prettierConfig})`) : ''}`)
    console.log()

    // 运行检查
    const checkSpinner = ora('运行检查...').start()

    const paths = options.path ? [options.path] : ['src']

    checker.on('progress', ({ tool, status }) => {
      checkSpinner.text = `[${tool}] ${status}...`
    })

    const result = await checker.check({
      fix: options.fix,
      eslint: options.eslint,
      typescript: options.typescript,
      prettier: options.prettier,
      paths,
    })

    if (result.success) {
      checkSpinner.succeed('检查完成')
    }
    else {
      checkSpinner.fail('发现问题')
    }

    // 显示结果
    console.log()
    console.log(checker.formatResult(result))

    // 退出码
    if (!result.success) {
      process.exitCode = 1
    }
  }
}

export default LintCommand
