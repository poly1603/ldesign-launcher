/**
 * 开发日志 Vite 插件
 * @description 在开发模式下启动日志服务器并注入客户端代码
 */

import type { Plugin, ViteDevServer } from 'vite'
import type { DevLoggerPluginOptions } from './types'
import { DevLoggerWebSocketServer } from './websocket-server'
import { LogFileWriter } from './file-writer'
import { createLogger } from '../../utils/logger'

/** 创建日志器实例 */
const logger = createLogger('DevLoggerPlugin')

/** 默认配置 */
const DEFAULT_OPTIONS: DevLoggerPluginOptions = {
  port: 9527,
  path: '/__dev_logger',
  logDir: './logs',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  filePrefix: 'dev',
  enableConsole: true,
  minLevel: 0, // TRACE
  enabled: true,
}

/**
 * 创建开发日志 Vite 插件
 * @param options - 插件配置
 * @returns Vite 插件
 * @example
 * ```ts
 * // vite.config.ts
 * import { devLoggerPlugin } from '@ldesign/launcher'
 *
 * export default {
 *   plugins: [
 *     devLoggerPlugin({
 *       port: 9527,
 *       logDir: './logs',
 *     })
 *   ]
 * }
 * ```
 */
export function devLoggerPlugin(options: DevLoggerPluginOptions = {}): Plugin {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let wsServer: DevLoggerWebSocketServer | null = null

  return {
    name: 'ldesign:dev-logger',
    apply: 'serve', // 仅在开发模式生效

    configureServer(server: ViteDevServer) {
      if (!opts.enabled) {
        return
      }

      // 创建文件写入器
      const fileWriter = new LogFileWriter({
        logDir: opts.logDir,
        maxFileSize: opts.maxFileSize,
        maxFiles: opts.maxFiles,
        filePrefix: opts.filePrefix,
      })

      // 创建 WebSocket 服务器
      wsServer = new DevLoggerWebSocketServer(
        {
          port: opts.port,
          path: opts.path,
        },
        fileWriter,
      )

      // 启动服务器
      wsServer.start()

      // 服务器关闭时清理
      server.httpServer?.on('close', async () => {
        if (wsServer) {
          await wsServer.stop()
          wsServer = null
        }
      })

      logger.info(`[DevLogger] 开发日志插件已启用，日志目录: ${opts.logDir}`)
    },

    // 注入客户端配置
    transformIndexHtml() {
      if (!opts.enabled) {
        return []
      }

      return [
        {
          tag: 'script',
          attrs: { type: 'module' },
          children: `
            // 开发日志配置注入
            window.__DEV_LOGGER_CONFIG__ = {
              wsUrl: 'ws://localhost:${opts.port}${opts.path}',
              enabled: true,
            };
          `,
          injectTo: 'head-prepend',
        },
      ]
    },

    // 关闭钩子
    async closeBundle() {
      if (wsServer) {
        await wsServer.stop()
        wsServer = null
      }
    },
  }
}

/**
 * 默认导出
 */
export default devLoggerPlugin

