/**
 * 环境变量管理器
 *
 * 管理 .env 文件和环境变量
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import path from 'node:path'
import fs from 'fs-extra'

/**
 * 环境变量条目
 */
export interface EnvEntry {
  key: string
  value: string
  comment?: string
  isSecret?: boolean
}

/**
 * 环境文件信息
 */
export interface EnvFileInfo {
  name: string
  path: string
  exists: boolean
  variables: EnvEntry[]
  lastModified?: Date
}

/**
 * 环境变量管理器
 */
export class EnvManager {
  private cwd: string
  private envFiles = [
    '.env',
    '.env.local',
    '.env.development',
    '.env.development.local',
    '.env.staging',
    '.env.staging.local',
    '.env.production',
    '.env.production.local',
    '.env.test',
    '.env.test.local',
  ]

  constructor(cwd: string) {
    this.cwd = cwd
  }

  /**
   * 获取所有环境文件信息
   */
  async getEnvFiles(): Promise<EnvFileInfo[]> {
    const files: EnvFileInfo[] = []

    for (const envFile of this.envFiles) {
      const filePath = path.join(this.cwd, envFile)
      const exists = await fs.pathExists(filePath)

      let variables: EnvEntry[] = []
      let lastModified: Date | undefined

      if (exists) {
        const stat = await fs.stat(filePath)
        lastModified = stat.mtime
        variables = await this.parseEnvFile(filePath)
      }

      files.push({
        name: envFile,
        path: filePath,
        exists,
        variables,
        lastModified,
      })
    }

    return files
  }

  /**
   * 获取指定环境文件
   */
  async getEnvFile(filename: string): Promise<EnvFileInfo | null> {
    const filePath = path.join(this.cwd, filename)
    const exists = await fs.pathExists(filePath)

    if (!exists) {
      return {
        name: filename,
        path: filePath,
        exists: false,
        variables: [],
      }
    }

    const stat = await fs.stat(filePath)
    const variables = await this.parseEnvFile(filePath)

    return {
      name: filename,
      path: filePath,
      exists: true,
      variables,
      lastModified: stat.mtime,
    }
  }

  /**
   * 解析 .env 文件
   */
  async parseEnvFile(filePath: string): Promise<EnvEntry[]> {
    const content = await fs.readFile(filePath, 'utf-8')
    const entries: EnvEntry[] = []
    let currentComment = ''

    const lines = content.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()

      // 空行
      if (!trimmed) {
        currentComment = ''
        continue
      }

      // 注释
      if (trimmed.startsWith('#')) {
        currentComment = trimmed.substring(1).trim()
        continue
      }

      // 变量
      const match = trimmed.match(/^([^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        let value = match[2].trim()

        // 移除引号
        if ((value.startsWith('"') && value.endsWith('"'))
          || (value.startsWith('\'') && value.endsWith('\''))) {
          value = value.slice(1, -1)
        }

        // 检查是否为敏感变量
        const isSecret = this.isSensitiveKey(key)

        entries.push({
          key,
          value: isSecret ? this.maskValue(value) : value,
          comment: currentComment || undefined,
          isSecret,
        })

        currentComment = ''
      }
    }

    return entries
  }

  /**
   * 判断是否为敏感变量
   */
  private isSensitiveKey(key: string): boolean {
    const sensitivePatterns = [
      /secret/i,
      /password/i,
      /token/i,
      /key/i,
      /api_key/i,
      /apikey/i,
      /private/i,
      /credential/i,
      /auth/i,
    ]
    return sensitivePatterns.some(p => p.test(key))
  }

  /**
   * 脱敏值
   */
  private maskValue(value: string): string {
    if (value.length <= 4) {
      return '****'
    }
    return `${value.substring(0, 2)}****${value.substring(value.length - 2)}`
  }

  /**
   * 创建或更新环境文件
   */
  async saveEnvFile(filename: string, entries: EnvEntry[]): Promise<void> {
    const filePath = path.join(this.cwd, filename)
    let content = ''

    for (const entry of entries) {
      if (entry.comment) {
        content += `# ${entry.comment}\n`
      }

      // 如果值包含特殊字符，用引号包裹
      let value = entry.value
      if (value.includes(' ') || value.includes('#') || value.includes('\n')) {
        value = `"${value.replace(/"/g, '\\"')}"`
      }

      content += `${entry.key}=${value}\n`
    }

    await fs.writeFile(filePath, content, 'utf-8')
  }

  /**
   * 添加或更新变量
   */
  async setVariable(filename: string, key: string, value: string, comment?: string): Promise<void> {
    const envFile = await this.getEnvFile(filename)
    const entries = envFile?.variables || []

    const existingIndex = entries.findIndex(e => e.key === key)
    const newEntry: EnvEntry = {
      key,
      value,
      comment,
      isSecret: this.isSensitiveKey(key),
    }

    if (existingIndex >= 0) {
      entries[existingIndex] = newEntry
    }
    else {
      entries.push(newEntry)
    }

    await this.saveEnvFile(filename, entries)
  }

  /**
   * 删除变量
   */
  async deleteVariable(filename: string, key: string): Promise<boolean> {
    const envFile = await this.getEnvFile(filename)
    if (!envFile?.exists)
      return false

    const entries = envFile.variables.filter(e => e.key !== key)
    await this.saveEnvFile(filename, entries)
    return true
  }

  /**
   * 创建环境文件模板
   */
  async createEnvExample(): Promise<void> {
    const examplePath = path.join(this.cwd, '.env.example')

    // 收集所有环境文件中的变量
    const allKeys = new Set<string>()
    const files = await this.getEnvFiles()

    for (const file of files) {
      if (file.exists && !file.name.includes('local')) {
        for (const entry of file.variables) {
          allKeys.add(entry.key)
        }
      }
    }

    // 生成示例文件
    let content = '# Environment Variables Example\n'
    content += '# Copy this file to .env.local and fill in the values\n\n'

    for (const key of allKeys) {
      if (this.isSensitiveKey(key)) {
        content += `${key}=your_${key.toLowerCase()}_here\n`
      }
      else {
        content += `${key}=\n`
      }
    }

    await fs.writeFile(examplePath, content, 'utf-8')
  }

  /**
   * 比较两个环境文件
   */
  async compareEnvFiles(file1: string, file2: string): Promise<{
    onlyInFirst: string[]
    onlyInSecond: string[]
    different: Array<{ key: string, value1: string, value2: string }>
    same: string[]
  }> {
    const env1 = await this.getEnvFile(file1)
    const env2 = await this.getEnvFile(file2)

    const vars1 = new Map(env1?.variables.map(v => [v.key, v.value]) || [])
    const vars2 = new Map(env2?.variables.map(v => [v.key, v.value]) || [])

    const onlyInFirst: string[] = []
    const onlyInSecond: string[] = []
    const different: Array<{ key: string, value1: string, value2: string }> = []
    const same: string[] = []

    for (const [key, value] of vars1) {
      if (!vars2.has(key)) {
        onlyInFirst.push(key)
      }
      else if (vars2.get(key) !== value) {
        different.push({ key, value1: value, value2: vars2.get(key)! })
      }
      else {
        same.push(key)
      }
    }

    for (const key of vars2.keys()) {
      if (!vars1.has(key)) {
        onlyInSecond.push(key)
      }
    }

    return { onlyInFirst, onlyInSecond, different, same }
  }

  /**
   * 获取合并后的环境变量
   */
  async getMergedEnv(mode: string = 'development'): Promise<Map<string, string>> {
    const result = new Map<string, string>()

    // 加载顺序: .env -> .env.local -> .env.[mode] -> .env.[mode].local
    const loadOrder = [
      '.env',
      '.env.local',
      `.env.${mode}`,
      `.env.${mode}.local`,
    ]

    for (const filename of loadOrder) {
      const envFile = await this.getEnvFile(filename)
      if (envFile?.exists) {
        for (const entry of envFile.variables) {
          result.set(entry.key, entry.value)
        }
      }
    }

    return result
  }
}

// 单例
let envManagerInstance: EnvManager | null = null

export function getEnvManager(cwd?: string): EnvManager {
  if (!envManagerInstance || cwd) {
    envManagerInstance = new EnvManager(cwd || process.cwd())
  }
  return envManagerInstance
}
