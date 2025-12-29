/**
 * 部署模块入口
 *
 * @author LDesign Team
 * @since 2.1.0
 */

// 导出类型
export type {
  BaseDeployConfig,
  CloudflareDeployConfig,
  CustomDeployConfig,
  DeployAdapter,
  DeployCallbacks,
  DeployConfig,
  DeployConfigField,
  DeployHistoryEntry,
  DeployLogEntry,
  DeployLogLevel,
  DeployPhase,
  DeployPlatform,
  DeployPlatformInfo,
  DeployProgress,
  DeployResult,
  DeployStatus,
  FTPDeployConfig,
  GitHubPagesDeployConfig,
  NetlifyDeployConfig,
  SavedDeployConfig,
  SFTPDeployConfig,
  SSHDeployConfig,
  SurgeDeployConfig,
  VercelDeployConfig,
} from '../types/deploy'
// 导出适配器
export * from './adapters'

export { DeployManager } from './DeployManager'

export { DeployService } from './DeployService'
