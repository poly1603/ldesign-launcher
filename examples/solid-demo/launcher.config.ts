import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: 'solid',
    options: {
      // 不使用jsxDEV，使用标准jsx
      dev: false
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
    open: false
  },
  build: {
    outDir: 'dist'
  }
})

