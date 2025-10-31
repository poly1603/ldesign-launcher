import { defineConfig } from '@ldesign/launcher'

/**
 * 开发环境配置
 */
export default defineConfig({
  framework: {
    type: 'vue3'
  },
  
  server: {
    host: '0.0.0.0',
    port: 3007,
    open: true,
    hmr: true
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: false
  },
  
  define: {
    __DEV__: true,
    __API_URL__: JSON.stringify('http://localhost:8080/api')
  }
})

