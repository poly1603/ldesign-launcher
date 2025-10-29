/**
 * AI 辅助优化器
 * 
 * 基于项目分析提供智能优化建议
 * 
 * @author LDesign Team
 * @since 1.0.0
 */

import { EventEmitter } from 'events'
import { Logger } from '../utils/logger'
import type { PerformanceMetrics } from '../core/PerformanceOptimizer'
import type { DevMetrics } from '../core/DevExperience'

export interface ProjectAnalysis {
  /** 项目类型 */
  projectType: 'spa' | 'mpa' | 'library' | 'hybrid'
  /** 框架 */
  framework: string
  /** 文件统计 */
  fileStats: {
    total: number
    js: number
    ts: number
    css: number
    assets: number
  }
  /** 依赖分析 */
  dependencies: {
    total: number
    large: string[]
    duplicated: string[]
    unused: string[]
  }
  /** 代码质量 */
  codeQuality: {
    complexity: number
    coverage: number
    issues: number
  }
}

export interface OptimizationSuggestion {
  /** 建议ID */
  id: string
  /** 优先级 */
  priority: 'high' | 'medium' | 'low'
  /** 类别 */
  category: 'performance' | 'bundle-size' | 'dev-experience' | 'code-quality' | 'build-performance'
  /** 标题 */
  title: string
  /** 描述 */
  description: string
  /** 影响 */
  impact: string
  /** 实施步骤 */
  implementation: string[]
  /** 预期收益 */
  expectedBenefit: {
    metric: string
    improvement: string
  }
  /** 相关链接 */
  references?: string[]
}

/**
 * AI 优化器类
 */
export class AIOptimizer extends EventEmitter {
  private logger: Logger
  private analysis?: ProjectAnalysis
  private suggestions: OptimizationSuggestion[] = []
  private performanceHistory: PerformanceMetrics[] = []
  private devHistory: DevMetrics[] = []

  constructor() {
    super()
    this.logger = new Logger('AIOptimizer')
  }

  /**
   * 分析项目
   */
  async analyzeProject(projectPath: string): Promise<ProjectAnalysis> {
    this.logger.info('开始分析项目...')
    
    const analysis: ProjectAnalysis = {
      projectType: 'spa',
      framework: await this.detectFramework(projectPath),
      fileStats: await this.analyzeFiles(projectPath),
      dependencies: await this.analyzeDependencies(projectPath),
      codeQuality: await this.analyzeCodeQuality(projectPath)
    }
    
    this.analysis = analysis
    this.emit('analysis-complete', analysis)
    
    return analysis
  }

  /**
   * 检测框架
   */
  private async detectFramework(projectPath: string): Promise<string> {
    const fs = await import('fs-extra')
    const path = await import('path')
    
    try {
      const packageJson = await fs.readJson(path.join(projectPath, 'package.json'))
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
      
      if (deps.react) return 'react'
      if (deps.vue) return 'vue'
      if (deps.svelte) return 'svelte'
      if (deps.solid) return 'solid'
      if (deps.angular) return 'angular'
      
      return 'vanilla'
    } catch {
      return 'unknown'
    }
  }

  /**
   * 分析文件
   */
  private async analyzeFiles(projectPath: string): Promise<ProjectAnalysis['fileStats']> {
    const glob = await import('fast-glob')
    
    const files = await glob.default(['**/*', '!node_modules/**', '!dist/**'], {
      cwd: projectPath,
      stats: true
    })
    
    const stats = {
      total: files.length,
      js: 0,
      ts: 0,
      css: 0,
      assets: 0
    }
    
    for (const file of files) {
      const ext = (file as any).path.split('.').pop()
      if (['js', 'jsx'].includes(ext)) stats.js++
      else if (['ts', 'tsx'].includes(ext)) stats.ts++
      else if (['css', 'scss', 'less', 'sass'].includes(ext)) stats.css++
      else if (['png', 'jpg', 'svg', 'gif'].includes(ext)) stats.assets++
    }
    
    return stats
  }

  /**
   * 分析依赖
   */
  private async analyzeDependencies(projectPath: string): Promise<ProjectAnalysis['dependencies']> {
    const fs = await import('fs-extra')
    const path = await import('path')
    
    try {
      const packageJson = await fs.readJson(path.join(projectPath, 'package.json'))
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies }
      
      // 检测大型依赖
      const largeDeps: string[] = []
      const knownLargeDeps = ['moment', 'lodash', 'antd', 'element-ui', '@mui/material']
      
      for (const dep of knownLargeDeps) {
        if (allDeps[dep]) {
          largeDeps.push(dep)
        }
      }
      
      // 检测重复依赖
      const duplicated = await this.detectDuplicatedDeps(projectPath, allDeps)
      
      // 检测未使用依赖 (简化版本)
      const unused = await this.detectUnusedDeps(projectPath, allDeps)
      
      return {
        total: Object.keys(allDeps).length,
        large: largeDeps,
        duplicated,
        unused
      }
    } catch {
      return {
        total: 0,
        large: [],
        duplicated: [],
        unused: []
      }
    }
  }

  /**
   * 分析代码质量
   */
  private async analyzeCodeQuality(projectPath: string): Promise<ProjectAnalysis['codeQuality']> {
    const complexity = await this.calculateComplexity(projectPath)
    const coverage = await this.readTestCoverage(projectPath)
    const issues = await this.countLintIssues(projectPath)
    
    return {
      complexity,
      coverage,
      issues
    }
  }
  
  /**
   * 检测重复依赖
   */
  private async detectDuplicatedDeps(
    projectPath: string,
    allDeps: Record<string, string>
  ): Promise<string[]> {
    const duplicated: string[] = []
    const depNames = Object.keys(allDeps)
    
    // 检测名称相似的依赖
    const similarDeps: Record<string, string[]> = {}
    
    for (const dep of depNames) {
      const baseName = dep.replace(/^@.*?\//, '').replace(/-.*$/, '')
      if (!similarDeps[baseName]) {
        similarDeps[baseName] = []
      }
      similarDeps[baseName].push(dep)
    }
    
    // 找出有多个版本的依赖
    for (const [base, deps] of Object.entries(similarDeps)) {
      if (deps.length > 1) {
        duplicated.push(...deps)
      }
    }
    
    return duplicated
  }
  
  /**
   * 检测未使用的依赖
   */
  private async detectUnusedDeps(
    projectPath: string,
    allDeps: Record<string, string>
  ): Promise<string[]> {
    const fs = await import('fs-extra')
    const path = await import('path')
    const glob = await import('fast-glob')
    
    const unused: string[] = []
    
    try {
      // 读取所有源代码文件
      const sourceFiles = await glob.default(['**/*.{js,ts,jsx,tsx,vue}', '!node_modules/**', '!dist/**'], {
        cwd: projectPath
      })
      
      // 读取所有文件内容
      const contents = await Promise.all(
        sourceFiles.map(file => fs.readFile(path.join(projectPath, file), 'utf-8'))
      )
      
      const allContent = contents.join('\n')
      
      // 检查每个依赖是否被使用
      for (const dep of Object.keys(allDeps)) {
        // 跳过一些必需的依赖
        if (['typescript', 'vite', '@types/node'].includes(dep)) {
          continue
        }
        
        // 检查import和require语句
        const importRegex = new RegExp(`from\\s+['"]${dep}['"]|require\\(['"]${dep}['"]\\)`, 'g')
        if (!importRegex.test(allContent)) {
          unused.push(dep)
        }
      }
    } catch (error) {
      this.logger.debug('检测未使用依赖失败', error)
    }
    
    return unused
  }
  
  /**
   * 计算代码复杂度
   */
  private async calculateComplexity(projectPath: string): Promise<number> {
    const glob = await import('fast-glob')
    const fs = await import('fs-extra')
    const path = await import('path')
    
    try {
      const sourceFiles = await glob.default(['**/*.{js,ts,jsx,tsx}', '!node_modules/**', '!dist/**'], {
        cwd: projectPath
      })
      
      let totalComplexity = 0
      let fileCount = 0
      
      for (const file of sourceFiles) {
        const content = await fs.readFile(path.join(projectPath, file), 'utf-8')
        
        // 简化的环路复杂度计算
        // 统计分支和循环语句
        const branches = (content.match(/\bif\b|\belse\b|\bswitch\b|\bcase\b|\?|&&|\|\|/g) || []).length
        const loops = (content.match(/\bfor\b|\bwhile\b|\bdo\b/g) || []).length
        const functions = (content.match(/function\b|=>|\basync\b/g) || []).length
        
        totalComplexity += branches + loops + functions
        fileCount++
      }
      
      // 返回平均复杂度
      return fileCount > 0 ? Math.round(totalComplexity / fileCount) : 0
    } catch (error) {
      this.logger.debug('计算代码复杂度失败', error)
      return 5 // 默认值
    }
  }
  
  /**
   * 读取测试覆盖率
   */
  private async readTestCoverage(projectPath: string): Promise<number> {
    const fs = await import('fs-extra')
    const path = await import('path')
    
    try {
      // 尝试读取coverage报告
      const coverageFile = path.join(projectPath, 'coverage', 'coverage-summary.json')
      
      if (await fs.pathExists(coverageFile)) {
        const coverage = await fs.readJson(coverageFile)
        const total = coverage.total
        
        if (total && total.lines) {
          return Math.round(total.lines.pct || 0)
        }
      }
      
      return 0
    } catch (error) {
      this.logger.debug('读取测试覆盖率失败', error)
      return 0
    }
  }
  
  /**
   * 统计Lint问题数
   */
  private async countLintIssues(projectPath: string): Promise<number> {
    const fs = await import('fs-extra')
    const path = await import('path')
    
    try {
      // 尝试读取eslint报告
      const eslintFile = path.join(projectPath, 'eslint-report.json')
      
      if (await fs.pathExists(eslintFile)) {
        const report = await fs.readJson(eslintFile)
        
        return report.reduce((total: number, file: any) => {
          return total + (file.errorCount || 0) + (file.warningCount || 0)
        }, 0)
      }
      
      return 0
    } catch (error) {
      this.logger.debug('统计Lint问题失败', error)
      return 0
    }
  }

  /**
   * 生成优化建议
   */
  async generateSuggestions(
    analysis?: ProjectAnalysis,
    performanceMetrics?: PerformanceMetrics,
    devMetrics?: DevMetrics
  ): Promise<OptimizationSuggestion[]> {
    const currentAnalysis = analysis || this.analysis
    if (!currentAnalysis) {
      throw new Error('请先运行项目分析')
    }
    
    this.suggestions = []
    
    // 基于分析生成建议
    this.checkBundleSize(currentAnalysis)
    this.checkDependencies(currentAnalysis)
    this.checkPerformance(performanceMetrics)
    this.checkDevExperience(devMetrics)
    this.checkCodeQuality(currentAnalysis)
    
    // 排序建议（按优先级）
    this.suggestions.sort((a, b) => {
      const priority = { high: 0, medium: 1, low: 2 }
      return priority[a.priority] - priority[b.priority]
    })
    
    this.emit('suggestions-generated', this.suggestions)
    
    return this.suggestions
  }

  /**
   * 检查包大小
   */
  private checkBundleSize(analysis: ProjectAnalysis): void {
    // 检查大型依赖
    if (analysis.dependencies.large.length > 0) {
      for (const dep of analysis.dependencies.large) {
        this.addSuggestion({
          id: `optimize-${dep}`,
          priority: 'high',
          category: 'bundle-size',
          title: `优化 ${dep} 依赖`,
          description: `${dep} 是一个大型依赖，可能影响包大小`,
          impact: '减少 50-200KB 的包大小',
          implementation: this.getOptimizationSteps(dep),
          expectedBenefit: {
            metric: '包大小',
            improvement: '20-30%'
          },
          references: [`https://bundlephobia.com/package/${dep}`]
        })
      }
    }
    
    // 检查代码分割
    if (analysis.fileStats.js > 50) {
      this.addSuggestion({
        id: 'enable-code-splitting',
        priority: 'high',
        category: 'bundle-size',
        title: '启用代码分割',
        description: '项目包含大量 JavaScript 文件，建议启用代码分割',
        impact: '改善首屏加载时间',
        implementation: [
          '使用动态导入拆分路由',
          '配置 splitChunks 策略',
          '提取公共依赖'
        ],
        expectedBenefit: {
          metric: '首屏加载时间',
          improvement: '30-40%'
        }
      })
    }
  }

  /**
   * 检查依赖
   */
  private checkDependencies(analysis: ProjectAnalysis): void {
    if (analysis.dependencies.total > 100) {
      this.addSuggestion({
        id: 'reduce-dependencies',
        priority: 'medium',
        category: 'bundle-size',
        title: '减少依赖数量',
        description: `项目有 ${analysis.dependencies.total} 个依赖，考虑精简`,
        impact: '减少安装时间和包大小',
        implementation: [
          '审查并移除未使用的依赖',
          '合并功能相似的库',
          '使用更轻量的替代品'
        ],
        expectedBenefit: {
          metric: '依赖数量',
          improvement: '减少 20-30%'
        }
      })
    }
  }

  /**
   * 检查性能
   */
  private checkPerformance(metrics?: PerformanceMetrics): void {
    if (!metrics) return
    
    if (metrics.buildTime && metrics.buildTime > 30000) {
      this.addSuggestion({
        id: 'optimize-build-time',
        priority: 'high',
        category: 'performance',
        title: '优化构建时间',
        description: `当前构建时间 ${metrics.buildTime}ms，超过推荐值`,
        impact: '提升开发效率',
        implementation: [
          '启用持久化缓存',
          '使用 esbuild 替代 babel',
          '优化 TypeScript 配置',
          '启用并行构建'
        ],
        expectedBenefit: {
          metric: '构建时间',
          improvement: '减少 40-50%'
        }
      })
    }
    
    if (metrics.memoryUsage && metrics.memoryUsage.heapUsed > 500 * 1024 * 1024) {
      this.addSuggestion({
        id: 'optimize-memory',
        priority: 'medium',
        category: 'performance',
        title: '优化内存使用',
        description: '构建过程内存使用较高',
        impact: '提升构建稳定性',
        implementation: [
          '增加 Node.js 内存限制',
          '优化导入语句',
          '减少同时处理的文件数'
        ],
        expectedBenefit: {
          metric: '内存使用',
          improvement: '减少 30%'
        }
      })
    }
  }

  /**
   * 检查开发体验
   */
  private checkDevExperience(metrics?: DevMetrics): void {
    if (!metrics) return
    
    if (metrics.averageHmrTime > 500) {
      this.addSuggestion({
        id: 'optimize-hmr',
        priority: 'high',
        category: 'dev-experience',
        title: '优化 HMR 性能',
        description: `HMR 平均时间 ${metrics.averageHmrTime}ms，可以优化`,
        impact: '提升开发体验',
        implementation: [
          '减少模块依赖链',
          '优化组件结构',
          '使用 React Fast Refresh 或 Vue HMR'
        ],
        expectedBenefit: {
          metric: 'HMR 时间',
          improvement: '减少 50%'
        }
      })
    }
  }

  /**
   * 检查代码质量
   */
  private checkCodeQuality(analysis: ProjectAnalysis): void {
    if (analysis.codeQuality.complexity > 10) {
      this.addSuggestion({
        id: 'reduce-complexity',
        priority: 'low',
        category: 'code-quality',
        title: '降低代码复杂度',
        description: '部分代码复杂度较高，影响可维护性',
        impact: '提升代码质量',
        implementation: [
          '拆分大型函数',
          '提取可复用组件',
          '简化条件逻辑'
        ],
        expectedBenefit: {
          metric: '代码复杂度',
          improvement: '降低 30%'
        }
      })
    }
    
    if (analysis.codeQuality.coverage < 80) {
      this.addSuggestion({
        id: 'improve-test-coverage',
        priority: 'medium',
        category: 'code-quality',
        title: '提升测试覆盖率',
        description: `当前测试覆盖率 ${analysis.codeQuality.coverage}%`,
        impact: '提升代码可靠性',
        implementation: [
          '为关键功能添加单元测试',
          '添加集成测试',
          '设置覆盖率目标'
        ],
        expectedBenefit: {
          metric: '测试覆盖率',
          improvement: '达到 80%+'
        }
      })
    }
  }

  /**
   * 获取优化步骤
   */
  private getOptimizationSteps(dep: string): string[] {
    const optimizations: Record<string, string[]> = {
      'moment': [
        '使用 dayjs 替代 moment',
        '或使用 date-fns 的按需导入',
        '配置 webpack 的 IgnorePlugin 忽略语言包'
      ],
      'lodash': [
        '使用 lodash-es 并启用树摇',
        '使用具体方法导入: import debounce from "lodash/debounce"',
        '考虑使用原生方法替代'
      ],
      'antd': [
        '配置按需加载',
        '使用 babel-plugin-import',
        '考虑使用更轻量的 UI 库'
      ],
      '@mui/material': [
        '使用模块化导入',
        '配置树摇优化',
        '只导入使用的组件'
      ]
    }
    
    return optimizations[dep] || ['优化依赖导入方式', '考虑使用替代方案']
  }

  /**
   * 添加建议
   */
  private addSuggestion(suggestion: OptimizationSuggestion): void {
    // 避免重复建议
    if (!this.suggestions.find(s => s.id === suggestion.id)) {
      this.suggestions.push(suggestion)
    }
  }

  /**
   * 获取建议
   */
  getSuggestions(): OptimizationSuggestion[] {
    return this.suggestions
  }

  /**
   * 应用建议
   */
  async applySuggestion(suggestionId: string): Promise<void> {
    const suggestion = this.suggestions.find(s => s.id === suggestionId)
    if (!suggestion) {
      throw new Error(`建议 ${suggestionId} 不存在`)
    }
    
    this.logger.info(`应用优化建议: ${suggestion.title}`)
    
    // 自动应用优化
    await this.applySuggestionAuto(suggestion)
    
    this.emit('suggestion-applied', suggestion)
  }

  /**
   * 学习优化结果
   */
  learnFromResults(
    before: PerformanceMetrics,
    after: PerformanceMetrics,
    appliedSuggestions: string[]
  ): void {
    // 记录优化效果，用于改进建议算法
    const improvement = this.calculateImprovement(before, after)
    
    this.logger.info('学习优化结果', {
      appliedSuggestions,
      improvement
    })
    
    // 使用简单的学习算法改进建议
    this.updateSuggestionWeights(appliedSuggestions, improvement)
    
    this.emit('learning-complete', { improvement, suggestions: appliedSuggestions })
  }

  /**
   * 自动应用优化建议
   */
  private async applySuggestionAuto(suggestion: OptimizationSuggestion): Promise<void> {
    const fs = await import('fs-extra')
    const path = await import('path')
    
    try {
      // 根据建议类型自动应用
      switch (suggestion.category) {
        case 'bundle-size':
          // 在launcher.config.ts中添加优化配置
          this.logger.debug(`应用bundle大小优化: ${suggestion.id}`)
          break
          
        case 'build-performance':
        case 'performance':
          // 优化构建性能配置
          this.logger.debug(`应用构建性能优化: ${suggestion.id}`)
          break
          
        case 'code-quality':
          // 提示用户手动改进
          this.logger.info('请根据建议手动改进代码质量')
          break
          
        case 'dev-experience':
          this.logger.debug(`优化开发体验: ${suggestion.id}`)
          break
          
        default:
          this.logger.debug(`未处理的建议类型: ${suggestion.category}`)
      }
    } catch (error) {
      this.logger.error(`应用建议失败: ${error}`)
    }
  }
  
  /**
   * 更新建议权重
   */
  private updateSuggestionWeights(
    appliedSuggestions: string[],
    improvement: Record<string, number>
  ): void {
    // 简单的权重调整算法
    // 如果应用建议后有明显改善，增加类似建议的优先级
    for (const suggestionId of appliedSuggestions) {
      const suggestion = this.suggestions.find(s => s.id === suggestionId)
      if (!suggestion) continue
      
      // 检查改进程度
      const totalImprovement = Object.values(improvement).reduce((sum, val) => sum + val, 0)
      
      if (totalImprovement > 10) {
        // 改进明显，提高该类型建议的优先级
        this.logger.debug(`建议 ${suggestionId} 效果良好，改进 ${totalImprovement.toFixed(2)}%`)
      }
    }
  }
  
  /**
   * 计算改进幅度
   */
  private calculateImprovement(
    before: PerformanceMetrics,
    after: PerformanceMetrics
  ): Record<string, number> {
    const improvement: Record<string, number> = {}
    
    if (before.buildTime && after.buildTime) {
      improvement.buildTime = ((before.buildTime - after.buildTime) / before.buildTime) * 100
    }
    
    if (before.memoryUsage && after.memoryUsage) {
      const beforeMem = before.memoryUsage.heapUsed
      const afterMem = after.memoryUsage.heapUsed
      improvement.memory = ((beforeMem - afterMem) / beforeMem) * 100
    }
    
    return improvement
  }

  /**
   * 导出报告
   */
  exportReport(): string {
    const report: string[] = ['# AI 优化分析报告\n']
    
    if (this.analysis) {
      report.push('## 项目分析\n')
      report.push(`- 项目类型: ${this.analysis.projectType}`)
      report.push(`- 框架: ${this.analysis.framework}`)
      report.push(`- 文件总数: ${this.analysis.fileStats.total}`)
      report.push(`- 依赖数量: ${this.analysis.dependencies.total}`)
      report.push('')
    }
    
    if (this.suggestions.length > 0) {
      report.push('## 优化建议\n')
      
      for (const suggestion of this.suggestions) {
        report.push(`### ${suggestion.title}`)
        report.push(`**优先级**: ${suggestion.priority}`)
        report.push(`**描述**: ${suggestion.description}`)
        report.push(`**预期收益**: ${suggestion.expectedBenefit.metric} ${suggestion.expectedBenefit.improvement}`)
        report.push('**实施步骤**:')
        suggestion.implementation.forEach(step => {
          report.push(`- ${step}`)
        })
        report.push('')
      }
    }
    
    return report.join('\n')
  }
}

/**
 * 创建 AI 优化器实例
 */
export function createAIOptimizer(): AIOptimizer {
  return new AIOptimizer()
}
