/**
 * Preview 命令实现
 *
 * 预览构建结果命令
 *
 * @author LDesign Team
 * @since 1.0.0
 */

import type { CliCommandDefinition, CliContext } from '../../types'
import pc from 'picocolors'
import { DEFAULT_HOST, DEFAULT_OUT_DIR } from '../../constants'
import { ViteLauncher } from '../../core/ViteLauncher'
import { Banner, QRCode } from '../../ui'
import { Spinner } from '../../ui/Spinner'
import { FileSystem } from '../../utils/file-system'
import { Logger } from '../../utils/logger'
import { NetworkInfo } from '../../utils/network-info'
import { PathUtils } from '../../utils/path-utils'

/**
 * Preview 命令类
 */
export class PreviewCommand implements CliCommandDefinition {
  name = 'preview'
  aliases = ['serve-build']
  description = '预览构建结果'
  usage = 'launcher preview [options]'

  options = [
    {
      name: 'port',
      alias: 'p',
      description: '指定端口号',
      type: 'number' as const,
      default: 4173,
    },
    {
      name: 'host',
      alias: 'H',
      description: '指定主机地址',
      type: 'string' as const,
      default: DEFAULT_HOST,
    },
    {
      name: 'open',
      alias: 'o',
      description: '自动打开浏览器',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'https',
      description: '启用 HTTPS',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'outDir',
      description: '指定构建输出目录',
      type: 'string' as const,
      default: DEFAULT_OUT_DIR,
    },
    {
      name: 'cors',
      description: '启用 CORS',
      type: 'boolean' as const,
      default: true,
    },
    {
      name: 'strictPort',
      description: '严格端口模式',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'environment',
      alias: 'e',
      description: '指定环境名称（development, production, test, staging, preview）',
      type: 'string' as const,
    },
  ]

  examples = [
    {
      description: '预览构建结果',
      command: 'launcher preview',
    },
    {
      description: '在指定端口预览',
      command: 'launcher preview --port 8080',
    },
    {
      description: '允许外部访问',
      command: 'launcher preview --host 0.0.0.0',
    },
    {
      description: '启动后自动打开浏览器',
      command: 'launcher preview --open',
    },
    {
      description: '预览指定目录的构建结果',
      command: 'launcher preview --outDir build',
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

    // 验证端口号
    if (options.port) {
      const port = Number(options.port)
      if (Number.isNaN(port) || port < 1 || port > 65535) {
        return '端口号必须是 1-65535 之间的数字'
      }
    }

    // 验证主机地址
    if (options.host && typeof options.host !== 'string') {
      return '主机地址必须是字符串'
    }

    // 验证输出目录
    if (options.outDir && typeof options.outDir !== 'string') {
      return '输出目录必须是字符串'
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

    const logger = new Logger('preview', {
      level: context.options.silent ? 'silent' : (context.options.debug ? 'debug' : 'info'),
      colors: context.terminal.supportsColor,
      compact: !context.options.debug, // 非 debug 模式使用简洁输出
    })

    try {
      const startTime = Date.now()
      const environment = context.options.environment || 'production'

      // 检测框架
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
            spinner.succeed(`检测到 ${pc.bold(pc.green(frameworkName))} 框架 (置信度: ${pc.cyan(`${confidencePercent}%`)})`)
          }
        } else {
          if (spinner) {
            spinner.warn('未检测到已知框架，将使用默认配置')
          }
        }
      } catch (error) {
        if (spinner) {
          spinner.fail('框架检测失败')
        }
        if (context.options.debug) {
          logger.warn(`框架检测失败: ${(error as Error).message}`)
        }
      }

      // 启动预览服务器
      if (!context.options.silent) {
        spinner = new Spinner({
          text: '正在启动预览服务器...',
          spinner: 'dots',
          color: 'cyan',
        })
      }

      // 创建 ViteLauncher 实例
      const launcher = new ViteLauncher({
        cwd: context.cwd,
        environment, // 传递环境参数
        config: {
          launcher: {
            configFile: context.configFile,
            logLevel: context.options.debug ? 'debug' : 'info',
            debug: context.options.debug || false,
          },
        },
      })

      // 初始化以加载配置文件
      await launcher.initialize()

      // 获取配置文件中的preview配置
      const config = launcher.getConfig()
      const previewConfig = config.preview || {}

      // 解析输出目录 - 优先使用配置文件中的设置
      const configOutDir = config.build?.outDir || DEFAULT_OUT_DIR
      const outDir = PathUtils.resolve(context.cwd, context.options.outDir || configOutDir)

      // 调试信息
      if (context.options.debug) {
        logger.debug('配置信息', {
          configOutDir,
          commandLineOutDir: context.options.outDir,
          finalOutDir: outDir,
          configBuild: config.build,
        })
      }

      // 检查构建输出目录是否存在
      if (!(await FileSystem.exists(outDir))) {
        logger.error(`构建输出目录不存在: ${outDir}`)
        logger.info('请先执行构建命令: launcher build')
        process.exit(1)
      }

      // 检查是否有构建产物
      const files = await FileSystem.readDir(outDir)
      if (files.length === 0) {
        logger.error(`构建输出目录为空: ${outDir}`)
        logger.info('请先执行构建命令: launcher build')
        process.exit(1)
      }

      // 检查是否有 index.html
      const indexPath = PathUtils.join(outDir, 'index.html')
      if (!(await FileSystem.exists(indexPath))) {
        logger.warn(`未找到 index.html 文件: ${indexPath}`)
        logger.info('预览服务器将提供目录浏览功能')
      }

      // 合并命令行参数和配置文件中的preview配置（命令行参数优先）
      const finalPreviewConfig: any = {
        host: context.options.host || previewConfig.host || DEFAULT_HOST,
        port: context.options.port || previewConfig.port || 4173,
        open: context.options.open ?? previewConfig.open ?? false,
        cors: context.options.cors !== false && (previewConfig.cors !== false),
        strictPort: context.options.strictPort || false,
      }

      // 处理HTTPS配置
      if (context.options.https) {
        finalPreviewConfig.https = true
      }
      else if (previewConfig.https) {
        finalPreviewConfig.https = previewConfig.https
      }

      // 合并配置到 launcher
      const mergedConfig = launcher.mergeConfig(launcher.getConfig(), {
        build: {
          outDir,
        },
        preview: finalPreviewConfig,
        launcher: {
          logLevel: context.options.debug ? 'debug' : 'info',
          debug: context.options.debug || false,
        },
      })

      // 更新 launcher 的内部配置
      launcher.setConfig(mergedConfig)

      // 设置事件监听器
      launcher.onReady(async () => {
        if (spinner) {
          spinner.succeed('预览服务器启动成功')
        }

        const duration = Date.now() - startTime
        const protocol = finalPreviewConfig.https ? 'https' : 'http'
        const addresses = NetworkInfo.formatUrls('localhost', finalPreviewConfig.port, protocol)

        // 显示启动信息
        const startupBanner = Banner.renderStartupInfo({
          title: 'Preview Server',
          version: '2.0.0',
          framework: detectedFramework?.type,
          engine: 'Vite Preview',
          nodeVersion: process.version,
          startTime: duration,
          useGradient: false,
        })
        logger.raw(startupBanner)

        // 显示网络地址
        const localUrl = `${protocol}://${finalPreviewConfig.host}:${finalPreviewConfig.port}`
        const networkBanner = Banner.renderNetworkInfo({
          local: localUrl,
          network: addresses.network,
        })
        logger.raw(networkBanner)

        // 显示二维码
        if (addresses.network.length > 0 && !context.options.silent) {
          try {
            QRCode.display({
              local: localUrl,
              network: addresses.network,
              showUrl: false,
            })
          } catch (error) {
            logger.debug(`二维码显示失败: ${(error as Error).message}`)
          }
        }

        // 显示快捷键
        const shortcuts = Banner.renderShortcuts([
          { key: 'h', description: '显示帮助' },
          { key: 'o', description: '在浏览器中打开' },
          { key: 'q', description: '退出' },
        ])
        logger.raw(shortcuts)

        // 显示构建统计
        await showBuildInfo(outDir, logger)
      })

      launcher.onError((error) => {
        logger.error(`预览服务器错误: ${error.message}`)
      })

      // 处理进程退出
      process.on('SIGINT', async () => {
        logger.info('正在停止预览服务器...')
        try {
          await launcher.destroy()
          logger.success('预览服务器已停止')
          process.exit(0)
        }
        catch (error) {
          logger.error('停止预览服务器失败', { error: (error as Error).message })
          process.exit(1)
        }
      })

      process.on('SIGTERM', async () => {
        logger.info('收到终止信号，正在停止预览服务器...')
        try {
          await launcher.destroy()
          process.exit(0)
        }
        catch (error) {
          logger.error('停止预览服务器失败', { error: (error as Error).message })
          process.exit(1)
        }
      })

      // 启动预览服务器
      await launcher.preview()

      // 显示构建信息
      await showBuildInfo(outDir, logger)

      // 保持进程运行
      await new Promise(() => { }) // 永远等待，直到收到退出信号
    }
    catch (error) {
      logger.error(`启动预览服务器失败: ${(error as Error).message}`)

      if (context.options.debug) {
        logger.error('启动预览服务器失败 - 堆栈信息', {
          stack: (error as Error).stack,
        })
      }

      // 提供一些常见错误的解决建议
      const errorMessage = (error as Error).message.toLowerCase()

      if (errorMessage.includes('eaddrinuse') || errorMessage.includes('port')) {
        logger.info('端口可能被占用，请尝试：')
        logger.info('1. 使用不同的端口: launcher preview --port 8080')
        logger.info('2. 检查是否有其他服务占用该端口')
        logger.info('3. 使用 --strictPort 选项禁用自动端口选择')
      }

      if (errorMessage.includes('enoent') || errorMessage.includes('not found')) {
        logger.info('文件或目录不存在，请检查：')
        logger.info('1. 是否已执行构建命令')
        logger.info('2. 构建输出目录是否正确')
        logger.info('3. 使用 --outDir 指定正确的输出目录')
      }

      process.exit(1)
    }
  }
}

/**
 * 显示构建信息
 *
 * @param outDir - 输出目录
 * @param logger - 日志记录器
 */
async function showBuildInfo(outDir: string, logger: Logger): Promise<void> {
  try {
    const stats: BuildOutputStats = {
      totalFiles: 0,
      totalSize: 0,
      jsFiles: 0,
      cssFiles: 0,
      htmlFiles: 0,
      assetFiles: 0,
    }

    // 递归统计所有文件
    await collectFileStats(outDir, stats, logger)

    logger.info('构建产物统计:')
    logger.info(`  总文件数: ${stats.totalFiles}`)
    logger.info(`  总大小: ${formatFileSize(stats.totalSize)}`)
    logger.info(`  HTML 文件: ${stats.htmlFiles}`)
    logger.info(`  JavaScript 文件: ${stats.jsFiles}`)
    logger.info(`  CSS 文件: ${stats.cssFiles}`)
    logger.info(`  资源文件: ${stats.assetFiles}`)
  }
  catch (error) {
    logger.debug('获取构建信息失败', { error: (error as Error).message })
  }
}

/**
 * 递归收集文件统计信息
 *
 * @param dir - 目录路径
 * @param stats - 统计信息对象
 * @param logger - 日志记录器
 */
interface BuildOutputStats {
  totalFiles: number
  totalSize: number
  jsFiles: number
  cssFiles: number
  htmlFiles: number
  assetFiles: number
}

async function collectFileStats(dir: string, stats: BuildOutputStats, logger: Logger): Promise<void> {
  try {
    const files = await FileSystem.readDir(dir)

    for (const file of files) {
      const filePath = PathUtils.join(dir, file)
      const fileStat = await FileSystem.stat(filePath)

      if (fileStat.isFile()) {
        stats.totalFiles++
        stats.totalSize += fileStat.size

        const ext = PathUtils.extname(file).toLowerCase()
        if (['.js', '.mjs', '.cjs'].includes(ext)) {
          stats.jsFiles++
        }
        else if (ext === '.css') {
          stats.cssFiles++
        }
        else if (ext === '.html') {
          stats.htmlFiles++
        }
        else {
          stats.assetFiles++
        }
      }
      else if (fileStat.isDirectory()) {
        // 递归处理子目录
        await collectFileStats(filePath, stats, logger)
      }
    }
  }
  catch (error) {
    // 忽略无法访问的目录（仅在 debug 模式下输出）
    logger.debug('无法访问目录', {
      dir,
      error: (error as Error).message,
    })
  }
}

/**
 * 格式化文件大小
 *
 * @param bytes - 字节数
 * @returns 格式化后的大小
 */
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}
