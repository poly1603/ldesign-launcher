/**
 * 核心模块统一导出
 */

// 基础核心模块
export { ViteLauncher } from './ViteLauncher'
export { ConfigManager } from './ConfigManager'
export { CacheManager, cacheManager } from './CacheManager'
export { BuildCache } from './BuildCache'
export { SmartPluginManager } from './SmartPluginManager'
export { PluginManager } from './PluginManager'
export { PluginMarketManager, pluginMarket } from './PluginMarket'
export { ToolsManager, createToolsManager, createToolsPlugins } from './ToolsManager'
export { AliasManager, createAliasManager } from './AliasManager'
// ErrorHandler is in utils, not core

// 性能优化模块
export { PerformanceOptimizer, createPerformanceOptimizer } from './PerformanceOptimizer'
export { DevExperience, createDevExperience } from './DevExperience'
export { TestIntegration, createTestIntegration } from './TestIntegration'

// 新增功能模块
// 新功能模块暂时移除

// 导出类型 - 简化方式
export type * from './ViteLauncher'
export type * from './ConfigManager'
// export type * from './CacheManager'  // 避免 CacheStats 冲突
export type { CacheType, CacheItem, CacheConfig } from './CacheManager'
// export type * from './BuildCache'  // 避免 CacheStats 冲突
// export type { CacheEntry } from './BuildCache'  // CacheEntry 是内部类型
export type * from './SmartPluginManager'
export type * from './PluginManager'
export type * from './PluginMarket'
export type * from './ToolsManager'
export type * from './AliasManager'
export type * from './PerformanceOptimizer'
export type * from './DevExperience'
export type * from './TestIntegration'
// export type * from './IncrementalBuilder'
// export type * from './DistributedCache'