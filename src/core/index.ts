/**
 * 核心模块统一导出
 * 
 * 只保留核心启动和配置功能
 *
 * @author LDesign Team
 * @since 2.1.0
 */

// 核心启动器（2.0 新架构）
export * from './Launcher'

// 旧架构（向后兼容）
export * from './ViteLauncher'
export * from './bootstrap'

// 配置管理
export * from './ConfigManager'
export * from './ConfigPresets'

// 插件管理
export * from './PluginManager'
export * from './PluginOrchestrator'

// 别名管理
export * from './AliasManager'

// Manager 基础设施
export * from './EngineManager'
export * from './ServerManager'

// 默认导出新 Launcher（推荐使用）
export { Launcher as default } from './Launcher'
