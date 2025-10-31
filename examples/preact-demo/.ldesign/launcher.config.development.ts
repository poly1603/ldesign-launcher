import { defineConfig } from '@ldesign/launcher'

/**
 * Preact 开发环境配置
 */
export default defineConfig({
  framework: {
    type: 'preact'
  },
  
  server: {
    host: '0.0.0.0',
    port: 3002,
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

