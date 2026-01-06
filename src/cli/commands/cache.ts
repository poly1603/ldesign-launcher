/**
 * Cache 命令实现
 *
 * 管理 Launcher 构建缓存的命令
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type { CliCommandDefinition, CliContext } from '../../types'
import fs from 'node:fs'
import path from 'node:path'
import pc from 'picocolors'
import { DEFAULT_CACHE_DIR, LDESIGN_DIR } from '../../constants'
import { Logger } from '../../utils/logger'

/**
 * 缓存类型
 */
type CacheType = 'all' | 'vite' | 'deps' | 'build' | 'temp'

/**
 * 缓存信息
 */
interface CacheInfo {
  /** 缓存类型 */
  type: CacheType
  /** 缓存路径 */
  path: string
  /** 缓存大小（字节） */
  size: number
  /** 文件数量 */
  fileCount: number
  /** 最后修改时间 */
  lastModified: Date | null
  /** 是否存在 */
  exists: boolean
}

/**
 * Cache 命令类
 */
export class CacheCommand implements CliCommandDefinition {
  name = 'cache'
  aliases = ['c']
  description = '管理构建缓存'
  usage = 'launcher cache <subcommand> [options]'

  options = [
    {
      name: 'type',
      alias: 't',
      description: '缓存类型 (all, vite, deps, build, temp)',
      type: 'string' as const,
      default: 'all',
    },
    {
      name: 'force',
      alias: 'f',
      description: '强制执行，不需要确认',
      type: 'boolean' as const,
      default: false,
    },
    {
      name: 'dry-run',
      alias: 'd',
      description: '模拟运行，不实际删除',
      type: 'boolean' as const,
      default: false,
    },
  ]

  examples = [
    {
      description: '查看缓存状态',
      command: 'launcher cache list',
    },
    {
      description: '清除所有缓存',
      command: 'launcher cache clear',
    },
    {
      description: '清除 Vite 缓存',
      command: 'launcher cache clear --type vite',
    },
    {
      description: '清除依赖缓存',
      command: 'launcher cache clear --type deps',
    },
    {
      description: '模拟清除缓存（不实际删除）',
      command: 'launcher cache clear --dry-run',
    },
  ]

  /**
   * 验证命令参数
   *
   * @param context - CLI 上下文
   * @returns 验证结果
   */
  validate(context: CliContext): boolean | string {
    const subcommand = context.args[0]

    if (!subcommand) {
      return '请指定子命令: list, clear, info'
    }

    const validSubcommands = ['list', 'clear', 'info', 'ls', 'rm', 'clean']
    if (!validSubcommands.includes(subcommand)) {
      return `无效的子命令: ${subcommand}。可用子命令: ${validSubcommands.join(', ')}`
    }

    const validTypes: CacheType[] = ['all', 'vite', 'deps', 'build', 'temp']
    const cacheType = context.options.type as CacheType
    if (cacheType && !validTypes.includes(cacheType)) {
      return `无效的缓存类型: ${cacheType}。可用类型: ${validTypes.join(', ')}`
    }

    return true
  }

  /**
   * 执行命令
   *
   * @param context - CLI 上下文
   */
  async handler(context: CliContext): Promise<void> {
    const logger = new Logger('cache', {
      level: context.options.silent ? 'silent' : (context.options.debug ? 'debug' : 'info'),
      colors: context.terminal.supportsColor,
      compact: !context.options.debug,
    })

    const subcommand = context.args[0]
    const cacheType = (context.options.type as CacheType) || 'all'
    const force = context.options.force as boolean
    const dryRun = context.options['dry-run'] as boolean

    try {
      switch (subcommand) {
        case 'list':
        case 'ls':
          await this.listCache(context.cwd, cacheType, logger)
          break

        case 'clear':
        case 'rm':
        case 'clean':
          await this.clearCache(context.cwd, cacheType, force, dryRun, logger)
          break

        case 'info':
          await this.showCacheInfo(context.cwd, logger)
          break

        default:
          logger.error(`未知子命令: ${subcommand}`)
          process.exit(1)
      }
    } catch (error) {
      logger.error(`缓存操作失败: ${(error as Error).message}`)
      if (context.options.debug) {
        logger.error('错误详情:', { stack: (error as Error).stack })
      }
      process.exit(1)
    }
  }

  /**
   * 获取缓存路径配置
   */
  private getCachePaths(cwd: string): Record<CacheType, string[]> {
    return {
      all: [
        path.join(cwd, 'node_modules', '.vite'),
        path.join(cwd, 'node_modules', '.cache'),
        path.join(cwd, 'node_modules', '.tmp'),
        path.join(cwd, LDESIGN_DIR, 'cache'),
        path.join(cwd, '.turbo'),
      ],
      vite: [
        path.join(cwd, 'node_modules', '.vite'),
      ],
      deps: [
        path.join(cwd, 'node_modules', '.cache'),
        path.join(cwd, 'node_modules', '.pnpm'),
      ],
      build: [
        path.join(cwd, 'dist'),
        path.join(cwd, 'build'),
        path.join(cwd, '.output'),
      ],
      temp: [
        path.join(cwd, 'node_modules', '.tmp'),
        path.join(cwd, LDESIGN_DIR, 'temp'),
        path.join(cwd, '.turbo'),
      ],
    }
  }

  /**
   * 获取缓存信息
   */
  private async getCacheInfo(cachePath: string, type: CacheType): Promise<CacheInfo> {
    const info: CacheInfo = {
      type,
      path: cachePath,
      size: 0,
      fileCount: 0,
      lastModified: null,
      exists: false,
    }

    try {
      if (!fs.existsSync(cachePath)) {
        return info
      }

      info.exists = true
      const stats = fs.statSync(cachePath)
      info.lastModified = stats.mtime

      // 计算目录大小
      const { size, count } = await this.getDirectorySize(cachePath)
      info.size = size
      info.fileCount = count
    } catch {
      // 忽略访问错误
    }

    return info
  }

  /**
   * 计算目录大小
   */
  private async getDirectorySize(dirPath: string): Promise<{ size: number; count: number }> {
    let size = 0
    let count = 0

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)

        if (entry.isDirectory()) {
          const subResult = await this.getDirectorySize(fullPath)
          size += subResult.size
          count += subResult.count
        } else if (entry.isFile()) {
          try {
            const stats = fs.statSync(fullPath)
            size += stats.size
            count++
          } catch {
            // 忽略单个文件的访问错误
          }
        }
      }
    } catch {
      // 忽略目录访问错误
    }

    return { size, count }
  }

  /**
   * 格式化文件大小
   */
  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  /**
   * 列出缓存
   */
  private async listCache(cwd: string, type: CacheType, logger: Logger): Promise<void> {
    logger.info('📦 缓存状态\n')

    const cachePaths = this.getCachePaths(cwd)
    const paths = type === 'all'
      ? Object.entries(cachePaths).flatMap(([t, ps]) => ps.map(p => ({ type: t as CacheType, path: p })))
      : cachePaths[type].map(p => ({ type, path: p }))

    let totalSize = 0
    let totalFiles = 0
    const cacheInfos: CacheInfo[] = []

    for (const { type: cacheType, path: cachePath } of paths) {
      const info = await this.getCacheInfo(cachePath, cacheType)
      cacheInfos.push(info)

      if (info.exists) {
        totalSize += info.size
        totalFiles += info.fileCount
      }
    }

    // 显示表格
    const tableData = cacheInfos
      .filter(info => info.exists)
      .map(info => ({
        type: info.type,
        path: path.relative(cwd, info.path) || info.path,
        size: this.formatSize(info.size),
        files: String(info.fileCount),
        modified: info.lastModified ? info.lastModified.toLocaleDateString() : '-',
      }))

    if (tableData.length === 0) {
      logger.info('  没有找到缓存文件\n')
      return
    }

    // 简单表格输出
    logger.info('  类型\t\t大小\t\t文件数\t路径')
    logger.info('  ' + '─'.repeat(60))

    for (const row of tableData) {
      logger.info(`  ${pc.cyan(row.type.padEnd(8))}\t${pc.yellow(row.size.padEnd(10))}\t${row.files.padEnd(6)}\t${pc.gray(row.path)}`)
    }

    logger.info('  ' + '─'.repeat(60))
    logger.info(`  ${pc.bold('总计')}\t\t${pc.yellow(this.formatSize(totalSize))}\t\t${totalFiles} 文件\n`)
  }

  /**
   * 清除缓存
   */
  private async clearCache(
    cwd: string,
    type: CacheType,
    force: boolean,
    dryRun: boolean,
    logger: Logger,
  ): Promise<void> {
    const cachePaths = this.getCachePaths(cwd)
    const pathsToClean = cachePaths[type]

    // 收集要删除的目录
    const existingPaths: string[] = []
    let totalSize = 0

    for (const cachePath of pathsToClean) {
      if (fs.existsSync(cachePath)) {
        existingPaths.push(cachePath)
        const { size } = await this.getDirectorySize(cachePath)
        totalSize += size
      }
    }

    if (existingPaths.length === 0) {
      logger.info('没有找到可清除的缓存')
      return
    }

    logger.info(`\n🧹 准备清除 ${type} 缓存\n`)
    logger.info(`  将删除以下目录:`)

    for (const p of existingPaths) {
      logger.info(`    ${pc.red('×')} ${path.relative(cwd, p) || p}`)
    }

    logger.info(`\n  预计释放空间: ${pc.yellow(this.formatSize(totalSize))}\n`)

    if (dryRun) {
      logger.info(pc.cyan('  [模拟运行] 未实际删除任何文件\n'))
      return
    }

    // 确认删除
    if (!force) {
      const { default: inquirer } = await import('inquirer')
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: '确认删除这些缓存？',
          default: false,
        },
      ])

      if (!confirm) {
        logger.info('操作已取消')
        return
      }
    }

    // 执行删除
    let deletedCount = 0
    let deletedSize = 0

    for (const cachePath of existingPaths) {
      try {
        const { size } = await this.getDirectorySize(cachePath)
        fs.rmSync(cachePath, { recursive: true, force: true })
        deletedCount++
        deletedSize += size
        logger.info(`  ${pc.green('✓')} 已删除 ${path.relative(cwd, cachePath) || cachePath}`)
      } catch (error) {
        logger.warn(`  ${pc.yellow('!')} 删除失败: ${cachePath} - ${(error as Error).message}`)
      }
    }

    logger.info(`\n${pc.green('✓')} 清除完成: 删除了 ${deletedCount} 个目录，释放 ${this.formatSize(deletedSize)}\n`)
  }

  /**
   * 显示缓存详细信息
   */
  private async showCacheInfo(cwd: string, logger: Logger): Promise<void> {
    logger.info('\n📊 缓存详细信息\n')

    const cachePaths = this.getCachePaths(cwd)

    for (const [type, paths] of Object.entries(cachePaths)) {
      let typeSize = 0
      let typeFiles = 0
      let hasCache = false

      for (const cachePath of paths) {
        if (fs.existsSync(cachePath)) {
          hasCache = true
          const { size, count } = await this.getDirectorySize(cachePath)
          typeSize += size
          typeFiles += count
        }
      }

      const icon = hasCache ? pc.green('●') : pc.gray('○')
      const sizeStr = hasCache ? pc.yellow(this.formatSize(typeSize)) : pc.gray('0 B')
      const filesStr = hasCache ? `${typeFiles} 文件` : '无缓存'

      logger.info(`  ${icon} ${pc.bold(type.padEnd(8))} ${sizeStr.padStart(12)}  ${pc.gray(filesStr)}`)
    }

    // 显示磁盘使用建议
    logger.info('\n💡 提示:')
    logger.info('  • 使用 `launcher cache clear` 清除所有缓存')
    logger.info('  • 使用 `launcher cache clear --type vite` 只清除 Vite 缓存')
    logger.info('  • 定期清理缓存可以解决一些奇怪的构建问题\n')
  }
}

/**
 * 导出命令实例
 */
export const cacheCommand = new CacheCommand()
