/**
 * @ldesign/launcher 客户端运行时
 * 
 * 提供应用配置管理和框架特定的 Hook/Composable
 */

// 导出核心配置管理器
export { appConfigManager, getAppConfig, subscribeConfig, getEnvironment } from './app-config'
export type { AppConfig } from './app-config'

// 导出 Launcher 配置管理器
export { launcherConfigManager, getLauncherConfig, subscribeLauncherConfig, getLauncherEnvironment } from './launcher-config'
export type { LauncherConfig } from './launcher-config'

// 导出通知功能
export { notification, showNotification, closeNotification, closeAllNotifications } from './notification'
export type { NotificationOptions } from './notification'

// 导出框架特定的 Hook/Composable
// 注意：这些导出是可选的，只在对应框架的项目中使用

// React
export { useAppConfig as useAppConfigReact } from './react/useAppConfig'
export type { UseAppConfigReturn as UseAppConfigReturnReact } from './react/useAppConfig'

// Vue 3
export { useAppConfig as useAppConfigVue } from './vue/useAppConfig'
export type { UseAppConfigReturn as UseAppConfigReturnVue } from './vue/useAppConfig'
export { useLauncherConfig as useLauncherConfigVue } from './vue/useLauncherConfig'
export type { UseLauncherConfigReturn as UseLauncherConfigReturnVue } from './vue/useLauncherConfig'

// Vue 2
export { appConfigMixin, getAppConfig as getAppConfigVue2, subscribeAppConfig } from './vue2/useAppConfig'
export type { AppConfigData } from './vue2/useAppConfig'

// Svelte
export { appConfig, appEnvironment } from './svelte/useAppConfig'

// Solid
export { useAppConfig as useAppConfigSolid } from './solid/useAppConfig'
export type { UseAppConfigReturn as UseAppConfigReturnSolid } from './solid/useAppConfig'

// Qwik
export { useAppConfig as useAppConfigQwik } from './qwik/useAppConfig'
export type { UseAppConfigReturn as UseAppConfigReturnQwik } from './qwik/useAppConfig'

// Lit
export { AppConfigController, AppConfigMixin } from './lit/useAppConfig'

// Angular
export { AppConfigService } from './angular/useAppConfig'
