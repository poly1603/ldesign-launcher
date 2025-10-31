/**
 * Marko 框架适配器
 *
 * 提供 Marko 项目的自动检测、插件配置和构建支持
 *
 * @author LDesign Team
 * @since 2.0.0
 */

// @ts-ignore - @marko/vite is an optional peer dependency
declare module '@marko/vite' {
  export default function marko(options?: any): any
}

import type { Plugin } from 'vite'
import type {
  FrameworkDetectionResult,
  FrameworkDependencies,
  FrameworkFeatures,
  FrameworkOptions
} from '../../types/framework'
import type { BuildEngine } from '../../types/engine'
import type { ViteLauncherConfig } from '../../types/config'
import { FrameworkAdapter } from '../base/FrameworkAdapter'

/**
 * Marko 适配器实现
 */
export class MarkoAdapter extends FrameworkAdapter {
  readonly name = 'marko' as const
  readonly version = '5.x'
  readonly description = 'Marko 框架适配器 - 快速、轻量的 UI 框架'
  readonly features: FrameworkFeatures = {
    jsx: false,
    sfc: true, // Marko 使用 .marko 文件
    cssModules: true,
    cssInJs: false,
    ssr: true,
    ssg: true,
    hmr: true,
    fastRefresh: true
  }

  /**
   * 检测项目是否使用 Marko
   */
  async detect(cwd: string): Promise<FrameworkDetectionResult> {
    const evidence: FrameworkDetectionResult['evidence'] = {
      dependencies: [],
      files: [],
      configFiles: []
    }

    let confidence = 0

    // 1. 检查 package.json 中的 marko 依赖（最重要的指标）
    const markoVersion = await this.getDependencyVersion(cwd, 'marko')
    if (markoVersion) {
      evidence.dependencies!.push('marko')
      confidence += 0.5
    }

    // 2. 检查 @marko/vite 插件依赖
    if (await this.hasDependency(cwd, '@marko/vite')) {
      evidence.dependencies!.push('@marko/vite')
      confidence += 0.2
    }

    // 3. 检查 Marko 入口文件
    const markoFiles = await this.findFiles(cwd, [
      'src/index.marko',
      'src/pages/index.marko',
      'src/components/app.marko',
      'src/app.marko'
    ])
    if (markoFiles.length > 0) {
      evidence.files = markoFiles
      confidence += 0.15
    }

    // 4. 检查入口文件中的 Marko import
    const entryFiles = await this.findEntryFiles(cwd)
    for (const file of entryFiles) {
      const imports = await this.findImportsInFile(cwd, file, ['marko'])
      if (imports.length > 0) {
        confidence += 0.1
        break
      }
    }

    // 5. 检查项目结构（Marko 典型目录结构）
    const structurePatterns = [
      'src/components',
      'src/pages',
      'src/layouts',
      'marko.json'
    ]
    const structureMatches = await this.checkProjectStructure(cwd, structurePatterns)
    if (structureMatches >= 2) {
      confidence += 0.05
    }

    // 6. 检查配置文件
    const configFiles = await this.findFiles(cwd, [
      'vite.config.ts',
      'vite.config.js',
      'marko.json'
    ])
    if (configFiles.length > 0) {
      evidence.configFiles = configFiles
      confidence += 0.05
    }

    // 7. 检查 marko.json 配置文件
    if (await this.hasFile(cwd, 'marko.json')) {
      confidence += 0.1
    }

    // 确保置信度不超过 1
    confidence = Math.min(confidence, 1)

    const detected = confidence >= 0.5

    this.logger.debug(
      `Marko 检测结果: ${detected ? '✓' : '✗'} (置信度: ${(confidence * 100).toFixed(1)}%)`
    )

    return {
      detected,
      type: detected ? 'marko' : undefined,
      version: markoVersion ? this.parseVersion(markoVersion) : undefined,
      confidence,
      evidence
    }
  }

  /**
   * 获取 Marko 所需的插件
   */
  async getPlugins(engine: BuildEngine, options?: FrameworkOptions): Promise<Plugin[]> {
    const plugins: Plugin[] = []

    // 只为 Vite 引擎提供插件
    if (engine.name === 'vite') {
      try {
        // 动态导入 @marko/vite
        // @ts-expect-error - @marko/vite is an optional peer dependency
        const { default: marko } = await import('@marko/vite')
        const plugin = marko(options?.options)
        // marko() 可能返回单个插件或插件数组
        if (Array.isArray(plugin)) {
          plugins.push(...plugin)
        } else {
          plugins.push(plugin)
        }
      } catch (error) {
        this.logger.error('加载 Marko 插件失败', error)
        throw new Error('请安装 @marko/vite: npm install -D @marko/vite')
      }
    }

    return plugins
  }

  /**
   * 获取 Marko 特定配置
   */
  getConfig(options?: FrameworkOptions): Partial<ViteLauncherConfig> {
    return {
      server: {
        port: 3000,
        open: true
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
          output: {
            manualChunks: {
              marko: ['marko']
            }
          }
        }
      },
      resolve: {
        alias: [
          { find: '@', replacement: '/src' },
          { find: '~', replacement: '/src' }
        ],
        extensions: ['.marko', '.js', '.ts', '.json']
      },
      optimizeDeps: {
        include: ['marko']
      }
    }
  }

  /**
   * 获取 Marko 依赖列表
   */
  getDependencies(): FrameworkDependencies {
    return {
      dependencies: ['marko'],
      devDependencies: [
        '@marko/vite',
        '@types/node',
        'vite'
      ],
      optionalDependencies: [
        '@marko/compiler',
        '@marko/babel-utils'
      ]
    }
  }

  /**
   * 获取推荐的 npm scripts
   */
  getScripts(): Record<string, string> {
    return {
      dev: 'launcher dev',
      build: 'launcher build',
      preview: 'launcher preview'
    }
  }

  /**
   * 获取环境变量配置
   */
  getEnvConfig(): Record<string, string> {
    return {
      VITE_APP_TITLE: 'Marko App',
      VITE_APP_VERSION: '1.0.0'
    }
  }
}


