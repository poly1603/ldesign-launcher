/**
 * 框架适配器基类
 * 
 * 提供框架适配器的抽象基类，所有具体框架实现都应继承此类
 * 
 * @author LDesign Team
 * @since 2.0.0
 */

import type { Plugin } from 'vite'
import type {
  FrameworkAdapter as IFrameworkAdapter,
  FrameworkType,
  FrameworkDetectionResult,
  FrameworkDependencies,
  FrameworkFeatures,
  FrameworkOptions
} from '../../types/framework'
import type { BuildEngine } from '../../types/engine'
import type { ViteLauncherConfig } from '../../types/config'
import { Logger } from '../../utils/logger'
import { FileSystem } from '../../utils/file-system'
import { PathUtils } from '../../utils/path-utils'

/**
 * 框架适配器抽象基类
 */
export abstract class FrameworkAdapter implements IFrameworkAdapter {
  /** 框架名称 */
  abstract readonly name: FrameworkType
  
  /** 框架版本 */
  abstract readonly version?: string
  
  /** 框架描述 */
  abstract readonly description?: string
  
  /** 框架特性 */
  abstract readonly features: FrameworkFeatures
  
  /** 日志记录器 */
  protected logger: Logger
  
  /** 是否已初始化 */
  protected initialized = false

  constructor() {
    // 延迟初始化 logger，因为 name 是抽象属性
    this.logger = new Logger('Framework')
  }

  /**
   * 检测项目是否使用该框架
   */
  abstract detect(cwd: string): Promise<FrameworkDetectionResult>

  /**
   * 获取框架所需的构建插件
   */
  abstract getPlugins(engine: BuildEngine, options?: FrameworkOptions): Promise<Plugin[]>

  /**
   * 获取框架特定的配置
   */
  abstract getConfig(options?: FrameworkOptions): Partial<ViteLauncherConfig>

  /**
   * 获取框架依赖列表
   */
  abstract getDependencies(): FrameworkDependencies

  /**
   * 获取推荐的 npm scripts
   */
  getScripts(): Record<string, string> {
    return {
      dev: 'launcher dev',
      build: 'launcher build',
      preview: 'launcher preview'
    }
  }

  /**
   * 获取环境变量配置
   */
  getEnvConfig(): Record<string, string> {
    return {}
  }

  /**
   * 验证框架配置
   */
  validateConfig(config: ViteLauncherConfig): boolean {
    // 默认实现：总是返回 true
    return true
  }

  /**
   * 初始化框架适配器
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('适配器已初始化，跳过重复初始化')
      return
    }

    this.logger.debug('初始化框架适配器...')
    await this.onInitialize()
    this.initialized = true
    this.logger.debug('框架适配器初始化完成')
  }

  /**
   * 清理资源
   */
  async dispose(): Promise<void> {
    this.logger.debug('清理框架适配器资源...')
    await this.onDispose()
    this.initialized = false
    this.logger.debug('框架适配器资源清理完成')
  }

  /**
   * 子类可重写的初始化钩子
   */
  protected async onInitialize(): Promise<void> {
    // 默认空实现
  }

  /**
   * 子类可重写的清理钩子
   */
  protected async onDispose(): Promise<void> {
    // 默认空实现
  }

  /**
   * 辅助方法：读取 package.json
   */
  protected async readPackageJson(cwd: string): Promise<any> {
    const pkgPath = PathUtils.join(cwd, 'package.json')
    
    if (!await FileSystem.exists(pkgPath)) {
      return {}
    }

    try {
      const content = await FileSystem.readFile(pkgPath, { encoding: 'utf-8' })
      return JSON.parse(content)
    } catch (error) {
      this.logger.warn(`读取 package.json 失败: ${(error as Error).message}`)
      return {}
    }
  }

  /**
   * 辅助方法：检查依赖是否存在
   */
  protected async hasDependency(cwd: string, packageName: string): Promise<boolean> {
    const pkg = await this.readPackageJson(cwd)
    return !!(
      pkg.dependencies?.[packageName] ||
      pkg.devDependencies?.[packageName] ||
      pkg.peerDependencies?.[packageName]
    )
  }

  /**
   * 辅助方法：获取依赖版本
   */
  protected async getDependencyVersion(cwd: string, packageName: string): Promise<string | null> {
    const pkg = await this.readPackageJson(cwd)
    return (
      pkg.dependencies?.[packageName] ||
      pkg.devDependencies?.[packageName] ||
      pkg.peerDependencies?.[packageName] ||
      null
    )
  }

  /**
   * 辅助方法：检查文件是否存在
   */
  protected async hasFile(cwd: string, pattern: string): Promise<boolean> {
    const filePath = PathUtils.join(cwd, pattern)
    return FileSystem.exists(filePath)
  }

  /**
   * 辅助方法：查找匹配的文件
   */
  protected async findFiles(cwd: string, patterns: string[]): Promise<string[]> {
    const foundFiles: string[] = []
    
    for (const pattern of patterns) {
      const filePath = PathUtils.join(cwd, pattern)
      if (await FileSystem.exists(filePath)) {
        foundFiles.push(pattern)
      }
    }
    
    return foundFiles
  }

  /**
   * 辅助方法：解析版本号
   */
  protected parseVersion(versionString: string): { major: number; minor: number; patch: number; full: string } {
    // 移除版本前缀（^, ~, >=, 等）
    const cleanVersion = versionString.replace(/^[\^~>=<]+/, '')
    const parts = cleanVersion.split('.')

    return {
      major: parseInt(parts[0] || '0', 10),
      minor: parseInt(parts[1] || '0', 10),
      patch: parseInt(parts[2] || '0', 10),
      full: cleanVersion
    }
  }

  /**
   * 辅助方法：读取文件内容
   */
  protected async readFileContent(cwd: string, filePath: string): Promise<string | null> {
    const fullPath = PathUtils.join(cwd, filePath)

    if (!await FileSystem.exists(fullPath)) {
      return null
    }

    try {
      return await FileSystem.readFile(fullPath, { encoding: 'utf-8' })
    } catch (error) {
      this.logger.warn(`读取文件 ${filePath} 失败: ${(error as Error).message}`)
      return null
    }
  }

  /**
   * 辅助方法：检查文件内容是否包含特定模式
   */
  protected async fileContainsPattern(
    cwd: string,
    filePath: string,
    pattern: RegExp | string
  ): Promise<boolean> {
    const content = await this.readFileContent(cwd, filePath)
    if (!content) {
      return false
    }

    if (typeof pattern === 'string') {
      return content.includes(pattern)
    }

    return pattern.test(content)
  }

  /**
   * 辅助方法：检查文件中的 import 语句
   *
   * @param cwd - 项目根目录
   * @param filePath - 文件路径
   * @param packageNames - 要检查的包名列表
   * @returns 找到的包名列表
   */
  protected async findImportsInFile(
    cwd: string,
    filePath: string,
    packageNames: string[]
  ): Promise<string[]> {
    const content = await this.readFileContent(cwd, filePath)
    if (!content) {
      return []
    }

    const foundImports: string[] = []

    for (const packageName of packageNames) {
      // 匹配各种 import 语法
      const patterns = [
        new RegExp(`import\\s+.*?from\\s+['"]${packageName}['"]`, 'g'),
        new RegExp(`import\\s+['"]${packageName}['"]`, 'g'),
        new RegExp(`require\\s*\\(['"]${packageName}['"]\\)`, 'g'),
      ]

      const hasImport = patterns.some(pattern => pattern.test(content))
      if (hasImport) {
        foundImports.push(packageName)
      }
    }

    return foundImports
  }

  /**
   * 辅助方法：检查项目结构模式
   *
   * @param cwd - 项目根目录
   * @param patterns - 文件/目录模式列表
   * @returns 匹配的模式数量
   */
  protected async checkProjectStructure(
    cwd: string,
    patterns: string[]
  ): Promise<number> {
    let matchCount = 0

    for (const pattern of patterns) {
      const fullPath = PathUtils.join(cwd, pattern)
      if (await FileSystem.exists(fullPath)) {
        matchCount++
      }
    }

    return matchCount
  }

  /**
   * 辅助方法：扫描入口文件
   *
   * @param cwd - 项目根目录
   * @returns 找到的入口文件列表
   */
  protected async findEntryFiles(cwd: string): Promise<string[]> {
    const commonEntryPatterns = [
      'src/main.ts',
      'src/main.tsx',
      'src/main.js',
      'src/main.jsx',
      'src/index.ts',
      'src/index.tsx',
      'src/index.js',
      'src/index.jsx',
      'src/App.tsx',
      'src/App.jsx',
      'src/App.vue',
      'src/app.ts',
      'src/app.js',
      'index.html'
    ]

    return this.findFiles(cwd, commonEntryPatterns)
  }
}

