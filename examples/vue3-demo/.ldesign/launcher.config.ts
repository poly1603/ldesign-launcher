import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: 'vue3',
    options: {
      jsx: false
    }
  },
  
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false
  },
  
  preview: {
    host: '0.0.0.0',
    port: 4175,
    strictPort: false
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})

