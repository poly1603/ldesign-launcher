/**
 * 配置信息展示组件 - Solid 版本
 */
import { createSignal, onMount, Show } from 'solid-js'
import './ConfigDisplay.css'

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

export function ConfigDisplay() {
  const [config, setConfig] = createSignal<AppConfig | null>(null)
  const [isExpanded, setIsExpanded] = createSignal(true)
  const [environment, setEnvironment] = createSignal('development')

  onMount(() => {
    // 从 import.meta.env 获取配置
    const appConfig = (import.meta.env as any).appConfig
    if (appConfig) {
      setConfig(appConfig)
    }

    // 获取当前环境
    const mode = import.meta.env.MODE || 'development'
    setEnvironment(mode)

    // 监听 HMR 事件
    if (import.meta.hot) {
      import.meta.hot.on('app-config-updated', (data: any) => {
        console.log('🔄 配置已更新:', data)
        setConfig(data)
      })
    }
  })

  return (
    <div class="config-display">
      <div class="config-header" onClick={() => setIsExpanded(!isExpanded())}>
        <h3>
          <span class="config-icon">{isExpanded() ? '📂' : '📁'}</span>
          应用配置
        </h3>
        <span class="config-env-badge" data-env={environment()}>
          {environment()}
        </span>
      </div>

      <Show when={isExpanded() && config()} fallback={
        <Show when={isExpanded()}>
          <div class="config-body">
            <p class="config-empty">未找到配置信息</p>
          </div>
        </Show>
      }>
        {(cfg) => (
          <div class="config-body">
            {/* 应用信息 */}
            <div class="config-section">
              <h4 class="config-section-title">
                <span class="section-icon">📱</span>
                应用信息
              </h4>
              <div class="config-grid">
                <div class="config-item">
                  <span class="config-label">名称</span>
                  <span class="config-value">{cfg().app.name}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">版本</span>
                  <span class="config-value config-value-version">{cfg().app.version}</span>
                </div>
                <div class="config-item config-item-full">
                  <span class="config-label">描述</span>
                  <span class="config-value">{cfg().app.description}</span>
                </div>
              </div>
            </div>

            {/* API 配置 */}
            <div class="config-section">
              <h4 class="config-section-title">
                <span class="section-icon">🌐</span>
                API 配置
              </h4>
              <div class="config-grid">
                <div class="config-item config-item-full">
                  <span class="config-label">Base URL</span>
                  <span class="config-value config-value-url">{cfg().api.baseUrl}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">超时时间</span>
                  <span class="config-value">{cfg().api.timeout}ms</span>
                </div>
              </div>
            </div>

            {/* 功能开关 */}
            <div class="config-section">
              <h4 class="config-section-title">
                <span class="section-icon">🎛️</span>
                功能开关
              </h4>
              <div class="config-grid">
                <div class="config-item">
                  <span class="config-label">数据分析</span>
                  <span class={`config-value config-toggle ${cfg().features.enableAnalytics ? 'active' : ''}`}>
                    {cfg().features.enableAnalytics ? '✅ 开启' : '❌ 关闭'}
                  </span>
                </div>
                <div class="config-item">
                  <span class="config-label">调试模式</span>
                  <span class={`config-value config-toggle ${cfg().features.enableDebug ? 'active' : ''}`}>
                    {cfg().features.enableDebug ? '✅ 开启' : '❌ 关闭'}
                  </span>
                </div>
              </div>
            </div>

            {/* 环境变量 */}
            <div class="config-section">
              <h4 class="config-section-title">
                <span class="section-icon">🔧</span>
                环境信息
              </h4>
              <div class="config-grid">
                <div class="config-item">
                  <span class="config-label">模式</span>
                  <span class="config-value config-value-mode">{import.meta.env.MODE}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">开发模式</span>
                  <span class={`config-value config-toggle ${import.meta.env.DEV ? 'active' : ''}`}>
                    {import.meta.env.DEV ? '✅ 是' : '❌ 否'}
                  </span>
                </div>
                <div class="config-item">
                  <span class="config-label">生产模式</span>
                  <span class={`config-value config-toggle ${import.meta.env.PROD ? 'active' : ''}`}>
                    {import.meta.env.PROD ? '✅ 是' : '❌ 否'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Show>
    </div>
  )
}

