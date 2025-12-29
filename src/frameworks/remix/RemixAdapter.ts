/**
 * Remix 框架适配器
 *
 * 提供 Remix 项目的自动检测、插件配置和构建支持
 * Remix 是一个全栈 Web 框架，专注于 Web 标准和现代 UX
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
 * Remix 适配器实现
 */
export class RemixAdapter extends FrameworkAdapter {
  readonly name = 'remix' as const
  readonly version = '2.x'
  readonly description = 'Remix 框架适配器 - 全栈 Web 框架'
  readonly features: FrameworkFeatures = {
    jsx: true,
    sfc: false,
    cssModules: true,
    cssInJs: true,
    ssr: true,
    ssg: false, // Remix 主要是 SSR
    hmr: true,
    fastRefresh: true,
  }

  /**
   * 检测项目是否使用 Remix
   */
  async detect(cwd: string): Promise<FrameworkDetectionResult> {
    const evidence: FrameworkDetectionResult['evidence'] = {
      dependencies: [],
      files: [],
      configFiles: [],
    }

    let confidence = 0

    // 1. 检查 package.json 中的 @remix-run 依赖（最重要的指标）
    const remixReactVersion = await this.getDependencyVersion(cwd, '@remix-run/react')
    if (remixReactVersion) {
      evidence.dependencies!.push('@remix-run/react')
      confidence += 0.4
    }

    // 2. 检查 @remix-run/node 依赖
    if (await this.hasDependency(cwd, '@remix-run/node')) {
      evidence.dependencies!.push('@remix-run/node')
      confidence += 0.15
    }

    // 3. 检查 @remix-run/vite 依赖（Remix v2 with Vite）
    if (await this.hasDependency(cwd, '@remix-run/vite')) {
      evidence.dependencies!.push('@remix-run/vite')
      confidence += 0.15
    }

    // 4. 检查 Remix 配置文件
    const configFiles = await this.findFiles(cwd, [
      'remix.config.js',
      'remix.config.ts',
      'vite.config.ts', // Remix v2 使用 Vite 配置
    ])
    if (configFiles.length > 0) {
      evidence.configFiles = configFiles
      confidence += 0.1
    }

    // 5. 检查 Remix 路由文件
    const routeFiles = await this.findFiles(cwd, [
      'app/root.tsx',
      'app/root.jsx',
      'app/routes/_index.tsx',
      'app/routes/index.tsx',
    ])
    if (routeFiles.length > 0) {
      evidence.files = routeFiles
      confidence += 0.15
    }

    // 6. 检查项目结构（Remix 典型目录结构）
    const structurePatterns = [
      'app/routes',
      'app/components',
      'app/styles',
      'public',
    ]
    const structureMatches = await this.checkProjectStructure(cwd, structurePatterns)
    if (structureMatches >= 2) {
      confidence += 0.05
    }

    // 确保置信度不超过 1
    confidence = Math.min(confidence, 1)

    const detected = confidence >= 0.5

    this.logger.debug(
      `Remix 检测结果: ${detected ? '✓' : '✗'} (置信度: ${(confidence * 100).toFixed(1)}%)`,
    )

    return {
      detected,
      type: detected ? 'remix' : undefined,
      version: remixReactVersion ? this.parseVersion(remixReactVersion) : undefined,
      confidence,
      evidence,
    }
  }

  /**
   * 获取 Remix 所需的插件
   */
  async getPlugins(engine: BuildEngine, _options?: FrameworkOptions): Promise<Plugin[]> {
    const plugins: Plugin[] = []

    // 只为 Vite 引擎提供插件
    if (engine.name === 'vite') {
      try {
        // 尝试加载 @remix-run/vite 插件
        const { vitePlugin: remix } = await import('@remix-run/vite' as any)
        if (remix) {
          plugins.push(remix())
        }
      }
      catch (error) {
        this.logger.warn('Remix Vite 插件加载失败，可能需要安装 @remix-run/vite', error)
        // 不抛出错误，让用户可以使用默认配置
      }
    }

    return plugins
  }

  /**
   * 获取 Remix 特定配置
   */
  getConfig(_options?: FrameworkOptions): Partial<ViteLauncherConfig> {
    return {
      server: {
        port: 5173,
        open: true,
      },
      build: {
        outDir: 'build',
        assetsDir: 'assets',
        // Remix 有特定的构建输出结构
        rollupOptions: {
          output: {
            manualChunks: {
              remix: ['@remix-run/react', '@remix-run/node'],
            },
          },
        },
      },
      resolve: {
        alias: [
          { find: '~', replacement: '/app' },
        ],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      },
      optimizeDeps: {
        include: ['@remix-run/react', 'react', 'react-dom'],
      },
      // Remix 需要 SSR 模式
      ssr: {
        noExternal: ['@remix-run/*'],
      },
    }
  }

  /**
   * 获取 Remix 依赖列表
   */
  getDependencies(): FrameworkDependencies {
    return {
      dependencies: [
        '@remix-run/node',
        '@remix-run/react',
        '@remix-run/serve',
        'isbot',
        'react',
        'react-dom',
      ],
      devDependencies: [
        '@remix-run/dev',
        '@remix-run/vite',
        '@types/react',
        '@types/react-dom',
        'typescript',
        'vite',
      ],
      optionalDependencies: [
        '@remix-run/cloudflare',
        '@remix-run/express',
      ],
    }
  }

  /**
   * 获取推荐的 npm scripts
   */
  getScripts(): Record<string, string> {
    return {
      dev: 'remix vite:dev',
      build: 'remix vite:build',
      start: 'remix-serve ./build/server/index.js',
      typecheck: 'tsc',
    }
  }

  /**
   * 获取环境变量配置
   */
  getEnvConfig(): Record<string, string> {
    return {
      SESSION_SECRET: 'your-secret-here',
    }
  }
}
