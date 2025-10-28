/**
 * Angular 框架适配器
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

export class AngularAdapter extends FrameworkAdapter {
  readonly name = 'angular' as const
  readonly version = '17.x'
  readonly description = 'Angular 框架适配器'
  readonly features: FrameworkFeatures = {
    jsx: false,
    sfc: false,
    cssModules: true,
    cssInJs: false,
    ssr: true,
    ssg: true,
    hmr: true,
    fastRefresh: false
  }

  async detect(cwd: string): Promise<FrameworkDetectionResult> {
    const evidence: FrameworkDetectionResult['evidence'] = {
      dependencies: [],
      files: [],
      configFiles: []
    }

    let confidence = 0

    if (await this.hasDependency(cwd, '@angular/core')) {
      evidence.dependencies!.push('@angular/core')
      confidence += 0.6
    }

    if (await this.hasDependency(cwd, '@analogjs/vite-plugin-angular')) {
      evidence.dependencies!.push('@analogjs/vite-plugin-angular')
      confidence += 0.3
    }

    const angularFiles = await this.findFiles(cwd, [
      'src/app/app.component.ts',
      'src/main.ts',
      'angular.json'
    ])
    if (angularFiles.length > 0) {
      evidence.files = angularFiles
      confidence += 0.2
    }

    const detected = confidence >= 0.5
    const version = await this.getDependencyVersion(cwd, '@angular/core')

    return {
      detected,
      type: detected ? 'angular' : undefined,
      version: version ? this.parseVersion(version) : undefined,
      confidence,
      evidence
    }
  }

  async getPlugins(engine: BuildEngine, options?: FrameworkOptions): Promise<Plugin[]> {
    if (engine.name === 'vite') {
      try {
        const { default: angular } = await import('@analogjs/vite-plugin-angular')
        const plugin = angular(options?.options)
        // 插件可能返回单个插件或插件数组
        // @ts-expect-error - Vite 版本冲突导致的类型不兼容
        return Array.isArray(plugin) ? plugin : [plugin]
      } catch (error) {
        throw new Error('请安装 @analogjs/vite-plugin-angular')
      }
    }
    return []
  }

  getConfig(options?: FrameworkOptions): Partial<ViteLauncherConfig> {
    return {
      server: {
        port: 4200,
        open: true
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
          output: {
            manualChunks: {
              angular: ['@angular/core', '@angular/common', '@angular/platform-browser'],
              'angular-router': ['@angular/router']
            }
          }
        }
      },
      resolve: {
        alias: [
          { find: '@', replacement: '/src' },
          { find: '~', replacement: '/src' }
        ],
        extensions: ['.ts', '.js', '.json']
      },
      optimizeDeps: {
        include: ['@angular/core', '@angular/common', '@angular/platform-browser']
      }
    }
  }

  getDependencies(): FrameworkDependencies {
    return {
      dependencies: [
        '@angular/core',
        '@angular/common',
        '@angular/platform-browser',
        '@angular/platform-browser-dynamic',
        'rxjs',
        'tslib',
        'zone.js'
      ],
      devDependencies: [
        '@analogjs/vite-plugin-angular',
        '@angular/compiler',
        '@angular/compiler-cli',
        'typescript',
        'vite'
      ],
      optionalDependencies: [
        '@angular/router',
        '@angular/forms'
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
      VITE_APP_TITLE: 'Angular App',
      VITE_APP_VERSION: '1.0.0'
    }
  }
}

