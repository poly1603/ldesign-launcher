import { defineConfig } from 'tsup'
import { cpus } from 'os'

// 获取CPU核心数用于并行构建
const numCPUs = cpus().length

export default defineConfig({
  // 使用glob模式打包所有源文件，但排除测试文件
  entry: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.bench.ts',
    '!src/__tests__/**/*'
  ],
  format: ['cjs', 'esm'],
  dts: {
    // 分离类型定义生成，提高构建速度
    resolve: true,
    entry: [
      'src/index.ts',
      'src/cli/index.ts',
      'src/core/index.ts',
      'src/types/index.ts',
      'src/utils/index.ts',
      'src/constants/index.ts'
    ]
  },
  tsconfig: 'tsconfig.json',
  clean: true,
  splitting: true, // 启用代码分割以减少重复代码
  sourcemap: process.env.NODE_ENV === 'development', // 仅在开发模式生成sourcemap
  minify: process.env.NODE_ENV === 'production', // 仅在生产模式压缩
  target: 'node16',
  outDir: 'dist',
  shims: true,
  // 启用并行处理
  treeshake: true,
  // 使用更快的esbuild loader
  loader: {
    '.ts': 'ts',
    '.tsx': 'tsx'
  },
  // 优化chunk命名
  outExtension({ format }) {
    return {
      js: `.${format === 'cjs' ? 'cjs' : 'js'}`
    }
  },
  // 将运行时依赖全部 external，减小产物体积
  external: [
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
  metafile: process.env.ANALYZE === 'true', // 可选的构建分析
  esbuildOptions(options) {
    options.conditions = ['node']
    options.platform = 'node'
    options.chunkNames = 'chunks/[name]-[hash]'
    options.logLevel = 'error'
    options.treeShaking = true
    options.keepNames = true
    options.legalComments = 'none'
    // 使用更多工作线程提高构建速度
    options.logOverride = {
      'unsupported-dynamic-import': 'silent'
    }
    // 设置最大并行数
    options.define = {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
    }
  },
  // 增加并发数提高构建速度
  esbuildPlugins: [],
  // 减少控制台输出
  silent: process.env.CI === 'true',
  // 优化构建性能
  skipNodeModulesBundle: true,
  // 设置并发构建数
  // concurrency 选项在tsup中不可用，使用esbuild的默认并发
})
