import { defineConfig } from 'tsup'
import { cpus } from 'os'

export default defineConfig({
  // 明确的入口点配置，避免打包每个.ts文件
  entry: {
    // 主入口
    'index': 'src/index.ts',
    // CLI入口
    'cli/index': 'src/cli/index.ts',
    // 核心模块统一导出
    'core/index': 'src/core/index.ts',
    // CLI命令统一导出
    'cli/commands/index': 'src/cli/commands/index.ts',
    // 工具类统一导出
    'utils/index': 'src/utils/index.ts',
    // 类型定义统一导出
    'types/index': 'src/types/index.ts',
    // 常量统一导出
    'constants/index': 'src/constants/index.ts',
    // AI优化器（独立模块）
    'ai/optimizer': 'src/ai/optimizer.ts',
    // 基准测试报告器（独立模块）
    'benchmark/reporter': 'src/benchmark/reporter.ts',
    // 仪表板服务器（独立模块）
    'dashboard/server': 'src/dashboard/server.ts',
    // 插件预设（独立模块）
    'plugins/presets': 'src/plugins/presets.ts',
    // 市场管理（独立模块）
    'marketplace/index': 'src/marketplace/index.ts'
  },
  format: ['cjs', 'esm'],
  dts: true,
  tsconfig: 'tsconfig.json',
  clean: true,
  splitting: true, // 启用代码分割以减少重复代码
  sourcemap: true,
  minify: false,
  target: 'node16',
  outDir: 'dist',
  shims: true,
  // 性能优化：启用并行构建
  concurrency: Math.max(cpus().length - 1, 1), // 使用多核CPU，预留1个核心
  // 性能优化：启用增量构建缓存
  incremental: true,
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
  treeshake: true,
  // 优化内存使用，但不过度bundle大文件
  bundle: true,
  esbuildOptions(options) {
    options.conditions = ['node']
    options.chunkNames = 'chunks/[name]-[hash]'
    options.logLevel = 'error' // 只显示错误，减少警告输出

    // ===== 性能优化配置 =====

    // 1. Tree-shaking 优化
    options.treeShaking = true
    options.ignoreAnnotations = false

    // 2. 代码压缩优化（生产环境）
    if (process.env.NODE_ENV === 'production') {
      options.minify = true
      options.minifyWhitespace = true
      options.minifyIdentifiers = true
      options.minifySyntax = true
    }

    // 3. 保持函数名以便调试和错误追踪
    options.keepNames = true
    options.mangleProps = undefined // 不混淆属性名以保证兼容性

    // 4. 法律注释处理
    options.legalComments = 'none' // 不包含法律注释以减少输出

    // 5. Sourcemap 优化
    options.sourcemap = process.env.NODE_ENV !== 'production' // 生产环境禁用

    // 6. 平台和格式优化
    options.platform = 'node'
    options.format = 'esm'

    // 7. 并发优化（利用多核CPU）
    // esbuild 内部已自动并行化，这里确保设置正确

    // 8. 内存优化
    // 对大型文件使用流式处理
    options.write = true

    // 9. Banner 注释优化
    options.banner = {
      js: '// @ldesign/launcher - Optimized Build'
    }
  },
  // 使用 tsup 的 noDefaultExport 选项来避免混合导出警告
  noDefaultExport: false,
  // 减少控制台输出
  silent: false,
  // 优化构建性能
  skipNodeModulesBundle: true
})
