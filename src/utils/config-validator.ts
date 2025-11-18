/**
 * 配置验证工具
 *
 * 提供完整的配置文件验证功能
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type { ViteLauncherConfig } from '../types'
import { createConfigError, ErrorCode } from './errors'
import { Logger } from './logger'

const configValidatorLogger = new Logger('ConfigValidator')

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

/**
 * 验证错误
 */
export interface ValidationError {
  path: string
  message: string
  code: ErrorCode
  value?: any
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  path: string
  message: string
  suggestion?: string
}

/**
 * 配置验证器
 */
export class ConfigValidator {
  private errors: ValidationError[] = []
  private warnings: ValidationWarning[] = []

  /**
   * 验证配置
   */
  validate(config: ViteLauncherConfig): ValidationResult {
    this.errors = []
    this.warnings = []

    // 验证服务器配置
    if (config.server) {
      this.validateServer(config.server)
    }

    // 验证构建配置
    if (config.build) {
      this.validateBuild(config.build)
    }

    // 验证插件配置
    if (config.plugins) {
      this.validatePlugins(config.plugins)
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    }
  }

  /**
   * 验证服务器配置
   */
  private validateServer(server: any): void {
    // 验证端口
    if (server.port !== undefined) {
      if (typeof server.port !== 'number') {
        this.addError('server.port', '端口必须是数字', ErrorCode.CONFIG_VALIDATION_ERROR, server.port)
      }
      else if (server.port < 1 || server.port > 65535) {
        this.addError('server.port', '端口必须在 1-65535 之间', ErrorCode.CONFIG_VALIDATION_ERROR, server.port)
      }
    }

    // 验证主机
    if (server.host !== undefined && typeof server.host !== 'string') {
      this.addError('server.host', '主机必须是字符串', ErrorCode.CONFIG_VALIDATION_ERROR, server.host)
    }
  }

  /**
   * 验证构建配置
   */
  private validateBuild(build: any): void {
    // 验证输出目录
    if (build.outDir !== undefined && typeof build.outDir !== 'string') {
      this.addError('build.outDir', '输出目录必须是字符串', ErrorCode.CONFIG_VALIDATION_ERROR, build.outDir)
    }

    // 性能建议
    if (build.sourcemap === true && build.minify !== false) {
      this.addWarning('build', '生产环境建议使用 sourcemap: "hidden" 以隐藏源码', '使用 sourcemap: "hidden"')
    }
  }

  /**
   * 验证插件配置
   */
  private validatePlugins(plugins: any): void {
    if (!Array.isArray(plugins)) {
      this.addError('plugins', '插件配置必须是数组', ErrorCode.CONFIG_VALIDATION_ERROR, plugins)
      return
    }

    // 检查重复插件
    const pluginNames = new Set<string>()
    plugins.forEach((plugin, index) => {
      if (plugin && typeof plugin === 'object' && plugin.name) {
        if (pluginNames.has(plugin.name)) {
          this.addWarning(`plugins[${index}]`, `插件 ${plugin.name} 重复`, '移除重复的插件配置')
        }
        pluginNames.add(plugin.name)
      }
    })
  }

  /**
   * 添加错误
   */
  private addError(path: string, message: string, code: ErrorCode, value?: any): void {
    this.errors.push({ path, message, code, value })
  }

  /**
   * 添加警告
   */
  private addWarning(path: string, message: string, suggestion?: string): void {
    this.warnings.push({ path, message, suggestion })
  }
}

/**
 * 验证配置
 */
export function validateConfig(config: ViteLauncherConfig): ValidationResult {
  const validator = new ConfigValidator()
  return validator.validate(config)
}

/**
 * 验证配置并抛出错误
 */
export function validateConfigOrThrow(config: ViteLauncherConfig): void {
  const result = validateConfig(config)

  if (!result.valid) {
    const errorMessages = result.errors.map(e => `  - ${e.path}: ${e.message}`)
    throw createConfigError(
      `配置验证失败:\n${errorMessages.join('\n')}`,
      ErrorCode.CONFIG_VALIDATION_ERROR,
      { errors: result.errors },
    )
  }

  // 输出警告
  if (result.warnings.length > 0) {
    configValidatorLogger.warn('配置警告：')
    result.warnings.forEach((w) => {
      configValidatorLogger.warn(`  - ${w.path}: ${w.message}`)
      if (w.suggestion) {
        configValidatorLogger.warn(`    建议: ${w.suggestion}`)
      }
    })
  }
}
