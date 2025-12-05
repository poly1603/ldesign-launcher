/**
 * 依赖分析器
 * 分析项目依赖、检测过期包、安全漏洞等
 */
import { promises as fs } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface DependencyInfo {
  name: string
  version: string
  type: 'dependency' | 'devDependency' | 'peerDependency'
  latest?: string
  isOutdated?: boolean
  size?: number
  description?: string
}

export interface VulnerabilityInfo {
  name: string
  severity: 'low' | 'moderate' | 'high' | 'critical'
  title: string
  url?: string
  fixAvailable?: boolean
  recommendedVersion?: string
}

export interface BundleInfo {
  name: string
  size: number
  gzipSize?: number
  percentage: number
}

export interface AnalysisResult {
  projectPath: string
  timestamp: number
  dependencies: DependencyInfo[]
  devDependencies: DependencyInfo[]
  totalDependencies: number
  outdated: DependencyInfo[]
  vulnerabilities: VulnerabilityInfo[]
  bundleAnalysis?: {
    totalSize: number
    chunks: BundleInfo[]
  }
  suggestions: string[]
}

/**
 * 依赖分析器类
 */
export class DependencyAnalyzer {
  /**
   * 分析项目依赖
   */
  async analyze(projectPath: string): Promise<AnalysisResult> {
    const packageJsonPath = path.join(projectPath, 'package.json')

    // 读取 package.json
    let packageJson: {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
      peerDependencies?: Record<string, string>
    }

    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8')
      packageJson = JSON.parse(content)
    } catch {
      throw new Error(`Cannot read package.json at ${projectPath}`)
    }

    // 解析依赖
    const dependencies = this.parseDependencies(packageJson.dependencies || {}, 'dependency')
    const devDependencies = this.parseDependencies(packageJson.devDependencies || {}, 'devDependency')

    // 检测过期包
    const outdated = await this.checkOutdated(projectPath)

    // 检测安全漏洞
    const vulnerabilities = await this.checkVulnerabilities(projectPath)

    // 生成建议
    const suggestions = this.generateSuggestions(dependencies, devDependencies, outdated, vulnerabilities)

    return {
      projectPath,
      timestamp: Date.now(),
      dependencies,
      devDependencies,
      totalDependencies: dependencies.length + devDependencies.length,
      outdated,
      vulnerabilities,
      suggestions,
    }
  }

  /**
   * 解析依赖列表
   */
  private parseDependencies(
    deps: Record<string, string>,
    type: DependencyInfo['type']
  ): DependencyInfo[] {
    return Object.entries(deps).map(([name, version]) => ({
      name,
      version: version.replace(/^[\^~]/, ''),
      type,
    }))
  }

  /**
   * 检测过期包
   */
  async checkOutdated(projectPath: string): Promise<DependencyInfo[]> {
    try {
      const { stdout } = await execAsync('npm outdated --json', {
        cwd: projectPath,
      })

      if (!stdout.trim()) return []

      const outdated = JSON.parse(stdout)
      return Object.entries(outdated).map(([name, info]: [string, unknown]) => {
        const i = info as { current: string; latest: string; wanted: string }
        return {
          name,
          version: i.current,
          latest: i.latest,
          type: 'dependency' as const,
          isOutdated: true,
        }
      })
    } catch {
      // npm outdated 在有过期包时会返回非零退出码
      return []
    }
  }

  /**
   * 检测安全漏洞
   */
  async checkVulnerabilities(projectPath: string): Promise<VulnerabilityInfo[]> {
    try {
      const { stdout } = await execAsync('npm audit --json', {
        cwd: projectPath,
      })

      if (!stdout.trim()) return []

      const audit = JSON.parse(stdout)
      const vulnerabilities: VulnerabilityInfo[] = []

      if (audit.vulnerabilities) {
        for (const [name, info] of Object.entries(audit.vulnerabilities) as Array<
          [string, { severity: string; fixAvailable: boolean; via: Array<{ title: string; url: string }> }]
        >) {
          const via = Array.isArray(info.via) ? info.via[0] : info.via
          vulnerabilities.push({
            name,
            severity: info.severity as VulnerabilityInfo['severity'],
            title: typeof via === 'object' ? via.title : String(via),
            url: typeof via === 'object' ? via.url : undefined,
            fixAvailable: info.fixAvailable,
          })
        }
      }

      return vulnerabilities
    } catch {
      return []
    }
  }

  /**
   * 分析包体积
   */
  async analyzeBundle(projectPath: string): Promise<BundleInfo[]> {
    const distPath = path.join(projectPath, 'dist')

    try {
      await fs.access(distPath)
    } catch {
      return []
    }

    const bundles: BundleInfo[] = []
    let totalSize = 0

    const files = await this.getFilesRecursive(distPath)

    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.css')) {
        const stat = await fs.stat(file)
        const relativePath = path.relative(distPath, file)
        bundles.push({
          name: relativePath,
          size: stat.size,
          percentage: 0, // 稍后计算
        })
        totalSize += stat.size
      }
    }

    // 计算百分比
    bundles.forEach((bundle) => {
      bundle.percentage = totalSize > 0 ? (bundle.size / totalSize) * 100 : 0
    })

    // 按大小排序
    bundles.sort((a, b) => b.size - a.size)

    return bundles
  }

  /**
   * 递归获取文件列表
   */
  private async getFilesRecursive(dir: string): Promise<string[]> {
    const files: string[] = []
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...(await this.getFilesRecursive(fullPath)))
      } else {
        files.push(fullPath)
      }
    }

    return files
  }

  /**
   * 生成优化建议
   */
  private generateSuggestions(
    dependencies: DependencyInfo[],
    devDependencies: DependencyInfo[],
    outdated: DependencyInfo[],
    vulnerabilities: VulnerabilityInfo[]
  ): string[] {
    const suggestions: string[] = []

    // 检查过期包
    if (outdated.length > 0) {
      suggestions.push(`🔄 发现 ${outdated.length} 个过期的依赖包，建议运行 npm update 更新`)
    }

    // 检查安全漏洞
    const critical = vulnerabilities.filter((v) => v.severity === 'critical')
    const high = vulnerabilities.filter((v) => v.severity === 'high')

    if (critical.length > 0) {
      suggestions.push(`🚨 发现 ${critical.length} 个严重安全漏洞，请立即修复！`)
    }
    if (high.length > 0) {
      suggestions.push(`⚠️ 发现 ${high.length} 个高风险安全漏洞，建议尽快修复`)
    }

    // 检查常见的大型依赖
    const largeDeps = ['moment', 'lodash', 'jquery', 'bootstrap']
    const allDeps = [...dependencies, ...devDependencies]

    for (const dep of largeDeps) {
      if (allDeps.some((d) => d.name === dep)) {
        if (dep === 'moment') {
          suggestions.push('💡 建议使用 dayjs 或 date-fns 替代 moment.js，可减小包体积')
        } else if (dep === 'lodash') {
          suggestions.push('💡 建议使用 lodash-es 或按需引入 lodash 函数')
        }
      }
    }

    // 检查 devDependencies 中不应该出现的包
    const shouldBeDev = ['typescript', 'eslint', 'prettier', 'vitest', 'jest']
    for (const name of shouldBeDev) {
      if (dependencies.some((d) => d.name === name)) {
        suggestions.push(`📦 ${name} 应该放在 devDependencies 中`)
      }
    }

    // 总依赖数量警告
    const totalDeps = dependencies.length + devDependencies.length
    if (totalDeps > 100) {
      suggestions.push(`📊 项目依赖数量较多 (${totalDeps})，建议检查是否有冗余依赖`)
    }

    return suggestions
  }

  /**
   * 格式化文件大小
   */
  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }
}

// 单例
let analyzerInstance: DependencyAnalyzer | null = null

export function getDependencyAnalyzer(): DependencyAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new DependencyAnalyzer()
  }
  return analyzerInstance
}
