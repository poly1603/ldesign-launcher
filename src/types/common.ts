/**
 * 通用类型定义
 *
 * 定义在整个 launcher 包中使用的通用类型和接口
 *
 * @author LDesign Team
 * @since 1.0.0
 */

import type { EventEmitter } from 'node:events'

// ==================== 基础类型 ====================

/**
 * 日志级别枚举
 * 用于控制日志输出的详细程度
 */
export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug'

/**
 * 运行模式枚举
 * 定义应用程序的运行环境
 */
export type Mode = 'development' | 'production' | 'test'

/**
 * 验证结果接口
 * 用于配置验证和其他验证操作的结果
 */
export interface ValidationResult {
  /** 验证是否通过 */
  valid: boolean
  /** 错误信息列表 */
  errors: string[]
  /** 警告信息列表 */
  warnings: string[]
}

/**
 * 异步操作结果接口
 * 用于包装异步操作的结果
 *
 * @typeParam T - 返回数据的类型
 *
 * @example
 * ```typescript
 * const result: AsyncResult<User> = await fetchUser(id)
 * if (result.success) {
 *   console.log(result.data)
 * } else {
 *   console.error(result.error)
 * }
 * ```
 */
export interface AsyncResult<T = unknown> {
  /** 操作是否成功 */
  success: boolean
  /** 返回的数据 */
  data?: T
  /** 错误信息 */
  error?: string
  /** 错误详情 */
  details?: unknown
}

/**
 * 生命周期钩子函数类型
 * 用于定义各种生命周期事件的回调函数
 */
export type LifecycleHook = () => void | Promise<void>

/**
 * 错误处理回调函数类型
 * 用于处理错误事件的回调函数
 */
export type ErrorHandler = (error: Error) => void | Promise<void>

/**
 * 事件监听器类型
 * 用于定义事件监听器的函数签名
 *
 * @typeParam T - 事件数据类型
 */
export type EventListener<T = unknown> = (data: T) => void | Promise<void>

/**
 * 键值对映射类型
 * 用于定义通用的键值对结构
 *
 * @typeParam T - 值的类型
 */
export type KeyValueMap<T = unknown> = Record<string, T>

// ==================== 工具类型 ====================

/**
 * 可选的深度部分类型
 * 递归地将对象的所有属性设为可选
 *
 * @typeParam T - 原始类型
 *
 * @example
 * ```typescript
 * interface User {
 *   name: string
 *   address: { city: string; zip: number }
 * }
 * type PartialUser = DeepPartial<User>
 * // { name?: string; address?: { city?: string; zip?: number } }
 * ```
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * 必需的深度类型
 * 递归地将对象的所有属性设为必需
 *
 * @typeParam T - 原始类型
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

/**
 * 深度只读类型
 * 递归地将对象的所有属性设为只读
 *
 * @typeParam T - 原始类型
 *
 * @example
 * ```typescript
 * const config: DeepReadonly<Config> = getConfig()
 * config.server.port = 3000 // Error: Cannot assign to 'port'
 * ```
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

/**
 * 可空类型
 * 允许值为 null
 *
 * @typeParam T - 原始类型
 */
export type Nullable<T> = T | null

/**
 * 可能未定义类型
 * 允许值为 undefined
 *
 * @typeParam T - 原始类型
 */
export type Optional<T> = T | undefined

/**
 * 可能为 Promise 的类型
 * 用于同步/异步函数的返回值
 *
 * @typeParam T - 原始类型
 *
 * @example
 * ```typescript
 * function process(data: string): MaybePromise<string> {
 *   return data.toUpperCase() // 可以返回同步值
 * }
 * async function processAsync(data: string): MaybePromise<string> {
 *   return await fetch(data) // 也可以返回异步值
 * }
 * ```
 */
export type MaybePromise<T> = T | Promise<T>

/**
 * 可等待类型（MaybePromise 的别名）
 * 用于表示可以被 await 的值
 *
 * @typeParam T - 原始类型
 */
export type Awaitable<T> = T | Promise<T> | PromiseLike<T>

/**
 * 品牌类型
 * 用于创建名义类型，区分相同基础类型但语义不同的值
 *
 * @typeParam T - 基础类型
 * @typeParam B - 品牌标识符（字符串字面量类型）
 *
 * @example
 * ```typescript
 * type UserId = Brand<string, 'UserId'>
 * type PostId = Brand<string, 'PostId'>
 *
 * const userId: UserId = 'user-123' as UserId
 * const postId: PostId = 'post-456' as PostId
 *
 * function getUser(id: UserId) { ... }
 * getUser(postId) // Error: Type 'PostId' is not assignable to 'UserId'
 * ```
 */
export type Brand<T, B extends string> = T & { readonly __brand: B }

/**
 * 提取 Promise 内部类型
 *
 * @typeParam T - Promise 类型
 */
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

/**
 * 非空类型
 * 排除 null 和 undefined
 *
 * @typeParam T - 原始类型
 */
export type NonNullable<T> = T extends null | undefined ? never : T

/**
 * 函数类型
 * 通用函数类型定义
 */
export type AnyFunction = (...args: unknown[]) => unknown

/**
 * 异步函数类型
 */
export type AsyncFunction = (...args: unknown[]) => Promise<unknown>

/**
 * 构造函数类型
 *
 * @typeParam T - 实例类型
 */
export type Constructor<T = unknown> = new (...args: unknown[]) => T

// ==================== 基础值类型 ====================

/**
 * 文件路径类型（品牌类型）
 * 用于表示文件系统路径
 */
export type FilePath = Brand<string, 'FilePath'> | string

/**
 * URL 类型
 * 用于表示网络地址
 */
export type URL = string

/**
 * 端口号类型
 * 用于表示网络端口（1-65535）
 */
export type Port = number

/**
 * 主机地址类型
 * 用于表示主机名或 IP 地址
 */
export type Host = string

/**
 * 时间戳类型
 * 用于表示时间戳（毫秒）
 */
export type Timestamp = number

/**
 * 版本号类型
 * 用于表示语义化版本号
 */
export type Version = string

// ==================== 事件系统类型 ====================

/**
 * 类型安全的事件发射器接口
 *
 * @typeParam TEvents - 事件映射类型
 *
 * @example
 * ```typescript
 * interface MyEvents {
 *   'start': { port: number }
 *   'stop': void
 *   'error': Error
 * }
 *
 * class MyEmitter extends EventEmitter implements TypedEventEmitter<MyEvents> {
 *   // 类型安全的事件发射
 * }
 *
 * const emitter = new MyEmitter()
 * emitter.on('start', (data) => console.log(data.port)) // 类型推断正确
 * ```
 */
export interface TypedEventEmitter<TEvents extends Record<string, unknown>> {
  on<K extends keyof TEvents>(
    event: K,
    listener: TEvents[K] extends void
      ? () => void
      : (data: TEvents[K]) => void
  ): this

  once<K extends keyof TEvents>(
    event: K,
    listener: TEvents[K] extends void
      ? () => void
      : (data: TEvents[K]) => void
  ): this

  off<K extends keyof TEvents>(
    event: K,
    listener: TEvents[K] extends void
      ? () => void
      : (data: TEvents[K]) => void
  ): this

  emit<K extends keyof TEvents>(
    event: K,
    ...args: TEvents[K] extends void ? [] : [TEvents[K]]
  ): boolean

  removeAllListeners<K extends keyof TEvents>(event?: K): this

  listenerCount<K extends keyof TEvents>(event: K): number
}

/**
 * 创建类型安全的事件发射器混入类型
 *
 * @typeParam TEvents - 事件映射类型
 */
export type TypedEventEmitterClass<TEvents extends Record<string, unknown>> =
  new () => TypedEventEmitter<TEvents> & EventEmitter

// ==================== 框架检测类型 ====================

/**
 * 支持的框架类型
 */
export type FrameworkType =
  | 'react'
  | 'react-swc'
  | 'vue3'
  | 'vue2'
  | 'svelte'
  | 'sveltekit'
  | 'solid'
  | 'preact'
  | 'qwik'
  | 'lit'
  | 'angular'
  | 'marko'
  | 'vanilla'
  | 'unknown'

/**
 * 框架检测证据
 */
export interface FrameworkEvidence {
  /** 检测到的依赖 */
  dependencies?: string[]
  /** 检测到的文件 */
  files?: string[]
  /** 检测到的配置文件 */
  configFiles?: string[]
  /** 检测到的特征 */
  features?: string[]
}

/**
 * 框架检测结果
 */
export interface FrameworkDetectionResult {
  /** 是否检测到框架 */
  detected: boolean
  /** 检测到的框架类型 */
  type: FrameworkType | null
  /** 检测置信度（0-1） */
  confidence: number
  /** 检测证据 */
  evidence?: FrameworkEvidence
  /** 框架版本 */
  version?: string
  /** 是否使用 TypeScript */
  typescript?: boolean
}

// ==================== 任务和进度类型 ====================

/**
 * 任务状态
 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

/**
 * 进度信息
 */
export interface ProgressInfo {
  /** 当前进度（0-100） */
  percent: number
  /** 当前步骤描述 */
  message?: string
  /** 已处理数量 */
  processed?: number
  /** 总数量 */
  total?: number
  /** 预计剩余时间（毫秒） */
  eta?: number
}

/**
 * 进度回调函数类型
 */
export type ProgressCallback = (progress: ProgressInfo) => void

// ==================== 缓存相关类型 ====================

/**
 * 缓存条目
 *
 * @typeParam T - 缓存值的类型
 */
export interface CacheEntry<T = unknown> {
  /** 缓存的值 */
  value: T
  /** 创建时间戳 */
  createdAt: Timestamp
  /** 过期时间戳 */
  expiresAt?: Timestamp
  /** 最后访问时间 */
  lastAccessed?: Timestamp
  /** 访问次数 */
  accessCount?: number
  /** 缓存标签（用于批量失效） */
  tags?: string[]
}

/**
 * 缓存统计信息
 */
export interface CacheStats {
  /** 缓存命中次数 */
  hits: number
  /** 缓存未命中次数 */
  misses: number
  /** 当前条目数量 */
  size: number
  /** 缓存命中率 */
  hitRate: number
}
