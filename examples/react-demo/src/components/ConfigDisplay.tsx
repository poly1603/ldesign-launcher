/**
 * 配置信息展示组件
 *
 * 使用新的 useAppConfig Hook - 自动处理 HMR
 */
import { useState } from 'react'
import { useAppConfig } from '@ldesign/launcher/client/react'
import './ConfigDisplay.css'

export function ConfigDisplay() {
  // 🎉 使用新的 useAppConfig Hook - 自动处理 HMR！
  const { config, environment } = useAppConfig()
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="config-display">
      <div className="config-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>
          <span className="config-icon">{isExpanded ? '📂' : '📁'}</span>
          应用配置
        </h3>
        <span className="config-env-badge" data-env={environment.mode}>
          {environment.mode}
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
                <span className="config-value config-value-mode">{environment.mode}</span>
              </div>
              <div className="config-item">
                <span className="config-label">开发模式</span>
                <span className={`config-value config-toggle ${environment.isDev ? 'active' : ''}`}>
                  {environment.isDev ? '✅ 是' : '❌ 否'}
                </span>
              </div>
              <div className="config-item">
                <span className="config-label">生产模式</span>
                <span className={`config-value config-toggle ${environment.isProd ? 'active' : ''}`}>
                  {environment.isProd ? '✅ 是' : '❌ 否'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

