# @ldesign/launcher 最佳实践指南

本指南总结了使用 launcher 的最佳实践和常见模式。

---

## 🎯 项目配置

### 1. 使用 defineConfig 获得类型提示

```typescript
import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  // 自动获得完整的类型提示和智能感知
  server: {
    port: 3000,
    host: 'localhost'
  }
})
```

### 2. 多环境配置分离

```bash
.ldesign/
├── launcher.config.ts              # 基础配置
├── launcher.development.config.ts  # 开发环境
├── launcher.production.config.ts   # 生产环境
└── launcher.test.config.ts         # 测试环境
```

```typescript
// .ldesign/launcher.development.config.ts
export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  launcher: {
    logLevel: 'debug',
    autoRestart: true
  }
})

// .ldesign/launcher.production.config.ts
export default defineConfig({
  build: {
    minify: true,
    sourcemap: false
  },
  launcher: {
    logLevel: 'warn'
  }
})
```

### 3. 使用路径别名

```typescript
export default defineConfig({
  resolve: {
    alias: [
      // 基础别名
      { find: '@', replacement: './src' },
      
      // 模块别名
      { find: '@components', replacement: './src/components' },
      { find: '@utils', replacement: './src/utils' },
      { find: '@assets', replacement: './src/assets' },
      
      // 阶段化别名（只在开发时生效）
      { find: '@mock', replacement: './src/mock', stages: ['dev'] },
      
      // 只在构建时生效
      { find: '@prod', replacement: './src/production', stages: ['build'] }
    ]
  }
})
```

---

## ⚡ 性能优化

### 1. 开发服务器优化

```typescript
export default defineConfig({
  server: {
    // 使用更快的文件监听
    watch: {
      usePolling: false,  // 避免轮询
      ignored: ['**/node_modules/**', '**/.git/**']
    },
    
    // 预构建依赖
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia']
    }
  }
})
```

### 2. 构建性能优化

```typescript
export default defineConfig({
  build: {
    // 使用 esbuild 压缩（比 terser 快）
    minify: 'esbuild',
    
    // 目标现代浏览器
    target: 'es2020',
    
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 第三方库单独打包
            return 'vendor'
          }
        }
      }
    }
  }
})
```

### 3. 缓存优化

```typescript
export default defineConfig({
  launcher: {
    cache: {
      // 启用构建缓存
      enabled: true,
      
      // 缓存目录
      dir: '.launcher-cache',
      
      // 缓存策略
      strategy: 'content-hash'
    }
  }
})
```

---

## 🔌 插件使用

### 1. 按需加载插件

```typescript
import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  plugins: [
    // 生产环境使用 legacy 插件
    process.env.NODE_ENV === 'production' && legacy({
      targets: ['defaults', 'not IE 11']
    })
  ].filter(Boolean)  // 过滤掉 false 值
})
```

### 2. 插件配置

```typescript
import vue from '@vitejs/plugin-vue'
import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  plugins: [
    vue({
      // Vue 插件配置
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('custom-')
        }
      }
    })
  ]
})
```

### 3. 自定义插件

```typescript
import { defineConfig } from '@ldesign/launcher'
import type { Plugin } from 'vite'

function myPlugin(): Plugin {
  return {
    name: 'my-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // 自定义中间件
        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [myPlugin()]
})
```

---

## 🌐 代理配置

### 1. API 代理

```typescript
export default defineConfig({
  server: {
    proxy: {
      // 简单代理
      '/api': 'http://localhost:8080',
      
      // 完整配置
      '/api/v2': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v2/, ''),
        configure: (proxy, options) => {
          // 配置代理行为
        }
      }
    }
  }
})
```

### 2. WebSocket 代理

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true  // 启用 WebSocket 代理
      }
    }
  }
})
```

---

## 🔒 HTTPS 配置

### 1. 自动生成证书

```typescript
export default defineConfig({
  server: {
    // 自动生成本地 HTTPS 证书
    https: true
  }
})
```

### 2. 使用自定义证书

```typescript
import fs from 'fs'

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('./certs/key.pem'),
      cert: fs.readFileSync('./certs/cert.pem')
    }
  }
})
```

---

## 🛠️ 开发体验

### 1. 生命周期钩子

```typescript
export default defineConfig({
  launcher: {
    hooks: {
      beforeStart: async () => {
        console.log('🚀 准备启动...')
        // 执行启动前任务
      },
      
      afterStart: async () => {
        console.log('✅ 服务器已启动')
        // 发送通知、打开浏览器等
      },
      
      beforeBuild: async () => {
        console.log('🏗️  开始构建...')
      },
      
      afterBuild: async () => {
        console.log('✅ 构建完成')
        // 上传到 CDN、发送通知等
      }
    }
  }
})
```

### 2. 自动重启

```typescript
export default defineConfig({
  launcher: {
    // 配置文件修改后自动重启
    autoRestart: true
  }
})
```

### 3. 调试模式

```bash
# 启用详细日志
launcher dev --debug

# 静默模式
launcher dev --silent
```

---

## 📦 构建优化

### 1. 代码分割策略

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 框架代码
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          
          // UI 库
          'ui-vendor': ['element-plus'],
          
          // 工具库
          'utils-vendor': ['lodash-es', 'dayjs', 'axios']
        }
      }
    }
  }
})
```

### 2. 资源内联

```typescript
export default defineConfig({
  build: {
    // 小于 4KB 的资源内联
    assetsInlineLimit: 4096
  }
})
```

### 3. 压缩配置

```typescript
export default defineConfig({
  build: {
    minify: 'esbuild',  // 更快的压缩
    target: 'es2020',   // 现代浏览器
    cssMinify: true,    // 压缩 CSS
    
    // Terser 高级配置（如需要）
    terserOptions: {
      compress: {
        drop_console: true,  // 移除 console
        drop_debugger: true  // 移除 debugger
      }
    }
  }
})
```

---

## 🎨 CSS 处理

### 1. CSS 预处理器

```typescript
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  }
})
```

### 2. PostCSS 配置

```typescript
export default defineConfig({
  css: {
    postcss: {
      plugins: [
        autoprefixer(),
        cssnano()
      ]
    }
  }
})
```

---

## 🔍 调试技巧

### 1. Source Map 配置

```typescript
export default defineConfig({
  build: {
    // 开发: 完整 source map
    sourcemap: process.env.NODE_ENV === 'development' ? true : 'hidden'
  }
})
```

### 2. 错误追踪

```typescript
import { ViteLauncher } from '@ldesign/launcher'

const launcher = new ViteLauncher()

launcher.on('error', (data) => {
  console.error('错误:', data.error)
  console.error('上下文:', data.context)
  
  // 发送到错误追踪服务
  errorTracker.report(data.error)
})
```

---

## 🚀 部署最佳实践

### 1. 环境变量

```typescript
export default defineConfig({
  define: {
    // 注入环境变量到客户端
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
})
```

### 2. 构建产物分析

```bash
# 分析构建产物
launcher build --analyze

# 查看详细报告
launcher optimize --report
```

### 3. CDN 优化

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['vue', 'vue-router'],  // 使用 CDN
      output: {
        globals: {
          vue: 'Vue',
          'vue-router': 'VueRouter'
        }
      }
    }
  }
})
```

---

## ⚠️ 常见陷阱

### 1. 避免循环依赖

```typescript
// ❌ 不推荐
import { utilA } from './utils'
import { utilB } from './utils'  // 可能导致循环依赖

// ✅ 推荐
import { utilA, utilB } from './utils'
```

### 2. 正确使用别名

```typescript
// ❌ 不推荐
import Component from '../../../components/Component.vue'

// ✅ 推荐
import Component from '@/components/Component.vue'
```

### 3. 避免全局污染

```typescript
// ❌ 不推荐
export default defineConfig({
  define: {
    process: { env: {} }  // 污染全局
  }
})

// ✅ 推荐
export default defineConfig({
  define: {
    'import.meta.env.CUSTOM_VAR': JSON.stringify(process.env.CUSTOM_VAR)
  }
})
```

---

## 📊 性能监控

### 1. 启用性能监控

```typescript
import { createPerformanceOptimizer } from '@ldesign/launcher'

const optimizer = createPerformanceOptimizer({
  enableAutoSplitting: true,
  enablePreloading: true,
  enableCompression: true
})

export default defineConfig({
  plugins: [
    optimizer.createVitePlugin()
  ]
})
```

### 2. 监控指标

```bash
# 启动性能监控
launcher monitor start

# 查看实时指标
launcher monitor metrics

# 生成报告
launcher monitor report
```

---

## 🎓 学习资源

### 官方文档
- [快速开始](../guide/getting-started.md)
- [配置参考](../config/README.md)
- [API 文档](../api/README.md)

### 示例项目
- [Vue 3 + TypeScript](../../examples/vue3-typescript/)
- [React + TypeScript](../../examples/react-typescript/)
- [TypeScript 库](../../examples/typescript-library/)

### 社区资源
- [GitHub Issues](https://github.com/ldesign/launcher/issues)
- [讨论区](https://github.com/ldesign/launcher/discussions)

---

**最后更新**: 2025-01-24  
**维护者**: LDesign Team


