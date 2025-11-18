/**
 * Solid.js 框架适配器
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type { Plugin } from 'vite'
import type { ViteLauncherConfig } from '../../types/config'
import type { BuildEngine } from '../../types/engine'
import type {
  FrameworkDependencies,
  FrameworkDetectionResult,
  FrameworkFeatures,
  FrameworkOptions,
} from '../../types/framework'
import { FrameworkAdapter } from '../base/FrameworkAdapter'

export class SolidAdapter extends FrameworkAdapter {
  readonly name = 'solid' as const
  readonly version = '1.x'
  readonly description = 'Solid.js 框架适配器'
  readonly features: FrameworkFeatures = {
    jsx: true,
    sfc: false,
    cssModules: true,
    cssInJs: true,
    ssr: true,
    ssg: true,
    hmr: true,
    fastRefresh: true,
  }

  async detect(cwd: string): Promise<FrameworkDetectionResult> {
    const evidence: FrameworkDetectionResult['evidence'] = {
      dependencies: [],
      files: [],
      configFiles: [],
    }

    let confidence = 0

    if (await this.hasDependency(cwd, 'solid-js')) {
      evidence.dependencies!.push('solid-js')
      confidence += 0.6
    }

    if (await this.hasDependency(cwd, 'vite-plugin-solid')) {
      evidence.dependencies!.push('vite-plugin-solid')
      confidence += 0.3
    }

    const solidFiles = await this.findFiles(cwd, ['src/App.tsx', 'src/index.tsx'])
    if (solidFiles.length > 0) {
      evidence.files = solidFiles
      confidence += 0.2
    }

    const detected = confidence >= 0.5
    const version = await this.getDependencyVersion(cwd, 'solid-js')

    return {
      detected,
      type: detected ? 'solid' : undefined,
      version: version ? this.parseVersion(version) : undefined,
      confidence,
      evidence,
    }
  }

  async getPlugins(engine: BuildEngine, options?: FrameworkOptions): Promise<Plugin[]> {
    if (engine.name === 'vite') {
      try {
        const { default: solid } = await import('vite-plugin-solid')
        // 只在有实际配置时传递选项,否则使用默认配置
        const solidOptions = options?.options && Object.keys(options.options).length > 0
          ? options.options
          : undefined
        const plugin = solid(solidOptions)
        // 插件可能返回单个插件或插件数组
        return (Array.isArray(plugin) ? plugin : [plugin]) as any as Plugin[]
      }
      catch {
        throw new Error('请安装 vite-plugin-solid')
      }
    }
    return []
  }

  getConfig(_options?: FrameworkOptions): Partial<ViteLauncherConfig> {
    return {
      server: {
        port: 3000,
        open: true,
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        target: 'esnext',
        rollupOptions: {
          output: {
            manualChunks: {
              solid: ['solid-js'],
            },
          },
        },
      },
      resolve: {
        alias: [
          { find: '@', replacement: '/src' },
          { find: '~', replacement: '/src' },
        ],
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
      },
      optimizeDeps: {
        include: ['solid-js', 'solid-js/web'],
      },
    }
  }

  getDependencies(): FrameworkDependencies {
    return {
      dependencies: ['solid-js'],
      devDependencies: [
        'vite-plugin-solid',
        'typescript',
        'vite',
      ],
      optionalDependencies: [
        '@solidjs/router',
      ],
    }
  }

  /**
   * 获取推荐的 npm scripts
   */
  getScripts(): Record<string, string> {
    return {
      'dev': 'launcher dev',
      'build': 'launcher build',
      'preview': 'launcher preview',
      'type-check': 'tsc --noEmit',
    }
  }

  /**
   * 获取环境变量配置
   */
  getEnvConfig(): Record<string, string> {
    return {
      VITE_APP_TITLE: 'Solid App',
      VITE_APP_VERSION: '1.0.0',
    }
  }
}
