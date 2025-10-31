/**
 * 配置信息展示组件 - Preact 版本
 */
import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
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
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [environment, setEnvironment] = useState('development')

  useEffect(() => {
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
  }, [])

  if (!config) {
    return (
      <div className="config-display">
        <div className="config-header">
          <h3>⚙️ 应用配置</h3>
        </div>
        <div className="config-body">
          <p className="config-empty">未找到配置信息</p>
        </div>
      </div>
    )
  }

  return (
    <div className="config-display">
      <div className="config-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>
          <span className="config-icon">{isExpanded ? '📂' : '📁'}</span>
          应用配置
        </h3>
        <span className="config-env-badge" data-env={environment}>
          {environment}
        </span>
      </div>

      {isExpanded && (
        <div className="config-body">
          {/* 应用信息 */}
          <div className="config-section">
            <h4 className="config-section-title">
              <span className="section-icon">📱</span>
              应用信息
            </h4>
            <div className="config-grid">
              <div className="config-item">
                <span className="config-label">名称</span>
                <span className="config-value">{config.app.name}</span>
              </div>
              <div className="config-item">
                <span className="config-label">版本</span>
                <span className="config-value config-value-version">{config.app.version}</span>
              </div>
              <div className="config-item config-item-full">
                <span className="config-label">描述</span>
                <span className="config-value">{config.app.description}</span>
              </div>
            </div>
          </div>

          {/* API 配置 */}
          <div className="config-section">
            <h4 className="config-section-title">
              <span className="section-icon">🌐</span>
              API 配置
            </h4>
            <div className="config-grid">
              <div className="config-item config-item-full">
                <span className="config-label">Base URL</span>
                <span className="config-value config-value-url">{config.api.baseUrl}</span>
              </div>
              <div className="config-item">
                <span className="config-label">超时时间</span>
                <span className="config-value">{config.api.timeout}ms</span>
              </div>
            </div>
          </div>

          {/* 功能开关 */}
          <div className="config-section">
            <h4 className="config-section-title">
              <span className="section-icon">🎛️</span>
              功能开关
            </h4>
            <div className="config-grid">
              <div className="config-item">
                <span className="config-label">数据分析</span>
                <span className={`config-value config-toggle ${config.features.enableAnalytics ? 'active' : ''}`}>
                  {config.features.enableAnalytics ? '✅ 开启' : '❌ 关闭'}
                </span>
              </div>
              <div className="config-item">
                <span className="config-label">调试模式</span>
                <span className={`config-value config-toggle ${config.features.enableDebug ? 'active' : ''}`}>
                  {config.features.enableDebug ? '✅ 开启' : '❌ 关闭'}
                </span>
              </div>
            </div>
          </div>

          {/* 环境变量 */}
          <div className="config-section">
            <h4 className="config-section-title">
              <span className="section-icon">🔧</span>
              环境信息
            </h4>
            <div className="config-grid">
              <div className="config-item">
                <span className="config-label">模式</span>
                <span className="config-value config-value-mode">{import.meta.env.MODE}</span>
              </div>
              <div className="config-item">
                <span className="config-label">开发模式</span>
                <span className={`config-value config-toggle ${import.meta.env.DEV ? 'active' : ''}`}>
                  {import.meta.env.DEV ? '✅ 是' : '❌ 否'}
                </span>
              </div>
              <div className="config-item">
                <span className="config-label">生产模式</span>
                <span className={`config-value config-toggle ${import.meta.env.PROD ? 'active' : ''}`}>
                  {import.meta.env.PROD ? '✅ 是' : '❌ 否'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

