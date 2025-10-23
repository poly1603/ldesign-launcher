/**
 * @ldesign/launcher 工具函数
 * 
 * 导出所有工具函数 - 使用明确的具名导出避免命名冲突
 * 
 * @author LDesign Team
 * @since 1.0.0
 */

// ==================== 核心工具 ====================
export * from './logger'
export * from './error-handler'
export * from './file-system'
export * from './path-utils'

// ==================== 配置相关 ====================
export {
  loadConfigFile,
  validateConfig,
  mergeConfigs,
  createPathResolver,
  defineConfig
} from './config'

export * from './config-cache'
export * from './config-validator'

// ==================== 构建和分析 ====================
export {
  analyzeBuildResult,
  generateBuildReport,
  formatFileSize as formatBuildFileSize  // 重命名避免冲突
} from './build'

export * from './bundle-analyzer'

// ==================== 服务器相关 ====================
export {
  isPortAvailable,
  findAvailablePort,
  getServerUrl,
  getNetworkUrls,
  waitForServer,
  getServerStatus,
  openBrowser,
  getServerSummary,
  parseHost,
  logServerInfo,
  isValidUrl as isValidServerUrl,  // 重命名避免与 validation 模块冲突
  getNetworkInterfaces as getServerNetworkInterfaces  // 重命名避免与 network 模块冲突
} from './server'

// ==================== 验证相关 ====================
export {
  isValidPort,
  isValidHost,
  isValidFilePath,
  isValidVersion,
  isValidEnvVarName,
  isValidLogLevel,
  isValidMode,
  isValidBuildTarget,
  isValidMinifyOption,
  validateObjectSchema,
  batchValidate,
  isValidUrl as validateUrl  // 重命名避免冲突
} from './validation'

// ==================== 网络相关 ====================
export {
  downloadFile,
  checkUrlAccessibility,
  parseUrl,
  buildUrl,
  isLocalAddress,
  getPreferredLocalIP,
  getLocalIPs,
  getNetworkInterfaces as getNetworkInterfacesList  // 重命名避免冲突
} from './network'

// ==================== 格式化相关 ====================
export {
  formatDuration,
  formatRelativeTime,
  formatPercentage,
  formatNumber,
  formatUrl,
  formatPath,
  formatJson,
  formatFileSize as formatFileSizeUtil  // 重命名避免冲突
} from './format'

// ==================== 性能和优化 ====================
export * from './performance'
export * from './memory-optimizer'

// ==================== 环境和进程 ====================
export {
  EnvironmentManager,
  environmentManager,
  loadEnv,
  getClientEnv,
  generateDefines
} from './env'

export * from './process-executor'

// ==================== 插件相关 ====================
export {
  validatePlugin
} from './plugin'

export * from './proxy-config'
export * from './smart-proxy'

// ==================== 安全和质量 ====================
export * from './security-scanner'
export * from './quality-monitor'
export * from './usage-analytics'

// ==================== UI 和交互 ====================
export {
  renderServerBanner,
  renderQRCode,
  renderProgressBar,
  renderTable,
  renderDivider,
  renderTitle,
  renderError,
  renderSuccess,
  renderWarning,
  renderInfo,
  stripAnsi,
  formatFileSize as formatUIFileSize,  // 重命名避免冲突
  type ServerInfoItem,
  type QRCodeOptions,
  type TableColumn
} from './ui-components'

// ==================== 其他工具 ====================
export * from './warning-suppressor'
export * from './diagnostics'
export * from './notification'
export * from './ssl'
export * from './vite-resolver'

// ==================== 导出说明 ====================
/**
 * 命名冲突解决方案:
 * 
 * 1. isValidUrl:
 *    - server.ts:    isValidServerUrl  (服务器URL验证)
 *    - validation.ts: validateUrl       (通用URL验证)
 * 
 * 2. formatFileSize:
 *    - build.ts:       formatBuildFileSize  (构建文件大小格式化)
 *    - format.ts:      formatFileSizeUtil   (通用文件大小格式化)
 *    - ui-components.ts: formatUIFileSize   (UI显示文件大小格式化)
 * 
 * 3. getNetworkInterfaces:
 *    - server.ts:   getServerNetworkInterfaces   (服务器网络接口)
 *    - network.ts:  getNetworkInterfacesList     (网络接口列表)
 * 
 * 使用建议:
 * - 对于文件大小格式化，推荐使用 formatFileSizeUtil (最通用)
 * - 对于URL验证，根据场景选择: validateUrl (通用) 或 isValidServerUrl (服务器专用)
 * - 对于网络接口，推荐使用 getNetworkInterfacesList (更完整)
 */
