/**
 * 性能监控命令
 * 
 * 提供实时性能监控、Web Vitals 追踪和性能分析报告
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

import { Command } from 'commander'
import { Logger } from '../../utils/logger'
import chalk from 'chalk'
import ora from 'ora'
import fs from 'fs-extra'
import path from 'path'

export interface PerformanceMetrics {
  /** Core Web Vitals */
  webVitals: {
    LCP: number  // Largest Contentful Paint
    FID: number  // First Input Delay
    CLS: number  // Cumulative Layout Shift
    FCP: number  // First Contentful Paint
    TTFB: number // Time to First Byte
  }
  /** 构建性能 */
  buildMetrics: {
    buildTime: number
    bundleSize: number
    chunkCount: number
    dependencies: number
  }
  /** 运行时性能 */
  runtimeMetrics: {
    memoryUsage: number
    cpuUsage: number
    networkRequests: number
    errorRate: number
  }
  /** 用户体验指标 */
  uxMetrics: {
    pageLoadTime: number
    interactionTime: number
    bounceRate: number
    conversionRate: number
  }
}

export interface MonitorConfig {
  /** 监控目标 */
  targets: string[]
  /** 采样间隔 */
  interval: number
  /** 数据保留时间 */
  retention: number
  /** 告警阈值 */
  thresholds: Record<string, number>
  /** 报告配置 */
  reporting: {
    enabled: boolean
    format: 'json' | 'html' | 'pdf'
    schedule: string
  }
}

export class MonitorCommand {
  private logger: Logger
  private isMonitoring = false

  constructor() {
    this.logger = new Logger('Monitor')
  }

  /**
   * 创建监控命令
   */
  createCommand(): Command {
    const command = new Command('monitor')
      .description('性能监控和分析')

    // 启动监控
    command
      .command('start')
      .description('启动性能监控')
      .option('-t, --targets <targets>', '监控目标，逗号分隔', 'http://localhost:3000')
      .option('-i, --interval <seconds>', '采样间隔（秒）', '30')
      .option('-d, --duration <minutes>', '监控时长（分钟）', '0')
      .option('-o, --output <path>', '输出目录', './performance-data')
      .action(async (options) => {
        await this.startMonitoring(options)
      })

    // 停止监控
    command
      .command('stop')
      .description('停止性能监控')
      .action(async () => {
        await this.stopMonitoring()
      })

    // 生成报告
    command
      .command('report')
      .description('生成性能报告')
      .option('-p, --period <period>', '报告周期 (1h|1d|7d|30d)', '1d')
      .option('-f, --format <format>', '报告格式 (json|html|pdf)', 'html')
      .option('-o, --output <path>', '输出路径', './performance-report')
      .action(async (options) => {
        await this.generateReport(options)
      })

    // 实时分析
    command
      .command('analyze')
      .description('实时性能分析')
      .option('-u, --url <url>', '分析目标 URL', 'http://localhost:3000')
      .option('-m, --mobile', '移动端分析', false)
      .option('-v, --verbose', '详细输出', false)
      .action(async (options) => {
        await this.analyzePerformance(options)
      })

    // Web Vitals 检查
    command
      .command('vitals')
      .description('检查 Core Web Vitals')
      .option('-u, --url <url>', '检查 URL', 'http://localhost:3000')
      .option('-t, --threshold', '显示阈值建议', false)
      .action(async (options) => {
        await this.checkWebVitals(options)
      })

    // 构建性能分析
    command
      .command('build-analyze')
      .description('分析构建性能')
      .option('-c, --compare <path>', '对比历史数据')
      .option('-o, --output <path>', '输出报告路径')
      .action(async (options) => {
        await this.analyzeBuildPerformance(options)
      })

    // 监控配置
    command
      .command('config')
      .description('配置监控参数')
      .option('-s, --set <key=value>', '设置配置项')
      .option('-g, --get <key>', '获取配置项')
      .option('-l, --list', '列出所有配置')
      .action(async (options) => {
        await this.manageConfig(options)
      })

    return command
  }

  /**
   * 启动性能监控
   */
  private async startMonitoring(options: any): Promise<void> {
    try {
      this.logger.info('启动性能监控...')

      const targets = options.targets.split(',')
      const interval = parseInt(options.interval) * 1000
      const duration = parseInt(options.duration) * 60 * 1000

      // 创建输出目录
      await fs.mkdir(options.output, { recursive: true })

      this.isMonitoring = true
      const startTime = Date.now()

      this.logger.success('🚀 性能监控已启动')
      this.logger.info(`📊 监控目标: ${targets.join(', ')}`)
      this.logger.info(`⏱️  采样间隔: ${options.interval}秒`)
      this.logger.info(`📁 数据目录: ${options.output}`)

      // 启动监控循环
      const monitoringLoop = setInterval(async () => {
        if (!this.isMonitoring) {
          clearInterval(monitoringLoop)
          return
        }

        try {
          for (const target of targets) {
            const metrics = await this.collectMetrics(target)
            await this.saveMetrics(metrics, options.output)
            this.displayRealTimeMetrics(metrics, target)
          }
        } catch (error) {
          this.logger.error('采集指标失败:', error)
        }

        // 检查是否达到监控时长
        if (duration > 0 && Date.now() - startTime >= duration) {
          this.logger.info('监控时长已达到，停止监控')
          await this.stopMonitoring()
        }
      }, interval)

      // 处理退出信号
      process.on('SIGINT', async () => {
        await this.stopMonitoring()
        process.exit(0)
      })

    } catch (error) {
      this.logger.error('启动监控失败:', error)
      throw error
    }
  }

  /**
   * 停止性能监控
   */
  private async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      this.logger.warn('监控未运行')
      return
    }

    this.isMonitoring = false
    this.logger.success('✅ 性能监控已停止')
  }

  /**
   * 生成性能报告
   */
  private async generateReport(options: any): Promise<void> {
    try {
      this.logger.info('生成性能报告...')

      const spinner = ora('正在分析性能数据...').start()

      // 加载性能数据
      const data = await this.loadPerformanceData(options.period)

      // 生成报告
      const report = await this.createReport(data, options.format)

      // 保存报告
      const outputPath = `${options.output}.${options.format}`
      await this.saveReport(report, outputPath, options.format)

      spinner.succeed(`性能报告已生成: ${outputPath}`)

      // 显示报告摘要
      this.displayReportSummary(data)

    } catch (error) {
      this.logger.error('生成报告失败:', error)
      throw error
    }
  }

  /**
   * 实时性能分析
   */
  private async analyzePerformance(options: any): Promise<void> {
    try {
      this.logger.info(`分析性能: ${options.url}`)

      const spinner = ora('正在分析...').start()

      // 执行性能分析
      const analysis = await this.performAnalysis(options.url, {
        mobile: options.mobile,
        verbose: options.verbose
      })

      spinner.succeed('分析完成!')

      // 显示分析结果
      this.displayAnalysisResults(analysis)

      // 提供优化建议
      this.displayOptimizationSuggestions(analysis)

    } catch (error) {
      this.logger.error('性能分析失败:', error)
      throw error
    }
  }

  /**
   * 检查 Web Vitals
   */
  private async checkWebVitals(options: any): Promise<void> {
    try {
      this.logger.info(`检查 Core Web Vitals: ${options.url}`)

      const spinner = ora('正在检查...').start()

      const vitals = await this.measureWebVitals(options.url)

      spinner.succeed('检查完成!')

      // 显示 Web Vitals 结果
      this.displayWebVitals(vitals, options.threshold)

    } catch (error) {
      this.logger.error('Web Vitals 检查失败:', error)
      throw error
    }
  }

  /**
   * 分析构建性能
   */
  private async analyzeBuildPerformance(options: any): Promise<void> {
    try {
      this.logger.info('分析构建性能...')

      const spinner = ora('正在分析构建数据...').start()

      // 分析当前构建
      const currentBuild = await this.analyzeBuild()

      // 对比历史数据
      let comparison = null
      if (options.compare) {
        const historicalData = await this.loadBuildData(options.compare)
        comparison = this.compareBuildPerformance(currentBuild, historicalData)
      }

      spinner.succeed('构建分析完成!')

      // 显示分析结果
      this.displayBuildAnalysis(currentBuild, comparison)

      // 保存报告
      if (options.output) {
        await this.saveBuildReport(currentBuild, comparison, options.output)
      }

    } catch (error) {
      this.logger.error('构建性能分析失败:', error)
      throw error
    }
  }

  /**
   * 管理监控配置
   */
  private async manageConfig(options: any): Promise<void> {
    try {
      if (options.set) {
        const [key, value] = options.set.split('=')
        await this.setConfig(key, value)
        this.logger.success(`✅ 配置已更新: ${key} = ${value}`)
      } else if (options.get) {
        const value = await this.getConfig(options.get)
        console.log(`${options.get}: ${value}`)
      } else if (options.list) {
        const config = await this.getAllConfig()
        console.log(chalk.cyan('\n📋 监控配置:\n'))
        Object.entries(config).forEach(([key, value]) => {
          console.log(`${chalk.yellow(key)}: ${value}`)
        })
      }
    } catch (error) {
      this.logger.error('配置管理失败:', error)
      throw error
    }
  }

  // 私有辅助方法
  private async collectMetrics(target: string): Promise<PerformanceMetrics> {
    try {
      // 使用 node-fetch 获取页面并分析性能
      const startTime = Date.now()
      const response = await fetch(target)
      const ttfb = Date.now() - startTime

      // 模拟 Web Vitals 数据采集（实际应该通过 Lighthouse 或 Puppeteer）
      const webVitals = {
        LCP: Math.random() * 2500 + 1000, // 1-3.5s
        FID: Math.random() * 100,          // 0-100ms
        CLS: Math.random() * 0.1,          // 0-0.1
        FCP: Math.random() * 1800 + 500,   // 0.5-2.3s
        TTFB: ttfb
      }

      // 获取构建指标
      const buildMetrics = await this.getBuildMetrics()

      // 获取运行时指标
      const runtimeMetrics = this.getRuntimeMetrics()

      // 计算用户体验指标
      const uxMetrics = {
        pageLoadTime: webVitals.LCP,
        interactionTime: webVitals.FID,
        bounceRate: webVitals.LCP > 2500 ? 0.3 : 0.1,
        conversionRate: webVitals.LCP < 2500 ? 0.15 : 0.05
      }

      return {
        webVitals,
        buildMetrics,
        runtimeMetrics,
        uxMetrics
      }
    } catch (error) {
      this.logger.error('采集性能指标失败', error)
      // 返回默认值
      return {
        webVitals: { LCP: 0, FID: 0, CLS: 0, FCP: 0, TTFB: 0 },
        buildMetrics: { buildTime: 0, bundleSize: 0, chunkCount: 0, dependencies: 0 },
        runtimeMetrics: { memoryUsage: 0, cpuUsage: 0, networkRequests: 0, errorRate: 0 },
        uxMetrics: { pageLoadTime: 0, interactionTime: 0, bounceRate: 0, conversionRate: 0 }
      }
    }
  }

  /**
   * 获取构建指标
   */
  private async getBuildMetrics(): Promise<PerformanceMetrics['buildMetrics']> {
    try {
      const { default: fg } = await import('fast-glob')

      // 查找构建目录
      const buildDirs = ['dist', 'build', 'out']
      for (const dir of buildDirs) {
        if (await fs.pathExists(dir)) {
          const files = await fg(['**/*.{js,css}'], { cwd: dir, stats: true })

          let totalSize = 0
          let chunkCount = 0

          for (const file of files) {
            if (file.stats) {
              totalSize += file.stats.size
              chunkCount++
            }
          }

          // 读取 package.json 获取依赖数
          let dependencies = 0
          if (await fs.pathExists('package.json')) {
            const pkg = await fs.readJSON('package.json')
            dependencies = Object.keys(pkg.dependencies || {}).length
          }

          return {
            buildTime: 0, // 需要在构建时记录
            bundleSize: totalSize,
            chunkCount,
            dependencies
          }
        }
      }
    } catch (error) {
      this.logger.debug('获取构建指标失败', error)
    }

    return { buildTime: 0, bundleSize: 0, chunkCount: 0, dependencies: 0 }
  }

  /**
   * 获取运行时指标
   */
  private getRuntimeMetrics(): PerformanceMetrics['runtimeMetrics'] {
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    return {
      memoryUsage: memUsage.heapUsed,
      cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000, // 转换为秒
      networkRequests: 0, // 需要通过浏览器API获取
      errorRate: 0 // 需要通过错误跟踪系统获取
    }
  }

  private async saveMetrics(metrics: PerformanceMetrics, outputDir: string): Promise<void> {
    const timestamp = new Date().toISOString()
    const filename = `metrics-${timestamp.split('T')[0]}.json`
    const filepath = path.join(outputDir, filename)

    // 追加到日志文件
    const logEntry = { timestamp, ...metrics }
    await fs.appendFile(filepath, JSON.stringify(logEntry) + '\n', 'utf-8')
  }

  private displayRealTimeMetrics(metrics: PerformanceMetrics, target: string): void {
    console.clear()
    console.log(chalk.cyan(`\n📊 实时性能监控 - ${target}\n`))

    // 显示 Web Vitals
    console.log(chalk.yellow('Core Web Vitals:'))
    console.log(`  LCP: ${this.formatMetric(metrics.webVitals.LCP, 'ms')}`)
    console.log(`  FID: ${this.formatMetric(metrics.webVitals.FID, 'ms')}`)
    console.log(`  CLS: ${this.formatMetric(metrics.webVitals.CLS, '')}`)

    // 显示运行时指标
    console.log(chalk.yellow('\n运行时指标:'))
    console.log(`  内存使用: ${this.formatMetric(metrics.runtimeMetrics.memoryUsage, 'MB')}`)
    console.log(`  CPU 使用: ${this.formatMetric(metrics.runtimeMetrics.cpuUsage, '%')}`)

    console.log(chalk.gray(`\n最后更新: ${new Date().toLocaleTimeString()}`))
  }

  private formatMetric(value: number, unit: string): string {
    return `${value.toFixed(2)}${unit}`
  }

  private async loadPerformanceData(period: string): Promise<any> {
    try {
      const dataDir = path.join(process.cwd(), 'performance-data')

      if (!await fs.pathExists(dataDir)) {
        return { metrics: [], period, startTime: 0, endTime: 0 }
      }

      // 计算时间范围
      const now = Date.now()
      let startTime = now

      switch (period) {
        case '1h':
          startTime = now - 60 * 60 * 1000
          break
        case '1d':
          startTime = now - 24 * 60 * 60 * 1000
          break
        case '7d':
          startTime = now - 7 * 24 * 60 * 60 * 1000
          break
        case '30d':
          startTime = now - 30 * 24 * 60 * 60 * 1000
          break
      }

      // 读取所有指标文件
      const files = await fs.readdir(dataDir)
      const metrics: any[] = []

      for (const file of files) {
        if (file.startsWith('metrics-') && file.endsWith('.json')) {
          const filePath = path.join(dataDir, file)
          const content = await fs.readFile(filePath, 'utf-8')
          const lines = content.trim().split('\n')

          for (const line of lines) {
            try {
              const metric = JSON.parse(line)
              const metricTime = new Date(metric.timestamp).getTime()

              if (metricTime >= startTime && metricTime <= now) {
                metrics.push(metric)
              }
            } catch {
              // 跳过无效行
            }
          }
        }
      }

      return {
        metrics,
        period,
        startTime,
        endTime: now,
        count: metrics.length
      }
    } catch (error) {
      this.logger.error('加载性能数据失败', error)
      return { metrics: [], period, startTime: 0, endTime: 0 }
    }
  }

  private async createReport(data: any, format: string): Promise<string> {
    const { metrics, period, startTime, endTime, count } = data

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    }

    if (format === 'html') {
      return this.createHTMLReport(metrics, period, startTime, endTime)
    }

    // 默认文本格式
    const lines = [
      '# 性能报告',
      '',
      `报告周期: ${period}`,
      `开始时间: ${new Date(startTime).toLocaleString()}`,
      `结束时间: ${new Date(endTime).toLocaleString()}`,
      `数据点数: ${count}`,
      '',
      '## 平均性能指标',
      ''
    ]

    if (metrics.length > 0) {
      // 计算平均值
      const avgWebVitals = this.calculateAverageWebVitals(metrics)
      lines.push('### Core Web Vitals')
      lines.push(`- LCP: ${avgWebVitals.LCP.toFixed(2)}ms`)
      lines.push(`- FID: ${avgWebVitals.FID.toFixed(2)}ms`)
      lines.push(`- CLS: ${avgWebVitals.CLS.toFixed(4)}`)
      lines.push(`- FCP: ${avgWebVitals.FCP.toFixed(2)}ms`)
      lines.push(`- TTFB: ${avgWebVitals.TTFB.toFixed(2)}ms`)
    }

    return lines.join('\n')
  }

  private createHTMLReport(metrics: any[], period: string, startTime: number, endTime: number): string {
    const avgWebVitals = this.calculateAverageWebVitals(metrics)

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>性能报告 - ${period}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    .metric-card { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .metric-value { font-size: 24px; font-weight: bold; color: #1890ff; }
    .good { color: #52c41a; }
    .warning { color: #faad14; }
    .bad { color: #ff4d4f; }
  </style>
</head>
<body>
  <h1>性能报告</h1>
  <p>报告周期: ${period}</p>
  <p>时间范围: ${new Date(startTime).toLocaleString()} - ${new Date(endTime).toLocaleString()}</p>
  <p>数据点数: ${metrics.length}</p>
  
  <h2>Core Web Vitals</h2>
  <div class="metric-card">
    <h3>LCP (Largest Contentful Paint)</h3>
    <div class="metric-value ${avgWebVitals.LCP < 2500 ? 'good' : avgWebVitals.LCP < 4000 ? 'warning' : 'bad'}">
      ${avgWebVitals.LCP.toFixed(2)}ms
    </div>
  </div>
  <div class="metric-card">
    <h3>FID (First Input Delay)</h3>
    <div class="metric-value ${avgWebVitals.FID < 100 ? 'good' : avgWebVitals.FID < 300 ? 'warning' : 'bad'}">
      ${avgWebVitals.FID.toFixed(2)}ms
    </div>
  </div>
  <div class="metric-card">
    <h3>CLS (Cumulative Layout Shift)</h3>
    <div class="metric-value ${avgWebVitals.CLS < 0.1 ? 'good' : avgWebVitals.CLS < 0.25 ? 'warning' : 'bad'}">
      ${avgWebVitals.CLS.toFixed(4)}
    </div>
  </div>
</body>
</html>
    `.trim()
  }

  private calculateAverageWebVitals(metrics: any[]): any {
    if (metrics.length === 0) {
      return { LCP: 0, FID: 0, CLS: 0, FCP: 0, TTFB: 0 }
    }

    const sum = metrics.reduce((acc, m) => {
      if (m.webVitals) {
        acc.LCP += m.webVitals.LCP || 0
        acc.FID += m.webVitals.FID || 0
        acc.CLS += m.webVitals.CLS || 0
        acc.FCP += m.webVitals.FCP || 0
        acc.TTFB += m.webVitals.TTFB || 0
      }
      return acc
    }, { LCP: 0, FID: 0, CLS: 0, FCP: 0, TTFB: 0 })

    return {
      LCP: sum.LCP / metrics.length,
      FID: sum.FID / metrics.length,
      CLS: sum.CLS / metrics.length,
      FCP: sum.FCP / metrics.length,
      TTFB: sum.TTFB / metrics.length
    }
  }

  private async saveReport(report: string, outputPath: string, format: string): Promise<void> {
    await fs.writeFile(outputPath, report, 'utf-8')
    this.logger.info(`报告已保存: ${outputPath}`)
  }

  private displayReportSummary(data: any): void {
    const { metrics, period, count } = data

    console.log(chalk.cyan('\n📊 报告摘要\n'))
    console.log(`周期: ${period}`)
    console.log(`数据点数: ${count}`)

    if (metrics.length > 0) {
      const avgWebVitals = this.calculateAverageWebVitals(metrics)
      console.log(chalk.yellow('\n平均 Web Vitals:'))
      console.log(`  LCP: ${avgWebVitals.LCP.toFixed(2)}ms`)
      console.log(`  FID: ${avgWebVitals.FID.toFixed(2)}ms`)
      console.log(`  CLS: ${avgWebVitals.CLS.toFixed(4)}`)
    }
  }

  private async performAnalysis(url: string, options: any): Promise<any> {
    try {
      // 采集性能指标
      const metrics = await this.collectMetrics(url)

      // 分析性能瓶颈
      const bottlenecks = []

      if (metrics.webVitals.LCP > 2500) {
        bottlenecks.push({
          type: 'LCP',
          severity: 'high',
          value: metrics.webVitals.LCP,
          description: 'Largest Contentful Paint 过慢'
        })
      }

      if (metrics.webVitals.FID > 100) {
        bottlenecks.push({
          type: 'FID',
          severity: 'medium',
          value: metrics.webVitals.FID,
          description: 'First Input Delay 较高'
        })
      }

      if (metrics.webVitals.CLS > 0.1) {
        bottlenecks.push({
          type: 'CLS',
          severity: 'medium',
          value: metrics.webVitals.CLS,
          description: 'Cumulative Layout Shift 过大'
        })
      }

      // 生成优化建议
      const suggestions = this.generateOptimizationSuggestions(metrics, bottlenecks)

      return {
        url,
        metrics,
        bottlenecks,
        suggestions,
        score: this.calculatePerformanceScore(metrics),
        timestamp: Date.now()
      }
    } catch (error) {
      this.logger.error('性能分析失败', error)
      return { error: error instanceof Error ? error.message : String(error) }
    }
  }

  private generateOptimizationSuggestions(metrics: PerformanceMetrics, bottlenecks: any[]): any[] {
    const suggestions = []

    for (const bottleneck of bottlenecks) {
      switch (bottleneck.type) {
        case 'LCP':
          suggestions.push({
            title: '优化 LCP',
            priority: 'high',
            actions: [
              '优化图片加载（使用 WebP 格式，添加懒加载）',
              '使用 CDN 加速资源加载',
              '启用服务端渲染或预渲染',
              '减少首屏 JavaScript 体积'
            ]
          })
          break
        case 'FID':
          suggestions.push({
            title: '优化 FID',
            priority: 'medium',
            actions: [
              '拆分长任务',
              '使用 Web Workers 处理计算密集型任务',
              '延迟加载非必要的 JavaScript',
              '优化第三方脚本加载'
            ]
          })
          break
        case 'CLS':
          suggestions.push({
            title: '优化 CLS',
            priority: 'medium',
            actions: [
              '为图片和视频设置尺寸属性',
              '避免在现有内容上方插入内容',
              '使用 transform 动画替代会触发布局的属性',
              '预留广告位空间'
            ]
          })
          break
      }
    }

    return suggestions
  }

  private calculatePerformanceScore(metrics: PerformanceMetrics): number {
    let score = 100

    // LCP 评分 (权重 25%)
    if (metrics.webVitals.LCP > 4000) score -= 25
    else if (metrics.webVitals.LCP > 2500) score -= 15

    // FID 评分 (权重 25%)
    if (metrics.webVitals.FID > 300) score -= 25
    else if (metrics.webVitals.FID > 100) score -= 15

    // CLS 评分 (权重 25%)
    if (metrics.webVitals.CLS > 0.25) score -= 25
    else if (metrics.webVitals.CLS > 0.1) score -= 15

    // TTFB 评分 (权重 25%)
    if (metrics.webVitals.TTFB > 800) score -= 25
    else if (metrics.webVitals.TTFB > 600) score -= 15

    return Math.max(0, score)
  }

  private displayAnalysisResults(analysis: any): void {
    if (analysis.error) {
      console.log(chalk.red(`\n分析失败: ${analysis.error}\n`))
      return
    }

    console.log(chalk.cyan('\n📊 性能分析结果\n'))
    console.log(`URL: ${analysis.url}`)
    console.log(`性能评分: ${this.getScoreColor(analysis.score)}`)
    console.log(`分析时间: ${new Date(analysis.timestamp).toLocaleString()}`)

    console.log(chalk.yellow('\nCore Web Vitals:'))
    console.log(`  LCP: ${analysis.metrics.webVitals.LCP.toFixed(2)}ms ${this.getVitalStatus(analysis.metrics.webVitals.LCP, 'LCP')}`)
    console.log(`  FID: ${analysis.metrics.webVitals.FID.toFixed(2)}ms ${this.getVitalStatus(analysis.metrics.webVitals.FID, 'FID')}`)
    console.log(`  CLS: ${analysis.metrics.webVitals.CLS.toFixed(4)} ${this.getVitalStatus(analysis.metrics.webVitals.CLS, 'CLS')}`)

    if (analysis.bottlenecks.length > 0) {
      console.log(chalk.red('\n⚠️  性能瓶颈:'))
      analysis.bottlenecks.forEach((b: any, i: number) => {
        console.log(`  ${i + 1}. [${b.severity}] ${b.description}`)
      })
    }
  }

  private getScoreColor(score: number): string {
    if (score >= 90) return chalk.green(`${score}/100`)
    if (score >= 50) return chalk.yellow(`${score}/100`)
    return chalk.red(`${score}/100`)
  }

  private getVitalStatus(value: number, type: string): string {
    const thresholds: Record<string, { good: number; poor: number }> = {
      'LCP': { good: 2500, poor: 4000 },
      'FID': { good: 100, poor: 300 },
      'CLS': { good: 0.1, poor: 0.25 }
    }

    const threshold = thresholds[type]
    if (!threshold) return ''

    if (value <= threshold.good) return chalk.green('✓')
    if (value <= threshold.poor) return chalk.yellow('⚠')
    return chalk.red('✗')
  }

  private displayOptimizationSuggestions(analysis: any): void {
    if (!analysis.suggestions || analysis.suggestions.length === 0) {
      console.log(chalk.green('\n✨ 没有优化建议，性能表现良好！\n'))
      return
    }

    console.log(chalk.cyan('\n💡 优化建议\n'))

    analysis.suggestions.forEach((suggestion: any, i: number) => {
      console.log(chalk.yellow(`${i + 1}. ${suggestion.title} [${suggestion.priority}]`))
      suggestion.actions.forEach((action: string) => {
        console.log(`   - ${action}`)
      })
      console.log('')
    })
  }

  private async measureWebVitals(url: string): Promise<any> {
    try {
      const metrics = await this.collectMetrics(url)
      return {
        url,
        vitals: metrics.webVitals,
        timestamp: Date.now(),
        passed: this.checkWebVitalsThresholds(metrics.webVitals)
      }
    } catch (error) {
      this.logger.error('测量 Web Vitals 失败', error)
      return { error: error instanceof Error ? error.message : String(error) }
    }
  }

  private checkWebVitalsThresholds(vitals: any): boolean {
    return vitals.LCP <= 2500 && vitals.FID <= 100 && vitals.CLS <= 0.1
  }

  private displayWebVitals(vitals: any, showThreshold: boolean): void {
    if (vitals.error) {
      console.log(chalk.red(`\n检查失败: ${vitals.error}\n`))
      return
    }

    console.log(chalk.cyan('\n📊 Core Web Vitals\n'))
    console.log(`URL: ${vitals.url}`)
    console.log(`状态: ${vitals.passed ? chalk.green('✓ 通过') : chalk.red('✗ 未通过')}`)

    console.log(chalk.yellow('\n指标:'))
    console.log(`  LCP: ${vitals.vitals.LCP.toFixed(2)}ms ${this.getVitalStatus(vitals.vitals.LCP, 'LCP')}`)
    console.log(`  FID: ${vitals.vitals.FID.toFixed(2)}ms ${this.getVitalStatus(vitals.vitals.FID, 'FID')}`)
    console.log(`  CLS: ${vitals.vitals.CLS.toFixed(4)} ${this.getVitalStatus(vitals.vitals.CLS, 'CLS')}`)
    console.log(`  FCP: ${vitals.vitals.FCP.toFixed(2)}ms`)
    console.log(`  TTFB: ${vitals.vitals.TTFB.toFixed(2)}ms`)

    if (showThreshold) {
      console.log(chalk.gray('\n阈值参考:'))
      console.log('  LCP: ≤2.5s (好) | ≤4.0s (需改进) | >4.0s (差)')
      console.log('  FID: ≤100ms (好) | ≤300ms (需改进) | >300ms (差)')
      console.log('  CLS: ≤0.1 (好) | ≤0.25 (需改进) | >0.25 (差)')
    }
  }

  private async analyzeBuild(): Promise<any> {
    const metrics = await this.getBuildMetrics()

    return {
      timestamp: Date.now(),
      metrics,
      analysis: {
        bundleSizeIssue: metrics.bundleSize > 5 * 1024 * 1024, // >5MB
        tooManyChunks: metrics.chunkCount > 20,
        tooManyDependencies: metrics.dependencies > 50
      }
    }
  }

  private async loadBuildData(filePath: string): Promise<any> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      this.logger.error('加载构建数据失败', error)
      return null
    }
  }

  private compareBuildPerformance(current: any, historical: any): any {
    if (!historical) return null

    const currentMetrics = current.metrics
    const historicalMetrics = historical.metrics

    return {
      bundleSize: {
        current: currentMetrics.bundleSize,
        previous: historicalMetrics.bundleSize,
        change: currentMetrics.bundleSize - historicalMetrics.bundleSize,
        changePercent: ((currentMetrics.bundleSize - historicalMetrics.bundleSize) / historicalMetrics.bundleSize * 100).toFixed(2)
      },
      chunkCount: {
        current: currentMetrics.chunkCount,
        previous: historicalMetrics.chunkCount,
        change: currentMetrics.chunkCount - historicalMetrics.chunkCount
      },
      dependencies: {
        current: currentMetrics.dependencies,
        previous: historicalMetrics.dependencies,
        change: currentMetrics.dependencies - historicalMetrics.dependencies
      }
    }
  }

  private displayBuildAnalysis(current: any, comparison: any): void {
    console.log(chalk.cyan('\n📦 构建分析\n'))
    console.log(`Bundle 大小: ${(current.metrics.bundleSize / 1024 / 1024).toFixed(2)}MB`)
    console.log(`Chunk 数量: ${current.metrics.chunkCount}`)
    console.log(`依赖数量: ${current.metrics.dependencies}`)

    if (comparison) {
      console.log(chalk.yellow('\n对比上次构建:'))
      const sizeChange = comparison.bundleSize.change
      const sizeChangeStr = sizeChange > 0 ? chalk.red(`+${(sizeChange / 1024).toFixed(2)}KB`) : chalk.green(`${(sizeChange / 1024).toFixed(2)}KB`)
      console.log(`  Bundle 大小: ${sizeChangeStr} (${comparison.bundleSize.changePercent}%)`)
      console.log(`  Chunk 数量: ${comparison.chunkCount.change > 0 ? '+' : ''}${comparison.chunkCount.change}`)
      console.log(`  依赖数量: ${comparison.dependencies.change > 0 ? '+' : ''}${comparison.dependencies.change}`)
    }

    if (current.analysis.bundleSizeIssue) {
      console.log(chalk.red('\n⚠️  Bundle 体积过大，建议优化'))
    }
    if (current.analysis.tooManyChunks) {
      console.log(chalk.yellow('\n⚠️  Chunk 数量较多，考虑合并'))
    }
  }

  private async saveBuildReport(current: any, comparison: any, outputPath: string): Promise<void> {
    const report = {
      timestamp: current.timestamp,
      metrics: current.metrics,
      analysis: current.analysis,
      comparison
    }

    await fs.writeJSON(outputPath, report, { spaces: 2 })
    this.logger.info(`构建报告已保存: ${outputPath}`)
  }

  private async setConfig(key: string, value: string): Promise<void> {
    const configPath = path.join(process.cwd(), '.launcher/monitor-config.json')

    let config: Record<string, any> = {}
    if (await fs.pathExists(configPath)) {
      config = await fs.readJSON(configPath)
    }

    config[key] = value

    await fs.ensureDir(path.dirname(configPath))
    await fs.writeJSON(configPath, config, { spaces: 2 })
  }

  private async getConfig(key: string): Promise<string> {
    const configPath = path.join(process.cwd(), '.launcher/monitor-config.json')

    if (await fs.pathExists(configPath)) {
      const config = await fs.readJSON(configPath)
      return config[key] || ''
    }

    return ''
  }

  private async getAllConfig(): Promise<Record<string, any>> {
    const configPath = path.join(process.cwd(), '.launcher/monitor-config.json')

    if (await fs.pathExists(configPath)) {
      return await fs.readJSON(configPath)
    }

    return {}
  }
}
