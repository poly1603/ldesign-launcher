/**
 * 部署功能类型定义
 *
 * 支持多种部署目标：
 * - 云平台：Netlify, Vercel, Cloudflare Pages, GitHub Pages, Surge
 * - 自定义服务器：FTP, SFTP, SSH/SCP
 *
 * @author LDesign Team
 * @since 2.1.0
 */

/**
 * 支持的部署平台
 */
export type DeployPlatform =
  | 'netlify'
  | 'vercel'
  | 'cloudflare'
  | 'github-pages'
  | 'surge'
  | 'ftp'
  | 'sftp'
  | 'ssh'
  | 'custom'

/**
 * 部署状态
 */
export type DeployStatus =
  | 'idle'
  | 'preparing'
  | 'building'
  | 'uploading'
  | 'processing'
  | 'success'
  | 'failed'
  | 'cancelled'

/**
 * 部署阶段
 */
export type DeployPhase =
  | 'init'
  | 'validate'
  | 'build'
  | 'prepare'
  | 'upload'
  | 'process'
  | 'verify'
  | 'complete'

/**
 * 部署进度信息
 */
export interface DeployProgress {
  /** 当前阶段 */
  phase: DeployPhase
  /** 总进度 (0-100) */
  progress: number
  /** 当前阶段进度 (0-100) */
  phaseProgress: number
  /** 阶段描述 */
  message: string
  /** 预计剩余时间（秒） */
  estimatedTimeRemaining?: number
  /** 已传输文件数 */
  filesUploaded?: number
  /** 总文件数 */
  totalFiles?: number
  /** 已传输大小（字节） */
  bytesUploaded?: number
  /** 总大小（字节） */
  totalBytes?: number
}

/**
 * 部署结果
 */
export interface DeployResult {
  /** 是否成功 */
  success: boolean
  /** 部署 URL */
  url?: string
  /** 预览 URL（如果有） */
  previewUrl?: string
  /** 部署 ID */
  deployId?: string
  /** 错误信息 */
  error?: string
  /** 错误详情 */
  errorDetails?: string
  /** 部署用时（毫秒） */
  duration?: number
  /** 部署时间 */
  timestamp: number
  /** 平台特定信息 */
  platformInfo?: Record<string, unknown>
}

/**
 * 基础部署配置
 */
export interface BaseDeployConfig {
  /** 部署平台 */
  platform: DeployPlatform
  /** 构建输出目录 */
  distDir?: string
  /** 部署前是否构建 */
  buildBeforeDeploy?: boolean
  /** 部署环境（production, preview, development） */
  environment?: 'production' | 'preview' | 'development'
  /** 部署超时（毫秒） */
  timeout?: number
  /** 重试次数 */
  retries?: number
  /** 是否打开部署后的 URL */
  openAfterDeploy?: boolean
  /** 部署完成后执行的钩子 */
  afterDeploy?: (result: DeployResult) => void | Promise<void>
}

/**
 * Netlify 部署配置
 */
export interface NetlifyDeployConfig extends BaseDeployConfig {
  platform: 'netlify'
  /** Netlify 访问令牌 */
  authToken?: string
  /** 站点 ID 或名称 */
  siteId?: string
  /** 是否生产部署 */
  prod?: boolean
  /** 自定义域名 */
  alias?: string
  /** 函数目录 */
  functionsDir?: string
  /** 重定向规则 */
  redirects?: Array<{
    from: string
    to: string
    status?: number
  }>
}

/**
 * Vercel 部署配置
 */
export interface VercelDeployConfig extends BaseDeployConfig {
  platform: 'vercel'
  /** Vercel 访问令牌 */
  token?: string
  /** 项目名称 */
  projectName?: string
  /** 组织/团队 ID */
  orgId?: string
  /** 是否生产部署 */
  prod?: boolean
  /** 环境变量 */
  env?: Record<string, string>
  /** 构建环境变量 */
  buildEnv?: Record<string, string>
}

/**
 * Cloudflare Pages 部署配置
 */
export interface CloudflareDeployConfig extends BaseDeployConfig {
  platform: 'cloudflare'
  /** Cloudflare API 令牌 */
  apiToken?: string
  /** 账户 ID */
  accountId?: string
  /** 项目名称 */
  projectName?: string
  /** 分支名称 */
  branch?: string
  /** 提交信息 */
  commitMessage?: string
}

/**
 * GitHub Pages 部署配置
 */
export interface GitHubPagesDeployConfig extends BaseDeployConfig {
  platform: 'github-pages'
  /** GitHub 令牌 */
  token?: string
  /** 仓库（格式: owner/repo） */
  repo?: string
  /** 分支名称 */
  branch?: string
  /** 自定义域名 */
  cname?: string
  /** 是否添加 .nojekyll 文件 */
  nojekyll?: boolean
  /** 提交信息 */
  commitMessage?: string
}

/**
 * Surge 部署配置
 */
export interface SurgeDeployConfig extends BaseDeployConfig {
  platform: 'surge'
  /** Surge 令牌 */
  token?: string
  /** 域名 */
  domain?: string
}

/**
 * FTP 部署配置
 */
export interface FTPDeployConfig extends BaseDeployConfig {
  platform: 'ftp'
  /** FTP 主机 */
  host: string
  /** FTP 端口 */
  port?: number
  /** 用户名 */
  username: string
  /** 密码 */
  password: string
  /** 远程目录 */
  remotePath: string
  /** 是否使用被动模式 */
  passive?: boolean
  /** 是否使用 TLS */
  secure?: boolean | 'implicit'
  /** 清空远程目录 */
  cleanRemote?: boolean
  /** 排除的文件模式 */
  exclude?: string[]
  /** 包含的文件模式 */
  include?: string[]
}

/**
 * SFTP 部署配置
 */
export interface SFTPDeployConfig extends BaseDeployConfig {
  platform: 'sftp'
  /** SFTP 主机 */
  host: string
  /** SFTP 端口 */
  port?: number
  /** 用户名 */
  username: string
  /** 密码（与 privateKey 二选一） */
  password?: string
  /** 私钥路径（与 password 二选一） */
  privateKey?: string
  /** 私钥密码 */
  passphrase?: string
  /** 远程目录 */
  remotePath: string
  /** 清空远程目录 */
  cleanRemote?: boolean
  /** 排除的文件模式 */
  exclude?: string[]
  /** 包含的文件模式 */
  include?: string[]
}

/**
 * SSH/SCP 部署配置
 */
export interface SSHDeployConfig extends BaseDeployConfig {
  platform: 'ssh'
  /** SSH 主机 */
  host: string
  /** SSH 端口 */
  port?: number
  /** 用户名 */
  username: string
  /** 密码（与 privateKey 二选一） */
  password?: string
  /** 私钥路径（与 password 二选一） */
  privateKey?: string
  /** 私钥密码 */
  passphrase?: string
  /** 远程目录 */
  remotePath: string
  /** 部署前执行的命令 */
  preCommands?: string[]
  /** 部署后执行的命令 */
  postCommands?: string[]
  /** 清空远程目录 */
  cleanRemote?: boolean
  /** 排除的文件模式 */
  exclude?: string[]
}

/**
 * 自定义部署配置
 */
export interface CustomDeployConfig extends BaseDeployConfig {
  platform: 'custom'
  /** 自定义部署命令 */
  command: string
  /** 命令参数 */
  args?: string[]
  /** 环境变量 */
  env?: Record<string, string>
  /** 工作目录 */
  cwd?: string
}

/**
 * 所有部署配置类型
 */
export type DeployConfig =
  | NetlifyDeployConfig
  | VercelDeployConfig
  | CloudflareDeployConfig
  | GitHubPagesDeployConfig
  | SurgeDeployConfig
  | FTPDeployConfig
  | SFTPDeployConfig
  | SSHDeployConfig
  | CustomDeployConfig

/**
 * 部署日志级别
 */
export type DeployLogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug'

/**
 * 部署日志条目
 */
export interface DeployLogEntry {
  /** 时间戳 */
  timestamp: number
  /** 日志级别 */
  level: DeployLogLevel
  /** 日志消息 */
  message: string
  /** 阶段 */
  phase?: DeployPhase
  /** 附加数据 */
  data?: unknown
}

/**
 * 部署历史记录
 */
export interface DeployHistoryEntry {
  /** 记录 ID */
  id: string
  /** 部署平台 */
  platform: DeployPlatform
  /** 部署状态 */
  status: DeployStatus
  /** 部署结果 */
  result?: DeployResult
  /** 部署配置（敏感信息已脱敏） */
  config: Partial<BaseDeployConfig>
  /** 开始时间 */
  startTime: number
  /** 结束时间 */
  endTime?: number
  /** 日志 */
  logs: DeployLogEntry[]
}

/**
 * 部署适配器接口
 */
export interface DeployAdapter<T extends BaseDeployConfig = BaseDeployConfig> {
  /** 适配器名称 */
  name: string
  /** 平台标识 */
  platform: DeployPlatform
  /** 平台显示名称 */
  displayName: string
  /** 平台图标 */
  icon: string
  /** 平台描述 */
  description: string
  /** 是否需要构建 */
  requiresBuild: boolean

  /**
   * 验证配置
   */
  validateConfig(config: T): Promise<{ valid: boolean; errors: string[] }>

  /**
   * 执行部署
   */
  deploy(
    config: T,
    callbacks: DeployCallbacks
  ): Promise<DeployResult>

  /**
   * 取消部署
   */
  cancel?(): Promise<void>

  /**
   * 获取部署状态
   */
  getStatus?(deployId: string): Promise<DeployStatus>

  /**
   * 获取部署日志
   */
  getLogs?(deployId: string): Promise<DeployLogEntry[]>

  /**
   * 回滚部署
   */
  rollback?(deployId: string): Promise<DeployResult>
}

/**
 * 部署回调函数
 */
export interface DeployCallbacks {
  /** 进度更新 */
  onProgress: (progress: DeployProgress) => void
  /** 日志输出 */
  onLog: (entry: DeployLogEntry) => void
  /** 状态变化 */
  onStatusChange: (status: DeployStatus) => void
}

/**
 * 部署服务配置
 */
export interface DeployServiceConfig {
  /** 项目根目录 */
  cwd: string
  /** 默认构建目录 */
  defaultDistDir?: string
  /** 部署历史存储路径 */
  historyPath?: string
  /** 最大历史记录数 */
  maxHistoryEntries?: number
  /** 是否启用日志 */
  enableLogs?: boolean
  /** 日志级别 */
  logLevel?: DeployLogLevel
}

/**
 * 部署平台信息
 */
export interface DeployPlatformInfo {
  /** 平台标识 */
  id: DeployPlatform
  /** 显示名称 */
  name: string
  /** 图标 */
  icon: string
  /** 描述 */
  description: string
  /** 文档链接 */
  docsUrl?: string
  /** 是否需要认证 */
  requiresAuth: boolean
  /** 认证方式 */
  authType?: 'token' | 'password' | 'key' | 'oauth'
  /** 是否支持预览部署 */
  supportsPreview: boolean
  /** 是否支持自定义域名 */
  supportsCustomDomain: boolean
  /** 是否支持回滚 */
  supportsRollback: boolean
  /** 配置字段 */
  configFields: DeployConfigField[]
}

/**
 * 部署配置字段定义
 */
export interface DeployConfigField {
  /** 字段名 */
  name: string
  /** 显示标签 */
  label: string
  /** 字段类型 */
  type: 'text' | 'password' | 'number' | 'boolean' | 'select' | 'file'
  /** 是否必填 */
  required: boolean
  /** 默认值 */
  default?: unknown
  /** 占位符 */
  placeholder?: string
  /** 帮助文本 */
  help?: string
  /** 选项（用于 select 类型） */
  options?: Array<{ label: string; value: string }>
  /** 验证正则表达式 */
  pattern?: string
  /** 环境变量名（用于自动获取） */
  envVar?: string
}

/**
 * 保存的部署配置
 */
export interface SavedDeployConfig {
  /** 配置名称 */
  name: string
  /** 部署平台 */
  platform: DeployPlatform
  /** 部署配置（敏感信息加密存储） */
  config: Partial<DeployConfig>
  /** 是否为默认配置 */
  isDefault?: boolean
  /** 创建时间 */
  createdAt: number
  /** 更新时间 */
  updatedAt: number
  /** 上次部署时间 */
  lastDeployAt?: number
}
