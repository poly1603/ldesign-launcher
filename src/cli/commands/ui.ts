/**
 * launcher ui 命令
 * 启动可视化 Dashboard 界面
 */
import chalk from 'chalk'
import boxen from 'boxen'
import { startDashboard, type DashboardServerOptions } from '../../dashboard/server'
import detectPort from 'detect-port'

interface UICommandOptions {
  port?: number
  host?: string
  open?: boolean
}

/**
 * 显示 Dashboard Banner
 */
function showBanner(url: string): void {
  const banner = boxen(
    `
${chalk.bold.cyan('🎨 LDesign Launcher Dashboard')}

${chalk.green('✨ Dashboard is ready!')}

${chalk.gray('Local:')}    ${chalk.cyan(url)}
${chalk.gray('Network:')}  ${chalk.cyan(url.replace('localhost', '0.0.0.0'))}

${chalk.gray('Press')} ${chalk.yellow('Ctrl+C')} ${chalk.gray('to stop')}
`.trim(),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    }
  )

  console.log(banner)
}

/**
 * 显示功能列表
 */
function showFeatures(): void {
  console.log(chalk.bold('\n📋 Dashboard 功能:\n'))

  const features = [
    { icon: '📊', name: '项目管理', desc: '启动、停止、重启多个项目' },
    { icon: '📈', name: '性能监控', desc: '实时查看内存、构建时间等指标' },
    { icon: '📝', name: '实时日志', desc: 'WebSocket 推送的实时日志流' },
    { icon: '🔧', name: '配置编辑', desc: '可视化编辑 launcher 配置' },
    { icon: '📦', name: '依赖分析', desc: '分析项目依赖和包体积' },
    { icon: '🎨', name: '模板创建', desc: '从模板快速创建新项目' },
  ]

  features.forEach(({ icon, name, desc }) => {
    console.log(`  ${icon} ${chalk.bold(name)} - ${chalk.gray(desc)}`)
  })

  console.log()
}

/**
 * UI 命令处理函数
 */
export async function uiCommand(options: UICommandOptions = {}): Promise<void> {
  const defaultPort = 5555
  const port = options.port ?? defaultPort

  console.log(chalk.cyan('\n🚀 Starting LDesign Launcher Dashboard...\n'))

  try {
    // 检测端口可用性
    const availablePort = await detectPort(port)
    if (availablePort !== port) {
      console.log(chalk.yellow(`⚠️  Port ${port} is in use, using ${availablePort} instead\n`))
    }

    const serverOptions: DashboardServerOptions = {
      port: availablePort,
      host: options.host ?? '0.0.0.0',
      open: options.open !== false,
    }

    // 启动服务器
    const server = await startDashboard(serverOptions)
    const url = `http://localhost:${availablePort}`

    // 显示 Banner
    showBanner(url)

    // 显示功能列表
    showFeatures()

    // 显示 API 端点
    console.log(chalk.bold('🔌 API Endpoints:\n'))
    console.log(`  ${chalk.gray('GET')}  /api/projects         - 获取所有项目`)
    console.log(`  ${chalk.gray('POST')} /api/projects/scan    - 扫描项目目录`)
    console.log(`  ${chalk.gray('POST')} /api/projects/:id/start - 启动项目`)
    console.log(`  ${chalk.gray('POST')} /api/projects/:id/stop  - 停止项目`)
    console.log(`  ${chalk.gray('GET')}  /api/templates        - 获取模板列表`)
    console.log(`  ${chalk.gray('GET')}  /api/system/info      - 系统信息`)
    console.log(`  ${chalk.gray('WS')}   /ws                   - WebSocket 连接`)
    console.log()

    // 处理退出信号
    const cleanup = async () => {
      console.log(chalk.yellow('\n\n👋 Shutting down Dashboard...\n'))
      await server.stop()
      process.exit(0)
    }

    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)

    // 保持进程运行
    await new Promise(() => {})
  } catch (error) {
    console.error(chalk.red('\n❌ Failed to start Dashboard:'))
    console.error(chalk.red((error as Error).message))
    process.exit(1)
  }
}

/**
 * 命令定义
 */
export const uiCommandDefinition = {
  name: 'ui',
  description: 'Start the visual Dashboard interface',
  options: [
    {
      flags: '-p, --port <port>',
      description: 'Dashboard server port',
      default: '5555',
    },
    {
      flags: '-h, --host <host>',
      description: 'Dashboard server host',
      default: '0.0.0.0',
    },
    {
      flags: '--no-open',
      description: 'Do not open browser automatically',
    },
  ],
  action: uiCommand,
}

export default uiCommand
