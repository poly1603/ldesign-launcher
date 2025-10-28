/**
 * UI 命令 - 启动服务端和 Web 前端
 * 
 * 自动构建（如果需要）并启动 server 和 web，启动成功后打开浏览器
 * 
 * @author LDesign Team
 * @since 1.0.0
 */

import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import open from 'open'
import type { CliContext } from '../../types'
import { Logger } from '../../utils/logger'

export class UICommand {
  name = 'ui'
  description = '启动服务端和 Web 前端（自动构建并打开浏览器）'
  
  options = [
    {
      name: 'server-port',
      alias: 'sp',
      description: '服务端端口',
      type: 'number' as const,
      default: 3000
    },
    {
      name: 'web-port',
      alias: 'wp',
      description: 'Web 前端端口',
      type: 'number' as const,
      default: 5173
    },
    {
      name: 'dev',
      description: '启用开发模式（详细日志）',
      type: 'boolean' as const,
      default: false
    },
    {
      name: 'no-open',
      description: '不自动打开浏览器',
      type: 'boolean' as const,
      default: false
    },
    {
      name: 'no-build',
      description: '跳过构建步骤',
      type: 'boolean' as const,
      default: false
    }
  ]

  examples = [
    {
      command: 'ldesign ui',
      description: '启动服务端和 Web 前端（默认端口）'
    },
    {
      command: 'ldesign ui --dev',
      description: '开发模式启动（支持热更新，详细日志）'
    },
    {
      command: 'ldesign ui --server-port 4000 --web-port 8080',
      description: '指定端口启动'
    },
    {
      command: 'ldesign ui --no-open',
      description: '启动但不打开浏览器'
    }
  ]

  async handler(context: CliContext): Promise<void> {
    const logger = new Logger('UI', { 
      level: context.options.dev ? 'debug' : 'info',
      colors: true 
    })

    const serverPort = context.options['server-port'] || context.options.sp || 3000
    const webPort = context.options['web-port'] || context.options.wp || 5173
    const shouldOpen = !context.options['no-open']
    const shouldBuild = !context.options['no-build']

    // 获取项目根目录
    const rootDir = join(context.cwd, '..', '..')
    const serverDir = join(rootDir, 'tools', 'server')
    const webDir = join(rootDir, 'tools', 'web')

    logger.info('🚀 启动 LDesign UI...')
    
    // 检查必要的目录是否存在
    if (!existsSync(serverDir)) {
      logger.error(`服务端目录不存在: ${serverDir}`)
      process.exit(1)
    }
    if (!existsSync(webDir)) {
      logger.error(`Web 前端目录不存在: ${webDir}`)
      process.exit(1)
    }

    const processes: ChildProcess[] = []

    // 清理函数
    const cleanup = () => {
      logger.info('🛑 正在关闭所有进程...')
      processes.forEach(p => {
        if (p && !p.killed) {
          p.kill()
        }
      })
      process.exit(0)
    }

    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)

    try {
      // 1. 构建服务端（如果需要且不是 dev 模式）
      if (shouldBuild && !context.options.dev) {
        const serverDist = join(serverDir, 'dist')
        if (!existsSync(serverDist)) {
          logger.info('📦 构建服务端...')
          await this.runCommand('pnpm', ['build'], serverDir, logger)
        } else {
          logger.debug('✓ 服务端已构建')
        }
      }

      // 2. 启动服务端
      const serverCommand = context.options.dev ? 'dev' : 'start'
      logger.info(`🔧 启动服务端 (端口: ${serverPort}, 模式: ${serverCommand})...`)
      const serverProcess = spawn('pnpm', [serverCommand], {
        cwd: serverDir,
        env: { 
          ...process.env, 
          PORT: String(serverPort),
          HOST: '127.0.0.1'
        },
        stdio: context.options.dev ? 'inherit' : 'pipe',
        shell: true
      })

      processes.push(serverProcess)

      if (!context.options.dev && serverProcess.stdout) {
        serverProcess.stdout.on('data', (data) => {
          const msg = data.toString()
          if (msg.includes('started') || msg.includes('listening')) {
            logger.debug(`[Server] ${msg.trim()}`)
          }
        })
      }

      if (serverProcess.stderr) {
        serverProcess.stderr.on('data', (data) => {
          logger.error(`[Server] ${data.toString().trim()}`)
        })
      }

      // 等待服务端启动
      await this.waitForServer(serverPort, logger)
      logger.success(`✓ 服务端已启动: http://127.0.0.1:${serverPort}`)

      // 3. 启动 Web 前端
      logger.info(`🎨 启动 Web 前端 (端口: ${webPort})...`)
      const webProcess = spawn('pnpm', ['dev', '--', '--port', String(webPort), '--host', '127.0.0.1'], {
        cwd: webDir,
        env: { 
          ...process.env,
          VITE_API_URL: `http://127.0.0.1:${serverPort}`
        },
        stdio: context.options.dev ? 'inherit' : 'pipe',
        shell: true
      })

      processes.push(webProcess)

      if (!context.options.dev && webProcess.stdout) {
        webProcess.stdout.on('data', (data) => {
          const msg = data.toString()
          if (msg.includes('Local:') || msg.includes('ready')) {
            logger.debug(`[Web] ${msg.trim()}`)
          }
        })
      }

      if (webProcess.stderr) {
        webProcess.stderr.on('data', (data) => {
          const msg = data.toString()
          // Vite 的一些信息会输出到 stderr，过滤掉非错误信息
          if (!msg.includes('vite') && !msg.includes('ready')) {
            logger.error(`[Web] ${msg.trim()}`)
          }
        })
      }

      // 等待 Web 前端启动
      await this.waitForServer(webPort, logger)
      logger.success(`✓ Web 前端已启动: http://127.0.0.1:${webPort}`)

      // 4. 打开浏览器
      if (shouldOpen) {
        logger.info('🌐 打开浏览器...')
        await open(`http://127.0.0.1:${webPort}`)
      }

      logger.success('✨ LDesign UI 启动完成！')
      logger.info(`   服务端: http://127.0.0.1:${serverPort}`)
      logger.info(`   Web 前端: http://127.0.0.1:${webPort}`)
      logger.info('')
      logger.info('按 Ctrl+C 停止所有服务')

      // 保持进程运行
      await new Promise(() => {})

    } catch (error) {
      logger.error('启动失败:', error)
      cleanup()
      process.exit(1)
    }
  }

  /**
   * 运行命令并等待完成
   */
  private async runCommand(
    command: string, 
    args: string[], 
    cwd: string, 
    logger: Logger
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        cwd,
        stdio: 'inherit',
        shell: true
      })

      proc.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`命令执行失败，退出码: ${code}`))
        }
      })

      proc.on('error', reject)
    })
  }

  /**
   * 等待服务器启动
   */
  private async waitForServer(port: number, logger: Logger, timeout = 30000): Promise<void> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}`)
        if (response.ok || response.status === 404) {
          return
        }
      } catch {
        // 服务器还未启动，继续等待
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    throw new Error(`等待端口 ${port} 超时`)
  }
}
