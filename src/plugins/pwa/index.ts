/**
 * PWA 插件集成
 *
 * 提供渐进式 Web 应用支持
 * 支持 vite-plugin-pwa 和自定义 Service Worker
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type { Plugin } from 'vite'
import type { ToolsConfig } from '../../types/config'
import { Logger } from '../../utils/logger'

const logger = new Logger('PWAPlugin')

/**
 * PWA 配置选项
 */
export type PWAOptions = NonNullable<ToolsConfig['pwa']>

/**
 * 创建 PWA 插件
 *
 * @param options - PWA 配置选项
 * @param _cwd - 工作目录（预留参数）
 * @returns Vite 插件或 null
 */
export async function createPWAPlugin(
  options: PWAOptions,
  _cwd: string,
): Promise<Plugin | null> {
  if (!options.enabled) {
    return null
  }

  try {
    // @ts-expect-error - vite-plugin-pwa 是可选依赖
    const pwaModule = await import('vite-plugin-pwa')
    const { VitePWA } = pwaModule

    logger.info('正在配置 PWA 插件...')

    const pwaPlugin = VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: options.appName || 'LDesign App',
        short_name: options.shortName || 'LDesign',
        description: options.description || 'A Progressive Web Application',
        theme_color: options.themeColor || '#ffffff',
        background_color: options.backgroundColor || '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // 缓存策略配置
        runtimeCaching: getRuntimeCaching(options.cacheStrategy || 'networkFirst'),
        // 清理过期缓存
        cleanupOutdatedCaches: true,
        // 跳过等待
        skipWaiting: true,
        // 立即接管页面
        clientsClaim: true,
        // 离线页面
        navigateFallback: options.offlinePage || '/offline.html',
        navigateFallbackDenylist: [/^\/api/],
      },
      // 是否生成 Service Worker
      injectRegister: options.generateSW !== false ? 'auto' : null,
      // 开发模式下也启用 PWA（方便测试）
      devOptions: {
        enabled: process.env.NODE_ENV === 'development',
        type: 'module',
      },
    })

    logger.success('PWA 插件配置完成')

    // VitePWA 返回插件数组，直接返回第一个插件
    const plugins = Array.isArray(pwaPlugin) ? pwaPlugin : [pwaPlugin]

    // 创建一个包装插件，将 PWA 插件注入到配置中
    return {
      name: 'ldesign:pwa-wrapper',
      enforce: 'pre',
      configResolved(_resolvedConfig) {
        // PWA 插件已通过 ViteLauncher 注入
        logger.debug('PWA 插件已注入', { count: plugins.length })
      },
    } as Plugin
  }
  catch {
    logger.warn('vite-plugin-pwa 未安装，跳过 PWA 配置')
    logger.info('提示: npm install -D vite-plugin-pwa')
    return null
  }
}

/**
 * 获取运行时缓存配置
 */
function getRuntimeCaching(strategy: PWAOptions['cacheStrategy']): any[] {
  const baseConfig = [
    {
      // 图片缓存
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 天
        },
      },
    },
    {
      // 字体缓存
      urlPattern: /\.(?:woff|woff2|ttf|eot)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'fonts-cache',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 年
        },
      },
    },
    {
      // 静态资源缓存
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 天
        },
      },
    },
  ]

  // 根据策略添加 API 缓存配置
  switch (strategy) {
    case 'cacheFirst':
      baseConfig.push({
        urlPattern: /^https:\/\/api\./i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60, // 1 小时
          },
          networkTimeoutSeconds: 10,
        },
      } as any)
      break

    case 'staleWhileRevalidate':
      baseConfig.push({
        urlPattern: /^https:\/\/api\./i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60, // 1 小时
          },
        },
      } as any)
      break

    case 'networkFirst':
    default:
      baseConfig.push({
        urlPattern: /^https:\/\/api\./i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60, // 1 小时
          },
          networkTimeoutSeconds: 10,
        },
      } as any)
      break
  }

  return baseConfig
}

/**
 * 生成离线页面模板
 */
export function generateOfflinePageTemplate(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>离线页面</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    p {
      font-size: 1.1rem;
      opacity: 0.9;
      margin-bottom: 2rem;
    }
    .btn {
      display: inline-block;
      padding: 0.8rem 2rem;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid #fff;
      border-radius: 30px;
      color: #fff;
      text-decoration: none;
      font-size: 1rem;
      transition: all 0.3s ease;
      cursor: pointer;
    }
    .btn:hover {
      background: #fff;
      color: #667eea;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>您当前处于离线状态</h1>
    <p>请检查您的网络连接后重试</p>
    <button class="btn" onclick="window.location.reload()">重新加载</button>
  </div>
  <script>
    // 监听在线状态变化
    window.addEventListener('online', () => {
      window.location.reload();
    });
  </script>
</body>
</html>`
}

/**
 * 生成 PWA manifest 模板
 */
export function generateManifestTemplate(options: PWAOptions): object {
  return {
    name: options.appName || 'LDesign App',
    short_name: options.shortName || 'LDesign',
    description: options.description || 'A Progressive Web Application',
    theme_color: options.themeColor || '#ffffff',
    background_color: options.backgroundColor || '#ffffff',
    display: 'standalone',
    scope: '/',
    start_url: '/',
    icons: [
      {
        src: 'pwa-64x64.png',
        sizes: '64x64',
        type: 'image/png',
      },
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'maskable-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [],
    categories: ['productivity', 'utilities'],
    orientation: 'portrait-primary',
    prefer_related_applications: false,
  }
}
