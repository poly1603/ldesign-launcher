/**
 * @ldesign/launcher 工具函数
 *
 * 导出所有工具函数
 *
 * @author LDesign Team
 * @since 1.0.0
 */

export * from './build'
export { formatFileSize as formatFileSizeFromBuild } from './build'
// 导出所有工具函数
export * from './config'
export * from './config-merger'

export * from './error-handler'
export * from './file-system'
export {
  // format utils
  formatDuration,
  formatJson,
  formatNumber,
  formatPath,
  formatPercentage,
  formatRelativeTime,
  formatUrl,
} from './format'
export { formatFileSize as formatFileSizeFromFormat } from './format'
// 导出核心工具
export * from './logger'

export {
  buildUrl,
  checkUrlAccessibility,
  // network utils (避免与server模块中的getNetworkInterfaces冲突)
  downloadFile,
  getLocalIPs,
  getPreferredLocalIP,
  isLocalAddress,
  parseUrl,
} from './network'

export { getNetworkInterfaces as getNetworkInterfacesFromNetwork } from './network'

export * from './path-utils'

export * from './performance'

export * from './plugin'
// 选择性导出以避免命名冲突
export {
  findAvailablePort,
  getNetworkUrls,
  getServerStatus,
  getServerSummary,
  getServerUrl,
  // server utils
  isPortAvailable,
  logServerInfo,
  openBrowser,
  parseHost,
  waitForServer,
} from './server'
export { isValidUrl as isValidUrlFromServer } from './server'
export { getNetworkInterfaces as getNetworkInterfacesFromServer } from './server'
export {
  isValidBuildTarget,
  isValidEnvVarName,
  isValidFilePath,
  isValidHost,
  isValidLogLevel,
  isValidMinifyOption,
  isValidMode,
  // validation utils (避免与server模块中的isValidUrl冲突)
  isValidPort,
  isValidVersion,
  validateObjectSchema,
} from './validation'
// 解决冲突的函数导出（使用别名）
export { isValidUrl as isValidUrlFromValidation } from './validation'

// 新增工具导出
export * from './network-info'
export * from './keyboard'
export * from './error-friendly'
