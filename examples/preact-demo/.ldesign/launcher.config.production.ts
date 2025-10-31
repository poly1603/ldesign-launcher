import { defineConfig } from '@ldesign/launcher'

/**
 * Preact 生产环境配置
 */
export default defineConfig({
  framework: {
    type: 'preact'
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'preact-vendor': ['preact']
        }
      }
    }
  },
  
  define: {
    __DEV__: false,
    __API_URL__: JSON.stringify('https://api.example.com')
  }
})

