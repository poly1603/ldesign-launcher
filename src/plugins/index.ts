/**
 * 插件模块统一导出
 */

// 开发工具插件 - 需要从具体文件导入
// export { 
//   analyzePlugin,
//   compressionPlugin,
//   inspectorPlugin,
//   legacyPlugin,
//   bundleVisualizerPlugin
// } from './dev-tools'

// 微前端插件 - 需要从具体文件导入
// export {
//   microAppsPlugin,
//   moduleUnionPlugin,
//   singleSpaPlugin
// } from './micro-frontend'

// 插件预设
export {
  presetManager,
  definePreset
} from './presets'

// 插件市场 - 暂时移除
// export { PluginMarket } from './PluginMarket'

// HMR增强插件
// export { HMREnhancedPlugin } from './hmr-enhanced'

// 导出类型
// export type * from './dev-tools'
// export type * from './micro-frontend'
export type * from './presets'
// export type * from './PluginMarket'
// export type * from './hmr-enhanced'