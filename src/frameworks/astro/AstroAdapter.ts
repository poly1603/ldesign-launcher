/**
 * Astro 框架适配器
 *
 * 提供 Astro 项目的自动检测、插件配置和构建支持
 * Astro 是一个现代静态站点生成器，支持多种 UI 框架
 *
 * @author LDesign Team
 * @since 2.1.0
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
 * Astro 适配器实现
 */
export class AstroAdapter extends FrameworkAdapter {
  readonly name = 'astro' as const
  readonly version = '4.x'
  readonly description = 'Astro 框架适配器 - 内容驱动的静态站点生成器'
  readonly features: FrameworkFeatures = {
    jsx: true,
    sfc: true, // Astro 组件类似 SFC
    cssModules: true,
    cssInJs: true,
    ssr: true,
    ssg: true,
    hmr: true,
    fastRefresh: true,
  }

  /**
   * 检测项目是否使用 Astro
   */
  async detect(cwd: string): Promise<FrameworkDetectionResult> {
    const evidence: FrameworkDetectionResult['evidence'] = {
      dependencies: [],
      files: [],
      configFiles: [],
    }

    let confidence = 0

    // 1. 检查 package.json 中的 astro 依赖（最重要的指标）
    const astroVersion = await this.getDependencyVersion(cwd, 'astro')
    if (astroVersion) {
      evidence.dependencies!.push('astro')
      confidence += 0.5
    }

    // 2. 检查 Astro 配置文件
    const configFiles = await this.findFiles(cwd, [
      'astro.config.ts',
      'astro.config.mts',
      'astro.config.js',
      'astro.config.mjs',
    ])
    if (configFiles.length > 0) {
      evidence.configFiles = configFiles
      confidence += 0.25
    }

    // 3. 检查 .astro 文件
    const astroFiles = await this.findFiles(cwd, [
      'src/pages/index.astro',
      'src/layouts/*.astro',
      'src/components/*.astro',
    ])
    if (astroFiles.length > 0) {
      evidence.files = astroFiles
      confidence += 0.15
    }

    // 4. 检查项目结构（Astro 典型目录结构）
    const structurePatterns = [
      'src/pages',
      'src/layouts',
      'src/components',
      'public',
    ]
    const structureMatches = await this.checkProjectStructure(cwd, structurePatterns)
    if (structureMatches >= 2) {
      confidence += 0.05
    }

    // 5. 检查 Astro 集成
    const integrations = [
      '@astrojs/react',
      '@astrojs/vue',
      '@astrojs/svelte',
      '@astrojs/solid-js',
      '@astrojs/tailwind',
      '@astrojs/mdx',
    ]
    for (const integration of integrations) {
      if (await this.hasDependency(cwd, integration)) {
        evidence.dependencies!.push(integration)
        confidence += 0.02
      }
    }

    // 确保置信度不超过 1
    confidence = Math.min(confidence, 1)

    const detected = confidence >= 0.5

    this.logger.debug(
      `Astro 检测结果: ${detected ? '✓' : '✗'} (置信度: ${(confidence * 100).toFixed(1)}%)`,
    )

    return {
      detected,
      type: detected ? 'astro' : undefined,
      version: astroVersion ? this.parseVersion(astroVersion) : undefined,
      confidence,
      evidence,
    }
  }

  /**
   * 获取 Astro 所需的插件
   *
   * 注意：Astro 有自己的构建系统，不需要额外的 Vite 插件
   * 但可以提供一些辅助插件
   */
  async getPlugins(_engine: BuildEngine, _options?: FrameworkOptions): Promise<Plugin[]> {
    const plugins: Plugin[] = []

    // Astro 使用自己的集成系统，不需要额外的 Vite 插件
    // 这里可以添加一些通用的优化插件

    this.logger.debug('Astro 使用自己的构建系统，无需额外 Vite 插件')

    return plugins
  }

  /**
   * 获取 Astro 特定配置
   */
  getConfig(_options?: FrameworkOptions): Partial<ViteLauncherConfig> {
    return {
      // Astro 默认使用 4321 端口
      server: {
        port: 4321,
        open: true,
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
      },
      resolve: {
        alias: [
          { find: '@', replacement: '/src' },
          { find: '~', replacement: '/src' },
        ],
        extensions: ['.astro', '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.mdx'],
      },
      // Astro 项目的优化依赖
      optimizeDeps: {
        include: [],
        exclude: ['@astrojs/internal-helpers'],
      },
    }
  }

  /**
   * 获取 Astro 依赖列表
   */
  getDependencies(): FrameworkDependencies {
    return {
      dependencies: ['astro'],
      devDependencies: [
        'typescript',
        '@astrojs/check',
      ],
      optionalDependencies: [
        '@astrojs/react',
        '@astrojs/vue',
        '@astrojs/svelte',
        '@astrojs/tailwind',
        '@astrojs/mdx',
        '@astrojs/sitemap',
      ],
    }
  }

  /**
   * 获取推荐的 npm scripts
   */
  getScripts(): Record<string, string> {
    return {
      'dev': 'astro dev',
      'build': 'astro build',
      'preview': 'astro preview',
      'astro': 'astro',
      'check': 'astro check',
    }
  }

  /**
   * 获取环境变量配置
   */
  getEnvConfig(): Record<string, string> {
    return {
      PUBLIC_SITE_TITLE: 'Astro Site',
      PUBLIC_SITE_DESCRIPTION: 'Built with Astro',
    }
  }
}
