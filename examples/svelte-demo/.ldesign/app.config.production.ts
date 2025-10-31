/**
 * Svelte 生产环境应用配置
 */
export default {
  app: {
    name: 'Svelte Demo',
    version: '1.0.0',
    description: 'Svelte Demo with @ldesign/launcher'
  },
  
  api: {
    baseUrl: 'https://api.example.com',
    timeout: 30000
  },
  
  features: {
    enableAnalytics: true,
    enableDebug: false
  }
}

