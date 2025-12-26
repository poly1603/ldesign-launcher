/**
 * 环境变量加载器
 *
 * 提供环境变量的加载、验证和管理功能
 * 支持 .env、.env.local、.env.[mode]、.env.[mode].local 文件
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { Logger } from './logger'

const logger = new Logger('EnvLoader')

/**
 * 环境变量配置
 */
export interface EnvConfig {
  /** 环境变量映射 */
  variables?: Record<string, string>
  /** 环境变量文件路径 */
  envFile?: string | string[]
  /** 环境变量前缀，只有以该前缀开头的变量会被暴露给客户端 */
  prefix?: string
  /** 是否展开环境变量（支持 $VAR 语法） */
  expand?: boolean
  /** 默认环境变量 */
  defaults?: Record<string, string>
  /** 必需的环境变量，如果缺失会抛出错误 */
  required?: string[]
  /** 是否加载 .env.local 文件 */
  loadLocal?: boolean
  /** 是否将环境变量注入到 process.env */
  injectToProcess?: boolean
}

/**
 * 环境变量验证结果
 */
export interface EnvValidationResult {
  valid: boolean
  missing: string[]
  warnings: string[]
}

/**
 * 环境变量加载器类
 */
export class EnvLoader {
  private cwd: string
  private mode: string
  private config: EnvConfig
  private loadedEnv: Record<string, string> = {}

  constructor(cwd: string, mode: string = 'development', config: EnvConfig = {}) {
    this.cwd = cwd
    this.mode = mode
    this.config = {
      prefix: 'VITE_',
      expand: true,
      loadLocal: true,
      injectToProcess: true,
      ...config,
    }
  }

  /**
   * 加载环境变量
   *
   * @returns 加载的环境变量
   */
  async load(): Promise<Record<string, string>> {
    const env: Record<string, string> = {}

    // 1. 加载默认值
    if (this.config.defaults) {
      Object.assign(env, this.config.defaults)
    }

    // 2. 确定要加载的文件列表（按优先级从低到高排序）
    const envFiles = this.getEnvFilePaths()

    // 3. 依次加载环境变量文件
    for (const envFile of envFiles) {
      const loaded = await this.loadEnvFile(envFile)
      Object.assign(env, loaded)
    }

    // 4. 加载用户指定的额外文件
    if (this.config.envFile) {
      const extraFiles = Array.isArray(this.config.envFile)
        ? this.config.envFile
        : [this.config.envFile]

      for (const file of extraFiles) {
        const filePath = path.isAbsolute(file) ? file : path.resolve(this.cwd, file)
        const loaded = await this.loadEnvFile(filePath)
        Object.assign(env, loaded)
      }
    }

    // 5. 合并用户显式指定的变量（最高优先级）
    if (this.config.variables) {
      Object.assign(env, this.config.variables)
    }

    // 6. 展开变量引用
    if (this.config.expand) {
      this.expandVariables(env)
    }

    // 7. 验证必需变量
    const validation = this.validate(env)
    if (!validation.valid) {
      throw new Error(
        `缺少必需的环境变量: ${validation.missing.join(', ')}\n`
        + `请在 .env 文件中定义这些变量或通过环境变量传入`,
      )
    }

    if (validation.warnings.length > 0) {
      validation.warnings.forEach((warning) => {
        logger.warn(warning)
      })
    }

    // 8. 注入到 process.env
    if (this.config.injectToProcess) {
      this.injectToProcessEnv(env)
    }

    this.loadedEnv = env
    logger.info(`已加载 ${Object.keys(env).length} 个环境变量`)

    return env
  }

  /**
   * 获取环境变量文件路径列表
   */
  private getEnvFilePaths(): string[] {
    const files: string[] = []

    // 基础 .env 文件
    files.push(path.resolve(this.cwd, '.env'))

    // .env.local（本地覆盖，不提交到 git）
    if (this.config.loadLocal && this.mode !== 'test') {
      files.push(path.resolve(this.cwd, '.env.local'))
    }

    // .env.[mode] 文件
    files.push(path.resolve(this.cwd, `.env.${this.mode}`))

    // .env.[mode].local 文件
    if (this.config.loadLocal) {
      files.push(path.resolve(this.cwd, `.env.${this.mode}.local`))
    }

    return files
  }

  /**
   * 加载单个环境变量文件
   */
  private async loadEnvFile(filePath: string): Promise<Record<string, string>> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const env = this.parseEnvContent(content)

      logger.debug(`已加载环境变量文件: ${filePath}`, { count: Object.keys(env).length })
      return env
    }
    catch (error: any) {
      if (error.code !== 'ENOENT') {
        logger.warn(`读取环境变量文件失败: ${filePath}`, { error: error.message })
      }
      return {}
    }
  }

  /**
   * 解析环境变量文件内容
   */
  private parseEnvContent(content: string): Record<string, string> {
    const env: Record<string, string> = {}
    const lines = content.split('\n')

    for (let line of lines) {
      // 移除注释
      const commentIndex = line.indexOf('#')
      if (commentIndex >= 0) {
        // 检查 # 是否在引号内
        const beforeComment = line.slice(0, commentIndex)
        const singleQuotes = (beforeComment.match(/'/g) || []).length
        const doubleQuotes = (beforeComment.match(/"/g) || []).length

        // 如果引号数量是偶数，说明 # 不在引号内
        if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0) {
          line = beforeComment
        }
      }

      // 移除空白
      line = line.trim()

      // 跳过空行
      if (!line) {
        continue
      }

      // 解析 KEY=VALUE
      const equalIndex = line.indexOf('=')
      if (equalIndex === -1) {
        continue
      }

      const key = line.slice(0, equalIndex).trim()
      let value = line.slice(equalIndex + 1).trim()

      // 移除引号
      if ((value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith('\'') && value.endsWith('\''))) {
        value = value.slice(1, -1)
      }

      // 处理转义字符
      value = value
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')

      env[key] = value
    }

    return env
  }

  /**
   * 展开变量引用（支持 $VAR 和 ${VAR} 语法）
   */
  private expandVariables(env: Record<string, string>): void {
    const MAX_ITERATIONS = 10 // 防止循环引用
    let iteration = 0

    const expand = () => {
      let hasChanges = false

      for (const key of Object.keys(env)) {
        const value = env[key]
        const expanded = value.replace(/\$\{?(\w+)\}?/g, (match, varName) => {
          // 优先使用已加载的环境变量，其次使用 process.env
          const replacement = env[varName] ?? process.env[varName] ?? match
          if (replacement !== match) {
            hasChanges = true
          }
          return replacement
        })
        env[key] = expanded
      }

      return hasChanges
    }

    while (expand() && iteration < MAX_ITERATIONS) {
      iteration++
    }

    if (iteration >= MAX_ITERATIONS) {
      logger.warn('环境变量展开达到最大迭代次数，可能存在循环引用')
    }
  }

  /**
   * 验证环境变量
   */
  validate(env: Record<string, string>): EnvValidationResult {
    const result: EnvValidationResult = {
      valid: true,
      missing: [],
      warnings: [],
    }

    // 检查必需变量
    if (this.config.required) {
      for (const key of this.config.required) {
        if (!(key in env) && !(key in process.env)) {
          result.missing.push(key)
        }
      }
    }

    if (result.missing.length > 0) {
      result.valid = false
    }

    // 检查常见配置问题
    const prefix = this.config.prefix || 'VITE_'
    const clientVars = Object.keys(env).filter(key => key.startsWith(prefix))
    const serverVars = Object.keys(env).filter(key => !key.startsWith(prefix))

    if (serverVars.some(key => key.includes('SECRET') || key.includes('PASSWORD') || key.includes('KEY'))) {
      result.warnings.push(
        `检测到可能包含敏感信息的环境变量，但它们没有使用 ${prefix} 前缀。`
        + `这些变量不会暴露给客户端，但建议使用更明确的命名。`,
      )
    }

    logger.debug(`环境变量验证完成: ${clientVars.length} 个客户端变量, ${serverVars.length} 个服务端变量`)

    return result
  }

  /**
   * 注入环境变量到 process.env
   */
  private injectToProcessEnv(env: Record<string, string>): void {
    for (const [key, value] of Object.entries(env)) {
      // 不覆盖已存在的 process.env 变量
      if (!(key in process.env)) {
        process.env[key] = value
      }
    }
  }

  /**
   * 获取客户端可用的环境变量（带指定前缀的）
   */
  getClientEnv(): Record<string, string> {
    const prefix = this.config.prefix || 'VITE_'
    const clientEnv: Record<string, string> = {}

    for (const [key, value] of Object.entries(this.loadedEnv)) {
      if (key.startsWith(prefix)) {
        clientEnv[key] = value
      }
    }

    return clientEnv
  }

  /**
   * 获取所有加载的环境变量
   */
  getAllEnv(): Record<string, string> {
    return { ...this.loadedEnv }
  }

  /**
   * 获取单个环境变量
   */
  get(key: string, defaultValue?: string): string | undefined {
    return this.loadedEnv[key] ?? process.env[key] ?? defaultValue
  }
}

/**
 * 创建环境变量加载器
 */
export function createEnvLoader(
  cwd: string,
  mode?: string,
  config?: EnvConfig,
): EnvLoader {
  return new EnvLoader(cwd, mode, config)
}

/**
 * 快速加载环境变量
 */
export async function loadEnv(
  cwd: string,
  mode: string = 'development',
  config?: EnvConfig,
): Promise<Record<string, string>> {
  const loader = new EnvLoader(cwd, mode, config)
  return loader.load()
}
