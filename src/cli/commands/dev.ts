/**
 * Dev 命令实现
 *
 * 启动开发服务器命令
 *
 * @author LDesign Team
 * @since 1.0.0
 */

import type { CliCommandDefinition, CliContext } from '../../types'
import pc from 'picocolors'
import { DEFAULT_HOST, DEFAULT_PORT } from '../../constants'
import { ViteLauncher } from '../../core/ViteLauncher'
import { Banner, QRCode } from '../../ui'
import { Spinner } from '../../ui/Spinner'
import { Logger } from '../../utils/logger'
import { NetworkInfo } from '../../utils/network-info'

/**
 * Dev 命令类
 */
export class DevCommand implements CliCommandDefinition {
  name = 'dev'
  aliases = ['serve', 'start']
  description = '启动开发服务器'
  usage = 'launcher dev [options]'

  options = [
    {
      name: 'port',
      alias: 'p',
      description: '指定端口号',
      type: 'number' as const,
      default: DEFAULT_PORT,
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
      name: 'force',
      alias: 'f',
      description: '强制重新构建依赖',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'cors',
      description: '启用 CORS',
      type: 'boolean' as const,
      default: true,
    },
    {
      name: 'strictPort',
      description: '严格端口模式（端口被占用时不自动尝试下一个端口）',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'clearScreen',
      description: '启动时清屏',
      type: 'boolean' as const,
      default: true,
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
      description: '启动开发服务器',
      command: 'launcher dev',
    },
    {
      description: '在指定端口启动',
      command: 'launcher dev --port 8080',
    },
    {
      description: '允许外部访问',
      command: 'launcher dev --host 0.0.0.0',
    },
    {
      description: '启动后自动打开浏览器',
      command: 'launcher dev --open',
    },
    {
      description: '启用 HTTPS',
      command: 'launcher dev --https',
    },
    {
      description: '强制重新构建依赖',
      command: 'launcher dev --force',
    },
    {
      description: '使用开发环境配置',
      command: 'launcher dev --environment development',
    },
    {
      description: '使用生产环境配置',
      command: 'launcher dev --environment production',
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

    // 验证环境名称
    if (options.environment) {
      const validEnvironments = ['development', 'production', 'test', 'staging', 'preview']
      if (!validEnvironments.includes(options.environment)) {
        return `环境名称必须是以下之一: ${validEnvironments.join(', ')}`
      }
    }

    return true
  }

  /**
   * 执行命令
   *
   * @param context - CLI 上下文
   */
  async handler(context: CliContext): Promise<void> {
    const startTime = Date.now()

    // 抑制 Node.js 的实验性功能警告
    const originalEmitWarning = process.emitWarning
    process.emitWarning = (warning, ...args: any[]) => {
      if (typeof warning === 'string' && warning.includes('ExperimentalWarning')) {
        return
      }
      if (typeof warning === 'object' && warning.name === 'ExperimentalWarning') {
        return
      }
      return originalEmitWarning.call(process, warning, ...args)
    }

    const logger = new Logger('dev', {
      level: context.options.silent ? 'silent' : (context.options.debug ? 'debug' : 'info'),
      colors: context.terminal.supportsColor,
      compact: !context.options.debug,
    })

    try {
      // 确定环境和模式
      const environment = context.options.environment || context.options.mode || 'development'
      const mode = context.options.mode || (environment === 'production' ? 'production' : 'development')

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
              `检测到 ${pc.bold(pc.green(frameworkName))} 框架 (置信度: ${pc.cyan(`${confidencePercent}%`)})`,
            )
          }

          // 显示检测依据
          if (context.options.debug && detectedFramework.evidence) {
            const { dependencies, files, configFiles } = detectedFramework.evidence
            if (dependencies && dependencies.length > 0) {
              logger.debug(`  依赖: ${dependencies.join(', ')}`)
            }
            if (files && files.length > 0) {
              logger.debug(`  文件: ${files.join(', ')}`)
            }
            if (configFiles && configFiles.length > 0) {
              logger.debug(`  配置: ${configFiles.join(', ')}`)
            }
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

      // 启动服务器（使用spinner）
      if (!context.options.silent) {
        spinner = new Spinner({
          text: '正在启动开发服务器...',
          spinner: 'dots',
          color: 'cyan',
        })
      }

      // 先创建基础的 ViteLauncher 实例，只传入必要的配置
      const launcherConfig: any = {
        launcher: {
          logLevel: context.options.silent ? 'silent' : (context.options.debug ? 'debug' : 'info'),
          mode,
          debug: context.options.debug || false,
        },
      }

      // 如果检测到框架，添加框架信息到配置
      if (detectedFramework && detectedFramework.detected && detectedFramework.type) {
        launcherConfig.launcher.framework = detectedFramework.type
      }

      // 只有当明确指定了配置文件时才设置 configFile
      if (context.configFile) {
        launcherConfig.launcher.configFile = context.configFile
      }

      // 只在debug模式下输出详细信息
      if (context.options.debug) {
        logger.debug('创建 ViteLauncher 实例', {
          cwd: context.cwd,
          environment,
          framework: detectedFramework?.type,
          config: launcherConfig,
        })
      }

      const launcher = new ViteLauncher({
        cwd: context.cwd,
        config: launcherConfig,
        environment,
      })

      // 构建命令行参数覆盖配置
      const cliOverrides: any = {
        mode,
        clearScreen: context.options.clearScreen,
      }

      // 只有当命令行明确指定了参数时才覆盖配置文件中的值
      if (context.options.host !== undefined) {
        cliOverrides.server = cliOverrides.server || {}
        cliOverrides.server.host = context.options.host
      }
      if (context.options.port !== undefined) {
        cliOverrides.server = cliOverrides.server || {}
        cliOverrides.server.port = context.options.port
      }
      if (context.options.open !== undefined) {
        cliOverrides.server = cliOverrides.server || {}
        cliOverrides.server.open = context.options.open
      }
      if (context.options.cors !== undefined) {
        cliOverrides.server = cliOverrides.server || {}
        cliOverrides.server.cors = context.options.cors
      }
      if (context.options.strictPort !== undefined) {
        cliOverrides.server = cliOverrides.server || {}
        cliOverrides.server.strictPort = context.options.strictPort
      }
      if (context.options.https !== undefined) {
        cliOverrides.server = cliOverrides.server || {}
        cliOverrides.server.https = context.options.https
      }
      if (context.options.force !== undefined) {
        cliOverrides.optimizeDeps = cliOverrides.optimizeDeps || {}
        cliOverrides.optimizeDeps.force = context.options.force
      }

      // 启动开发服务器，传入命令行覆盖配置
      await launcher.startDev(cliOverrides)

      // 停止spinner
      if (spinner) {
        spinner.succeed('开发服务器启动成功')
      }

      // 仅保留错误监听，避免递归日志
      launcher.onError((error) => {
        logger.error(`开发服务器错误: ${error.message}`)
      })

      // 处理进程退出
      process.on('SIGINT', async () => {
        logger.info('正在停止开发服务器...')
        try {
          await launcher.stopDev()
          await launcher.destroy()
          logger.success('开发服务器已停止')
          process.exit(0)
        }
        catch (error) {
          logger.error(`停止开发服务器失败: ${(error as Error).message}`)
          process.exit(1)
        }
      })

      process.on('SIGTERM', async () => {
        logger.info('收到终止信号，正在停止开发服务器...')
        try {
          await launcher.stopDev()
          await launcher.destroy()
          process.exit(0)
        }
        catch (error) {
          logger.error(`停止开发服务器失败: ${(error as Error).message}`)
          process.exit(1)
        }
      })

      // 计算启动时间
      const duration = Date.now() - startTime

      // 获取服务器信息并美化显示
      const serverInfo = launcher.getServerInfo()
      if (serverInfo && !context.options.silent) {
        const protocol = serverInfo.https ? 'https' : 'http'
        const addresses = NetworkInfo.formatUrls('localhost', serverInfo.port, protocol)

        // 显示启动信息
        const startupBanner = Banner.renderStartupInfo({
          title: 'Launcher',
          version: '2.0.0',
          framework: detectedFramework?.type,
          engine: 'Vite 5.0',
          nodeVersion: process.version,
          startTime: duration,
          useGradient: true,
        })
        logger.raw(startupBanner)

        // 显示网络地址
        const networkBanner = Banner.renderNetworkInfo({
          local: serverInfo.url || `http://localhost:${serverInfo.port}`,
          network: addresses.network,
        })
        logger.raw(networkBanner)

        // 显示二维码
        if (addresses.network.length > 0) {
          try {
            QRCode.display({
              local: serverInfo.url || `http://localhost:${serverInfo.port}`,
              network: addresses.network,
              showUrl: false,
            })
          }
          catch (error) {
            logger.debug(`二维码显示失败: ${(error as Error).message}`)
          }
        }

        // 显示快捷键
        const shortcuts = Banner.renderShortcuts([
          { key: 'h', description: '显示帮助' },
          { key: 'c', description: '清屏' },
          { key: 'o', description: '在浏览器中打开' },
          { key: 'r', description: '重启服务器' },
          { key: 'q', description: '退出' },
        ])
        logger.raw(shortcuts)

        // 复制地址到剪贴板
        NetworkInfo.copyToClipboard(serverInfo.url || `http://localhost:${serverInfo.port}`).catch(() => {
          // 静默失败
        })
      }

      // 保持进程运行
      await new Promise(() => { }) // 永远等待，直到收到退出信号
    }
    catch (error) {
      logger.error(`启动开发服务器失败: ${(error as Error).message}`)

      if (context.options.debug) {
        logger.error('启动开发服务器失败 - 堆栈信息', {
          stack: (error as Error).stack,
        })
      }

      // 提供一些常见错误的解决建议
      const errorMessage = (error as Error).message.toLowerCase()

      if (errorMessage.includes('eaddrinuse') || errorMessage.includes('port')) {
        logger.info('端口可能被占用，请尝试：')
        logger.info('1. 使用不同的端口: launcher dev --port 8080')
        logger.info('2. 检查是否有其他服务占用该端口')
        logger.info('3. 使用 --strictPort 选项禁用自动端口选择')
      }

      if (errorMessage.includes('config') || errorMessage.includes('file not found')) {
        logger.info('配置文件问题，请检查：')
        logger.info('1. 配置文件是否存在')
        logger.info('2. 配置文件格式是否正确')
        logger.info('3. 使用 --config 指定配置文件路径')
      }

      process.exit(1)
    }
  }
}
