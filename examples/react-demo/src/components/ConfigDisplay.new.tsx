/**
 * 配置信息展示组件 - 使用新的 useAppConfig Hook
 * 
 * 🎉 新版本特点：
 * - ✅ 无需手动监听 HMR 事件
 * - ✅ 自动订阅配置变化
 * - ✅ 组件卸载时自动清理
 * - ✅ 代码更简洁（从 48 行减少到 8 行）
 */
import { useState } from 'react'
import { useAppConfig } from '@ldesign/launcher/client/react'
import './ConfigDisplay.css'

export function ConfigDisplay() {
  // 🎉 使用新的 useAppConfig Hook - 自动处理 HMR！
  const { config, environment } = useAppConfig()
  const [isExpanded, setIsExpanded] = useState(true)

  const getEnvironmentColor = (mode: string) => {
    const colors: Record<string, string> = {
      development: '#10b981',
      production: '#ef4444',
      test: '#f59e0b',
      staging: '#8b5cf6',
      preview: '#06b6d4'
    }
    return colors[mode] || '#6b7280'
  }

  return (
    <div className="config-display">
      <div 
        className="config-header" 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer' }}
      >
        <h3>
          <span className="config-icon">{isExpanded ? '📂' : '📁'}</span>
          应用配置
        </h3>
        <span 
          className="config-env-badge"
          style={{ backgroundColor: getEnvironmentColor(environment.mode) }}
        >
          {environment.mode}
        </span>
      </div>

      {isExpanded && (
        <div className="config-body">
          {/* 应用信息 */}
          <div className="config-section">
            <h4>
              <span className="section-icon">📱</span>
              应用信息
            </h4>
            <div className="config-items">
              <div className="config-item">
                <span className="config-label">名称</span>
                <span className="config-value">{config.app.name}</span>
              </div>
              <div className="config-item">
                <span className="config-label">版本</span>
                <span className="config-value">{config.app.version}</span>
              </div>
              <div className="config-item">
                <span className="config-label">描述</span>
                <span className="config-value">{config.app.description}</span>
              </div>
            </div>
          </div>

          {/* API 配置 */}
          <div className="config-section">
            <h4>
              <span className="section-icon">🌐</span>
              API 配置
            </h4>
            <div className="config-items">
              <div className="config-item">
                <span className="config-label">Base URL</span>
                <span className="config-value">{config.api.baseUrl}</span>
              </div>
              <div className="config-item">
                <span className="config-label">超时时间</span>
                <span className="config-value">{config.api.timeout}ms</span>
              </div>
            </div>
          </div>

          {/* 功能开关 */}
          <div className="config-section">
            <h4>
              <span className="section-icon">🎛️</span>
              功能开关
            </h4>
            <div className="config-items">
              <div className="config-item">
                <span className="config-label">数据分析</span>
                <span className="config-value">
                  {config.features.enableAnalytics ? '✅ 开启' : '❌ 关闭'}
                </span>
              </div>
              <div className="config-item">
                <span className="config-label">调试模式</span>
                <span className="config-value">
                  {config.features.enableDebug ? '✅ 开启' : '❌ 关闭'}
                </span>
              </div>
            </div>
          </div>

          {/* 环境信息 */}
          <div className="config-section">
            <h4>
              <span className="section-icon">🔧</span>
              环境信息
            </h4>
            <div className="config-items">
              <div className="config-item">
                <span className="config-label">模式</span>
                <span className="config-value">{environment.mode}</span>
              </div>
              <div className="config-item">
                <span className="config-label">开发模式</span>
                <span className="config-value">
                  {environment.isDev ? '✅ 是' : '❌ 否'}
                </span>
              </div>
              <div className="config-item">
                <span className="config-label">生产模式</span>
                <span className="config-value">
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

