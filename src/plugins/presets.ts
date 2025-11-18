/**
 * 插件预设配置
 *
 * 提供常用的插件组合预设，快速配置项目
 *
 * @author LDesign Team
 * @since 1.0.0
 */

import type { Plugin } from 'vite'
import { Logger } from '../utils/logger'

const presetLogger = new Logger('PresetManager')

export interface PresetOptions {
  /** 项目根目录 */
  root?: string
  /** 是否启用性能优化 */
  enableOptimization?: boolean
  /** 是否启用开发体验增强 */
  enableDevExperience?: boolean
  /** 自定义配置 */
  custom?: Record<string, any>
}

/**
 * 预设类型
 */
export type PresetType
  = | 'react'
    | 'vue'
    | 'vue2'
    | 'svelte'
    | 'solid'
    | 'preact'
    | 'lit'
    | 'vanilla'
    | 'library'
    | 'electron'
    | 'ssr'
    | 'pwa'
    | 'micro-frontend'

/**
 * React 项目预设
 */
export function reactPreset(_options: PresetOptions = {}): Plugin[] {
  const plugins: Plugin[] = []

  // React 插件
  try {
    const react = require('@vitejs/plugin-react')
    plugins.push(react({
      fastRefresh: true,
      babel: {
        plugins: [
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          ['@babel/plugin-proposal-class-properties', { loose: true }],
        ],
      },
    }))
  }
  catch {
    presetLogger.warn('请安装 @vitejs/plugin-react')
  }

  // 性能优化和开发体验增强由外部工具包提供

  return plugins
}

/**
 * Vue 3 项目预设
 */
export function vuePreset(_options: PresetOptions = {}): Plugin[] {
  const plugins: Plugin[] = []

  // 注意：Vue相关插件需要手动安装
  // npm install @vitejs/plugin-vue @vitejs/plugin-vue-jsx
  presetLogger.warn('Vue预设需要手动安装依赖: npm install @vitejs/plugin-vue @vitejs/plugin-vue-jsx')

  // 自动导入 - 可选依赖
  // 需要手动安装: npm install unplugin-auto-import unplugin-vue-components
  presetLogger.warn('自动导入功能需要手动安装依赖: npm install unplugin-auto-import unplugin-vue-components')

  // 性能优化和开发体验增强由外部工具包提供

  return plugins
}

/**
 * Vue 2 项目预设
 */
export function vue2Preset(_options: PresetOptions = {}): Plugin[] {
  const plugins: Plugin[] = []

  try {
    const vue2 = require('@vitejs/plugin-vue2')
    plugins.push(vue2())
  }
  catch {
    presetLogger.warn('请安装 @vitejs/plugin-vue2')
  }

  // 兼容性处理
  try {
    const legacy = require('@vitejs/plugin-legacy')
    plugins.push(legacy({
      targets: ['defaults', 'not IE 11'],
    }))
  }
  catch {
    // 可选
  }

  return plugins
}

/**
 * Svelte 项目预设
 */
export function sveltePreset(_options: PresetOptions = {}): Plugin[] {
  const plugins: Plugin[] = []

  // Svelte插件需要手动安装
  presetLogger.warn('Svelte预设需要手动安装依赖: npm install @sveltejs/vite-plugin-svelte')

  // 优化由外部工具包提供

  return plugins
}

/**
 * 库开发预设
 */
export function libraryPreset(_options: PresetOptions = {}): Plugin[] {
  const plugins: Plugin[] = []

  // DTS 生成
  try {
    const dts = require('vite-plugin-dts')
    plugins.push(dts({
      insertTypesEntry: true,
      skipDiagnostics: false,
      tsConfigFilePath: './tsconfig.json',
    }))
  }
  catch {
    presetLogger.warn('请安装 vite-plugin-dts')
  }

  // 外部化依赖
  try {
    const { externalizeDeps } = require('vite-plugin-externalize-deps')
    plugins.push(externalizeDeps())
  }
  catch {
    // 可选
  }

  // 性能优化由外部工具包提供

  return plugins
}

/**
 * Electron 项目预设
 */
export function electronPreset(_options: PresetOptions = {}): Plugin[] {
  const plugins: Plugin[] = []

  // Electron插件需要手动安装
  presetLogger.warn('Electron预设需要手动安装依赖: npm install vite-plugin-electron')

  return plugins
}

/**
 * SSR 项目预设
 */
export function ssrPreset(_options: PresetOptions = {}): Plugin[] {
  const plugins: Plugin[] = []

  // SSR 特定优化由外部工具包提供

  return plugins
}

/**
 * PWA 项目预设
 */
export function pwaPreset(_options: PresetOptions = {}): Plugin[] {
  const plugins: Plugin[] = []

  try {
    const { VitePWA } = require('vite-plugin-pwa')
    plugins.push(VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'My App',
        short_name: 'MyApp',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }))
  }
  catch {
    presetLogger.warn('请安装 vite-plugin-pwa')
  }

  return plugins
}

/**
 * 微前端项目预设
 */
export function microFrontendPreset(_options: PresetOptions = {}): Plugin[] {
  const plugins: Plugin[] = []

  // 微前端插件需要手动安装
  presetLogger.warn('微前端预设需要手动安装依赖: npm install @originjs/vite-plugin-federation')

  return plugins
}

/**
 * 预设管理器
 */
export class PresetManager {
  private presets: Map<PresetType, (options?: PresetOptions) => Plugin[]> = new Map()

  constructor() {
    // 注册内置预设
    this.register('react', reactPreset)
    this.register('vue', vuePreset)
    this.register('vue2', vue2Preset)
    this.register('svelte', sveltePreset)
    this.register('library', libraryPreset)
    this.register('electron', electronPreset)
    this.register('ssr', ssrPreset)
    this.register('pwa', pwaPreset)
    this.register('micro-frontend', microFrontendPreset)
  }

  /**
   * 注册预设
   */
  register(name: PresetType, preset: (options?: PresetOptions) => Plugin[]): void {
    this.presets.set(name, preset)
  }

  /**
   * 获取预设
   */
  get(name: PresetType, options?: PresetOptions): Plugin[] {
    const preset = this.presets.get(name)
    if (!preset) {
      throw new Error(`预设 "${name}" 不存在`)
    }
    return preset(options)
  }

  /**
   * 获取所有预设名称
   */
  list(): PresetType[] {
    return Array.from(this.presets.keys())
  }

  /**
   * 组合多个预设
   */
  combine(...configs: Array<{ preset: PresetType, options?: PresetOptions }>): Plugin[] {
    const plugins: Plugin[] = []

    for (const config of configs) {
      plugins.push(...this.get(config.preset, config.options))
    }

    return plugins
  }
}

/**
 * 预设管理器实例
 */
export const presetManager = new PresetManager()

/**
 * 快速创建预设配置
 */
export function definePreset(type: PresetType, options?: PresetOptions): Plugin[] {
  return presetManager.get(type, options)
}
