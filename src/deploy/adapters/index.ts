/**
 * 部署适配器注册表
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type {
  DeployPlatform,
  DeployAdapter,
  DeployPlatformInfo,
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
 * 适配器注册表
 */
const adapters = new Map<DeployPlatform, DeployAdapter>()
adapters.set('netlify', new NetlifyAdapter())
adapters.set('vercel', new VercelAdapter())
adapters.set('cloudflare', new CloudflareAdapter())
adapters.set('github-pages', new GitHubPagesAdapter())
adapters.set('surge', new SurgeAdapter())
adapters.set('ftp', new FTPAdapter())
adapters.set('sftp', new SFTPAdapter())
adapters.set('ssh', new SSHAdapter())
adapters.set('custom', new CustomAdapter())

/**
 * 获取适配器
 */
export function getAdapter(platform: DeployPlatform): DeployAdapter | undefined {
  return adapters.get(platform)
}

/**
 * 注册自定义适配器
 */
export function registerAdapter(platform: DeployPlatform, adapter: DeployAdapter): void {
  adapters.set(platform, adapter)
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
 * 获取平台信息
 */
export function getPlatformInfo(platform: DeployPlatform): DeployPlatformInfo | undefined {
  return SUPPORTED_PLATFORMS.find((p) => p.id === platform)
}

// 导出所有适配器
export { NetlifyAdapter } from './NetlifyAdapter'
export { VercelAdapter } from './VercelAdapter'
export { CloudflareAdapter } from './CloudflareAdapter'
export { GitHubPagesAdapter } from './GitHubPagesAdapter'
export { SurgeAdapter } from './SurgeAdapter'
export { FTPAdapter } from './FTPAdapter'
export { SFTPAdapter } from './SFTPAdapter'
export { SSHAdapter } from './SSHAdapter'
export { CustomAdapter } from './CustomAdapter'
