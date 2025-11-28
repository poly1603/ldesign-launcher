/**
 * 别名工具函数
 *
 * 提供别名配置相关的类型定义和工具函数
 * 支持按阶段配置别名，基本别名（@ -> src, ~ -> 项目根目录）由 launcher 自动配置
 *
 * @author LDesign Team
 * @since 1.0.0
 */

/**
 * 构建阶段类型（详细）
 * 用于内部处理，支持精确的阶段控制
 */
export type BuildStage = 'dev' | 'build' | 'preview'

/**
 * 别名生效阶段类型（简化）
 * 用于用户配置，提供更简洁的阶段控制
 *
 * @example
 * ```ts
 * // 仅开发模式生效
 * { find: '@ldesign/core', replacement: './packages/core/src', stage: 'dev' }
 *
 * // 仅构建模式生效
 * { find: 'lodash', replacement: 'lodash-es', stage: 'build' }
 *
 * // 所有模式都生效
 * { find: '@', replacement: './src', stage: 'all' }
 * ```
 */
export type AliasStage = 'dev' | 'build' | 'all'

/**
 * 别名配置项 - 符合 Vite 标准，扩展支持阶段配置
 *
 * @example
 * ```ts
 * // 使用 stage 简化配置（推荐）
 * { find: '@ldesign/shared', replacement: './packages/shared/src', stage: 'dev' }
 *
 * // 使用相对路径，自动基于 process.cwd() 解析
 * { find: '@utils', replacement: './src/utils', stage: 'all' }
 *
 * // 使用正则表达式匹配子路径
 * { find: /^@ldesign\/core\/(.+)$/, replacement: './packages/core/src/$1', stage: 'dev' }
 *
 * // 保持向后兼容的 stages 数组形式
 * { find: '@', replacement: '/src', stages: ['dev', 'build'] }
 * ```
 */
export interface AliasEntry {
  /** 别名匹配规则（字符串或正则表达式） */
  find: string | RegExp

  /**
   * 替换路径
   * - 绝对路径：直接使用
   * - 相对路径（以 ./ 或 ../ 开头）：基于 process.cwd() 解析为绝对路径
   * - 包名路径（如 'vue/dist/vue.esm.js'）：保持原样
   */
  replacement: string

  /**
   * 生效阶段（简化形式，推荐使用）
   * - 'dev': 仅在开发模式生效
   * - 'build': 仅在构建模式生效
   * - 'all': 在所有模式都生效（开发、构建、预览）
   *
   * @default 'dev'
   */
  stage?: AliasStage

  /**
   * 生效阶段数组（完整形式）
   * 与 stage 字段二选一，如果同时存在则 stage 优先
   *
   * @deprecated 推荐使用更简洁的 stage 字段
   */
  stages?: BuildStage[]
}

/**
 * 简化别名配置类型
 * 支持直接使用字符串形式配置相对路径别名
 *
 * @example
 * ```ts
 * // 字符串形式：以相对路径作为 find 和 replacement
 * resolve: {
 *   alias: [
 *     './src/utils',  // 等同于 { find: './src/utils', replacement: './src/utils', stage: 'all' }
 *   ]
 * }
 * ```
 */
export type SimpleAliasConfig = string

/**
 * 别名配置联合类型
 * 支持完整对象配置或简化字符串配置
 */
export type AliasConfig = AliasEntry | SimpleAliasConfig

/**
 * 将 stage 简化形式转换为 stages 数组形式
 *
 * @param stage - 简化的阶段配置
 * @returns 对应的阶段数组
 * @example
 * ```ts
 * stageToStages('dev')   // ['dev']
 * stageToStages('build') // ['build']
 * stageToStages('all')   // ['dev', 'build', 'preview']
 * ```
 */
export function stageToStages(stage: AliasStage): BuildStage[] {
  switch (stage) {
    case 'dev':
      return ['dev']
    case 'build':
      return ['build']
    case 'all':
      return ['dev', 'build', 'preview']
    default:
      return ['dev']
  }
}

/**
 * 规范化别名配置
 * 将 stage 字段转换为内部使用的 stages 数组
 *
 * @param entry - 别名配置项
 * @returns 规范化后的别名配置项（使用 stages 数组）
 */
export function normalizeAliasEntry(entry: AliasEntry): AliasEntry {
  // 如果指定了 stage，转换为 stages 数组
  if (entry.stage !== undefined) {
    return {
      find: entry.find,
      replacement: entry.replacement,
      stages: stageToStages(entry.stage),
    }
  }

  // 如果没有指定任何阶段配置，默认使用 'dev'
  if (entry.stages === undefined) {
    return {
      ...entry,
      stages: ['dev'],
    }
  }

  return entry
}

/**
 * 解析简化的字符串配置为完整的 AliasEntry
 *
 * @param config - 简化的字符串配置（相对路径）
 * @returns 完整的别名配置项
 */
export function parseSimpleAliasConfig(config: SimpleAliasConfig): AliasEntry {
  return {
    find: config,
    replacement: config,
    stages: ['dev', 'build', 'preview'],
  }
}

/**
 * 解析任意形式的别名配置为标准 AliasEntry
 *
 * @param config - 别名配置（对象或字符串形式）
 * @returns 标准化的别名配置项
 */
export function parseAliasConfig(config: AliasConfig): AliasEntry {
  // 字符串形式
  if (typeof config === 'string') {
    return parseSimpleAliasConfig(config)
  }

  // 对象形式，进行规范化
  return normalizeAliasEntry(config)
}

/**
 * 创建别名配置的选项接口
 */
export interface CreateAliasOptions {
  /**
   * 生效阶段（简化形式，推荐）
   * @default 'dev'
   */
  stage?: AliasStage
  /**
   * 生效阶段数组（完整形式）
   * @deprecated 推荐使用 stage
   */
  stages?: BuildStage[]
}

/**
 * 创建带阶段配置的别名
 *
 * @param find - 别名匹配规则
 * @param replacement - 替换路径（支持相对路径，基于 process.cwd() 解析）
 * @param options - 阶段配置选项，支持 stage 或 stages
 * @returns 别名配置对象
 *
 * @example
 * ```ts
 * // 使用 stage 简化配置（推荐）
 * createAlias('@ldesign/core', './packages/core/src', { stage: 'dev' })
 *
 * // 使用 stage: 'all' 在所有阶段生效
 * createAlias('@', './src', { stage: 'all' })
 *
 * // 兼容旧的 stages 数组形式
 * createAlias('@utils', './src/utils', { stages: ['dev', 'build'] })
 *
 * // 无选项时默认 stage: 'dev'
 * createAlias('@components', './src/components')
 * ```
 */
export function createAlias(
  find: string | RegExp,
  replacement: string,
  options: CreateAliasOptions | BuildStage[] = { stage: 'dev' },
): AliasEntry {
  // 兼容旧的数组参数形式
  if (Array.isArray(options)) {
    return {
      find,
      replacement,
      stages: options,
    }
  }

  // 使用新的选项对象形式
  if (options.stage !== undefined) {
    return {
      find,
      replacement,
      stage: options.stage,
      stages: stageToStages(options.stage),
    }
  }

  // 使用 stages 数组形式
  return {
    find,
    replacement,
    stages: options.stages || ['dev'],
  }
}

/**
 * 创建基本项目别名
 *
 * @param srcDir - src 目录路径，默认为 './src'
 * @param options - 阶段配置选项
 * @returns 基本别名配置数组
 *
 * @example
 * ```ts
 * // 默认配置（dev 阶段生效）
 * createBasicAliases()
 *
 * // 所有阶段都生效
 * createBasicAliases('./src', { stage: 'all' })
 * ```
 */
export function createBasicAliases(
  srcDir: string = './src',
  options: CreateAliasOptions | BuildStage[] = { stage: 'dev' },
): AliasEntry[] {
  return [
    createAlias('@', srcDir, options),
    createAlias('~', './', options),
  ]
}

/**
 * 创建开发时别名（只在 dev 阶段生效）
 *
 * @param find - 别名匹配规则
 * @param replacement - 替换路径
 * @returns 开发时别名配置对象
 */
export function createDevAlias(
  find: string | RegExp,
  replacement: string,
): AliasEntry {
  return createAlias(find, replacement, { stage: 'dev' })
}

/**
 * 创建构建时别名（只在 build 阶段生效）
 *
 * @param find - 别名匹配规则
 * @param replacement - 替换路径
 * @returns 构建时别名配置对象
 */
export function createBuildAlias(
  find: string | RegExp,
  replacement: string,
): AliasEntry {
  return createAlias(find, replacement, { stage: 'build' })
}

/**
 * 创建全阶段别名（在所有阶段都生效）
 *
 * @param find - 别名匹配规则
 * @param replacement - 替换路径
 * @returns 全阶段别名配置对象
 */
export function createUniversalAlias(
  find: string | RegExp,
  replacement: string,
): AliasEntry {
  return createAlias(find, replacement, { stage: 'all' })
}
