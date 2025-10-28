/**
 * Vue 3 框架适配器
 * 
 * 提供 Vue 3 项目的自动检测、插件配置和构建支持
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
 * Vue 3 适配器实现
 */
export class Vue3Adapter extends FrameworkAdapter {
  readonly name = 'vue3' as const
  readonly version = '3.x'
  readonly description = 'Vue 3 框架适配器'
  readonly features: FrameworkFeatures = {
    jsx: true,
    sfc: true,
    cssModules: true,
    cssInJs: false,
    ssr: true,
    ssg: true,
    hmr: true,
    fastRefresh: true
  }

  /**
   * 检测项目是否使用 Vue 3
   */
  async detect(cwd: string): Promise<FrameworkDetectionResult> {
    const evidence: FrameworkDetectionResult['evidence'] = {
      dependencies: [],
      files: [],
      configFiles: []
    }

    let confidence = 0

    // 检查 package.json 中的 vue 依赖
    const vueVersion = await this.getDependencyVersion(cwd, 'vue')
    if (vueVersion) {
      evidence.dependencies!.push('vue')
      
      // 解析版本号
      const version = this.parseVersion(vueVersion)
      if (version.major === 3) {
        confidence += 0.6
      }
    }

    // 检查 @vitejs/plugin-vue 依赖
    if (await this.hasDependency(cwd, '@vitejs/plugin-vue')) {
      evidence.dependencies!.push('@vitejs/plugin-vue')
      confidence += 0.2
    }

    // 检查 .vue 文件
    const vueFiles = await this.findFiles(cwd, [
      'src/App.vue',
      'src/main.ts',
      'src/main.js'
    ])
    if (vueFiles.length > 0) {
      evidence.files = vueFiles
      confidence += 0.2
    }

    // 检查配置文件
    const configFiles = await this.findFiles(cwd, [
      'vite.config.ts',
      'vite.config.js',
      'vue.config.js'
    ])
    if (configFiles.length > 0) {
      evidence.configFiles = configFiles
      confidence += 0.1
    }

    const detected = confidence >= 0.5

    return {
      detected,
      type: detected ? 'vue3' : undefined,
      version: vueVersion ? this.parseVersion(vueVersion) : undefined,
      confidence,
      evidence
    }
  }

  /**
   * 获取 Vue 3 所需的插件
   */
  async getPlugins(engine: BuildEngine, options?: FrameworkOptions): Promise<Plugin[]> {
    const plugins: Plugin[] = []

    // 只为 Vite 引擎提供插件
    if (engine.name === 'vite') {
      try {
        // 动态导入 @vitejs/plugin-vue
        const { default: vue } = await import('@vitejs/plugin-vue')
        const plugin = vue(options?.options)
        // 插件可能返回单个插件或插件数组
        if (Array.isArray(plugin)) {
          plugins.push(...plugin)
        } else {
          plugins.push(plugin)
        }

        // 如果启用了 JSX，添加 JSX 插件
        if (options?.jsx) {
          try {
            // @ts-ignore - 可选依赖，可能不存在
            const { default: vueJsx } = await import('@vitejs/plugin-vue-jsx')
            const jsxPlugin = vueJsx()
            if (Array.isArray(jsxPlugin)) {
              plugins.push(...jsxPlugin)
            } else {
              plugins.push(jsxPlugin)
            }
          } catch (error) {
            this.logger.warn('未找到 @vitejs/plugin-vue-jsx，跳过 JSX 支持')
          }
        }
      } catch (error) {
        this.logger.error('加载 Vue 3 插件失败', error)
        throw new Error('请安装 @vitejs/plugin-vue: npm install -D @vitejs/plugin-vue')
      }
    }

    return plugins
  }

  /**
   * 获取 Vue 3 特定配置
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
              vue: ['vue'],
              'vue-router': ['vue-router'],
              'vue-vendor': ['pinia', 'axios']
            }
          }
        }
      },
      resolve: {
        alias: [
          { find: '@', replacement: '/src' },
          { find: '~', replacement: '/src' }
        ],
        extensions: ['.vue', '.js', '.ts', '.jsx', '.tsx', '.json']
      },
      optimizeDeps: {
        include: ['vue', 'vue-router']
      }
    }
  }

  /**
   * 获取 Vue 3 依赖列表
   */
  getDependencies(): FrameworkDependencies {
    return {
      dependencies: ['vue'],
      devDependencies: [
        '@vitejs/plugin-vue',
        '@vue/compiler-sfc',
        'vite'
      ],
      optionalDependencies: [
        '@vitejs/plugin-vue-jsx',
        'vue-router',
        'pinia'
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
      'type-check': 'vue-tsc --noEmit'
    }
  }

  /**
   * 获取环境变量配置
   */
  getEnvConfig(): Record<string, string> {
    return {
      VITE_APP_TITLE: 'Vue 3 App',
      VITE_APP_VERSION: '1.0.0'
    }
  }
}

