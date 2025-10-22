/**
 * 质量监控工具
 * 
 * 监控代码质量趋势、测试覆盖率、依赖健康度等
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

import { EventEmitter } from 'events'
import { Logger } from './logger'
import { FileSystem } from './file-system'
import { PathUtils } from './path-utils'

/**
 * 质量指标接口
 */
export interface QualityMetrics {
  /** 时间戳 */
  timestamp: number
  /** 代码复杂度 */
  complexity: number
  /** 测试覆盖率 */
  coverage: number
  /** Lint 问题数 */
  lintIssues: number
  /** TypeScript 错误数 */
  tsErrors: number
  /** 依赖数量 */
  dependencies: number
  /** 过时依赖数 */
  outdatedDeps: number
  /** 安全漏洞数 */
  vulnerabilities: number
  /** 代码行数 */
  linesOfCode: number
  /** 文件数量 */
  fileCount: number
}

/**
 * 质量趋势接口
 */
export interface QualityTrend {
  /** 指标名称 */
  metric: string
  /** 数据点 */
  data: Array<{
    date: string
    value: number
  }>
  /** 趋势方向 */
  trend: 'improving' | 'declining' | 'stable'
  /** 变化率 */
  changeRate: number
}

/**
 * 质量报告接口
 */
export interface QualityReport {
  /** 生成时间 */
  timestamp: number
  /** 当前指标 */
  current: QualityMetrics
  /** 历史趋势 */
  trends: QualityTrend[]
  /** 质量评分 (0-100) */
  score: number
  /** 问题列表 */
  issues: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low'
    category: string
    description: string
    recommendation: string
  }>
  /** 改进建议 */
  recommendations: string[]
}

/**
 * 质量监控器类
 */
export class QualityMonitor extends EventEmitter {
  private logger: Logger
  private metricsHistory: QualityMetrics[] = []
  private dataPath: string

  constructor(logger?: Logger) {
    super()
    this.logger = logger || new Logger('QualityMonitor')
    this.dataPath = PathUtils.join(process.cwd(), '.launcher/quality-metrics.json')

    this.loadHistory()
  }

  /**
   * 收集当前质量指标
   */
  async collect(projectPath: string = process.cwd()): Promise<QualityMetrics> {
    this.logger.info('收集质量指标...')

    const metrics: QualityMetrics = {
      timestamp: Date.now(),
      complexity: await this.measureComplexity(projectPath),
      coverage: await this.measureCoverage(projectPath),
      lintIssues: await this.countLintIssues(projectPath),
      tsErrors: await this.countTSErrors(projectPath),
      dependencies: await this.countDependencies(projectPath),
      outdatedDeps: await this.countOutdatedDeps(projectPath),
      vulnerabilities: await this.countVulnerabilities(projectPath),
      linesOfCode: await this.countLinesOfCode(projectPath),
      fileCount: await this.countFiles(projectPath)
    }

    this.metricsHistory.push(metrics)
    await this.save()

    this.emit('metrics-collected', metrics)

    return metrics
  }

  /**
   * 生成质量报告
   */
  async generateReport(): Promise<QualityReport> {
    const current = this.metricsHistory[this.metricsHistory.length - 1]

    if (!current) {
      throw new Error('没有可用的质量指标，请先运行 collect()')
    }

    // 计算趋势
    const trends = this.calculateTrends()

    // 计算质量评分
    const score = this.calculateQualityScore(current)

    // 识别问题
    const issues = this.identifyIssues(current)

    // 生成建议
    const recommendations = this.generateRecommendations(current, trends)

    return {
      timestamp: Date.now(),
      current,
      trends,
      score,
      issues,
      recommendations
    }
  }

  /**
   * 测量代码复杂度
   */
  private async measureComplexity(projectPath: string): Promise<number> {
    try {
      const { default: fg } = await import('fast-glob')

      const files = await fg(['**/*.{ts,tsx,js,jsx}'], {
        cwd: projectPath,
        ignore: ['node_modules', 'dist', '**/*.test.*'],
        absolute: true
      })

      let totalComplexity = 0

      for (const file of files) {
        const content = await FileSystem.readFile(file)

        // 简化的复杂度计算
        const controlFlow = [
          /\bif\s*\(/g,
          /\bfor\s*\(/g,
          /\bwhile\s*\(/g,
          /\bswitch\s*\(/g,
          /\?\s*.*:\s*/g,
          /&&/g,
          /\|\|/g
        ]

        let complexity = 1
        for (const pattern of controlFlow) {
          const matches = content.match(pattern)
          complexity += matches ? matches.length : 0
        }

        totalComplexity += complexity
      }

      return files.length > 0 ? Math.round(totalComplexity / files.length) : 0
    } catch {
      return 0
    }
  }

  /**
   * 测量测试覆盖率
   */
  private async measureCoverage(projectPath: string): Promise<number> {
    try {
      const coveragePath = PathUtils.join(projectPath, 'coverage/coverage-summary.json')

      if (await FileSystem.exists(coveragePath)) {
        const content = await FileSystem.readFile(coveragePath)
        const data = JSON.parse(content)

        if (data.total) {
          const { lines, statements, functions, branches } = data.total
          return ((lines?.pct || 0) + (statements?.pct || 0) +
            (functions?.pct || 0) + (branches?.pct || 0)) / 4
        }
      }
    } catch {
      // Ignore
    }

    return 0
  }

  /**
   * 统计 Lint 问题
   */
  private async countLintIssues(projectPath: string): Promise<number> {
    // 实现逻辑（简化版）
    return 0
  }

  /**
   * 统计 TypeScript 错误
   */
  private async countTSErrors(projectPath: string): Promise<number> {
    // 实现逻辑（简化版）
    return 0
  }

  /**
   * 统计依赖数量
   */
  private async countDependencies(projectPath: string): Promise<number> {
    try {
      const pkgPath = PathUtils.join(projectPath, 'package.json')

      if (await FileSystem.exists(pkgPath)) {
        const content = await FileSystem.readFile(pkgPath)
        const pkg = JSON.parse(content)

        return Object.keys(pkg.dependencies || {}).length +
          Object.keys(pkg.devDependencies || {}).length
      }
    } catch {
      // Ignore
    }

    return 0
  }

  /**
   * 统计过时依赖
   */
  private async countOutdatedDeps(projectPath: string): Promise<number> {
    // 实际应该运行 npm outdated
    return 0
  }

  /**
   * 统计安全漏洞
   */
  private async countVulnerabilities(projectPath: string): Promise<number> {
    // 实际应该运行 npm audit
    return 0
  }

  /**
   * 统计代码行数
   */
  private async countLinesOfCode(projectPath: string): Promise<number> {
    try {
      const { default: fg } = await import('fast-glob')

      const files = await fg(['**/*.{ts,tsx,js,jsx,vue}'], {
        cwd: projectPath,
        ignore: ['node_modules', 'dist'],
        absolute: true
      })

      let totalLines = 0

      for (const file of files) {
        const content = await FileSystem.readFile(file)
        totalLines += content.split('\n').length
      }

      return totalLines
    } catch {
      return 0
    }
  }

  /**
   * 统计文件数量
   */
  private async countFiles(projectPath: string): Promise<number> {
    try {
      const { default: fg } = await import('fast-glob')

      const files = await fg(['**/*'], {
        cwd: projectPath,
        ignore: ['node_modules', 'dist']
      })

      return files.length
    } catch {
      return 0
    }
  }

  /**
   * 计算趋势
   */
  private calculateTrends(): QualityTrend[] {
    const trends: QualityTrend[] = []
    const metrics: Array<keyof QualityMetrics> = [
      'complexity',
      'coverage',
      'lintIssues',
      'dependencies'
    ]

    for (const metric of metrics) {
      const data = this.metricsHistory.map(m => ({
        date: new Date(m.timestamp).toISOString().split('T')[0],
        value: m[metric] as number
      }))

      let trend: 'improving' | 'declining' | 'stable' = 'stable'
      let changeRate = 0

      if (data.length >= 2) {
        const first = data[0].value
        const last = data[data.length - 1].value
        changeRate = ((last - first) / first) * 100

        // 对于某些指标，降低是改善
        const lowerIsBetter = ['complexity', 'lintIssues', 'dependencies']

        if (Math.abs(changeRate) > 10) {
          if (lowerIsBetter.includes(metric)) {
            trend = changeRate < 0 ? 'improving' : 'declining'
          } else {
            trend = changeRate > 0 ? 'improving' : 'declining'
          }
        }
      }

      trends.push({ metric, data, trend, changeRate })
    }

    return trends
  }

  /**
   * 计算质量评分
   */
  private calculateQualityScore(metrics: QualityMetrics): number {
    let score = 100

    // 复杂度扣分
    if (metrics.complexity > 15) score -= 20
    else if (metrics.complexity > 10) score -= 10

    // 覆盖率加分/扣分
    if (metrics.coverage >= 80) score += 0
    else if (metrics.coverage >= 60) score -= 10
    else score -= 20

    // Lint 问题扣分
    if (metrics.lintIssues > 50) score -= 20
    else if (metrics.lintIssues > 20) score -= 10

    // 安全漏洞扣分
    score -= metrics.vulnerabilities * 5

    return Math.max(0, Math.min(100, score))
  }

  /**
   * 识别问题
   */
  private identifyIssues(metrics: QualityMetrics): QualityReport['issues'] {
    const issues: QualityReport['issues'] = []

    if (metrics.complexity > 15) {
      issues.push({
        severity: 'high',
        category: 'code-quality',
        description: '代码复杂度过高',
        recommendation: '重构复杂函数，提取公共逻辑'
      })
    }

    if (metrics.coverage < 60) {
      issues.push({
        severity: 'medium',
        category: 'testing',
        description: '测试覆盖率较低',
        recommendation: '增加单元测试，目标 ≥80%'
      })
    }

    if (metrics.vulnerabilities > 0) {
      issues.push({
        severity: 'critical',
        category: 'security',
        description: `发现 ${metrics.vulnerabilities} 个安全漏洞`,
        recommendation: '立即修复安全漏洞'
      })
    }

    return issues
  }

  /**
   * 生成改进建议
   */
  private generateRecommendations(metrics: QualityMetrics, trends: QualityTrend[]): string[] {
    const recommendations: string[] = []

    // 基于趋势生成建议
    for (const trend of trends) {
      if (trend.trend === 'declining') {
        recommendations.push(`${trend.metric} 呈下降趋势，需要关注`)
      }
    }

    // 基于当前指标生成建议
    if (metrics.lintIssues > 0) {
      recommendations.push('运行 `npm run lint:fix` 修复 Lint 问题')
    }

    if (metrics.outdatedDeps > 5) {
      recommendations.push('更新过时的依赖包')
    }

    return recommendations
  }

  /**
   * 保存数据
   */
  private async save(): Promise<void> {
    try {
      await FileSystem.ensureDir(PathUtils.dirname(this.dataPath))

      // 只保留最近 30 条记录
      const recent = this.metricsHistory.slice(-30)

      await FileSystem.writeFile(
        this.dataPath,
        JSON.stringify(recent, null, 2)
      )
    } catch (error) {
      this.logger.debug('保存质量指标失败', error)
    }
  }

  /**
   * 加载历史数据
   */
  private async loadHistory(): Promise<void> {
    try {
      if (await FileSystem.exists(this.dataPath)) {
        const content = await FileSystem.readFile(this.dataPath)
        this.metricsHistory = JSON.parse(content)
      }
    } catch (error) {
      this.logger.debug('加载历史数据失败', error)
    }
  }
}

/**
 * 创建质量监控器实例
 */
export function createQualityMonitor(logger?: Logger): QualityMonitor {
  return new QualityMonitor(logger)
}

/**
 * 全局质量监控器实例
 */
export const qualityMonitor = new QualityMonitor()


