/**
 * @ldesign/launcher - 零配置前端项目启动器
 *
 * 基于 Vite 7.0+ JavaScript API 的前端项目启动器，
 * 提供统一的开发服务器、构建工具和预览服务。
 *
 * 核心特性：
 * - 🎯 零配置启动 - 自动检测框架并应用最佳配置
 * - 🚀 多框架支持 - 支持 13+ 主流前端框架
 * - ⚡ 性能优化 - esbuild 编译、配置缓存、节流控制
 * - 🛡️ 类型安全 - 完整的 TypeScript 支持
 * - 🔧 统一错误处理 - 结构化错误、错误聚合、友好提示
 *
 * @example
 * ```typescript
 * // 基础用法 - 零配置启动
 * import { ViteLauncher } from '@ldesign/launcher'
 *
 * const launcher = new ViteLauncher()
 * await launcher.startDev()  // 自动检测框架并启动
 *
 * // 使用配置文件
 * const launcher = new ViteLauncher({
 *   configFile: 'launcher.config.ts',
 * })
 * ```
 *
 * @example
 * ```typescript
 * // CLI 用法
 * // npx launcher dev          # 启动开发服务器
 * // npx launcher build        # 生产构建
 * // npx launcher preview      # 预览构建结果
 * // npx launcher cache list   # 查看缓存状态
 * ```
 *
 * @packageDocumentation
 * @author LDesign Team
 * @version 2.1.0
 * @since 1.0.0
 * @license MIT
 */

// 导出常量
export * from './constants'

// 导出别名管理器和相关类型
export { AliasManager, createAliasManager } from './core/AliasManager'
export type {
  AliasConfig,
  AliasEntry,
  AliasStage,
  BuildStage,
  CreateAliasOptions,
  SimpleAliasConfig,
  ViteAliasEntry,
} from './core/AliasManager'
// 导出核心启动类
export { bootstrap, isBootstrapped } from './core/bootstrap'

export { ConfigManager } from './core/ConfigManager'

export { EngineManager } from './core/EngineManager'
// 导出新架构核心类（2.0 推荐）
export { Launcher, LauncherOptions } from './core/Launcher'
// 默认导出新 Launcher（推荐使用）
export { Launcher as default } from './core/Launcher'

export { PluginOrchestrator } from './core/PluginOrchestrator'

export { ServerManager } from './core/ServerManager'
// 导出旧架构核心类（保持向后兼容）
export { ViteLauncher } from './core/ViteLauncher'
// 导出部署模块
export * from './deploy'
export { registerAllEngines, VITE_ENGINE_METADATA } from './engines'
// 导出引擎相关（避免与 types 冲突）
export { BuildEngine } from './engines/base/BuildEngine'

export { createViteEngineFactory, ViteConfigTransformer, ViteEngine } from './engines/vite'
export {
  LIT_FRAMEWORK_METADATA,
  MARKO_FRAMEWORK_METADATA,
  PREACT_FRAMEWORK_METADATA,
  QWIK_FRAMEWORK_METADATA,
  REACT_FRAMEWORK_METADATA,
  registerAllFrameworks,
  SOLID_FRAMEWORK_METADATA,
  SVELTE_FRAMEWORK_METADATA,
  VUE2_FRAMEWORK_METADATA,
  VUE3_FRAMEWORK_METADATA,
} from './frameworks'
// 导出框架相关（避免与 types 冲突）
export { FrameworkAdapter } from './frameworks/base/FrameworkAdapter'

export { createFrameworkDetector, FrameworkDetector } from './frameworks/base/FrameworkDetector'

// 导出 Mock 模块
export * from './mock'

// 导出开发工具插件
export * from './plugins'

// 导出插件预设系统
export { definePreset, presetManager } from './plugins/presets'
export type { PresetOptions, PresetType } from './plugins/presets'

export * from './plugins/presets'
// 导出注册表
export * from './registry'

// 导出类型定义（避免与实现类冲突）
export type * from './types'

// 导出UI配置相关函数
export {
  getConfigFields,
  getDefaultConfig,
  getDefaultEnvironment,
  getEnvironmentConfig,
  getEnvironmentConfigPath,
  getFieldByPath,
  getNestedValue,
  LAUNCHER_CONFIG_FIELDS,
  setNestedValue,
  SUPPORTED_ENVIRONMENTS,
  validateConfigValue,
} from './types/ui-config'

// 导出别名工具函数（类型已在上方从 AliasManager 导出）
export {
  createAlias,
  createBasicAliases,
  createBuildAlias,
  createDevAlias,
  createUniversalAlias,
  normalizeAliasEntry,
  parseAliasConfig,
  parseSimpleAliasConfig,
  stageToStages,
} from './utils/aliases'
export {
  analyzeBuildResult,
  generateBuildReport,
} from './utils/build'
// 配置和构建工具 - 避免重复导出
export {
  createPathResolver,
  loadConfigFile,
  mergeConfigs,
  validateConfig,
} from './utils/config'
// 导出配置定义函数
export { defineConfig } from './utils/config'
export {
  EnvironmentManager,
  environmentManager,
  generateDefines,
  getClientEnv,
  loadEnv,
} from './utils/env'

export { ErrorHandler, LauncherError } from './utils/error-handler'

/**
 * 统一错误处理系统 (v2.1.0 新增)
 *
 * 提供结构化错误类型和工具函数，支持：
 * - 错误分类（配置、服务器、构建、插件、文件系统、CLI）
 * - 错误严重程度和恢复策略
 * - 安全执行包装器
 * - 断言和类型守卫
 *
 * @example
 * ```typescript
 * import {
 *   ConfigError,
 *   isLauncherError,
 *   safeAsync,
 * } from '@ldesign/launcher'
 *
 * // 抛出结构化错误
 * throw new ConfigError('配置文件格式错误', { file: 'config.ts' })
 *
 * // 安全执行异步操作
 * const result = await safeAsync(riskyOperation())
 * if (result.success) {
 *   console.log(result.data)
 * } else {
 *   console.error(result.error)
 * }
 * ```
 */
export {
  // 错误类
  LauncherBaseError,
  ConfigError,
  ServerError,
  BuildError,
  PluginError,
  FileSystemError,
  CLIError,
  // 工具函数
  isLauncherError,
  isErrorType,
  wrapError,
  assertNonNull,
  assert,
  getErrorMessage,
  safeAsync,
  safeSync,
  createErrorFactory,
  // 类型
  type ErrorContext,
  type SerializedError,
} from './errors'

export { FileSystem } from './utils/file-system'

export {
  formatDuration,
} from './utils/format'

// 导出工具函数 - 只导出特定的工具，避免冲突
export { Logger } from './utils/logger'

export { PathUtils } from './utils/path-utils'

export {
  PerformanceMonitor,
} from './utils/performance'

export {
  validatePlugin,
} from './utils/plugin'

export {
  getServerUrl,
} from './utils/server'

export {
  isValidUrl,
} from './utils/server'

/**
 * 当前版本号
 *
 * @since 2.1.0
 */
export const version = '2.1.0'

/**
 * 创建 Launcher 懒加载工厂
 *
 * 提供懒加载的方式访问所有模块，适合需要按需加载的场景。
 *
 * @returns 懒加载模块工厂
 *
 * @example
 * ```typescript
 * const factory = createLauncher()
 * const Launcher = await factory.Launcher()
 * const launcher = new Launcher()
 * ```
 *
 * @since 2.0.0
 */
export function createLauncher() {
  return {
    version,
    Launcher: () => import('./core/Launcher').then(m => m.Launcher),
    ViteLauncher: () => import('./core/ViteLauncher').then(m => m.ViteLauncher),
    ConfigManager: () => import('./core/ConfigManager').then(m => m.ConfigManager),
    createCli: () => import('./cli').then(m => m.createCli),
  }
}

export {
  batchValidate,
  validateObjectSchema,
} from './utils/validation'
