/**
 * 增强的 HMR 插件
 * 
 * 提供更稳定、更智能的热模块替换功能
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import type { Plugin, ViteDevServer, HmrContext, ModuleNode } from 'vite'
import { Logger } from '../utils/logger'

/**
 * HMR 增强选项
 */
export interface HMREnhancedOptions {
  /** 失败时自动全量刷新 */
  fallbackToFullReload?: boolean
  /** HMR 重试次数 */
  retries?: number
  /** 显示 HMR 统计 */
  showStats?: boolean
  /** 启用调试模式 */
  debug?: boolean
  /** HMR 超时时间（毫秒） */
  timeout?: number
}

/**
 * HMR 统计信息
 */
interface HMRStats {
  totalUpdates: number
  successfulUpdates: number
  failedUpdates: number
  fullReloads: number
  averageUpdateTime: number
  updateTimes: number[]
}

/**
 * 增强的 HMR 插件
 */
export function createHMREnhancedPlugin(options: HMREnhancedOptions = {}): Plugin {
  const logger = new Logger('HMR-Enhanced')
  
  const config: Required<HMREnhancedOptions> = {
    fallbackToFullReload: options.fallbackToFullReload !== false,
    retries: options.retries || 3,
    showStats: options.showStats || false,
    debug: options.debug || false,
    timeout: options.timeout || 5000
  }

  const stats: HMRStats = {
    totalUpdates: 0,
    successfulUpdates: 0,
    failedUpdates: 0,
    fullReloads: 0,
    averageUpdateTime: 0,
    updateTimes: []
  }

  let server: ViteDevServer | null = null

  return {
    name: 'launcher:hmr-enhanced',
    
    configureServer(viteServer) {
      server = viteServer

      // 增强 HMR 事件处理
      viteServer.ws.on('connection', (socket) => {
        if (config.debug) {
          logger.debug('HMR 客户端已连接')
        }

        // 发送增强配置到客户端
        socket.send(JSON.stringify({
          type: 'custom',
          event: 'hmr-config',
          data: {
            fallbackToFullReload: config.fallbackToFullReload,
            retries: config.retries,
            timeout: config.timeout
          }
        }))
      })

      // 监听 HMR 更新
      viteServer.ws.on('message', (message) => {
        try {
          const data = typeof message === 'string' ? JSON.parse(message) : message

          if (data.type === 'custom' && data.event === 'hmr-error') {
            stats.failedUpdates++
            
            if (config.debug) {
              logger.error('HMR 更新失败', { error: data.data.error })
            }

            // 如果启用回退，触发全量刷新
            if (config.fallbackToFullReload) {
              viteServer.ws.send({
                type: 'full-reload',
                path: '*'
              })
              stats.fullReloads++
              
              if (config.debug) {
                logger.info('已触发全量刷新')
              }
            }
          }

          if (data.type === 'custom' && data.event === 'hmr-success') {
            stats.successfulUpdates++
            
            if (data.data.updateTime) {
              stats.updateTimes.push(data.data.updateTime)
              
              // 计算平均更新时间
              if (stats.updateTimes.length > 100) {
                stats.updateTimes = stats.updateTimes.slice(-100) // 只保留最近 100 次
              }
              
              stats.averageUpdateTime = 
                stats.updateTimes.reduce((a, b) => a + b, 0) / stats.updateTimes.length
            }
          }
        } catch (error) {
          // 忽略非 JSON 消息
        }
      })
    },

    handleHotUpdate(ctx: HmrContext) {
      stats.totalUpdates++

      if (config.showStats) {
        const hitRate = stats.totalUpdates > 0
          ? ((stats.successfulUpdates / stats.totalUpdates) * 100).toFixed(1)
          : '0.0'

        logger.info(`HMR 统计: ${stats.successfulUpdates}/${stats.totalUpdates} 成功 (${hitRate}%), 平均 ${stats.averageUpdateTime.toFixed(0)}ms`)
      }

      // 返回 undefined 让 Vite 继续默认处理
      return undefined
    },

    transformIndexHtml(html) {
      // 注入增强的 HMR 客户端代码
      const clientCode = `
<script type="module">
  if (import.meta.hot) {
    const hmrConfig = ${JSON.stringify(config)};
    let updateStartTime;

    // 监听 HMR 更新开始
    import.meta.hot.on('vite:beforeUpdate', () => {
      updateStartTime = Date.now();
    });

    // 监听 HMR 更新完成
    import.meta.hot.on('vite:afterUpdate', () => {
      if (updateStartTime) {
        const updateTime = Date.now() - updateStartTime;
        
        // 发送成功统计到服务器
        if (import.meta.hot.send) {
          import.meta.hot.send('custom', {
            event: 'hmr-success',
            data: { updateTime }
          });
        }

        if (hmrConfig.debug) {
          console.log('[HMR] 更新成功，耗时:', updateTime + 'ms');
        }
      }
    });

    // 监听 HMR 错误
    import.meta.hot.on('vite:error', (error) => {
      if (hmrConfig.debug) {
        console.error('[HMR] 更新失败:', error);
      }

      // 发送错误到服务器
      if (import.meta.hot.send) {
        import.meta.hot.send('custom', {
          event: 'hmr-error',
          data: { error: error.message || String(error) }
        });
      }

      // 如果启用回退，等待服务器触发全量刷新
      if (hmrConfig.fallbackToFullReload) {
        console.log('[HMR] 即将触发全量刷新...');
      }
    });
  }
</script>
      `

      return html.replace('</head>', `${clientCode}</head>`)
    }
  }
}

/**
 * 获取 HMR 统计信息（从插件实例）
 */
export function getHMRStats(plugin: Plugin): HMRStats | null {
  // 这里需要从插件闭包中访问 stats
  // 实际实现可能需要导出 stats
  return null
}

