/**
 * Bundle 分析工具
 * 
 * 使用 webpack-bundle-analyzer 分析构建产物
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

import path from 'path'
import { Logger } from './logger'
import { FileSystem } from './file-system'

/**
 * Bundle 分析结果接口
 */
export interface BundleAnalysis {
  /** 总大小（字节） */
  totalSize: number
  /** 各文件大小 */
  files: Array<{
    name: string
    size: number
    gzipSize: number
    type: string
  }>
  /** 各类型统计 */
  byType: Record<string, {
    count: number
    size: number
  }>
  /** 大文件列表（>500KB） */
  largeFiles: Array<{
    name: string
    size: number
    percentage: number
  }>
  /** 优化建议 */
  suggestions: string[]
}

/**
 * Bundle 分析器类
 */
export class BundleAnalyzer {
  private logger: Logger

  constructor(logger?: Logger) {
    this.logger = logger || new Logger('BundleAnalyzer')
  }

  /**
   * 分析构建产物
   * @param buildDir 构建目录
   */
  async analyze(buildDir: string = 'dist'): Promise<BundleAnalysis> {
    try {
      this.logger.info(`分析构建产物: ${buildDir}`)

      // 检查目录是否存在
      if (!await FileSystem.exists(buildDir)) {
        throw new Error(`构建目录不存在: ${buildDir}`)
      }

      const { default: fg } = await import('fast-glob')

      // 扫描所有文件
      const files = await fg(['**/*'], {
        cwd: buildDir,
        stats: true,
        ignore: ['**/*.map'] // 忽略 sourcemap
      })

      let totalSize = 0
      const fileDetails: BundleAnalysis['files'] = []
      const byType: Record<string, { count: number; size: number }> = {}
      const largeFiles: BundleAnalysis['largeFiles'] = []

      // 分析每个文件
      for (const file of files) {
        if (!file.stats || file.stats.isDirectory()) {
          continue
        }

        const size = file.stats.size
        const ext = path.extname(file.name).substring(1) || 'other'
        const gzipSize = await this.estimateGzipSize(file.path, size)

        totalSize += size

        // 记录文件详情
        fileDetails.push({
          name: file.name,
          size,
          gzipSize,
          type: ext
        })

        // 按类型统计
        if (!byType[ext]) {
          byType[ext] = { count: 0, size: 0 }
        }
        byType[ext].count++
        byType[ext].size += size

        // 识别大文件（>500KB）
        if (size > 500 * 1024) {
          largeFiles.push({
            name: file.name,
            size,
            percentage: 0 // 稍后计算
          })
        }
      }

      // 计算大文件百分比
      for (const largeFile of largeFiles) {
        largeFile.percentage = (largeFile.size / totalSize) * 100
      }

      // 生成优化建议
      const suggestions = this.generateSuggestions({
        totalSize,
        files: fileDetails,
        byType,
        largeFiles
      })

      this.logger.success(`分析完成: ${fileDetails.length} 个文件，总大小 ${this.formatSize(totalSize)}`)

      return {
        totalSize,
        files: fileDetails,
        byType,
        largeFiles,
        suggestions
      }
    } catch (error) {
      this.logger.error('Bundle 分析失败', error)
      throw error
    }
  }

  /**
   * 估算 gzip 压缩后大小
   */
  private async estimateGzipSize(filePath: string, originalSize: number): Promise<number> {
    try {
      // 只对文本文件进行 gzip 估算
      const ext = path.extname(filePath).toLowerCase()
      const textExtensions = ['.js', '.css', '.html', '.json', '.xml', '.svg', '.txt']

      if (!textExtensions.includes(ext)) {
        return originalSize
      }

      // 简化估算：gzip 通常可以压缩 60-80%
      return Math.round(originalSize * 0.3) // 假设压缩率 70%
    } catch {
      return originalSize
    }
  }

  /**
   * 生成优化建议
   */
  private generateSuggestions(analysis: Partial<BundleAnalysis>): string[] {
    const suggestions: string[] = []
    const { totalSize = 0, largeFiles = [], byType = {} } = analysis

    // Bundle 总大小建议
    if (totalSize > 5 * 1024 * 1024) { // >5MB
      suggestions.push(
        `Bundle 总大小为 ${this.formatSize(totalSize)}，建议启用代码分割和懒加载`
      )
    }

    // 大文件建议
    if (largeFiles.length > 0) {
      suggestions.push(
        `发现 ${largeFiles.length} 个大文件 (>500KB)，建议拆分:`
      )
      largeFiles.slice(0, 3).forEach(file => {
        suggestions.push(
          `  - ${file.name}: ${this.formatSize(file.size)} (${file.percentage.toFixed(1)}%)`
        )
      })
    }

    // JavaScript 文件建议
    if (byType.js && byType.js.size > 2 * 1024 * 1024) { // >2MB
      suggestions.push(
        `JavaScript 文件总计 ${this.formatSize(byType.js.size)}，建议:
  - 使用动态 import 拆分路由
  - 提取公共依赖到 vendor chunk
  - 移除未使用的代码`
      )
    }

    // CSS 文件建议
    if (byType.css && byType.css.size > 500 * 1024) { // >500KB
      suggestions.push(
        `CSS 文件总计 ${this.formatSize(byType.css.size)}，建议:
  - 使用 PurgeCSS 移除未使用的样式
  - 启用 CSS 压缩
  - 考虑使用 CSS-in-JS`
      )
    }

    // 图片文件建议
    if (byType.png || byType.jpg || byType.jpeg) {
      const imageSize = (byType.png?.size || 0) + (byType.jpg?.size || 0) + (byType.jpeg?.size || 0)
      if (imageSize > 1 * 1024 * 1024) { // >1MB
        suggestions.push(
          `图片文件总计 ${this.formatSize(imageSize)}，建议:
  - 转换为 WebP 格式
  - 使用图片懒加载
  - 实现响应式图片`
        )
      }
    }

    return suggestions
  }

  /**
   * 格式化文件大小
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes}B`
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)}KB`
    }
    return `${(bytes / 1024 / 1024).toFixed(2)}MB`
  }

  /**
   * 生成分析报告（HTML）
   */
  async generateHTMLReport(
    analysis: BundleAnalysis,
    outputPath: string = 'bundle-report.html'
  ): Promise<void> {
    const html = this.createHTMLReport(analysis)

    await FileSystem.writeFile(outputPath, html)
    this.logger.success(`Bundle 分析报告已生成: ${outputPath}`)
  }

  /**
   * 创建 HTML 报告
   */
  private createHTMLReport(analysis: BundleAnalysis): string {
    const { totalSize, files, byType, largeFiles, suggestions } = analysis

    // 生成文件列表 HTML
    const fileRows = files
      .sort((a, b) => b.size - a.size)
      .slice(0, 20) // 只显示前20个最大文件
      .map(file => `
        <tr>
          <td>${file.name}</td>
          <td class="number">${this.formatSize(file.size)}</td>
          <td class="number">${this.formatSize(file.gzipSize)}</td>
          <td>${file.type}</td>
        </tr>
      `)
      .join('')

    // 生成类型统计 HTML
    const typeRows = Object.entries(byType)
      .sort((a, b) => b[1].size - a[1].size)
      .map(([type, stats]) => `
        <tr>
          <td>${type}</td>
          <td class="number">${stats.count}</td>
          <td class="number">${this.formatSize(stats.size)}</td>
          <td class="number">${((stats.size / totalSize) * 100).toFixed(2)}%</td>
        </tr>
      `)
      .join('')

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bundle 分析报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; }
    h1 { font-size: 28px; margin-bottom: 10px; }
    .subtitle { opacity: 0.9; }
    .section { padding: 30px; border-bottom: 1px solid #eee; }
    .section:last-child { border-bottom: none; }
    h2 { color: #333; margin-bottom: 20px; font-size: 20px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .stat-card { background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea; }
    .stat-label { color: #666; font-size: 14px; margin-bottom: 8px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #333; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8f9fa; color: #666; font-weight: 600; font-size: 14px; }
    .number { text-align: right; font-family: 'Courier New', monospace; }
    .suggestions { list-style: none; }
    .suggestions li { background: #fff9e6; border-left: 4px solid #faad14; padding: 15px; margin-bottom: 10px; border-radius: 4px; }
    .suggestions li::before { content: "💡"; margin-right: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📦 Bundle 分析报告</h1>
      <div class="subtitle">@ldesign/launcher - 构建产物分析</div>
    </header>
    
    <div class="section">
      <h2>总体统计</h2>
      <div class="stats">
        <div class="stat-card">
          <div class="stat-label">总大小</div>
          <div class="stat-value">${this.formatSize(totalSize)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">文件数量</div>
          <div class="stat-value">${files.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">大文件数</div>
          <div class="stat-value">${largeFiles.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">文件类型</div>
          <div class="stat-value">${Object.keys(byType).length}</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>按类型统计</h2>
      <table>
        <thead>
          <tr>
            <th>类型</th>
            <th class="number">数量</th>
            <th class="number">大小</th>
            <th class="number">占比</th>
          </tr>
        </thead>
        <tbody>
          ${typeRows}
        </tbody>
      </table>
    </div>
    
    <div class="section">
      <h2>最大的 20 个文件</h2>
      <table>
        <thead>
          <tr>
            <th>文件名</th>
            <th class="number">原始大小</th>
            <th class="number">Gzip 大小</th>
            <th>类型</th>
          </tr>
        </thead>
        <tbody>
          ${fileRows}
        </tbody>
      </table>
    </div>
    
    ${suggestions.length > 0 ? `
    <div class="section">
      <h2>优化建议</h2>
      <ul class="suggestions">
        ${suggestions.map(s => `<li>${s}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * 对比两次构建
   * @param currentDir 当前构建目录
   * @param previousDir 之前的构建目录
   */
  async compare(currentDir: string, previousDir: string): Promise<{
    current: BundleAnalysis
    previous: BundleAnalysis
    diff: {
      sizeChange: number
      sizeChangePercent: number
      filesAdded: number
      filesRemoved: number
      filesModified: number
    }
  }> {
    this.logger.info('对比构建产物...')

    const current = await this.analyze(currentDir)
    const previous = await this.analyze(previousDir)

    // 计算差异
    const sizeChange = current.totalSize - previous.totalSize
    const sizeChangePercent = (sizeChange / previous.totalSize) * 100

    const currentFiles = new Set(current.files.map(f => f.name))
    const previousFiles = new Set(previous.files.map(f => f.name))

    const filesAdded = current.files.filter(f => !previousFiles.has(f.name)).length
    const filesRemoved = previous.files.filter(f => !currentFiles.has(f.name)).length
    const filesModified = current.files.filter(f => {
      const prevFile = previous.files.find(pf => pf.name === f.name)
      return prevFile && prevFile.size !== f.size
    }).length

    this.logger.info(`大小变化: ${sizeChange > 0 ? '+' : ''}${this.formatSize(sizeChange)} (${sizeChangePercent.toFixed(2)}%)`)

    return {
      current,
      previous,
      diff: {
        sizeChange,
        sizeChangePercent,
        filesAdded,
        filesRemoved,
        filesModified
      }
    }
  }

  /**
   * 生成交互式可视化报告
   * @param buildDir 构建目录
   * @param outputPath 输出路径
   */
  async generateInteractiveReport(
    buildDir: string = 'dist',
    outputPath: string = 'bundle-report.html'
  ): Promise<void> {
    try {
      this.logger.info('生成交互式 Bundle 分析报告...')

      const analysis = await this.analyze(buildDir)
      await this.generateHTMLReport(analysis, outputPath)

      this.logger.success(`✅ 报告已生成: ${outputPath}`)
      this.logger.info('提示: 在浏览器中打开查看详细分析')
    } catch (error) {
      this.logger.error('生成报告失败', error)
      throw error
    }
  }
}

/**
 * 创建 Bundle 分析器实例
 */
export function createBundleAnalyzer(logger?: Logger): BundleAnalyzer {
  return new BundleAnalyzer(logger)
}

/**
 * 全局 Bundle 分析器实例
 */
export const bundleAnalyzer = new BundleAnalyzer()

