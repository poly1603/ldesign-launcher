import { defineConfig } from '@ldesign/launcher'

/**
 * vue3-demo Launcher 配置
 * 环境: test
 *
 * 由 launcher generate 自动生成
 * 文档: https://github.com/nicepkg/ldesign
 */
export default defineConfig({
  // 🌐 开发服务器配置
  server: {
    port: 3000,
    host: 'localhost',
    open: true,
  },

  // ⚙️ Launcher 配置
  launcher: {
    // 日志级别: 'debug' | 'info' | 'warn' | 'error' | 'silent'
    logLevel: 'info',

    // 是否启用调试模式
    debug: false,

    // 配置变更时是否自动重启
    autoRestart: true,

    // 📡 代理配置
    proxy: {
      // API 代理
      api: {
        target: 'http://localhost:8080',
        pathPrefix: '/api',
        rewrite: true,
        headers: {
          'X-Forwarded-Host': 'localhost',
        },
      },
      // WebSocket 代理
      websocket: {
        target: 'ws://localhost:8080',
        pathPrefix: '/ws',
      },
      // 全局代理配置
      global: {
        timeout: 30000,
        verbose: false,
      },
    },

    // 🎭 Mock 服务配置
    mock: {
      enabled: true,
      mockDir: 'mock',
      watchFiles: true,
      logger: true,
      prefix: '/api',
    },

    // 💾 缓存配置
    cache: {
      enabled: true,
      strategy: 'hybrid',
      cacheDir: 'node_modules/.cache/launcher',
    },

    // 🪝 生命周期钩子
    hooks: {
      // beforeStart: async () => { console.log('准备启动...') },
      // afterStart: async () => { console.log('启动完成!') },
      // onError: (error) => { console.error('发生错误:', error) },
    },
  },

  // 📦 构建配置
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: false,
    // 构建目标
    target: 'es2020',
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          'vue': ['vue'],
          'vue-router': ['vue-router'],
        },
      },
    },
  },

  // 📱 开发工具配置
  tools: {
    pwa: {
      enabled: false,
      appName: 'vue3-demo',
      shortName: 'vue3-demo',
      themeColor: '#ffffff',
      backgroundColor: '#ffffff',
      generateSW: true,
      cacheStrategy: 'networkFirst',
    },
  },

  // 🔗 路径别名
  resolve: {
    alias: [
      { find: '@', replacement: './src' },
      { find: '~', replacement: './' },
    ],
  },
})