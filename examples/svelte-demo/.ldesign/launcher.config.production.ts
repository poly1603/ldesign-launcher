import { defineConfig } from '@ldesign/launcher'

/**
 * Svelte 生产环境配置
 */
export default defineConfig({
  framework: {
    type: 'svelte'
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'svelte-vendor': ['svelte']
        }
      }
    }
  },
  
  define: {
    __DEV__: false,
    __API_URL__: JSON.stringify('https://api.example.com')
  }
})

