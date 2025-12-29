/**
 * 部署管理器
 *
 * 管理部署配置、历史记录和平台凭证
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type {
  DeployConfig,
  DeployPlatform,
  SavedDeployConfig,
} from '../types/deploy'
import path from 'node:path'
import fs from 'fs-extra'
import { Logger } from '../utils/logger'
import { SUPPORTED_PLATFORMS } from './adapters'

// 简单加密解密（生产环境建议使用更安全的方案）
const ENCRYPTION_KEY = 'ldesign-launcher-deploy-key'

function simpleEncrypt(text: string): string {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
    result += String.fromCharCode(charCode)
  }
  return Buffer.from(result).toString('base64')
}

function simpleDecrypt(encoded: string): string {
  const text = Buffer.from(encoded, 'base64').toString()
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
    result += String.fromCharCode(charCode)
  }
  return result
}

/**
 * 部署管理器
 */
export class DeployManager {
  private cwd: string
  private configPath: string
  private logger: Logger
  private savedConfigs: SavedDeployConfig[] = []

  constructor(cwd: string) {
    this.cwd = cwd
    this.configPath = path.join(cwd, '.launcher', 'deploy-configs.json')
    this.logger = new Logger('DeployManager')
    this.loadConfigs()
  }

  /**
   * 获取所有支持的平台
   */
  getSupportedPlatforms() {
    return SUPPORTED_PLATFORMS
  }

  /**
   * 获取已保存的配置列表
   */
  getSavedConfigs(): SavedDeployConfig[] {
    return this.savedConfigs.map(config => ({
      ...config,
      config: this.sanitizeConfig(config.config),
    }))
  }

  /**
   * 获取指定配置
   */
  getConfig(name: string): SavedDeployConfig | undefined {
    const config = this.savedConfigs.find(c => c.name === name)
    if (config) {
      return {
        ...config,
        config: this.decryptConfig(config.config),
      }
    }
    return undefined
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig(): SavedDeployConfig | undefined {
    const config = this.savedConfigs.find(c => c.isDefault)
    if (config) {
      return {
        ...config,
        config: this.decryptConfig(config.config),
      }
    }
    return undefined
  }

  /**
   * 保存配置
   */
  async saveConfig(name: string, platform: DeployPlatform, config: Partial<DeployConfig>, isDefault = false): Promise<void> {
    const existingIndex = this.savedConfigs.findIndex(c => c.name === name)
    const now = Date.now()

    const encryptedConfig = this.encryptConfig(config)

    const savedConfig: SavedDeployConfig = {
      name,
      platform,
      config: encryptedConfig,
      isDefault,
      createdAt: existingIndex >= 0 ? this.savedConfigs[existingIndex].createdAt : now,
      updatedAt: now,
    }

    if (existingIndex >= 0) {
      this.savedConfigs[existingIndex] = savedConfig
    }
    else {
      this.savedConfigs.push(savedConfig)
    }

    // 如果设置为默认，取消其他默认
    if (isDefault) {
      this.savedConfigs.forEach((c) => {
        if (c.name !== name) {
          c.isDefault = false
        }
      })
    }

    await this.saveConfigs()
    this.logger.info(`配置 "${name}" 已保存`)
  }

  /**
   * 删除配置
   */
  async deleteConfig(name: string): Promise<boolean> {
    const index = this.savedConfigs.findIndex(c => c.name === name)
    if (index >= 0) {
      this.savedConfigs.splice(index, 1)
      await this.saveConfigs()
      this.logger.info(`配置 "${name}" 已删除`)
      return true
    }
    return false
  }

  /**
   * 设置默认配置
   */
  async setDefaultConfig(name: string): Promise<boolean> {
    const config = this.savedConfigs.find(c => c.name === name)
    if (!config) {
      return false
    }

    this.savedConfigs.forEach((c) => {
      c.isDefault = c.name === name
    })

    await this.saveConfigs()
    return true
  }

  /**
   * 更新最后部署时间
   */
  async updateLastDeployTime(name: string): Promise<void> {
    const config = this.savedConfigs.find(c => c.name === name)
    if (config) {
      config.lastDeployAt = Date.now()
      await this.saveConfigs()
    }
  }

  /**
   * 从配置文件读取部署配置
   */
  async readFromLauncherConfig(): Promise<Partial<DeployConfig> | null> {
    const configFiles = ['launcher.config.ts', 'launcher.config.js', 'launcher.config.mjs']

    for (const file of configFiles) {
      const configPath = path.join(this.cwd, file)
      try {
        if (await fs.pathExists(configPath)) {
          const content = await fs.readFile(configPath, 'utf-8')
          // 简单解析 deploy 配置
          const deployMatch = content.match(/deploy\s*:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/)
          if (deployMatch) {
            // 这里可以使用更复杂的解析逻辑
            // 简化起见，我们返回 null 并建议用户使用 CLI 或 UI
            this.logger.debug('发现 launcher.config 中的 deploy 配置')
            return null
          }
        }
      }
      catch (error) {
        continue
      }
    }

    return null
  }

  /**
   * 检测环境变量中的凭证
   */
  detectEnvCredentials(platform: DeployPlatform): Record<string, string> {
    const envMap: Record<DeployPlatform, string[]> = {
      'netlify': ['NETLIFY_AUTH_TOKEN', 'NETLIFY_SITE_ID'],
      'vercel': ['VERCEL_TOKEN', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID'],
      'cloudflare': ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'],
      'github-pages': ['GITHUB_TOKEN', 'GH_TOKEN'],
      'surge': ['SURGE_TOKEN'],
      'ftp': ['FTP_HOST', 'FTP_USER', 'FTP_PASSWORD'],
      'sftp': ['SFTP_HOST', 'SFTP_USER', 'SFTP_PASSWORD', 'SFTP_KEY'],
      'ssh': ['SSH_HOST', 'SSH_USER', 'SSH_PASSWORD', 'SSH_KEY'],
      'custom': [],
    }

    const credentials: Record<string, string> = {}
    const envVars = envMap[platform] || []

    for (const envVar of envVars) {
      const value = process.env[envVar]
      if (value) {
        credentials[envVar] = value
      }
    }

    return credentials
  }

  /**
   * 加密敏感配置
   */
  private encryptConfig(config: Partial<DeployConfig>): Partial<DeployConfig> {
    const sensitiveKeys = ['password', 'token', 'authToken', 'apiToken', 'privateKey', 'passphrase']
    const encrypted: Record<string, unknown> = { ...config }

    for (const key of sensitiveKeys) {
      if (key in encrypted && typeof encrypted[key] === 'string') {
        encrypted[key] = simpleEncrypt(encrypted[key] as string)
        encrypted[`${key}_encrypted`] = true
      }
    }

    return encrypted as Partial<DeployConfig>
  }

  /**
   * 解密敏感配置
   */
  private decryptConfig(config: Partial<DeployConfig>): Partial<DeployConfig> {
    const sensitiveKeys = ['password', 'token', 'authToken', 'apiToken', 'privateKey', 'passphrase']
    const decrypted: Record<string, unknown> = { ...config }

    for (const key of sensitiveKeys) {
      if (decrypted[`${key}_encrypted`] && typeof decrypted[key] === 'string') {
        decrypted[key] = simpleDecrypt(decrypted[key] as string)
        delete decrypted[`${key}_encrypted`]
      }
    }

    return decrypted as Partial<DeployConfig>
  }

  /**
   * 脱敏配置（用于显示）
   */
  private sanitizeConfig(config: Partial<DeployConfig>): Partial<DeployConfig> {
    const sensitiveKeys = ['password', 'token', 'authToken', 'apiToken', 'privateKey', 'passphrase']
    const sanitized: Record<string, unknown> = { ...config }

    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '***'
      }
      delete sanitized[`${key}_encrypted`]
    }

    return sanitized as Partial<DeployConfig>
  }

  /**
   * 加载保存的配置
   */
  private loadConfigs(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8')
        this.savedConfigs = JSON.parse(data)
      }
    }
    catch (error) {
      this.logger.warn('加载部署配置失败:', error)
      this.savedConfigs = []
    }
  }

  /**
   * 保存配置到文件
   */
  private async saveConfigs(): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.configPath))
      await fs.writeFile(this.configPath, JSON.stringify(this.savedConfigs, null, 2))
    }
    catch (error) {
      this.logger.warn('保存部署配置失败:', error)
    }
  }
}
