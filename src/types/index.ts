/**
 * @ldesign/launcher 类型定义
 *
 * 导出所有类型定义，为 TypeScript 提供完整的类型支持
 *
 * @author LDesign Team
 * @since 1.0.0
 */

// 导出工具类型
export type { Logger } from '../utils/logger'
export * from './cli'
// 导出所有类型定义
export * from './common'
export * from './config'
export * from './deploy'
// 新增：引擎类型定义 (v2.0.0)
export * from './engine'
// 导出框架类型定义（排除与 common.ts 冲突的导出）
export {
  // 排除 FrameworkDetectionResult 和 FrameworkType，因为它们已在 common.ts 中导出
  type FrameworkAdapter,
  type FrameworkAdapterFactory,
  type FrameworkDependencies,
  type FrameworkDetector,
  type FrameworkFeatures,
  type FrameworkMetadata,
  type FrameworkOptions,
  type FrameworkVersion,
} from './framework'

export * from './launcher'

export * from './plugin'

export * from './server'
export * from './ui-config'
// 从 ui-config 中选择性导出，避免与 config.ts 中的 EnvironmentConfig 冲突
export type {
  getConfigFields,
  getDefaultEnvironment,
  getEnvironmentConfig,
  getEnvironmentConfigPath,
  getNestedValue,
  setNestedValue,
  SUPPORTED_ENVIRONMENTS,
  UIConfigField,
  UIConfigSection,
  UIEnvironmentConfig,
  validateConfigValue,
} from './ui-config'

// 导出错误类型 (v2.1.0 新增)
export type {
  ErrorContext,
  SerializedError,
} from '../errors'
