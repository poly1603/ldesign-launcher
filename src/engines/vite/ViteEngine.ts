/**
 * Vite 构建引擎实现
 *
 * 封装 Vite 的核心功能，提供统一的引擎接口
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type { RollupOutput, RollupWatcher } from 'rollup'
import type {
  ViteDevServer,
  PreviewServer as VitePreviewServer,
  UserConfig as ViteUserConfig,
} from 'vite'
import type { ViteLauncherConfig } from '../../types/config'
import type {
  BuildAsset,
  DevServer,
  EngineBuildResult,
  EngineBuildStats,
  PreviewServer,
} from '../../types/engine'
import { BuildEngine } from '../base/BuildEngine'
import { ViteConfigTransformer } from './ViteConfigTransformer'

/**
 * Vite 引擎实现类
 */
export class ViteEngine extends BuildEngine {
  readonly name = 'vite' as const
  readonly version: string
  readonly description = 'Vite 构建引擎 - 下一代前端构建工具'

  private devServerInstance: ViteDevServer | null = null
  private previewServerInstance: VitePreviewServer | null = null

  constructor() {
    super(new ViteConfigTransformer())

    // 动态获取 Vite 版本
    try {
      // 这里会在运行时动态导入 vite 包
      this.version = 'dynamic' // 占位，实际版本在 initialize 时获取
    }
    catch {
      this.version = '5.0.0' // 默认版本
    }
  }

  /**
   * 初始化引擎
   */
  protected async onInitialize(): Promise<void> {
    this.logger.debug('初始化 Vite 引擎')

    try {
      // 动态导入 Vite 以获取版本信息
      const vite = await import('vite')
      // @ts-ignore - Vite 可能没有导出 version
      const version = vite.version || '5.0.0'
      // @ts-ignore - 设置版本
      this.version = version
      this.logger.debug(`Vite 版本: ${version}`)
    }
    catch {
      this.logger.warn('无法获取 Vite 版本信息')
    }
  }

  /**
   * 启动开发服务器
   */
  async dev(config: ViteLauncherConfig): Promise<DevServer> {
    this.ensureInitialized()
    this.logger.info('启动 Vite 开发服务器...')

    try {
      // 转换配置
      const viteConfig = this.transformConfig(config) as ViteUserConfig

      // 动态导入 Vite
      // 注：如果显示 "The CJS build of Vite's Node API is deprecated" 警告，
      // 这是因为 launcher 被构建为 CJS 格式以兼容更多环境，可以忽略。
      const { createServer } = await import('vite')

      // 创建开发服务器
      this.devServerInstance = await createServer(viteConfig)

      // 启动服务器
      await this.devServerInstance.listen()

      // 获取服务器信息
      const serverInfo = this.devServerInstance.config.server
      const port = serverInfo.port || 5173
      const https = !!serverInfo.https

      // 使用工具函数解析 host 和构建 URL
      const { resolveServerHost, getServerUrl } = await import('../../utils/server')
      const host = resolveServerHost(serverInfo.host)
      const url = getServerUrl(this.devServerInstance, serverInfo.host, port, https)

      const devServer: DevServer = {
        type: 'vite',
        url,
        port,
        host,
        https,
        raw: this.devServerInstance,
        close: async () => {
          await this.devServerInstance?.close()
          this.devServerInstance = null
        },
        restart: async () => {
          await this.devServerInstance?.restart()
        },
        printUrls: () => {
          this.devServerInstance?.printUrls()
        },
      }

      this.logger.success(`开发服务器已启动: ${devServer.url}`)
      return devServer
    }
    catch (error) {
      this.logger.error('启动开发服务器失败', error)
      throw error
    }
  }

  /**
   * 执行生产构建
   */
  async build(config: ViteLauncherConfig): Promise<EngineBuildResult> {
    this.ensureInitialized()
    this.logger.info('开始 Vite 生产构建...')

    const startTime = Date.now()

    try {
      // 转换配置
      const viteConfig = this.transformConfig(config) as ViteUserConfig

      // 动态导入 Vite
      const { build } = await import('vite')

      // 执行构建
      const output = await build(viteConfig) as RollupOutput | RollupOutput[]

      const duration = Date.now() - startTime

      // 处理构建结果
      const buildResult = this.processBuildOutput(output, viteConfig, duration)

      this.logger.success(`构建完成，耗时 ${duration}ms`)
      return buildResult
    }
    catch (error) {
      this.logger.error('构建失败', error)
      throw error
    }
  }

  /**
   * 启动预览服务器
   */
  async preview(config: ViteLauncherConfig): Promise<PreviewServer> {
    this.ensureInitialized()
    this.logger.info('启动 Vite 预览服务器...')

    try {
      // 转换配置
      const viteConfig = this.transformConfig(config) as ViteUserConfig

      // 动态导入 Vite
      const { preview } = await import('vite')

      // 创建预览服务器
      this.previewServerInstance = await preview(viteConfig)

      // 获取服务器信息
      const serverInfo = this.previewServerInstance.config.preview
      const port = serverInfo.port || 4173
      const https = !!serverInfo.https

      // 使用工具函数解析 host 和构建 URL
      const { resolveServerHost, getServerUrl } = await import('../../utils/server')
      const host = resolveServerHost(serverInfo.host)
      const url = getServerUrl(this.previewServerInstance, serverInfo.host, port, https)

      const previewServer: PreviewServer = {
        type: 'vite',
        url,
        port,
        host,
        https,
        raw: this.previewServerInstance,
        close: async () => {
          // Vite 预览服务器可能没有 close 方法
          // @ts-ignore
          await this.previewServerInstance?.httpServer?.close()
          this.previewServerInstance = null
        },
        printUrls: () => {
          this.previewServerInstance?.printUrls()
        },
      }

      this.logger.success(`预览服务器已启动: ${previewServer.url}`)
      return previewServer
    }
    catch (error) {
      this.logger.error('启动预览服务器失败', error)
      throw error
    }
  }

  /**
   * 启动监听模式构建
   */
  async buildWatch(config: ViteLauncherConfig): Promise<RollupWatcher> {
    this.ensureInitialized()
    this.logger.info('启动 Vite 监听模式构建...')

    try {
      // 转换配置并启用监听模式
      const viteConfig = this.transformConfig(config) as ViteUserConfig
      if (viteConfig.build) {
        viteConfig.build.watch = {}
      }

      // 动态导入 Vite
      const { build } = await import('vite')

      // 执行监听构建
      const watcher = await build(viteConfig) as RollupWatcher

      this.logger.success('监听模式构建已启动')
      return watcher
    }
    catch (error) {
      this.logger.error('启动监听模式构建失败', error)
      throw error
    }
  }

  /**
   * 清理资源
   */
  protected async onDispose(): Promise<void> {
    this.logger.debug('清理 Vite 引擎资源')

    if (this.devServerInstance) {
      await this.devServerInstance.close()
      this.devServerInstance = null
    }

    if (this.previewServerInstance) {
      // @ts-ignore
      await this.previewServerInstance.httpServer?.close()
      this.previewServerInstance = null
    }
  }

  /**
   * 处理构建输出
   */
  private processBuildOutput(
    output: RollupOutput | RollupOutput[],
    config: ViteUserConfig,
    duration: number,
  ): EngineBuildResult {
    const outputs = Array.isArray(output) ? output : [output]
    const outDir = config.build?.outDir || 'dist'

    // 收集所有资源
    const allAssets: BuildAsset[] = []

    for (const out of outputs) {
      if ('output' in out) {
        for (const chunk of out.output) {
          const asset: BuildAsset = {
            name: chunk.fileName,
            size: 'code' in chunk ? chunk.code.length : 0,
            type: this.getAssetType(chunk.fileName),
            isEntry: 'isEntry' in chunk ? chunk.isEntry : false,
            isDynamicEntry: 'isDynamicEntry' in chunk ? chunk.isDynamicEntry : false,
          }
          allAssets.push(asset)
        }
      }
    }

    // 计算统计信息
    const stats = this.calculateBuildStats(allAssets)

    return {
      type: 'vite',
      success: true,
      outDir,
      duration,
      assets: allAssets,
      stats,
      raw: outputs[0],
    }
  }

  /**
   * 获取资源类型
   */
  private getAssetType(fileName: string): BuildAsset['type'] {
    if (fileName.endsWith('.js') || fileName.endsWith('.mjs'))
      return 'js'
    if (fileName.endsWith('.css'))
      return 'css'
    if (fileName.endsWith('.html'))
      return 'html'
    if (fileName.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/))
      return 'asset'
    return 'other'
  }

  /**
   * 计算构建统计信息
   */
  private calculateBuildStats(assets: BuildAsset[]): EngineBuildStats {
    let jsSize = 0
    let cssSize = 0
    let assetSize = 0

    for (const asset of assets) {
      switch (asset.type) {
        case 'js':
          jsSize += asset.size
          break
        case 'css':
          cssSize += asset.size
          break
        case 'asset':
          assetSize += asset.size
          break
      }
    }

    return {
      totalFiles: assets.length,
      totalSize: jsSize + cssSize + assetSize,
      jsSize,
      cssSize,
      assetSize,
    }
  }
}
