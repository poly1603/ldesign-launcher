/**
 * 部署适配器注册表
 *
 * ## 重构说明
 * 本文件已经过全面重构，解决了以下问题：
 *
 * ### 1. 类型安全
 * - ❌ 旧版：使用 `any` 泛型强制类型转换，丢失类型安全
 * - ✅ 新版：完整的泛型约束，编译时类型检查
 *
 * ### 2. 架构扩展性
 * - ❌ 旧版：硬编码适配器实例化，扩展困难
 * - ✅ 新版：工厂模式 + 懒加载，支持动态插件式扩展
 *
 * ### 3. 错误处理
 * - ❌ 旧版：简单的 try-catch，错误信息不明确
 * - ✅ 新版：自定义错误类型，详细的错误上下文
 *
 * ### 4. 性能优化
 * - ❌ 旧版：启动时实例化所有适配器
 * - ✅ 新版：懒加载 + 缓存，按需实例化
 *
 * ### 5. 功能完整性
 * - ❌ 旧版：缺少配置验证、默认值处理
 * - ✅ 新版：完整的配置验证器、智能平台选择器
 *
 * ## 使用示例
 *
 * ### 基础使用
 * ```typescript
 * // 获取适配器（类型安全）
 * const adapter = getAdapter<NetlifyDeployConfig>('netlify')
 * if (adapter) {
 *   const result = await adapter.deploy(config, callbacks)
 * }
 * ```
 *
 * ### 注册自定义适配器
 * ```typescript
 * // 方式1: 注册工厂（推荐，支持懒加载）
 * registerAdapterFactory('my-platform', () => new MyAdapter())
 *
 * // 方式2: 直接注册实例
 * registerAdapter('my-platform', new MyAdapter(), platformInfo)
 * ```
 *
 * ### 配置验证
 * ```typescript
 * // 验证平台配置
 * const validation = validatePlatformConfig('netlify', config)
 * if (!validation.valid) {
 *   console.error('配置错误:', validation.errors)
 * }
 *
 * // 应用默认值
 * const configWithDefaults = applyConfigDefaults('netlify', config)
 * ```
 *
 * ### 智能平台选择
 * ```typescript
 * // 根据项目特征推荐平台
 * const platforms = recommendPlatform({
 *   isStatic: true,
 *   needsPreview: true,
 *   budget: 'free'
 * })
 *
 * // 自动检测平台（基于环境变量）
 * const platform = autoDetectPlatform()
 *
 * // 根据项目类型选择
 * const platforms = selectPlatformByProjectType('spa')
 * ```
 *
 * ## API 导出
 *
 * ### 适配器管理
 * - `getAdapter(platform)` - 获取适配器实例
 * - `registerAdapter(platform, adapter, platformInfo)` - 注册适配器实例
 * - `registerAdapterFactory(platform, factory)` - 注册适配器工厂（推荐）
 * - `unregisterAdapter(platform)` - 注销适配器
 * - `hasAdapter(platform)` - 检查适配器是否存在
 * - `getRegisteredPlatforms()` - 获取所有已注册平台
 * - `preloadAdapters()` - 预加载所有适配器
 *
 * ### 平台信息
 * - `getPlatformInfo(platform)` - 获取平台信息
 * - `SUPPORTED_PLATFORMS` - 所有支持的平台信息列表
 *
 * ### 配置管理
 * - `validatePlatformConfig(platform, config)` - 验证配置
 * - `applyConfigDefaults(platform, config)` - 应用默认值
 *
 * ### 智能选择
 * - `recommendPlatform(features)` - 推荐平台
 * - `autoDetectPlatform()` - 自动检测平台
 * - `selectPlatformByProjectType(type)` - 按项目类型选择
 *
 * ### 错误处理
 * - `DeployAdapterError` - 自定义错误类
 *
 * @author LDesign Team
 * @since 2.1.0
 * @version 2.0.0 - 全面重构版本
 */

import type {
  DeployPlatform,
  DeployAdapter,
  DeployPlatformInfo,
  DeployConfigField,
  BaseDeployConfig,
  DeployConfig,
  NetlifyDeployConfig,
  VercelDeployConfig,
  CloudflareDeployConfig,
  GitHubPagesDeployConfig,
  SurgeDeployConfig,
  FTPDeployConfig,
  SFTPDeployConfig,
  SSHDeployConfig,
  CustomDeployConfig,
} from '../../types/deploy'

import { NetlifyAdapter } from './NetlifyAdapter'
import { VercelAdapter } from './VercelAdapter'
import { CloudflareAdapter } from './CloudflareAdapter'
import { GitHubPagesAdapter } from './GitHubPagesAdapter'
import { SurgeAdapter } from './SurgeAdapter'
import { FTPAdapter } from './FTPAdapter'
import { SFTPAdapter } from './SFTPAdapter'
import { SSHAdapter } from './SSHAdapter'
import { CustomAdapter } from './CustomAdapter'

/**
 * 适配器注册元数据
 */
interface AdapterMetadata<T extends BaseDeployConfig = BaseDeployConfig> {
  /** 适配器实例 */
  adapter: DeployAdapter<T>
  /** 平台信息 */
  platformInfo: DeployPlatformInfo
  /** 是否已加载 */
  loaded: boolean
  /** 加载错误（如果有） */
  error?: Error
}

/**
 * 适配器工厂函数类型
 */
type AdapterFactory<T extends BaseDeployConfig = BaseDeployConfig> = () => DeployAdapter<T>

/**
 * 部署适配器错误类
 */
export class DeployAdapterError extends Error {
  constructor(
    message: string,
    public readonly platform: DeployPlatform,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'DeployAdapterError'
  }
}

/**
 * 适配器注册表核心类
 */
class DeployAdapterRegistry {
  /** 适配器元数据存储 */
  private readonly adapters = new Map<DeployPlatform, AdapterMetadata>()

  /** 适配器工厂映射 */
  private readonly factories = new Map<DeployPlatform, AdapterFactory>()

  /** 性能优化：平台信息缓存 */
  private platformInfoCache?: DeployPlatformInfo[]

  constructor() {
    this.registerDefaultAdapters()
  }

  /**
   * 注册默认适配器
   */
  private registerDefaultAdapters(): void {
    // 注册工厂函数而非直接实例化，支持懒加载
    this.registerFactory('netlify', () => new NetlifyAdapter())
    this.registerFactory('vercel', () => new VercelAdapter())
    this.registerFactory('cloudflare', () => new CloudflareAdapter())
    this.registerFactory('github-pages', () => new GitHubPagesAdapter())
    this.registerFactory('surge', () => new SurgeAdapter())
    this.registerFactory('ftp', () => new FTPAdapter())
    this.registerFactory('sftp', () => new SFTPAdapter())
    this.registerFactory('ssh', () => new SSHAdapter())
    this.registerFactory('custom', () => new CustomAdapter())
  }

  /**
   * 注册适配器工厂（支持动态扩展）
   */
  registerFactory<T extends BaseDeployConfig>(
    platform: DeployPlatform,
    factory: AdapterFactory<T>,
  ): void {
    this.factories.set(platform, factory as AdapterFactory)
    // 清理缓存
    this.platformInfoCache = undefined
  }

  /**
   * 获取适配器（懒加载 + 类型安全 + 增强错误处理）
   */
  getAdapter<T extends DeployConfig>(
    platform: T['platform'],
  ): DeployAdapter<T> | undefined {
    try {
      // 检查是否已加载
      let metadata = this.adapters.get(platform)

      if (!metadata) {
        // 懒加载适配器
        metadata = this.loadAdapter(platform)
        if (!metadata) {
          console.warn(`[DeployAdapterRegistry] 未找到适配器: ${platform}`)
          return undefined
        }
      }

      // 检查加载错误
      if (metadata.error) {
        console.error(
          `[DeployAdapterRegistry] 适配器加载失败 [${platform}]:`,
          metadata.error.message,
        )
        throw new DeployAdapterError(
          `适配器加载失败: ${metadata.error.message}`,
          platform,
          'ADAPTER_LOAD_ERROR',
          metadata.error,
        )
      }

      return metadata.adapter as DeployAdapter<T>
    }
    catch (error) {
      if (error instanceof DeployAdapterError) {
        throw error
      }

      console.error(`[DeployAdapterRegistry] 获取适配器异常 [${platform}]:`, error)
      throw new DeployAdapterError(
        `获取适配器失败: ${(error as Error).message}`,
        platform,
        'ADAPTER_GET_ERROR',
        error,
      )
    }
  }

  /**
   * 加载适配器（带完善的错误处理）
   */
  private loadAdapter(platform: DeployPlatform): AdapterMetadata | undefined {
    const factory = this.factories.get(platform)
    if (!factory) {
      console.debug(`[DeployAdapterRegistry] 平台未注册: ${platform}`)
      return undefined
    }

    try {
      const adapter = factory()
      const platformInfo = this.getPlatformInfoInternal(platform)

      if (!platformInfo) {
        throw new DeployAdapterError(
          `未找到平台信息`,
          platform,
          'PLATFORM_INFO_NOT_FOUND',
        )
      }

      const metadata: AdapterMetadata = {
        adapter,
        platformInfo,
        loaded: true,
      }

      this.adapters.set(platform, metadata)
      console.debug(`[DeployAdapterRegistry] 适配器加载成功: ${platform}`)
      return metadata
    }
    catch (error) {
      const adapterError = error instanceof DeployAdapterError
        ? error
        : new DeployAdapterError(
          `适配器实例化失败: ${(error as Error).message}`,
          platform,
          'ADAPTER_INSTANTIATION_ERROR',
          error,
        )

      const metadata: AdapterMetadata = {
        adapter: undefined as any,
        platformInfo: undefined as any,
        loaded: false,
        error: adapterError,
      }

      this.adapters.set(platform, metadata)
      console.error(`[DeployAdapterRegistry] 适配器加载失败 [${platform}]:`, adapterError)
      return undefined
    }
  }

  /**
   * 注册完整适配器（直接注册实例）
   */
  register<T extends BaseDeployConfig>(
    platform: DeployPlatform,
    adapter: DeployAdapter<T>,
    platformInfo: DeployPlatformInfo,
  ): void {
    const metadata: AdapterMetadata<T> = {
      adapter,
      platformInfo,
      loaded: true,
    }

    this.adapters.set(platform, metadata as AdapterMetadata)
    // 清理缓存
    this.platformInfoCache = undefined
  }

  /**
   * 取消注册适配器
   */
  unregister(platform: DeployPlatform): boolean {
    const deleted = this.adapters.delete(platform) || this.factories.delete(platform)
    if (deleted) {
      // 清理缓存
      this.platformInfoCache = undefined
    }
    return deleted
  }

  /**
   * 检查适配器是否可用
   */
  hasAdapter(platform: DeployPlatform): boolean {
    return this.factories.has(platform) || this.adapters.has(platform)
  }

  /**
   * 获取所有已注册的平台
   */
  getRegisteredPlatforms(): DeployPlatform[] {
    const platforms = new Set<DeployPlatform>()

    // 合并工厂和已加载的适配器
    this.factories.forEach((_, platform) => platforms.add(platform))
    this.adapters.forEach((_, platform) => platforms.add(platform))

    return Array.from(platforms)
  }

  /**
   * 获取平台信息（内部方法）
   */
  private getPlatformInfoInternal(platform: DeployPlatform): DeployPlatformInfo | undefined {
    return SUPPORTED_PLATFORMS.find(p => p.id === platform)
  }

  /**
   * 获取所有平台信息（带缓存）
   */
  getAllPlatformInfo(): DeployPlatformInfo[] {
    if (!this.platformInfoCache) {
      this.platformInfoCache = SUPPORTED_PLATFORMS.filter(info =>
        this.hasAdapter(info.id),
      )
    }
    return this.platformInfoCache
  }

  /**
   * 预加载所有适配器（可选的性能优化）
   */
  async preloadAll(): Promise<void> {
    const platforms = this.getRegisteredPlatforms()
    await Promise.all(
      platforms.map(platform => this.loadAdapter(platform)),
    )
  }

  /**
   * 清理所有适配器
   */
  clear(): void {
    this.adapters.clear()
    this.factories.clear()
    this.platformInfoCache = undefined
  }
}

/**
 * 全局适配器注册表实例
 */
const registry = new DeployAdapterRegistry()

/**
 * 获取适配器（类型安全版本）
 *
 * @example
 * ```ts
 * const netlifyAdapter = getAdapter<NetlifyDeployConfig>('netlify')
 * const vercelAdapter = getAdapter<VercelDeployConfig>('vercel')
 * ```
 */
export function getAdapter<T extends DeployConfig = DeployConfig>(
  platform: T['platform'],
): DeployAdapter<T> | undefined {
  return registry.getAdapter<T>(platform)
}

/**
 * 注册自定义适配器
 *
 * @example
 * ```ts
 * // 方式1: 注册工厂函数（推荐，支持懒加载）
 * registerAdapterFactory('my-platform', () => new MyAdapter())
 *
 * // 方式2: 直接注册实例
 * const myAdapter = new MyAdapter()
 * registerAdapter('my-platform', myAdapter, platformInfo)
 * ```
 */
export function registerAdapter<T extends BaseDeployConfig>(
  platform: DeployPlatform,
  adapter: DeployAdapter<T>,
  platformInfo?: DeployPlatformInfo,
): void {
  if (platformInfo) {
    registry.register(platform, adapter, platformInfo)
  }
  else {
    // 向后兼容：如果没有提供平台信息，使用工厂注册
    registry.registerFactory(platform, () => adapter)
  }
}

/**
 * 注册适配器工厂（推荐用于插件式扩展）
 */
export function registerAdapterFactory<T extends BaseDeployConfig>(
  platform: DeployPlatform,
  factory: AdapterFactory<T>,
): void {
  registry.registerFactory(platform, factory)
}

/**
 * 取消注册适配器
 */
export function unregisterAdapter(platform: DeployPlatform): boolean {
  return registry.unregister(platform)
}

/**
 * 检查适配器是否可用
 */
export function hasAdapter(platform: DeployPlatform): boolean {
  return registry.hasAdapter(platform)
}

/**
 * 获取所有已注册的平台
 */
export function getRegisteredPlatforms(): DeployPlatform[] {
  return registry.getRegisteredPlatforms()
}

/**
 * 预加载所有适配器（可选的性能优化）
 */
export function preloadAdapters(): Promise<void> {
  return registry.preloadAll()
}

/**
 * 支持的平台信息列表
 */
export const SUPPORTED_PLATFORMS: DeployPlatformInfo[] = [
  {
    id: 'netlify',
    name: 'Netlify',
    icon: '🔷',
    description: '快速部署到 Netlify，支持自动 CI/CD、自定义域名和 Serverless 函数',
    docsUrl: 'https://docs.netlify.com/',
    requiresAuth: true,
    authType: 'token',
    supportsPreview: true,
    supportsCustomDomain: true,
    supportsRollback: true,
    configFields: [
      { name: 'authToken', label: '访问令牌', type: 'password', required: true, placeholder: 'nfp_xxxxx', help: '从 Netlify 用户设置获取', envVar: 'NETLIFY_AUTH_TOKEN' },
      { name: 'siteId', label: '站点 ID', type: 'text', required: false, placeholder: 'your-site-name 或 站点ID', envVar: 'NETLIFY_SITE_ID' },
      { name: 'prod', label: '生产部署', type: 'boolean', required: false, default: false, help: '是否部署到生产环境' },
      { name: 'functionsDir', label: '函数目录', type: 'text', required: false, placeholder: 'netlify/functions' },
    ],
  },
  {
    id: 'vercel',
    name: 'Vercel',
    icon: '▲',
    description: '部署到 Vercel，零配置、自动 HTTPS、边缘网络加速',
    docsUrl: 'https://vercel.com/docs',
    requiresAuth: true,
    authType: 'token',
    supportsPreview: true,
    supportsCustomDomain: true,
    supportsRollback: true,
    configFields: [
      { name: 'token', label: '访问令牌', type: 'password', required: true, placeholder: 'xxxxx', help: '从 Vercel 账户设置获取', envVar: 'VERCEL_TOKEN' },
      { name: 'projectName', label: '项目名称', type: 'text', required: false, placeholder: '项目名称' },
      { name: 'orgId', label: '组织 ID', type: 'text', required: false, placeholder: 'team_xxxxx', envVar: 'VERCEL_ORG_ID' },
      { name: 'prod', label: '生产部署', type: 'boolean', required: false, default: false },
    ],
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Pages',
    icon: '☁️',
    description: '部署到 Cloudflare Pages，全球 CDN、无限带宽、免费 SSL',
    docsUrl: 'https://developers.cloudflare.com/pages/',
    requiresAuth: true,
    authType: 'token',
    supportsPreview: true,
    supportsCustomDomain: true,
    supportsRollback: true,
    configFields: [
      { name: 'apiToken', label: 'API 令牌', type: 'password', required: true, placeholder: 'xxxxx', help: '需要 Cloudflare Pages 编辑权限', envVar: 'CLOUDFLARE_API_TOKEN' },
      { name: 'accountId', label: '账户 ID', type: 'text', required: true, placeholder: 'xxxxx', envVar: 'CLOUDFLARE_ACCOUNT_ID' },
      { name: 'projectName', label: '项目名称', type: 'text', required: true, placeholder: '项目名称' },
      { name: 'branch', label: '分支', type: 'text', required: false, default: 'main', placeholder: 'main' },
    ],
  },
  {
    id: 'github-pages',
    name: 'GitHub Pages',
    icon: '🐙',
    description: '部署到 GitHub Pages，免费托管、与 Git 仓库集成',
    docsUrl: 'https://docs.github.com/pages',
    requiresAuth: true,
    authType: 'token',
    supportsPreview: false,
    supportsCustomDomain: true,
    supportsRollback: false,
    configFields: [
      { name: 'token', label: 'GitHub Token', type: 'password', required: true, placeholder: 'ghp_xxxxx', help: '需要 repo 权限', envVar: 'GITHUB_TOKEN' },
      { name: 'repo', label: '仓库', type: 'text', required: true, placeholder: 'username/repo' },
      { name: 'branch', label: '分支', type: 'text', required: false, default: 'gh-pages', placeholder: 'gh-pages' },
      { name: 'cname', label: '自定义域名', type: 'text', required: false, placeholder: 'example.com' },
      { name: 'nojekyll', label: '禁用 Jekyll', type: 'boolean', required: false, default: true },
    ],
  },
  {
    id: 'surge',
    name: 'Surge',
    icon: '⚡',
    description: '快速部署静态站点到 Surge.sh，简单易用',
    docsUrl: 'https://surge.sh/help/',
    requiresAuth: true,
    authType: 'token',
    supportsPreview: false,
    supportsCustomDomain: true,
    supportsRollback: false,
    configFields: [
      { name: 'token', label: 'Surge Token', type: 'password', required: true, placeholder: 'xxxxx', help: '运行 surge token 获取', envVar: 'SURGE_TOKEN' },
      { name: 'domain', label: '域名', type: 'text', required: true, placeholder: 'your-site.surge.sh' },
    ],
  },
  {
    id: 'ftp',
    name: 'FTP 服务器',
    icon: '📂',
    description: '通过 FTP 上传到自定义服务器',
    requiresAuth: true,
    authType: 'password',
    supportsPreview: false,
    supportsCustomDomain: false,
    supportsRollback: false,
    configFields: [
      { name: 'host', label: '服务器地址', type: 'text', required: true, placeholder: 'ftp.example.com', envVar: 'FTP_HOST' },
      { name: 'port', label: '端口', type: 'number', required: false, default: 21, placeholder: '21' },
      { name: 'username', label: '用户名', type: 'text', required: true, placeholder: '用户名', envVar: 'FTP_USER' },
      { name: 'password', label: '密码', type: 'password', required: true, placeholder: '密码', envVar: 'FTP_PASSWORD' },
      { name: 'remotePath', label: '远程目录', type: 'text', required: true, placeholder: '/public_html' },
      { name: 'secure', label: '使用 TLS', type: 'boolean', required: false, default: false },
      { name: 'cleanRemote', label: '清空远程目录', type: 'boolean', required: false, default: false },
    ],
  },
  {
    id: 'sftp',
    name: 'SFTP 服务器',
    icon: '🔐',
    description: '通过 SFTP 安全上传到服务器',
    requiresAuth: true,
    authType: 'key',
    supportsPreview: false,
    supportsCustomDomain: false,
    supportsRollback: false,
    configFields: [
      { name: 'host', label: '服务器地址', type: 'text', required: true, placeholder: 'ssh.example.com', envVar: 'SFTP_HOST' },
      { name: 'port', label: '端口', type: 'number', required: false, default: 22, placeholder: '22' },
      { name: 'username', label: '用户名', type: 'text', required: true, placeholder: '用户名', envVar: 'SFTP_USER' },
      { name: 'password', label: '密码', type: 'password', required: false, placeholder: '密码（与私钥二选一）', envVar: 'SFTP_PASSWORD' },
      { name: 'privateKey', label: '私钥路径', type: 'file', required: false, placeholder: '~/.ssh/id_rsa', envVar: 'SFTP_KEY' },
      { name: 'passphrase', label: '私钥密码', type: 'password', required: false, placeholder: '私钥密码' },
      { name: 'remotePath', label: '远程目录', type: 'text', required: true, placeholder: '/var/www/html' },
      { name: 'cleanRemote', label: '清空远程目录', type: 'boolean', required: false, default: false },
    ],
  },
  {
    id: 'ssh',
    name: 'SSH/SCP',
    icon: '🖥️',
    description: '通过 SSH/SCP 部署到服务器，支持自定义命令',
    requiresAuth: true,
    authType: 'key',
    supportsPreview: false,
    supportsCustomDomain: false,
    supportsRollback: false,
    configFields: [
      { name: 'host', label: '服务器地址', type: 'text', required: true, placeholder: 'ssh.example.com', envVar: 'SSH_HOST' },
      { name: 'port', label: '端口', type: 'number', required: false, default: 22, placeholder: '22' },
      { name: 'username', label: '用户名', type: 'text', required: true, placeholder: '用户名', envVar: 'SSH_USER' },
      { name: 'password', label: '密码', type: 'password', required: false, placeholder: '密码（与私钥二选一）', envVar: 'SSH_PASSWORD' },
      { name: 'privateKey', label: '私钥路径', type: 'file', required: false, placeholder: '~/.ssh/id_rsa', envVar: 'SSH_KEY' },
      { name: 'passphrase', label: '私钥密码', type: 'password', required: false, placeholder: '私钥密码' },
      { name: 'remotePath', label: '远程目录', type: 'text', required: true, placeholder: '/var/www/html' },
      { name: 'cleanRemote', label: '清空远程目录', type: 'boolean', required: false, default: false },
    ],
  },
  {
    id: 'custom',
    name: '自定义命令',
    icon: '⚙️',
    description: '使用自定义命令部署',
    requiresAuth: false,
    supportsPreview: false,
    supportsCustomDomain: false,
    supportsRollback: false,
    configFields: [
      { name: 'command', label: '部署命令', type: 'text', required: true, placeholder: 'npm run deploy' },
      { name: 'cwd', label: '工作目录', type: 'text', required: false, placeholder: '当前目录' },
    ],
  },
]

/**
 * 配置字段验证器
 */
class ConfigFieldValidator {
  /**
   * 验证单个字段
   */
  static validateField(
    field: DeployConfigField,
    value: unknown,
  ): { valid: boolean, error?: string } {
    // 必填字段检查
    if (field.required && (value === undefined || value === null || value === '')) {
      return {
        valid: false,
        error: `字段 "${field.label}" 为必填项`,
      }
    }

    // 如果字段为空且不是必填，验证通过
    if (value === undefined || value === null || value === '') {
      return { valid: true }
    }

    // 类型验证
    switch (field.type) {
      case 'text':
      case 'password':
      case 'file':
        if (typeof value !== 'string') {
          return { valid: false, error: `字段 "${field.label}" 必须是字符串` }
        }
        break

      case 'number':
        if (typeof value !== 'number' || Number.isNaN(value)) {
          return { valid: false, error: `字段 "${field.label}" 必须是数字` }
        }
        break

      case 'boolean':
        if (typeof value !== 'boolean') {
          return { valid: false, error: `字段 "${field.label}" 必须是布尔值` }
        }
        break

      case 'select':
        if (field.options && !field.options.some(opt => opt.value === value)) {
          return {
            valid: false,
            error: `字段 "${field.label}" 的值不在可选项中`,
          }
        }
        break
    }

    // 正则验证
    if (field.pattern && typeof value === 'string') {
      const regex = new RegExp(field.pattern)
      if (!regex.test(value)) {
        return {
          valid: false,
          error: `字段 "${field.label}" 格式不正确`,
        }
      }
    }

    return { valid: true }
  }

  /**
   * 验证平台配置
   */
  static validatePlatformConfig(
    platformInfo: DeployPlatformInfo,
    config: Record<string, unknown>,
  ): { valid: boolean, errors: string[] } {
    const errors: string[] = []

    for (const field of platformInfo.configFields) {
      const value = config[field.name] ?? process.env[field.envVar || '']
      const result = this.validateField(field, value)

      if (!result.valid && result.error) {
        errors.push(result.error)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * 应用默认值
   */
  static applyDefaults<T extends Record<string, any>>(
    platformInfo: DeployPlatformInfo,
    config: T,
  ): T {
    const result: Record<string, any> = { ...config }

    for (const field of platformInfo.configFields) {
      if (result[field.name] === undefined && field.default !== undefined) {
        result[field.name] = field.default
      }

      // 尝试从环境变量获取
      if (result[field.name] === undefined && field.envVar) {
        const envValue = process.env[field.envVar]
        if (envValue !== undefined) {
          // 类型转换
          result[field.name] = this.parseEnvValue(envValue, field.type)
        }
      }
    }

    return result as T
  }

  /**
   * 解析环境变量值
   */
  private static parseEnvValue(value: string, type: DeployConfigField['type']): unknown {
    switch (type) {
      case 'number':
        return Number.parseInt(value, 10)
      case 'boolean':
        return value === 'true' || value === '1'
      default:
        return value
    }
  }
}

/**
 * 获取平台信息
 */
export function getPlatformInfo(platform: DeployPlatform): DeployPlatformInfo | undefined {
  return SUPPORTED_PLATFORMS.find((p) => p.id === platform)
}

/**
 * 验证平台配置
 */
export function validatePlatformConfig(
  platform: DeployPlatform,
  config: Record<string, unknown>,
): { valid: boolean, errors: string[] } {
  const platformInfo = getPlatformInfo(platform)
  if (!platformInfo) {
    return {
      valid: false,
      errors: [`未知的平台: ${platform}`],
    }
  }

  return ConfigFieldValidator.validatePlatformConfig(platformInfo, config)
}

/**
 * 应用配置默认值
 */
export function applyConfigDefaults<T extends DeployConfig>(
  platform: DeployPlatform,
  config: T,
): T {
  const platformInfo = getPlatformInfo(platform)
  if (!platformInfo) {
    return config
  }

  return ConfigFieldValidator.applyDefaults(platformInfo, config as any) as T
}

/**
 * 适配器智能选择器
 */
class AdapterSelector {
  /**
   * 根据项目特征推荐最佳平台
   */
  static recommendPlatform(
    features: {
      hasServerless?: boolean
      hasSSR?: boolean
      isStatic?: boolean
      requiresCustomDomain?: boolean
      needsPreview?: boolean
      budget?: 'free' | 'paid'
    },
  ): DeployPlatform[] {
    const recommendations: DeployPlatform[] = []

    // 静态站点
    if (features.isStatic) {
      if (features.budget === 'free') {
        recommendations.push('github-pages', 'netlify', 'cloudflare')
      }
      else {
        recommendations.push('netlify', 'vercel', 'cloudflare')
      }
    }

    // Serverless 功能
    if (features.hasServerless) {
      recommendations.push('netlify', 'vercel', 'cloudflare')
    }

    // SSR 支持
    if (features.hasSSR) {
      recommendations.push('vercel', 'netlify')
    }

    // 自定义服务器
    if (!features.isStatic && !features.hasServerless) {
      recommendations.push('ssh', 'sftp', 'ftp')
    }

    // 去重并保持顺序
    return Array.from(new Set(recommendations))
  }

  /**
   * 根据环境变量自动选择平台
   */
  static autoDetectPlatform(): DeployPlatform | undefined {
    // 检查环境变量
    if (process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY) {
      return 'netlify'
    }
    if (process.env.VERCEL_TOKEN || process.env.VERCEL) {
      return 'vercel'
    }
    if (process.env.CLOUDFLARE_API_TOKEN) {
      return 'cloudflare'
    }
    if (process.env.GITHUB_TOKEN) {
      return 'github-pages'
    }
    if (process.env.FTP_HOST) {
      return 'ftp'
    }
    if (process.env.SFTP_HOST || process.env.SSH_HOST) {
      return 'sftp'
    }

    return undefined
  }

  /**
   * 根据项目类型选择平台
   */
  static selectByProjectType(
    projectType: 'static' | 'spa' | 'ssr' | 'ssg' | 'jamstack',
  ): DeployPlatform[] {
    switch (projectType) {
      case 'static':
        return ['surge', 'github-pages', 'netlify', 'cloudflare']

      case 'spa':
        return ['netlify', 'vercel', 'cloudflare', 'github-pages']

      case 'ssr':
        return ['vercel', 'netlify']

      case 'ssg':
      case 'jamstack':
        return ['netlify', 'vercel', 'cloudflare']

      default:
        return registry.getRegisteredPlatforms()
    }
  }
}

/**
 * 推荐部署平台
 */
export function recommendPlatform(
  features: Parameters<typeof AdapterSelector.recommendPlatform>[0],
): DeployPlatform[] {
  return AdapterSelector.recommendPlatform(features)
}

/**
 * 自动检测部署平台
 */
export function autoDetectPlatform(): DeployPlatform | undefined {
  return AdapterSelector.autoDetectPlatform()
}

/**
 * 根据项目类型选择平台
 */
export function selectPlatformByProjectType(
  projectType: Parameters<typeof AdapterSelector.selectByProjectType>[0],
): DeployPlatform[] {
  return AdapterSelector.selectByProjectType(projectType)
}

// ============================================================================
// 适配器导出
// ============================================================================

/**
 * 导出所有具体适配器实现
 * 支持直接引用适配器类进行自定义扩展
 */
export { NetlifyAdapter } from './NetlifyAdapter'
export { VercelAdapter } from './VercelAdapter'
export { CloudflareAdapter } from './CloudflareAdapter'
export { GitHubPagesAdapter } from './GitHubPagesAdapter'
export { SurgeAdapter } from './SurgeAdapter'
export { FTPAdapter } from './FTPAdapter'
export { SFTPAdapter } from './SFTPAdapter'
export { SSHAdapter } from './SSHAdapter'
export { CustomAdapter } from './CustomAdapter'
export { BaseAdapter } from './BaseAdapter'

/**
 * 导出核心类型
 * 便于第三方开发者扩展
 */
export type {
  AdapterMetadata,
  AdapterFactory,
}

/**
 * 默认导出：注册表实例
 * 高级用户可以直接访问注册表进行更细粒度的控制
 */
export { registry }
