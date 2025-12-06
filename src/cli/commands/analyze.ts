/**
 * launcher analyze 命令
 *
 * 分析构建产物和依赖
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type { CliContext } from '../../types'
import type { PerformanceBudget } from '../../utils/bundle-analyzer'
import path from 'node:path'
import chalk from 'chalk'
import fs from 'fs-extra'
import { analyzeBuild } from '../../utils/bundle-analyzer'
import { checkDependencies } from '../../utils/dependency-checker'

interface AnalyzeCommandOptions {
  type?: string
  dir?: string
  budget?: string
  report?: string | boolean
  json?: boolean
}

/**
 * 分析命令处理类
 */
export class AnalyzeCommand {
  name = 'analyze'
  description = '分析构建产物和依赖'
  options = [
    { name: 'type', alias: 't', description: '分析类型: bundle, deps, all', type: 'string' as const, default: 'all' },
    { name: 'dir', alias: 'd', description: '构建目录 (默认: dist)', type: 'string' as const },
    { name: 'budget', alias: 'b', description: '性能预算配置文件', type: 'string' as const },
    { name: 'report', alias: 'r', description: '输出 HTML 报告路径', type: 'string' as const },
    { name: 'json', alias: 'j', description: '输出 JSON 格式', type: 'boolean' as const },
  ]

  async handler(ctx: CliContext): Promise<void> {
    const options = ctx.options as AnalyzeCommandOptions
    const cwd = ctx.cwd
    const type = options.type || 'all'

    console.log(chalk.bold.cyan('\n🔍 Launcher Analyze\n'))

    // 分析构建产物
    if (type === 'bundle' || type === 'all') {
      const distDir = path.resolve(cwd, options.dir || 'dist')

      if (!await fs.pathExists(distDir)) {
        console.log(chalk.yellow(`⚠️ 构建目录不存在: ${distDir}`))
        console.log(chalk.gray('请先运行 launcher build'))
      }
      else {
        // 解析性能预算
        let budget: PerformanceBudget | undefined
        if (options.budget) {
          const budgetPath = path.resolve(cwd, options.budget)
          if (await fs.pathExists(budgetPath)) {
            budget = await fs.readJson(budgetPath)
          }
        }

        // 分析
        const htmlReport = typeof options.report === 'string' ? options.report : undefined
        const result = await analyzeBuild(distDir, {
          budget,
          htmlReport,
          printReport: !options.json,
        })

        if (options.json) {
          console.log(JSON.stringify(result, null, 2))
        }
      }
    }

    // 分析依赖
    if (type === 'deps' || type === 'all') {
      console.log(chalk.bold.cyan('\n📦 依赖分析\n'))

      try {
        const result = await checkDependencies(cwd, {
          includeDevDeps: true,
          checkVulnerabilities: true,
          printReport: !options.json,
        })

        if (options.json) {
          console.log(JSON.stringify(result, null, 2))
        }
      }
      catch (error) {
        console.log(chalk.red(`❌ 依赖分析失败: ${(error as Error).message}`))
      }
    }
  }
}

export default AnalyzeCommand
