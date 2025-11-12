/**
 * 核心模块统一导出
 * 
 * 只保留核心启动和配置功能
 *
 * @author LDesign Team
 * @since 2.1.0
 */

// 核心启动器
export * from './Launcher'
export * from './ViteLauncher'
export * from './bootstrap'

// 配置管理
export * from './ConfigManager'
export * from './ConfigPresets'

// 插件管理
export * from './PluginManager'
export * from './SmartPluginManager'
export * from './SmartPresetManager'

// 别名管理
export * from './AliasManager'

// 服务器和构建管理
export * from './ServerManager'
export * from './BuildManager'

// 默认导出
export { Launcher as default } from './Launcher'
