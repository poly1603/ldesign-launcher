/**
 * 智能插件管理器
 *
 * 自动检测项目类型并加载对应的插件
 *
 * @author LDesign Team
 * @since 1.0.0
 */

import type { Plugin } from 'vite'
import type { Logger } from '../utils/logger'
import { FileSystem, FrameworkDetectionCache, PathUtils } from '../utils'

/**
 * 项目类型枚举
 */
export enum ProjectType {
  VUE3 = 'vue3',
  VUE2 = 'vue2',
  REACT = 'react',
  REACT_SWC = 'react-swc',
  PREACT = 'preact',
  SVELTE = 'svelte',
  SVELTEKIT = 'sveltekit',
  SOLID = 'solid',
  LIT = 'lit',
  QWIK = 'qwik',
  ANGULAR = 'angular',
  ASTRO = 'astro',
  REMIX = 'remix',
  MARKO = 'marko',
  VANILLA = 'vanilla',
}

/**
 * 插件配置接口
 */
export interface PluginConfig {
  /** 插件名称 */
  name: string
  /** 插件包名 */
  packageName: string
  /** 是否必需 */
  required: boolean
  /** 检测条件 */
  detection: {
    /** 依赖包名 */
    dependencies?: string[]
    /** 文件模式 */
    filePatterns?: string[]
    /** 配置文件 */
    configFiles?: string[]
  }
  /** 插件选项 */
  options?: Record<string, any>
}

/**
 * 智能插件管理器类
 */
export class PluginManager {
  private logger: Logger
  private cwd: string
  private detectedType: ProjectType | null = null
  private availablePlugins: Map<string, PluginConfig> = new Map()
  private detectionCache: FrameworkDetectionCache

  constructor(cwd: string, logger: Logger) {
    this.cwd = cwd
    this.logger = logger
    this.detectionCache = new FrameworkDetectionCache(cwd, logger)
    this.initializePluginConfigs()
  }

  /**
   * 初始化插件配置
   */
  private initializePluginConfigs(): void {
    // Vue 3 插件配置
    this.availablePlugins.set('vue3', {
      name: 'Vue 3',
      packageName: '@vitejs/plugin-vue',
      required: true,
      detection: {
        dependencies: ['vue'],
        filePatterns: ['**/*.vue'],
        configFiles: ['vue.config.js', 'vue.config.ts'],
      },
      options: {},
    })

    // Vue 3 JSX 插件配置
    this.availablePlugins.set('vue3-jsx', {
      name: 'Vue 3 JSX',
      packageName: '@vitejs/plugin-vue-jsx',
      required: false,
      detection: {
        dependencies: ['vue'],
        filePatterns: ['**/*.tsx', '**/*.jsx'],
        configFiles: [],
      },
      options: {
        transformOn: true,
        mergeProps: true,
      },
    })

    // Vue 2 插件配置
    this.availablePlugins.set('vue2', {
      name: 'Vue 2',
      packageName: '@vitejs/plugin-vue2',
      required: true,
      detection: {
        dependencies: ['vue@^2'],
        filePatterns: ['**/*.vue'],
        configFiles: ['vue.config.js', 'vue.config.ts'],
      },
      options: {},
    })

    // React 插件配置
    this.availablePlugins.set('react', {
      name: 'React',
      packageName: '@vitejs/plugin-react',
      required: true,
      detection: {
        dependencies: ['react', 'react-dom'],
        filePatterns: ['**/*.jsx', '**/*.tsx'],
        configFiles: [],
      },
      options: {},
    })

    // React SWC 插件配置（更快的编译速度）
    this.availablePlugins.set('react-swc', {
      name: 'React SWC',
      packageName: '@vitejs/plugin-react-swc',
      required: true,
      detection: {
        dependencies: ['react', 'react-dom', '@vitejs/plugin-react-swc'],
        filePatterns: ['**/*.jsx', '**/*.tsx'],
        configFiles: [],
      },
      options: {},
    })

    // Preact 插件配置
    this.availablePlugins.set('preact', {
      name: 'Preact',
      packageName: '@preact/preset-vite',
      required: true,
      detection: {
        dependencies: ['preact'],
        filePatterns: ['**/*.tsx', '**/*.jsx'],
        configFiles: [],
      },
      options: {},
    })

    // Svelte 插件配置
    this.availablePlugins.set('svelte', {
      name: 'Svelte',
      packageName: '@sveltejs/vite-plugin-svelte',
      required: true,
      detection: {
        dependencies: ['svelte'],
        filePatterns: ['**/*.svelte'],
        configFiles: ['svelte.config.js', 'svelte.config.ts'],
      },
      options: {},
    })

    // Solid 插件配置
    this.availablePlugins.set('solid', {
      name: 'Solid',
      packageName: 'vite-plugin-solid',
      required: true,
      detection: {
        dependencies: ['solid-js'],
        filePatterns: ['**/*.tsx', '**/*.jsx'],
        configFiles: [],
      },
      options: {},
    })

    // Lit 插件配置
    this.availablePlugins.set('lit', {
      name: 'Lit',
      packageName: '@vitejs/plugin-lit',
      required: false,
      detection: {
        dependencies: ['lit'],
        filePatterns: ['**/*.ts', '**/*.js'],
        configFiles: [],
      },
      options: {},
    })

    // Qwik 插件配置
    // 注意：Qwik 插件需要特殊处理，从 @builder.io/qwik/optimizer 导入
    this.availablePlugins.set('qwik', {
      name: 'Qwik',
      packageName: '@builder.io/qwik/optimizer',
      required: true,
      detection: {
        dependencies: ['@builder.io/qwik'],
        filePatterns: ['**/*.tsx'],
        configFiles: [],
      },
      options: {
        // Qwik 插件需要特殊的导入方式
        importName: 'qwikVite',
      },
    })

    // Marko 插件配置
    this.availablePlugins.set('marko', {
      name: 'Marko',
      packageName: '@marko/vite',
      required: true,
      detection: {
        dependencies: ['marko'],
        filePatterns: ['**/*.marko'],
        configFiles: ['marko.json'],
      },
      options: {},
    })

    // Angular 插件配置
    // 注意：Angular 插件需要特殊处理，使用 default export
    this.availablePlugins.set('angular', {
      name: 'Angular',
      packageName: '@analogjs/vite-plugin-angular',
      required: true,
      detection: {
        dependencies: ['@angular/core'],
        filePatterns: ['**/*.ts'],
        configFiles: ['angular.json'],
      },
      options: {
        // Angular 插件配置 - 必须使用 tsconfig.app.json
        tsconfig: './tsconfig.app.json',
      },
    })
  }

  /**
   * 框架检测器配置
   * 优先级越高越先匹配，置信度用于在多个匹配时选择最佳结果
   */
  private readonly frameworkDetectors: Array<{
    type: ProjectType
    priority: number
    detectDeps: (deps: Record<string, string>) => { detected: boolean, confidence: number }
    filePatterns?: string[]
  }> = [
    // Angular - 最高优先级，避免与其他框架混淆
    {
      type: ProjectType.ANGULAR,
      priority: 100,
      detectDeps: deps => ({
        detected: !!deps['@angular/core'],
        confidence: deps['@angular/core'] ? 0.95 : 0,
      }),
      filePatterns: ['**/*.component.ts'],
    },
    // Qwik
    {
      type: ProjectType.QWIK,
      priority: 95,
      detectDeps: deps => ({
        detected: !!deps['@builder.io/qwik'],
        confidence: deps['@builder.io/qwik'] ? 0.95 : 0,
      }),
    },
    // Vue 3
    {
      type: ProjectType.VUE3,
      priority: 90,
      detectDeps: (deps) => {
        const vue = deps.vue
        if (!vue)
          return { detected: false, confidence: 0 }
        const isV3 = vue.includes('^3') || vue.includes('~3') || vue.startsWith('3') || vue === 'latest' || vue === 'next'
        return { detected: isV3, confidence: isV3 ? 0.9 : 0 }
      },
      filePatterns: ['**/*.vue'],
    },
    // Vue 2
    {
      type: ProjectType.VUE2,
      priority: 89,
      detectDeps: (deps) => {
        const vue = deps.vue
        if (!vue)
          return { detected: false, confidence: 0 }
        const isV2 = vue.includes('^2') || vue.includes('~2') || vue.startsWith('2')
        return { detected: isV2, confidence: isV2 ? 0.9 : 0 }
      },
      filePatterns: ['**/*.vue'],
    },
    // Preact - 必须在 React 之前检测
    {
      type: ProjectType.PREACT,
      priority: 85,
      detectDeps: deps => ({
        detected: !!deps.preact,
        confidence: deps.preact ? 0.9 : 0,
      }),
    },
    // Solid
    {
      type: ProjectType.SOLID,
      priority: 84,
      detectDeps: deps => ({
        detected: !!deps['solid-js'],
        confidence: deps['solid-js'] ? 0.9 : 0,
      }),
    },
    // SvelteKit - 在 Svelte 之前检测
    {
      type: ProjectType.SVELTEKIT,
      priority: 83,
      detectDeps: deps => ({
        detected: !!deps['@sveltejs/kit'],
        confidence: deps['@sveltejs/kit'] ? 0.95 : 0,
      }),
    },
    // Svelte
    {
      type: ProjectType.SVELTE,
      priority: 82,
      detectDeps: deps => ({
        detected: !!deps.svelte && !deps['@sveltejs/kit'],
        confidence: deps.svelte ? 0.9 : 0,
      }),
      filePatterns: ['**/*.svelte'],
    },
    // React SWC - 在标准 React 之前检测
    {
      type: ProjectType.REACT_SWC,
      priority: 81,
      detectDeps: deps => ({
        detected: !!(deps.react && deps['react-dom'] && deps['@vitejs/plugin-react-swc']),
        confidence: deps['@vitejs/plugin-react-swc'] ? 0.95 : 0,
      }),
      filePatterns: ['**/*.jsx', '**/*.tsx'],
    },
    // React
    {
      type: ProjectType.REACT,
      priority: 80,
      detectDeps: deps => ({
        detected: !!(deps.react && deps['react-dom'] && !deps['@vitejs/plugin-react-swc']),
        confidence: deps.react && deps['react-dom'] ? 0.85 : 0,
      }),
      filePatterns: ['**/*.jsx', '**/*.tsx'],
    },
    // Marko
    {
      type: ProjectType.MARKO,
      priority: 75,
      detectDeps: deps => ({
        detected: !!deps.marko,
        confidence: deps.marko ? 0.9 : 0,
      }),
      filePatterns: ['**/*.marko'],
    },
    // Lit
    {
      type: ProjectType.LIT,
      priority: 70,
      detectDeps: deps => ({
        detected: !!deps.lit,
        confidence: deps.lit ? 0.85 : 0,
      }),
    },
    // Astro
    {
      type: ProjectType.ASTRO,
      priority: 92,
      detectDeps: deps => ({
        detected: !!deps.astro,
        confidence: deps.astro ? 0.95 : 0,
      }),
      filePatterns: ['**/*.astro'],
    },
    // Remix
    {
      type: ProjectType.REMIX,
      priority: 91,
      detectDeps: deps => ({
        detected: !!(deps['@remix-run/react'] || deps['@remix-run/node']),
        confidence: deps['@remix-run/react'] ? 0.95 : 0,
      }),
    },
  ]

  /**
   * 检测项目类型（并行优化版本 + 缓存）
   *
   * 使用并行检测提升性能，支持置信度评分选择最佳匹配
   * 检测结果会被缓存，避免重复检测
   */
  async detectProjectType(): Promise<ProjectType> {
    // 1. 检查内存缓存
    if (this.detectedType) {
      return this.detectedType
    }

    const startTime = Date.now()

    // 2. 检查磁盘缓存
    try {
      const cachedFramework = await this.detectionCache.get(this.cwd)
      if (cachedFramework && Object.values(ProjectType).includes(cachedFramework as ProjectType)) {
        this.detectedType = cachedFramework as ProjectType
        this.logger.debug(`使用缓存的框架检测结果: ${cachedFramework} (耗时: ${Date.now() - startTime}ms)`)
        return this.detectedType
      }
    }
    catch {
      // 缓存读取失败，继续正常检测
    }

    this.logger.debug('正在并行检测项目类型...')

    try {
      // 读取 package.json
      const packageJsonPath = PathUtils.resolve(this.cwd, 'package.json')
      let dependencies: Record<string, string> = {}

      if (await FileSystem.exists(packageJsonPath)) {
        const packageJson = JSON.parse(await FileSystem.readFile(packageJsonPath))
        dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
      }

      // 并行执行所有依赖检测
      const depResults = this.frameworkDetectors
        .map((detector) => {
          const result = detector.detectDeps(dependencies)
          return {
            type: detector.type,
            priority: detector.priority,
            ...result,
          }
        })
        .filter(r => r.detected)
        .sort((a, b) => {
          // 先按置信度排序，再按优先级排序
          if (b.confidence !== a.confidence)
            return b.confidence - a.confidence
          return b.priority - a.priority
        })

      // 如果从依赖中检测到框架，直接返回
      if (depResults.length > 0) {
        const best = depResults[0]
        this.detectedType = best.type
        // 保存到缓存
        await this.detectionCache.set(this.cwd, best.type).catch(() => {})
        this.logger.info(`检测到 ${best.type} 项目 (置信度: ${(best.confidence * 100).toFixed(0)}%, 耗时: ${Date.now() - startTime}ms)`)
        return this.detectedType
      }

      // 如果无法从依赖检测，并行检测文件
      const fileDetectors = this.frameworkDetectors
        .filter(d => d.filePatterns && d.filePatterns.length > 0)
        .map(async (detector) => {
          const hasFiles = await this.hasFiles(detector.filePatterns!)
          return {
            type: detector.type,
            priority: detector.priority,
            detected: hasFiles,
          }
        })

      const fileResults = (await Promise.all(fileDetectors))
        .filter(r => r.detected)
        .sort((a, b) => b.priority - a.priority)

      if (fileResults.length > 0) {
        const best = fileResults[0]
        this.detectedType = best.type
        // 保存到缓存
        await this.detectionCache.set(this.cwd, best.type).catch(() => {})
        this.logger.info(`从文件检测到 ${best.type} 项目 (耗时: ${Date.now() - startTime}ms)`)
        return this.detectedType
      }

      // 默认为 vanilla 项目
      this.detectedType = ProjectType.VANILLA
      this.logger.info(`未检测到特定框架，使用 Vanilla 配置 (耗时: ${Date.now() - startTime}ms)`)
      return this.detectedType
    }
    catch (error) {
      this.logger.warn('项目类型检测失败', { error: (error as Error).message })
      this.detectedType = ProjectType.VANILLA
      return this.detectedType
    }
  }

  /**
   * 检查是否存在指定模式的文件
   */
  private async hasFiles(patterns: string[]): Promise<boolean> {
    try {
      // 添加超时机制，避免长时间卡顿
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('文件检查超时')), 5000) // 5秒超时
      })

      const checkPromise = this.doFileCheck(patterns)

      return await Promise.race([checkPromise, timeoutPromise])
    }
    catch (error) {
      this.logger.warn('文件检查失败', { error: (error as Error).message })
      return false
    }
  }

  /**
   * 执行实际的文件检查
   */
  private async doFileCheck(patterns: string[]): Promise<boolean> {
    // 只检查当前项目的src目录，避免误检测packages目录中的其他项目文件
    const dirsToCheck = [
      PathUtils.resolve(this.cwd, 'src'),
    ]

    for (const dir of dirsToCheck) {
      if (await FileSystem.exists(dir)) {
        const hasFilesInDir = await this.checkFilesInDirectory(dir, patterns)
        if (hasFilesInDir) {
          this.logger.debug(`在目录 ${dir} 中找到匹配文件`)
          return true
        }
      }
    }
    return false
  }

  /**
   * 递归检查目录中是否有匹配的文件
   */
  private async checkFilesInDirectory(dir: string, patterns: string[], depth: number = 0): Promise<boolean> {
    try {
      // 限制递归深度，避免性能问题
      if (depth > 3) {
        return false
      }

      // 跳过常见的大型目录
      const dirName = PathUtils.basename(dir)
      if (['node_modules', '.git', 'dist', 'build', '.next', '.nuxt', 'coverage'].includes(dirName)) {
        return false
      }

      const files = await FileSystem.readDir(dir)

      for (const file of files) {
        const filePath = PathUtils.resolve(dir, file)
        const stat = await FileSystem.stat(filePath)

        if (stat.isDirectory()) {
          // 递归检查子目录（限制深度避免性能问题）
          const hasFilesInSubdir = await this.checkFilesInDirectory(filePath, patterns, depth + 1)
          if (hasFilesInSubdir)
            return true
        }
        else {
          // 检查文件是否匹配模式
          for (const pattern of patterns) {
            const extension = pattern.replace('**/*.', '.')
            if (file.endsWith(extension)) {
              return true
            }
          }
        }
      }
      return false
    }
    catch {
      return false
    }
  }

  /**
   * 检查是否安装了指定依赖
   */
  private async hasDependency(packageName: string): Promise<boolean> {
    try {
      const packageJsonPath = PathUtils.resolve(this.cwd, 'package.json')
      if (!await FileSystem.exists(packageJsonPath)) {
        return false
      }

      const packageJson = JSON.parse(await FileSystem.readFile(packageJsonPath, { encoding: 'utf-8' }))
      const dependencies = packageJson.dependencies || {}
      const devDependencies = packageJson.devDependencies || {}

      return !!(dependencies[packageName] || devDependencies[packageName])
    }
    catch {
      return false
    }
  }

  /**
   * 获取推荐的插件列表
   * @param explicitType - 用户明确指定的框架类型（可选）
   */
  async getRecommendedPlugins(explicitType?: string): Promise<Plugin[]> {
    // 如果用户明确指定了框架类型，则使用指定的类型，否则自动检测
    let projectType: ProjectType
    if (explicitType) {
      this.logger.info('使用用户指定的框架类型', { type: explicitType })
      // 映射字符串类型到ProjectType枚举
      const typeMap: Record<string, ProjectType> = {
        vue: ProjectType.VUE3,
        vue2: ProjectType.VUE2,
        vue3: ProjectType.VUE3,
        react: ProjectType.REACT,
        svelte: ProjectType.SVELTE,
        solid: ProjectType.SOLID,
        preact: ProjectType.PREACT,
        lit: ProjectType.LIT,
        qwik: ProjectType.QWIK,
        angular: ProjectType.ANGULAR,
        vanilla: ProjectType.VANILLA,
      }
      projectType = typeMap[explicitType] || (explicitType as ProjectType)
      this.detectedType = projectType
    }
    else {
      projectType = await this.detectProjectType()
    }

    const plugins: Plugin[] = []

    this.logger.info('PluginManager: 开始加载推荐插件...', { projectType })

    try {
      // 根据项目类型加载对应插件
      switch (projectType) {
        case ProjectType.VUE3: {
          const vuePlugins = await this.loadPlugin('vue3')
          if (vuePlugins)
            plugins.push(...vuePlugins)

          // 尝试加载 Vue JSX 插件（如果已安装依赖，则自动加载）
          const hasJsxDep = await this.hasDependency('@vitejs/plugin-vue-jsx')
          this.logger.debug('Vue JSX 插件检测', { hasJsxDep })
          if (hasJsxDep) {
            this.logger.info('检测到 Vue JSX 依赖，自动加载插件')
            const vueJsxPlugins = await this.loadPlugin('vue3-jsx')
            if (vueJsxPlugins) {
              plugins.push(...vueJsxPlugins)
              this.logger.info('Vue JSX 插件加载成功')
            }
            else {
              this.logger.warn('Vue JSX 插件加载失败')
            }
          }
          else {
            this.logger.debug('未检测到 @vitejs/plugin-vue-jsx 依赖，跳过 Vue JSX 插件加载')
          }
          break
        }
        case ProjectType.VUE2: {
          const vue2Plugins = await this.loadPlugin('vue2')
          if (vue2Plugins)
            plugins.push(...vue2Plugins)
          break
        }
        case ProjectType.REACT: {
          const reactPlugins = await this.loadPlugin('react')
          if (reactPlugins)
            plugins.push(...reactPlugins)
          break
        }
        case ProjectType.PREACT: {
          const preactPlugins = await this.loadPlugin('preact')
          if (preactPlugins)
            plugins.push(...preactPlugins)
          break
        }
        case ProjectType.SVELTE: {
          const sveltePlugins = await this.loadPlugin('svelte')
          if (sveltePlugins)
            plugins.push(...sveltePlugins)
          break
        }
        case ProjectType.SOLID: {
          const solidPlugins = await this.loadPlugin('solid')
          if (solidPlugins)
            plugins.push(...solidPlugins)
          break
        }
        case ProjectType.LIT: {
          const litPlugins = await this.loadPlugin('lit')
          if (litPlugins)
            plugins.push(...litPlugins)
          break
        }
        case ProjectType.QWIK: {
          const qwikPlugins = await this.loadPlugin('qwik')
          if (qwikPlugins)
            plugins.push(...qwikPlugins)
          break
        }
        case ProjectType.ANGULAR: {
          // 使用简单的 Angular 插件替代 Analog (Analog 不兼容 Vite 7)
          const { angularPlugin: angularPluginFn } = await import('../frameworks/angular/angular-plugin')
          const angularPlugin = angularPluginFn({
            tsconfig: './tsconfig.app.json',
          })
          plugins.push(angularPlugin)
          this.logger.info('✅ Angular 插件加载成功')
          break
        }
      }

      if (plugins.length > 0) {
        const pluginNames = plugins
          .map((p, index) => p.name || `plugin-${index + 1}`)
          .join(', ')
        this.logger.success(`智能插件加载完成: ${pluginNames}`)
      }
      return plugins
    }
    catch (error) {
      this.logger.error('智能插件加载失败', { error: (error as Error).message })
      return []
    }
  }

  /**
   * 加载指定插件
   * @returns 插件数组（某些框架插件会返回多个插件）
   */
  private async loadPlugin(pluginKey: string): Promise<Plugin[] | null> {
    const config = this.availablePlugins.get(pluginKey)
    if (!config) {
      this.logger.warn(`PluginManager: 未知插件: ${pluginKey}`)
      return null
    }

    this.logger.debug(`加载插件: ${pluginKey}`, {
      name: config.name,
      package: config.packageName,
    })

    try {
      // 动态导入插件 - 使用 Node 的模块解析机制，并以项目 package.json 为基准
      let pluginModule: any

      try {
        const [{ pathToFileURL }, { createRequire }] = await Promise.all([
          import('node:url'),
          import('node:module'),
        ])

        // 基于当前项目的 package.json 创建 require，确保在 pnpm workspace 下正确解析依赖
        const projectPkgPath = PathUtils.resolve(this.cwd, 'package.json')
        const projectRequire = createRequire(projectPkgPath)

        let resolvedPath: string | null = null

        try {
          // 首选：使用 Node 的 CJS 解析逻辑（支持大多数插件）
          resolvedPath = projectRequire.resolve(config.packageName)
        }
        catch (resolveError) {
          const message = (resolveError as Error).message || ''

          // 对仅提供 ESM exports 的插件（例如 @sveltejs/vite-plugin-svelte）做兼容处理
          // 这些包在 CJS require.resolve 下会因为缺少 "exports" main 而报错
          const shouldTryEsmFallback = config.packageName === '@sveltejs/vite-plugin-svelte'
            || message.includes('exports')
            || message.includes('ERR_PACKAGE')

          if (shouldTryEsmFallback) {
            // 直接读取项目 node_modules 下对应包的 package.json，并解析 exports 字段推导入口文件
            const pkgDir = PathUtils.resolve(this.cwd, 'node_modules', config.packageName)
            const pkgJsonPath = PathUtils.resolve(pkgDir, 'package.json')

            if (await FileSystem.exists(pkgJsonPath)) {
              try {
                const raw = await FileSystem.readFile(pkgJsonPath, { encoding: 'utf-8' })
                const pkgJson: any = JSON.parse(raw)
                let entry: string | undefined

                const exportsField = pkgJson.exports
                if (typeof exportsField === 'string') {
                  entry = exportsField
                }
                else if (exportsField && typeof exportsField === 'object') {
                  // 优先使用 "." 子路径，其次 default / import
                  const rootExport = exportsField['.'] || exportsField.default || exportsField.import

                  if (typeof rootExport === 'string') {
                    entry = rootExport
                  }
                  else if (rootExport && typeof rootExport === 'object') {
                    // 常见形态：{ import: { default: './src/index.js', types: '...' } }
                    const importExport = rootExport.import || rootExport.default || rootExport.module || rootExport.require

                    if (typeof importExport === 'string') {
                      entry = importExport
                    }
                    else if (importExport && typeof importExport === 'object') {
                      entry = importExport.default
                    }
                  }
                }

                // 兜底使用 main 字段（如果存在）
                if (!entry && typeof pkgJson.main === 'string')
                  entry = pkgJson.main

                if (!entry) {
                  throw resolveError
                }

                resolvedPath = PathUtils.resolve(pkgDir, entry)
                this.logger.debug('ESM 插件入口解析成功', {
                  package: config.packageName,
                  entry,
                  resolvedPath,
                })
              }
              catch {
                // 回退到原始错误处理逻辑
                throw resolveError
              }
            }
            else {
              throw resolveError
            }
          }
          else {
            throw resolveError
          }
        }

        if (!resolvedPath) {
          throw new Error(`无法解析插件入口: ${config.packageName}`)
        }

        const moduleUrl = pathToFileURL(resolvedPath).href

        // 使用动态 import 加载解析后的具体文件路径（支持 CJS / ESM）
        pluginModule = await import(moduleUrl)
      }
      catch (importError) {
        const message = (importError as Error).message
        this.logger.warn(`加载插件失败: ${config.packageName}`, { error: message })
        pluginModule = null
      }

      // 如果模块加载失败，根据是否必需决定行为，避免二次报错
      if (!pluginModule) {
        if (config.required) {
          this.logger.warn(`插件模块未找到: ${config.name} (${config.packageName})`)
        }
        else {
          this.logger.info(`可选插件未安装，已跳过: ${config.name} (${config.packageName})`)
        }
        return null
      }

      // 处理不同的插件导出方式
      let pluginFactory = pluginModule.default || pluginModule

      // Svelte插件特殊处理：@sveltejs/vite-plugin-svelte 导出 { svelte }
      if (pluginKey === 'svelte' && pluginModule.svelte && typeof pluginModule.svelte === 'function') {
        pluginFactory = pluginModule.svelte
      }

      // Qwik插件特殊处理：@builder.io/qwik/optimizer 导出 { qwikVite }
      if (pluginKey === 'qwik' && pluginModule.qwikVite && typeof pluginModule.qwikVite === 'function') {
        pluginFactory = pluginModule.qwikVite
      }

      // Angular插件特殊处理：@analogjs/vite-plugin-angular 使用 default export
      if (pluginKey === 'angular' && pluginModule.default && typeof pluginModule.default === 'function') {
        pluginFactory = pluginModule.default
      }

      // 如果插件有命名导出（如其他插件可能使用的命名导出）
      if (typeof pluginFactory !== 'function' && pluginModule.svelte) {
        pluginFactory = pluginModule.svelte
      }
      if (typeof pluginFactory !== 'function' && pluginModule.vitePluginSvelte) {
        pluginFactory = pluginModule.vitePluginSvelte
      }

      // 调用插件工厂函数
      const plugin = typeof pluginFactory === 'function' ? pluginFactory(config.options) : pluginFactory

      // 确保返回的是数组格式（Vite插件可能是数组）
      const pluginArray: Plugin[] = Array.isArray(plugin) ? plugin : [plugin]

      // 为没有名称的插件填充友好的名称，便于日志输出
      for (const p of pluginArray) {
        if (!p.name)
          p.name = config.name
      }

      this.logger.debug(`插件加载成功: ${config.name}`, { count: pluginArray.length })

      // 返回所有插件（某些框架如 React 会返回多个插件）
      return pluginArray.length > 0 ? pluginArray : null
    }
    catch (error) {
      // 显示插件加载失败的警告信息
      this.logger.warn(`插件加载失败: ${config.name} (${config.packageName})`)
      this.logger.warn(`错误详情: ${(error as Error).message}`)
      if ((error as Error).stack) {
        this.logger.debug(`错误堆栈: ${(error as Error).stack}`)
      }
      return null
    }
  }

  /**
   * 获取检测到的项目类型
   */
  getDetectedType(): ProjectType | null {
    return this.detectedType
  }
}
