/**
 * 插件注册表系统
 * 
 * 管理插件元数据、版本信息和依赖关系
 * 
 * @author LDesign Team
 * @since 1.0.0
 */

import { Logger } from '../utils/logger'
import type { PluginManifest, PluginVersion, PluginSearchResult } from '../types'
import { PluginStatus } from '../types'

export { PluginStatus }

/**
 * 插件元数据
 */
export interface PluginMetadata {
  /** 插件ID */
  id: string
  /** 插件名称 */
  name: string
  /** 描述 */
  description: string
  /** 作者 */
  author: string | { name: string; email?: string }
  /** 版本列表 */
  versions: PluginVersion[]
  /** 标签 */
  tags: string[]
  /** 分类 */
  category: 'optimization' | 'framework' | 'testing' | 'deployment' | 'utility' | 'theme'
  /** 下载量 */
  downloads: number
  /** 评分 */
  rating: number
  /** 最后更新时间 */
  lastUpdated: Date
  /** 许可证 */
  license: string
  /** 仓库地址 */
  repository?: string
  /** 主页 */
  homepage?: string
  /** 关键词 */
  keywords: string[]
  /** 兼容性 */
  compatibility: {
    launcher: string
    node: string
    npm?: string
  }
}

/**
 * 插件注册表类
 */
export class PluginRegistry {
  private logger: Logger
  private plugins: Map<string, PluginMetadata>
  private installedPlugins: Map<string, PluginManifest>
  private cache: Map<string, any>

  constructor() {
    this.logger = new Logger('plugin-registry')
    this.plugins = new Map()
    this.installedPlugins = new Map()
    this.cache = new Map()
    this.initializeRegistry()
  }

  /**
   * 初始化注册表
   */
  private initializeRegistry(): void {
    // 加载内置插件列表
    this.loadBuiltinPlugins()
    // 加载已安装插件
    this.loadInstalledPlugins()
  }

  /**
   * 加载内置插件
   */
  private loadBuiltinPlugins(): void {
    const builtinPlugins: PluginMetadata[] = [
      {
        id: '@ldesign/plugin-react-optimizer',
        name: 'React Optimizer',
        description: '优化React应用性能，包括代码分割、懒加载和渲染优化',
        author: 'LDesign Team',
        versions: [
          {
            version: '1.0.0',
            dependencies: { react: '>=17.0.0' },
            publishedAt: new Date('2024-01-01')
          }
        ],
        tags: ['react', 'optimization', 'performance'],
        category: 'optimization',
        downloads: 15000,
        rating: 4.8,
        lastUpdated: new Date('2024-01-01'),
        license: 'MIT',
        repository: 'https://github.com/ldesign/plugin-react-optimizer',
        keywords: ['react', 'performance', 'optimization'],
        compatibility: {
          launcher: '>=1.0.0',
          node: '>=16.0.0'
        }
      },
      {
        id: '@ldesign/plugin-vue3-enhancer',
        name: 'Vue 3 Enhancer',
        description: 'Vue 3性能增强插件，支持自动组件导入、性能监控和优化建议',
        author: 'LDesign Team',
        versions: [
          {
            version: '1.0.0',
            dependencies: { vue: '>=3.0.0' },
            publishedAt: new Date('2024-01-01')
          }
        ],
        tags: ['vue', 'vue3', 'optimization'],
        category: 'framework',
        downloads: 12000,
        rating: 4.7,
        lastUpdated: new Date('2024-01-01'),
        license: 'MIT',
        repository: 'https://github.com/ldesign/plugin-vue3-enhancer',
        keywords: ['vue', 'vue3', 'performance'],
        compatibility: {
          launcher: '>=1.0.0',
          node: '>=16.0.0'
        }
      },
      {
        id: '@ldesign/plugin-bundle-analyzer',
        name: 'Bundle Analyzer',
        description: '可视化分析打包结果，识别体积优化机会',
        author: 'LDesign Team',
        versions: [
          {
            version: '1.0.0',
            dependencies: {},
            publishedAt: new Date('2024-01-01')
          }
        ],
        tags: ['bundle', 'analysis', 'visualization'],
        category: 'utility',
        downloads: 20000,
        rating: 4.9,
        lastUpdated: new Date('2024-01-01'),
        license: 'MIT',
        keywords: ['bundle', 'size', 'analysis'],
        compatibility: {
          launcher: '>=1.0.0',
          node: '>=16.0.0'
        }
      },
      {
        id: '@ldesign/plugin-pwa-builder',
        name: 'PWA Builder',
        description: '快速构建PWA应用，自动生成Service Worker和manifest',
        author: 'LDesign Team',
        versions: [
          {
            version: '1.0.0',
            dependencies: {},
            publishedAt: new Date('2024-01-01')
          }
        ],
        tags: ['pwa', 'service-worker', 'offline'],
        category: 'deployment',
        downloads: 8000,
        rating: 4.6,
        lastUpdated: new Date('2024-01-01'),
        license: 'MIT',
        keywords: ['pwa', 'offline', 'mobile'],
        compatibility: {
          launcher: '>=1.0.0',
          node: '>=16.0.0'
        }
      },
      {
        id: '@ldesign/plugin-test-runner',
        name: 'Test Runner',
        description: '集成测试运行器，支持单元测试、集成测试和E2E测试',
        author: 'LDesign Team',
        versions: [
          {
            version: '1.0.0',
            dependencies: {},
            publishedAt: new Date('2024-01-01')
          }
        ],
        tags: ['testing', 'unit-test', 'e2e'],
        category: 'testing',
        downloads: 10000,
        rating: 4.5,
        lastUpdated: new Date('2024-01-01'),
        license: 'MIT',
        keywords: ['test', 'jest', 'vitest'],
        compatibility: {
          launcher: '>=1.0.0',
          node: '>=16.0.0'
        }
      }
    ]

    for (const plugin of builtinPlugins) {
      this.plugins.set(plugin.id, plugin)
    }
  }

  /**
   * 加载已安装插件
   */
  private async loadInstalledPlugins(): Promise<void> {
    const fs = await import('fs-extra')
    const path = await import('path')
    
    try {
      // 从本地存储加载已安装插件信息
      const storageDir = path.join(process.cwd(), '.ldesign', 'plugins')
      const manifestFile = path.join(storageDir, 'installed.json')
      
      if (await fs.pathExists(manifestFile)) {
        const installed = await fs.readJson(manifestFile)
        
        for (const manifest of installed) {
          this.installedPlugins.set(manifest.id, manifest)
        }
        
        this.logger.debug(`加载了 ${installed.length} 个已安装插件`)
      }
    } catch (error) {
      this.logger.debug('加载已安装插件失败', error)
    }
  }
  
  /**
   * 保存已安装插件信息
   */
  private async saveInstalledPlugins(): Promise<void> {
    const fs = await import('fs-extra')
    const path = await import('path')
    
    try {
      const storageDir = path.join(process.cwd(), '.ldesign', 'plugins')
      const manifestFile = path.join(storageDir, 'installed.json')
      
      await fs.ensureDir(storageDir)
      await fs.writeJson(manifestFile, Array.from(this.installedPlugins.values()), { spaces: 2 })
      
      this.logger.debug('保存已安装插件信息成功')
    } catch (error) {
      this.logger.error('保存已安装插件信息失败', error)
    }
  }

  /**
   * 搜索插件
   */
  async search(query: string, options?: {
    category?: string
    tags?: string[]
    limit?: number
    offset?: number
  }): Promise<PluginSearchResult[]> {
    const results: PluginSearchResult[] = []
    const queryLower = query.toLowerCase()

    for (const [id, metadata] of this.plugins) {
      // 匹配搜索条件
      const matchesQuery = !query || 
        id.toLowerCase().includes(queryLower) ||
        metadata.name.toLowerCase().includes(queryLower) ||
        metadata.description.toLowerCase().includes(queryLower) ||
        metadata.keywords.some(k => k.toLowerCase().includes(queryLower))

      const matchesCategory = !options?.category || 
        metadata.category === options.category

      const matchesTags = !options?.tags?.length || 
        options.tags.some(tag => metadata.tags.includes(tag))

      if (matchesQuery && matchesCategory && matchesTags) {
        results.push({
          id,
          name: metadata.name,
          description: metadata.description,
          version: metadata.versions[0].version,
          author: typeof metadata.author === 'string' ? metadata.author : metadata.author.name,
          downloads: metadata.downloads,
          rating: metadata.rating,
          tags: metadata.tags,
          category: metadata.category
        })
      }
    }

    // 排序和分页
    results.sort((a, b) => b.downloads - a.downloads)
    
    const offset = options?.offset || 0
    const limit = options?.limit || 10
    
    return results.slice(offset, offset + limit)
  }

  /**
   * 获取插件详情
   */
  async getPluginDetails(pluginId: string): Promise<PluginMetadata | null> {
    return this.plugins.get(pluginId) || null
  }

  /**
   * 获取插件版本列表
   */
  async getVersions(pluginId: string): Promise<PluginVersion[]> {
    const plugin = this.plugins.get(pluginId)
    return plugin?.versions || []
  }

  /**
   * 检查插件兼容性
   */
  async checkCompatibility(pluginId: string, version?: string): Promise<{
    compatible: boolean
    issues: string[]
  }> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      return { compatible: false, issues: ['Plugin not found'] }
    }

    const issues: string[] = []
    // 使用简单的版本比较
    const satisfies = (version: string, range: string): boolean => {
      // 简化版本检查，实际应使用semver库
      return true // 临时总是返回true
    }
    
    // 检查launcher版本兼容性
    if (plugin.compatibility.launcher) {
      const launcherVersion = '2.0.0' // 从 package.json 读取
      if (!satisfies(launcherVersion, plugin.compatibility.launcher)) {
        issues.push(`需要 @ldesign/launcher ${plugin.compatibility.launcher}，当前版本 ${launcherVersion}`)
      }
    }

    // 检查Node版本兼容性
    if (plugin.compatibility.node) {
      const nodeVersion = process.version
      if (!satisfies(nodeVersion, plugin.compatibility.node)) {
        issues.push(`需要 Node.js ${plugin.compatibility.node}，当前版本 ${nodeVersion}`)
      }
    }
    
    // 检查插件依赖
    const targetVersion = version || plugin.versions[0].version
    const versionInfo = plugin.versions.find(v => v.version === targetVersion)
    
    if (versionInfo && Object.keys(versionInfo.dependencies).length > 0) {
      for (const [depId, depVersion] of Object.entries(versionInfo.dependencies)) {
        const depPlugin = this.plugins.get(depId)
        if (!depPlugin) {
          issues.push(`缺少依赖插件: ${depId}`)
        }
      }
    }

    return {
      compatible: issues.length === 0,
      issues
    }
  }

  /**
   * 注册新插件
   */
  async registerPlugin(metadata: PluginMetadata): Promise<void> {
    this.plugins.set(metadata.id, metadata)
    this.logger.info(`Plugin registered: ${metadata.id}`)
  }

  /**
   * 更新插件状态
   */
  async updatePluginStatus(pluginId: string, status: PluginStatus): Promise<void> {
    const manifest = this.installedPlugins.get(pluginId)
    
    if (!manifest) {
      throw new Error(`插件 ${pluginId} 未安装`)
    }
    
    // 更新状态
    manifest.status = status
    this.installedPlugins.set(pluginId, manifest)
    
    // 保存到本地
    await this.saveInstalledPlugins()
    
    this.logger.info(`插件 ${pluginId} 状态更新为: ${status}`)
  }

  /**
   * 获取已安装插件列表
   */
  async getInstalledPlugins(): Promise<PluginManifest[]> {
    return Array.from(this.installedPlugins.values())
  }

  /**
   * 获取推荐插件
   */
  async getRecommendedPlugins(projectType?: string): Promise<PluginSearchResult[]> {
    // 基于项目类型推荐插件
    const recommendations: string[] = []

    if (projectType === 'react') {
      recommendations.push('@ldesign/plugin-react-optimizer')
    } else if (projectType === 'vue') {
      recommendations.push('@ldesign/plugin-vue3-enhancer')
    }

    // 添加通用推荐
    recommendations.push('@ldesign/plugin-bundle-analyzer')
    recommendations.push('@ldesign/plugin-test-runner')

    const results: PluginSearchResult[] = []
    for (const id of recommendations) {
      const metadata = this.plugins.get(id)
      if (metadata) {
        results.push({
          id,
          name: metadata.name,
          description: metadata.description,
          version: metadata.versions[0].version,
          author: typeof metadata.author === 'string' ? metadata.author : metadata.author.name,
          downloads: metadata.downloads,
          rating: metadata.rating,
          tags: metadata.tags,
          category: metadata.category
        })
      }
    }

    return results
  }

  /**
   * 获取插件统计信息
   */
  async getStatistics(): Promise<{
    totalPlugins: number
    installedPlugins: number
    categories: Record<string, number>
    popularTags: Array<{ tag: string; count: number }>
  }> {
    const categories: Record<string, number> = {}
    const tagCounts: Map<string, number> = new Map()

    for (const metadata of this.plugins.values()) {
      // 统计分类
      categories[metadata.category] = (categories[metadata.category] || 0) + 1

      // 统计标签
      for (const tag of metadata.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      }
    }

    // 获取热门标签
    const popularTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalPlugins: this.plugins.size,
      installedPlugins: this.installedPlugins.size,
      categories,
      popularTags
    }
  }
}

// 导出单例实例
export const pluginRegistry = new PluginRegistry()
