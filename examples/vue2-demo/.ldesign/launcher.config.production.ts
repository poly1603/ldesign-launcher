import { defineConfig } from '@ldesign/launcher'

/**
 * Vue 2 生产环境配置
 */
export default defineConfig({
  framework: {
    type: 'vue2'
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue']
        }
      }
    }
  },
  
  define: {
    __DEV__: false,
    __API_URL__: JSON.stringify('https://api.example.com')
  }
})

