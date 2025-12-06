/**
 * 部署模块入口
 *
 * @author LDesign Team
 * @since 2.1.0
 */

export { DeployService } from './DeployService'
export { DeployManager } from './DeployManager'

// 导出适配器
export * from './adapters'

// 导出类型
export type {
  DeployPlatform,
  DeployStatus,
  DeployPhase,
  DeployProgress,
  DeployResult,
  DeployConfig,
  DeployAdapter,
  DeployCallbacks,
  DeployLogEntry,
  DeployLogLevel,
  DeployHistoryEntry,
  DeployPlatformInfo,
  DeployConfigField,
  SavedDeployConfig,
  BaseDeployConfig,
  NetlifyDeployConfig,
  VercelDeployConfig,
  CloudflareDeployConfig,
  GitHubPagesDeployConfig,
  SurgeDeployConfig,
  FTPDeployConfig,
  SFTPDeployConfig,
  SSHDeployConfig,
  CustomDeployConfig,
} from '../types/deploy'
