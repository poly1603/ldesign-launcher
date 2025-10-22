# 故障排查指南

## 🔧 常见问题和解决方案

---

## 1. 构建问题

### 1.1 构建失败：内存不足

**错误信息**:
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**解决方案**:

```bash
# 方案 1: 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=8192"  # 8GB

# 方案 2: 启用增量构建（已在 v1.1.0 默认启用）
# tsup.config.ts
export default defineConfig({
  incremental: true
})

# 方案 3: 减少并发构建数
# tsup.config.ts
export default defineConfig({
  concurrency: 2  // 降低并发数
})
```

### 1.2 构建速度慢

**诊断**:
```bash
launcher monitor build-analyze
```

**解决方案**:

```typescript
// 1. 启用并行构建（v1.1.0 已默认启用）
// 2. 启用缓存预热
import { cacheManager } from '@ldesign/launcher'

await cacheManager.warmup([
  {
    key: 'build-config',
    type: 'build',
    loader: async () => loadConfig()
  }
])

// 3. 优化依赖导入
// 使用具名导入而非全量导入
- import _ from 'lodash'
+ import { debounce } from 'lodash-es'
```

### 1.3 Bundle 体积过大

**诊断**:
```bash
launcher monitor build-analyze
```

**解决方案**:

```typescript
// 1. 启用代码分割
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router'],
          ui: ['element-plus']
        }
      }
    }
  }
})

// 2. 使用 AI 分析和优化
launcher ai analyze
launcher ai suggestions
launcher ai apply <suggestion-id>

// 3. 分析 Bundle
import { bundleAnalyzer } from '@ldesign/launcher'
const analysis = await bundleAnalyzer.analyze('dist')
console.log(analysis.suggestions)
```

---

## 2. 性能问题

### 2.1 LCP 过慢 (> 2.5s)

**诊断**:
```bash
launcher monitor vitals --url http://localhost:3000 --threshold
```

**解决方案**:

```html
<!-- 1. 优化图片加载 -->
<img src="hero.jpg" 
     loading="lazy" 
     decoding="async"
     width="800" 
     height="600">

<!-- 2. 使用现代图片格式 -->
<picture>
  <source srcset="hero.avif" type="image/avif">
  <source srcset="hero.webp" type="image/webp">
  <img src="hero.jpg" alt="Hero">
</picture>

<!-- 3. 预加载关键资源 -->
<link rel="preload" href="/fonts/main.woff2" as="font" crossorigin>
<link rel="preload" href="/hero.jpg" as="image">
```

```typescript
// 4. 使用路由懒加载
const routes = [
  {
    path: '/heavy-page',
    component: () => import('./views/HeavyPage.vue')
  }
]
```

### 2.2 FID 过高 (> 100ms)

**解决方案**:

```typescript
// 1. 拆分长任务
function processLargeData(data) {
  // 不好：阻塞主线程
  return data.map(item => heavyComputation(item))
  
  // 好：使用 requestIdleCallback
  return new Promise(resolve => {
    const results = []
    let index = 0
    
    function processChunk() {
      const endTime = Date.now() + 50  // 每次最多处理 50ms
      
      while (index < data.length && Date.now() < endTime) {
        results.push(heavyComputation(data[index]))
        index++
      }
      
      if (index < data.length) {
        requestIdleCallback(processChunk)
      } else {
        resolve(results)
      }
    }
    
    requestIdleCallback(processChunk)
  })
}

// 2. 使用 Web Workers
const worker = new Worker('/worker.js')
worker.postMessage(largeData)
worker.onmessage = (e) => {
  console.log('计算结果:', e.data)
}
```

### 2.3 CLS 过大 (> 0.1)

**解决方案**:

```css
/* 1. 为图片设置尺寸 */
img {
  width: 800px;
  height: 600px;
  /* 或使用 aspect-ratio */
  aspect-ratio: 16 / 9;
}

/* 2. 为广告位预留空间 */
.ad-container {
  min-height: 250px;
}

/* 3. 使用 transform 而非 top/left */
.animated {
  /* 不好 */
  /* top: 100px; */
  
  /* 好 */
  transform: translateY(100px);
}
```

---

## 3. 缓存问题

### 3.1 缓存未命中

**诊断**:
```typescript
import { cacheManager } from '@ldesign/launcher'

const stats = await cacheManager.getStats()
console.log('命中率:', stats.hitRate)
```

**解决方案**:

```typescript
// 1. 启用缓存预热
await cacheManager.warmup([
  {
    key: 'frequently-used-data',
    type: 'build',
    loader: async () => loadData()
  }
])

// 2. 调整 TTL
const customCache = new CacheManager({
  ttl: 24 * 60 * 60 * 1000  // 24小时
})

// 3. 健康检查
const health = await cacheManager.healthCheck()
if (!health.healthy) {
  console.log('建议:', health.recommendations)
}
```

### 3.2 缓存占用过大

**诊断**:
```typescript
const health = await cacheManager.healthCheck()
console.log(health.issues)  // 检查使用率
```

**解决方案**:

```typescript
// 1. 执行智能压缩
const result = await cacheManager.smartCompress()
console.log(`节省空间: ${result.savedBytes}`)

// 2. 清理过期缓存
await cacheManager.cleanup()

// 3. 增加缓存上限
const cache = new CacheManager({
  maxSize: 1000  // 1GB
})
```

---

## 4. 微前端问题

### 4.1 子应用加载失败

**错误信息**:
```
Application 'user-center' died in status LOADING_SOURCE_CODE: Failed to fetch
```

**解决方案**:

```typescript
// 1. 检查子应用是否启动
launcher micro status

// 2. 检查 CORS 配置
// 子应用 vite.config.ts
export default defineConfig({
  server: {
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
})

// 3. 检查入口地址
// 确保子应用的 entry 地址正确
```

### 4.2 样式冲突

**问题**: 子应用样式影响主应用

**解决方案**:

```typescript
// 启用严格样式隔离
start({
  sandbox: {
    strictStyleIsolation: true
  }
})

// 或使用 CSS Modules
// component.module.css
.button {
  /* 样式 */
}
```

### 4.3 路由冲突

**问题**: 主应用和子应用路由冲突

**解决方案**:

```typescript
// 子应用路由使用 basename
const router = createRouter({
  history: createWebHistory(
    window.__POWERED_BY_QIANKUN__ ? '/user' : '/'
  ),
  routes: [...]
})
```

---

## 5. 内存问题

### 5.1 内存泄漏

**诊断**:
```typescript
import { memoryOptimizer } from '@ldesign/launcher'

const leak = await memoryOptimizer.detectMemoryLeak(30000)
if (leak.leaked) {
  console.log('发现内存泄漏!', leak.suggestions)
}
```

**常见原因和解决方案**:

```typescript
// 问题 1: 事件监听器未移除
// ❌ 不好
mounted() {
  window.addEventListener('resize', this.handleResize)
}

// ✅ 好
mounted() {
  window.addEventListener('resize', this.handleResize)
}
unmounted() {
  window.removeEventListener('resize', this.handleResize)
}

// 问题 2: 定时器未清理
// ❌ 不好
mounted() {
  setInterval(() => {
    this.updateData()
  }, 1000)
}

// ✅ 好
data() {
  return { timer: null }
}
mounted() {
  this.timer = setInterval(() => {
    this.updateData()
  }, 1000)
}
unmounted() {
  if (this.timer) {
    clearInterval(this.timer)
  }
}

// 问题 3: 闭包引用大对象
// ✅ 使用 WeakMap
import { memoryOptimizer } from '@ldesign/launcher'

const largeObject = { /* 大量数据 */ }
memoryOptimizer.cacheInWeakMap(component, 'data', largeObject)
```

### 5.2 内存使用过高

**诊断**:
```typescript
memoryOptimizer.startMonitoring(30000)

memoryOptimizer.on('memory-threshold-exceeded', stats => {
  console.warn('内存过高!', stats)
})
```

**解决方案**:

```typescript
// 1. 注册清理函数
const cleanup = memoryOptimizer.registerCleanup(() => {
  // 清理大对象
  largeData = null
  cache.clear()
})

// 2. 执行清理
await memoryOptimizer.cleanup()

// 3. 强制 GC（需要 --expose-gc）
node --expose-gc app.js
memoryOptimizer.forceGC()
```

---

## 6. 配置问题

### 6.1 配置文件不生效

**检查步骤**:

```bash
# 1. 验证配置文件语法
launcher config validate

# 2. 查看实际使用的配置
launcher config list

# 3. 检查配置文件位置
# 优先级：
#   1. .ldesign/launcher.config.ts
#   2. launcher.config.ts
#   3. vite.config.ts
```

### 6.2 环境特定配置不生效

**解决方案**:

```bash
# 确保使用正确的环境参数
launcher dev --environment development
launcher build --environment production

# 检查环境配置文件
# .ldesign/launcher.development.config.ts
# .ldesign/launcher.production.config.ts
```

---

## 7. 依赖问题

### 7.1 依赖冲突

**诊断**:
```bash
launcher ai analyze
```

**查看重复依赖**:
```
发现 2 个重复依赖:
  - @types/node (v20.10.0, v22.10.2)
```

**解决方案**:

```bash
# 使用 pnpm 解决
pnpm dedupe

# 或在 package.json 中指定版本
{
  "overrides": {
    "@types/node": "^22.10.2"
  }
}
```

### 7.2 未使用的依赖

**诊断**:
```bash
launcher ai analyze
```

**解决方案**:

```bash
# 移除未使用的依赖
pnpm remove axios dayjs

# AI 可以自动识别
launcher ai suggestions
# 会显示: "移除未使用依赖: axios, dayjs"
```

---

## 8. 性能监控问题

### 8.1 监控数据不准确

**可能原因**:
- 浏览器缓存
- 网络状况
- 服务器负载

**解决方案**:

```bash
# 1. 清除浏览器缓存后测试
# 2. 多次测量取平均值
launcher monitor start --duration 5  # 监控 5 分钟

# 3. 使用无痕模式测试
# 4. 对比不同时间段的数据
launcher monitor report --period 7d
```

### 8.2 报告生成失败

**检查**:

```bash
# 1. 确保有监控数据
ls performance-data/

# 2. 检查权限
chmod -R 755 performance-data/

# 3. 使用 verbose 模式
launcher monitor report --period 1d --format html --verbose
```

---

## 9. AI 优化问题

### 9.1 建议不合适

**原因**: AI 需要学习

**解决方案**:

```bash
# 1. 应用建议后让 AI 学习
launcher ai apply <suggestion-id>
launcher ai learn

# 2. 多次使用后准确性会提升
# AI 会记录历史数据并调整权重

# 3. 查看历史数据
cat .launcher/ai-history.json
```

### 9.2 自动应用失败

**检查**:

```bash
# 1. 确保有写入权限
chmod -R 755 .

# 2. 检查配置文件是否存在
ls -la vite.config.ts launcher.config.ts

# 3. 手动应用建议
# 查看建议的具体步骤并手动执行
launcher ai suggestions
```

---

## 10. 日志和调试

### 10.1 启用详细日志

```bash
# 开发时使用 debug 级别
launcher dev --debug

# 或在配置中设置
export default defineConfig({
  launcher: {
    logLevel: 'debug'
  }
})
```

### 10.2 查看系统信息

```bash
# 使用 doctor 命令
launcher doctor

# 输出包括:
# - Node.js 版本
# - pnpm 版本
# - 项目配置
# - 依赖健康度
# - 潜在问题
```

---

## 🆘 获取帮助

### 在线资源

- 📖 [完整文档](../guide/index.md)
- 💬 [讨论区](https://github.com/ldesign/launcher/discussions)
- 🐛 [问题反馈](https://github.com/ldesign/launcher/issues)

### 常用命令

```bash
# 查看帮助
launcher --help
launcher <command> --help

# 查看版本
launcher --version

# 健康检查
launcher doctor

# 性能分析
launcher monitor analyze --url http://localhost:3000

# AI 诊断
launcher ai analyze
```

---

## 📋 问题报告模板

如果问题仍未解决，请提供以下信息：

```
### 环境信息
- OS: Windows/Mac/Linux
- Node.js 版本: node --version
- pnpm 版本: pnpm --version
- launcher 版本: launcher --version

### 问题描述
[详细描述问题]

### 重现步骤
1. [步骤1]
2. [步骤2]
3. [步骤3]

### 预期行为
[期望的结果]

### 实际行为
[实际发生的情况]

### 错误日志
[粘贴完整错误信息]

### 相关配置
[粘贴相关配置文件内容]
```

---

**💡 大多数问题都可以通过正确的配置和最佳实践来避免！**


