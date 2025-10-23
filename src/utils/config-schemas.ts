/**
 * 配置验证 Schema 定义
 * 
 * 使用 Zod 进行配置验证
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { z } from 'zod'

/**
 * 端口号 Schema
 */
export const portSchema = z.number()
  .int('端口号必须是整数')
  .min(1, '端口号最小值为 1')
  .max(65535, '端口号最大值为 65535')

/**
 * 主机名 Schema
 */
export const hostSchema = z.union([
  z.string().min(1, '主机名不能为空'),
  z.boolean()
])

/**
 * 日志级别 Schema
 */
export const logLevelSchema = z.enum(['silent', 'error', 'warn', 'info', 'debug'])

/**
 * 运行模式 Schema
 */
export const modeSchema = z.enum(['development', 'production', 'test'])

/**
 * HTTPS 配置 Schema
 */
export const httpsSchema = z.union([
  z.boolean(),
  z.object({
    key: z.union([z.string(), z.instanceof(Buffer)]).optional(),
    cert: z.union([z.string(), z.instanceof(Buffer)]).optional()
  }).passthrough()
])

/**
 * 代理配置 Schema
 */
export const proxyConfigSchema = z.record(
  z.union([
    z.string(),
    z.object({
      target: z.string().url('代理目标必须是有效的 URL'),
      changeOrigin: z.boolean().optional(),
      rewrite: z.function().optional(),
      ws: z.boolean().optional()
    }).passthrough()
  ])
)

/**
 * CORS 配置 Schema
 */
export const corsSchema = z.union([
  z.boolean(),
  z.object({
    origin: z.union([
      z.string(),
      z.array(z.string()),
      z.boolean()
    ]).optional(),
    credentials: z.boolean().optional(),
    methods: z.array(z.string()).optional(),
    allowedHeaders: z.array(z.string()).optional()
  }).passthrough()
])

/**
 * 服务器配置 Schema
 */
export const serverConfigSchema = z.object({
  host: hostSchema.optional(),
  port: portSchema.optional(),
  strictPort: z.boolean().optional(),
  https: httpsSchema.optional(),
  open: z.union([z.boolean(), z.string()]).optional(),
  proxy: proxyConfigSchema.optional(),
  cors: corsSchema.optional(),
  hmr: z.union([
    z.boolean(),
    z.object({
      protocol: z.string().optional(),
      host: z.string().optional(),
      port: z.number().optional(),
      clientPort: z.number().optional()
    }).passthrough()
  ]).optional()
}).passthrough()

/**
 * 构建配置 Schema
 */
export const buildConfigSchema = z.object({
  target: z.union([
    z.string(),
    z.array(z.string())
  ]).optional(),
  outDir: z.string().optional(),
  assetsDir: z.string().optional(),
  assetsInlineLimit: z.number().min(0).optional(),
  cssCodeSplit: z.boolean().optional(),
  sourcemap: z.union([
    z.boolean(),
    z.enum(['inline', 'hidden'])
  ]).optional(),
  minify: z.union([
    z.boolean(),
    z.enum(['terser', 'esbuild'])
  ]).optional(),
  emptyOutDir: z.boolean().optional()
}).passthrough()

/**
 * Launcher 特有配置 Schema
 */
export const launcherConfigSchema = z.object({
  autoRestart: z.boolean().optional(),
  logLevel: logLevelSchema.optional(),
  mode: modeSchema.optional(),
  debug: z.boolean().optional(),
  configFile: z.string().optional(),
  cwd: z.string().optional(),
  aliasStages: z.array(z.enum(['dev', 'build', 'preview'])).optional()
}).passthrough()

/**
 * 完整配置 Schema
 */
export const viteLauncherConfigSchema = z.object({
  server: serverConfigSchema.optional(),
  build: buildConfigSchema.optional(),
  preview: serverConfigSchema.optional(),
  launcher: launcherConfigSchema.optional(),
  mode: modeSchema.optional(),
  root: z.string().optional(),
  base: z.string().optional(),
  publicDir: z.string().optional()
}).passthrough()

/**
 * 验证配置
 */
export function validateLauncherConfig(config: unknown) {
  return viteLauncherConfigSchema.safeParse(config)
}

/**
 * 验证服务器配置
 */
export function validateServerConfig(config: unknown) {
  return serverConfigSchema.safeParse(config)
}

/**
 * 验证构建配置
 */
export function validateBuildConfig(config: unknown) {
  return buildConfigSchema.safeParse(config)
}

/**
 * 格式化验证错误
 */
export function formatValidationError(error: z.ZodError): string {
  return error.errors.map(err => {
    const path = err.path.join('.')
    return `${path}: ${err.message}`
  }).join('\n')
}

/**
 * 验证并提供建议
 */
export function validateWithSuggestions(config: unknown) {
  const result = validateLauncherConfig(config)
  
  if (!result.success) {
    const formatted = formatValidationError(result.error)
    const suggestions: string[] = []
    
    // 分析错误并提供建议
    result.error.errors.forEach(err => {
      const path = err.path.join('.')
      
      if (path.includes('port')) {
        suggestions.push('💡 端口号必须在 1-65535 范围内')
      }
      
      if (path.includes('logLevel')) {
        suggestions.push('💡 日志级别必须是: silent, error, warn, info, debug 之一')
      }
      
      if (path.includes('mode')) {
        suggestions.push('💡 运行模式必须是: development, production, test 之一')
      }
      
      if (path.includes('proxy.target')) {
        suggestions.push('💡 代理目标必须是有效的 URL (如: http://localhost:8080)')
      }
    })
    
    return {
      valid: false,
      errors: formatted,
      suggestions: [...new Set(suggestions)] // 去重
    }
  }
  
  return {
    valid: true,
    data: result.data
  }
}


