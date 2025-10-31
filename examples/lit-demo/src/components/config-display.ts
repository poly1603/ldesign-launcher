/**
 * 配置信息展示组件 - Lit 版本
 */
import { LitElement, html, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import configDisplayStyles from './config-display-styles'

interface AppConfig {
  app: {
    name: string
    version: string
    description: string
  }
  api: {
    baseUrl: string
    timeout: number
  }
  features: {
    enableAnalytics: boolean
    enableDebug: boolean
  }
}

@customElement('config-display')
export class ConfigDisplay extends LitElement {
  static styles = configDisplayStyles

  @state()
  private config: AppConfig | null = null

  @state()
  private isExpanded = true

  @state()
  private environment = 'development'

  connectedCallback() {
    super.connectedCallback()
    
    // 从 import.meta.env 获取配置
    const appConfig = (import.meta.env as any).appConfig
    if (appConfig) {
      this.config = appConfig
    }

    // 获取当前环境
    this.environment = import.meta.env.MODE || 'development'

    // 监听 HMR 事件
    if (import.meta.hot) {
      import.meta.hot.on('app-config-updated', (data: any) => {
        console.log('🔄 配置已更新:', data)
        this.config = data
      })
    }
  }

  private toggleExpanded() {
    this.isExpanded = !this.isExpanded
  }

  render() {
    if (!this.config) {
      return html`
        <div class="config-display">
          <div class="config-header">
            <h3>⚙️ 应用配置</h3>
          </div>
          <div class="config-body">
            <p class="config-empty">未找到配置信息</p>
          </div>
        </div>
      `
    }

    return html`
      <div class="config-display">
        <div class="config-header" @click=${this.toggleExpanded}>
          <h3>
            <span class="config-icon">${this.isExpanded ? '📂' : '📁'}</span>
            应用配置
          </h3>
          <span class="config-env-badge" data-env=${this.environment}>
            ${this.environment}
          </span>
        </div>

        ${this.isExpanded ? html`
          <div class="config-body">
            <!-- 应用信息 -->
            <div class="config-section">
              <h4 class="config-section-title">
                <span class="section-icon">📱</span>
                应用信息
              </h4>
              <div class="config-grid">
                <div class="config-item">
                  <span class="config-label">名称</span>
                  <span class="config-value">${this.config.app.name}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">版本</span>
                  <span class="config-value config-value-version">${this.config.app.version}</span>
                </div>
                <div class="config-item config-item-full">
                  <span class="config-label">描述</span>
                  <span class="config-value">${this.config.app.description}</span>
                </div>
              </div>
            </div>

            <!-- API 配置 -->
            <div class="config-section">
              <h4 class="config-section-title">
                <span class="section-icon">🌐</span>
                API 配置
              </h4>
              <div class="config-grid">
                <div class="config-item config-item-full">
                  <span class="config-label">Base URL</span>
                  <span class="config-value config-value-url">${this.config.api.baseUrl}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">超时时间</span>
                  <span class="config-value">${this.config.api.timeout}ms</span>
                </div>
              </div>
            </div>

            <!-- 功能开关 -->
            <div class="config-section">
              <h4 class="config-section-title">
                <span class="section-icon">🎛️</span>
                功能开关
              </h4>
              <div class="config-grid">
                <div class="config-item">
                  <span class="config-label">数据分析</span>
                  <span class="config-value config-toggle ${this.config.features.enableAnalytics ? 'active' : ''}">
                    ${this.config.features.enableAnalytics ? '✅ 开启' : '❌ 关闭'}
                  </span>
                </div>
                <div class="config-item">
                  <span class="config-label">调试模式</span>
                  <span class="config-value config-toggle ${this.config.features.enableDebug ? 'active' : ''}">
                    ${this.config.features.enableDebug ? '✅ 开启' : '❌ 关闭'}
                  </span>
                </div>
              </div>
            </div>

            <!-- 环境变量 -->
            <div class="config-section">
              <h4 class="config-section-title">
                <span class="section-icon">🔧</span>
                环境信息
              </h4>
              <div class="config-grid">
                <div class="config-item">
                  <span class="config-label">模式</span>
                  <span class="config-value config-value-mode">${import.meta.env.MODE}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">开发模式</span>
                  <span class="config-value config-toggle ${import.meta.env.DEV ? 'active' : ''}">
                    ${import.meta.env.DEV ? '✅ 是' : '❌ 否'}
                  </span>
                </div>
                <div class="config-item">
                  <span class="config-label">生产模式</span>
                  <span class="config-value config-toggle ${import.meta.env.PROD ? 'active' : ''}">
                    ${import.meta.env.PROD ? '✅ 是' : '❌ 否'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'config-display': ConfigDisplay
  }
}

