import { defineConfig } from '@ldesign/launcher'

/**
 * 生产环境配置
 */
export default defineConfig({
  framework: {
    type: 'react'
  },
  
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom']
        }
      }
    }
  },
  
  define: {
    __DEV__: false,
    __API_URL__: JSON.stringify('https://api.example.com')
  }
})

