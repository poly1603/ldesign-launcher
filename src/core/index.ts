/**
 * 核心模块统一导出
 *
 * 只保留核心启动和配置功能
 *
 * @author LDesign Team
 * @since 2.1.0
 */

// 别名管理
export * from './AliasManager'

export * from './bootstrap'
// 配置管理
export * from './ConfigManager'

export * from './ConfigPresets'
// Manager 基础设施
export * from './EngineManager'

// 核心启动器（2.0 新架构）
export * from './Launcher'
// 默认导出新 Launcher（推荐使用）
export { Launcher as default } from './Launcher'

// 插件管理
export * from './PluginManager'

export * from './PluginOrchestrator'
export * from './ServerManager'

// 旧架构（向后兼容）
export * from './ViteLauncher'
