/**
 * Angular 框架适配器
 * 
 * 负责：
 * - 自动检测 Angular 项目
 * - 为 Vite 注入 @analogjs/vite-plugin-angular
 * - 提供基础 Vite 配置（zone.js、ts/tsx 解析等）
 */

import type { Plugin } from 'vite'
import type {
  FrameworkDetectionResult,
  FrameworkDependencies,
  FrameworkFeatures,
  FrameworkOptions,
} from '../../types/framework'
import type { BuildEngine } from '../../types/engine'
import type { ViteLauncherConfig } from '../../types/config'
import { FrameworkAdapter } from '../base/FrameworkAdapter'

export class AngularAdapter extends FrameworkAdapter {
  readonly name = 'angular' as const
  readonly version = '15-19'
  readonly description = 'Angular 框架适配器 - 使用 Analog Vite 插件编译 Angular'
  readonly features: FrameworkFeatures = {
    jsx: false,
    sfc: false,
    cssModules: true,
    cssInJs: false,
    ssr: false,
    ssg: false,
    hmr: true,
    fastRefresh: false,
  }

  async detect(cwd: string): Promise<FrameworkDetectionResult> {
    const evidence: FrameworkDetectionResult['evidence'] = {
      dependencies: [],
      files: [],
      configFiles: [],
    }

    let confidence = 0

    const ngCore = await this.getDependencyVersion(cwd, '@angular/core')
    if (ngCore) {
      evidence.dependencies!.push('@angular/core')
      confidence += 0.6
    }

    if (await this.hasDependency(cwd, '@analogjs/vite-plugin-angular')) {
      evidence.dependencies!.push('@analogjs/vite-plugin-angular')
      confidence += 0.2
    }

    const files = await this.findFiles(cwd, ['src/main.ts', 'src/app/app.component.ts'])
    if (files.length > 0) {
      evidence.files = files
      confidence += 0.2
    }

    const detected = confidence >= 0.5
    return {
      detected,
      type: detected ? 'angular' : undefined,
      version: ngCore ? this.parseVersion(ngCore) : undefined,
      confidence,
      evidence,
    }
  }

  async getPlugins(engine: BuildEngine, _options?: FrameworkOptions): Promise<Plugin[]> {
    // Angular 插件由 PluginManager 统一加载
    // 这里返回空数组,避免重复加载
    return []
  }

  getConfig(): Partial<ViteLauncherConfig> {
    return {
      resolve: {
        alias: [
          { find: '@', replacement: '/src' },
        ],
        extensions: ['.ts', '.js'],
      },
      optimizeDeps: {
        // 避免对 zone.js 进行预打包
        exclude: ['zone.js'],
      },
      esbuild: {
        // Angular 无需 JSX；保留默认
      },
      server: { open: false },
      build: { outDir: 'dist' },
    }
  }

  getDependencies(): FrameworkDependencies {
    return {
      dependencies: ['@angular/core', '@angular/common', '@angular/platform-browser', 'zone.js'],
      devDependencies: ['@analogjs/vite-plugin-angular', '@angular/compiler', '@angular/compiler-cli', 'typescript', 'vite'],
      optionalDependencies: [],
    }
  }

  getScripts(): Record<string, string> {
    return {
      dev: 'ldesign-launcher dev',
      build: 'ldesign-launcher build',
      preview: 'ldesign-launcher preview',
      'type-check': 'tsc --noEmit',
    }
  }
}

