# 性能优化指南

本指南介绍如何使用 `@ldesign/launcher` 优化项目性能。

---

## 🎯 性能目标

### 开发环境
- ✅ 冷启动 < 2秒
- ✅ 热更新 < 200ms
- ✅ 内存占用 < 500MB

### 生产构建
- ✅ 构建时间 < 30秒
- ✅ 包体积 < 500KB (gzip)
- ✅ 首屏加载 < 3秒

---

## ⚡ 开发环境优化

### 1. 依赖预构建

```typescript
export default defineConfig({
  optimizeDeps: {
    // 预构建大型依赖
    include: [
      'vue',
      'vue-router',
      'pinia',
      'element-plus'
    ],
    
    // 排除不需要预构建的
    exclude: ['@vueuse/core']
  }
})
```

### 2. 文件监听优化

```typescript
export default defineConfig({
  server: {
    watch: {
      // 关闭轮询（使用原生文件监听）
      usePolling: false,
      
      // 忽略大型目录
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/coverage/**'
      ]
    }
  }
})
```

### 3. 启动性能优化

```bash
# 使用 launcher 的性能优化
launcher dev --optimize

# 或在配置中启用
```

```typescript
import { createPerformanceOptimizer } from '@ldesign/launcher'

export default defineConfig({
  plugins: [
    createPerformanceOptimizer({
      enableCaching: true,
      enablePreloading: true
    }).createVitePlugin()
  ]
})
```

---

## 🏗️ 构建优化

### 1. 代码分割

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // 手动代码分割
        manualChunks: {
          // 框架核心
          'framework': ['vue', 'vue-router'],
          
          // UI 组件库
          'ui-library': ['element-plus'],
          
          // 工具库
          'utilities': ['lodash-es', 'dayjs', 'axios']
        },
        
        // 动态导入的chunk命名
        chunkFileNames: 'chunks/[name]-[hash].js',
        
        // 入口文件命名
        entryFileNames: 'js/[name]-[hash].js',
        
        // 资源文件命名
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
})
```

### 2. 压缩优化

```typescript
export default defineConfig({
  build: {
    // 使用 esbuild（速度快）
    minify: 'esbuild',
    
    // 目标现代浏览器
    target: 'es2020',
    
    // CSS 压缩
    cssMinify: true,
    
    // Terser 配置（如需更好压缩）
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log']
      },
      format: {
        comments: false
      }
    }
  }
})
```

### 3. 资源优化

```typescript
export default defineConfig({
  build: {
    // 小资源内联
    assetsInlineLimit: 4096,  // 4KB
    
    // 资源目录
    assetsDir: 'assets',
    
    // CSS 代码分割
    cssCodeSplit: true
  }
})
```

---

## 📊 性能监控

### 1. 使用性能监控器

```typescript
import { PerformanceMonitor } from '@ldesign/launcher'

const monitor = new PerformanceMonitor({
  enableMemoryMonitor: true,
  enableCPUMonitor: true,
  sampleInterval: 1000
})

monitor.start()

monitor.on('metrics', (metrics) => {
  console.log('内存使用:', metrics.memory.percentage + '%')
  console.log('CPU使用:', metrics.cpu.usage + '%')
})
```

### 2. 构建分析

```bash
# 分析构建产物
launcher build --analyze

# 生成详细报告
launcher optimize --report
```

### 3. Lighthouse 审计

```bash
# 运行 Lighthouse 审计
launcher monitor lighthouse --url http://localhost:3000
```

---

## 🎨 资源优化

### 1. 图片优化

```bash
# 使用 launcher 图片优化工具
launcher tools image --responsive --formats webp,avif
```

```typescript
// 配置中启用图片优化
export default defineConfig({
  plugins: [
    imageOptimizer({
      formats: ['webp', 'avif'],
      quality: 80,
      responsive: true
    })
  ]
})
```

### 2. 字体优化

```bash
# 转换字体为 WebFont
launcher tools font --source ./fonts --output ./public/fonts --subset
```

### 3. SVG 优化

```bash
# 生成 SVG 组件
launcher tools svg --source ./icons --framework vue --typescript
```

---

## 📈 实际案例

### 案例 1: 大型 Vue 应用优化

**优化前**:
- 启动时间: 5秒
- 构建时间: 2分钟
- 包体积: 2.5MB

**优化措施**:
1. 启用依赖预构建
2. 手动代码分割
3. 使用 esbuild 压缩

**优化后**:
- 启动时间: 1.5秒 (↓ 70%)
- 构建时间: 45秒 (↓ 62%)
- 包体积: 800KB (↓ 68%)

### 案例 2: React 多页应用

**优化前**:
- 首屏加载: 5秒
- 内存占用: 300MB

**优化措施**:
1. 路由懒加载
2. 组件懒加载
3. 图片懒加载

**优化后**:
- 首屏加载: 1.8秒 (↓ 64%)
- 内存占用: 150MB (↓ 50%)

---

## 🔧 性能诊断

### 使用 doctor 命令

```bash
# 诊断项目性能问题
launcher doctor

# 自动修复
launcher doctor --autoFix
```

### 使用 optimize 命令

```bash
# 分析优化机会
launcher optimize --analyze

# 生成优化建议
launcher optimize --suggest
```

---

## 📚 更多资源

- [Vite 性能优化](https://vitejs.dev/guide/performance.html)
- [Web.dev 性能指南](https://web.dev/performance/)
- [Chrome DevTools 性能分析](https://developer.chrome.com/docs/devtools/performance/)

---

**最后更新**: 2025-01-24


