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
import { FileSystem, PathUtils } from '../utils'

/**
 * 项目类型枚举
 */
export enum ProjectType {
  VUE3 = 'vue3',
  VUE2 = 'vue2',
  REACT = 'react',
  PREACT = 'preact',
  SVELTE = 'svelte',
  SVELTEKIT = 'sveltekit',
  SOLID = 'solid',
  LIT = 'lit',
  QWIK = 'qwik',
  ANGULAR = 'angular',
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

  constructor(cwd: string, logger: Logger) {
    this.cwd = cwd
    this.logger = logger
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
   * 检测项目类型
   */
  async detectProjectType(): Promise<ProjectType> {
    if (this.detectedType) {
      return this.detectedType
    }

    this.logger.debug('正在检测项目类型...')

    try {
      // 读取 package.json
      const packageJsonPath = PathUtils.resolve(this.cwd, 'package.json')
      if (await FileSystem.exists(packageJsonPath)) {
        const packageJson = JSON.parse(await FileSystem.readFile(packageJsonPath))
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

        // 检测 Vue 版本
        if (dependencies.vue) {
          const vueVersion = dependencies.vue
          if (vueVersion.includes('^3') || vueVersion.includes('~3') || vueVersion.startsWith('3')) {
            this.detectedType = ProjectType.VUE3
            this.logger.info('检测到 Vue 3 项目')
            return this.detectedType
          }
          else if (vueVersion.includes('^2') || vueVersion.includes('~2') || vueVersion.startsWith('2')) {
            this.detectedType = ProjectType.VUE2
            this.logger.info('检测到 Vue 2 项目')
            return this.detectedType
          }
        }

        // 检测 Preact（必须在 React 之前检测）
        if (dependencies.preact) {
          this.detectedType = ProjectType.PREACT
          this.logger.info('检测到 Preact 项目')
          return this.detectedType
        }

        // 检测 React
        if (dependencies.react && dependencies['react-dom']) {
          this.detectedType = ProjectType.REACT
          this.logger.info('检测到 React 项目')
          return this.detectedType
        }

        // 检测 Svelte
        if (dependencies.svelte) {
          this.detectedType = ProjectType.SVELTE
          this.logger.info('检测到 Svelte 项目')
          return this.detectedType
        }
      }

      // 如果无法从依赖检测，尝试从文件检测
      const hasVueFiles = await this.hasFiles(['**/*.vue'])
      if (hasVueFiles) {
        // 默认假设是 Vue 3
        this.detectedType = ProjectType.VUE3
        this.logger.info('检测到 Vue 文件，假设为 Vue 3 项目')
        return this.detectedType
      }

      const hasReactFiles = await this.hasFiles(['**/*.jsx', '**/*.tsx'])
      if (hasReactFiles) {
        this.detectedType = ProjectType.REACT
        this.logger.info('检测到 React 文件')
        return this.detectedType
      }

      const hasSvelteFiles = await this.hasFiles(['**/*.svelte'])
      if (hasSvelteFiles) {
        this.detectedType = ProjectType.SVELTE
        this.logger.info('检测到 Svelte 文件')
        return this.detectedType
      }

      // 默认为 vanilla 项目
      this.detectedType = ProjectType.VANILLA
      this.logger.info('未检测到特定框架，使用 Vanilla 配置')
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
