/**
 * 路径别名管理器
 *
 * 提供简化的别名配置管理，保持 Vite 原有配置风格
 * 支持按阶段配置别名，默认内置 @ -> src 和 ~ -> 项目根目录别名
 *
 * 主要功能：
 * - 支持 stage 字段简化阶段配置（'dev' | 'build' | 'all'）
 * - 支持相对路径自动解析（基于 process.cwd()）
 * - 支持简化的字符串形式配置
 * - 保持与 Vite 原生别名配置的兼容性
 *
 * @author LDesign Team
 * @since 1.0.0
 */

import type { AliasConfig, AliasEntry, BuildStage } from '../utils/aliases'
import path from 'node:path'
import { normalizeAliasEntry, parseAliasConfig, stageToStages } from '../utils/aliases'

// 重新导出类型供外部使用
export type { AliasConfig, AliasEntry, BuildStage }
export type { AliasStage, CreateAliasOptions, SimpleAliasConfig } from '../utils/aliases'

/**
 * Vite 兼容的别名配置格式（不包含扩展字段）
 */
export interface ViteAliasEntry {
  /** 别名匹配规则 */
  find: string | RegExp
  /** 替换路径 */
  replacement: string
}

/**
 * 路径别名管理器
 *
 * @example
 * ```ts
 * const manager = new AliasManager('/path/to/project')
 *
 * // 处理混合格式的别名配置
 * const aliases = manager.processAliases([
 *   // 使用 stage 简化配置
 *   { find: '@ldesign/core', replacement: './packages/core/src', stage: 'dev' },
 *   // 使用 stage: 'all' 在所有阶段生效
 *   { find: '@', replacement: './src', stage: 'all' },
 *   // 兼容旧的 stages 数组形式
 *   { find: '@utils', replacement: './src/utils', stages: ['dev', 'build'] },
 * ])
 *
 * // 根据阶段过滤
 * const devAliases = manager.filterAliasesByStage(aliases, 'dev')
 * ```
 */
export class AliasManager {
  private cwd: string

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd
  }

  /**
   * 生成内置的基本别名配置
   * 包含 @ -> src 和 ~ -> 项目根目录别名
   *
   * @param stages - 生效阶段，默认只在 dev 阶段生效
   * @returns 内置别名配置数组
   */
  generateBuiltinAliases(stages: BuildStage[] = ['dev']): AliasEntry[] {
    const srcPath = path.resolve(this.cwd, 'src')
    const rootPath = path.resolve(this.cwd)

    return [
      {
        find: '@',
        replacement: srcPath,
        stages,
      },
      {
        find: '~',
        replacement: rootPath,
        stages,
      },
    ]
  }

  /**
   * 处理混合格式的别名配置数组
   * 支持 AliasEntry 对象和简化字符串形式
   *
   * @param configs - 混合格式的别名配置数组
   * @returns 规范化后的别名配置数组
   *
   * @example
   * ```ts
   * const aliases = manager.processAliases([
   *   { find: '@', replacement: './src', stage: 'all' },
   *   { find: '@ldesign/core', replacement: './packages/core/src', stage: 'dev' },
   *   './src/utils',  // 简化字符串形式
   * ])
   * ```
   */
  processAliases(configs: AliasConfig[]): AliasEntry[] {
    return configs.map((config) => {
      // 解析配置（支持字符串和对象形式）
      const entry = parseAliasConfig(config)
      // 规范化 stage 字段
      return normalizeAliasEntry(entry)
    })
  }

  /**
   * 根据阶段过滤别名配置
   *
   * @param aliases - 原始别名配置数组（支持 stage 和 stages 字段）
   * @param stage - 当前构建阶段
   * @returns 过滤后的 Vite 兼容别名配置数组
   *
   * @example
   * ```ts
   * const allAliases = [
   *   { find: '@', replacement: './src', stage: 'all' },
   *   { find: '@ldesign/core', replacement: './packages/core/src', stage: 'dev' },
   *   { find: 'lodash', replacement: 'lodash-es', stage: 'build' },
   * ]
   *
   * // 开发模式：返回 @ 和 @ldesign/core 别名
   * const devAliases = manager.filterAliasesByStage(allAliases, 'dev')
   *
   * // 构建模式：返回 @ 和 lodash 别名
   * const buildAliases = manager.filterAliasesByStage(allAliases, 'build')
   * ```
   */
  filterAliasesByStage(aliases: AliasEntry[], stage: BuildStage): ViteAliasEntry[] {
    const filtered = aliases
      .map((alias) => {
        // 先规范化配置，确保有 stages 字段
        return normalizeAliasEntry(alias)
      })
      .filter((alias) => {
        // 获取生效阶段，如果有 stage 字段则转换为 stages
        let effectiveStages: BuildStage[]

        if (alias.stage !== undefined) {
          effectiveStages = stageToStages(alias.stage)
        }
        else {
          effectiveStages = alias.stages || ['dev']
        }

        return effectiveStages.includes(stage)
      })
      .map((alias) => {
        // 解析相对路径为绝对路径
        const resolvedReplacement = this.resolveAlias(alias.replacement)

        // 返回标准的 Vite AliasEntry 格式（不包含 stage/stages 字段）
        return {
          find: alias.find,
          replacement: resolvedReplacement,
        }
      })

    return filtered
  }

  /**
   * 获取工作目录
   */
  getCwd(): string {
    return this.cwd
  }

  /**
   * 设置工作目录
   */
  setCwd(cwd: string): void {
    this.cwd = cwd
  }

  /**
   * 解析别名路径（相对路径转绝对路径）
   *
   * @param aliasPath - 别名路径
   * @returns 解析后的绝对路径
   *
   * @example
   * ```ts
   * // 绝对路径直接返回
   * resolveAlias('/absolute/path') // '/absolute/path'
   *
   * // 相对路径基于 cwd 解析
   * resolveAlias('./src/utils') // '/cwd/src/utils'
   *
   * // 包名路径保持原样
   * resolveAlias('vue/dist/vue.esm.js') // 'vue/dist/vue.esm.js'
   * ```
   */
  resolveAlias(aliasPath: string): string {
    // 如果已经是绝对路径，直接返回
    if (path.isAbsolute(aliasPath)) {
      return aliasPath
    }

    // 如果是 node_modules 包路径（不以 . / \ 开头），保持原样
    // 例如: 'vue/dist/vue.esm.js', 'lodash', '@babel/core' 等
    if (!aliasPath.startsWith('.') && !aliasPath.startsWith('/') && !aliasPath.startsWith('\\')) {
      return aliasPath
    }

    // 解析相对路径为绝对路径（基于当前工作目录）
    return path.resolve(this.cwd, aliasPath)
  }
}

/**
 * 创建别名管理器实例
 *
 * @param cwd - 工作目录，默认为 process.cwd()
 * @returns AliasManager 实例
 *
 * @example
 * ```ts
 * const manager = createAliasManager('/path/to/project')
 * const aliases = manager.processAliases([...])
 * ```
 */
export function createAliasManager(cwd?: string): AliasManager {
  return new AliasManager(cwd)
}
