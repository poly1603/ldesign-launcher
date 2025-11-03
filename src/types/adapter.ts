/**
 * 适配器类型定义
 * 
 * 用于集成其他 @ldesign 工具包
 * 
 * @author LDesign Team
 * @since 2.1.0
 */

import type { Logger } from '../utils/logger'

/**
 * 适配器基础接口
 */
export interface BaseAdapter {
  /** 适配器名称 */
  name: string
  
  /** 适配器版本 */
  version: string
  
  /** 日志记录器 */
  logger: Logger
  
  /** 检查工具包是否可用 */
  isAvailable(): Promise<boolean>
  
  /** 获取工具包版本 */
  getVersion(): Promise<string | null>
}

/**
 * 部署适配器选项
 */
export interface DeployerAdapterOptions {
  /** 部署平台 */
  platform?: 'docker' | 'k8s' | 'serverless'
  
  /** 部署环境 */
  environment?: string
  
  /** 配置文件路径 */
  configFile?: string
  
  /** 是否预演 */
  dryRun?: boolean
  
  /** 其他选项 */
  [key: string]: any
}

/**
 * 测试适配器选项
 */
export interface TestingAdapterOptions {
  /** 测试框架 */
  framework?: 'vitest' | 'playwright' | 'jest'
  
  /** 测试模式 */
  mode?: 'unit' | 'e2e' | 'integration' | 'all'
  
  /** 是否监听 */
  watch?: boolean
  
  /** 是否生成覆盖率 */
  coverage?: boolean
  
  /** 是否显示 UI */
  ui?: boolean
  
  /** 其他选项 */
  [key: string]: any
}

/**
 * 安全适配器选项
 */
export interface SecurityAdapterOptions {
  /** 扫描类型 */
  type?: 'audit' | 'scan' | 'report' | 'fix'
  
  /** 严重级别阈值 */
  severity?: 'low' | 'moderate' | 'high' | 'critical'
  
  /** 是否自动修复 */
  autoFix?: boolean
  
  /** 输出格式 */
  format?: 'text' | 'json' | 'pdf'
  
  /** 输出路径 */
  output?: string
  
  /** 其他选项 */
  [key: string]: any
}

/**
 * 性能适配器选项
 */
export interface PerformanceAdapterOptions {
  /** 分析类型 */
  type?: 'build' | 'runtime' | 'bundle' | 'all'
  
  /** 是否生成报告 */
  report?: boolean
  
  /** 报告格式 */
  format?: 'html' | 'json' | 'text'
  
  /** 输出路径 */
  output?: string
  
  /** 其他选项 */
  [key: string]: any
}

/**
 * 依赖适配器选项
 */
export interface DepsAdapterOptions {
  /** 操作类型 */
  action?: 'analyze' | 'update' | 'audit' | 'tree' | 'dedupe' | 'unused'
  
  /** 是否交互式 */
  interactive?: boolean
  
  /** 是否递归 */
  recursive?: boolean
  
  /** 输出格式 */
  format?: 'text' | 'json' | 'tree'
  
  /** 其他选项 */
  [key: string]: any
}

/**
 * 监控适配器选项
 */
export interface MonitorAdapterOptions {
  /** 监控类型 */
  type?: 'performance' | 'error' | 'behavior' | 'all'
  
  /** 是否实时监控 */
  realtime?: boolean
  
  /** 采样率 */
  sampleRate?: number
  
  /** 其他选项 */
  [key: string]: any
}

/**
 * 适配器执行结果
 */
export interface AdapterResult<T = any> {
  /** 是否成功 */
  success: boolean
  
  /** 结果数据 */
  data?: T
  
  /** 错误信息 */
  error?: string
  
  /** 执行时间（ms） */
  duration?: number
  
  /** 额外信息 */
  metadata?: Record<string, any>
}
