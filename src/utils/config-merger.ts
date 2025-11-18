/**
 * 配置合并工具
 * 提供统一、可扩展的配置合并策略
 *
 * @author LDesign Team
 * @since 2.1.0
 */

export type ArrayMergeStrategy = 'replace' | 'concat' | 'unique'

export interface MergeOptions {
  /**
   * 数组合并策略
   * - replace: 用源数组替换目标数组（默认）
   * - concat: 连接两个数组
   * - unique: 连接数组并去重
   */
  arrayMergeStrategy?: ArrayMergeStrategy

  /**
   * 自定义合并器
   * 针对特定路径提供自定义合并逻辑
   */
  customMergers?: Record<string, (target: any, source: any) => any>

  /**
   * 是否深度合并
   */
  deep?: boolean
}

/**
 * 配置合并器
 */
export class ConfigMerger {
  /**
   * 深度合并配置对象
   *
   * @param target - 目标配置
   * @param source - 源配置
   * @param options - 合并选项
   * @returns 合并后的配置
   */
  static deepMerge<T extends Record<string, any>>(
    target: T,
    source: Partial<T>,
    options: MergeOptions = {},
  ): T {
    const {
      arrayMergeStrategy = 'replace',
      customMergers = {},
      deep = true,
    } = options

    // 处理特殊情况
    if (!target)
      return (source || {}) as T
    if (!source)
      return target
    if (typeof source !== 'object' || source === null)
      return source as T
    if (typeof target !== 'object' || target === null)
      return source as T

    const result = { ...target } as T

    for (const key in source) {
      if (!Object.prototype.hasOwnProperty.call(source, key)) {
        continue
      }

      const targetValue = target[key]
      const sourceValue = source[key]

      // 检查是否有自定义合并器
      if (customMergers[key]) {
        result[key] = customMergers[key](targetValue, sourceValue)
        continue
      }

      // 处理数组
      if (Array.isArray(sourceValue)) {
        result[key] = this.mergeArray(
          Array.isArray(targetValue) ? targetValue : [],
          sourceValue,
          arrayMergeStrategy,
          key,
        ) as any
        continue
      }

      // 处理对象
      if (deep && this.isPlainObject(sourceValue)) {
        if (this.isPlainObject(targetValue)) {
          result[key] = this.deepMerge(targetValue, sourceValue, options) as any
        }
        else {
          result[key] = sourceValue as any
        }
        continue
      }

      // 其他类型直接覆盖
      result[key] = sourceValue as any
    }

    return result
  }

  /**
   * 合并数组
   *
   * @param target - 目标数组
   * @param source - 源数组
   * @param strategy - 合并策略
   * @param key - 当前键名（用于特殊处理）
   * @returns 合并后的数组
   */
  private static mergeArray(
    target: any[],
    source: any[],
    strategy: ArrayMergeStrategy,
    key?: string,
  ): any[] {
    // 特殊处理：resolve.alias 始终使用 concat 策略
    if (key === 'alias') {
      return [...target, ...source]
    }

    switch (strategy) {
      case 'concat':
        return [...target, ...source]

      case 'unique':
        return [...new Set([...target, ...source])]

      case 'replace':
      default:
        return source
    }
  }

  /**
   * 判断是否为纯对象
   */
  private static isPlainObject(value: any): boolean {
    if (typeof value !== 'object' || value === null) {
      return false
    }

    const proto = Object.getPrototypeOf(value)
    return proto === null || proto === Object.prototype
  }

  /**
   * 浅合并
   *
   * @param target - 目标配置
   * @param source - 源配置
   * @returns 合并后的配置
   */
  static shallowMerge<T extends Record<string, any>>(
    target: T,
    source: Partial<T>,
  ): T {
    return this.deepMerge(target, source, { deep: false })
  }

  /**
   * 合并多个配置对象
   *
   * @param configs - 配置对象数组
   * @param options - 合并选项
   * @returns 合并后的配置
   */
  static mergeAll<T extends Record<string, any>>(
    configs: Partial<T>[],
    options: MergeOptions = {},
  ): T {
    if (!configs || configs.length === 0) {
      return {} as T
    }

    return configs.reduce<T>((acc, config) => {
      return this.deepMerge(acc, config, options)
    }, {} as T)
  }

  /**
   * 创建预设合并器
   * 为特定场景提供预配置的合并选项
   */
  static createPresetMerger(preset: 'vite' | 'launcher'): (target: any, source: any) => any {
    const presets = {
      vite: {
        arrayMergeStrategy: 'concat' as ArrayMergeStrategy,
        customMergers: {
          plugins: (target: any[], source: any[]) => [...(target || []), ...(source || [])],
          alias: (target: any[], source: any[]) => [...(target || []), ...(source || [])],
          external: (target: any[], source: any[]) => [...new Set([...(target || []), ...(source || [])])],
        },
      },
      launcher: {
        arrayMergeStrategy: 'replace' as ArrayMergeStrategy,
        customMergers: {},
      },
    }

    const options = presets[preset]

    return (target: any, source: any) => {
      return this.deepMerge(target, source, options)
    }
  }
}

/**
 * 便捷的深度合并函数
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>,
  options?: MergeOptions,
): T {
  return ConfigMerger.deepMerge(target, source, options)
}

/**
 * 便捷的浅合并函数
 */
export function shallowMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>,
): T {
  return ConfigMerger.shallowMerge(target, source)
}
