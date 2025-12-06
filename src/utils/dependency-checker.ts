/**
 * 依赖检查器
 *
 * 检查项目依赖的版本、安全性和更新建议
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import https from 'node:https'
import path from 'node:path'
import chalk from 'chalk'
import fs from 'fs-extra'

/**
 * 依赖信息
 */
export interface DependencyInfo {
  name: string
  currentVersion: string
  latestVersion?: string
  wantedVersion?: string
  type: 'dependencies' | 'devDependencies' | 'peerDependencies'
  updateType?: 'major' | 'minor' | 'patch' | 'prerelease'
  deprecated?: boolean
  deprecationMessage?: string
  homepage?: string
  description?: string
}

/**
 * 安全漏洞信息
 */
export interface VulnerabilityInfo {
  name: string
  severity: 'low' | 'moderate' | 'high' | 'critical'
  title: string
  url?: string
  patched_versions?: string
}

/**
 * 检查结果
 */
export interface CheckResult {
  outdated: DependencyInfo[]
  deprecated: DependencyInfo[]
  vulnerabilities: VulnerabilityInfo[]
  total: number
  upToDate: number
  needsUpdate: number
  timestamp: number
}

/**
 * 从 npm registry 获取包信息
 */
async function fetchPackageInfo(packageName: string): Promise<Record<string, unknown> | null> {
  return new Promise((resolve) => {
    const url = `https://registry.npmmirror.com/${packageName}`

    https.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        }
        catch {
          resolve(null)
        }
      })
    }).on('error', () => {
      resolve(null)
    })
  })
}

/**
 * 解析版本号
 */
function parseVersion(version: string): { major: number, minor: number, patch: number, prerelease?: string } | null {
  const match = version.replace(/^[~^>=<]*/, '').match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?/)
  if (!match)
    return null
  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
    prerelease: match[4],
  }
}

/**
 * 比较版本号
 */
function compareVersions(
  current: string,
  latest: string,
): 'major' | 'minor' | 'patch' | 'prerelease' | null {
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
  if (lat.prerelease && !curr.prerelease)
    return 'prerelease'

  return null
}

/**
 * 依赖检查器类
 */
export class DependencyChecker {
  private cwd: string

  constructor(cwd: string) {
    this.cwd = cwd
  }

  /**
   * 检查所有依赖
   */
  async check(options?: {
    includeDevDeps?: boolean
    includePeerDeps?: boolean
    checkVulnerabilities?: boolean
  }): Promise<CheckResult> {
    const pkgPath = path.join(this.cwd, 'package.json')
    if (!await fs.pathExists(pkgPath)) {
      throw new Error('package.json not found')
    }

    const pkg = await fs.readJson(pkgPath)
    const deps: Record<string, DependencyInfo> = {}

    // 收集依赖
    if (pkg.dependencies) {
      for (const [name, version] of Object.entries(pkg.dependencies)) {
        deps[name] = {
          name,
          currentVersion: version as string,
          type: 'dependencies',
        }
      }
    }

    if (options?.includeDevDeps !== false && pkg.devDependencies) {
      for (const [name, version] of Object.entries(pkg.devDependencies)) {
        deps[name] = {
          name,
          currentVersion: version as string,
          type: 'devDependencies',
        }
      }
    }

    if (options?.includePeerDeps && pkg.peerDependencies) {
      for (const [name, version] of Object.entries(pkg.peerDependencies)) {
        deps[name] = {
          name,
          currentVersion: version as string,
          type: 'peerDependencies',
        }
      }
    }

    // 检查每个依赖的最新版本
    const outdated: DependencyInfo[] = []
    const deprecated: DependencyInfo[] = []
    let upToDate = 0

    console.log(chalk.cyan(`\n🔍 检查 ${Object.keys(deps).length} 个依赖...\n`))

    // 批量检查（每次最多 10 个并行）
    const entries = Object.entries(deps)
    const batchSize = 10

    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize)
      const results = await Promise.all(
        batch.map(async ([name, info]) => {
          const pkgInfo = await fetchPackageInfo(name)
          if (!pkgInfo)
            return { name, info, pkgInfo: null }
          return { name, info, pkgInfo }
        }),
      )

      for (const { info, pkgInfo } of results) {
        if (!pkgInfo) {
          continue
        }

        const distTags = pkgInfo['dist-tags'] as Record<string, string> | undefined
        const latestVersion = distTags?.latest
        const versions = pkgInfo.versions as Record<string, { deprecated?: string }> | undefined

        if (latestVersion) {
          info.latestVersion = latestVersion
          info.updateType = compareVersions(info.currentVersion, latestVersion) || undefined

          if (info.updateType) {
            info.homepage = (pkgInfo as any).homepage
            info.description = (pkgInfo as any).description
            outdated.push(info)
          }
          else {
            upToDate++
          }
        }

        // 检查是否已废弃
        if (versions) {
          const currentVersionInfo = versions[info.currentVersion.replace(/^[~^]/, '')]
          if (currentVersionInfo?.deprecated) {
            info.deprecated = true
            info.deprecationMessage = currentVersionInfo.deprecated
            deprecated.push(info)
          }
        }
      }

      // 显示进度
      const progress = Math.min(i + batchSize, entries.length)
      process.stdout.write(`\r已检查 ${progress}/${entries.length} 个依赖`)
    }

    console.log('\n')

    // 检查安全漏洞
    let vulnerabilities: VulnerabilityInfo[] = []
    if (options?.checkVulnerabilities) {
      vulnerabilities = await this.checkVulnerabilities()
    }

    return {
      outdated,
      deprecated,
      vulnerabilities,
      total: Object.keys(deps).length,
      upToDate,
      needsUpdate: outdated.length,
      timestamp: Date.now(),
    }
  }

  /**
   * 检查安全漏洞 (使用 npm audit)
   */
  private async checkVulnerabilities(): Promise<VulnerabilityInfo[]> {
    const { spawn } = await import('node:child_process')

    return new Promise((resolve) => {
      const audit = spawn('npm', ['audit', '--json'], {
        cwd: this.cwd,
        shell: true,
      })

      let stdout = ''
      audit.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      audit.on('close', () => {
        try {
          const result = JSON.parse(stdout)
          const vulns: VulnerabilityInfo[] = []

          if (result.vulnerabilities) {
            for (const [name, info] of Object.entries(result.vulnerabilities)) {
              const vuln = info as any
              vulns.push({
                name,
                severity: vuln.severity,
                title: vuln.via?.[0]?.title || vuln.via?.[0] || 'Unknown',
                url: vuln.via?.[0]?.url,
                patched_versions: vuln.fixAvailable?.version,
              })
            }
          }

          resolve(vulns)
        }
        catch {
          resolve([])
        }
      })

      audit.on('error', () => {
        resolve([])
      })
    })
  }

  /**
   * 打印检查报告
   */
  printReport(result: CheckResult): void {
    console.log(chalk.bold.cyan('📊 依赖检查报告'))
    console.log(chalk.gray('─'.repeat(60)))

    // 总体统计
    console.log(`\n${chalk.bold('📦 总体统计:')}`)
    console.log(`   总依赖数: ${chalk.cyan(result.total)}`)
    console.log(`   已是最新: ${chalk.green(result.upToDate)}`)
    console.log(`   可更新数: ${chalk.yellow(result.needsUpdate)}`)
    console.log(`   已废弃数: ${chalk.red(result.deprecated.length)}`)
    if (result.vulnerabilities.length > 0) {
      console.log(`   安全漏洞: ${chalk.red(result.vulnerabilities.length)}`)
    }

    // 可更新的依赖
    if (result.outdated.length > 0) {
      console.log(`\n${chalk.bold('📈 可更新的依赖:')}`)

      // 按更新类型分组
      const major = result.outdated.filter(d => d.updateType === 'major')
      const minor = result.outdated.filter(d => d.updateType === 'minor')
      const patch = result.outdated.filter(d => d.updateType === 'patch')

      if (major.length > 0) {
        console.log(chalk.red(`\n   🔴 主版本更新 (${major.length}):`))
        for (const dep of major) {
          console.log(`      ${dep.name}: ${chalk.gray(dep.currentVersion)} → ${chalk.red(dep.latestVersion)}`)
        }
      }

      if (minor.length > 0) {
        console.log(chalk.yellow(`\n   🟡 次版本更新 (${minor.length}):`))
        for (const dep of minor) {
          console.log(`      ${dep.name}: ${chalk.gray(dep.currentVersion)} → ${chalk.yellow(dep.latestVersion)}`)
        }
      }

      if (patch.length > 0) {
        console.log(chalk.green(`\n   🟢 补丁更新 (${patch.length}):`))
        for (const dep of patch) {
          console.log(`      ${dep.name}: ${chalk.gray(dep.currentVersion)} → ${chalk.green(dep.latestVersion)}`)
        }
      }
    }

    // 已废弃的依赖
    if (result.deprecated.length > 0) {
      console.log(`\n${chalk.bold.red('⚠️ 已废弃的依赖:')}`)
      for (const dep of result.deprecated) {
        console.log(`   ${chalk.red(dep.name)}: ${dep.deprecationMessage || '已废弃'}`)
      }
    }

    // 安全漏洞
    if (result.vulnerabilities.length > 0) {
      console.log(`\n${chalk.bold.red('🔒 安全漏洞:')}`)
      const severityOrder = ['critical', 'high', 'moderate', 'low']
      const sorted = [...result.vulnerabilities].sort(
        (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity),
      )

      for (const vuln of sorted) {
        const severityColor = {
          critical: chalk.bgRed.white,
          high: chalk.red,
          moderate: chalk.yellow,
          low: chalk.gray,
        }[vuln.severity]

        console.log(`   ${severityColor(vuln.severity.toUpperCase().padEnd(8))} ${vuln.name}: ${vuln.title}`)
        if (vuln.patched_versions) {
          console.log(`             ${chalk.green('修复版本:')} ${vuln.patched_versions}`)
        }
      }
    }

    // 建议
    console.log(`\n${chalk.bold('💡 建议:')}`)
    if (result.outdated.length > 0) {
      console.log(`   运行 ${chalk.cyan('npm update')} 更新补丁和次版本`)
      if (result.outdated.some(d => d.updateType === 'major')) {
        console.log(`   运行 ${chalk.cyan('npm install <package>@latest')} 更新主版本`)
      }
    }
    if (result.vulnerabilities.length > 0) {
      console.log(`   运行 ${chalk.cyan('npm audit fix')} 自动修复安全漏洞`)
    }

    console.log(`\n${chalk.gray('─'.repeat(60))}`)
  }

  /**
   * 生成更新命令
   */
  generateUpdateCommands(result: CheckResult, pm = 'npm'): string[] {
    const commands: string[] = []

    // 补丁更新
    const patches = result.outdated.filter(d => d.updateType === 'patch')
    if (patches.length > 0) {
      commands.push(`# 补丁更新 (安全)`)
      commands.push(`${pm} update`)
    }

    // 次版本更新
    const minors = result.outdated.filter(d => d.updateType === 'minor')
    if (minors.length > 0) {
      commands.push(`\n# 次版本更新`)
      for (const dep of minors) {
        const prefix = dep.type === 'devDependencies' ? '-D ' : ''
        commands.push(`${pm} ${pm === 'npm' ? 'install' : 'add'} ${prefix}${dep.name}@^${dep.latestVersion}`)
      }
    }

    // 主版本更新
    const majors = result.outdated.filter(d => d.updateType === 'major')
    if (majors.length > 0) {
      commands.push(`\n# 主版本更新 (需要检查兼容性)`)
      for (const dep of majors) {
        const prefix = dep.type === 'devDependencies' ? '-D ' : ''
        commands.push(`${pm} ${pm === 'npm' ? 'install' : 'add'} ${prefix}${dep.name}@latest`)
      }
    }

    return commands
  }
}

/**
 * 检查依赖
 */
export async function checkDependencies(
  cwd: string,
  options?: {
    includeDevDeps?: boolean
    checkVulnerabilities?: boolean
    printReport?: boolean
  },
): Promise<CheckResult> {
  const checker = new DependencyChecker(cwd)
  const result = await checker.check(options)

  if (options?.printReport !== false) {
    checker.printReport(result)
  }

  return result
}
