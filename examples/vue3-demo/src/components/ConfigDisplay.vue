<template>
  <div class="config-display">
    <div class="config-header" @click="isExpanded = !isExpanded">
      <h3>
        <span class="config-icon">{{ isExpanded ? '📂' : '📁' }}</span>
        应用配置
      </h3>
      <span class="config-env-badge" :data-env="environment.mode">
        {{ environment.mode }}
      </span>
    </div>

    <div v-if="isExpanded" class="config-body">
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
            <span class="config-value config-value-mode">{{ environment.mode }}</span>
          </div>
          <div class="config-item">
            <span class="config-label">开发模式</span>
            <span :class="['config-value', 'config-toggle', environment.isDev ? 'active' : '']">
              {{ environment.isDev ? '✅ 是' : '❌ 否' }}
            </span>
          </div>
          <div class="config-item">
            <span class="config-label">生产模式</span>
            <span :class="['config-value', 'config-toggle', environment.isProd ? 'active' : '']">
              {{ environment.isProd ? '✅ 是' : '❌ 否' }}
            </span>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppConfig } from '@ldesign/launcher/client/vue'
import './ConfigDisplay.css'

// 🎉 使用新的 useAppConfig Composable - 自动处理 HMR！
const { config, environment } = useAppConfig()
const isExpanded = ref(true)
</script>
