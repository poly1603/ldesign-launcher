/**
 * Qwik 框架适配器
 * 
 * 提供 Qwik 项目的自动检测、插件配置和构建支持
 * 
 * @author LDesign Team
 * @since 2.0.0
 */

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
 * Qwik 适配器实现
 */
export class QwikAdapter extends FrameworkAdapter {
  readonly name = 'qwik' as const
  readonly version = '1.x'
  readonly description = 'Qwik 框架适配器 - 可恢复性框架'
  readonly features: FrameworkFeatures = {
    jsx: true,
    sfc: false,
    cssModules: true,
    cssInJs: true,
    ssr: true,
    ssg: true,
    hmr: true,
    fastRefresh: true
  }

  /**
   * 检测项目是否使用 Qwik
   */
  async detect(cwd: string): Promise<FrameworkDetectionResult> {
    const evidence: FrameworkDetectionResult['evidence'] = {
      dependencies: [],
      files: [],
      configFiles: []
    }

    let confidence = 0

    // 检查 package.json 中的 @builder.io/qwik 依赖
    const qwikVersion = await this.getDependencyVersion(cwd, '@builder.io/qwik')
    if (qwikVersion) {
      evidence.dependencies!.push('@builder.io/qwik')
      confidence += 0.6
    }

    // 检查 @builder.io/qwik-city 依赖
    if (await this.hasDependency(cwd, '@builder.io/qwik-city')) {
      evidence.dependencies!.push('@builder.io/qwik-city')
      confidence += 0.2
    }

    // 检查 Qwik 入口文件
    const qwikFiles = await this.findFiles(cwd, [
      'src/root.tsx',
      'src/entry.ssr.tsx',
      'src/routes/index.tsx'
    ])
    if (qwikFiles.length > 0) {
      evidence.files = qwikFiles
      confidence += 0.2
    }

    // 检查配置文件
    const configFiles = await this.findFiles(cwd, [
      'vite.config.ts',
      'vite.config.js',
      'adapters/static/vite.config.ts'
    ])
    if (configFiles.length > 0) {
      evidence.configFiles = configFiles
      confidence += 0.1
    }

    const detected = confidence >= 0.5

    return {
      detected,
      type: detected ? 'qwik' : undefined,
      version: qwikVersion ? this.parseVersion(qwikVersion) : undefined,
      confidence,
      evidence
    }
  }

  /**
   * 获取 Qwik 所需的插件
   */
  async getPlugins(engine: BuildEngine, options?: FrameworkOptions): Promise<Plugin[]> {
    const plugins: Plugin[] = []

    // 只为 Vite 引擎提供插件
    if (engine.name === 'vite') {
      try {
        // 动态导入 @builder.io/qwik
        const { qwikVite } = await import('@builder.io/qwik/optimizer')

        // 使用新的 API 格式（传递单个对象参数）
        const qwikOptions = {
          client: {
            devInput: options?.options?.devInput,
            outDir: options?.options?.outDir
          },
          ...(options?.options || {})
        }
        const plugin = qwikVite(qwikOptions)

        // 插件可能返回单个插件或插件数组
        if (Array.isArray(plugin)) {
          plugins.push(...plugin)
        } else {
          plugins.push(plugin)
        }

        // 尝试加载 Qwik City 插件
        try {
          // @ts-ignore - 可选依赖，可能不存在
          const { qwikCity } = await import('@builder.io/qwik-city/vite')
          const cityPlugin = qwikCity()
          if (Array.isArray(cityPlugin)) {
            plugins.push(...(cityPlugin as any))
          } else if (cityPlugin) {
            plugins.push(cityPlugin as any)
          }
        } catch (error) {
          this.logger.warn('未找到 @builder.io/qwik-city，跳过 Qwik City 支持')
        }
      } catch (error) {
        this.logger.error('加载 Qwik 插件失败', error)
        throw new Error('请安装 @builder.io/qwik: npm install @builder.io/qwik')
      }
    }

    return plugins
  }

  /**
   * 获取 Qwik 特定配置
   */
  getConfig(options?: FrameworkOptions): Partial<ViteLauncherConfig> {
    return {
      server: {
        port: 5173,
        open: true,
        headers: {
          'Cache-Control': 'public, max-age=0'
        }
      },
      build: {
        outDir: 'dist',
        assetsDir: 'build',
        target: 'es2020',
        rollupOptions: {
          output: {
            manualChunks: undefined
          }
        }
      },
      resolve: {
        alias: [
          { find: '@', replacement: '/src' },
          { find: '~', replacement: '/src' }
        ],
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.json']
      },
      optimizeDeps: {
        include: []
      },
      ssr: {
        target: 'webworker',
        noExternal: true
      }
    }
  }

  /**
   * 获取 Qwik 依赖列表
   */
  getDependencies(): FrameworkDependencies {
    return {
      dependencies: [
        '@builder.io/qwik',
        '@builder.io/qwik-city'
      ],
      devDependencies: [
        '@types/node',
        'typescript',
        'vite'
      ],
      optionalDependencies: [
        '@builder.io/partytown'
      ]
    }
  }

  /**
   * 获取推荐的 npm scripts
   */
  getScripts(): Record<string, string> {
    return {
      dev: 'launcher dev',
      'dev.debug': 'node --inspect-brk ./node_modules/vite/bin/vite.js --mode ssr',
      build: 'launcher build',
      'build.client': 'vite build',
      'build.preview': 'vite build --ssr src/entry.preview.tsx',
      'build.types': 'tsc --incremental --noEmit',
      preview: 'launcher preview',
      'type-check': 'tsc --noEmit'
    }
  }

  /**
   * 获取环境变量配置
   */
  getEnvConfig(): Record<string, string> {
    return {
      VITE_APP_TITLE: 'Qwik App',
      VITE_APP_VERSION: '1.0.0'
    }
  }
}

