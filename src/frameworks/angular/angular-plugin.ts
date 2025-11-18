/**
 * 简单的 Angular Vite 插件
 * 用于替代 @analogjs/vite-plugin-angular (不兼容 Vite 7)
 *
 * 功能:
 * - 处理 Angular 组件的 TypeScript 编译
 * - 支持 Angular 装饰器
 * - 支持 Zone.js
 */

import type { Plugin } from 'vite'
import { Logger } from '../../utils/logger'

const angularLogger = new Logger('AngularPlugin')

export interface AngularPluginOptions {
  /**
   * tsconfig 文件路径
   */
  tsconfig?: string
}

/**
 * 创建 Angular Vite 插件
 */
export function angularPlugin(_options: AngularPluginOptions = {}): Plugin {
  return {
    name: 'vite-plugin-angular',

    config() {
      return {
        esbuild: {
          // 启用装饰器支持
          tsconfigRaw: {
            compilerOptions: {
              experimentalDecorators: true,
              emitDecoratorMetadata: true,
              useDefineForClassFields: false,
            },
          },
        },
        optimizeDeps: {
          // 排除 zone.js 避免预打包
          exclude: ['zone.js'],
          // 包含 Angular 核心包和路由包
          include: [
            '@angular/core',
            '@angular/common',
            '@angular/platform-browser',
            '@angular/platform-browser-dynamic',
            '@angular/compiler',
            '@ldesign/router-angular',
            '@ldesign/router-core',
          ],
        },
        resolve: {
          extensions: ['.ts', '.js', '.mjs'],
        },
      }
    },

    configResolved(_config) {
      angularLogger.info('[AngularPlugin] Angular 插件已加载')
      angularLogger.info('[AngularPlugin] 装饰器支持已启用')
    },
  }
}
