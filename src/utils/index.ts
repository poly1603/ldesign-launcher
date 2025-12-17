/**
 * @ldesign/launcher 工具函数
 *
 * 导出所有工具函数
 *
 * @author LDesign Team
 * @since 1.0.0
 */

// 别名工具函数和类型
export * from './aliases'
export * from './build'
export * from './cache-manager'
export { formatFileSize as formatFileSizeFromBuild } from './build'
// 导出所有工具函数
export * from './config'
export * from './config-merger'

export * from './error-friendly'
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

export * from './keyboard'

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

// 新增工具导出
export * from './network-info'
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

// 模板生成器
export * from './template-generator'

// 依赖分析器
export * from './dependency-analyzer'

// Bundle 分析器
export * from './bundle-analyzer'

// 依赖检查器
export {
  DependencyChecker,
  checkDependencies,
  type DependencyInfo as DepCheckerInfo,
  type CheckResult as DepCheckResult,
} from './dependency-checker'

// 系统监控
export * from './system-monitor'

// 脚本运行器
export * from './script-runner'

// 环境变量管理
export * from './env-manager'

// 代码质量检查
export * from './code-quality'

// Git 工具
export * from './git-utils'

// 版本更新检查
export * from './update-checker'

// Node.js 版本检查与 Volta 安装
export * from './node-version-check'
