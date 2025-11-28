/**
 * 框架适配器懒加载器
 *
 * 优化启动性能，只在需要时才加载特定的框架适配器
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type { FrameworkAdapter, FrameworkAdapterFactory, FrameworkMetadata } from '../types/framework'

/**
 * 框架适配器加载器配置
 */
interface AdapterLoaderConfig {
  /** 适配器工厂的动态导入 */
  loader: () => Promise<FrameworkAdapterFactory | { default: FrameworkAdapterFactory }>
  /** 框架元数据 */
  metadata: FrameworkMetadata
  /** 优先级 */
  priority: number
}

/**
 * 框架适配器缓存
 */
const adapterCache = new Map<string, FrameworkAdapter>()

/**
 * 框架适配器加载器配置映射
 */
const adapterLoaders = new Map<string, AdapterLoaderConfig>()

/**
 * 注册框架适配器（懒加载版本）
 *
 * @param name - 框架名称
 * @param loader - 适配器加载器函数
 * @param metadata - 框架元数据
 * @param priority - 优先级（默认5）
 *
 * @example
 * ```ts
 * registerLazyFramework(
 *   'react',
 *   () => import('./react').then(m => m.reactAdapterFactory),
 *   REACT_FRAMEWORK_METADATA,
 *   10
 * )
 * ```
 */
export function registerLazyFramework(
  name: string,
  loader: () => Promise<FrameworkAdapterFactory | { default: FrameworkAdapterFactory }>,
  metadata: FrameworkMetadata,
  priority: number = 5,
): void {
  adapterLoaders.set(name, {
    loader,
    metadata,
    priority,
  })
}

/**
 * 加载框架适配器（带缓存）
 *
 * @param name - 框架名称
 * @param options - 适配器选项
 * @returns 框架适配器实例
 * @throws 如果框架未注册或加载失败
 *
 * @example
 * ```ts
 * const adapter = await loadFrameworkAdapter('react', { jsx: true })
 * ```
 */
export async function loadFrameworkAdapter(
  name: string,
  options?: any,
): Promise<FrameworkAdapter> {
  // 检查缓存（如果没有传入自定义选项）
  if (!options && adapterCache.has(name)) {
    return adapterCache.get(name)!
  }

  // 获取加载器配置
  const config = adapterLoaders.get(name)
  if (!config) {
    throw new Error(`框架适配器未注册: ${name}`)
  }

  try {
    // 动态加载适配器工厂
    const module = await config.loader()
    const factory = 'default' in module ? module.default : module

    if (!factory || typeof factory.create !== 'function') {
      throw new Error(`框架适配器工厂无效: ${name}`)
    }

    // 创建适配器实例
    const adapter = await factory.create(options)

    // 缓存适配器（仅在没有自定义选项时）
    if (!options) {
      adapterCache.set(name, adapter)
    }

    return adapter
  }
  catch (error) {
    throw new Error(
      `加载框架适配器失败: ${name}, ${(error as Error).message}`,
    )
  }
}

/**
 * 获取所有已注册的框架名称
 *
 * @returns 框架名称数组
 */
export function getRegisteredFrameworks(): string[] {
  return Array.from(adapterLoaders.keys())
}

/**
 * 获取框架元数据（不加载适配器）
 *
 * @param name - 框架名称
 * @returns 框架元数据，如果未注册返回 undefined
 */
export function getFrameworkMetadata(name: string): FrameworkMetadata | undefined {
  return adapterLoaders.get(name)?.metadata
}

/**
 * 获取所有框架的元数据（按优先级排序）
 *
 * @returns 框架元数据数组
 */
export function getAllFrameworkMetadata(): Array<FrameworkMetadata & { frameworkName: string, priority: number }> {
  return Array.from(adapterLoaders.entries())
    .map(([frameworkName, config]) => ({
      frameworkName,
      ...config.metadata,
      priority: config.priority,
    }))
    .sort((a, b) => b.priority - a.priority)
}

/**
 * 清除适配器缓存
 *
 * @param name - 框架名称，如果不指定则清除所有缓存
 */
export function clearAdapterCache(name?: string): void {
  if (name) {
    adapterCache.delete(name)
  }
  else {
    adapterCache.clear()
  }
}

/**
 * 预加载框架适配器
 *
 * 在空闲时预加载常用框架适配器，提升后续使用性能
 *
 * @param names - 要预加载的框架名称数组
 */
export async function preloadFrameworkAdapters(names: string[]): Promise<void> {
  const promises = names.map(name =>
    loadFrameworkAdapter(name).catch((error) => {
      console.warn(`预加载框架适配器失败: ${name}`, error)
    }),
  )

  await Promise.allSettled(promises)
}

/**
 * 初始化并注册所有框架（懒加载版本）
 *
 * 只注册框架元数据和加载器，不实际加载适配器代码
 */
export function registerAllLazyFrameworks(): void {
  // Vue 2
  registerLazyFramework(
    'vue2',
    () => import('./vue').then(m => m.vue2AdapterFactory),
    {
      name: 'vue2',
      displayName: 'Vue 2',
      description: 'Vue 2 - 渐进式 JavaScript 框架',
      website: 'https://v2.vuejs.org',
      documentation: 'https://v2.vuejs.org/v2/guide/',
      dependencies: ['vue@^2.7.0', '@vitejs/plugin-vue2'],
      supportedEngines: ['vite'],
      features: {
        jsx: true,
        sfc: true,
        cssModules: true,
        ssr: true,
        ssg: true,
        hmr: true,
        fastRefresh: false,
      },
      defaultPort: 3000,
      fileExtensions: ['.vue', '.js', '.ts', '.jsx', '.tsx'],
      configFiles: ['vite.config.ts', 'vite.config.js', 'vue.config.js'],
    },
    9,
  )

  // Vue 3
  registerLazyFramework(
    'vue3',
    () => import('./vue').then(m => m.vue3AdapterFactory),
    {
      name: 'vue3',
      displayName: 'Vue 3',
      description: 'Vue 3 - 渐进式 JavaScript 框架',
      website: 'https://vuejs.org',
      documentation: 'https://vuejs.org/guide/',
      dependencies: ['vue', '@vitejs/plugin-vue'],
      supportedEngines: ['vite'],
      features: {
        jsx: true,
        sfc: true,
        cssModules: true,
        ssr: true,
        ssg: true,
        hmr: true,
        fastRefresh: true,
      },
      defaultPort: 3000,
      fileExtensions: ['.vue', '.js', '.ts', '.jsx', '.tsx'],
      configFiles: ['vite.config.ts', 'vite.config.js', 'vue.config.js'],
    },
    10,
  )

  // React
  registerLazyFramework(
    'react',
    () => import('./react').then(m => m.reactAdapterFactory),
    {
      name: 'react',
      displayName: 'React',
      description: 'React - 用于构建用户界面的 JavaScript 库',
      website: 'https://react.dev',
      documentation: 'https://react.dev/learn',
      dependencies: ['react', 'react-dom', '@vitejs/plugin-react'],
      supportedEngines: ['vite'],
      features: {
        jsx: true,
        sfc: false,
        cssModules: true,
        cssInJs: true,
        ssr: true,
        ssg: true,
        hmr: true,
        fastRefresh: true,
      },
      defaultPort: 3000,
      fileExtensions: ['.js', '.ts', '.jsx', '.tsx'],
      configFiles: ['vite.config.ts', 'vite.config.js', 'tsconfig.json'],
    },
    10,
  )

  // Svelte
  registerLazyFramework(
    'svelte',
    () => import('./svelte').then(m => m.svelteAdapterFactory),
    {
      name: 'svelte',
      displayName: 'Svelte',
      description: 'Svelte - 控制论增强的 Web 应用',
      website: 'https://svelte.dev',
      documentation: 'https://svelte.dev/docs',
      dependencies: ['svelte', '@sveltejs/vite-plugin-svelte'],
      supportedEngines: ['vite'],
      features: {
        jsx: false,
        sfc: true,
        ssr: true,
        ssg: true,
        hmr: true,
        fastRefresh: true,
      },
      defaultPort: 5173,
      fileExtensions: ['.svelte', '.js', '.ts'],
      configFiles: ['vite.config.ts', 'svelte.config.js'],
    },
    8,
  )

  // Solid.js
  registerLazyFramework(
    'solid',
    () => import('./solid').then(m => m.solidAdapterFactory),
    {
      name: 'solid',
      displayName: 'Solid.js',
      description: 'Solid - 简单高效的响应式 UI 库',
      website: 'https://www.solidjs.com',
      documentation: 'https://www.solidjs.com/docs/latest',
      dependencies: ['solid-js', 'vite-plugin-solid'],
      supportedEngines: ['vite'],
      features: {
        jsx: true,
        sfc: false,
        cssModules: true,
        cssInJs: true,
        ssr: true,
        ssg: true,
        hmr: true,
        fastRefresh: true,
      },
      defaultPort: 3000,
      fileExtensions: ['.tsx', '.jsx', '.ts', '.js'],
      configFiles: ['vite.config.ts', 'vite.config.js'],
    },
    8,
  )

  // Preact
  registerLazyFramework(
    'preact',
    () => import('./preact').then(m => m.preactAdapterFactory),
    {
      name: 'preact',
      displayName: 'Preact',
      description: 'Preact - 快速的 3kB React 替代方案',
      website: 'https://preactjs.com',
      documentation: 'https://preactjs.com/guide/v10/getting-started',
      dependencies: ['preact', '@preact/preset-vite'],
      supportedEngines: ['vite'],
      features: {
        jsx: true,
        sfc: false,
        cssModules: true,
        cssInJs: true,
        ssr: true,
        ssg: true,
        hmr: true,
        fastRefresh: true,
      },
      defaultPort: 3000,
      fileExtensions: ['.tsx', '.jsx', '.ts', '.js'],
      configFiles: ['vite.config.ts', 'vite.config.js', 'preact.config.js'],
    },
    8,
  )

  // Qwik
  registerLazyFramework(
    'qwik',
    () => import('./qwik').then(m => m.qwikAdapterFactory),
    {
      name: 'qwik',
      displayName: 'Qwik',
      description: 'Qwik - 可恢复性框架',
      website: 'https://qwik.builder.io',
      documentation: 'https://qwik.builder.io/docs/',
      dependencies: ['@builder.io/qwik', '@builder.io/qwik-city'],
      supportedEngines: ['vite'],
      features: {
        jsx: true,
        sfc: false,
        cssModules: true,
        cssInJs: true,
        ssr: true,
        ssg: true,
        hmr: true,
        fastRefresh: true,
      },
      defaultPort: 5173,
      fileExtensions: ['.tsx', '.jsx', '.ts', '.js'],
      configFiles: ['vite.config.ts', 'vite.config.js'],
    },
    7,
  )

  // Lit
  registerLazyFramework(
    'lit',
    () => import('./lit').then(m => m.litAdapterFactory),
    {
      name: 'lit',
      displayName: 'Lit',
      description: 'Lit - 简单、快速的 Web Components',
      website: 'https://lit.dev',
      documentation: 'https://lit.dev/docs/',
      dependencies: ['lit'],
      supportedEngines: ['vite'],
      features: {
        jsx: false,
        sfc: false,
        cssModules: false,
        cssInJs: true,
        ssr: true,
        ssg: true,
        hmr: true,
        fastRefresh: false,
      },
      defaultPort: 3000,
      fileExtensions: ['.ts', '.js'],
      configFiles: ['vite.config.ts', 'vite.config.js', 'web-dev-server.config.js'],
    },
    7,
  )

  // Marko
  registerLazyFramework(
    'marko',
    () => import('./marko').then(m => m.markoAdapterFactory),
    {
      name: 'marko',
      displayName: 'Marko',
      description: 'Marko - 快速、轻量的 UI 框架',
      website: 'https://markojs.com',
      documentation: 'https://markojs.com/docs/',
      dependencies: ['marko', '@marko/vite'],
      supportedEngines: ['vite'],
      features: {
        jsx: false,
        sfc: true,
        cssModules: true,
        cssInJs: false,
        ssr: true,
        ssg: true,
        hmr: true,
        fastRefresh: true,
      },
      defaultPort: 3000,
      fileExtensions: ['.marko', '.js', '.ts'],
      configFiles: ['vite.config.ts', 'vite.config.js', 'marko.json'],
    },
    7,
  )

  // Angular
  registerLazyFramework(
    'angular',
    () => import('./angular').then(m => m.angularAdapterFactory),
    {
      name: 'angular',
      displayName: 'Angular',
      description: 'Angular - 企业级应用框架（Analog + Vite）',
      website: 'https://angular.dev',
      documentation: 'https://angular.dev/overview',
      dependencies: ['@angular/core', '@analogjs/vite-plugin-angular'],
      supportedEngines: ['vite'],
      features: {
        jsx: false,
        sfc: false,
        cssModules: true,
        cssInJs: false,
        ssr: false,
        ssg: false,
        hmr: true,
        fastRefresh: false,
      },
      defaultPort: 3000,
      fileExtensions: ['.ts', '.js', '.html', '.css'],
      configFiles: ['vite.config.ts', 'tsconfig.json'],
    },
    10,
  )
}
