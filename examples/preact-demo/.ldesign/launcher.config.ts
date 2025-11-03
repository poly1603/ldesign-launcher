import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: 'preact'
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false
  },
  preview: {
    host: '0.0.0.0',
    port: 4178,
    strictPort: false
  },
  build: {
    outDir: 'dist'
  }
})

