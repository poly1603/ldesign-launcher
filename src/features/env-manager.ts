/**
 * 环境变量管理器
 *
 * 可视化管理和编辑 .env 文件
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import pc from 'picocolors'
import { FileSystem } from '../utils/file-system'
import { Logger } from '../utils/logger'

export interface EnvVariable {
  key: string
  value: string
  comment?: string
  file: string
}

export interface EnvFile {
  path: string
  name: string
  variables: Map<string, EnvVariable>
  exists: boolean
}

export class EnvManager {
  private logger: Logger
  private cwd: string
  private envFiles: Map<string, EnvFile> = new Map()

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd
    this.logger = new Logger('EnvManager')
  }

  /**
   * 初始化，加载所有 .env 文件
   */
  async init(): Promise<void> {
    const envFileNames = [
      '.env',
      '.env.local',
      '.env.development',
      '.env.production',
      '.env.test',
      '.env.staging',
    ]

    for (const fileName of envFileNames) {
      const filePath = path.join(this.cwd, fileName)
      const exists = await FileSystem.exists(filePath)

      const envFile: EnvFile = {
        path: filePath,
        name: fileName,
        variables: new Map(),
        exists,
      }

      if (exists) {
        await this.loadEnvFile(envFile)
      }

      this.envFiles.set(fileName, envFile)
    }
  }

  /**
   * 加载环境变量文件
   */
  private async loadEnvFile(envFile: EnvFile): Promise<void> {
    try {
      const content = await fs.readFile(envFile.path, 'utf-8')
      const lines = content.split('\n')

      let currentComment = ''

      for (const line of lines) {
        const trimmed = line.trim()

        // 跳过空行
        if (!trimmed) {
          currentComment = ''
          continue
        }

        // 注释行
        if (trimmed.startsWith('#')) {
          currentComment = trimmed.slice(1).trim()
          continue
        }

        // 解析环境变量
        const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/)
        if (match) {
          const [, key, value] = match
          const cleanValue = value.replace(/^["']|["']$/g, '') // 移除引号

          envFile.variables.set(key, {
            key,
            value: cleanValue,
            comment: currentComment || undefined,
            file: envFile.name,
          })

          currentComment = ''
        }
      }

      this.logger.debug(`已加载 ${envFile.name}: ${envFile.variables.size} 个变量`)
    }
    catch (error) {
      this.logger.error(`加载 ${envFile.name} 失败: ${(error as Error).message}`)
    }
  }

  /**
   * 获取所有环境文件
   */
  getEnvFiles(): EnvFile[] {
    return Array.from(this.envFiles.values())
  }

  /**
   * 获取指定文件的所有变量
   */
  getVariables(fileName: string): EnvVariable[] {
    const envFile = this.envFiles.get(fileName)
    if (!envFile) {
      return []
    }
    return Array.from(envFile.variables.values())
  }

  /**
   * 获取所有变量（合并所有文件）
   */
  getAllVariables(): Map<string, EnvVariable> {
    const allVars = new Map<string, EnvVariable>()

    // 按优先级加载：.env.local > .env.{mode} > .env
    const priority = [
      '.env',
      '.env.development',
      '.env.production',
      '.env.test',
      '.env.staging',
      '.env.local',
    ]

    for (const fileName of priority) {
      const envFile = this.envFiles.get(fileName)
      if (envFile && envFile.exists) {
        for (const [key, variable] of envFile.variables) {
          allVars.set(key, variable)
        }
      }
    }

    return allVars
  }

  /**
   * 设置环境变量
   */
  async setVariable(
    fileName: string,
    key: string,
    value: string,
    comment?: string,
  ): Promise<void> {
    const envFile = this.envFiles.get(fileName)
    if (!envFile) {
      throw new Error(`环境文件不存在: ${fileName}`)
    }

    envFile.variables.set(key, {
      key,
      value,
      comment,
      file: fileName,
    })

    await this.saveEnvFile(envFile)
    this.logger.info(pc.green(`✅ 已设置 ${key} = ${value} (${fileName})`))
  }

  /**
   * 删除环境变量
   */
  async removeVariable(fileName: string, key: string): Promise<void> {
    const envFile = this.envFiles.get(fileName)
    if (!envFile) {
      throw new Error(`环境文件不存在: ${fileName}`)
    }

    if (!envFile.variables.has(key)) {
      throw new Error(`变量不存在: ${key}`)
    }

    envFile.variables.delete(key)
    await this.saveEnvFile(envFile)
    this.logger.info(pc.green(`✅ 已删除 ${key} (${fileName})`))
  }

  /**
   * 保存环境变量文件
   */
  private async saveEnvFile(envFile: EnvFile): Promise<void> {
    const lines: string[] = []

    for (const variable of envFile.variables.values()) {
      if (variable.comment) {
        lines.push(`# ${variable.comment}`)
      }
      // 如果值包含空格或特殊字符，使用引号
      const needsQuotes = /[\s#]/.test(variable.value)
      const value = needsQuotes ? `"${variable.value}"` : variable.value
      lines.push(`${variable.key}=${value}`)
      lines.push('') // 空行分隔
    }

    await fs.writeFile(envFile.path, lines.join('\n'), 'utf-8')
    envFile.exists = true
  }

  /**
   * 创建新的环境文件
   */
  async createEnvFile(fileName: string): Promise<void> {
    const envFile = this.envFiles.get(fileName)
    if (!envFile) {
      throw new Error(`不支持的环境文件: ${fileName}`)
    }

    if (envFile.exists) {
      throw new Error(`文件已存在: ${fileName}`)
    }

    await fs.writeFile(envFile.path, '', 'utf-8')
    envFile.exists = true
    this.logger.info(pc.green(`✅ 已创建 ${fileName}`))
  }

  /**
   * 复制环境文件
   */
  async copyEnvFile(from: string, to: string): Promise<void> {
    const fromFile = this.envFiles.get(from)
    const toFile = this.envFiles.get(to)

    if (!fromFile || !fromFile.exists) {
      throw new Error(`源文件不存在: ${from}`)
    }

    if (!toFile) {
      throw new Error(`不支持的目标文件: ${to}`)
    }

    // 复制所有变量
    toFile.variables = new Map(fromFile.variables)

    // 更新文件名引用
    for (const variable of toFile.variables.values()) {
      variable.file = to
    }

    await this.saveEnvFile(toFile)
    this.logger.info(pc.green(`✅ 已复制 ${from} 到 ${to}`))
  }

  /**
   * 搜索环境变量
   */
  searchVariables(query: string): EnvVariable[] {
    const lowerQuery = query.toLowerCase()
    const results: EnvVariable[] = []

    for (const envFile of this.envFiles.values()) {
      if (!envFile.exists)
        continue

      for (const variable of envFile.variables.values()) {
        if (
          variable.key.toLowerCase().includes(lowerQuery)
          || variable.value.toLowerCase().includes(lowerQuery)
          || variable.comment?.toLowerCase().includes(lowerQuery)
        ) {
          results.push(variable)
        }
      }
    }

    return results
  }

  /**
   * 验证环境变量
   */
  async validate(): Promise<{
    missing: string[]
    duplicates: Map<string, string[]>
    invalid: Array<{ key: string, reason: string }>
  }> {
    const missing: string[] = []
    const duplicates = new Map<string, string[]>()
    const invalid: Array<{ key: string, reason: string }> = []

    // 检查必需的环境变量（可以从配置文件读取）
    const required = [
      'NODE_ENV',
      'VITE_APP_TITLE',
      'VITE_API_BASE_URL',
    ]

    const allVars = this.getAllVariables()

    for (const key of required) {
      if (!allVars.has(key)) {
        missing.push(key)
      }
    }

    // 检查重复定义
    const keyFiles = new Map<string, string[]>()

    for (const envFile of this.envFiles.values()) {
      if (!envFile.exists)
        continue

      for (const key of envFile.variables.keys()) {
        if (!keyFiles.has(key)) {
          keyFiles.set(key, [])
        }
        keyFiles.get(key)!.push(envFile.name)
      }
    }

    for (const [key, files] of keyFiles) {
      if (files.length > 1) {
        duplicates.set(key, files)
      }
    }

    // 检查无效的变量名
    for (const variable of allVars.values()) {
      if (!/^[A-Z_][A-Z0-9_]*$/.test(variable.key)) {
        invalid.push({
          key: variable.key,
          reason: '变量名应该是大写字母、数字和下划线',
        })
      }
    }

    return { missing, duplicates, invalid }
  }

  /**
   * 生成环境变量示例文件
   */
  async generateExample(): Promise<void> {
    const examplePath = path.join(this.cwd, '.env.example')
    const envFile = this.envFiles.get('.env')

    if (!envFile || !envFile.exists) {
      throw new Error('.env 文件不存在')
    }

    const lines: string[] = [
      '# 环境变量示例文件',
      '# 复制此文件为 .env 并填写实际值',
      '',
    ]

    for (const variable of envFile.variables.values()) {
      if (variable.comment) {
        lines.push(`# ${variable.comment}`)
      }
      lines.push(`${variable.key}=`)
      lines.push('')
    }

    await fs.writeFile(examplePath, lines.join('\n'), 'utf-8')
    this.logger.info(pc.green(`✅ 已生成 .env.example`))
  }

  /**
   * 导出为 JSON
   */
  exportToJson(fileName?: string): Record<string, string> {
    const result: Record<string, string> = {}

    if (fileName) {
      const envFile = this.envFiles.get(fileName)
      if (envFile) {
        for (const [key, variable] of envFile.variables) {
          result[key] = variable.value
        }
      }
    }
    else {
      const allVars = this.getAllVariables()
      for (const [key, variable] of allVars) {
        result[key] = variable.value
      }
    }

    return result
  }

  /**
   * 从 JSON 导入
   */
  async importFromJson(
    fileName: string,
    data: Record<string, string>,
  ): Promise<void> {
    const envFile = this.envFiles.get(fileName)
    if (!envFile) {
      throw new Error(`环境文件不存在: ${fileName}`)
    }

    for (const [key, value] of Object.entries(data)) {
      envFile.variables.set(key, {
        key,
        value,
        file: fileName,
      })
    }

    await this.saveEnvFile(envFile)
    this.logger.info(pc.green(`✅ 已导入 ${Object.keys(data).length} 个变量到 ${fileName}`))
  }

  /**
   * 比较两个环境文件
   */
  compareFiles(file1: string, file2: string): {
    onlyInFile1: string[]
    onlyInFile2: string[]
    different: Array<{ key: string, value1: string, value2: string }>
    same: string[]
  } {
    const envFile1 = this.envFiles.get(file1)
    const envFile2 = this.envFiles.get(file2)

    if (!envFile1 || !envFile2) {
      throw new Error('文件不存在')
    }

    const onlyInFile1: string[] = []
    const onlyInFile2: string[] = []
    const different: Array<{ key: string, value1: string, value2: string }> = []
    const same: string[] = []

    // 检查 file1 中的变量
    for (const [key, variable] of envFile1.variables) {
      if (!envFile2.variables.has(key)) {
        onlyInFile1.push(key)
      }
      else {
        const var2 = envFile2.variables.get(key)!
        if (variable.value !== var2.value) {
          different.push({
            key,
            value1: variable.value,
            value2: var2.value,
          })
        }
        else {
          same.push(key)
        }
      }
    }

    // 检查 file2 中独有的变量
    for (const key of envFile2.variables.keys()) {
      if (!envFile1.variables.has(key)) {
        onlyInFile2.push(key)
      }
    }

    return { onlyInFile1, onlyInFile2, different, same }
  }
}

/**
 * 创建环境变量管理器实例
 */
export function createEnvManager(cwd?: string): EnvManager {
  return new EnvManager(cwd)
}
