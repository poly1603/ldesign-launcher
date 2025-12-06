/**
 * @ldesign/launcher - 基于 Vite JavaScript API 的前端项目启动器
 *
 * 提供统一的开发服务器、构建工具和预览服务，支持多种前端技术栈
 *
 * @author LDesign Team
 * @version 2.0.0
 * @since 1.0.0
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

// 导出部署模块
export * from './deploy'

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

// 导出版本信息
export const version = '2.0.0'

// 为了保持导出一致性，使用 createLauncher 函数
// 提供懒加载的方式访问所有模块
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
