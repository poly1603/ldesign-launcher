import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: 'qwik'
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false
  },
  build: {
    outDir: 'dist'
  }
})

