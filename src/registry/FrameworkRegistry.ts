/**
 * 前端框架注册中心
 * 
 * 管理所有可用的框架适配器，提供框架的注册、查询、检测和创建功能
 * 
 * @author LDesign Team
 * @since 2.0.0
 */

import type {
  FrameworkAdapter,
  FrameworkType,
  FrameworkAdapterFactory,
  FrameworkOptions,
  FrameworkMetadata,
  FrameworkDetectionResult
} from '../types/framework'
import { Logger } from '../utils/logger'

/**
 * 框架注册信息
 */
interface FrameworkRegistration {
  /** 框架元数据 */
  metadata: FrameworkMetadata
  
  /** 框架适配器工厂 */
  factory: FrameworkAdapterFactory
  
  /** 检测优先级（数字越大优先级越高） */
  priority: number
}

/**
 * 前端框架注册中心类
 */
export class FrameworkRegistry {
  private static instance: FrameworkRegistry
  private frameworks: Map<FrameworkType, FrameworkRegistration> = new Map()
  private logger: Logger

  private constructor() {
    this.logger = new Logger('FrameworkRegistry')
  }

  /**
   * 获取单例实例
   */
  static getInstance(): FrameworkRegistry {
    if (!FrameworkRegistry.instance) {
      FrameworkRegistry.instance = new FrameworkRegistry()
    }
    return FrameworkRegistry.instance
  }

  /**
   * 注册框架适配器
   * 
   * @param type - 框架类型
   * @param factory - 框架适配器工厂
   * @param metadata - 框架元数据
   * @param priority - 检测优先级（默认 0）
   */
  register(
    type: FrameworkType,
    factory: FrameworkAdapterFactory,
    metadata: FrameworkMetadata,
    priority = 0
  ): void {
    if (this.frameworks.has(type)) {
      this.logger.warn(`框架 "${type}" 已注册，将被覆盖`)
    }

    this.frameworks.set(type, {
      metadata,
      factory,
      priority
    })

    this.logger.debug(`注册框架: ${type} (优先级: ${priority})`)
  }

  /**
   * 注销框架适配器
   * 
   * @param type - 框架类型
   */
  unregister(type: FrameworkType): void {
    if (!this.frameworks.has(type)) {
      this.logger.warn(`框架 "${type}" 未注册`)
      return
    }

    this.frameworks.delete(type)
    this.logger.debug(`注销框架: ${type}`)
  }

  /**
   * 检查框架是否已注册
   * 
   * @param type - 框架类型
   * @returns 是否已注册
   */
  has(type: FrameworkType): boolean {
    return this.frameworks.has(type)
  }

  /**
   * 获取框架元数据
   * 
   * @param type - 框架类型
   * @returns 框架元数据
   */
  getMetadata(type: FrameworkType): FrameworkMetadata | undefined {
    return this.frameworks.get(type)?.metadata
  }

  /**
   * 获取所有已注册的框架类型
   * 
   * @returns 框架类型列表
   */
  getRegisteredFrameworks(): FrameworkType[] {
    return Array.from(this.frameworks.keys())
  }

  /**
   * 获取所有框架的元数据
   * 
   * @returns 元数据列表
   */
  getAllMetadata(): FrameworkMetadata[] {
    return Array.from(this.frameworks.values()).map(reg => reg.metadata)
  }

  /**
   * 创建框架适配器实例
   * 
   * @param type - 框架类型
   * @param options - 框架选项
   * @returns 适配器实例
   */
  async createAdapter(
    type: FrameworkType,
    options?: FrameworkOptions
  ): Promise<FrameworkAdapter> {
    const registration = this.frameworks.get(type)
    if (!registration) {
      throw new Error(
        `框架 "${type}" 未注册。已注册的框架: ${this.getRegisteredFrameworks().join(', ')}`
      )
    }

    this.logger.debug(`创建框架适配器: ${type}`)
    return registration.factory.create(options)
  }

  /**
   * 自动检测项目使用的框架
   * 
   * @param cwd - 项目根目录
   * @returns 检测结果列表（按置信度排序）
   */
  async detectFrameworks(cwd: string): Promise<FrameworkDetectionResult[]> {
    this.logger.debug(`开始检测项目框架: ${cwd}`)

    const results: FrameworkDetectionResult[] = []

    // 按优先级排序的框架列表
    const sortedFrameworks = Array.from(this.frameworks.entries())
      .sort((a, b) => b[1].priority - a[1].priority)

    // 并行检测所有框架
    const detectionPromises = sortedFrameworks.map(async ([type, registration]) => {
      try {
        const adapter = await registration.factory.create()
        const result = await adapter.detect(cwd)
        
        if (result.detected) {
          this.logger.debug(
            `检测到框架: ${type} (置信度: ${result.confidence})`
          )
          return result
        }
      } catch (error) {
        this.logger.warn(`检测框架 "${type}" 时出错: ${(error as Error).message}`)
      }
      return null
    })

    const detectionResults = await Promise.all(detectionPromises)
    
    // 过滤并排序结果
    results.push(
      ...detectionResults
        .filter((r): r is FrameworkDetectionResult => r !== null && r.detected)
        .sort((a, b) => b.confidence - a.confidence)
    )

    if (results.length === 0) {
      this.logger.warn('未检测到任何已注册的框架')
    } else {
      this.logger.info(
        `检测到 ${results.length} 个框架: ${results.map(r => r.type).join(', ')}`
      )
    }

    return results
  }

  /**
   * 检测最可能的框架
   * 
   * @param cwd - 项目根目录
   * @returns 检测结果
   */
  async detectBestFramework(cwd: string): Promise<FrameworkDetectionResult | null> {
    const results = await this.detectFrameworks(cwd)
    return results.length > 0 ? results[0] : null
  }

  /**
   * 检查框架是否可用
   * 
   * @param type - 框架类型
   * @param cwd - 项目根目录
   * @returns 是否可用
   */
  async isFrameworkAvailable(type: FrameworkType, cwd: string): Promise<boolean> {
    const registration = this.frameworks.get(type)
    if (!registration) {
      return false
    }

    return registration.factory.isAvailable(cwd)
  }

  /**
   * 清空所有注册的框架
   */
  clear(): void {
    this.frameworks.clear()
    this.logger.debug('清空所有框架注册')
  }
}

/**
 * 获取框架注册中心单例
 */
export function getFrameworkRegistry(): FrameworkRegistry {
  return FrameworkRegistry.getInstance()
}

/**
 * 注册框架的便捷函数
 */
export function registerFramework(
  type: FrameworkType,
  factory: FrameworkAdapterFactory,
  metadata: FrameworkMetadata,
  priority = 0
): void {
  getFrameworkRegistry().register(type, factory, metadata, priority)
}

/**
 * 创建框架适配器的便捷函数
 */
export async function createFrameworkAdapter(
  type: FrameworkType,
  options?: FrameworkOptions
): Promise<FrameworkAdapter> {
  return getFrameworkRegistry().createAdapter(type, options)
}

/**
 * 自动检测框架的便捷函数
 */
export async function detectFramework(cwd: string): Promise<FrameworkDetectionResult | null> {
  return getFrameworkRegistry().detectBestFramework(cwd)
}

