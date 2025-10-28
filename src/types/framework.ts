/**
 * 前端框架相关类型定义
 * 
 * 定义框架适配器的统一接口，支持 Vue、React、Angular、Svelte、Solid 等主流框架
 * 
 * @author LDesign Team
 * @since 2.0.0
 */

import type { Plugin } from 'vite'
import type { ViteLauncherConfig } from './config'
import type { BuildEngine } from './engine'

/**
 * 支持的前端框架类型
 */
export type FrameworkType = 
  | 'vue2' 
  | 'vue3' 
  | 'react' 
  | 'angular' 
  | 'svelte' 
  | 'solid'
  | 'preact'
  | 'qwik'
  | 'lit'
  | 'vanilla'
  | 'auto'  // 自动检测

/**
 * 框架版本信息
 */
export interface FrameworkVersion {
  /** 主版本号 */
  major: number
  
  /** 次版本号 */
  minor: number
  
  /** 补丁版本号 */
  patch: number
  
  /** 完整版本字符串 */
  full: string
}

/**
 * 框架检测结果
 */
export interface FrameworkDetectionResult {
  /** 是否检测到框架 */
  detected: boolean
  
  /** 框架类型 */
  type?: FrameworkType
  
  /** 框架版本 */
  version?: FrameworkVersion
  
  /** 检测置信度 (0-1) */
  confidence: number
  
  /** 检测依据 */
  evidence: {
    /** 在 package.json 中找到的依赖 */
    dependencies?: string[]
    
    /** 找到的框架特定文件 */
    files?: string[]
    
    /** 找到的配置文件 */
    configFiles?: string[]
  }
}

/**
 * 框架依赖信息
 */
export interface FrameworkDependencies {
  /** 生产依赖 */
  dependencies: string[]
  
  /** 开发依赖 */
  devDependencies: string[]
  
  /** 可选依赖 */
  optionalDependencies?: string[]
  
  /** Peer 依赖 */
  peerDependencies?: string[]
}

/**
 * 框架特性标识
 */
export interface FrameworkFeatures {
  /** 是否支持 JSX/TSX */
  jsx?: boolean
  
  /** 是否支持单文件组件 (SFC) */
  sfc?: boolean
  
  /** 是否支持 CSS Modules */
  cssModules?: boolean
  
  /** 是否支持 CSS-in-JS */
  cssInJs?: boolean
  
  /** 是否支持服务端渲染 (SSR) */
  ssr?: boolean
  
  /** 是否支持静态站点生成 (SSG) */
  ssg?: boolean
  
  /** 是否支持热模块替换 (HMR) */
  hmr?: boolean
  
  /** 是否支持快速刷新 (Fast Refresh) */
  fastRefresh?: boolean
}

/**
 * 框架配置选项
 */
export interface FrameworkOptions {
  /** 框架类型 */
  type?: FrameworkType
  
  /** 框架版本 */
  version?: string
  
  /** 框架特定选项 */
  options?: Record<string, any>
  
  /** 是否启用 TypeScript */
  typescript?: boolean
  
  /** 是否启用 JSX */
  jsx?: boolean
}

/**
 * 框架适配器接口
 * 定义所有框架适配器必须实现的核心方法
 */
export interface FrameworkAdapter {
  /** 框架名称 */
  readonly name: FrameworkType
  
  /** 框架版本（可选，可能在检测后才知道） */
  readonly version?: string
  
  /** 框架描述 */
  readonly description?: string
  
  /** 框架特性 */
  readonly features: FrameworkFeatures
  
  /**
   * 检测项目是否使用该框架
   * @param cwd - 项目根目录
   * @returns 检测结果
   */
  detect(cwd: string): Promise<FrameworkDetectionResult>
  
  /**
   * 获取框架所需的构建插件
   * @param engine - 构建引擎实例
   * @param options - 框架选项
   * @returns 插件列表
   */
  getPlugins(engine: BuildEngine, options?: FrameworkOptions): Promise<Plugin[]>
  
  /**
   * 获取框架特定的配置
   * @param options - 框架选项
   * @returns 部分 Launcher 配置
   */
  getConfig(options?: FrameworkOptions): Partial<ViteLauncherConfig>
  
  /**
   * 获取框架依赖列表
   * @returns 依赖信息
   */
  getDependencies(): FrameworkDependencies
  
  /**
   * 获取推荐的 npm scripts
   * @returns scripts 配置
   */
  getScripts?(): Record<string, string>
  
  /**
   * 获取环境变量配置
   * @returns 环境变量
   */
  getEnvConfig?(): Record<string, string>
  
  /**
   * 验证框架配置
   * @param config - Launcher 配置
   * @returns 是否有效
   */
  validateConfig?(config: ViteLauncherConfig): boolean
  
  /**
   * 初始化框架适配器
   */
  initialize?(): Promise<void>
  
  /**
   * 清理资源
   */
  dispose?(): Promise<void>
}

/**
 * 框架适配器工厂接口
 */
export interface FrameworkAdapterFactory {
  /**
   * 创建框架适配器实例
   * @param options - 框架选项
   * @returns 适配器实例
   */
  create(options?: FrameworkOptions): Promise<FrameworkAdapter>
  
  /**
   * 检查框架是否可用
   * @param cwd - 项目根目录
   * @returns 是否可用
   */
  isAvailable(cwd: string): Promise<boolean>
}

/**
 * 框架元数据
 */
export interface FrameworkMetadata {
  /** 框架名称 */
  name: FrameworkType
  
  /** 框架显示名称 */
  displayName: string
  
  /** 框架描述 */
  description: string
  
  /** 官方网站 */
  website?: string
  
  /** 文档链接 */
  documentation?: string
  
  /** 所需依赖包 */
  dependencies: string[]
  
  /** 支持的构建引擎 */
  supportedEngines: string[]
  
  /** 框架特性 */
  features: FrameworkFeatures
  
  /** 默认端口 */
  defaultPort?: number
  
  /** 文件扩展名 */
  fileExtensions: string[]
  
  /** 配置文件名 */
  configFiles: string[]
}

/**
 * 框架检测器接口
 */
export interface FrameworkDetector {
  /**
   * 自动检测项目使用的框架
   * @param cwd - 项目根目录
   * @returns 检测结果列表（按置信度排序）
   */
  detectAll(cwd: string): Promise<FrameworkDetectionResult[]>
  
  /**
   * 检测最可能的框架
   * @param cwd - 项目根目录
   * @returns 检测结果
   */
  detectBest(cwd: string): Promise<FrameworkDetectionResult | null>
}

