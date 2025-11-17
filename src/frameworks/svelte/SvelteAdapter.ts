/**
 * Svelte 框架适配器
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

export class SvelteAdapter extends FrameworkAdapter {
  readonly name = 'svelte' as const
  readonly version = '4.x'
  readonly description = 'Svelte 框架适配器'
  readonly features: FrameworkFeatures = {
    jsx: false,
    sfc: true,
    cssModules: false,
    cssInJs: false,
    ssr: true,
    ssg: true,
    hmr: true,
    fastRefresh: true
  }

  async detect(cwd: string): Promise<FrameworkDetectionResult> {
    const evidence: FrameworkDetectionResult['evidence'] = {
      dependencies: [],
      files: [],
      configFiles: []
    }

    let confidence = 0

    if (await this.hasDependency(cwd, 'svelte')) {
      evidence.dependencies!.push('svelte')
      confidence += 0.6
    }

    if (await this.hasDependency(cwd, '@sveltejs/vite-plugin-svelte')) {
      evidence.dependencies!.push('@sveltejs/vite-plugin-svelte')
      confidence += 0.3
    }

    const svelteFiles = await this.findFiles(cwd, ['src/App.svelte', 'src/main.ts'])
    if (svelteFiles.length > 0) {
      evidence.files = svelteFiles
      confidence += 0.2
    }

    const detected = confidence >= 0.5
    const version = await this.getDependencyVersion(cwd, 'svelte')

    return {
      detected,
      type: detected ? 'svelte' : undefined,
      version: version ? this.parseVersion(version) : undefined,
      confidence,
      evidence
    }
  }

  async getPlugins(engine: BuildEngine, options?: FrameworkOptions): Promise<Plugin[]> {
    if (engine.name === 'vite') {
      try {
        const sveltePlugin = await import('@sveltejs/vite-plugin-svelte')
        // svelte() function is the named export, not default
        const { svelte } = sveltePlugin as any
        return svelte(options?.options || {})
      } catch (error) {
        this.logger.error('加载 Svelte 插件失败', error)
        throw new Error('请安装 @sveltejs/vite-plugin-svelte: npm install -D @sveltejs/vite-plugin-svelte')
      }
    }
    return []
  }

  getConfig(options?: FrameworkOptions): Partial<ViteLauncherConfig> {
    return {
      server: {
        port: 5173,
        open: true
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
          output: {
            manualChunks: {
              svelte: ['svelte']
            }
          }
        }
      },
      resolve: {
        alias: [
          { find: '@', replacement: '/src' },
          { find: '~', replacement: '/src' }
        ],
        extensions: ['.svelte', '.js', '.ts', '.json']
      },
      optimizeDeps: {
        include: ['svelte']
      }
    }
  }

  getDependencies(): FrameworkDependencies {
    return {
      dependencies: ['svelte'],
      devDependencies: [
        '@sveltejs/vite-plugin-svelte',
        'svelte-check',
        'vite'
      ],
      optionalDependencies: [
        '@sveltejs/kit'
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
      check: 'svelte-check --tsconfig ./tsconfig.json'
    }
  }

  /**
   * 获取环境变量配置
   */
  getEnvConfig(): Record<string, string> {
    return {
      VITE_APP_TITLE: 'Svelte App',
      VITE_APP_VERSION: '1.0.0'
    }
  }
}

