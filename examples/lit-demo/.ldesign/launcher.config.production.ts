import { defineConfig } from '@ldesign/launcher'

/**
 * Lit 生产环境配置
 */
export default defineConfig({
  framework: {
    type: 'lit'
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'lit-vendor': ['lit']
        }
      }
    }
  },
  
  define: {
    __DEV__: false,
    __API_URL__: JSON.stringify('https://api.example.com')
  }
})

