/**
 * 插件管理器
 * 
 * 负责插件的安装、更新、卸载和依赖管理
 * 
 * @author LDesign Team
 * @since 1.0.0
 */

import * as fs from 'fs-extra'
import * as path from 'path'
import { execSync } from 'child_process'
import { Logger } from '../utils/logger'
import { pluginRegistry, PluginStatus, type PluginMetadata } from './registry'
import type { PluginManifest } from '../types'

/**
 * 插件安装选项
 */
export interface InstallOptions {
  /** 版本 */
  version?: string
  /** 强制安装 */
  force?: boolean
  /** 开发依赖 */
  dev?: boolean
  /** 全局安装 */
  global?: boolean
  /** 跳过依赖 */
  skipDeps?: boolean
}

/**
 * 插件操作结果
 */
export interface PluginOperationResult {
  /** 是否成功 */
  success: boolean
  /** 消息 */
  message: string
  /** 错误信息 */
  error?: string
  /** 插件信息 */
  plugin?: PluginManifest
}

/**
 * 插件管理器类
 */
export class PluginManager {
  private logger: Logger
  private pluginsDir: string
  private cacheDir: string
  private configFile: string
  private installedPlugins: Map<string, PluginManifest>

  constructor(baseDir?: string) {
    this.logger = new Logger('plugin-manager')
    const base = baseDir || process.cwd()
    this.pluginsDir = path.join(base, 'node_modules', '.ldesign', 'plugins')
    this.cacheDir = path.join(base, 'node_modules', '.ldesign', 'cache')
    this.configFile = path.join(base, '.ldesign', 'plugins.json')
    this.installedPlugins = new Map()

    // 异步初始化，不阻塞构造函数
    this.initialize().catch(error => {
      this.logger.error('插件管理器初始化失败', error)
    })
  }

  /**
   * 初始化插件管理器
   */
  private async initialize(): Promise<void> {
    try {
      // 创建必要的目录
      await fs.ensureDir(this.pluginsDir)
      await fs.ensureDir(this.cacheDir)
      await fs.ensureDir(path.dirname(this.configFile))

      // 加载已安装插件配置
      await this.loadInstalledPlugins()
    } catch (error) {
      this.logger.error('插件管理器初始化失败', error)
    }
  }

  /**
   * 加载已安装插件
   */
  private async loadInstalledPlugins(): Promise<void> {
    try {
      if (await fs.pathExists(this.configFile)) {
        const config = await fs.readJson(this.configFile)
        for (const [id, manifest] of Object.entries(config.plugins || {})) {
          this.installedPlugins.set(id, manifest as PluginManifest)
        }
      }
    } catch (error) {
      this.logger.error('Failed to load installed plugins:', error)
    }
  }

  /**
   * 保存已安装插件配置
   */
  private async saveInstalledPlugins(): Promise<void> {
    const config = {
      version: '1.0.0',
      plugins: Object.fromEntries(this.installedPlugins.entries()),
      updatedAt: new Date().toISOString()
    }

    await fs.writeJson(this.configFile, config, { spaces: 2 })
  }

  /**
   * 安装插件
   */
  async install(pluginId: string, options: InstallOptions = {}): Promise<PluginOperationResult> {
    try {
      this.logger.info(`Installing plugin: ${pluginId}`)

      // 检查插件是否存在
      const metadata = await pluginRegistry.getPluginDetails(pluginId)
      if (!metadata) {
        return {
          success: false,
          message: `Plugin not found: ${pluginId}`,
          error: 'PLUGIN_NOT_FOUND'
        }
      }

      // 检查是否已安装
      if (!options.force && this.installedPlugins.has(pluginId)) {
        return {
          success: false,
          message: `Plugin already installed: ${pluginId}`,
          error: 'ALREADY_INSTALLED'
        }
      }

      // 检查兼容性
      const compatibility = await pluginRegistry.checkCompatibility(pluginId, options.version)
      if (!compatibility.compatible) {
        return {
          success: false,
          message: `Plugin incompatible: ${compatibility.issues.join(', ')}`,
          error: 'INCOMPATIBLE'
        }
      }

      // 解析依赖
      const dependencies = await this.resolveDependencies(metadata, options.version)

      // 安装依赖
      if (!options.skipDeps && dependencies.length > 0) {
        this.logger.info('Installing dependencies...')
        for (const dep of dependencies) {
          await this.installDependency(dep)
        }
      }

      // 下载插件包
      const pluginPath = await this.downloadPlugin(metadata, options.version)

      // 创建插件清单
      const manifest: PluginManifest = {
        id: pluginId,
        name: metadata.name,
        version: options.version || metadata.versions[0].version,
        description: metadata.description,
        main: path.join(pluginPath, 'index.js'),
        config: {},
        enabled: true,
        installedAt: new Date().toISOString()
      }

      // 保存插件信息
      this.installedPlugins.set(pluginId, manifest)
      await this.saveInstalledPlugins()

      // 更新注册表状态
      await pluginRegistry.updatePluginStatus(pluginId, PluginStatus.INSTALLED)

      this.logger.success(`Plugin installed successfully: ${pluginId}`)

      return {
        success: true,
        message: `Plugin ${pluginId} installed successfully`,
        plugin: manifest
      }
    } catch (error) {
      this.logger.error(`Failed to install plugin ${pluginId}:`, error)
      return {
        success: false,
        message: `Failed to install plugin: ${error}`,
        error: 'INSTALL_FAILED'
      }
    }
  }

  /**
   * 卸载插件
   */
  async uninstall(pluginId: string, options: { force?: boolean } = {}): Promise<PluginOperationResult> {
    try {
      this.logger.info(`Uninstalling plugin: ${pluginId}`)

      // 检查是否已安装
      if (!this.installedPlugins.has(pluginId)) {
        return {
          success: false,
          message: `Plugin not installed: ${pluginId}`,
          error: 'NOT_INSTALLED'
        }
      }

      // 检查依赖关系
      if (!options.force) {
        const dependents = await this.checkDependents(pluginId)
        if (dependents.length > 0) {
          return {
            success: false,
            message: `Plugin has dependents: ${dependents.join(', ')}`,
            error: 'HAS_DEPENDENTS'
          }
        }
      }

      // 删除插件文件
      const pluginPath = path.join(this.pluginsDir, pluginId.replace(/\//g, '-'))
      if (await fs.pathExists(pluginPath)) {
        await fs.remove(pluginPath)
      }

      // 更新配置
      this.installedPlugins.delete(pluginId)
      await this.saveInstalledPlugins()

      // 更新注册表状态
      await pluginRegistry.updatePluginStatus(pluginId, PluginStatus.AVAILABLE)

      this.logger.success(`Plugin uninstalled successfully: ${pluginId}`)

      return {
        success: true,
        message: `Plugin ${pluginId} uninstalled successfully`
      }
    } catch (error) {
      this.logger.error(`Failed to uninstall plugin ${pluginId}:`, error)
      return {
        success: false,
        message: `Failed to uninstall plugin: ${error}`,
        error: 'UNINSTALL_FAILED'
      }
    }
  }

  /**
   * 更新插件
   */
  async update(pluginId: string, options: { version?: string } = {}): Promise<PluginOperationResult> {
    try {
      this.logger.info(`Updating plugin: ${pluginId}`)

      // 检查是否已安装
      const installed = this.installedPlugins.get(pluginId)
      if (!installed) {
        return {
          success: false,
          message: `Plugin not installed: ${pluginId}`,
          error: 'NOT_INSTALLED'
        }
      }

      // 获取最新版本
      const metadata = await pluginRegistry.getPluginDetails(pluginId)
      if (!metadata) {
        return {
          success: false,
          message: `Plugin not found in registry: ${pluginId}`,
          error: 'NOT_FOUND'
        }
      }

      const targetVersion = options.version || metadata.versions[0].version

      // 检查是否需要更新
      if (installed.version === targetVersion) {
        return {
          success: false,
          message: `Plugin already at version ${targetVersion}`,
          error: 'ALREADY_UP_TO_DATE'
        }
      }

      // 更新插件状态
      await pluginRegistry.updatePluginStatus(pluginId, PluginStatus.UPDATING)

      // 备份当前版本
      await this.backupPlugin(pluginId)

      // 卸载旧版本
      await this.uninstall(pluginId, { force: true })

      // 安装新版本
      const result = await this.install(pluginId, { version: targetVersion, force: true })

      if (!result.success) {
        // 恢复备份
        await this.restorePlugin(pluginId)
      }

      return result
    } catch (error) {
      this.logger.error(`Failed to update plugin ${pluginId}:`, error)
      return {
        success: false,
        message: `Failed to update plugin: ${error}`,
        error: 'UPDATE_FAILED'
      }
    }
  }

  /**
   * 启用插件
   */
  async enable(pluginId: string): Promise<PluginOperationResult> {
    const plugin = this.installedPlugins.get(pluginId)
    if (!plugin) {
      return {
        success: false,
        message: `Plugin not installed: ${pluginId}`,
        error: 'NOT_INSTALLED'
      }
    }

    plugin.enabled = true
    this.installedPlugins.set(pluginId, plugin)
    await this.saveInstalledPlugins()
    await pluginRegistry.updatePluginStatus(pluginId, PluginStatus.ENABLED)

    return {
      success: true,
      message: `Plugin ${pluginId} enabled`,
      plugin
    }
  }

  /**
   * 禁用插件
   */
  async disable(pluginId: string): Promise<PluginOperationResult> {
    const plugin = this.installedPlugins.get(pluginId)
    if (!plugin) {
      return {
        success: false,
        message: `Plugin not installed: ${pluginId}`,
        error: 'NOT_INSTALLED'
      }
    }

    plugin.enabled = false
    this.installedPlugins.set(pluginId, plugin)
    await this.saveInstalledPlugins()
    await pluginRegistry.updatePluginStatus(pluginId, PluginStatus.DISABLED)

    return {
      success: true,
      message: `Plugin ${pluginId} disabled`,
      plugin
    }
  }

  /**
   * 获取已安装插件列表
   */
  async list(): Promise<PluginManifest[]> {
    return Array.from(this.installedPlugins.values())
  }

  /**
   * 获取插件信息
   */
  async info(pluginId: string): Promise<PluginManifest | null> {
    return this.installedPlugins.get(pluginId) || null
  }

  /**
   * 解析依赖
   */
  private async resolveDependencies(metadata: PluginMetadata, version?: string): Promise<string[]> {
    const dependencies: string[] = []
    const targetVersion = metadata.versions.find(v => v.version === version) || metadata.versions[0]

    if (targetVersion.dependencies) {
      for (const [dep, ver] of Object.entries(targetVersion.dependencies)) {
        dependencies.push(`${dep}@${ver}`)
      }
    }

    return dependencies
  }

  /**
   * 安装依赖
   */
  private async installDependency(dependency: string): Promise<void> {
    try {
      this.logger.debug(`Installing dependency: ${dependency}`)
      execSync(`npm install ${dependency}`, {
        cwd: process.cwd(),
        stdio: 'inherit'
      })
    } catch (error) {
      this.logger.error(`Failed to install dependency ${dependency}:`, error)
      throw error
    }
  }

  /**
   * 下载插件
   */
  private async downloadPlugin(metadata: PluginMetadata, version?: string): Promise<string> {
    const pluginDir = path.join(this.pluginsDir, metadata.id.replace(/\//g, '-'))
    await fs.ensureDir(pluginDir)

    // 模拟下载插件包
    // 实际应该从npm或其他源下载
    const packageJson = {
      name: metadata.id,
      version: version || metadata.versions[0].version,
      description: metadata.description,
      main: 'index.js',
      author: metadata.author,
      license: metadata.license
    }

    await fs.writeJson(path.join(pluginDir, 'package.json'), packageJson, { spaces: 2 })

    // 创建插件主文件
    const indexContent = this.generatePluginStub(metadata)
    await fs.writeFile(path.join(pluginDir, 'index.js'), indexContent)

    return pluginDir
  }

  /**
   * 生成插件存根代码
   */
  private generatePluginStub(metadata: PluginMetadata): string {
    return `/**
 * ${metadata.name}
 * ${metadata.description}
 */

module.exports = {
  name: '${metadata.id}',
  version: '${metadata.versions[0].version}',
  
  async install(context) {
    console.log('Installing ${metadata.name}...')
    // Plugin installation logic
  },

  async activate(context) {
    console.log('Activating ${metadata.name}...')
    // Plugin activation logic
  },

  async deactivate(context) {
    console.log('Deactivating ${metadata.name}...')
    // Plugin deactivation logic
  },

  async uninstall(context) {
    console.log('Uninstalling ${metadata.name}...')
    // Plugin uninstallation logic
  }
}
`
  }

  /**
   * 检查依赖者
   */
  private async checkDependents(pluginId: string): Promise<string[]> {
    const dependents: string[] = []

    // 检查其他插件是否依赖此插件
    for (const [id, manifest] of this.installedPlugins) {
      const manifestAny = manifest as any
      if (id !== pluginId && manifestAny.dependencies) {
        // 检查这个插件的依赖列表中是否包含目标插件
        if (Object.keys(manifestAny.dependencies).includes(pluginId)) {
          dependents.push(id)
        }
      }
    }

    return dependents
  }

  /**
   * 备份插件
   */
  private async backupPlugin(pluginId: string): Promise<void> {
    const pluginPath = path.join(this.pluginsDir, pluginId.replace(/\//g, '-'))
    const backupPath = path.join(this.cacheDir, `${pluginId.replace(/\//g, '-')}.backup`)

    if (await fs.pathExists(pluginPath)) {
      await fs.copy(pluginPath, backupPath)
    }
  }

  /**
   * 恢复插件
   */
  private async restorePlugin(pluginId: string): Promise<void> {
    const backupPath = path.join(this.cacheDir, `${pluginId.replace(/\//g, '-')}.backup`)
    const pluginPath = path.join(this.pluginsDir, pluginId.replace(/\//g, '-'))

    if (await fs.pathExists(backupPath)) {
      await fs.copy(backupPath, pluginPath)
      await fs.remove(backupPath)
    }
  }

  /**
   * 清理缓存
   */
  async clearCache(): Promise<void> {
    await fs.emptyDir(this.cacheDir)
    this.logger.info('Plugin cache cleared')
  }

  /**
   * 验证插件
   */
  async verify(pluginId: string): Promise<{
    valid: boolean
    issues: string[]
  }> {
    const issues: string[] = []
    const plugin = this.installedPlugins.get(pluginId)

    if (!plugin) {
      issues.push('Plugin not installed')
      return { valid: false, issues }
    }

    // 检查插件文件是否存在
    const pluginPath = path.join(this.pluginsDir, pluginId.replace(/\//g, '-'))
    if (!await fs.pathExists(pluginPath)) {
      issues.push('Plugin files missing')
    }

    // 检查主文件
    if (!await fs.pathExists(plugin.main)) {
      issues.push('Main file not found')
    }

    // 检查依赖
    const pluginAny = plugin as any
    if (pluginAny.dependencies) {
      for (const [depName, depVersion] of Object.entries(pluginAny.dependencies)) {
        const depPlugin = this.installedPlugins.get(depName)

        if (!depPlugin) {
          issues.push(`缺少依赖: ${depName}@${depVersion as string}`)
        } else {
          // 验证依赖版本
          if (!this.isVersionSatisfied(depPlugin.version, depVersion as string)) {
            issues.push(
              `依赖版本不匹配: ${depName} (需要 ${depVersion}, 当前 ${depPlugin.version})`
            )
          }
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues
    }
  }

  /**
   * 检查版本是否满足要求
   * @param installedVersion 已安装的版本
   * @param requiredVersion 需要的版本（支持 semver 范围）
   */
  private isVersionSatisfied(installedVersion: string, requiredVersion: string): boolean {
    try {
      // 移除 'v' 前缀
      const installed = installedVersion.replace(/^v/, '')
      const required = requiredVersion.replace(/^v/, '')

      // 处理不同的版本范围格式
      if (required.startsWith('>=')) {
        const minVersion = required.substring(2).trim()
        return this.compareVersions(installed, minVersion) >= 0
      }

      if (required.startsWith('^')) {
        // 兼容主版本号
        const baseVersion = required.substring(1).trim()
        const [instMajor] = installed.split('.')
        const [reqMajor] = baseVersion.split('.')
        return instMajor === reqMajor && this.compareVersions(installed, baseVersion) >= 0
      }

      if (required.startsWith('~')) {
        // 兼容次版本号
        const baseVersion = required.substring(1).trim()
        const [instMajor, instMinor] = installed.split('.')
        const [reqMajor, reqMinor] = baseVersion.split('.')
        return instMajor === reqMajor && instMinor === reqMinor
      }

      if (required.includes('||')) {
        // 支持多个版本范围
        const ranges = required.split('||').map(r => r.trim())
        return ranges.some(range => this.isVersionSatisfied(installedVersion, range))
      }

      // 精确版本匹配
      return installed === required
    } catch {
      return false
    }
  }

  /**
   * 比较两个版本号
   * @returns -1: v1 < v2, 0: v1 === v2, 1: v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number)
    const parts2 = v2.split('.').map(Number)

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0
      const p2 = parts2[i] || 0

      if (p1 > p2) return 1
      if (p1 < p2) return -1
    }

    return 0
  }
}

// 导出单例实例
export const pluginManager = new PluginManager()
