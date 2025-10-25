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
  SVELTE = 'svelte',
  VANILLA = 'vanilla'
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
  options?: Record<string, unknown>
  /** 插件的依赖项 */
  dependencies?: string[]
}

/**
 * 智能插件管理器类
 */
export class SmartPluginManager {
  private logger: Logger
  private cwd: string
  private detectedType: ProjectType | null = null
  private availablePlugins: Map<string, PluginConfig> = new Map()

  // 性能优化：插件检测结果缓存
  private static pluginCache = new Map<string, { type: ProjectType; timestamp: number; packageJsonHash: string }>()
  private static readonly PLUGIN_CACHE_TTL = 60 * 1000 // 1分钟缓存

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
        configFiles: ['vue.config.js', 'vue.config.ts']
      },
      options: {}
    })

    // Vue 3 JSX 插件配置
    this.availablePlugins.set('vue3-jsx', {
      name: 'Vue 3 JSX',
      packageName: '@vitejs/plugin-vue-jsx',
      required: false,
      detection: {
        dependencies: ['vue'],
        filePatterns: ['**/*.tsx', '**/*.jsx'],
        configFiles: []
      },
      options: {
        transformOn: true,
        mergeProps: true
      }
    })

    // Vue 2 插件配置
    this.availablePlugins.set('vue2', {
      name: 'Vue 2',
      packageName: '@vitejs/plugin-vue2',
      required: true,
      detection: {
        dependencies: ['vue@^2'],
        filePatterns: ['**/*.vue'],
        configFiles: ['vue.config.js', 'vue.config.ts']
      },
      options: {}
    })

    // React 插件配置
    this.availablePlugins.set('react', {
      name: 'React',
      packageName: '@vitejs/plugin-react',
      required: true,
      detection: {
        dependencies: ['react', 'react-dom'],
        filePatterns: ['**/*.jsx', '**/*.tsx'],
        configFiles: []
      },
      options: {}
    })

    // Svelte 插件配置
    this.availablePlugins.set('svelte', {
      name: 'Svelte',
      packageName: '@sveltejs/vite-plugin-svelte',
      required: true,
      detection: {
        dependencies: ['svelte'],
        filePatterns: ['**/*.svelte'],
        configFiles: ['svelte.config.js', 'svelte.config.ts']
      },
      options: {}
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

    // 性能优化：获取 package.json hash 用于缓存
    const packageJsonPath = PathUtils.resolve(this.cwd, 'package.json')
    const packageJsonHash = await this.getPackageJsonHash(packageJsonPath)
    const cached = SmartPluginManager.pluginCache.get(this.cwd)

    if (cached &&
      cached.packageJsonHash === packageJsonHash &&
      Date.now() - cached.timestamp < SmartPluginManager.PLUGIN_CACHE_TTL) {
      this.detectedType = cached.type
      if (this.logger.getLevel() === 'debug') {
        this.logger.debug('使用缓存的项目类型检测结果', { type: this.detectedType })
      }
      return this.detectedType
    }

    try {
      // 读取 package.json
      if (await FileSystem.exists(packageJsonPath)) {
        const packageJson = JSON.parse(await FileSystem.readFile(packageJsonPath))
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

        // 检测 Vue 版本
        if (dependencies.vue) {
          const vueVersion = dependencies.vue
          if (vueVersion.includes('^3') || vueVersion.includes('~3') || vueVersion.startsWith('3')) {
            this.detectedType = ProjectType.VUE3
            // 只在 debug 模式显示
            if (this.logger.getLevel() === 'debug') {
              this.logger.debug('检测到 Vue 3 项目')
            }

            // 缓存检测结果
            SmartPluginManager.pluginCache.set(this.cwd, {
              type: this.detectedType,
              timestamp: Date.now(),
              packageJsonHash
            })
            return this.detectedType
          } else if (vueVersion.includes('^2') || vueVersion.includes('~2') || vueVersion.startsWith('2')) {
            this.detectedType = ProjectType.VUE2
            // 只在 debug 模式显示
            if (this.logger.getLevel() === 'debug') {
              this.logger.debug('检测到 Vue 2 项目')
            }

            // 缓存检测结果
            SmartPluginManager.pluginCache.set(this.cwd, {
              type: this.detectedType,
              timestamp: Date.now(),
              packageJsonHash
            })
            return this.detectedType
          }
        }

        // 检测 React
        if (dependencies.react && dependencies['react-dom']) {
          this.detectedType = ProjectType.REACT
          // 只在 debug 模式显示
          if (this.logger.getLevel() === 'debug') {
            this.logger.debug('检测到 React 项目')
          }

          // 缓存检测结果
          SmartPluginManager.pluginCache.set(this.cwd, {
            type: this.detectedType,
            timestamp: Date.now(),
            packageJsonHash
          })
          return this.detectedType
        }

        // 检测 Svelte
        if (dependencies.svelte) {
          this.detectedType = ProjectType.SVELTE
          // 只在 debug 模式显示
          if (this.logger.getLevel() === 'debug') {
            this.logger.debug('检测到 Svelte 项目')
          }

          // 缓存检测结果
          SmartPluginManager.pluginCache.set(this.cwd, {
            type: this.detectedType,
            timestamp: Date.now(),
            packageJsonHash
          })
          return this.detectedType
        }
      }

      // 如果无法从依赖检测，尝试从文件检测
      const hasVueFiles = await this.hasFiles(['**/*.vue'])
      if (hasVueFiles) {
        // 默认假设是 Vue 3
        this.detectedType = ProjectType.VUE3
        // 只在 debug 模式显示
        if (this.logger.getLevel() === 'debug') {
          this.logger.debug('检测到 Vue 文件，假设为 Vue 3 项目')
        }

        SmartPluginManager.pluginCache.set(this.cwd, {
          type: this.detectedType,
          timestamp: Date.now(),
          packageJsonHash
        })
        return this.detectedType
      }

      const hasReactFiles = await this.hasFiles(['**/*.jsx', '**/*.tsx'])
      if (hasReactFiles) {
        this.detectedType = ProjectType.REACT
        this.logger.info('检测到 React 文件')

        SmartPluginManager.pluginCache.set(this.cwd, {
          type: this.detectedType,
          timestamp: Date.now(),
          packageJsonHash
        })
        return this.detectedType
      }

      const hasSvelteFiles = await this.hasFiles(['**/*.svelte'])
      if (hasSvelteFiles) {
        this.detectedType = ProjectType.SVELTE
        this.logger.info('检测到 Svelte 文件')

        SmartPluginManager.pluginCache.set(this.cwd, {
          type: this.detectedType,
          timestamp: Date.now(),
          packageJsonHash
        })
        return this.detectedType
      }

      // 默认为 vanilla 项目
      this.detectedType = ProjectType.VANILLA
      this.logger.info('未检测到特定框架，使用 Vanilla 配置')

      // 缓存检测结果
      SmartPluginManager.pluginCache.set(this.cwd, {
        type: this.detectedType,
        timestamp: Date.now(),
        packageJsonHash
      })

      return this.detectedType

    } catch (error) {
      this.logger.warn('项目类型检测失败', { error: (error as Error).message })
      this.detectedType = ProjectType.VANILLA
      return this.detectedType
    }
  }

  /**
   * 获取 package.json 的 hash 值用于缓存
   */
  private async getPackageJsonHash(packageJsonPath: string): Promise<string> {
    try {
      const content = await FileSystem.readFile(packageJsonPath)
      // 简单的 hash 算法
      let hash = 0
      for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
      }
      return hash.toString(36)
    } catch {
      return Date.now().toString()
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
    } catch (error) {
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
      PathUtils.resolve(this.cwd, 'src')
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
          if (hasFilesInSubdir) return true
        } else {
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
    } catch {
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
    } catch {
      return false
    }
  }

  /**
   * 获取推荐的插件列表
   */
  async getRecommendedPlugins(): Promise<Plugin[]> {
    const projectType = await this.detectProjectType()
    const plugins: Plugin[] = []

    // 只在 debug 模式显示
    if (this.logger.getLevel() === 'debug') {
      this.logger.debug('SmartPluginManager: 开始加载推荐插件...', { projectType })
    }

    try {
      // 根据项目类型加载对应插件
      switch (projectType) {
        case ProjectType.VUE3:
          const vuePlugin = await this.loadPlugin('vue3')
          if (vuePlugin) plugins.push(vuePlugin)

          // 尝试加载 Vue JSX 插件（如果已安装依赖，则自动加载）
          const hasJsxDep = await this.hasDependency('@vitejs/plugin-vue-jsx')
          this.logger.debug('Vue JSX 插件检测', { hasJsxDep })
          if (hasJsxDep) {
            this.logger.info('检测到 Vue JSX 依赖，自动加载插件')
            const vueJsxPlugin = await this.loadPlugin('vue3-jsx')
            if (vueJsxPlugin) {
              plugins.push(vueJsxPlugin)
              this.logger.info('Vue JSX 插件加载成功')
            } else {
              this.logger.warn('Vue JSX 插件加载失败')
            }
          } else {
            this.logger.debug('未检测到 @vitejs/plugin-vue-jsx 依赖，跳过 Vue JSX 插件加载')
          }
          break
        case ProjectType.VUE2:
          const vue2Plugin = await this.loadPlugin('vue2')
          if (vue2Plugin) plugins.push(vue2Plugin)
          break
        case ProjectType.REACT:
          const reactPlugin = await this.loadPlugin('react')
          if (reactPlugin) plugins.push(reactPlugin)
          break
        case ProjectType.SVELTE:
          const sveltePlugin = await this.loadPlugin('svelte')
          if (sveltePlugin) plugins.push(sveltePlugin)
          break
      }

      // 只在 debug 模式显示
      if (plugins.length > 0 && this.logger.getLevel() === 'debug') {
        const pluginNames = plugins.map(p => p.name || 'unknown').join(', ')
        this.logger.debug(`智能插件加载完成: ${pluginNames}`)
      }
      return plugins

    } catch (error) {
      this.logger.error('智能插件加载失败', { error: (error as Error).message })
      return []
    }
  }

  /**
   * 加载指定插件
   */
  private async loadPlugin(pluginKey: string): Promise<Plugin | null> {
    const config = this.availablePlugins.get(pluginKey)
    if (!config) {
      this.logger.warn(`SmartPluginManager: 未知插件: ${pluginKey}`)
      return null
    }

    this.logger.debug(`加载插件: ${pluginKey}`, {
      name: config.name,
      package: config.packageName
    })

    // 重试配置
    const maxRetries = 3
    const retryDelay = 1000 // 1秒

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 动态导入插件 - 使用正确的模块解析上下文
        // 从项目根目录解析模块，而不是从 launcher 包解析
        const { createRequire } = await import('module')
        const require = createRequire(PathUtils.resolve(this.cwd, 'package.json'))

        // 先尝试 require 解析路径
        const modulePath = require.resolve(config.packageName)

        // 将 Windows 路径转换为 file:// URL
        const { pathToFileURL } = await import('url')
        const moduleUrl = pathToFileURL(modulePath).href

        // 然后使用动态导入
        const pluginModule = await import(moduleUrl)
        const pluginFactory = pluginModule.default || pluginModule
        const plugin = pluginFactory(config.options)

        this.logger.debug(`插件加载成功: ${config.name}`)
        return plugin
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)

        if (attempt < maxRetries) {
          this.logger.warn(`插件加载失败，尝试重试 (${attempt}/${maxRetries})`, {
            name: config.name,
            package: config.packageName,
            error: errorMessage
          })

          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
        } else {
          // 最后一次尝试失败，只在调试模式下显示详细信息
          if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
            this.logger.debug('插件加载失败，可能未安装', {
              name: config.name,
              package: config.packageName,
              error: errorMessage,
              attempts: maxRetries
            })
          }
          return null
        }
      }
    }

    return null
  }

  /**
   * 获取检测到的项目类型
   */
  getDetectedType(): ProjectType | null {
    return this.detectedType
  }

  /**
   * 检查插件依赖
   * @param pluginKey - 插件键名
   * @returns 依赖检查结果
   */
  async checkPluginDependencies(pluginKey: string): Promise<{
    satisfied: boolean
    missing: string[]
    conflicts: string[]
  }> {
    const result = {
      satisfied: true,
      missing: [] as string[],
      conflicts: [] as string[]
    }

    const config = this.availablePlugins.get(pluginKey)
    if (!config) {
      result.satisfied = false
      result.missing.push(config?.packageName || pluginKey)
      return result
    }

    try {
      // 读取项目的 package.json
      const packageJsonPath = PathUtils.resolve(this.cwd, 'package.json')
      const packageJson = JSON.parse(await FileSystem.readFile(packageJsonPath, { encoding: 'utf-8' }))
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies
      }

      // 检查插件本身是否已安装
      if (!allDeps[config.packageName]) {
        result.satisfied = false
        result.missing.push(config.packageName)
      }

      // 检查插件的依赖
      if (config.dependencies) {
        for (const dep of config.dependencies) {
          if (!allDeps[dep]) {
            result.satisfied = false
            result.missing.push(dep)
          }
        }
      }

      // 检查是否有冲突的插件
      const conflictingPlugins: Record<string, string[]> = {
        'vue3': ['vue2', '@vitejs/plugin-vue2'],
        'vue2': ['vue3', '@vitejs/plugin-vue'],
        'react': ['preact', '@preact/preset-vite']
      }

      const conflicts = conflictingPlugins[pluginKey] || []
      for (const conflict of conflicts) {
        if (allDeps[conflict]) {
          result.satisfied = false
          result.conflicts.push(conflict)
        }
      }

      return result
    } catch (error) {
      this.logger.debug('依赖检查失败', {
        plugin: pluginKey,
        error: error instanceof Error ? error.message : String(error)
      })

      result.satisfied = false
      return result
    }
  }

  /**
   * 验证所有插件依赖
   * @returns 所有插件的依赖验证结果
   */
  async validateAllPluginDependencies(): Promise<Map<string, {
    satisfied: boolean
    missing: string[]
    conflicts: string[]
  }>> {
    const results = new Map()

    for (const [pluginKey] of this.availablePlugins) {
      const result = await this.checkPluginDependencies(pluginKey)
      results.set(pluginKey, result)
    }

    return results
  }

  /**
   * 获取插件的依赖树
   * @param pluginKey - 插件键名
   * @returns 依赖树
   */
  async getPluginDependencyTree(pluginKey: string): Promise<{
    name: string
    version: string
    dependencies: Array<{ name: string; version: string }>
  } | null> {
    const config = this.availablePlugins.get(pluginKey)
    if (!config) {
      return null
    }

    try {
      // 获取插件的 package.json
      const { createRequire } = await import('module')
      const require = createRequire(PathUtils.resolve(this.cwd, 'package.json'))

      const pluginPackageJsonPath = require.resolve(`${config.packageName}/package.json`)
      const pluginPackageJson = JSON.parse(await FileSystem.readFile(pluginPackageJsonPath, { encoding: 'utf-8' }))

      const tree = {
        name: pluginPackageJson.name,
        version: pluginPackageJson.version,
        dependencies: [] as Array<{ name: string; version: string }>
      }

      // 收集依赖
      const deps = {
        ...pluginPackageJson.dependencies,
        ...pluginPackageJson.peerDependencies
      }

      for (const [name, version] of Object.entries(deps)) {
        tree.dependencies.push({
          name,
          version: version as string
        })
      }

      return tree
    } catch (error) {
      this.logger.debug('获取插件依赖树失败', {
        plugin: pluginKey,
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }

  /**
   * 自动安装缺失的插件依赖
   * @param pluginKey - 插件键名
   * @returns 是否成功
   */
  async autoInstallDependencies(pluginKey: string): Promise<boolean> {
    const check = await this.checkPluginDependencies(pluginKey)

    if (check.satisfied) {
      this.logger.info('插件依赖已满足，无需安装')
      return true
    }

    if (check.missing.length > 0) {
      this.logger.info(`检测到缺失的依赖: ${check.missing.join(', ')}`)

      try {
        // 确定包管理器
        const packageManager = await this.detectPackageManager()

        // 构建安装命令
        const packages = check.missing.join(' ')
        const command = this.getInstallCommand(packageManager, packages)

        this.logger.info(`执行安装命令: ${command}`)

        // 执行安装
        const { execSync } = await import('child_process')
        execSync(command, {
          cwd: this.cwd,
          stdio: 'inherit'
        })

        this.logger.success('依赖安装成功')
        return true
      } catch (error) {
        this.logger.error('依赖安装失败', {
          error: error instanceof Error ? error.message : String(error)
        })
        return false
      }
    }

    if (check.conflicts.length > 0) {
      this.logger.warn(`检测到冲突的依赖: ${check.conflicts.join(', ')}`)
      this.logger.warn('请手动解决依赖冲突')
    }

    return false
  }

  /**
   * 检测包管理器
   */
  private async detectPackageManager(): Promise<'npm' | 'yarn' | 'pnpm'> {
    if (await FileSystem.exists(PathUtils.resolve(this.cwd, 'pnpm-lock.yaml'))) {
      return 'pnpm'
    }
    if (await FileSystem.exists(PathUtils.resolve(this.cwd, 'yarn.lock'))) {
      return 'yarn'
    }
    return 'npm'
  }

  /**
   * 获取安装命令
   */
  private getInstallCommand(packageManager: 'npm' | 'yarn' | 'pnpm', packages: string): string {
    switch (packageManager) {
      case 'pnpm':
        return `pnpm add -D ${packages}`
      case 'yarn':
        return `yarn add -D ${packages}`
      case 'npm':
        return `npm install -D ${packages}`
    }
  }
}
