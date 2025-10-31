<template>
  <div class="config-display">
    <div class="config-header" @click="isExpanded = !isExpanded">
      <h3>
        <span class="config-icon">{{ isExpanded ? '📂' : '📁' }}</span>
        应用配置
      </h3>
      <span class="config-env-badge" :data-env="environment">
        {{ environment }}
      </span>
    </div>

    <div v-if="isExpanded && config" class="config-body">
      <!-- 应用信息 -->
      <div class="config-section">
        <h4 class="config-section-title">
          <span class="section-icon">📱</span>
          应用信息
        </h4>
        <div class="config-grid">
          <div class="config-item">
            <span class="config-label">名称</span>
            <span class="config-value">{{ config.app.name }}</span>
          </div>
          <div class="config-item">
            <span class="config-label">版本</span>
            <span class="config-value config-value-version">{{ config.app.version }}</span>
          </div>
          <div class="config-item config-item-full">
            <span class="config-label">描述</span>
            <span class="config-value">{{ config.app.description }}</span>
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
            <span class="config-value config-value-url">{{ config.api.baseUrl }}</span>
          </div>
          <div class="config-item">
            <span class="config-label">超时时间</span>
            <span class="config-value">{{ config.api.timeout }}ms</span>
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
            <span :class="['config-value', 'config-toggle', config.features.enableAnalytics ? 'active' : '']">
              {{ config.features.enableAnalytics ? '✅ 开启' : '❌ 关闭' }}
            </span>
          </div>
          <div class="config-item">
            <span class="config-label">调试模式</span>
            <span :class="['config-value', 'config-toggle', config.features.enableDebug ? 'active' : '']">
              {{ config.features.enableDebug ? '✅ 开启' : '❌ 关闭' }}
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
            <span class="config-value config-value-mode">{{ mode }}</span>
          </div>
          <div class="config-item">
            <span class="config-label">开发模式</span>
            <span :class="['config-value', 'config-toggle', isDev ? 'active' : '']">
              {{ isDev ? '✅ 是' : '❌ 否' }}
            </span>
          </div>
          <div class="config-item">
            <span class="config-label">生产模式</span>
            <span :class="['config-value', 'config-toggle', isProd ? 'active' : '']">
              {{ isProd ? '✅ 是' : '❌ 否' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="isExpanded && !config" class="config-body">
      <p class="config-empty">未找到配置信息</p>
    </div>
  </div>
</template>

<script>
import './ConfigDisplay.css'

export default {
  name: 'ConfigDisplay',
  data() {
    return {
      config: null,
      isExpanded: true,
      environment: 'development',
      mode: import.meta.env.MODE || 'development',
      isDev: import.meta.env.DEV,
      isProd: import.meta.env.PROD
    }
  },
  mounted() {
    // 从 import.meta.env 获取配置
    const appConfig = import.meta.env.appConfig
    if (appConfig) {
      this.config = appConfig
    }

    // 获取当前环境
    this.environment = import.meta.env.MODE || 'development'

    // 监听 HMR 事件
    if (import.meta.hot) {
      import.meta.hot.on('app-config-updated', (data) => {
        console.log('🔄 配置已更新:', data)
        this.config = data
      })
    }
  }
}
</script>

