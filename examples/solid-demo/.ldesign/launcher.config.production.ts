import { defineConfig } from '@ldesign/launcher'

/**
 * Solid 生产环境配置
 */
export default defineConfig({
  framework: {
    type: 'solid'
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'solid-vendor': ['solid-js']
        }
      }
    }
  },
  
  define: {
    __DEV__: false,
    __API_URL__: JSON.stringify('https://api.example.com')
  }
})

