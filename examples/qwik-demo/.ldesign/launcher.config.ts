import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: 'qwik',
    options: {
      // Qwik 插件配置
      client: {
        input: ['src/entry.tsx']
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false
  },
  preview: {
    host: '0.0.0.0',
    port: 4180,
    strictPort: false
  },
  build: {
    outDir: 'dist'
  }
})

