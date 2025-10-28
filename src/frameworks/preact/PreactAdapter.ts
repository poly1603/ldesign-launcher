/**
 * Preact 框架适配器
 * 
 * 提供 Preact 项目的自动检测、插件配置和构建支持
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
 * Preact 适配器实现
 */
export class PreactAdapter extends FrameworkAdapter {
  readonly name = 'preact' as const
  readonly version = '10.x'
  readonly description = 'Preact 框架适配器 - 快速的 3kB React 替代方案'
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
   * 检测项目是否使用 Preact
   */
  async detect(cwd: string): Promise<FrameworkDetectionResult> {
    const evidence: FrameworkDetectionResult['evidence'] = {
      dependencies: [],
      files: [],
      configFiles: []
    }

    let confidence = 0

    // 检查 package.json 中的 preact 依赖
    const preactVersion = await this.getDependencyVersion(cwd, 'preact')
    if (preactVersion) {
      evidence.dependencies!.push('preact')
      confidence += 0.6
    }

    // 检查 @preact/preset-vite 依赖
    if (await this.hasDependency(cwd, '@preact/preset-vite')) {
      evidence.dependencies!.push('@preact/preset-vite')
      confidence += 0.2
    }

    // 检查 Preact 入口文件
    const preactFiles = await this.findFiles(cwd, [
      'src/App.tsx',
      'src/App.jsx',
      'src/main.tsx',
      'src/main.jsx',
      'src/index.tsx',
      'src/index.jsx'
    ])
    if (preactFiles.length > 0) {
      evidence.files = preactFiles
      confidence += 0.2
    }

    // 检查配置文件
    const configFiles = await this.findFiles(cwd, [
      'vite.config.ts',
      'vite.config.js',
      'preact.config.js'
    ])
    if (configFiles.length > 0) {
      evidence.configFiles = configFiles
      confidence += 0.1
    }

    const detected = confidence >= 0.5

    return {
      detected,
      type: detected ? 'preact' : undefined,
      version: preactVersion ? this.parseVersion(preactVersion) : undefined,
      confidence,
      evidence
    }
  }

  /**
   * 获取 Preact 所需的插件
   */
  async getPlugins(engine: BuildEngine, options?: FrameworkOptions): Promise<Plugin[]> {
    const plugins: Plugin[] = []

    // 只为 Vite 引擎提供插件
    if (engine.name === 'vite') {
      try {
        // 动态导入 @preact/preset-vite
        const { default: preact } = await import('@preact/preset-vite')
        const plugin = preact(options?.options)
        // 插件可能返回单个插件或插件数组
        if (Array.isArray(plugin)) {
          plugins.push(...plugin)
        } else {
          plugins.push(plugin)
        }
      } catch (error) {
        this.logger.error('加载 Preact 插件失败', error)
        throw new Error('请安装 @preact/preset-vite: npm install -D @preact/preset-vite')
      }
    }

    return plugins
  }

  /**
   * 获取 Preact 特定配置
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
              preact: ['preact'],
              'preact-router': ['preact-router']
            }
          }
        }
      },
      resolve: {
        alias: [
          { find: '@', replacement: '/src' },
          { find: '~', replacement: '/src' },
          { find: 'react', replacement: 'preact/compat' },
          { find: 'react-dom', replacement: 'preact/compat' }
        ],
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.json']
      },
      optimizeDeps: {
        include: ['preact', 'preact/hooks']
      },
      esbuild: {
        jsxFactory: 'h',
        jsxFragment: 'Fragment',
        jsxInject: `import { h, Fragment } from 'preact'`
      }
    }
  }

  /**
   * 获取 Preact 依赖列表
   */
  getDependencies(): FrameworkDependencies {
    return {
      dependencies: ['preact'],
      devDependencies: [
        '@preact/preset-vite',
        '@types/node',
        'typescript',
        'vite'
      ],
      optionalDependencies: [
        'preact-router',
        'preact-render-to-string'
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
      preview: 'launcher preview',
      'type-check': 'tsc --noEmit'
    }
  }

  /**
   * 获取环境变量配置
   */
  getEnvConfig(): Record<string, string> {
    return {
      VITE_APP_TITLE: 'Preact App',
      VITE_APP_VERSION: '1.0.0'
    }
  }
}

