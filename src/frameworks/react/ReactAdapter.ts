/**
 * React 框架适配器
 * 
 * 提供 React 项目的自动检测、插件配置和构建支持
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
 * React 适配器实现
 */
export class ReactAdapter extends FrameworkAdapter {
  readonly name = 'react' as const
  readonly version = '18.x'
  readonly description = 'React 框架适配器'
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
   * 检测项目是否使用 React
   */
  async detect(cwd: string): Promise<FrameworkDetectionResult> {
    const evidence: FrameworkDetectionResult['evidence'] = {
      dependencies: [],
      files: [],
      configFiles: []
    }

    let confidence = 0

    // 1. 检查 package.json 中的 react 依赖（最重要的指标）
    const reactVersion = await this.getDependencyVersion(cwd, 'react')
    if (reactVersion) {
      evidence.dependencies!.push('react')
      confidence += 0.4
    }

    // 2. 检查 react-dom 依赖
    if (await this.hasDependency(cwd, 'react-dom')) {
      evidence.dependencies!.push('react-dom')
      confidence += 0.15
    }

    // 3. 检查 @vitejs/plugin-react 或 @vitejs/plugin-react-swc 依赖
    if (await this.hasDependency(cwd, '@vitejs/plugin-react')) {
      evidence.dependencies!.push('@vitejs/plugin-react')
      confidence += 0.15
    } else if (await this.hasDependency(cwd, '@vitejs/plugin-react-swc')) {
      evidence.dependencies!.push('@vitejs/plugin-react-swc')
      confidence += 0.15
    }

    // 4. 检查 React 入口文件
    const reactFiles = await this.findFiles(cwd, [
      'src/App.tsx',
      'src/App.jsx',
      'src/main.tsx',
      'src/main.jsx',
      'src/index.tsx',
      'src/index.jsx'
    ])
    if (reactFiles.length > 0) {
      evidence.files = reactFiles
      confidence += 0.1
    }

    // 5. 检查入口文件中的 React import
    const entryFiles = await this.findEntryFiles(cwd)
    for (const file of entryFiles) {
      const imports = await this.findImportsInFile(cwd, file, ['react', 'react-dom'])
      if (imports.length > 0) {
        confidence += 0.1
        break
      }
    }

    // 6. 检查项目结构（React 典型目录结构）
    const structurePatterns = [
      'src/components',
      'src/hooks',
      'src/contexts',
      'src/pages',
      'public'
    ]
    const structureMatches = await this.checkProjectStructure(cwd, structurePatterns)
    if (structureMatches >= 2) {
      confidence += 0.05
    }

    // 7. 检查配置文件
    const configFiles = await this.findFiles(cwd, [
      'vite.config.ts',
      'vite.config.js',
      'tsconfig.json'
    ])
    if (configFiles.length > 0) {
      evidence.configFiles = configFiles
      confidence += 0.05
    }

    // 8. 检查 tsconfig.json 中的 React 配置
    if (await this.hasFile(cwd, 'tsconfig.json')) {
      const hasReactJsx = await this.fileContainsPattern(
        cwd,
        'tsconfig.json',
        /"jsx":\s*"react(-jsx|-jsxdev)?"/
      )
      if (hasReactJsx) {
        confidence += 0.05
      }
    }

    // 确保置信度不超过 1
    confidence = Math.min(confidence, 1)

    const detected = confidence >= 0.5

    this.logger.debug(
      `React 检测结果: ${detected ? '✓' : '✗'} (置信度: ${(confidence * 100).toFixed(1)}%)`
    )

    return {
      detected,
      type: detected ? 'react' : undefined,
      version: reactVersion ? this.parseVersion(reactVersion) : undefined,
      confidence,
      evidence
    }
  }

  /**
   * 获取 React 所需的插件
   */
  async getPlugins(engine: BuildEngine, options?: FrameworkOptions): Promise<Plugin[]> {
    const plugins: Plugin[] = []

    // 只为 Vite 引擎提供插件
    if (engine.name === 'vite') {
      try {
        // 动态导入 @vitejs/plugin-react
        const { default: react } = await import('@vitejs/plugin-react')
        const plugin = react(options?.options)
        // react() 可能返回单个插件或插件数组
        if (Array.isArray(plugin)) {
          plugins.push(...plugin)
        } else {
          plugins.push(plugin)
        }
      } catch (error) {
        this.logger.error('加载 React 插件失败', error)
        throw new Error('请安装 @vitejs/plugin-react: npm install -D @vitejs/plugin-react')
      }
    }

    return plugins
  }

  /**
   * 获取 React 特定配置
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
              react: ['react', 'react-dom'],
              'react-router': ['react-router-dom'],
              'react-vendor': ['axios', 'dayjs']
            }
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
        include: ['react', 'react-dom', 'react-router-dom']
      },
      esbuild: {
        jsxDev: process.env.NODE_ENV === 'development'
      }
    }
  }

  /**
   * 获取 React 依赖列表
   */
  getDependencies(): FrameworkDependencies {
    return {
      dependencies: ['react', 'react-dom'],
      devDependencies: [
        '@vitejs/plugin-react',
        '@types/react',
        '@types/react-dom',
        'vite'
      ],
      optionalDependencies: [
        'react-router-dom',
        '@tanstack/react-query'
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
      VITE_APP_TITLE: 'React App',
      VITE_APP_VERSION: '1.0.0'
    }
  }
}

