/**
 * Bundle 分析器
 *
 * 提供可视化的构建产物分析报告
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import path from 'node:path'
import { gzipSync } from 'node:zlib'
import chalk from 'chalk'
import fs from 'fs-extra'

/**
 * 文件信息
 */
export interface FileInfo {
  name: string
  path: string
  size: number
  gzipSize: number
  type: 'js' | 'css' | 'html' | 'image' | 'font' | 'other'
  isEntry?: boolean
  isChunk?: boolean
}

/**
 * 分析结果
 */
export interface AnalyzeResult {
  totalSize: number
  totalGzipSize: number
  files: FileInfo[]
  byType: Record<string, { count: number, size: number, gzipSize: number }>
  largestFiles: FileInfo[]
  timestamp: number
  buildDir: string
}

/**
 * 性能预算
 */
export interface PerformanceBudget {
  maxTotalSize?: number // 总大小限制 (bytes)
  maxJsSize?: number // JS 总大小限制
  maxCssSize?: number // CSS 总大小限制
  maxAssetSize?: number // 单个资源大小限制
  maxEntrySize?: number // 入口文件大小限制
  warnThreshold?: number // 警告阈值 (0-1)
}

/**
 * 预算检查结果
 */
export interface BudgetCheckResult {
  passed: boolean
  violations: Array<{
    type: 'error' | 'warn'
    message: string
    actual: number
    limit: number
  }>
}

/**
 * Bundle 分析器
 */
export class BundleAnalyzer {
  private buildDir: string
  private budget?: PerformanceBudget

  constructor(buildDir: string, budget?: PerformanceBudget) {
    this.buildDir = buildDir
    this.budget = budget
  }

  /**
   * 分析构建目录
   */
  async analyze(): Promise<AnalyzeResult> {
    const files: FileInfo[] = []
    await this.scanDirectory(this.buildDir, files)

    // 按类型分组统计
    const byType: Record<string, { count: number, size: number, gzipSize: number }> = {}
    let totalSize = 0
    let totalGzipSize = 0

    for (const file of files) {
      totalSize += file.size
      totalGzipSize += file.gzipSize

      if (!byType[file.type]) {
        byType[file.type] = { count: 0, size: 0, gzipSize: 0 }
      }
      byType[file.type].count++
      byType[file.type].size += file.size
      byType[file.type].gzipSize += file.gzipSize
    }

    // 找出最大的文件
    const largestFiles = [...files]
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)

    return {
      totalSize,
      totalGzipSize,
      files,
      byType,
      largestFiles,
      timestamp: Date.now(),
      buildDir: this.buildDir,
    }
  }

  /**
   * 递归扫描目录
   */
  private async scanDirectory(dir: string, files: FileInfo[]): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath, files)
      }
      else {
        const stat = await fs.stat(fullPath)
        const content = await fs.readFile(fullPath)
        const gzipSize = gzipSync(content).length
        const relativePath = path.relative(this.buildDir, fullPath)

        files.push({
          name: entry.name,
          path: relativePath,
          size: stat.size,
          gzipSize,
          type: this.getFileType(entry.name),
          isEntry: this.isEntryFile(relativePath),
          isChunk: this.isChunkFile(relativePath),
        })
      }
    }
  }

  /**
   * 获取文件类型
   */
  private getFileType(filename: string): FileInfo['type'] {
    const ext = path.extname(filename).toLowerCase()
    if (['.js', '.mjs', '.cjs'].includes(ext))
      return 'js'
    if (['.css', '.scss', '.less'].includes(ext))
      return 'css'
    if (['.html', '.htm'].includes(ext))
      return 'html'
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'].includes(ext))
      return 'image'
    if (['.woff', '.woff2', '.ttf', '.eot', '.otf'].includes(ext))
      return 'font'
    return 'other'
  }

  /**
   * 判断是否为入口文件
   */
  private isEntryFile(relativePath: string): boolean {
    return /^(index|main|app)\.[jt]sx?$/.test(path.basename(relativePath))
      || relativePath.includes('entry')
  }

  /**
   * 判断是否为 chunk 文件
   */
  private isChunkFile(relativePath: string): boolean {
    return /\.[a-f0-9]{8}\./.test(relativePath)
      || relativePath.includes('chunk')
  }

  /**
   * 检查性能预算
   */
  checkBudget(result: AnalyzeResult): BudgetCheckResult {
    const violations: BudgetCheckResult['violations'] = []
    const warnThreshold = this.budget?.warnThreshold ?? 0.8

    if (!this.budget) {
      return { passed: true, violations: [] }
    }

    // 检查总大小
    if (this.budget.maxTotalSize) {
      if (result.totalSize > this.budget.maxTotalSize) {
        violations.push({
          type: 'error',
          message: '总构建大小超出预算',
          actual: result.totalSize,
          limit: this.budget.maxTotalSize,
        })
      }
      else if (result.totalSize > this.budget.maxTotalSize * warnThreshold) {
        violations.push({
          type: 'warn',
          message: '总构建大小接近预算限制',
          actual: result.totalSize,
          limit: this.budget.maxTotalSize,
        })
      }
    }

    // 检查 JS 大小
    if (this.budget.maxJsSize && result.byType.js) {
      if (result.byType.js.size > this.budget.maxJsSize) {
        violations.push({
          type: 'error',
          message: 'JavaScript 总大小超出预算',
          actual: result.byType.js.size,
          limit: this.budget.maxJsSize,
        })
      }
    }

    // 检查 CSS 大小
    if (this.budget.maxCssSize && result.byType.css) {
      if (result.byType.css.size > this.budget.maxCssSize) {
        violations.push({
          type: 'error',
          message: 'CSS 总大小超出预算',
          actual: result.byType.css.size,
          limit: this.budget.maxCssSize,
        })
      }
    }

    // 检查单个资源大小
    if (this.budget.maxAssetSize) {
      for (const file of result.files) {
        if (file.size > this.budget.maxAssetSize) {
          violations.push({
            type: 'error',
            message: `文件 ${file.path} 超出单个资源大小限制`,
            actual: file.size,
            limit: this.budget.maxAssetSize,
          })
        }
      }
    }

    // 检查入口文件大小
    if (this.budget.maxEntrySize) {
      for (const file of result.files.filter(f => f.isEntry)) {
        if (file.size > this.budget.maxEntrySize) {
          violations.push({
            type: 'error',
            message: `入口文件 ${file.path} 超出大小限制`,
            actual: file.size,
            limit: this.budget.maxEntrySize,
          })
        }
      }
    }

    return {
      passed: violations.filter(v => v.type === 'error').length === 0,
      violations,
    }
  }

  /**
   * 生成控制台报告
   */
  printReport(result: AnalyzeResult): void {
    console.log(`\n${chalk.bold.cyan('📊 构建分析报告')}\n`)
    console.log(chalk.gray('─'.repeat(60)))

    // 总体统计
    console.log(chalk.bold('📦 总体统计:'))
    console.log(`   文件数量: ${chalk.cyan(result.files.length)} 个`)
    console.log(`   原始大小: ${chalk.yellow(this.formatSize(result.totalSize))}`)
    console.log(`   Gzip 大小: ${chalk.green(this.formatSize(result.totalGzipSize))}`)
    console.log(`   压缩率: ${chalk.cyan(((1 - result.totalGzipSize / result.totalSize) * 100).toFixed(1))}%`)
    console.log()

    // 按类型统计
    console.log(chalk.bold('📁 按类型统计:'))
    const typeOrder = ['js', 'css', 'html', 'image', 'font', 'other']
    const typeIcons: Record<string, string> = {
      js: '📜',
      css: '🎨',
      html: '📄',
      image: '🖼️',
      font: '🔤',
      other: '📎',
    }

    for (const type of typeOrder) {
      const info = result.byType[type]
      if (info) {
        const percentage = ((info.size / result.totalSize) * 100).toFixed(1)
        console.log(`   ${typeIcons[type]} ${type.toUpperCase().padEnd(6)} ${String(info.count).padStart(4)} 文件  ${this.formatSize(info.size).padStart(10)}  (${percentage}%)`)
      }
    }
    console.log()

    // 最大文件
    console.log(chalk.bold('📈 最大文件 (Top 10):'))
    for (const file of result.largestFiles) {
      const sizeStr = this.formatSize(file.size).padStart(10)
      const gzipStr = this.formatSize(file.gzipSize).padStart(10)
      const tag = file.isEntry ? chalk.yellow(' [entry]') : file.isChunk ? chalk.gray(' [chunk]') : ''
      console.log(`   ${sizeStr} → ${gzipStr}  ${chalk.gray(file.path)}${tag}`)
    }

    console.log(`\n${chalk.gray('─'.repeat(60))}`)
  }

  /**
   * 打印预算检查结果
   */
  printBudgetResult(result: BudgetCheckResult): void {
    if (result.violations.length === 0) {
      console.log(chalk.green('\n✅ 性能预算检查通过'))
      return
    }

    console.log(chalk.bold('\n⚠️ 性能预算检查结果:'))

    for (const violation of result.violations) {
      const icon = violation.type === 'error' ? chalk.red('✖') : chalk.yellow('⚠')
      const limit = this.formatSize(violation.limit)
      const actual = this.formatSize(violation.actual)
      console.log(`   ${icon} ${violation.message}`)
      console.log(`     实际: ${chalk.red(actual)} / 限制: ${chalk.gray(limit)}`)
    }

    if (!result.passed) {
      console.log(chalk.red('\n❌ 性能预算检查失败'))
    }
  }

  /**
   * 生成 HTML 报告
   */
  async generateHtmlReport(result: AnalyzeResult, outputPath: string): Promise<void> {
    const html = this.generateHtmlContent(result)
    await fs.writeFile(outputPath, html, 'utf-8')
  }

  /**
   * 生成 HTML 内容
   */
  private generateHtmlContent(result: AnalyzeResult): string {
    const chartData = Object.entries(result.byType).map(([type, info]) => ({
      type,
      size: info.size,
      percentage: ((info.size / result.totalSize) * 100).toFixed(1),
    }))

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bundle 分析报告 - LDesign Launcher</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  </style>
</head>
<body class="bg-slate-900 text-white min-h-screen p-8">
  <div class="max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold mb-2">📊 Bundle 分析报告</h1>
    <p class="text-slate-400 mb-8">生成时间: ${new Date(result.timestamp).toLocaleString()}</p>
    
    <div class="grid grid-cols-4 gap-4 mb-8">
      <div class="bg-slate-800 rounded-lg p-6">
        <div class="text-sm text-slate-400">文件数量</div>
        <div class="text-3xl font-bold text-cyan-400">${result.files.length}</div>
      </div>
      <div class="bg-slate-800 rounded-lg p-6">
        <div class="text-sm text-slate-400">原始大小</div>
        <div class="text-3xl font-bold text-yellow-400">${this.formatSize(result.totalSize)}</div>
      </div>
      <div class="bg-slate-800 rounded-lg p-6">
        <div class="text-sm text-slate-400">Gzip 大小</div>
        <div class="text-3xl font-bold text-green-400">${this.formatSize(result.totalGzipSize)}</div>
      </div>
      <div class="bg-slate-800 rounded-lg p-6">
        <div class="text-sm text-slate-400">压缩率</div>
        <div class="text-3xl font-bold text-purple-400">${((1 - result.totalGzipSize / result.totalSize) * 100).toFixed(1)}%</div>
      </div>
    </div>
    
    <div class="grid grid-cols-2 gap-8 mb-8">
      <div class="bg-slate-800 rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">按类型分布</h2>
        <canvas id="typeChart" width="400" height="300"></canvas>
      </div>
      <div class="bg-slate-800 rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">最大文件</h2>
        <div class="space-y-2 max-h-[300px] overflow-y-auto">
          ${result.largestFiles.map(f => `
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-400 truncate flex-1" title="${f.path}">${f.path}</span>
              <span class="text-cyan-400 ml-4">${this.formatSize(f.size)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    
    <div class="bg-slate-800 rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-4">所有文件</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-slate-400 border-b border-slate-700">
              <th class="text-left py-2">文件路径</th>
              <th class="text-right py-2">类型</th>
              <th class="text-right py-2">原始大小</th>
              <th class="text-right py-2">Gzip 大小</th>
            </tr>
          </thead>
          <tbody>
            ${result.files.sort((a, b) => b.size - a.size).map(f => `
              <tr class="border-b border-slate-700/50 hover:bg-slate-700/50">
                <td class="py-2 text-slate-300">${f.path}</td>
                <td class="py-2 text-right"><span class="px-2 py-1 rounded bg-slate-700 text-xs">${f.type}</span></td>
                <td class="py-2 text-right text-yellow-400">${this.formatSize(f.size)}</td>
                <td class="py-2 text-right text-green-400">${this.formatSize(f.gzipSize)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  
  <script>
    const ctx = document.getElementById('typeChart').getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ${JSON.stringify(chartData.map(d => d.type.toUpperCase()))},
        datasets: [{
          data: ${JSON.stringify(chartData.map(d => d.size))},
          backgroundColor: ['#f59e0b', '#8b5cf6', '#06b6d4', '#22c55e', '#f43f5e', '#64748b'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right', labels: { color: '#94a3b8' } }
        }
      }
    });
  </script>
</body>
</html>`
  }

  /**
   * 格式化文件大小
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024)
      return `${bytes} B`
    if (bytes < 1024 * 1024)
      return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }
}

/**
 * 分析构建目录
 */
export async function analyzeBuild(
  buildDir: string,
  options?: {
    budget?: PerformanceBudget
    htmlReport?: string
    printReport?: boolean
  },
): Promise<AnalyzeResult> {
  const analyzer = new BundleAnalyzer(buildDir, options?.budget)
  const result = await analyzer.analyze()

  if (options?.printReport !== false) {
    analyzer.printReport(result)
  }

  if (options?.budget) {
    const budgetResult = analyzer.checkBudget(result)
    analyzer.printBudgetResult(budgetResult)
  }

  if (options?.htmlReport) {
    await analyzer.generateHtmlReport(result, options.htmlReport)
    console.log(chalk.green(`\n📄 HTML 报告已生成: ${options.htmlReport}`))
  }

  return result
}
