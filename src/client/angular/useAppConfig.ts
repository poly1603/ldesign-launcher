/**
 * Angular Service - AppConfigService
 *
 * 使用方式：
 * ```typescript
 * import { Component, inject } from '@angular/core'
 * import { AppConfigService } from '@ldesign/launcher/client/angular'
 *
 * @Component({
 *   selector: 'app-root',
 *   template: `<div>{{ config().app.name }}</div>`
 * })
 * export class AppComponent {
 *   private appConfigService = inject(AppConfigService)
 *   config = this.appConfigService.config
 *   environment = this.appConfigService.environment
 * }
 * ```
 */

import type { OnDestroy, Signal } from '@angular/core'
import type { AppConfig } from '../app-config'
import { Injectable, signal } from '@angular/core'
import { appConfigManager } from '../app-config'

/* eslint-disable no-console */

/**
 * Angular 应用配置服务
 *
 * 提供响应式的应用配置访问，当配置更新时自动触发视图更新。
 * 使用 Angular Signals 实现响应式。
 */
@Injectable({
  providedIn: 'root',
})
export class AppConfigService implements OnDestroy {
  /** 应用配置对象（Signal） */
  readonly config: Signal<AppConfig>

  /** 环境信息（Signal） */
  readonly environment: Signal<{
    /** 当前运行模式 (development/production/test) */
    mode: string
    /** 是否为开发环境 */
    isDev: boolean
    /** 是否为生产环境 */
    isProd: boolean
  }>

  private configSignal = signal<AppConfig>(appConfigManager.getConfig())
  private environmentSignal = signal(appConfigManager.getEnvironment())
  private unsubscribe: (() => void) | null = null

  constructor() {
    this.config = this.configSignal.asReadonly()
    this.environment = this.environmentSignal.asReadonly()

    // 订阅配置变化
    this.unsubscribe = appConfigManager.subscribe((newConfig) => {
      this.configSignal.set(newConfig)
    })

    if (import.meta.env.DEV) {
      console.log('✅ AppConfigService 已初始化，HMR 已启用')
    }
  }

  ngOnDestroy() {
    // 取消订阅
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }

  /**
   * 获取当前配置（非响应式）
   */
  getConfig(): AppConfig {
    return appConfigManager.getConfig()
  }

  /**
   * 获取环境信息（非响应式）
   */
  getEnvironment() {
    return appConfigManager.getEnvironment()
  }
}

// 也提供函数式 API（需要手动管理订阅）
export { getAppConfig, getEnvironment, subscribeConfig } from '../app-config'
