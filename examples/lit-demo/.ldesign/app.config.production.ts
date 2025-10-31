/**
 * Lit 生产环境应用配置
 */
export default {
  app: {
    name: 'Lit Demo Production',
    version: '1.0.0',
    description: 'Lit Demo with @ldesign/launcher'
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

