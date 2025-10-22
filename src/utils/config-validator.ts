/**
 * 配置验证工具
 * 
 * 使用 Zod 提供类型安全的配置验证
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

import { z } from 'zod'
import { Logger } from './logger'

/**
 * 服务器配置 Schema
 */
export const serverConfigSchema = z.object({
  port: z.number().int().min(1).max(65535).optional(),
  host: z.string().optional(),
  https: z.boolean().optional(),
  open: z.union([z.boolean(), z.string()]).optional(),
  cors: z.boolean().optional(),
  proxy: z.record(z.any()).optional(),
  headers: z.record(z.string()).optional()
}).optional()

/**
 * 构建配置 Schema
 */
export const buildConfigSchema = z.object({
  outDir: z.string().optional(),
  assetsDir: z.string().optional(),
  sourcemap: z.union([z.boolean(), z.literal('inline'), z.literal('hidden')]).optional(),
  minify: z.union([z.boolean(), z.literal('terser'), z.literal('esbuild')]).optional(),
  target: z.union([z.string(), z.array(z.string())]).optional(),
  cssCodeSplit: z.boolean().optional(),
  rollupOptions: z.any().optional()
}).optional()

/**
 * Launcher 配置 Schema
 */
export const launcherConfigSchema = z.object({
  logLevel: z.enum(['debug', 'info', 'warn', 'error', 'silent']).optional(),
  autoRestart: z.boolean().optional(),
  clearScreen: z.boolean().optional(),
  configFile: z.string().optional(),
  hooks: z.object({
    beforeStart: z.function().optional(),
    afterStart: z.function().optional(),
    beforeBuild: z.function().optional(),
    afterBuild: z.function().optional()
  }).optional()
}).optional()

/**
 * 完整配置 Schema
 */
export const viteLauncherConfigSchema = z.object({
  root: z.string().optional(),
  base: z.string().optional(),
  mode: z.string().optional(),
  define: z.record(z.any()).optional(),
  plugins: z.array(z.any()).optional(),
  publicDir: z.string().optional(),
  cacheDir: z.string().optional(),
  resolve: z.object({
    alias: z.union([
      z.record(z.string()),
      z.array(z.object({
        find: z.union([z.string(), z.instanceof(RegExp)]),
        replacement: z.string(),
        customResolver: z.any().optional()
      }))
    ]).optional(),
    dedupe: z.array(z.string()).optional(),
    conditions: z.array(z.string()).optional(),
    mainFields: z.array(z.string()).optional(),
    extensions: z.array(z.string()).optional()
  }).optional(),
  css: z.object({
    modules: z.any().optional(),
    postcss: z.any().optional(),
    preprocessorOptions: z.record(z.any()).optional()
  }).optional(),
  json: z.object({
    namedExports: z.boolean().optional(),
    stringify: z.boolean().optional()
  }).optional(),
  esbuild: z.any().optional(),
  assetsInclude: z.union([z.string(), z.array(z.string()), z.instanceof(RegExp)]).optional(),
  logLevel: z.enum(['info', 'warn', 'error', 'silent']).optional(),
  clearScreen: z.boolean().optional(),
  envDir: z.string().optional(),
  envPrefix: z.union([z.string(), z.array(z.string())]).optional(),
  server: serverConfigSchema,
  build: buildConfigSchema,
  preview: serverConfigSchema,
  optimizeDeps: z.object({
    entries: z.union([z.string(), z.array(z.string())]).optional(),
    exclude: z.array(z.string()).optional(),
    include: z.array(z.string()).optional(),
    esbuildOptions: z.any().optional()
  }).optional(),
  launcher: launcherConfigSchema
})

/**
 * 配置验证器类
 */
export class ConfigValidator {
  private logger: Logger

  constructor(logger?: Logger) {
    this.logger = logger || new Logger('ConfigValidator')
  }

  /**
   * 验证完整配置
   * @param config 待验证的配置
   * @returns 验证结果
   */
  validate(config: unknown): {
    success: boolean
    data?: any
    errors?: z.ZodError
  } {
    try {
      const result = viteLauncherConfigSchema.safeParse(config)

      if (result.success) {
        this.logger.debug('✅ 配置验证通过')
        return {
          success: true,
          data: result.data
        }
      } else {
        this.logger.warn('⚠️  配置验证失败')
        this.logValidationErrors(result.error)
        return {
          success: false,
          errors: result.error
        }
      }
    } catch (error) {
      this.logger.error('配置验证异常', error)
      return {
        success: false
      }
    }
  }

  /**
   * 验证服务器配置
   */
  validateServerConfig(config: unknown): {
    success: boolean
    data?: any
    errors?: z.ZodError
  } {
    const result = serverConfigSchema.safeParse(config)

    if (!result.success) {
      this.logValidationErrors(result.error)
    }

    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      errors: result.success ? undefined : result.error
    }
  }

  /**
   * 验证构建配置
   */
  validateBuildConfig(config: unknown): {
    success: boolean
    data?: any
    errors?: z.ZodError
  } {
    const result = buildConfigSchema.safeParse(config)

    if (!result.success) {
      this.logValidationErrors(result.error)
    }

    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      errors: result.success ? undefined : result.error
    }
  }

  /**
   * 记录验证错误
   */
  private logValidationErrors(errors: z.ZodError): void {
    this.logger.error('配置验证错误:')

    for (const issue of errors.issues) {
      const path = issue.path.join('.')
      this.logger.error(`  - ${path || 'root'}: ${issue.message}`)
    }
  }

  /**
   * 格式化验证错误
   */
  formatErrors(errors: z.ZodError): string[] {
    return errors.issues.map(issue => {
      const path = issue.path.join('.')
      return `${path || 'root'}: ${issue.message}`
    })
  }

  /**
   * 获取配置默认值
   */
  getDefaults(): any {
    return {
      server: {
        port: 3000,
        host: 'localhost',
        https: false,
        open: false,
        cors: false
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'esbuild',
        target: 'esnext'
      },
      launcher: {
        logLevel: 'info',
        autoRestart: true,
        clearScreen: true
      }
    }
  }

  /**
   * 合并配置并验证
   * @param userConfig 用户配置
   * @param defaultConfig 默认配置
   */
  mergeAndValidate(userConfig: unknown, defaultConfig: any = this.getDefaults()): {
    success: boolean
    config?: any
    errors?: z.ZodError
  } {
    // 深度合并配置
    const merged = this.deepMerge(defaultConfig, userConfig)

    // 验证合并后的配置
    const result = this.validate(merged)

    return {
      success: result.success,
      config: result.success ? result.data : undefined,
      errors: result.errors
    }
  }

  /**
   * 深度合并对象
   */
  private deepMerge(target: any, source: any): any {
    if (!source || typeof source !== 'object') {
      return target
    }

    const result = { ...target }

    for (const key in source) {
      if (source[key] !== undefined) {
        if (
          typeof source[key] === 'object' &&
          !Array.isArray(source[key]) &&
          typeof target[key] === 'object' &&
          !Array.isArray(target[key])
        ) {
          result[key] = this.deepMerge(target[key], source[key])
        } else {
          result[key] = source[key]
        }
      }
    }

    return result
  }
}

/**
 * 创建配置验证器实例
 */
export function createConfigValidator(logger?: Logger): ConfigValidator {
  return new ConfigValidator(logger)
}

/**
 * 全局配置验证器实例
 */
export const configValidator = new ConfigValidator()

/**
 * 快捷验证函数（基于 Zod Schema）
 * @param config 待验证的配置
 */
export function validateConfigWithZod(config: unknown): ReturnType<ConfigValidator['validate']> {
  return configValidator.validate(config)
}

