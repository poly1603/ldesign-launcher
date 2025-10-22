# 实战案例：性能优化完整流程

## 📋 案例背景

**项目**: 中型电商 SPA 应用  
**问题**: 首屏加载慢，构建时间长  
**目标**: LCP < 2.5s, 构建时间 < 30s

---

## 🔍 Step 1: 性能诊断

### 1.1 检查 Core Web Vitals

```bash
launcher monitor vitals --url http://localhost:3000
```

**结果**:
```
❌ 状态: 未通过
  LCP: 4850.25ms ✗  (目标: ≤2500ms)
  FID: 145.80ms ⚠   (目标: ≤100ms)
  CLS: 0.0523 ✓     (目标: ≤0.1)
  
性能评分: 45/100
```

### 1.2 分析构建产物

```bash
launcher monitor build-analyze
```

**结果**:
```
Bundle 大小: 8.5MB  ⚠️  过大
Chunk 数量: 3       ⚠️  太少
依赖数量: 67

⚠️  Bundle 体积过大，建议优化
⚠️  未启用代码分割
```

### 1.3 AI 项目分析

```bash
launcher ai analyze
```

**发现问题**:
- 大型依赖: moment.js (120KB), lodash (70KB)
- 未使用依赖: axios
- 代码复杂度: 平均 12 (较高)

---

## 🎯 Step 2: 应用优化建议

### 2.1 优化大型依赖

**AI 建议 #1**: 优化 moment.js

```bash
launcher ai apply optimize-moment
```

**或手动操作**:

```typescript
// 替换 moment 为 day.js
// package.json
- "moment": "^2.29.4"
+ "dayjs": "^1.11.10"

// 代码中替换
- import moment from 'moment'
+ import dayjs from 'dayjs'

// 节省: ~100KB
```

**AI 建议 #2**: 优化 lodash

```bash
launcher ai apply optimize-lodash
```

**或手动操作**:

```typescript
// 使用 lodash-es 并按需导入
// package.json
- "lodash": "^4.17.21"
+ "lodash-es": "^4.17.21"

// 代码中
- import _ from 'lodash'
+ import { debounce, throttle } from 'lodash-es'

// 节省: ~50KB
```

### 2.2 启用代码分割

**AI 建议 #3**: 启用代码分割

```bash
launcher ai apply enable-code-splitting
```

**或手动配置**:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
          'ui': ['element-plus'],
          'utils': ['dayjs', 'lodash-es']
        }
      }
    }
  }
})
```

### 2.3 图片优化

```typescript
// vite.config.ts
import imagemin from 'vite-plugin-imagemin'

export default defineConfig({
  plugins: [
    imagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.8, 0.9] },
      svgo: { plugins: [{ name: 'removeViewBox', active: false }] },
      webp: { quality: 80 }
    })
  ]
})
```

### 2.4 启用懒加载

```typescript
// router/index.ts
const routes = [
  {
    path: '/products',
    // 懒加载路由组件
    component: () => import('../views/Products.vue')
  },
  {
    path: '/cart',
    component: () => import('../views/Cart.vue')
  }
]
```

---

## ✅ Step 3: 验证优化效果

### 3.1 重新检查 Web Vitals

```bash
launcher monitor vitals --url http://localhost:3000
```

**优化后**:
```
✅ 状态: 通过
  LCP: 1950.25ms ✓  (-2900ms, -60%)
  FID: 55.80ms ✓    (-90ms, -62%)
  CLS: 0.0450 ✓     (略有改善)
  
性能评分: 92/100 (+47分)
```

### 3.2 对比构建产物

```bash
launcher monitor build-analyze --compare ./previous-build.json
```

**优化后**:
```
Bundle 大小: 3.2MB  (-5.3MB, -62%) ✅
Chunk 数量: 8      (+5)            ✅
依赖数量: 62      (-5)            ✅

✅ 所有指标均已改善
```

### 3.3 生成性能报告

```bash
launcher monitor report --period 7d --format html
```

**报告显示**:
- LCP 改善趋势: ↓ 60%
- Bundle 体积: ↓ 62%
- 构建时间: ↓ 45%

---

## 📊 优化成果总结

| 指标 | 优化前 | 优化后 | 改善 |
|------|--------|--------|------|
| LCP | 4850ms | 1950ms | **-60%** ⚡⚡⚡ |
| FID | 145ms | 56ms | **-62%** ⚡⚡⚡ |
| 性能评分 | 45/100 | 92/100 | **+104%** ⚡⚡⚡ |
| Bundle 大小 | 8.5MB | 3.2MB | **-62%** 📦📦📦 |
| 构建时间 | 55s | 30s | **-45%** ⚡⚡ |

---

## 💡 经验总结

### 成功关键

1. **数据驱动**: 先测量，再优化，后验证
2. **AI 辅助**: 自动识别问题，生成建议
3. **逐步优化**: 一次解决一个问题
4. **持续监控**: 定期检查性能指标

### 最佳实践

1. **开发时启用监控**
   ```bash
   launcher monitor start --targets http://localhost:3000
   ```

2. **每次构建后检查**
   ```bash
   launcher monitor build-analyze
   ```

3. **定期生成报告**
   ```bash
   launcher monitor report --period 7d --format html
   ```

4. **让 AI 学习效果**
   ```bash
   launcher ai learn
   ```

---

## 🎯 进阶优化

### 1. 服务端渲染 (SSR)

```typescript
// 考虑使用 Nuxt.js 或 Vue SSR
// 可以进一步提升 LCP 到 < 1.5s
```

### 2. CDN 加速

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['vue', 'vue-router'],
      output: {
        globals: {
          vue: 'Vue',
          'vue-router': 'VueRouter'
        }
      }
    }
  }
})

// index.html
<script src="https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.js"></script>
```

### 3. 预加载关键资源

```html
<link rel="preload" href="/fonts/main.woff2" as="font" crossorigin>
<link rel="prefetch" href="/api/products">
```

---

## 📚 相关资源

- [性能优化指南](../guide/performance.md)
- [构建优化最佳实践](./build-optimization.md)
- [Core Web Vitals 详解](https://web.dev/vitals/)

---

**🎉 通过系统化的性能优化，我们成功将应用性能提升了 2 倍以上！**


