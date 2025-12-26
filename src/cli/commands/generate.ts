/**
 * 智能配置生成命令
 *
 * 根据项目结构自动生成 .ldesign/launcher.config.ts 配置文件
 * 支持交互式问答、自动检测和多环境配置
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type { CliCommandDefinition, CliContext } from '../../types'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, relative, resolve } from 'node:path'
import process from 'node:process'
import pc from 'picocolors'
import { Logger } from '../../utils/logger'

const logger = new Logger('generate')

// ========== 类型定义 ==========

interface GenerateOptions {
  yes?: boolean
  output?: string
  environments?: string[]
  full?: boolean
  analyze?: boolean
}

interface ProjectInfo {
  name: string
  framework: string
  language: 'typescript' | 'javascript' | 'mixed'
  hasProxy: boolean
  hasMock: boolean
  hasSSR: boolean
  hasPWA: boolean
  port: number
  stylePreprocessor?: 'less' | 'scss' | 'stylus'
}

interface GeneratedConfig {
  // 基础配置
  port: number
  host: string
  open: boolean

  // 框架配置
  framework?: string

  // 代理配置
  proxy?: {
    enabled: boolean
    apiTarget?: string
    pathPrefix?: string
    wsEnabled?: boolean
    wsTarget?: string
  }

  // Mock 配置
  mock?: {
    enabled: boolean
    mockDir?: string
  }

  // PWA 配置
  pwa?: {
    enabled: boolean
    appName?: string
  }

  // 环境变量
  env?: {
    required?: string[]
    defaults?: Record<string, string>
  }

  // 构建配置
  build: {
    outDir: string
    sourcemap: boolean
    minify: boolean
  }

  // SSR 配置
  ssr?: {
    enabled: boolean
  }

  // 缓存配置
  cache?: {
    enabled: boolean
  }

  // 多环境
  environments: string[]
}

// ========== 交互式选择器 (使用箭头键) ==========

/**
 * 创建键盘输入监听器
 */
function createKeyListener(): { cleanup: () => void, onKey: (callback: (key: string, data: Buffer) => void) => void } {
  const callbacks: Array<(key: string, data: Buffer) => void> = []

  const handler = (data: Buffer) => {
    const key = data.toString()
    callbacks.forEach(cb => cb(key, data))
  }

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
  }
  process.stdin.resume()
  process.stdin.on('data', handler)

  return {
    cleanup: () => {
      process.stdin.removeListener('data', handler)
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false)
      }
    },
    onKey: (callback) => {
      callbacks.push(callback)
    },
  }
}

/**
 * 清除行并移动光标
 */
function clearLines(count: number): void {
  for (let i = 0; i < count; i++) {
    process.stdout.write('\x1B[1A') // 上移一行
    process.stdout.write('\x1B[2K') // 清除整行
  }
}

/**
 * 隐藏/显示光标
 */
function hideCursor(): void {
  process.stdout.write('\x1B[?25l')
}

function showCursor(): void {
  process.stdout.write('\x1B[?25h')
}

/**
 * 多选选择器 (使用箭头键和空格)
 */
async function multiSelect<T extends string>(
  question: string,
  options: Array<{ value: T, label: string, hint?: string }>,
  defaults: T[] = [],
): Promise<T[]> {
  return new Promise((resolve) => {
    let selectedIndex = 0
    const selected = new Set<T>(defaults)
    const { cleanup, onKey } = createKeyListener()

    const render = () => {
      const lines: string[] = []
      lines.push(`${pc.cyan('?')} ${pc.bold(question)}`)
      options.forEach((opt, i) => {
        const cursor = i === selectedIndex ? pc.cyan('❯') : ' '
        const checked = selected.has(opt.value) ? pc.green('◉') : pc.dim('○')
        const label = i === selectedIndex ? pc.cyan(opt.label) : opt.label
        const hint = opt.hint ? pc.dim(` (${opt.hint})`) : ''
        lines.push(`  ${cursor} ${checked} ${label}${hint}`)
      })
      lines.push(pc.dim('  ↑↓ 移动  空格 切换  ↵ 确认'))
      return lines
    }

    hideCursor()
    let lines = render()
    process.stdout.write(`${lines.join('\n')}\n`)

    onKey((key) => {
      // 上箭头
      if (key === '\x1B[A' || key === 'k') {
        selectedIndex = (selectedIndex - 1 + options.length) % options.length
      }
      // 下箭头
      else if (key === '\x1B[B' || key === 'j') {
        selectedIndex = (selectedIndex + 1) % options.length
      }
      // 空格 - 切换选择
      else if (key === ' ') {
        const value = options[selectedIndex].value
        if (selected.has(value)) {
          selected.delete(value)
        }
        else {
          selected.add(value)
        }
      }
      // Enter
      else if (key === '\r' || key === '\n') {
        cleanup()
        showCursor()
        clearLines(lines.length)
        const selectedLabels = options.filter(o => selected.has(o.value)).map(o => o.label).join(', ')
        process.stdout.write(`${pc.cyan('?')} ${pc.bold(question)} ${pc.green(selectedLabels || '(无)')}\n`)
        resolve(Array.from(selected))
        return
      }
      // Ctrl+C
      else if (key === '\x03') {
        cleanup()
        showCursor()
        process.exit(0)
      }

      // 重新渲染
      clearLines(lines.length)
      lines = render()
      process.stdout.write(`${lines.join('\n')}\n`)
    })
  })
}

/**
 * 确认选择器 (Y/n)
 */
async function confirm(question: string, defaultValue = true): Promise<boolean> {
  return new Promise((resolve) => {
    const { cleanup, onKey } = createKeyListener()
    const hint = defaultValue ? pc.dim('[Y/n]') : pc.dim('[y/N]')

    hideCursor()
    process.stdout.write(`${pc.cyan('?')} ${pc.bold(question)} ${hint} `)

    onKey((key) => {
      const lowerKey = key.toLowerCase()

      if (lowerKey === 'y') {
        cleanup()
        showCursor()
        process.stdout.write(`${pc.green('是')}\n`)
        resolve(true)
      }
      else if (lowerKey === 'n') {
        cleanup()
        showCursor()
        process.stdout.write(`${pc.red('否')}\n`)
        resolve(false)
      }
      else if (key === '\r' || key === '\n') {
        cleanup()
        showCursor()
        process.stdout.write(`${defaultValue ? pc.green('是') : pc.red('否')}\n`)
        resolve(defaultValue)
      }
      else if (key === '\x03') {
        cleanup()
        showCursor()
        process.exit(0)
      }
    })
  })
}

/**
 * 文本输入
 */
async function input(question: string, defaultValue?: string): Promise<string> {
  return new Promise((resolve) => {
    const { cleanup, onKey } = createKeyListener()
    let value = ''
    const hint = defaultValue ? pc.dim(` (${defaultValue})`) : ''

    const render = () => {
      return `${pc.cyan('?')} ${pc.bold(question)}${hint}: ${value}`
    }

    hideCursor()
    process.stdout.write(`${render()}`)
    showCursor()

    onKey((key) => {
      // Enter
      if (key === '\r' || key === '\n') {
        cleanup()
        process.stdout.write('\n')
        resolve(value || defaultValue || '')
      }
      // Backspace
      else if (key === '\x7F' || key === '\b') {
        if (value.length > 0) {
          value = value.slice(0, -1)
          process.stdout.write('\b \b')
        }
      }
      // Ctrl+C
      else if (key === '\x03') {
        cleanup()
        showCursor()
        process.exit(0)
      }
      // 普通字符
      else if (key.length === 1 && key >= ' ') {
        value += key
        process.stdout.write(key)
      }
    })
  })
}

/**
 * 安全输出信息
 */
function printLine(message = ''): void {
  process.stdout.write(`${message}\n`)
}

// ========== 项目分析 ==========

function analyzeProject(projectPath: string): ProjectInfo {
  const pkgPath = resolve(projectPath, 'package.json')
  let pkg: any = {}

  if (existsSync(pkgPath)) {
    try {
      pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    }
    catch {}
  }

  const deps = { ...pkg.dependencies, ...pkg.devDependencies }

  // 检测框架
  let framework = 'vanilla'
  if (deps.vue) {
    const vueVersion = deps.vue
    framework = vueVersion.includes('^2') || vueVersion.includes('~2') || vueVersion.startsWith('2') ? 'vue2' : 'vue3'
  }
  else if (deps.react) {
    framework = deps['@vitejs/plugin-react-swc'] ? 'react-swc' : 'react'
  }
  else if (deps.svelte) {
    framework = deps['@sveltejs/kit'] ? 'sveltekit' : 'svelte'
  }
  else if (deps['solid-js']) {
    framework = 'solid'
  }
  else if (deps.preact) {
    framework = 'preact'
  }
  else if (deps['@angular/core']) {
    framework = 'angular'
  }
  else if (deps.lit) {
    framework = 'lit'
  }
  else if (deps['@builder.io/qwik']) {
    framework = 'qwik'
  }

  // 检测语言
  let language: 'typescript' | 'javascript' | 'mixed' = 'javascript'
  if (deps.typescript || existsSync(resolve(projectPath, 'tsconfig.json'))) {
    language = 'typescript'
  }

  // 检测样式预处理器
  let stylePreprocessor: 'less' | 'scss' | 'stylus' | undefined
  if (deps.less)
    stylePreprocessor = 'less'
  else if (deps.sass || deps['node-sass'])
    stylePreprocessor = 'scss'
  else if (deps.stylus)
    stylePreprocessor = 'stylus'

  // 检测是否有 mock 目录
  const hasMock = existsSync(resolve(projectPath, 'mock'))

  // 检测是否有 SSR 相关配置
  const hasSSR = existsSync(resolve(projectPath, 'server.ts')) || existsSync(resolve(projectPath, 'server/index.ts'))

  // 检测是否有 PWA 相关配置
  const hasPWA = !!deps['vite-plugin-pwa']

  // 检测是否可能需要代理（存在 .env 文件或 API 相关依赖）
  let hasProxy = false
  const envFiles = ['.env', '.env.development', '.env.local']
  for (const envFile of envFiles) {
    const envPath = resolve(projectPath, envFile)
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf-8')
      if (content.includes('API') || content.includes('PROXY') || content.includes('BACKEND')) {
        hasProxy = true
        break
      }
    }
  }

  return {
    name: pkg.name || basename(projectPath),
    framework,
    language,
    hasProxy,
    hasMock,
    hasSSR,
    hasPWA,
    port: 3000,
    stylePreprocessor,
  }
}

// ========== 配置生成 ==========

function generateConfigContent(config: GeneratedConfig, projectInfo: ProjectInfo, environment?: string): string {
  const lines: string[] = []

  lines.push(`import { defineConfig } from '@ldesign/launcher'`)
  lines.push('')
  lines.push(`/**`)
  lines.push(` * ${projectInfo.name} Launcher 配置`)
  if (environment) {
    lines.push(` * 环境: ${environment}`)
  }
  lines.push(` *`)
  lines.push(` * 由 launcher generate 自动生成`)
  lines.push(` * 文档: https://github.com/nicepkg/ldesign`)
  lines.push(` */`)
  lines.push(`export default defineConfig({`)

  // 服务器配置
  lines.push(`  // 🌐 开发服务器配置`)
  lines.push(`  server: {`)
  lines.push(`    port: ${config.port},`)
  lines.push(`    host: '${config.host}',`)
  lines.push(`    open: ${config.open},`)
  lines.push(`  },`)
  lines.push('')

  // Launcher 特有配置
  lines.push(`  // ⚙️ Launcher 配置`)
  lines.push(`  launcher: {`)
  lines.push(`    // 日志级别: 'debug' | 'info' | 'warn' | 'error' | 'silent'`)
  lines.push(`    logLevel: '${environment === 'production' ? 'warn' : 'info'}',`)
  lines.push('')
  lines.push(`    // 是否启用调试模式`)
  lines.push(`    debug: ${environment === 'development'},`)
  lines.push('')
  lines.push(`    // 配置变更时是否自动重启`)
  lines.push(`    autoRestart: true,`)
  lines.push('')

  // 代理配置
  if (config.proxy?.enabled) {
    lines.push(`    // 📡 代理配置`)
    lines.push(`    proxy: {`)
    lines.push(`      // API 代理`)
    lines.push(`      api: {`)
    lines.push(`        target: '${config.proxy.apiTarget || 'http://localhost:8080'}',`)
    lines.push(`        pathPrefix: '${config.proxy.pathPrefix || '/api'}',`)
    lines.push(`        rewrite: true,`)
    lines.push(`        headers: {`)
    lines.push(`          'X-Forwarded-Host': 'localhost',`)
    lines.push(`        },`)
    lines.push(`      },`)
    if (config.proxy.wsEnabled) {
      lines.push(`      // WebSocket 代理`)
      lines.push(`      websocket: {`)
      lines.push(`        target: '${config.proxy.wsTarget || 'ws://localhost:8080'}',`)
      lines.push(`        pathPrefix: '/ws',`)
      lines.push(`      },`)
    }
    lines.push(`      // 全局代理配置`)
    lines.push(`      global: {`)
    lines.push(`        timeout: 30000,`)
    lines.push(`        verbose: ${environment === 'development'},`)
    lines.push(`      },`)
    lines.push(`    },`)
    lines.push('')
  }

  // Mock 配置
  if (config.mock?.enabled) {
    lines.push(`    // 🎭 Mock 服务配置`)
    lines.push(`    mock: {`)
    lines.push(`      enabled: ${environment === 'development' || environment === 'test'},`)
    lines.push(`      mockDir: '${config.mock.mockDir || 'mock'}',`)
    lines.push(`      watchFiles: true,`)
    lines.push(`      logger: true,`)
    lines.push(`      prefix: '/api',`)
    lines.push(`    },`)
    lines.push('')
  }

  // 环境变量配置
  if (config.env) {
    lines.push(`    // 🔐 环境变量配置`)
    lines.push(`    env: {`)
    if (config.env.required && config.env.required.length > 0) {
      lines.push(`      required: ${JSON.stringify(config.env.required)},`)
    }
    if (config.env.defaults) {
      lines.push(`      defaults: {`)
      for (const [key, value] of Object.entries(config.env.defaults)) {
        lines.push(`        ${key}: '${value}',`)
      }
      lines.push(`      },`)
    }
    lines.push(`    },`)
    lines.push('')
  }

  // 缓存配置
  if (config.cache?.enabled) {
    lines.push(`    // 💾 缓存配置`)
    lines.push(`    cache: {`)
    lines.push(`      enabled: true,`)
    lines.push(`      strategy: 'hybrid',`)
    lines.push(`      cacheDir: 'node_modules/.cache/launcher',`)
    lines.push(`    },`)
    lines.push('')
  }

  // SSR 配置
  if (config.ssr?.enabled) {
    lines.push(`    // 🖥️ SSR 配置`)
    lines.push(`    ssr: {`)
    lines.push(`      enabled: true,`)
    lines.push(`      entry: 'src/entry-server.ts',`)
    lines.push(`    },`)
    lines.push('')
  }

  // 生命周期钩子
  lines.push(`    // 🪝 生命周期钩子`)
  lines.push(`    hooks: {`)
  lines.push(`      // beforeStart: async () => { console.log('准备启动...') },`)
  lines.push(`      // afterStart: async () => { console.log('启动完成!') },`)
  lines.push(`      // onError: (error) => { console.error('发生错误:', error) },`)
  lines.push(`    },`)

  lines.push(`  },`)
  lines.push('')

  // 构建配置
  lines.push(`  // 📦 构建配置`)
  lines.push(`  build: {`)
  lines.push(`    outDir: '${config.build.outDir}',`)
  lines.push(`    sourcemap: ${config.build.sourcemap},`)
  lines.push(`    minify: ${config.build.minify},`)
  lines.push(`    // 构建目标`)
  lines.push(`    target: 'es2020',`)
  lines.push(`    // 代码分割`)
  lines.push(`    rollupOptions: {`)
  lines.push(`      output: {`)
  lines.push(`        manualChunks: {`)

  // 根据框架添加代码分割
  if (projectInfo.framework.includes('vue')) {
    lines.push(`          'vue': ['vue'],`)
    lines.push(`          'vue-router': ['vue-router'],`)
  }
  else if (projectInfo.framework.includes('react')) {
    lines.push(`          'react': ['react', 'react-dom'],`)
    lines.push(`          'react-router': ['react-router-dom'],`)
  }

  lines.push(`        },`)
  lines.push(`      },`)
  lines.push(`    },`)
  lines.push(`  },`)
  lines.push('')

  // PWA 配置
  if (config.pwa?.enabled) {
    lines.push(`  // 📱 开发工具配置`)
    lines.push(`  tools: {`)
    lines.push(`    pwa: {`)
    lines.push(`      enabled: ${environment === 'production'},`)
    lines.push(`      appName: '${config.pwa.appName || projectInfo.name}',`)
    lines.push(`      shortName: '${config.pwa.appName || projectInfo.name}',`)
    lines.push(`      themeColor: '#ffffff',`)
    lines.push(`      backgroundColor: '#ffffff',`)
    lines.push(`      generateSW: true,`)
    lines.push(`      cacheStrategy: 'networkFirst',`)
    lines.push(`    },`)
    lines.push(`  },`)
    lines.push('')
  }

  // 路径别名
  lines.push(`  // 🔗 路径别名`)
  lines.push(`  resolve: {`)
  lines.push(`    alias: [`)
  lines.push(`      { find: '@', replacement: './src' },`)
  lines.push(`      { find: '~', replacement: './' },`)
  lines.push(`    ],`)
  lines.push(`  },`)

  lines.push(`})`)

  return lines.join('\n')
}

function generateFullConfigContent(projectInfo: ProjectInfo): string {
  const lines: string[] = []

  lines.push(`import type { ViteLauncherConfig } from '@ldesign/launcher'`)
  lines.push(`import { defineConfig } from '@ldesign/launcher'`)
  lines.push('')
  lines.push(`/**`)
  lines.push(` * ${projectInfo.name} Launcher 完整配置`)
  lines.push(` *`)
  lines.push(` * 由 launcher generate --full 自动生成`)
  lines.push(` * 此文件包含所有可用配置选项，根据需要取消注释即可使用`)
  lines.push(` * 文档: https://github.com/nicepkg/ldesign`)
  lines.push(` */`)
  lines.push(`export default defineConfig({`)

  // 服务器配置
  lines.push(`  // ═══════════════════════════════════════════════════════════════`)
  lines.push(`  // 🌐 开发服务器配置`)
  lines.push(`  // ═══════════════════════════════════════════════════════════════`)
  lines.push(`  server: {`)
  lines.push(`    // 端口号`)
  lines.push(`    port: 3000,`)
  lines.push(`    // 主机地址 ('localhost' | '0.0.0.0' | true)`)
  lines.push(`    host: 'localhost',`)
  lines.push(`    // 启动时自动打开浏览器`)
  lines.push(`    open: true,`)
  lines.push(`    // 启用 HTTPS`)
  lines.push(`    // https: true,`)
  lines.push(`    // 启用 CORS`)
  lines.push(`    cors: true,`)
  lines.push(`    // 严格端口模式`)
  lines.push(`    // strictPort: false,`)
  lines.push(`  },`)
  lines.push('')

  // Launcher 配置
  lines.push(`  // ═══════════════════════════════════════════════════════════════`)
  lines.push(`  // ⚙️ Launcher 特有配置`)
  lines.push(`  // ═══════════════════════════════════════════════════════════════`)
  lines.push(`  launcher: {`)
  lines.push(`    // 日志级别: 'debug' | 'info' | 'warn' | 'error' | 'silent'`)
  lines.push(`    logLevel: 'info',`)
  lines.push('')
  lines.push(`    // 调试模式`)
  lines.push(`    debug: false,`)
  lines.push('')
  lines.push(`    // 配置变更时自动重启`)
  lines.push(`    autoRestart: true,`)
  lines.push('')
  lines.push(`    // 配置变更防抖时间 (毫秒)`)
  lines.push(`    configChangeDebounce: 200,`)
  lines.push('')

  // 代理配置
  lines.push(`    // ─────────────────────────────────────────────────────────────`)
  lines.push(`    // 📡 代理配置`)
  lines.push(`    // ─────────────────────────────────────────────────────────────`)
  lines.push(`    // proxy: {`)
  lines.push(`    //   // API 代理`)
  lines.push(`    //   api: {`)
  lines.push(`    //     target: 'http://localhost:8080',`)
  lines.push(`    //     pathPrefix: '/api',`)
  lines.push(`    //     rewrite: true,`)
  lines.push(`    //     headers: { 'X-Forwarded-Host': 'localhost' },`)
  lines.push(`    //     timeout: 30000,`)
  lines.push(`    //   },`)
  lines.push(`    //   // 静态资源代理`)
  lines.push(`    //   assets: {`)
  lines.push(`    //     target: 'http://localhost:9000',`)
  lines.push(`    //     pathPrefix: '/assets',`)
  lines.push(`    //     cache: { maxAge: 3600, etag: true },`)
  lines.push(`    //   },`)
  lines.push(`    //   // WebSocket 代理`)
  lines.push(`    //   websocket: {`)
  lines.push(`    //     target: 'ws://localhost:8080',`)
  lines.push(`    //     pathPrefix: '/ws',`)
  lines.push(`    //   },`)
  lines.push(`    //   // 上传服务代理`)
  lines.push(`    //   upload: {`)
  lines.push(`    //     target: 'http://localhost:8080',`)
  lines.push(`    //     pathPrefix: '/upload',`)
  lines.push(`    //     timeout: 60000,`)
  lines.push(`    //     maxFileSize: '100MB',`)
  lines.push(`    //   },`)
  lines.push(`    //   // 全局代理配置`)
  lines.push(`    //   global: {`)
  lines.push(`    //     timeout: 30000,`)
  lines.push(`    //     retry: 3,`)
  lines.push(`    //     verbose: true,`)
  lines.push(`    //   },`)
  lines.push(`    // },`)
  lines.push('')

  // Mock 配置
  lines.push(`    // ─────────────────────────────────────────────────────────────`)
  lines.push(`    // 🎭 Mock 服务配置`)
  lines.push(`    // ─────────────────────────────────────────────────────────────`)
  lines.push(`    // mock: {`)
  lines.push(`    //   enabled: true,`)
  lines.push(`    //   mockDir: 'mock',`)
  lines.push(`    //   watchFiles: true,`)
  lines.push(`    //   logger: true,`)
  lines.push(`    //   prefix: '/api',`)
  lines.push(`    //   localEnabled: false,`)
  lines.push(`    //   prodEnabled: false,`)
  lines.push(`    //   generator: {`)
  lines.push(`    //     useFaker: true,`)
  lines.push(`    //     delay: 200,`)
  lines.push(`    //     defaultStatus: 200,`)
  lines.push(`    //   },`)
  lines.push(`    // },`)
  lines.push('')

  // 环境变量配置
  lines.push(`    // ─────────────────────────────────────────────────────────────`)
  lines.push(`    // 🔐 环境变量配置`)
  lines.push(`    // ─────────────────────────────────────────────────────────────`)
  lines.push(`    // env: {`)
  lines.push(`    //   variables: {},`)
  lines.push(`    //   envFile: ['.env', '.env.local'],`)
  lines.push(`    //   prefix: 'VITE_',`)
  lines.push(`    //   expand: true,`)
  lines.push(`    //   defaults: {`)
  lines.push(`    //     VITE_APP_TITLE: 'My App',`)
  lines.push(`    //   },`)
  lines.push(`    //   required: ['VITE_API_URL'],`)
  lines.push(`    // },`)
  lines.push('')

  // 缓存配置
  lines.push(`    // ─────────────────────────────────────────────────────────────`)
  lines.push(`    // 💾 缓存配置`)
  lines.push(`    // ─────────────────────────────────────────────────────────────`)
  lines.push(`    // cache: {`)
  lines.push(`    //   enabled: true,`)
  lines.push(`    //   cacheDir: 'node_modules/.cache/launcher',`)
  lines.push(`    //   strategy: 'hybrid',`)
  lines.push(`    //   ttl: 3600000,`)
  lines.push(`    //   maxSize: 500,`)
  lines.push(`    // },`)
  lines.push('')

  // SSR 配置
  lines.push(`    // ─────────────────────────────────────────────────────────────`)
  lines.push(`    // 🖥️ SSR 配置`)
  lines.push(`    // ─────────────────────────────────────────────────────────────`)
  lines.push(`    // ssr: {`)
  lines.push(`    //   enabled: true,`)
  lines.push(`    //   entry: 'src/entry-server.ts',`)
  lines.push(`    //   outDir: 'dist/server',`)
  lines.push(`    //   manifest: true,`)
  lines.push(`    // },`)
  lines.push('')

  // HMR 配置
  lines.push(`    // ─────────────────────────────────────────────────────────────`)
  lines.push(`    // 🔥 热更新配置`)
  lines.push(`    // ─────────────────────────────────────────────────────────────`)
  lines.push(`    // hmr: {`)
  lines.push(`    //   enabled: true,`)
  lines.push(`    //   overlay: true,`)
  lines.push(`    //   strategy: 'native',`)
  lines.push(`    //   logging: {`)
  lines.push(`    //     level: 'info',`)
  lines.push(`    //   },`)
  lines.push(`    // },`)
  lines.push('')

  // 生命周期钩子
  lines.push(`    // ─────────────────────────────────────────────────────────────`)
  lines.push(`    // 🪝 生命周期钩子`)
  lines.push(`    // ─────────────────────────────────────────────────────────────`)
  lines.push(`    hooks: {`)
  lines.push(`      // beforeStart: async () => {},`)
  lines.push(`      // afterStart: async () => {},`)
  lines.push(`      // beforeBuild: async () => {},`)
  lines.push(`      // afterBuild: async () => {},`)
  lines.push(`      // beforePreview: async () => {},`)
  lines.push(`      // afterPreview: async () => {},`)
  lines.push(`      // beforeClose: async () => {},`)
  lines.push(`      // afterClose: async () => {},`)
  lines.push(`      // onError: (error) => {},`)
  lines.push(`      // onConfigChange: (config) => {},`)
  lines.push(`    },`)
  lines.push(`  },`)
  lines.push('')

  // 构建配置
  lines.push(`  // ═══════════════════════════════════════════════════════════════`)
  lines.push(`  // 📦 构建配置`)
  lines.push(`  // ═══════════════════════════════════════════════════════════════`)
  lines.push(`  build: {`)
  lines.push(`    outDir: 'dist',`)
  lines.push(`    sourcemap: false,`)
  lines.push(`    minify: 'esbuild',`)
  lines.push(`    target: 'es2020',`)
  lines.push(`    // cssCodeSplit: true,`)
  lines.push(`    // assetsInlineLimit: 4096,`)
  lines.push(`    rollupOptions: {`)
  lines.push(`      output: {`)
  lines.push(`        // manualChunks: {},`)
  lines.push(`      },`)
  lines.push(`    },`)
  lines.push(`  },`)
  lines.push('')

  // 预览配置
  lines.push(`  // ═══════════════════════════════════════════════════════════════`)
  lines.push(`  // 👁️ 预览服务器配置`)
  lines.push(`  // ═══════════════════════════════════════════════════════════════`)
  lines.push(`  preview: {`)
  lines.push(`    port: 4173,`)
  lines.push(`    host: 'localhost',`)
  lines.push(`    open: true,`)
  lines.push(`  },`)
  lines.push('')

  // 开发工具配置
  lines.push(`  // ═══════════════════════════════════════════════════════════════`)
  lines.push(`  // 🛠️ 开发工具配置`)
  lines.push(`  // ═══════════════════════════════════════════════════════════════`)
  lines.push(`  tools: {`)
  lines.push(`    // PWA 支持`)
  lines.push(`    // pwa: {`)
  lines.push(`    //   enabled: true,`)
  lines.push(`    //   appName: 'My App',`)
  lines.push(`    //   shortName: 'App',`)
  lines.push(`    //   description: 'A Progressive Web Application',`)
  lines.push(`    //   themeColor: '#ffffff',`)
  lines.push(`    //   backgroundColor: '#ffffff',`)
  lines.push(`    //   generateSW: true,`)
  lines.push(`    //   cacheStrategy: 'networkFirst',`)
  lines.push(`    //   offlinePage: '/offline.html',`)
  lines.push(`    // },`)
  lines.push(`  },`)
  lines.push('')

  // 路径别名
  lines.push(`  // ═══════════════════════════════════════════════════════════════`)
  lines.push(`  // 🔗 路径别名`)
  lines.push(`  // ═══════════════════════════════════════════════════════════════`)
  lines.push(`  resolve: {`)
  lines.push(`    alias: [`)
  lines.push(`      { find: '@', replacement: './src' },`)
  lines.push(`      { find: '~', replacement: './' },`)
  lines.push(`      // 按阶段生效的别名`)
  lines.push(`      // { find: '@dev', replacement: './src/dev', stage: 'dev' },`)
  lines.push(`      // { find: '@prod', replacement: './src/prod', stage: 'build' },`)
  lines.push(`    ],`)
  lines.push(`  },`)

  lines.push(`})`)

  return lines.join('\n')
}

function generatePackageScripts(): Record<string, string> {
  return {
    dev: 'launcher dev',
    build: 'launcher build',
    preview: 'launcher preview',
  }
}

// ========== 主流程 ==========

async function runGenerate(context: CliContext): Promise<void> {
  const projectPath = context.cwd
  const options = context.options as GenerateOptions

  printLine('')
  printLine(pc.cyan('╭─────────────────────────────────────────────────────╮'))
  printLine(`${pc.cyan('│')}  🔮 LDesign Launcher 智能配置生成器                 ${pc.cyan('│')}`)
  printLine(pc.cyan('╰─────────────────────────────────────────────────────╯'))
  printLine('')

  // 1. 分析项目
  printLine(`${pc.blue('📊')} 正在分析项目结构...\n`)

  const projectInfo = analyzeProject(projectPath)

  // 打印分析结果摘要
  printLine(pc.dim('─'.repeat(50)))
  printLine(`  ${pc.bold('项目名称:')}   ${projectInfo.name}`)
  printLine(`  ${pc.bold('检测框架:')}   ${pc.green(projectInfo.framework)}`)
  printLine(`  ${pc.bold('开发语言:')}   ${projectInfo.language === 'typescript' ? 'TypeScript' : 'JavaScript'}`)
  printLine(`  ${pc.bold('样式预处理:')} ${projectInfo.stylePreprocessor || '无'}`)
  printLine(`  ${pc.bold('Mock 目录:')}  ${projectInfo.hasMock ? pc.green('✓ 已检测到') : pc.dim('✗ 未检测到')}`)
  printLine(`  ${pc.bold('代理线索:')}   ${projectInfo.hasProxy ? pc.green('✓ 可能需要') : pc.dim('✗ 未检测到')}`)
  printLine(pc.dim('─'.repeat(50)))
  printLine('')

  // 如果只是分析模式
  if (options.analyze) {
    return
  }

  // 2. 读取 package.json
  const pkgPath = resolve(projectPath, 'package.json')
  let pkg: any = {}
  if (existsSync(pkgPath)) {
    pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  }

  // 3. 检查现有配置
  const configDir = resolve(projectPath, '.ldesign')
  const configPath = resolve(configDir, 'launcher.config.ts')

  if (existsSync(configPath)) {
    const overwrite = options.yes || await confirm('⚠️  已存在配置文件，是否覆盖？', false)
    if (!overwrite) {
      logger.info('已取消生成')
      return
    }
  }

  // 4. 交互式配置或自动配置
  let config: GeneratedConfig

  if (options.yes) {
    // 自动模式 - 使用默认值
    config = {
      port: 3000,
      host: 'localhost',
      open: true,
      framework: projectInfo.framework,
      proxy: { enabled: false },
      mock: projectInfo.hasMock ? { enabled: true, mockDir: 'mock' } : { enabled: false },
      pwa: { enabled: false },
      cache: { enabled: true },
      build: { outDir: 'dist', sourcemap: true, minify: true },
      environments: ['development', 'production'],
    }
  }
  else {
    printLine(pc.bold('\n🛠️  配置向导\n'))

    // 选择要生成的环境
    const environments = await multiSelect<string>(
      '选择要生成的环境配置',
      [
        { value: 'development', label: 'development', hint: '开发环境' },
        { value: 'production', label: 'production', hint: '生产环境' },
        { value: 'staging', label: 'staging', hint: '预发布环境' },
        { value: 'test', label: 'test', hint: '测试环境' },
      ],
      ['development', 'production'],
    )

    // 服务器端口
    const portStr = await input('开发服务器端口', '3000')
    const port = Number.parseInt(portStr) || 3000

    // 是否自动打开浏览器
    const open = await confirm('启动时自动打开浏览器?', true)

    // 代理配置
    const enableProxy = await confirm('是否需要配置 API 代理?', true)
    let proxy: GeneratedConfig['proxy'] = { enabled: false }
    if (enableProxy) {
      const apiTarget = await input('后端 API 服务器地址', 'http://localhost:8080')
      const pathPrefix = await input('API 路径前缀', '/api')
      const wsEnabled = await confirm('是否需要 WebSocket 代理?', false)
      let wsTarget: string | undefined
      if (wsEnabled) {
        wsTarget = await input('WebSocket 服务器地址', 'ws://localhost:8080')
      }
      proxy = { enabled: true, apiTarget, pathPrefix, wsEnabled, wsTarget }
    }

    // Mock 配置
    const enableMock = await confirm('是否启用 Mock 服务?', projectInfo.hasMock)
    let mock: GeneratedConfig['mock'] = { enabled: false }
    if (enableMock) {
      const mockDir = await input('Mock 文件目录', 'mock')
      mock = { enabled: true, mockDir }
    }

    // PWA 配置
    const enablePWA = await confirm('是否启用 PWA 支持?', false)
    let pwa: GeneratedConfig['pwa'] = { enabled: false }
    if (enablePWA) {
      const appName = await input('PWA 应用名称', projectInfo.name)
      pwa = { enabled: true, appName }
    }

    // SSR 配置
    const enableSSR = await confirm('是否启用 SSR (服务端渲染)?', projectInfo.hasSSR)
    const ssr = { enabled: enableSSR }

    // 缓存配置
    const enableCache = await confirm('是否启用构建缓存?', true)
    const cache = { enabled: enableCache }

    // 构建配置
    const outDir = await input('构建输出目录', 'dist')
    const sourcemap = await confirm('是否生成 sourcemap?', true)
    const minify = await confirm('是否启用代码压缩?', true)

    config = {
      port,
      host: 'localhost',
      open,
      framework: projectInfo.framework,
      proxy,
      mock,
      pwa,
      ssr,
      cache,
      build: { outDir, sourcemap, minify },
      environments,
    }
  }

  // 确定要生成的环境
  const environments = options.environments || config.environments || ['development', 'production']

  // 5. 确认配置
  printLine('')
  printLine(pc.bold('📋 配置预览:'))
  printLine(pc.dim('─'.repeat(50)))
  printLine(`  ${pc.bold('端口:')}       ${config.port}`)
  printLine(`  ${pc.bold('自动打开:')}   ${config.open ? '是' : '否'}`)
  printLine(`  ${pc.bold('代理:')}       ${config.proxy?.enabled ? `${config.proxy.pathPrefix} -> ${config.proxy.apiTarget}` : '未启用'}`)
  printLine(`  ${pc.bold('Mock:')}       ${config.mock?.enabled ? config.mock.mockDir : '未启用'}`)
  printLine(`  ${pc.bold('PWA:')}        ${config.pwa?.enabled ? config.pwa.appName : '未启用'}`)
  printLine(`  ${pc.bold('SSR:')}        ${config.ssr?.enabled ? '已启用' : '未启用'}`)
  printLine(`  ${pc.bold('缓存:')}       ${config.cache?.enabled ? '已启用' : '未启用'}`)
  printLine(`  ${pc.bold('环境:')}       ${environments.join(', ')}`)
  printLine(pc.dim('─'.repeat(50)))

  if (!options.yes) {
    const proceed = await confirm('\n✨ 确认生成配置文件?', true)
    if (!proceed) {
      logger.info('已取消')
      return
    }
  }

  // 6. 生成文件
  printLine(`\n${pc.blue('🔧')} 生成配置文件...\n`)

  // 创建 .ldesign 目录
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
  }

  // 写入基础配置文件
  if (options.full) {
    const fullContent = generateFullConfigContent(projectInfo)
    writeFileSync(configPath, fullContent)
    logger.success(`✅ ${relative(projectPath, configPath)} (完整配置)`)
  }
  else {
    const baseContent = generateConfigContent(config, projectInfo)
    writeFileSync(configPath, baseContent)
    logger.success(`✅ ${relative(projectPath, configPath)}`)
  }

  // 写入环境特定配置文件
  for (const env of environments) {
    if (env === 'development' && !options.full)
      continue // 基础配置已作为开发配置

    const envConfig: GeneratedConfig = {
      ...config,
      build: {
        outDir: config.build.outDir,
        sourcemap: env !== 'production',
        minify: env === 'production',
      },
    }

    const envConfigPath = resolve(configDir, `launcher.config.${env}.ts`)
    const envContent = generateConfigContent(envConfig, projectInfo, env)
    writeFileSync(envConfigPath, envContent)
    logger.success(`✅ ${relative(projectPath, envConfigPath)}`)
  }

  // 创建 .gitignore（如果不存在）
  const gitignorePath = resolve(configDir, '.gitignore')
  if (!existsSync(gitignorePath)) {
    writeFileSync(gitignorePath, `# 缓存文件
.cache/
*.log
# 本地配置
*.local.*
`)
    logger.success(`✅ ${relative(projectPath, gitignorePath)}`)
  }

  // 7. 更新 package.json
  const scripts = generatePackageScripts()
  let scriptsUpdated = false

  if (!pkg.scripts)
    pkg.scripts = {}

  for (const [name, cmd] of Object.entries(scripts)) {
    if (!pkg.scripts[name]) {
      pkg.scripts[name] = cmd
      scriptsUpdated = true
    }
  }

  if (scriptsUpdated) {
    writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
    logger.success(`✅ package.json (已添加 scripts)`)
  }

  // 8. 完成
  printLine('')
  printLine(pc.green('╭─────────────────────────────────────────────────────╮'))
  printLine(`${pc.green('│')}  ✨ 配置生成完成!                                   ${pc.green('│')}`)
  printLine(pc.green('├─────────────────────────────────────────────────────┤'))
  printLine(`${pc.green('│')}  配置文件: .ldesign/launcher.config.ts              ${pc.green('│')}`)
  printLine(`${pc.green('│')}                                                     ${pc.green('│')}`)
  printLine(`${pc.green('│')}  下一步:                                            ${pc.green('│')}`)
  printLine(`${pc.green('│')}    ${pc.cyan('npm run dev')}         # 启动开发服务器             ${pc.green('│')}`)
  printLine(`${pc.green('│')}    ${pc.cyan('npm run build')}       # 构建生产版本               ${pc.green('│')}`)
  printLine(`${pc.green('│')}    ${pc.cyan('npm run preview')}     # 预览构建结果               ${pc.green('│')}`)
  printLine(pc.green('╰─────────────────────────────────────────────────────╯'))
  printLine('')
}

// ========== 命令定义 ==========

export class GenerateCommand implements CliCommandDefinition {
  name = 'generate'
  aliases = ['gen', 'g', 'init']
  description = '智能生成 .ldesign/launcher.config.ts 配置文件'
  usage = 'launcher generate [options]'

  options = [
    {
      name: 'yes',
      alias: 'y',
      description: '跳过交互，使用自动检测的配置',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'output',
      alias: 'o',
      description: '指定配置文件输出路径',
      type: 'string' as const,
    },
    {
      name: 'environments',
      alias: 'e',
      description: '指定要生成的环境 (逗号分隔: development,production,staging)',
      type: 'string' as const,
    },
    {
      name: 'full',
      alias: 'f',
      description: '生成包含所有选项的完整配置文件',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'analyze',
      alias: 'a',
      description: '仅分析项目，不生成配置',
      type: 'boolean' as const,
      default: false,
    },
  ]

  examples = [
    {
      description: '交互式生成配置',
      command: 'launcher generate',
    },
    {
      description: '自动生成配置（跳过交互）',
      command: 'launcher generate -y',
    },
    {
      description: '生成完整配置文件',
      command: 'launcher generate --full',
    },
    {
      description: '生成多环境配置',
      command: 'launcher generate -e development,production,staging',
    },
    {
      description: '仅分析项目',
      command: 'launcher generate --analyze',
    },
  ]

  validate(_context: CliContext): boolean | string {
    return true
  }

  async handler(context: CliContext): Promise<void> {
    // 处理环境参数（从 context.options 提取并转换）
    const options = context.options as Record<string, any>
    if (typeof options.environments === 'string') {
      options.environments = options.environments.split(',').map((s: string) => s.trim())
    }

    await runGenerate(context)
  }
}
