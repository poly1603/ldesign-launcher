/**
 * Lit 框架适配器
 *
 * 提供 Lit 项目的自动检测、插件配置和构建支持
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

/**
 * Lit 适配器实现
 */
export class LitAdapter extends FrameworkAdapter {
  readonly name = 'lit' as const
  readonly version = '3.x'
  readonly description = 'Lit 框架适配器 - 简单、快速的 Web Components'
  readonly features: FrameworkFeatures = {
    jsx: false,
    sfc: false,
    cssModules: false,
    cssInJs: true,
    ssr: true,
    ssg: true,
    hmr: true,
    fastRefresh: false,
  }

  /**
   * 检测项目是否使用 Lit
   */
  async detect(cwd: string): Promise<FrameworkDetectionResult> {
    const evidence: FrameworkDetectionResult['evidence'] = {
      dependencies: [],
      files: [],
      configFiles: [],
    }

    let confidence = 0

    // 检查 package.json 中的 lit 依赖
    const litVersion = await this.getDependencyVersion(cwd, 'lit')
    if (litVersion) {
      evidence.dependencies!.push('lit')
      confidence += 0.6
    }

    // 检查 @lit/reactive-element 依赖
    if (await this.hasDependency(cwd, '@lit/reactive-element')) {
      evidence.dependencies!.push('@lit/reactive-element')
      confidence += 0.1
    }

    // 检查 lit-element 依赖（旧版本）
    if (await this.hasDependency(cwd, 'lit-element')) {
      evidence.dependencies!.push('lit-element')
      confidence += 0.5
    }

    // 检查 Lit 入口文件
    const litFiles = await this.findFiles(cwd, [
      'src/my-element.ts',
      'src/my-element.js',
      'src/index.ts',
      'src/index.js',
    ])
    if (litFiles.length > 0) {
      evidence.files = litFiles
      confidence += 0.2
    }

    // 检查配置文件
    const configFiles = await this.findFiles(cwd, [
      'vite.config.ts',
      'vite.config.js',
      'web-dev-server.config.js',
    ])
    if (configFiles.length > 0) {
      evidence.configFiles = configFiles
      confidence += 0.1
    }

    const detected = confidence >= 0.5

    return {
      detected,
      type: detected ? 'lit' : undefined,
      version: litVersion ? this.parseVersion(litVersion) : undefined,
      confidence,
      evidence,
    }
  }

  /**
   * 获取 Lit 所需的插件
   *
   * Lit 使用原生 Web Components，Vite 原生支持，不需要额外插件
   * 但可以添加一些优化插件
   */
  async getPlugins(engine: BuildEngine, _options?: FrameworkOptions): Promise<Plugin[]> {
    const plugins: Plugin[] = []

    // Vite 原生支持 Lit，但可以添加一些优化插件
    if (engine.name === 'vite') {
      // 可选：添加 lit-css 插件用于 CSS 导入
      try {
        // @ts-ignore - 可选依赖，可能不存在
        const { default: litCss } = await import('vite-plugin-lit-css')
        const cssPlugin = litCss()
        // 插件可能返回单个插件或插件数组
        if (Array.isArray(cssPlugin)) {
          plugins.push(...cssPlugin)
        }
        else {
          plugins.push(cssPlugin)
        }
      }
      catch {
        // lit-css 插件是可选的
        this.logger.debug('vite-plugin-lit-css 未安装，使用默认配置')
      }
    }

    return plugins
  }

  /**
   * 获取 Lit 特定配置
   */
  getConfig(_options?: FrameworkOptions): Partial<ViteLauncherConfig> {
    return {
      server: {
        port: 3000,
        open: true,
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        lib: {
          entry: 'src/index.ts',
          formats: ['es'],
        },
        rollupOptions: {
          external: /^lit/,
          output: {
            manualChunks: undefined,
          },
        },
      },
      resolve: {
        alias: [
          { find: '@', replacement: '/src' },
          { find: '~', replacement: '/src' },
        ],
        extensions: ['.js', '.ts', '.json'],
      },
      optimizeDeps: {
        include: ['lit', 'lit/decorators.js', 'lit/directives/class-map.js'],
      },
    }
  }

  /**
   * 获取 Lit 依赖列表
   */
  getDependencies(): FrameworkDependencies {
    return {
      dependencies: ['lit'],
      devDependencies: [
        '@types/node',
        'typescript',
        'vite',
      ],
      optionalDependencies: [
        'vite-plugin-lit-css',
        '@lit/reactive-element',
        '@lit/localize',
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
      VITE_APP_TITLE: 'Lit App',
      VITE_APP_VERSION: '1.0.0',
    }
  }
}
