import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: 'svelte'
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false
  },
  preview: {
    host: '0.0.0.0',
    port: 4176,
    strictPort: false
  },
  build: {
    outDir: 'dist'
  }
})

