import { defineConfig } from 'tsup'
import { cpus } from 'os'

// 获取CPU核心数用于并行构建
const numCPUs = cpus().length

// 环境变量
const isDev = process.env.NODE_ENV === 'development'
const isProd = process.env.NODE_ENV === 'production'
const isAnalyze = process.env.ANALYZE === 'true'
const isCI = process.env.CI === 'true'

export default defineConfig([
  // 客户端代码构建配置（浏览器环境）
  {
    entry: {
      'client/app-config': 'src/client/app-config.ts',
      'client/launcher-config': 'src/client/launcher-config.ts',
      'client/index': 'src/client/index.ts',
      'client/react/useAppConfig': 'src/client/react/useAppConfig.ts',
      'client/vue/index': 'src/client/vue/index.ts',
      'client/vue2/useAppConfig': 'src/client/vue2/useAppConfig.ts',
      'client/svelte/useAppConfig': 'src/client/svelte/useAppConfig.ts',
      'client/solid/useAppConfig': 'src/client/solid/useAppConfig.ts',
      'client/qwik/useAppConfig': 'src/client/qwik/useAppConfig.ts',
      'client/lit/useAppConfig': 'src/client/lit/useAppConfig.ts',
      'client/angular/useAppConfig': 'src/client/angular/useAppConfig.ts',
    },
    format: ['esm'], // 客户端只需要 ESM 格式
    dts: {
      only: false,
      resolve: true,
      compilerOptions: {
        composite: false,
        incremental: false
      }
    },
    tsconfig: 'tsconfig.json',
    clean: false, // 不清理，因为有多个配置
    splitting: false, // 客户端代码不分割，避免引入 Node.js 模块
    sourcemap: isDev,
    minify: isProd,
    target: 'es2020', // 浏览器目标
    outDir: 'dist',
    platform: 'browser', // 明确指定为浏览器平台
    treeshake: {
      preset: 'recommended',
      moduleSideEffects: false
    },
    loader: {
      '.ts': 'ts',
      '.tsx': 'tsx'
    },
    outExtension({ format }) {
      return {
        js: `.${format === 'cjs' ? 'cjs' : 'js'}`
      }
    },
    // 客户端代码需要将框架库标记为 external，避免重复打包
    external: [
      'react',
      'react-dom',
      'vue',
      'svelte',
      'solid-js',
      '@builder.io/qwik',
      'lit',
      'preact',
      '@angular/core',
      '@angular/common',
      '@angular/platform-browser'
    ],
  },
  // 服务端代码构建配置（Node.js 环境）
  {
    entry: [
      'src/**/*.ts',
      '!src/**/*.test.ts',
      '!src/**/*.spec.ts',
      '!src/**/*.bench.ts',
      '!src/__tests__/**/*',
      '!src/client/**/*', // 排除客户端代码
    ],
    format: ['cjs', 'esm'],
    dts: {
      only: false,
      resolve: true,
      compilerOptions: {
        composite: false,
        incremental: false,
        declaration: true,
        declarationMap: isDev
      }
    },
    tsconfig: 'tsconfig.json',
    clean: true, // 第一个配置清理
    splitting: true,
    sourcemap: isDev,
    minify: isProd ? {
      compress: {
        drop_console: false, // 保留console，方便调试
        drop_debugger: true,
        pure_funcs: ['console.debug', 'console.trace']
      },
      mangle: true
    } : false,
    target: 'node16',
    outDir: 'dist',
    platform: 'node',
    shims: true,
    treeshake: {
      preset: 'recommended',
      moduleSideEffects: 'no-external',
      propertyReadSideEffects: false
    },
    loader: {
      '.ts': 'ts',
      '.tsx': 'tsx'
    },
    outExtension({ format }) {
      return {
        js: `.${format === 'cjs' ? 'cjs' : 'js'}`
      }
    },
    // 将运行时依赖全部 external，减小产物体积
    external: [
      // Vite 及插件
      'vite',
      '@vitejs/plugin-vue',
      '@vitejs/plugin-vue2',
      '@vitejs/plugin-react',
      '@vitejs/plugin-legacy',
      '@sveltejs/vite-plugin-svelte',
      'cac',
      'chalk',
      'cli-progress',
      'commander',
      'fast-glob',
      'figlet',
      'fs-extra',
      'glob',
      'jiti',
      'node-fetch',
      'ora',
      'picocolors',
      'ws',
      'inquirer',
      'json5',
      'archiver',
      'yauzl',
      'tar',
      'svg2ttf',
      'svgicons2svgfont',
      'ttf2eot',
      'ttf2woff',
      'ttf2woff2',
      'open',
      // 测试相关依赖
      'vitest',
      '@vitest/ui',
      'jsdom',
      'happy-dom',
      '@testing-library/dom',
      '@testing-library/react',
      '@testing-library/vue',
      // Node.js 内置模块
      'fs',
      'path',
      'url',
      'util',
      'os',
      'crypto',
      'events',
      'stream',
      'http',
      'https',
      'child_process',
      // Optional Vue template engines - mark as external to avoid build errors
      'velocityjs',
      'dustjs-linkedin',
      'atpl',
      'liquor',
      'twig',
      'ejs',
      'eco',
      'jazz',
      'jqtpl',
      'hamljs',
      'hamlet',
      'whiskers',
      'haml-coffee',
      'hogan.js',
      'templayed',
      'handlebars',
      'underscore',
      'walrus',
      'mustache',
      'just',
      'ect',
      'mote',
      'toffee',
      'dot',
      'bracket-template',
      'ractive',
      'htmling',
      'babel-core',
      'plates',
      'vash',
      'slm',
      'marko',
      'teacup/lib/express',
      'coffee-script',
      'squirrelly',
      'twing'
    ],
    // 优化bundle策略
    bundle: true,
    metafile: isAnalyze, // 可选的构建分析
    esbuildOptions(options) {
      options.conditions = ['node']
      options.platform = 'node'
      options.chunkNames = 'chunks/[name]-[hash]'
      options.logLevel = isCI ? 'error' : 'warning'
      options.treeShaking = true
      options.keepNames = true
      options.legalComments = 'none'
      options.charset = 'utf8'
      options.mainFields = ['module', 'main']
      options.resolveExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json']
      
      // 优化日志输出
      options.logOverride = {
        'unsupported-dynamic-import': 'silent',
        'ignored-bare-import': 'silent'
      }
      
      // 环境变量注入
      options.define = {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
        '__VERSION__': JSON.stringify(require('./package.json').version)
      }
      
      // 性能优化
      if (isProd) {
        options.drop = ['debugger']
        options.dropLabels = ['DEV']
        options.pure = ['console.debug', 'console.trace']
      }
      
      // 文件大小优化
      options.mangleProps = undefined // 不混淆属性名，避免问题
      options.mangleQuoted = false
      options.reserveProps = undefined
    },
    // 增加并发数提高构建速度
    esbuildPlugins: [],
    // 减少控制台输出
    silent: isCI,
    // 优化构建性能
    skipNodeModulesBundle: true,
    // 性能优化选项
    publicDir: false, // 不需要public目录
    replaceNodeEnv: true, // 替换 process.env.NODE_ENV
  }
])
