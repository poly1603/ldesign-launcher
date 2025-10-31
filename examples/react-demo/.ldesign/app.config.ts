/**
 * 应用配置文件
 * 
 * 此配置会被注入到 import.meta.env.appConfig 中
 * 可以在应用代码中通过 import.meta.env.appConfig 访问
 */
export default {
  app: {
    name: 'React Demo',
    version: '1.0.0',
    description: 'React Demo with @ldesign/launcher'
  },

  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    timeout: 30000
  },

  features: {
    enableAnalytics: false,
    enableDebug: true
  }
}

