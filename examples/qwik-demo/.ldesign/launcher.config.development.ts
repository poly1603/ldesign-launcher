import { defineConfig } from '@ldesign/launcher'

/**
 * Qwik 开发环境配置
 */
export default defineConfig({
  framework: {
    type: 'qwik'
  },
  
  server: {
    host: '0.0.0.0',
    port: 5173,
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

