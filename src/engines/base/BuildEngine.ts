/**
 * 构建引擎基类
 *
 * 提供构建引擎的抽象基类，所有具体引擎实现都应继承此类
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type { ViteLauncherConfig } from '../../types/config'
import type {
  BuildEngineType,
  ConfigTransformer,
  DevServer,
  EngineBuildResult,
  BuildEngine as IBuildEngine,
  PreviewServer,
} from '../../types/engine'
import { Logger } from '../../utils/logger'

/**
 * 构建引擎抽象基类
 */
export abstract class BuildEngine implements IBuildEngine {
  /** 引擎名称 */
  abstract readonly name: BuildEngineType

  /** 引擎版本 */
  abstract readonly version: string

  /** 引擎描述 */
  abstract readonly description?: string

  /** 日志记录器 */
  protected logger: Logger

  /** 配置转换器 */
  protected configTransformer?: ConfigTransformer

  /** 是否已初始化 */
  protected initialized = false

  constructor(configTransformer?: ConfigTransformer) {
    // 延迟初始化 logger，因为 name 是抽象属性
    this.logger = new Logger('Engine')
    this.configTransformer = configTransformer
  }

  /**
   * 初始化引擎
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('引擎已初始化，跳过重复初始化')
      return
    }

    this.logger.debug('初始化引擎...')
    await this.onInitialize()
    this.initialized = true
    this.logger.debug('引擎初始化完成')
  }

  /**
   * 启动开发服务器
   */
  abstract dev(config: ViteLauncherConfig): Promise<DevServer>

  /**
   * 执行生产构建
   */
  abstract build(config: ViteLauncherConfig): Promise<EngineBuildResult>

  /**
   * 启动预览服务器
   */
  abstract preview(config: ViteLauncherConfig): Promise<PreviewServer>

  /**
   * 转换配置
   */
  transformConfig(config: ViteLauncherConfig): any {
    if (this.configTransformer) {
      return this.configTransformer.transform(config)
    }

    // 默认实现：直接返回配置
    return config
  }

  /**
   * 清理资源
   */
  async dispose(): Promise<void> {
    this.logger.debug('清理引擎资源...')
    await this.onDispose()
    this.initialized = false
    this.logger.debug('引擎资源清理完成')
  }

  /**
   * 子类可重写的初始化钩子
   */
  protected async onInitialize(): Promise<void> {
    // 默认空实现
  }

  /**
   * 子类可重写的清理钩子
   */
  protected async onDispose(): Promise<void> {
    // 默认空实现
  }

  /**
   * 确保引擎已初始化
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(`引擎 "${this.name}" 未初始化，请先调用 initialize()`)
    }
  }
}
