# Launcher 2.0 快速开始

## 安装

```bash
npm install @ldesign/launcher@2.0.0
```

## 基础使用

### 1. 最简单的方式（自动检测）

```typescript
import { Launcher, bootstrap } from '@ldesign/launcher'

// 初始化系统
await bootstrap()

// 创建 Launcher 实例
const launcher = new Launcher({
  cwd: process.cwd()
})

// 启动开发服务器
await launcher.startDev()
```

Launcher 会自动：
- 检测你的项目使用的框架（Vue、React、Svelte 等）
- 加载对应的框架插件
- 应用框架特定的配置
- 启动开发服务器

### 2. 明确指定框架

```typescript
import { Launcher, bootstrap } from '@ldesign/launcher'

await bootstrap()

const launcher = new Launcher({
  cwd: process.cwd(),
  config: {
    framework: {
      type: 'vue3',  // 明确指定使用 Vue 3
      options: {
        jsx: true    // 启用 JSX 支持
      }
    },
    server: {
      port: 3000,
      open: true
    }
  }
})

await launcher.startDev()
```

### 3. 生产构建

```typescript
import { Launcher, bootstrap } from '@ldesign/launcher'

await bootstrap()

const launcher = new Launcher({
  cwd: process.cwd(),
  config: {
    build: {
      outDir: 'dist',
      minify: true,
      sourcemap: true
    }
  }
})

// 执行构建
const result = await launcher.build()
console.log('构建完成！')
console.log('输出目录:', result.outDir)
console.log('耗时:', result.duration, 'ms')
```

### 4. 预览构建产物

```typescript
import { Launcher, bootstrap } from '@ldesign/launcher'

await bootstrap()

const launcher = new Launcher({
  cwd: process.cwd(),
  config: {
    preview: {
      port: 4173,
      open: true
    }
  }
})

await launcher.preview()
```

## 支持的框架

| 框架 | 类型标识 | 自动检测 | 状态 |
|------|---------|---------|------|
| Vue 3 | `vue3` | ✅ | ✅ 已实现 |
| React | `react` | ✅ | ✅ 已实现 |
| Angular | `angular` | ✅ | ✅ 已实现 |
| Svelte | `svelte` | ✅ | ✅ 已实现 |
| Solid.js | `solid` | ✅ | ✅ 已实现 |
| Preact | `preact` | 🔲 | 🔲 计划中 |
| Qwik | `qwik` | 🔲 | 🔲 计划中 |
| Lit | `lit` | 🔲 | 🔲 计划中 |

## 支持的构建引擎

| 引擎 | 类型标识 | 状态 |
|------|---------|------|
| Vite | `vite` | ✅ 已实现（默认） |
| Rspack | `rspack` | 🔲 架构已预留 |
| Webpack | `webpack` | 🔲 架构已预留 |
| Turbopack | `turbopack` | 🔲 架构已预留 |

## 配置文件

创建 `launcher.config.ts`：

```typescript
import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: 'vue3',
    options: {
      jsx: true
    }
  },
  
  server: {
    port: 3000,
    host: 'localhost',
    open: true,
    cors: true
  },
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: true,
    sourcemap: true
  },
  
  resolve: {
    alias: [
      { find: '@', replacement: '/src' },
      { find: '~', replacement: '/src' }
    ]
  }
})
```

然后在代码中使用：

```typescript
const launcher = new Launcher({
  cwd: process.cwd()
})

// 配置文件会自动加载
await launcher.startDev()
```

## 事件监听

```typescript
const launcher = new Launcher({ cwd: process.cwd() })

// 监听服务器就绪
launcher.on('server:ready', (data) => {
  console.log('✅ 服务器已启动:', data.url)
})

// 监听构建完成
launcher.on('build:complete', (data) => {
  console.log('✅ 构建完成，耗时:', data.result.duration, 'ms')
})

// 监听状态变化
launcher.on('status:change', (data) => {
  console.log('📊 状态:', data.status)
})

await launcher.startDev()
```

## 手动框架检测

```typescript
import { detectFramework } from '@ldesign/launcher'

const detection = await detectFramework(process.cwd())

console.log('检测到框架:', detection.type)
console.log('版本:', detection.version)
console.log('置信度:', detection.confidence)
console.log('证据:', detection.evidence)
```

## 生命周期管理

```typescript
const launcher = new Launcher({ cwd: process.cwd() })

try {
  // 启动开发服务器
  await launcher.startDev()
  
  // 运行一段时间...
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  // 重启服务器
  await launcher.restartDev()
  
  // 再运行一段时间...
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  // 停止服务器
  await launcher.stopDev()
} finally {
  // 清理资源
  await launcher.dispose()
}
```

## CLI 使用

```bash
# 启动开发服务器
launcher dev

# 指定端口
launcher dev --port 3000

# 自动打开浏览器
launcher dev --open

# 生产构建
launcher build

# 预览构建产物
launcher preview

# 查看帮助
launcher --help
```

## 常见场景

### Vue 3 项目

```typescript
import { Launcher, bootstrap } from '@ldesign/launcher'

await bootstrap()

const launcher = new Launcher({
  config: {
    framework: {
      type: 'vue3',
      options: {
        jsx: true  // 支持 JSX
      }
    },
    server: {
      port: 3000
    }
  }
})

await launcher.startDev()
```

### React 项目

```typescript
import { Launcher, bootstrap } from '@ldesign/launcher'

await bootstrap()

const launcher = new Launcher({
  config: {
    framework: {
      type: 'react'
    },
    server: {
      port: 3000
    },
    esbuild: {
      jsxDev: process.env.NODE_ENV === 'development'
    }
  }
})

await launcher.startDev()
```

### Svelte 项目

```typescript
import { Launcher, bootstrap } from '@ldesign/launcher'

await bootstrap()

const launcher = new Launcher({
  config: {
    framework: {
      type: 'svelte'
    },
    server: {
      port: 5173
    }
  }
})

await launcher.startDev()
```

## 调试

启用调试模式：

```typescript
const launcher = new Launcher({
  cwd: process.cwd()
})

// 或通过环境变量
// NODE_ENV=development launcher dev --debug
```

## 下一步

- 📖 阅读 [架构文档](./ARCHITECTURE.md) 了解设计细节
- 🔄 查看 [迁移指南](./MIGRATION.md) 从 1.x 升级
- 💡 浏览 [使用示例](../examples/basic-usage.ts) 学习更多用法
- 🛠️ 学习如何 [扩展框架支持](./ARCHITECTURE.md#扩展指南)

## 获取帮助

- 📚 [完整文档](./README.md)
- 💬 [GitHub Issues](https://github.com/ldesign/launcher/issues)
- 📧 Email: support@ldesign.com

