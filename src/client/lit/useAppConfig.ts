/**
 * Lit Mixin - AppConfigMixin
 * 
 * 使用方式：
 * ```ts
 * import { LitElement, html } from 'lit'
 * import { AppConfigMixin } from '@ldesign/launcher/client/lit'
 * 
 * export class MyElement extends AppConfigMixin(LitElement) {
 *   render() {
 *     return html`<div>${this.appConfig.app.name}</div>`
 *   }
 * }
 * ```
 */

import { ReactiveController, ReactiveControllerHost } from 'lit'
import { appConfigManager, AppConfig } from '../app-config'

/**
 * Reactive Controller for App Config
 */
export class AppConfigController implements ReactiveController {
  private host: ReactiveControllerHost
  private unsubscribe: (() => void) | null = null
  
  config: AppConfig
  environment: {
    mode: string
    isDev: boolean
    isProd: boolean
  }

  constructor(host: ReactiveControllerHost) {
    this.host = host
    this.config = appConfigManager.getConfig()
    this.environment = appConfigManager.getEnvironment()
    host.addController(this)
  }

  hostConnected() {
    // 订阅配置变化
    this.unsubscribe = appConfigManager.subscribe((newConfig) => {
      this.config = newConfig
      this.host.requestUpdate()
    })
  }

  hostDisconnected() {
    // 取消订阅
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }
}

/**
 * Mixin for App Config (类继承方式)
 */
export function AppConfigMixin<T extends new (...args: any[]) => ReactiveControllerHost>(
  Base: T
) {
  return class extends Base {
    public _appConfigController = new AppConfigController(this)

    get appConfig() {
      return this._appConfigController.config
    }

    get appEnvironment() {
      return this._appConfigController.environment
    }
  }
}

// 也提供函数式 API
export { getAppConfig, subscribeConfig } from '../app-config'

