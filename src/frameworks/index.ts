/**
 * 框架适配器模块统一导出
 * 
 * @author LDesign Team
 * @since 2.0.0
 */

// 导出基类
export * from './base'

// 导出各框架适配器
export * from './vue'
export * from './react'
export * from './angular'
export * from './svelte'
export * from './solid'
export * from './preact'
export * from './qwik'
export * from './lit'

// 导出框架元数据
import type { FrameworkMetadata } from '../types/framework'

/**
 * Vue 2 框架元数据
 */
export const VUE2_FRAMEWORK_METADATA: FrameworkMetadata = {
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
    fastRefresh: false
  },
  defaultPort: 3000,
  fileExtensions: ['.vue', '.js', '.ts', '.jsx', '.tsx'],
  configFiles: ['vite.config.ts', 'vite.config.js', 'vue.config.js']
}

/**
 * Vue 3 框架元数据
 */
export const VUE3_FRAMEWORK_METADATA: FrameworkMetadata = {
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
    fastRefresh: true
  },
  defaultPort: 3000,
  fileExtensions: ['.vue', '.js', '.ts', '.jsx', '.tsx'],
  configFiles: ['vite.config.ts', 'vite.config.js', 'vue.config.js']
}

/**
 * React 框架元数据
 */
export const REACT_FRAMEWORK_METADATA: FrameworkMetadata = {
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
    fastRefresh: true
  },
  defaultPort: 3000,
  fileExtensions: ['.js', '.ts', '.jsx', '.tsx'],
  configFiles: ['vite.config.ts', 'vite.config.js', 'tsconfig.json']
}

/**
 * Angular 框架元数据
 */
export const ANGULAR_FRAMEWORK_METADATA: FrameworkMetadata = {
  name: 'angular',
  displayName: 'Angular',
  description: 'Angular - 现代 Web 开发平台',
  website: 'https://angular.io',
  documentation: 'https://angular.io/docs',
  dependencies: ['@angular/core', '@analogjs/vite-plugin-angular'],
  supportedEngines: ['vite'],
  features: {
    jsx: false,
    sfc: false,
    cssModules: true,
    ssr: true,
    ssg: true,
    hmr: true
  },
  defaultPort: 4200,
  fileExtensions: ['.ts', '.html', '.css', '.scss'],
  configFiles: ['angular.json', 'vite.config.ts']
}

/**
 * Svelte 框架元数据
 */
export const SVELTE_FRAMEWORK_METADATA: FrameworkMetadata = {
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
    fastRefresh: true
  },
  defaultPort: 5173,
  fileExtensions: ['.svelte', '.js', '.ts'],
  configFiles: ['vite.config.ts', 'svelte.config.js']
}

/**
 * Solid.js 框架元数据
 */
export const SOLID_FRAMEWORK_METADATA: FrameworkMetadata = {
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
    fastRefresh: true
  },
  defaultPort: 3000,
  fileExtensions: ['.tsx', '.jsx', '.ts', '.js'],
  configFiles: ['vite.config.ts', 'vite.config.js']
}

/**
 * Preact 框架元数据
 */
export const PREACT_FRAMEWORK_METADATA: FrameworkMetadata = {
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
    fastRefresh: true
  },
  defaultPort: 3000,
  fileExtensions: ['.tsx', '.jsx', '.ts', '.js'],
  configFiles: ['vite.config.ts', 'vite.config.js', 'preact.config.js']
}

/**
 * Qwik 框架元数据
 */
export const QWIK_FRAMEWORK_METADATA: FrameworkMetadata = {
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
    fastRefresh: true
  },
  defaultPort: 5173,
  fileExtensions: ['.tsx', '.jsx', '.ts', '.js'],
  configFiles: ['vite.config.ts', 'vite.config.js']
}

/**
 * Lit 框架元数据
 */
export const LIT_FRAMEWORK_METADATA: FrameworkMetadata = {
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
    fastRefresh: false
  },
  defaultPort: 3000,
  fileExtensions: ['.ts', '.js'],
  configFiles: ['vite.config.ts', 'vite.config.js', 'web-dev-server.config.js']
}

/**
 * 初始化并注册所有框架
 */
export async function registerAllFrameworks(): Promise<void> {
  const { registerFramework } = await import('../registry/FrameworkRegistry')
  const { vue2AdapterFactory, vue3AdapterFactory } = await import('./vue')
  const { reactAdapterFactory } = await import('./react')
  const { angularAdapterFactory } = await import('./angular')
  const { svelteAdapterFactory } = await import('./svelte')
  const { solidAdapterFactory } = await import('./solid')
  const { preactAdapterFactory } = await import('./preact')
  const { qwikAdapterFactory } = await import('./qwik')
  const { litAdapterFactory } = await import('./lit')

  // 注册所有框架（优先级：数字越大优先级越高）
  registerFramework('vue2', vue2AdapterFactory, VUE2_FRAMEWORK_METADATA, 9)
  registerFramework('vue3', vue3AdapterFactory, VUE3_FRAMEWORK_METADATA, 10)
  registerFramework('react', reactAdapterFactory, REACT_FRAMEWORK_METADATA, 10)
  registerFramework('preact', preactAdapterFactory, PREACT_FRAMEWORK_METADATA, 8)
  registerFramework('angular', angularAdapterFactory, ANGULAR_FRAMEWORK_METADATA, 8)
  registerFramework('svelte', svelteAdapterFactory, SVELTE_FRAMEWORK_METADATA, 8)
  registerFramework('solid', solidAdapterFactory, SOLID_FRAMEWORK_METADATA, 8)
  registerFramework('qwik', qwikAdapterFactory, QWIK_FRAMEWORK_METADATA, 7)
  registerFramework('lit', litAdapterFactory, LIT_FRAMEWORK_METADATA, 7)
}

