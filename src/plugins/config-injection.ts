/**
 * 配置注入插件
 * 
 * 将 launcher 配置注入到 import.meta.env 中，支持热更新
 * 
 * @author LDesign Team
 * @since 1.0.0
 */

import type { Plugin } from 'vite'
import type { ViteLauncherConfig } from '../types'
import { Logger } from '../utils/logger'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

/**
 * 配置注入插件选项
 */
export interface ConfigInjectionOptions {
  /** launcher 配置 */
  config: ViteLauncherConfig
  /** 环境标识 */
  environment: string
  /** 是否启用详细日志 */
  verbose?: boolean
}

/**
 * 创建配置注入插件
 * 
 * @param options 插件选项
 * @returns Vite 插件
 */
export function createConfigInjectionPlugin(options: ConfigInjectionOptions): Plugin {
  const { config, environment, verbose = false } = options
  const logger = new Logger('ConfigInjection')

  // 创建安全的配置对象，避免循环引用
  const createSafeConfig = (cfg: ViteLauncherConfig, packageInfo?: { name?: string; version?: string }) => {
    // 辅助函数：移除函数和循环引用
    const sanitizeValue = (value: any, depth = 0): any => {
      if (depth > 10) return '[深度超限]'
      if (value === null || value === undefined) return value
      if (typeof value === 'function') return '[Function]'
      if (typeof value === 'symbol') return '[Symbol]'

      if (Array.isArray(value)) {
        return value.map(item => sanitizeValue(item, depth + 1))
      }

      if (typeof value === 'object') {
        const result: any = {}
        for (const key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            result[key] = sanitizeValue(value[key], depth + 1)
          }
        }
        return result
      }

      return value
    }

    return {
      // 基本信息
      name: packageInfo?.name || 'LDesign App',
      version: packageInfo?.version || '1.0.0',
      environment: environment,

      // 完整的配置（移除函数和循环引用）
      server: sanitizeValue(cfg.server),
      preview: sanitizeValue(cfg.preview),
      build: sanitizeValue(cfg.build),
      resolve: sanitizeValue(cfg.resolve),
      css: sanitizeValue(cfg.css),
      optimizeDeps: sanitizeValue(cfg.optimizeDeps),
      launcher: sanitizeValue(cfg.launcher),
      define: sanitizeValue(cfg.define),
      envPrefix: cfg.envPrefix,

      // 代理配置
      proxy: cfg.proxy ? sanitizeValue(cfg.proxy) : undefined,

      // 插件数量（不暴露插件实例）
      pluginsCount: Array.isArray(cfg.plugins) ? cfg.plugins.length : 0
    }
  }

  // 读取 package.json 信息
  let packageInfo: { name?: string; version?: string } = {}
  try {
    const packageJsonPath = resolve(process.cwd(), 'package.json')
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
      packageInfo = {
        name: packageJson.name,
        version: packageJson.version
      }
    }
  } catch (error) {
    logger.warn('读取 package.json 失败', { error: (error as Error).message })
  }

  const safeConfig = createSafeConfig(config, packageInfo)

  return {
    name: 'ldesign:config-injection',

    config(config, { command }) {
      // 注入环境变量
      if (!config.define) {
        config.define = {}
      }

      // 注入 launcher 配置
      config.define['import.meta.env.VITE_LAUNCHER_CONFIG'] = JSON.stringify(safeConfig)
      config.define['import.meta.env.VITE_LAUNCHER_ENVIRONMENT'] = JSON.stringify(environment)
      config.define['import.meta.env.VITE_LAUNCHER_COMMAND'] = JSON.stringify(command)
      config.define['import.meta.env.VITE_LAUNCHER_TIMESTAMP'] = JSON.stringify(Date.now())

      // 静默注入配置到环境变量
    },

    configureServer(server) {
      // 配置信息 API 端点
      server.middlewares.use((req, res, next) => {
        if (req.url === '/__ldesign_config') {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')

          try {
            const configInfo = {
              environment,
              config: safeConfig,
              timestamp: Date.now(),
              server: {
                port: server.config.server?.port,
                host: server.config.server?.host,
                https: !!server.config.server?.https
              },
              api: {
                version: '1.0.0',
                endpoints: {
                  config: '/__ldesign_config',
                  clientUtils: '/__ldesign_client_utils.js'
                }
              }
            }

            res.end(JSON.stringify(configInfo, null, 2))
          } catch (error) {
            res.statusCode = 500
            res.end(JSON.stringify({
              error: 'Configuration serialization failed',
              message: error instanceof Error ? error.message : String(error)
            }))
          }
          return
        }

        if (req.url === '/__ldesign_client_utils.js') {
          res.setHeader('Content-Type', 'application/javascript')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(getClientConfigUtils())
          return
        }

        next()
      })

      // 静默启动，不输出额外信息
    },

    handleHotUpdate(ctx) {
      // 检查是否是 launcher 配置文件
      const isLauncherConfig = ctx.file.includes('launcher.') &&
        (ctx.file.endsWith('.config.ts') || ctx.file.endsWith('.config.js'))

      if (isLauncherConfig) {
        // 不在这里处理 launcher 配置变更，让 ConfigManager 处理
        // 这样可以确保使用新配置重启
        return []
      }
    }
  }
}

/**
 * 获取配置信息的客户端工具函数
 */
export const getClientConfigUtils = () => {
  return `
// LDesign Launcher 配置工具函数
(function() {
  let cachedConfig = null;

  window.__LDESIGN_LAUNCHER__ = {
    // 获取 launcher 配置
    getConfig() {
      return cachedConfig?.config || {}
    },

    // 获取当前环境
    getEnvironment() {
      return cachedConfig?.environment || 'development'
    },

    // 获取启动命令
    getCommand() {
      return 'dev'
    },

    // 获取启动时间戳
    getTimestamp() {
      return cachedConfig?.timestamp || Date.now()
    },

    // 获取完整配置信息
    async getFullConfig() {
      try {
        const response = await fetch('/__ldesign_config')
        const data = await response.json()
        cachedConfig = data
        return data
      } catch (error) {
        console.warn('无法获取完整配置信息:', error)
        return { config: {}, environment: 'development', timestamp: Date.now() }
      }
    },

    // 在控制台输出配置信息
    async logConfig() {
      const fullConfig = await this.getFullConfig()
      const env = this.getEnvironment()
      const timestamp = new Date(this.getTimestamp())

      console.group('🚀 LDesign Launcher 配置信息')
      console.log('环境:', env)
      console.log('启动时间:', timestamp.toLocaleString())
      console.log('配置:', fullConfig.config)
      if (fullConfig.server) {
        console.log('服务器:', fullConfig.server)
      }
      console.groupEnd()
    }
  }

  // 初始化配置
  window.__LDESIGN_LAUNCHER__.getFullConfig().then(() => {
    console.log(\`🌍 当前环境: \${window.__LDESIGN_LAUNCHER__.getEnvironment()}\`)
    console.log('💡 使用 window.__LDESIGN_LAUNCHER__.logConfig() 查看完整配置')
  }).catch(console.error)
})();
`
}
