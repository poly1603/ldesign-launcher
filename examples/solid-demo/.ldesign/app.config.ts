/**
 * Solid 应用配置文件
 */
export default {
  app: {
    name: 'Solid Demo',
    version: '1.0.0',
    description: 'Solid Demo with @ldesign/launcher'
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

