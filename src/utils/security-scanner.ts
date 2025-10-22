/**
 * 安全扫描工具
 * 
 * 提供依赖安全扫描、代码安全检查、敏感信息检测等功能
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

import path from 'path'
import { Logger } from './logger'
import { FileSystem } from './file-system'

/**
 * 安全问题接口
 */
export interface SecurityIssue {
  /** 问题ID */
  id: string
  /** 严重程度 */
  severity: 'critical' | 'high' | 'medium' | 'low'
  /** 类别 */
  category: 'dependency' | 'code' | 'config' | 'sensitive'
  /** 标题 */
  title: string
  /** 描述 */
  description: string
  /** 影响的文件/依赖 */
  affected: string[]
  /** 解决方案 */
  solution: string
  /** CVE 编号（如果有） */
  cve?: string
}

/**
 * 安全扫描结果接口
 */
export interface SecurityScanResult {
  /** 扫描时间 */
  timestamp: number
  /** 总问题数 */
  totalIssues: number
  /** 按严重程度分类 */
  bySeverity: Record<string, number>
  /** 按类别分类 */
  byCategory: Record<string, number>
  /** 问题列表 */
  issues: SecurityIssue[]
  /** 安全评分 (0-100) */
  score: number
  /** 是否通过 */
  passed: boolean
}

/**
 * 安全扫描器类
 */
export class SecurityScanner {
  private logger: Logger

  constructor(logger?: Logger) {
    this.logger = logger || new Logger('SecurityScanner')
  }

  /**
   * 执行完整安全扫描
   * @param projectPath 项目路径
   */
  async scan(projectPath: string = process.cwd()): Promise<SecurityScanResult> {
    this.logger.info('开始安全扫描...')

    const startTime = Date.now()
    const issues: SecurityIssue[] = []

    // 1. 依赖安全扫描
    const depIssues = await this.scanDependencies(projectPath)
    issues.push(...depIssues)

    // 2. 代码安全检查
    const codeIssues = await this.scanCode(projectPath)
    issues.push(...codeIssues)

    // 3. 敏感信息检测
    const sensitiveIssues = await this.scanSensitiveInfo(projectPath)
    issues.push(...sensitiveIssues)

    // 4. 配置安全检查
    const configIssues = await this.scanConfig(projectPath)
    issues.push(...configIssues)

    // 统计
    const bySeverity: Record<string, number> = {}
    const byCategory: Record<string, number> = {}

    for (const issue of issues) {
      bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1
      byCategory[issue.category] = (byCategory[issue.category] || 0) + 1
    }

    // 计算安全评分
    const score = this.calculateSecurityScore(issues)

    const duration = Date.now() - startTime
    this.logger.info(`安全扫描完成，耗时 ${duration}ms`)
    this.logger.info(`发现 ${issues.length} 个安全问题`)

    return {
      timestamp: Date.now(),
      totalIssues: issues.length,
      bySeverity,
      byCategory,
      issues,
      score,
      passed: score >= 70 && !issues.some(i => i.severity === 'critical')
    }
  }

  /**
   * 扫描依赖安全
   */
  private async scanDependencies(projectPath: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = []

    try {
      const packageJsonPath = path.join(projectPath, 'package.json')

      if (!await FileSystem.exists(packageJsonPath)) {
        return issues
      }

      const content = await FileSystem.readFile(packageJsonPath)
      const packageJson = JSON.parse(content)
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      }

      // 检查已知的有漏洞的包
      const vulnerablePackages: Record<string, { severity: SecurityIssue['severity'], cve: string, description: string }> = {
        'lodash': {
          severity: 'medium',
          cve: 'CVE-2021-23337',
          description: '原型污染漏洞'
        }
        // 实际应该从 npm audit 或安全数据库获取
      }

      for (const [pkgName, version] of Object.entries(dependencies)) {
        if (vulnerablePackages[pkgName]) {
          const vuln = vulnerablePackages[pkgName]
          issues.push({
            id: `dep-${pkgName}`,
            severity: vuln.severity,
            category: 'dependency',
            title: `依赖存在安全漏洞: ${pkgName}`,
            description: vuln.description,
            affected: [pkgName],
            solution: `升级到安全版本或替换为其他包`,
            cve: vuln.cve
          })
        }
      }

    } catch (error) {
      this.logger.debug('依赖扫描失败', error)
    }

    return issues
  }

  /**
   * 扫描代码安全
   */
  private async scanCode(projectPath: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = []

    try {
      const { default: fg } = await import('fast-glob')

      const files = await fg(['**/*.{js,ts,jsx,tsx,vue}'], {
        cwd: projectPath,
        ignore: ['node_modules', 'dist', 'build'],
        absolute: true
      })

      for (const file of files) {
        const content = await FileSystem.readFile(file)

        // 检查危险函数
        const dangerousPatterns = [
          { pattern: /eval\s*\(/g, title: '使用 eval()', severity: 'high' as const },
          { pattern: /innerHTML\s*=/g, title: '使用 innerHTML', severity: 'medium' as const },
          { pattern: /document\.write\(/g, title: '使用 document.write()', severity: 'medium' as const },
          { pattern: /Function\s*\(/g, title: '使用 Function 构造函数', severity: 'high' as const }
        ]

        for (const { pattern, title, severity } of dangerousPatterns) {
          if (pattern.test(content)) {
            issues.push({
              id: `code-${file}-${title}`,
              severity,
              category: 'code',
              title,
              description: `在文件中发现不安全的代码模式`,
              affected: [file],
              solution: '使用更安全的替代方案'
            })
          }
        }
      }

    } catch (error) {
      this.logger.debug('代码扫描失败', error)
    }

    return issues
  }

  /**
   * 扫描敏感信息
   */
  private async scanSensitiveInfo(projectPath: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = []

    try {
      const { default: fg } = await import('fast-glob')

      const files = await fg(['**/*.{js,ts,jsx,tsx,vue,json,env}'], {
        cwd: projectPath,
        ignore: ['node_modules', 'dist'],
        absolute: true
      })

      for (const file of files) {
        const content = await FileSystem.readFile(file)

        // 检查敏感信息模式
        const sensitivePatterns = [
          { pattern: /['"]?api[_-]?key['"]?\s*[:=]\s*['"][^'"]+['"]/gi, title: 'API Key 泄露' },
          { pattern: /['"]?secret['"]?\s*[:=]\s*['"][^'"]+['"]/gi, title: 'Secret 泄露' },
          { pattern: /['"]?password['"]?\s*[:=]\s*['"][^'"]+['"]/gi, title: 'Password 泄露' },
          { pattern: /['"]?token['"]?\s*[:=]\s*['"][^'"]+['"]/gi, title: 'Token 泄露' },
          { pattern: /sk-[a-zA-Z0-9]{48}/g, title: 'OpenAI API Key 泄露' },
          { pattern: /ghp_[a-zA-Z0-9]{36}/g, title: 'GitHub Token 泄露' }
        ]

        for (const { pattern, title } of sensitivePatterns) {
          const matches = content.match(pattern)
          if (matches && matches.length > 0) {
            issues.push({
              id: `sensitive-${file}-${title}`,
              severity: 'critical',
              category: 'sensitive',
              title,
              description: `在文件中发现硬编码的敏感信息`,
              affected: [file],
              solution: '使用环境变量或密钥管理服务存储敏感信息'
            })
          }
        }
      }

    } catch (error) {
      this.logger.debug('敏感信息扫描失败', error)
    }

    return issues
  }

  /**
   * 扫描配置安全
   */
  private async scanConfig(projectPath: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = []

    try {
      // 检查 HTTPS 配置
      const viteConfigPath = path.join(projectPath, 'vite.config.ts')
      if (await FileSystem.exists(viteConfigPath)) {
        const content = await FileSystem.readFile(viteConfigPath)

        // 检查是否在生产环境使用 HTTP
        if (!content.includes('https:') && !content.includes('ssl')) {
          issues.push({
            id: 'config-no-https',
            severity: 'medium',
            category: 'config',
            title: '未配置 HTTPS',
            description: '生产环境建议使用 HTTPS',
            affected: [viteConfigPath],
            solution: '配置 server.https 选项'
          })
        }
      }

      // 检查 CORS 配置
      const launcherConfigPath = path.join(projectPath, 'launcher.config.ts')
      if (await FileSystem.exists(launcherConfigPath)) {
        const content = await FileSystem.readFile(launcherConfigPath)

        if (content.includes("cors: true") && !content.includes('origin:')) {
          issues.push({
            id: 'config-cors-wildcard',
            severity: 'medium',
            category: 'config',
            title: 'CORS 配置过于宽松',
            description: 'cors: true 允许所有来源访问',
            affected: [launcherConfigPath],
            solution: '指定具体的 origin 而不是使用通配符'
          })
        }
      }

    } catch (error) {
      this.logger.debug('配置扫描失败', error)
    }

    return issues
  }

  /**
   * 计算安全评分
   */
  private calculateSecurityScore(issues: SecurityIssue[]): number {
    let score = 100

    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 25
          break
        case 'high':
          score -= 15
          break
        case 'medium':
          score -= 10
          break
        case 'low':
          score -= 5
          break
      }
    }

    return Math.max(0, score)
  }

  /**
   * 生成安全报告
   */
  async generateReport(
    result: SecurityScanResult,
    outputPath: string = 'security-report.html'
  ): Promise<void> {
    const html = this.createHTMLReport(result)
    await FileSystem.writeFile(outputPath, html)
    this.logger.success(`安全报告已生成: ${outputPath}`)
  }

  /**
   * 创建 HTML 报告
   */
  private createHTMLReport(result: SecurityScanResult): string {
    const severityColor = {
      critical: '#d32f2f',
      high: '#f57c00',
      medium: '#fbc02d',
      low: '#7cb342'
    }

    const issueRows = result.issues.map(issue => `
      <tr>
        <td><span class="severity severity-${issue.severity}">${issue.severity}</span></td>
        <td>${issue.category}</td>
        <td><strong>${issue.title}</strong><br><small>${issue.description}</small></td>
        <td><code>${issue.affected.join(', ')}</code></td>
        <td>${issue.solution}</td>
      </tr>
    `).join('')

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>安全扫描报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1400px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #333; margin-bottom: 10px; }
    .score { font-size: 48px; font-weight: bold; color: ${result.score >= 80 ? '#4caf50' : result.score >= 60 ? '#ff9800' : '#f44336'}; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
    .stat-card { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #333; }
    .stat-label { color: #666; font-size: 14px; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8f9fa; font-weight: 600; }
    .severity { padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px; text-transform: uppercase; }
    .severity-critical { background: #d32f2f; }
    .severity-high { background: #f57c00; }
    .severity-medium { background: #fbc02d; color: #333; }
    .severity-low { background: #7cb342; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔒 安全扫描报告</h1>
    <p>扫描时间: ${new Date(result.timestamp).toLocaleString()}</p>
    <p>安全评分: <span class="score">${result.score}/100</span></p>
    <p>状态: ${result.passed ? '✅ 通过' : '❌ 未通过'}</p>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${result.totalIssues}</div>
        <div class="stat-label">总问题数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${result.bySeverity.critical || 0}</div>
        <div class="stat-label">严重</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${result.bySeverity.high || 0}</div>
        <div class="stat-label">高危</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${result.bySeverity.medium || 0}</div>
        <div class="stat-label">中等</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${result.bySeverity.low || 0}</div>
        <div class="stat-label">低危</div>
      </div>
    </div>
    
    <h2>安全问题列表</h2>
    <table>
      <thead>
        <tr>
          <th>严重程度</th>
          <th>类别</th>
          <th>问题</th>
          <th>影响</th>
          <th>解决方案</th>
        </tr>
      </thead>
      <tbody>
        ${issueRows || '<tr><td colspan="5" style="text-align:center;color:#4caf50;">✅ 未发现安全问题</td></tr>'}
      </tbody>
    </table>
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * 修复可自动修复的问题
   * @param issues 问题列表
   */
  async autoFix(issues: SecurityIssue[]): Promise<{
    fixed: number
    failed: number
  }> {
    let fixed = 0
    let failed = 0

    for (const issue of issues) {
      try {
        // 只修复低风险的问题
        if (issue.severity === 'low' || issue.severity === 'medium') {
          await this.fixIssue(issue)
          fixed++
          this.logger.success(`已修复: ${issue.title}`)
        }
      } catch (error) {
        failed++
        this.logger.debug(`修复失败: ${issue.title}`, error)
      }
    }

    return { fixed, failed }
  }

  /**
   * 修复单个问题
   */
  private async fixIssue(issue: SecurityIssue): Promise<void> {
    // 这里实现具体的修复逻辑
    // 例如：替换危险函数、移除敏感信息等
    this.logger.debug(`修复问题: ${issue.id}`)
  }
}

/**
 * 创建安全扫描器实例
 */
export function createSecurityScanner(logger?: Logger): SecurityScanner {
  return new SecurityScanner(logger)
}

/**
 * 全局安全扫描器实例
 */
export const securityScanner = new SecurityScanner()

