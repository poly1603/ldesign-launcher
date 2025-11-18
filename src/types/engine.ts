/**
 * 构建引擎相关类型定义
 *
 * 定义构建引擎的统一接口，支持 Vite、Rspack、Webpack 等多种构建工具
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type { RollupOutput, RollupWatcher } from 'rollup'
import type { ViteDevServer, PreviewServer as VitePreviewServer } from 'vite'
import type { ViteLauncherConfig } from './config'

/**
 * 支持的构建引擎类型
 */
export type BuildEngineType = 'vite' | 'rspack' | 'webpack' | 'turbopack'

/**
 * 开发服务器接口
 * 统一不同构建引擎的开发服务器
 */
export interface DevServer {
  /** 服务器类型 */
  type: BuildEngineType

  /** 服务器 URL */
  url: string

  /** 服务器端口 */
  port: number

  /** 服务器主机 */
  host: string

  /** 是否使用 HTTPS */
  https: boolean

  /** 原始服务器实例（引擎特定） */
  raw: ViteDevServer | any

  /** 关闭服务器 */
  close: () => Promise<void>

  /** 重启服务器 */
  restart?: () => Promise<void>

  /** 打印服务器信息 */
  printUrls?: () => void
}

/**
 * 预览服务器接口
 * 统一不同构建引擎的预览服务器
 */
export interface PreviewServer {
  /** 服务器类型 */
  type: BuildEngineType

  /** 服务器 URL */
  url: string

  /** 服务器端口 */
  port: number

  /** 服务器主机 */
  host: string

  /** 是否使用 HTTPS */
  https: boolean

  /** 原始服务器实例（引擎特定） */
  raw: VitePreviewServer | any

  /** 关闭服务器 */
  close: () => Promise<void>

  /** 打印服务器信息 */
  printUrls?: () => void
}

/**
 * 引擎构建结果接口
 * 统一不同构建引擎的构建输出
 */
export interface EngineBuildResult {
  /** 构建引擎类型 */
  type: BuildEngineType

  /** 构建是否成功 */
  success: boolean

  /** 输出目录 */
  outDir: string

  /** 构建耗时（毫秒） */
  duration: number

  /** 构建产物信息 */
  assets?: BuildAsset[]

  /** 构建统计信息 */
  stats?: EngineBuildStats

  /** 原始构建结果（引擎特定） */
  raw: RollupOutput | any
}

/**
 * 构建产物信息
 */
export interface BuildAsset {
  /** 文件名 */
  name: string

  /** 文件大小（字节） */
  size: number

  /** 文件类型 */
  type: 'js' | 'css' | 'html' | 'asset' | 'other'

  /** 是否为入口文件 */
  isEntry?: boolean

  /** 是否为动态导入 */
  isDynamicEntry?: boolean
}

/**
 * 引擎构建统计信息
 */
export interface EngineBuildStats {
  /** 总文件数 */
  totalFiles: number

  /** 总大小（字节） */
  totalSize: number

  /** JS 文件大小 */
  jsSize: number

  /** CSS 文件大小 */
  cssSize: number

  /** 资源文件大小 */
  assetSize: number
}

/**
 * 构建引擎配置选项
 */
export interface BuildEngineOptions {
  /** 引擎类型 */
  type?: BuildEngineType

  /** 引擎特定选项 */
  options?: Record<string, any>

  /** 是否启用调试模式 */
  debug?: boolean

  /** 自定义配置转换器 */
  configTransformer?: ConfigTransformer
}

/**
 * 配置转换器接口
 * 将统一的 ViteLauncherConfig 转换为引擎特定的配置
 */
export interface ConfigTransformer {
  /**
   * 转换配置
   * @param config - Launcher 统一配置
   * @returns 引擎特定配置
   */
  transform: (config: ViteLauncherConfig) => any

  /**
   * 验证配置
   * @param config - 引擎特定配置
   * @returns 是否有效
   */
  validate?: (config: any) => boolean
}

/**
 * 构建引擎接口
 * 定义所有构建引擎必须实现的核心方法
 */
export interface BuildEngine {
  /** 引擎名称 */
  readonly name: BuildEngineType

  /** 引擎版本 */
  readonly version: string

  /** 引擎描述 */
  readonly description?: string

  /**
   * 初始化引擎
   */
  initialize: () => Promise<void>

  /**
   * 启动开发服务器
   * @param config - Launcher 配置
   * @returns 开发服务器实例
   */
  dev: (config: ViteLauncherConfig) => Promise<DevServer>

  /**
   * 执行生产构建
   * @param config - Launcher 配置
   * @returns 构建结果
   */
  build: (config: ViteLauncherConfig) => Promise<EngineBuildResult>

  /**
   * 启动预览服务器
   * @param config - Launcher 配置
   * @returns 预览服务器实例
   */
  preview: (config: ViteLauncherConfig) => Promise<PreviewServer>

  /**
   * 启动监听模式构建
   * @param config - Launcher 配置
   * @returns 构建监听器
   */
  buildWatch?: (config: ViteLauncherConfig) => Promise<RollupWatcher | any>

  /**
   * 转换配置
   * 将 ViteLauncherConfig 转换为引擎特定的配置格式
   * @param config - Launcher 配置
   * @returns 引擎特定配置
   */
  transformConfig: (config: ViteLauncherConfig) => any

  /**
   * 清理资源
   */
  dispose: () => Promise<void>
}

/**
 * 构建引擎工厂接口
 */
export interface BuildEngineFactory {
  /**
   * 创建引擎实例
   * @param options - 引擎选项
   * @returns 引擎实例
   */
  create: (options?: BuildEngineOptions) => Promise<BuildEngine>

  /**
   * 检查引擎是否可用
   * @returns 是否可用
   */
  isAvailable: () => Promise<boolean>
}

/**
 * 引擎元数据
 */
export interface EngineMetadata {
  /** 引擎名称 */
  name: BuildEngineType

  /** 引擎版本 */
  version: string

  /** 引擎描述 */
  description: string

  /** 是否为默认引擎 */
  isDefault?: boolean

  /** 所需依赖包 */
  dependencies: string[]

  /** 支持的功能特性 */
  features: {
    /** 是否支持 HMR */
    hmr?: boolean

    /** 是否支持 SSR */
    ssr?: boolean

    /** 是否支持代码分割 */
    codeSplitting?: boolean

    /** 是否支持 Tree Shaking */
    treeShaking?: boolean
  }
}
