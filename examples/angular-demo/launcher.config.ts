import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: 'angular'
  },
  server: {
    host: '0.0.0.0',
    port: 4200,
    open: false
  },
  build: {
    outDir: 'dist'
  }
})

