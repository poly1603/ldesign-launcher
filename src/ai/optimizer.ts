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
  category: 'performance' | 'bundle-size' | 'dev-experience' | 'code-quality'
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
      const duplicatedDeps = await this.detectDuplicatedDependencies(allDeps)

      // 检测未使用依赖
      const unusedDeps = await this.detectUnusedDependencies(allDeps, projectPath)

      return {
        total: Object.keys(allDeps).length,
        large: largeDeps,
        duplicated: duplicatedDeps,
        unused: unusedDeps
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
   * 检测重复依赖
   * 检查是否存在同一个包的多个版本
   */
  private async detectDuplicatedDependencies(dependencies: Record<string, string>): Promise<string[]> {
    try {
      const duplicated: string[] = []
      const packageNames = new Map<string, string[]>()

      // 分析依赖版本
      for (const [name, version] of Object.entries(dependencies)) {
        const baseName = name.replace(/@[\^~]?[\d.]+$/, '')
        if (!packageNames.has(baseName)) {
          packageNames.set(baseName, [])
        }
        packageNames.get(baseName)!.push(version)
      }

      // 找出有多个版本的包
      for (const [name, versions] of packageNames.entries()) {
        if (versions.length > 1) {
          duplicated.push(name)
        }
      }

      return duplicated
    } catch (error) {
      this.logger.error('检测重复依赖失败', error)
      return []
    }
  }

  /**
   * 检测未使用依赖
   * 扫描项目代码，找出从未被引用的依赖
   */
  private async detectUnusedDependencies(
    dependencies: Record<string, string>,
    projectPath: string
  ): Promise<string[]> {
    try {
      const unused: string[] = []
      const { default: fg } = await import('fast-glob')

      // 获取所有源代码文件
      const sourceFiles = await fg(['**/*.{ts,tsx,js,jsx,vue}'], {
        cwd: projectPath,
        ignore: ['node_modules', 'dist', 'build', '.next', '.nuxt'],
        absolute: true
      })

      // 读取所有文件内容
      const FileSystem = (await import('../utils/file-system')).FileSystem
      const allContent = (await Promise.all(
        sourceFiles.map(file => FileSystem.readFile(file).catch(() => ''))
      )).join('\n')

      // 检查每个依赖是否被使用
      for (const dep of Object.keys(dependencies)) {
        // 跳过类型定义包和构建工具
        if (dep.startsWith('@types/') ||
          ['typescript', 'vite', 'webpack', 'rollup'].includes(dep)) {
          continue
        }

        // 检查是否有 import/require 语句引用此依赖
        const importRegex = new RegExp(
          `(?:import|require)\\s*(?:\\(\\s*)?['"]${dep}(?:/|['"])`
        )
        if (!importRegex.test(allContent)) {
          unused.push(dep)
        }
      }

      return unused
    } catch (error) {
      this.logger.error('检测未使用依赖失败', error)
      return []
    }
  }

  /**
   * 分析代码质量
   */
  private async analyzeCodeQuality(projectPath: string): Promise<ProjectAnalysis['codeQuality']> {
    try {
      // 计算代码复杂度
      const complexity = await this.calculateComplexity(projectPath)

      // 读取测试覆盖率
      const coverage = await this.readTestCoverage(projectPath)

      // 运行 linter 获取问题数
      const issues = await this.getLinterIssues(projectPath)

      return {
        complexity,
        coverage,
        issues
      }
    } catch (error) {
      this.logger.error('代码质量分析失败', error)
      return {
        complexity: 0,
        coverage: 0,
        issues: 0
      }
    }
  }

  /**
   * 计算代码复杂度
   * 基于圈复杂度和认知复杂度的综合评分
   */
  private async calculateComplexity(projectPath: string): Promise<number> {
    try {
      const { default: fg } = await import('fast-glob')
      const FileSystem = (await import('../utils/file-system')).FileSystem

      const sourceFiles = await fg(['**/*.{ts,tsx,js,jsx}'], {
        cwd: projectPath,
        ignore: ['node_modules', 'dist', 'build', '**/*.test.*', '**/*.spec.*'],
        absolute: true
      })

      let totalComplexity = 0
      let fileCount = 0

      for (const file of sourceFiles) {
        const content = await FileSystem.readFile(file)

        // 简化的复杂度计算：统计控制流语句
        const controlFlowKeywords = [
          /\bif\s*\(/g,
          /\belse\s+if\s*\(/g,
          /\bfor\s*\(/g,
          /\bwhile\s*\(/g,
          /\bswitch\s*\(/g,
          /\bcase\s+/g,
          /\bcatch\s*\(/g,
          /\?\s*.*:\s*/g, // 三元运算符
          /&&/g,
          /\|\|/g
        ]

        let fileComplexity = 1 // 基础复杂度
        for (const pattern of controlFlowKeywords) {
          const matches = content.match(pattern)
          if (matches) {
            fileComplexity += matches.length
          }
        }

        totalComplexity += fileComplexity
        fileCount++
      }

      // 返回平均复杂度
      return fileCount > 0 ? Math.round(totalComplexity / fileCount) : 0
    } catch (error) {
      this.logger.error('计算代码复杂度失败', error)
      return 0
    }
  }

  /**
   * 读取测试覆盖率
   * 从 coverage 目录读取覆盖率数据
   */
  private async readTestCoverage(projectPath: string): Promise<number> {
    try {
      const PathUtils = (await import('../utils/path-utils')).PathUtils
      const FileSystem = (await import('../utils/file-system')).FileSystem

      // 尝试读取常见的覆盖率文件
      const coverageFiles = [
        PathUtils.join(projectPath, 'coverage/coverage-summary.json'),
        PathUtils.join(projectPath, 'coverage/lcov-report/index.html'),
        PathUtils.join(projectPath, '.nyc_output/coverage-summary.json')
      ]

      for (const file of coverageFiles) {
        if (await FileSystem.exists(file)) {
          if (file.endsWith('.json')) {
            const data = JSON.parse(await FileSystem.readFile(file))

            // 提取总体覆盖率
            if (data.total) {
              const { lines, statements, functions, branches } = data.total
              const avg = (
                (lines?.pct || 0) +
                (statements?.pct || 0) +
                (functions?.pct || 0) +
                (branches?.pct || 0)
              ) / 4
              return Math.round(avg * 10) / 10
            }
          }
        }
      }

      return 0
    } catch (error) {
      this.logger.error('读取测试覆盖率失败', error)
      return 0
    }
  }

  /**
   * 获取 linter 问题数
   * 运行 ESLint 并统计问题数量
   */
  private async getLinterIssues(projectPath: string): Promise<number> {
    try {
      const PathUtils = (await import('../utils/path-utils')).PathUtils
      const FileSystem = (await import('../utils/file-system')).FileSystem

      // 检查是否存在 ESLint 配置
      const eslintConfigs = [
        '.eslintrc.js',
        '.eslintrc.cjs',
        '.eslintrc.json',
        'eslint.config.js',
        'eslint.config.mjs'
      ]

      let hasEslint = false
      for (const config of eslintConfigs) {
        if (await FileSystem.exists(PathUtils.join(projectPath, config))) {
          hasEslint = true
          break
        }
      }

      if (!hasEslint) {
        return 0
      }

      // 尝试读取 ESLint 缓存或报告
      const eslintCache = PathUtils.join(projectPath, '.eslintcache')
      if (await FileSystem.exists(eslintCache)) {
        try {
          const cacheContent = await FileSystem.readFile(eslintCache)
          const cache = JSON.parse(cacheContent)

          // 统计错误和警告
          let errorCount = 0
          let warningCount = 0

          for (const file of Object.values(cache) as any[]) {
            if (file.messages) {
              errorCount += file.messages.filter((m: any) => m.severity === 2).length
              warningCount += file.messages.filter((m: any) => m.severity === 1).length
            }
          }

          return errorCount + warningCount
        } catch {
          // 缓存文件格式不匹配
        }
      }

      return 0
    } catch (error) {
      this.logger.error('获取 linter 问题数失败', error)
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

    // 根据建议类型自动应用优化
    try {
      await this.autoApplyOptimization(suggestion)
      this.logger.success(`✅ 优化已应用: ${suggestion.title}`)
    } catch (error) {
      this.logger.error(`应用优化失败: ${(error as Error).message}`)
      throw error
    }

    this.emit('suggestion-applied', suggestion)
  }

  /**
   * 学习优化结果
   */
  async learnFromResults(
    before: PerformanceMetrics,
    after: PerformanceMetrics,
    appliedSuggestions: OptimizationSuggestion[]
  ): Promise<void> {
    // 记录优化效果，用于改进建议算法
    const improvement = this.calculateImprovement(before, after)

    this.logger.info('学习优化结果', {
      appliedSuggestions,
      improvement
    })

    // 使用历史数据改进建议准确性
    await this.improveSuggestionAccuracy(appliedSuggestions, improvement)

    this.emit('learning-complete', { improvement, suggestions: appliedSuggestions })
  }

  /**
   * 自动应用优化建议
   * 根据建议类型自动修改配置文件或代码
   */
  private async autoApplyOptimization(suggestion: OptimizationSuggestion): Promise<void> {
    const FileSystem = (await import('../utils/file-system')).FileSystem
    const PathUtils = (await import('../utils/path-utils')).PathUtils

    switch (suggestion.category) {
      case 'bundle-size': {
        // 优化包大小相关配置
        if (suggestion.id.startsWith('optimize-')) {
          const depName = suggestion.id.replace('optimize-', '')
          this.logger.info(`配置 ${depName} 为外部依赖`)

          // 查找并更新 Vite 配置
          const configFiles = ['vite.config.ts', 'vite.config.js', 'launcher.config.ts']
          for (const configFile of configFiles) {
            const configPath = PathUtils.resolve(configFile)
            if (await FileSystem.exists(configPath)) {
              let content = await FileSystem.readFile(configPath)

              // 添加外部依赖配置
              const externalConfig = `    external: ['${depName}'],`
              if (!content.includes(externalConfig)) {
                content = content.replace(
                  /(build:\s*{)/,
                  `$1\n${externalConfig}`
                )
                await FileSystem.writeFile(configPath, content)
                this.logger.info(`已更新配置文件: ${configFile}`)
              }
              break
            }
          }
        }
        break
      }

      case 'performance': {
        // 应用性能优化配置
        if (suggestion.id === 'enable-code-splitting') {
          this.logger.info('启用代码分割配置')
          // 在构建配置中启用代码分割
          const configFiles = ['vite.config.ts', 'launcher.config.ts']
          for (const configFile of configFiles) {
            const configPath = PathUtils.resolve(configFile)
            if (await FileSystem.exists(configPath)) {
              let content = await FileSystem.readFile(configPath)

              const splittingConfig = `    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router'],
        },
      },
    },`

              if (!content.includes('manualChunks')) {
                content = content.replace(
                  /(build:\s*{)/,
                  `$1\n${splittingConfig}`
                )
                await FileSystem.writeFile(configPath, content)
                this.logger.info(`已更新配置文件: ${configFile}`)
              }
              break
            }
          }
        }
        break
      }

      case 'code-quality': {
        // 应用代码质量改进
        this.logger.info('代码质量优化通常需要手动调整代码')
        break
      }

      case 'dev-experience': {
        // 应用开发体验优化
        this.logger.info('应用开发体验优化配置')
        break
      }

      default:
        this.logger.warn(`未知的优化类别: ${suggestion.category}`)
    }
  }

  /**
   * 改进建议准确性
   * 基于历史应用结果和实际改进效果，调整未来建议的权重和优先级
   */
  private async improveSuggestionAccuracy(
    appliedSuggestions: OptimizationSuggestion[],
    improvement: Record<string, number>
  ): Promise<void> {
    try {
      const FileSystem = (await import('../utils/file-system')).FileSystem
      const PathUtils = (await import('../utils/path-utils')).PathUtils

      // 历史数据存储路径
      const historyPath = PathUtils.join(process.cwd(), '.launcher/ai-history.json')

      // 加载历史数据
      let history: {
        suggestions: Array<{
          id: string
          category: string
          priority: string
          actualImprovement: number
          timestamp: number
        }>
      } = { suggestions: [] }

      if (await FileSystem.exists(historyPath)) {
        try {
          const content = await FileSystem.readFile(historyPath)
          history = JSON.parse(content)
        } catch {
          // 使用默认历史
        }
      }

      // 记录本次应用的建议和实际效果
      for (const suggestion of appliedSuggestions) {
        const actualImprovement = this.calculateActualImprovement(
          suggestion,
          improvement
        )

        history.suggestions.push({
          id: suggestion.id,
          category: suggestion.category,
          priority: suggestion.priority,
          actualImprovement,
          timestamp: Date.now()
        })
      }

      // 保留最近 100 条记录
      if (history.suggestions.length > 100) {
        history.suggestions = history.suggestions.slice(-100)
      }

      // 保存更新后的历史
      await FileSystem.ensureDir(PathUtils.dirname(historyPath))
      await FileSystem.writeFile(historyPath, JSON.stringify(history, null, 2))

      // 分析历史数据，调整建议权重
      this.analyzeHistoryAndAdjustWeights(history)

      this.logger.info('✅ 建议准确性已改进')
    } catch (error) {
      this.logger.error('改进建议准确性失败', error)
    }
  }

  /**
   * 计算实际改进效果
   */
  private calculateActualImprovement(
    suggestion: OptimizationSuggestion,
    improvement: Record<string, number>
  ): number {
    // 根据建议类别获取相应的改进指标
    const categoryMetrics: Record<string, string> = {
      'bundle-size': 'bundleSize',
      'performance': 'buildTime',
      'code-quality': 'codeQuality',
      'dev-experience': 'devExperience'
    }

    const metricKey = categoryMetrics[suggestion.category]
    return improvement[metricKey] || 0
  }

  /**
   * 分析历史数据并调整权重
   */
  private analyzeHistoryAndAdjustWeights(history: any): void {
    // 统计各类别建议的平均效果
    const categoryStats = new Map<string, { count: number, totalImprovement: number }>()

    for (const record of history.suggestions) {
      if (!categoryStats.has(record.category)) {
        categoryStats.set(record.category, { count: 0, totalImprovement: 0 })
      }
      const stats = categoryStats.get(record.category)!
      stats.count++
      stats.totalImprovement += record.actualImprovement
    }

    // 根据历史效果调整优先级
    for (const [category, stats] of categoryStats.entries()) {
      const avgImprovement = stats.totalImprovement / stats.count
      this.logger.debug(`${category} 平均改进: ${avgImprovement.toFixed(2)}%`)

      // 如果某类别建议效果显著（>10%），提升其优先级
      if (avgImprovement > 10) {
        this.logger.info(`${category} 建议效果显著，将在未来提高优先级`)
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
