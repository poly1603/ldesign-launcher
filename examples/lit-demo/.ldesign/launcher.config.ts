import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: 'lit'
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false
  },
  preview: {
    host: '0.0.0.0',
    port: 4179,
    strictPort: false
  },
  build: {
    outDir: 'dist'
  }
})

