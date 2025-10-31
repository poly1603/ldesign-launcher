import { defineConfig } from '@ldesign/launcher'

/**
 * Qwik 生产环境配置
 */
export default defineConfig({
  framework: {
    type: 'qwik'
  },
  
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
    target: 'es2020'
  },
  
  define: {
    __DEV__: false,
    __API_URL__: JSON.stringify('https://api.example.com')
  }
})

