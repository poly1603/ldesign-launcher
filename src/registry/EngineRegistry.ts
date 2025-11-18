/**
 * 构建引擎注册中心
 *
 * 管理所有可用的构建引擎，提供引擎的注册、查询和创建功能
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type {
  BuildEngine,
  BuildEngineFactory,
  BuildEngineOptions,
  BuildEngineType,
  EngineMetadata,
} from '../types/engine'
import { Logger } from '../utils/logger'

/**
 * 引擎注册信息
 */
interface EngineRegistration {
  /** 引擎元数据 */
  metadata: EngineMetadata

  /** 引擎工厂 */
  factory: BuildEngineFactory

  /** 是否为默认引擎 */
  isDefault: boolean
}

/**
 * 构建引擎注册中心类
 */
export class EngineRegistry {
  private static instance: EngineRegistry
  private engines: Map<BuildEngineType, EngineRegistration> = new Map()
  private defaultEngine: BuildEngineType = 'vite'
  private logger: Logger

  private constructor() {
    this.logger = new Logger('EngineRegistry')
  }

  /**
   * 获取单例实例
   */
  static getInstance(): EngineRegistry {
    if (!EngineRegistry.instance) {
      EngineRegistry.instance = new EngineRegistry()
    }
    return EngineRegistry.instance
  }

  /**
   * 注册构建引擎
   *
   * @param type - 引擎类型
   * @param factory - 引擎工厂
   * @param metadata - 引擎元数据
   * @param isDefault - 是否设为默认引擎
   */
  register(
    type: BuildEngineType,
    factory: BuildEngineFactory,
    metadata: EngineMetadata,
    isDefault = false,
  ): void {
    if (this.engines.has(type)) {
      this.logger.warn(`引擎 "${type}" 已注册，将被覆盖`)
    }

    this.engines.set(type, {
      metadata,
      factory,
      isDefault,
    })

    if (isDefault) {
      this.defaultEngine = type
      this.logger.info(`设置默认引擎: ${type}`)
    }

    this.logger.debug(`注册引擎: ${type} (${metadata.version})`)
  }

  /**
   * 注销构建引擎
   *
   * @param type - 引擎类型
   */
  unregister(type: BuildEngineType): void {
    if (!this.engines.has(type)) {
      this.logger.warn(`引擎 "${type}" 未注册`)
      return
    }

    this.engines.delete(type)
    this.logger.debug(`注销引擎: ${type}`)

    // 如果注销的是默认引擎，重新设置默认引擎
    if (this.defaultEngine === type) {
      const firstEngine = this.engines.keys().next().value
      if (firstEngine) {
        this.defaultEngine = firstEngine
        this.logger.info(`重新设置默认引擎: ${firstEngine}`)
      }
    }
  }

  /**
   * 检查引擎是否已注册
   *
   * @param type - 引擎类型
   * @returns 是否已注册
   */
  has(type: BuildEngineType): boolean {
    return this.engines.has(type)
  }

  /**
   * 获取引擎元数据
   *
   * @param type - 引擎类型
   * @returns 引擎元数据
   */
  getMetadata(type: BuildEngineType): EngineMetadata | undefined {
    return this.engines.get(type)?.metadata
  }

  /**
   * 获取所有已注册的引擎类型
   *
   * @returns 引擎类型列表
   */
  getRegisteredEngines(): BuildEngineType[] {
    return Array.from(this.engines.keys())
  }

  /**
   * 获取所有引擎的元数据
   *
   * @returns 元数据列表
   */
  getAllMetadata(): EngineMetadata[] {
    return Array.from(this.engines.values()).map(reg => reg.metadata)
  }

  /**
   * 获取默认引擎类型
   *
   * @returns 默认引擎类型
   */
  getDefaultEngine(): BuildEngineType {
    return this.defaultEngine
  }

  /**
   * 设置默认引擎
   *
   * @param type - 引擎类型
   */
  setDefaultEngine(type: BuildEngineType): void {
    if (!this.engines.has(type)) {
      throw new Error(`引擎 "${type}" 未注册，无法设为默认引擎`)
    }

    this.defaultEngine = type
    this.logger.info(`设置默认引擎: ${type}`)
  }

  /**
   * 创建引擎实例
   *
   * @param type - 引擎类型（可选，默认使用默认引擎）
   * @param options - 引擎选项
   * @returns 引擎实例
   */
  async createEngine(
    type?: BuildEngineType,
    options?: BuildEngineOptions,
  ): Promise<BuildEngine> {
    const engineType = type || this.defaultEngine

    const registration = this.engines.get(engineType)
    if (!registration) {
      throw new Error(
        `引擎 "${engineType}" 未注册。已注册的引擎: ${this.getRegisteredEngines().join(', ')}`,
      )
    }

    // 检查引擎是否可用
    const isAvailable = await registration.factory.isAvailable()
    if (!isAvailable) {
      throw new Error(
        `引擎 "${engineType}" 不可用。请确保已安装所需依赖: ${registration.metadata.dependencies.join(', ')}`,
      )
    }

    this.logger.debug(`创建引擎实例: ${engineType}`)
    return registration.factory.create(options)
  }

  /**
   * 检查引擎是否可用
   *
   * @param type - 引擎类型
   * @returns 是否可用
   */
  async isEngineAvailable(type: BuildEngineType): Promise<boolean> {
    const registration = this.engines.get(type)
    if (!registration) {
      return false
    }

    return registration.factory.isAvailable()
  }

  /**
   * 清空所有注册的引擎
   */
  clear(): void {
    this.engines.clear()
    this.logger.debug('清空所有引擎注册')
  }
}

/**
 * 获取引擎注册中心单例
 */
export function getEngineRegistry(): EngineRegistry {
  return EngineRegistry.getInstance()
}

/**
 * 注册引擎的便捷函数
 */
export function registerEngine(
  type: BuildEngineType,
  factory: BuildEngineFactory,
  metadata: EngineMetadata,
  isDefault = false,
): void {
  getEngineRegistry().register(type, factory, metadata, isDefault)
}

/**
 * 创建引擎实例的便捷函数
 */
export async function createEngine(
  type?: BuildEngineType,
  options?: BuildEngineOptions,
): Promise<BuildEngine> {
  return getEngineRegistry().createEngine(type, options)
}
