# @ldesign/launcher API 完整参考

## 📚 目录

1. [核心 API](#核心-api)
2. [缓存管理 API](#缓存管理-api)
3. [性能监控 API](#性能监控-api)
4. [微前端 API](#微前端-api)
5. [AI 优化 API](#ai-优化-api)
6. [工具类 API](#工具类-api)

---

## 1. 核心 API

### ViteLauncher

主启动器类，封装 Vite 的核心功能。

#### 构造函数

```typescript
new ViteLauncher(options: LauncherOptions)
```

**参数**:
- `options.cwd`: 工作目录（默认：`process.cwd()`）
- `options.config`: Vite 配置对象
- `options.environment`: 环境名称

**示例**:
```typescript
import { ViteLauncher } from '@ldesign/launcher'

const launcher = new ViteLauncher({
  cwd: '/path/to/project',
  config: {
    server: { port: 3000 }
  }
})
```

#### 方法

##### `startDev()`

启动开发服务器。

**签名**: `async startDev(): Promise<ViteDevServer>`

**返回**: Vite 开发服务器实例

**示例**:
```typescript
const server = await launcher.startDev()
console.log(`服务器运行在: ${server.config.server.port}`)
```

##### `build()`

执行生产构建。

**签名**: `async build(): Promise<RollupOutput>`

**返回**: Rollup 构建输出

**示例**:
```typescript
const output = await launcher.build()
console.log('构建完成')
```

##### `preview()`

启动预览服务器。

**签名**: `async preview(): Promise<PreviewServer>`

**返回**: 预览服务器实例

**示例**:
```typescript
const server = await launcher.preview()
console.log(`预览服务器: http://localhost:${server.config.preview.port}`)
```

---

## 2. 缓存管理 API

### CacheManager

强大的三级缓存系统。

#### 构造函数

```typescript
new CacheManager(config?: Partial<CacheConfig>, logger?: Logger)
```

**配置选项**:
```typescript
interface CacheConfig {
  enabled: boolean          // 是否启用，默认 true
  cacheDir: string          // 缓存目录，默认 '.cache'
  maxSize: number           // 最大大小(MB)，默认 500
  ttl: number              // 过期时间(ms)，默认 24小时
  types: CacheType[]       // 缓存类型
  compression: boolean      // 是否压缩，默认 true
  autoClean: {
    enabled: boolean
    interval: number        // 清理间隔(小时)
    threshold: number       // 清理阈值(使用率)
  }
}
```

#### 方法

##### `get<T>(key: string, type: CacheType): Promise<T | null>`

获取缓存，支持自动解压缩。

**参数**:
- `key`: 缓存键
- `type`: 缓存类型（'build' | 'deps' | 'modules' | 'transform' | 'assets' | 'temp'）

**示例**:
```typescript
import { cacheManager } from '@ldesign/launcher'

const config = await cacheManager.get('app-config', 'build')
if (config) {
  console.log('使用缓存的配置')
}
```

##### `set(key: string, type: CacheType, data: any, ttl?: number): Promise<void>`

设置缓存。

**示例**:
```typescript
await cacheManager.set('app-config', 'build', { port: 3000 })

// 自定义 TTL
await cacheManager.set('temp-data', 'temp', data, 5 * 60 * 1000) // 5分钟
```

##### `warmup(keys: Array<WarmupKey>): Promise<void>`

缓存预热。

**参数**:
```typescript
interface WarmupKey {
  key: string
  type: CacheType
  loader: () => Promise<any>
}
```

**示例**:
```typescript
await cacheManager.warmup([
  {
    key: 'user-config',
    type: 'build',
    loader: async () => loadUserConfig()
  },
  {
    key: 'api-schema',
    type: 'modules',
    loader: async () => loadApiSchema()
  }
])
```

##### `smartCompress(): Promise<{ compressed: number; savedBytes: number }>`

智能压缩缓存。

**示例**:
```typescript
const result = await cacheManager.smartCompress()
console.log(`压缩了 ${result.compressed} 项`)
console.log(`节省 ${(result.savedBytes / 1024).toFixed(2)}KB`)
```

##### `healthCheck(): Promise<HealthCheckResult>`

健康检查。

**返回**:
```typescript
interface HealthCheckResult {
  healthy: boolean
  issues: string[]
  stats: CacheStats
  recommendations: string[]
}
```

**示例**:
```typescript
const health = await cacheManager.healthCheck()

if (!health.healthy) {
  console.log('问题:', health.issues)
  console.log('建议:', health.recommendations)
  
  if (health.recommendations.includes('清理')) {
    await cacheManager.cleanup()
  }
}
```

---

## 3. 性能监控 API

### MemoryOptimizer

内存优化和监控工具。

#### 方法

##### `getMemoryStats(): MemoryStats`

获取当前内存使用统计。

**返回**:
```typescript
interface MemoryStats {
  heapUsed: number       // 堆内存使用
  heapTotal: number      // 堆内存总量
  external: number       // 外部内存
  rss: number           // RSS 内存
  arrayBuffers: number   // 数组缓冲区
  usagePercent: number   // 使用率
}
```

**示例**:
```typescript
import { memoryOptimizer } from '@ldesign/launcher'

const stats = memoryOptimizer.getMemoryStats()
console.log(`内存使用: ${memoryOptimizer.formatMemorySize(stats.heapUsed)}`)
console.log(`使用率: ${stats.usagePercent.toFixed(1)}%`)
```

##### `registerCleanup(handler: CleanupHandler): () => void`

注册资源清理函数。

**返回**: 取消注册的函数

**示例**:
```typescript
const unregister = memoryOptimizer.registerCleanup(async () => {
  await closeDatabase()
  clearInterval(timer)
})

// 取消注册
unregister()
```

##### `startMonitoring(interval?: number): void`

开始内存监控。

**参数**:
- `interval`: 监控间隔（毫秒），默认 30000

**示例**:
```typescript
// 开始监控（30秒间隔）
memoryOptimizer.startMonitoring(30000)

// 监听超限事件
memoryOptimizer.on('memory-threshold-exceeded', stats => {
  console.warn('内存使用过高!', stats)
  // 执行清理
  memoryOptimizer.cleanup()
})
```

##### `detectMemoryLeak(duration?: number): Promise<LeakDetectionResult>`

检测内存泄漏。

**参数**:
- `duration`: 检测时长（毫秒），默认 30000

**返回**:
```typescript
interface LeakDetectionResult {
  leaked: boolean
  growth: number
  suggestions: string[]
}
```

**示例**:
```typescript
const leak = await memoryOptimizer.detectMemoryLeak(60000) // 检测 60s

if (leak.leaked) {
  console.warn('⚠️  检测到内存泄漏!')
  console.log('增长:', leak.growth, '字节')
  console.log('建议:', leak.suggestions)
}
```

---

## 4. 微前端 API

### MicroCommand

微前端管理命令。

#### CLI 用法

```bash
# 初始化
launcher micro init --type <main|sub> --framework <qiankun|module-federation|micro-app>

# 添加子应用
launcher micro add-app <name> <entry> [options]

# 开发
launcher micro dev [--all]

# 构建
launcher micro build [--all] [--env <env>]

# 部署
launcher micro deploy [--env <env>]

# 状态
launcher micro status
```

#### 配置

```typescript
interface MicroFrontendConfig {
  type: 'main' | 'sub'
  name: string
  port: number
  framework: 'qiankun' | 'module-federation' | 'micro-app'
  subApps?: SubAppConfig[]
  shared?: Record<string, any>
}
```

---

## 5. AI 优化 API

### AIOptimizer

AI 驱动的智能优化器。

#### 方法

##### `analyzeProject(projectPath: string): Promise<ProjectAnalysis>`

分析项目。

**示例**:
```typescript
import { AIOptimizer } from '@ldesign/launcher/ai/optimizer'

const optimizer = new AIOptimizer()
const analysis = await optimizer.analyzeProject('/path/to/project')

console.log('项目类型:', analysis.projectType)
console.log('框架:', analysis.framework)
console.log('文件统计:', analysis.fileStats)
console.log('依赖:', analysis.dependencies)
console.log('代码质量:', analysis.codeQuality)
```

##### `generateSuggestions(analysis?: ProjectAnalysis): Promise<OptimizationSuggestion[]>`

生成优化建议。

**示例**:
```typescript
const suggestions = await optimizer.generateSuggestions(analysis)

suggestions.forEach(s => {
  console.log(`[${s.priority}] ${s.title}`)
  console.log(`  影响: ${s.impact}`)
  console.log(`  预期收益: ${s.expectedBenefit.improvement}`)
})
```

##### `applySuggestion(suggestionId: string): Promise<void>`

自动应用优化建议。

**示例**:
```typescript
// 应用第一个建议
const suggestion = suggestions[0]
await optimizer.applySuggestion(suggestion.id)

console.log(`✅ 已应用: ${suggestion.title}`)
```

##### `learn(suggestions, before, after): Promise<void>`

学习优化效果。

**示例**:
```typescript
const before = await getMetrics()

await optimizer.applySuggestion(suggestionId)

const after = await getMetrics()

await optimizer.learn([suggestion], before, after)
// AI 会记录效果并调整未来建议的权重
```

---

## 6. 工具类 API

### ProcessExecutor

进程执行工具。

##### `execute(command: string, args?: string[], options?: ProcessExecutorOptions): Promise<ProcessResult>`

执行命令。

**示例**:
```typescript
import { processExecutor } from '@ldesign/launcher'

const result = await processExecutor.execute('npm', ['install'], {
  cwd: './project',
  verbose: true
})

if (result.success) {
  console.log('安装成功')
  console.log('输出:', result.stdout)
}
```

##### `executeConcurrent(commands, options?, concurrency?): Promise<ProcessResult[]>`

并发执行。

**示例**:
```typescript
const results = await processExecutor.executeConcurrent([
  { command: 'npm', args: ['test'] },
  { command: 'npm', args: ['lint'] },
  { command: 'npm', args: ['build'] }
], {}, 3) // 并发数 3

console.log(`成功: ${results.filter(r => r.success).length}/${results.length}`)
```

### ConfigValidator

配置验证工具。

##### `validate(config: unknown): ValidationResult`

验证配置。

**示例**:
```typescript
import { validateConfig } from '@ldesign/launcher'

const result = validateConfig(userConfig)

if (!result.success) {
  console.error('配置错误:')
  result.errors.issues.forEach(issue => {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`)
  })
}
```

### BundleAnalyzer

Bundle 分析工具。

##### `analyze(buildDir: string): Promise<BundleAnalysis>`

分析构建产物。

**示例**:
```typescript
import { bundleAnalyzer } from '@ldesign/launcher'

const analysis = await bundleAnalyzer.analyze('dist')

console.log('总大小:', analysis.totalSize)
console.log('大文件:', analysis.largeFiles)
console.log('优化建议:', analysis.suggestions)
```

##### `generateHTMLReport(analysis, outputPath?): Promise<void>`

生成 HTML 报告。

**示例**:
```typescript
await bundleAnalyzer.generateHTMLReport(analysis, 'bundle-report.html')
// 在浏览器中打开 bundle-report.html
```

### SecurityScanner

安全扫描工具。

##### `scan(projectPath?: string): Promise<SecurityScanResult>`

执行安全扫描。

**示例**:
```typescript
import { securityScanner } from '@ldesign/launcher'

const result = await securityScanner.scan()

console.log(`安全评分: ${result.score}/100`)
console.log(`发现问题: ${result.totalIssues}`)

if (!result.passed) {
  console.log('严重问题:')
  result.issues
    .filter(i => i.severity === 'critical')
    .forEach(i => console.log(`  - ${i.title}`))
}
```

##### `generateReport(result, outputPath?): Promise<void>`

生成安全报告。

**示例**:
```typescript
await securityScanner.generateReport(result, 'security-report.html')
```

---

## 📖 使用模式

### 模式 1: 全自动优化

```typescript
import { ViteLauncher, aiOptimizer, cacheManager } from '@ldesign/launcher'

async function optimizedBuild() {
  // 1. 预热缓存
  await cacheManager.warmup(commonKeys)
  
  // 2. AI 分析
  const analysis = await aiOptimizer.analyzeProject()
  const suggestions = await aiOptimizer.generateSuggestions(analysis)
  
  // 3. 应用优化
  for (const suggestion of suggestions) {
    if (suggestion.priority === 'high') {
      await aiOptimizer.applySuggestion(suggestion.id)
    }
  }
  
  // 4. 构建
  const launcher = new ViteLauncher()
  await launcher.build()
  
  // 5. AI 学习
  await aiOptimizer.learn(suggestions, beforeMetrics, afterMetrics)
}
```

### 模式 2: 持续监控

```typescript
import { memoryOptimizer, cacheManager } from '@ldesign/launcher'

async function startWithMonitoring() {
  // 1. 开始内存监控
  memoryOptimizer.startMonitoring(30000)
  
  // 2. 监听告警
  memoryOptimizer.on('memory-threshold-exceeded', async stats => {
    console.warn('内存过高, 执行清理')
    await memoryOptimizer.cleanup()
    await cacheManager.smartCompress()
  })
  
  // 3. 注册清理函数
  memoryOptimizer.registerCleanup(() => {
    // 清理资源
  })
  
  // 4. 启动应用
  await startApp()
}
```

### 模式 3: 微前端开发

```typescript
// 主应用
import { createApp } from 'vue'
import { registerMicroApps, start } from 'qiankun'

const app = createApp(App)

registerMicroApps([
  {
    name: 'user-center',
    entry: process.env.USER_CENTER_URL,
    container: '#subapp',
    activeRule: '/user'
  }
])

start()
app.mount('#app')
```

---

## 🎯 最佳实践

### 1. 错误处理

```typescript
import { ViteLauncher } from '@ldesign/launcher'

try {
  const launcher = new ViteLauncher(options)
  await launcher.build()
} catch (error) {
  if (error instanceof BuildError) {
    console.error('构建失败:', error.message)
  } else {
    console.error('未知错误:', error)
  }
}
```

### 2. 资源清理

```typescript
import { memoryOptimizer } from '@ldesign/launcher'

// 注册清理函数
const cleanup = memoryOptimizer.registerCleanup(async () => {
  await closeConnections()
})

// 在退出时清理
process.on('SIGINT', async () => {
  await memoryOptimizer.cleanup()
  process.exit(0)
})
```

### 3. 性能优化

```typescript
// 使用缓存预热
await cacheManager.warmup(frequentlyUsedKeys)

// 使用 AI 自动优化
const suggestions = await aiOptimizer.generateSuggestions()
for (const s of suggestions) {
  await aiOptimizer.applySuggestion(s.id)
}

// 监控效果
const health = await cacheManager.healthCheck()
```

---

## 📚 类型定义

完整的类型定义请参考:
- [配置类型](./types/config.md)
- [事件类型](./types/events.md)
- [插件类型](./types/plugin.md)

---

## 🔗 相关文档

- [快速开始](../guide/getting-started.md)
- [配置参考](../config/README.md)
- [CLI 参考](../cli/README.md)
- [实战示例](../examples/README.md)

---

**📝 本文档持续更新中，最后更新: 2025-10-21**


