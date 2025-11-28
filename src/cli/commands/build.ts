/**
 * Build 命令实现
 *
 * 执行生产构建命令
 *
 * @author LDesign Team
 * @since 1.0.0
 */

import type { OutputAsset, OutputChunk, RollupOutput } from 'rollup'
import type { CliCommandDefinition, CliContext } from '../../types'
import pc from 'picocolors'
import { DEFAULT_BUILD_TARGET, DEFAULT_OUT_DIR } from '../../constants'
import { ViteLauncher } from '../../core/ViteLauncher'
import { Banner } from '../../ui/Banner'
import { Chart, type ChartData } from '../../ui/Chart'
import { Spinner } from '../../ui/Spinner'
import { FileSystem } from '../../utils/file-system'
import { Logger } from '../../utils/logger'
import { PathUtils } from '../../utils/path-utils'

/**
 * Build 命令类
 */
export class BuildCommand implements CliCommandDefinition {
  name = 'build'
  aliases = ['bundle']
  description = '执行生产构建'
  usage = 'launcher build [options]'

  options = [
    {
      name: 'outDir',
      alias: 'o',
      description: '指定输出目录',
      type: 'string' as const,
      default: DEFAULT_OUT_DIR,
    },
    {
      name: 'sourcemap',
      alias: 's',
      description: '生成 sourcemap 文件',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'minify',
      alias: 'm',
      description: '压缩代码',
      type: 'boolean' as const,
      default: true,
    },
    {
      name: 'watch',
      alias: 'w',
      description: '启用监听模式',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'environment',
      alias: 'e',
      description: '指定环境名称（development, production, test, staging, preview）',
      type: 'string' as const,
    },
    {
      name: 'target',
      alias: 't',
      description: '指定构建目标',
      type: 'string' as const,
      default: DEFAULT_BUILD_TARGET,
    },
    {
      name: 'report',
      alias: 'r',
      description: '生成构建报告',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'emptyOutDir',
      description: '构建前清空输出目录',
      type: 'boolean' as const,
      default: true,
    },
    {
      name: 'ssr',
      description: '启用服务端渲染构建',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'analyze',
      description: '分析构建产物',
      type: 'boolean' as const,
      default: false,
    },
  ]

  examples = [
    {
      description: '执行生产构建',
      command: 'launcher build',
    },
    {
      description: '指定输出目录',
      command: 'launcher build --outDir build',
    },
    {
      description: '生成 sourcemap',
      command: 'launcher build --sourcemap',
    },
    {
      description: '启用监听模式',
      command: 'launcher build --watch',
    },
    {
      description: '生成构建报告',
      command: 'launcher build --report',
    },
    {
      description: '分析构建产物',
      command: 'launcher build --analyze',
    },
  ]

  /**
   * 验证命令参数
   *
   * @param context - CLI 上下文
   * @returns 验证结果
   */
  validate(context: CliContext): boolean | string {
    const { options } = context

    // 验证输出目录
    if (options.outDir && typeof options.outDir !== 'string') {
      return '输出目录必须是字符串'
    }

    // 验证构建目标
    if (options.target && typeof options.target !== 'string') {
      return '构建目标必须是字符串'
    }

    return true
  }

  /**
   * 执行命令
   *
   * @param context - CLI 上下文
   */
  async handler(context: CliContext): Promise<void> {
    // 抑制 Node.js 的实验性功能警告（如 CommonJS 加载 ES Module）
    const originalEmitWarning = process.emitWarning
    process.emitWarning = (warning, ...args: any[]) => {
      // 过滤掉 ExperimentalWarning
      if (typeof warning === 'string' && warning.includes('ExperimentalWarning')) {
        return
      }
      if (typeof warning === 'object' && warning.name === 'ExperimentalWarning') {
        return
      }
      return originalEmitWarning.call(process, warning, ...args)
    }

    const logger = new Logger('build', {
      level: context.options.silent ? 'silent' : (context.options.debug ? 'debug' : 'info'),
      colors: context.terminal.supportsColor,
      compact: !context.options.debug, // 非 debug 模式使用简洁输出
    })

    try {
      const startTime = Date.now()

      // 确定环境
      const environment = context.options.environment || context.options.mode || 'production'

      // 显示环境标识 - 确保在最开始就显示
      const envLabel = environment === 'production'
        ? '🔴 PRODUCTION'
        : environment === 'staging'
          ? '🟡 STAGING'
          : environment === 'test' ? '🔵 TEST' : '🟢 DEVELOPMENT'

      // 显示构建横幅
      if (!context.options.silent) {
        const banner = Banner.renderStartupBanner({
          title: '🏗️ LDesign Builder',
          subtitle: '生产构建工具',
          version: '2.0.0',
          info: [
            { label: '环境', value: envLabel },
            { label: '工作目录', value: context.cwd },
            { label: '模式', value: context.options.mode || 'production' },
            { label: '输出目录', value: context.options.outDir || DEFAULT_OUT_DIR },
          ],
        })
        logger.raw(banner)
        logger.raw('')
      }

      // 🎯 零配置特性：自动检测框架（使用spinner）
      let detectedFramework = null
      let spinner: Spinner | null = null

      if (!context.options.silent) {
        spinner = new Spinner({
          text: '正在检测项目框架...',
          spinner: 'dots',
          color: 'cyan',
        })
      }

      try {
        const { createFrameworkDetector } = await import('../../frameworks/base/FrameworkDetector')
        const detector = createFrameworkDetector()
        detectedFramework = await detector.detectBest(context.cwd)

        if (detectedFramework && detectedFramework.detected) {
          const frameworkName = detectedFramework.type?.toUpperCase() || 'UNKNOWN'
          const confidencePercent = (detectedFramework.confidence * 100).toFixed(0)
          
          if (spinner) {
            spinner.succeed(
              `检测到 ${pc.bold(pc.green(frameworkName))} 框架 (置信度: ${pc.cyan(`${confidencePercent}%`)})`
            )
          }
        }
        else {
          if (spinner) {
            spinner.warn('未检测到已知框架，将使用默认配置')
          }
        }
      }
      catch (error) {
        if (spinner) {
          spinner.fail('框架检测失败')
        }
        if (context.options.debug) {
          logger.warn(`框架检测失败: ${(error as Error).message}`)
        }
      }

      // 解析输出目录
      const outDir = PathUtils.resolve(context.cwd, context.options.outDir || DEFAULT_OUT_DIR)

      // 检查输出目录（使用spinner）
      if (context.options.emptyOutDir && await FileSystem.exists(outDir)) {
        if (!context.options.silent) {
          spinner = new Spinner({
            text: '正在清空输出目录...',
            spinner: 'dots',
            color: 'yellow',
          })
        }
        await FileSystem.remove(outDir)
        if (spinner) {
          spinner.succeed('输出目录已清空')
        }
      }

      // 开始构建（使用spinner）
      if (!context.options.silent) {
        spinner = new Spinner({
          text: '正在执行生产构建...',
          spinner: 'dots',
          color: 'cyan',
        })
      }

      // 创建 ViteLauncher 实例
      const launcher = new ViteLauncher({
        cwd: context.cwd,
        environment, // 传递环境参数
        config: {
          // 顶层 mode 仍保留，以便 Vite 正确识别
          mode: context.options.mode || 'production',
          build: {
            outDir,
            sourcemap: context.options.sourcemap || false,
            minify: context.options.minify !== false,
            target: context.options.target || DEFAULT_BUILD_TARGET,
            emptyOutDir: context.options.emptyOutDir !== false,
            reportCompressedSize: context.options.report || false,
            ssr: context.options.ssr || false,
            watch: context.options.watch ? {} : undefined,
          },
          launcher: {
            logLevel: context.options.debug ? 'debug' : 'info',
            mode: context.options.mode || 'production',
            debug: context.options.debug || false,
            // 关键修复：将 CLI --config 映射到 launcher.configFile，供 ConfigManager 使用
            configFile: context.configFile,
          },
        },
      })

      // 设置事件监听器
      launcher.on('buildStart', () => {
        logger.info('构建开始')
      })

      launcher.on('buildEnd', (data) => {
        const duration = data.duration
        logger.success(`构建完成 (${duration}ms)`)

        // 显示构建统计信息
        if (data.result && 'output' in data.result) {
          const output = data.result.output
          if (Array.isArray(output)) {
            const jsFiles = output.filter(file => file.fileName.endsWith('.js'))
            const cssFiles = output.filter(file => file.fileName.endsWith('.css'))

            logger.info(`生成了 ${output.length} 个文件`)
            if (jsFiles.length > 0) {
              logger.info(`JavaScript 文件: ${jsFiles.length} 个`)
            }
            if (cssFiles.length > 0) {
              logger.info(`CSS 文件: ${cssFiles.length} 个`)
            }
          }
        }
      })

      launcher.onError((error) => {
        logger.error(`构建错误: ${error.message}`)
      })

      // 处理监听模式的退出
      if (context.options.watch) {
        process.on('SIGINT', async () => {
          logger.info('正在停止监听模式...')
          try {
            await launcher.destroy()
            logger.success('监听模式已停止')
            process.exit(0)
          }
          catch (error) {
            logger.error('停止监听模式失败', { error: (error as Error).message })
            process.exit(1)
          }
        })

        process.on('SIGTERM', async () => {
          logger.info('收到终止信号，正在停止监听模式...')
          try {
            await launcher.destroy()
            process.exit(0)
          }
          catch (error) {
            logger.error('停止监听模式失败', { error: (error as Error).message })
            process.exit(1)
          }
        })
      }

      // 执行构建
      if (context.options.watch) {
        logger.info('启动监听模式构建...')
        await launcher.buildWatch()

        logger.success('监听模式已启动，按 Ctrl+C 停止')

        // 保持进程运行
        await new Promise(() => { })
      }
      else {
        const result = await launcher.build()

        // 停止spinner
        if (spinner) {
          spinner.succeed('构建完成')
        }

        const duration = Date.now() - startTime

        // 分析构建产物并生成统计图表
        if (result && 'output' in result && Array.isArray(result.output)) {
          const output = result.output as Array<OutputAsset | OutputChunk>
          
          // 按类型统计文件
          const fileStats = {
            js: { count: 0, size: 0 },
            css: { count: 0, size: 0 },
            image: { count: 0, size: 0 },
            font: { count: 0, size: 0 },
            other: { count: 0, size: 0 },
          }

          output.forEach((file) => {
            let size = 0
            if ('code' in file && typeof file.code === 'string') {
              size = file.code.length
            }
            else if ('source' in file) {
              const src = file.source as string | Uint8Array
              size = typeof src === 'string' ? src.length : src.byteLength
            }

            const type = getFileType(file.fileName)
            if (type === 'js') {
              fileStats.js.count++
              fileStats.js.size += size
            }
            else if (type === 'css') {
              fileStats.css.count++
              fileStats.css.size += size
            }
            else if (type === 'image') {
              fileStats.image.count++
              fileStats.image.size += size
            }
            else if (type === 'font') {
              fileStats.font.count++
              fileStats.font.size += size
            }
            else {
              fileStats.other.count++
              fileStats.other.size += size
            }
          })

          // 使用 Banner.renderBuildStats 显示构建统计
          const totalSize = Object.values(fileStats).reduce((sum, stat) => sum + stat.size, 0)
          const buildStats = Banner.renderBuildStats({
            duration,
            fileCount: output.length,
            totalSize,
            gzipSize: Math.round(totalSize * 0.32), // 估算gzip大小
          })
          logger.raw(buildStats)

          // 显示文件类型分布图表
          const chartData: ChartData[] = []
          if (fileStats.js.count > 0) {
            chartData.push({
              label: 'JavaScript',
              value: fileStats.js.size,
              color: 'cyan',
            })
          }
          if (fileStats.css.count > 0) {
            chartData.push({
              label: 'CSS',
              value: fileStats.css.size,
              color: 'magenta',
            })
          }
          if (fileStats.image.count > 0) {
            chartData.push({
              label: 'Images',
              value: fileStats.image.size,
              color: 'green',
            })
          }
          if (fileStats.font.count > 0) {
            chartData.push({
              label: 'Fonts',
              value: fileStats.font.size,
              color: 'yellow',
            })
          }
          if (fileStats.other.count > 0) {
            chartData.push({
              label: 'Other',
              value: fileStats.other.size,
              color: 'blue',
            })
          }

          if (chartData.length > 0) {
            logger.info(pc.bold('📊 构建产物分析:'))
            logger.raw('')
            const chart = Chart.renderBarChart({
              data: chartData,
              maxWidth: 30,
              showValue: true,
              showPercentage: true,
            })
            logger.raw(chart)
            logger.raw('')
          }
        }
        else {
          // 简单的成功消息
          logger.success(`构建成功完成! (${duration}ms)`)
          logger.info(`输出目录: ${outDir}`)
        }

        // 生成分析报告
        if (context.options.analyze) {
          if (!context.options.silent) {
            spinner = new Spinner({
              text: '正在生成构建分析报告...',
              spinner: 'dots',
              color: 'cyan',
            })
          }
          await generateAnalysisReport(result, outDir, logger)
          if (spinner) {
            spinner.succeed('构建分析报告已生成')
          }
        }

        // 清理资源
        await launcher.destroy()

        // 构建完成后确保退出进程，避免悬挂
        if (!context.options.watch) {
          // 使用setTimeout确保所有异步操作完成后再退出
          setTimeout(() => {
            process.exit(0)
          }, 100)
        }
      }
    }
    catch (error) {
      logger.error('构建失败', { error: (error as Error).message })

      if (context.options.debug) {
        logger.error('构建失败 - 堆栈信息', {
          stack: (error as Error).stack,
        })
      }

      // 提供一些常见错误的解决建议
      const errorMessage = (error as Error).message.toLowerCase()

      if (errorMessage.includes('out of memory') || errorMessage.includes('heap')) {
        logger.info('内存不足，请尝试：')
        logger.info('1. 增加 Node.js 内存限制: NODE_OPTIONS="--max-old-space-size=4096"')
        logger.info('2. 减少并发构建任务')
        logger.info('3. 优化代码和依赖')
      }

      if (errorMessage.includes('permission') || errorMessage.includes('eacces')) {
        logger.info('权限问题，请检查：')
        logger.info('1. 输出目录的写入权限')
        logger.info('2. 是否有其他进程占用文件')
        logger.info('3. 使用管理员权限运行')
      }

      if (errorMessage.includes('module not found') || errorMessage.includes('cannot resolve')) {
        logger.info('模块解析问题，请检查：')
        logger.info('1. 依赖是否正确安装')
        logger.info('2. 导入路径是否正确')
        logger.info('3. 配置文件中的别名设置')
      }

      // 确保错误时也能正常退出
      setTimeout(() => {
        process.exit(1)
      }, 100)
    }
  }
}


/**
 * 生成构建分析报告
 *
 * @param result - 构建结果
 * @param outDir - 输出目录
 * @param logger - 日志记录器
 */
async function generateAnalysisReport(result: RollupOutput | null | undefined, outDir: string, logger: Logger): Promise<void> {
  try {
    // 这里可以集成构建分析工具，如 rollup-plugin-analyzer
    // 目前只是简单的文件统计

    const reportPath = PathUtils.join(outDir, 'build-report.json')
    const report = {
      timestamp: new Date().toISOString(),
      files: [] as Array<{ fileName: string, size: number, type: string }>,
      summary: {
        totalFiles: 0,
        totalSize: 0,
        jsFiles: 0,
        cssFiles: 0,
        assetFiles: 0,
      },
    }

    // 分析输出文件
    if (result && 'output' in result && Array.isArray(result.output)) {
      for (const file of result.output as Array<OutputAsset | OutputChunk>) {
        let size = 0

        if ('code' in file && typeof file.code === 'string') {
          size = file.code.length
        }
        else if ('source' in file) {
          const src = file.source as string | Uint8Array
          size = typeof src === 'string' ? src.length : src.byteLength
        }

        const fileInfo = {
          fileName: file.fileName,
          size,
          type: getFileType(file.fileName),
        }

        report.files.push(fileInfo)
        report.summary.totalFiles++
        report.summary.totalSize += fileInfo.size

        if (fileInfo.type === 'js') {
          report.summary.jsFiles++
        }
        else if (fileInfo.type === 'css') {
          report.summary.cssFiles++
        }
        else {
          report.summary.assetFiles++
        }
      }
    }

    // 保存报告
    await FileSystem.writeFile(reportPath, JSON.stringify(report, null, 2))

    logger.success('构建分析报告已生成', { path: reportPath })
  }
  catch (error) {
    logger.warn('生成构建分析报告失败', { error: (error as Error).message })
  }
}

/**
 * 获取文件类型
 *
 * @param fileName - 文件名
 * @returns 文件类型
 */
function getFileType(fileName: string): string {
  const ext = PathUtils.extname(fileName).toLowerCase()

  if (['.js', '.mjs', '.cjs'].includes(ext)) {
    return 'js'
  }
  else if (ext === '.css') {
    return 'css'
  }
  else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) {
    return 'image'
  }
  else if (['.woff', '.woff2', '.ttf', '.eot'].includes(ext)) {
    return 'font'
  }
  else {
    return 'asset'
  }
}
