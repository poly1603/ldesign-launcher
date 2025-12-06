/**
 * 版本更新检查器
 *
 * 检查 npm 包是否有新版本
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import https from 'node:https'
import path from 'node:path'
import fs from 'fs-extra'
import chalk from 'chalk'

/**
 * 更新信息
 */
export interface UpdateInfo {
  currentVersion: string
  latestVersion: string
  hasUpdate: boolean
  updateType?: 'major' | 'minor' | 'patch'
  releaseDate?: Date
  changelog?: string
}

/**
 * 检查配置
 */
export interface CheckConfig {
  packageName: string
  currentVersion: string
  registry?: string
  timeout?: number
  cacheDir?: string
  cacheDuration?: number // 缓存时长（毫秒）
}

/**
 * 从 registry 获取包信息
 */
async function fetchPackageInfo(
  packageName: string,
  registry: string = 'https://registry.npmmirror.com',
  timeout: number = 5000,
): Promise<Record<string, unknown> | null> {
  return new Promise((resolve) => {
    const url = `${registry}/${packageName}`

    const req = https.get(url, { timeout }, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        }
        catch {
          resolve(null)
        }
      })
    })

    req.on('error', () => resolve(null))
    req.on('timeout', () => {
      req.destroy()
      resolve(null)
    })
  })
}

/**
 * 解析版本号
 */
function parseVersion(version: string): { major: number, minor: number, patch: number } | null {
  const match = version.replace(/^[~^>=<v]*/, '').match(/^(\d+)\.(\d+)\.(\d+)/)
  if (!match)
    return null
  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
  }
}

/**
 * 比较版本号
 */
function compareVersions(current: string, latest: string): 'major' | 'minor' | 'patch' | null {
  const curr = parseVersion(current)
  const lat = parseVersion(latest)

  if (!curr || !lat)
    return null

  if (lat.major > curr.major)
    return 'major'
  if (lat.major === curr.major && lat.minor > curr.minor)
    return 'minor'
  if (lat.major === curr.major && lat.minor === curr.minor && lat.patch > curr.patch)
    return 'patch'

  return null
}

/**
 * 版本更新检查器类
 */
export class UpdateChecker {
  private config: Required<CheckConfig>
  private cacheFile: string

  constructor(config: CheckConfig) {
    this.config = {
      packageName: config.packageName,
      currentVersion: config.currentVersion,
      registry: config.registry || 'https://registry.npmmirror.com',
      timeout: config.timeout || 5000,
      cacheDir: config.cacheDir || path.join(process.env.HOME || process.env.USERPROFILE || '', '.launcher'),
      cacheDuration: config.cacheDuration || 24 * 60 * 60 * 1000, // 默认 24 小时
    }
    this.cacheFile = path.join(this.config.cacheDir, 'update-check-cache.json')
  }

  /**
   * 检查更新
   */
  async check(): Promise<UpdateInfo> {
    const result: UpdateInfo = {
      currentVersion: this.config.currentVersion,
      latestVersion: this.config.currentVersion,
      hasUpdate: false,
    }

    // 检查缓存
    const cached = await this.loadCache()
    if (cached) {
      return cached
    }

    // 从 registry 获取信息
    const pkgInfo = await fetchPackageInfo(
      this.config.packageName,
      this.config.registry,
      this.config.timeout,
    )

    if (!pkgInfo) {
      return result
    }

    const distTags = pkgInfo['dist-tags'] as Record<string, string> | undefined
    const latestVersion = distTags?.latest

    if (latestVersion) {
      result.latestVersion = latestVersion
      result.updateType = compareVersions(this.config.currentVersion, latestVersion) || undefined
      result.hasUpdate = result.updateType !== undefined

      // 获取发布时间
      const time = pkgInfo.time as Record<string, string> | undefined
      if (time?.[latestVersion]) {
        result.releaseDate = new Date(time[latestVersion])
      }
    }

    // 保存缓存
    await this.saveCache(result)

    return result
  }

  /**
   * 加载缓存
   */
  private async loadCache(): Promise<UpdateInfo | null> {
    try {
      if (!await fs.pathExists(this.cacheFile)) {
        return null
      }

      const cache = await fs.readJson(this.cacheFile)
      const cacheTime = cache.timestamp || 0

      // 检查缓存是否过期
      if (Date.now() - cacheTime > this.config.cacheDuration) {
        return null
      }

      // 检查版本是否匹配
      if (cache.currentVersion !== this.config.currentVersion) {
        return null
      }

      return cache.data as UpdateInfo
    }
    catch {
      return null
    }
  }

  /**
   * 保存缓存
   */
  private async saveCache(data: UpdateInfo): Promise<void> {
    try {
      await fs.ensureDir(this.config.cacheDir)
      await fs.writeJson(this.cacheFile, {
        timestamp: Date.now(),
        currentVersion: this.config.currentVersion,
        data,
      })
    }
    catch {
      // 忽略缓存写入错误
    }
  }

  /**
   * 清除缓存
   */
  async clearCache(): Promise<void> {
    try {
      await fs.remove(this.cacheFile)
    }
    catch {
      // 忽略错误
    }
  }

  /**
   * 打印更新提示
   */
  printUpdateNotice(info: UpdateInfo): void {
    if (!info.hasUpdate)
      return

    const updateTypeColors = {
      major: chalk.red,
      minor: chalk.yellow,
      patch: chalk.green,
    }

    const color = updateTypeColors[info.updateType || 'patch']
    const typeLabel = {
      major: '主版本',
      minor: '次版本',
      patch: '补丁',
    }[info.updateType || 'patch']

    console.log()
    console.log(chalk.yellow('╭─────────────────────────────────────────────────╮'))
    console.log(chalk.yellow('│') + chalk.bold('  📦 发现新版本！                               ') + chalk.yellow('│'))
    console.log(chalk.yellow('│                                                 │'))
    console.log(chalk.yellow('│') + `  当前版本: ${chalk.gray(info.currentVersion)}`.padEnd(57) + chalk.yellow('│'))
    console.log(chalk.yellow('│') + `  最新版本: ${color(info.latestVersion)} ${chalk.gray(`(${typeLabel}更新)`)}`.padEnd(66) + chalk.yellow('│'))
    if (info.releaseDate) {
      console.log(chalk.yellow('│') + `  发布时间: ${chalk.gray(info.releaseDate.toLocaleDateString())}`.padEnd(57) + chalk.yellow('│'))
    }
    console.log(chalk.yellow('│                                                 │'))
    console.log(chalk.yellow('│') + chalk.cyan(`  运行 npm install -g ${this.config.packageName}@latest 更新`).padEnd(66) + chalk.yellow('│'))
    console.log(chalk.yellow('╰─────────────────────────────────────────────────╯'))
    console.log()
  }
}

/**
 * 快速检查更新
 */
export async function checkForUpdates(
  packageName: string,
  currentVersion: string,
  options?: {
    silent?: boolean
    registry?: string
  },
): Promise<UpdateInfo> {
  const checker = new UpdateChecker({
    packageName,
    currentVersion,
    registry: options?.registry,
  })

  const info = await checker.check()

  if (!options?.silent && info.hasUpdate) {
    checker.printUpdateNotice(info)
  }

  return info
}
