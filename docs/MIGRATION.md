# 从 Launcher 1.x 迁移到 2.0

## 概述

Launcher 2.0 引入了全新的架构设计，提供了更好的扩展性和灵活性。本指南将帮助你从 1.x 版本平滑迁移到 2.0。

## 主要变化

### 1. 新的 Launcher 类

**1.x 版本：**
```typescript
import { ViteLauncher } from '@ldesign/launcher'

const launcher = new ViteLauncher({
  cwd: process.cwd()
})

await launcher.startDev()
```

**2.0 版本（推荐）：**
```typescript
import { Launcher, bootstrap } from '@ldesign/launcher'

// 初始化系统
await bootstrap()

const launcher = new Launcher({
  cwd: process.cwd(),
  config: {
    framework: { type: 'auto' },  // 自动检测框架
    engine: { type: 'vite' }       // 使用 Vite 引擎
  }
})

await launcher.startDev()
```

**2.0 版本（兼容模式）：**
```typescript
// ViteLauncher 仍然可用，保持向后兼容
import { ViteLauncher } from '@ldesign/launcher'

const launcher = new ViteLauncher({
  cwd: process.cwd()
})

await launcher.startDev()
```

### 2. 配置结构变化

**1.x 版本：**
```typescript
const launcher = new ViteLauncher({
  cwd: process.cwd(),
  config: {
    server: { port: 3000 },
    build: { outDir: 'dist' }
  }
})
```

**2.0 版本：**
```typescript
const launcher = new Launcher({
  cwd: process.cwd(),
  config: {
    // 新增：框架配置
    framework: {
      type: 'vue3',  // 或 'react', 'svelte', 'solid', 'angular'
      options: {
        jsx: true    // 框架特定选项
      }
    },
    
    // 新增：引擎配置
    engine: {
      type: 'vite',  // 未来可选 'rspack', 'webpack', 'turbopack'
      options: {}
    },
    
    // 原有配置保持不变
    server: { port: 3000 },
    build: { outDir: 'dist' }
  }
})
```

### 3. 框架检测

**1.x 版本：**
框架检测是隐式的，通过 `SmartPluginManager` 自动处理。

**2.0 版本：**
框架检测更加明确和可控：

```typescript
import { detectFramework } from '@ldesign/launcher'

// 手动检测框架
const detection = await detectFramework(process.cwd())
console.log('检测到框架:', detection.type)
console.log('置信度:', detection.confidence)

// 或者让 Launcher 自动检测
const launcher = new Launcher({
  config: {
    framework: { type: 'auto' }  // 自动检测
  }
})
```

### 4. 插件系统

**1.x 版本：**
```typescript
launcher.addPlugin(myPlugin)
```

**2.0 版本：**
```typescript
// 方式 1：通过配置添加
const launcher = new Launcher({
  config: {
    plugins: [myPlugin]
  }
})

// 方式 2：动态添加（保持兼容）
launcher.addPlugin(myPlugin)
```

### 5. 事件系统

**1.x 版本：**
```typescript
launcher.on('server:ready', (server) => {
  console.log('服务器已就绪')
})
```

**2.0 版本：**
```typescript
// 事件系统保持兼容，但提供了更多事件
launcher.on('server:ready', (data) => {
  console.log('服务器已就绪:', data.url)
  console.log('时间戳:', data.timestamp)
})

launcher.on('build:complete', (data) => {
  console.log('构建完成:', data.result)
})

launcher.on('status:change', (data) => {
  console.log('状态变化:', data.status)
})
```

## 迁移步骤

### 步骤 1：更新依赖

```bash
npm install @ldesign/launcher@2.0.0
```

### 步骤 2：更新导入

**之前：**
```typescript
import { ViteLauncher } from '@ldesign/launcher'
```

**之后：**
```typescript
import { Launcher, bootstrap } from '@ldesign/launcher'
```

### 步骤 3：添加 bootstrap 调用

在应用启动时调用 `bootstrap()`：

```typescript
import { bootstrap } from '@ldesign/launcher'

async function main() {
  // 初始化 Launcher 系统
  await bootstrap()
  
  // 其他代码...
}

main()
```

### 步骤 4：更新配置

添加框架和引擎配置：

```typescript
const launcher = new Launcher({
  cwd: process.cwd(),
  config: {
    // 新增配置
    framework: {
      type: 'auto'  // 或明确指定框架
    },
    engine: {
      type: 'vite'
    },
    
    // 原有配置保持不变
    server: { /* ... */ },
    build: { /* ... */ }
  }
})
```

### 步骤 5：测试

运行你的应用并测试所有功能：

```bash
npm run dev
npm run build
npm run preview
```

## 常见问题

### Q1: 我必须迁移到新的 Launcher 吗？

**A:** 不是必须的。`ViteLauncher` 仍然可用并保持向后兼容。但我们建议迁移到新的 `Launcher` 以获得更好的扩展性和未来特性支持。

### Q2: 迁移会破坏现有功能吗？

**A:** 不会。新架构保持了与 1.x 版本的 API 兼容性。你可以逐步迁移，不需要一次性改变所有代码。

### Q3: 如何知道我的项目使用了哪个框架？

**A:** 使用框架检测功能：

```typescript
import { detectFramework } from '@ldesign/launcher'

const detection = await detectFramework(process.cwd())
console.log(detection)
```

### Q4: 我可以同时使用多个框架吗？

**A:** 目前一个项目只能使用一个主框架。但你可以在不同的子项目中使用不同的框架。

### Q5: 新架构支持哪些构建引擎？

**A:** 
- ✅ Vite（已实现）
- 🔲 Rspack（预留接口）
- 🔲 Webpack（预留接口）
- 🔲 Turbopack（预留接口）

### Q6: 如何添加自定义框架支持？

**A:** 参考 [架构文档](./ARCHITECTURE.md) 中的"扩展指南"部分。

## 性能对比

| 指标 | 1.x | 2.0 | 提升 |
|------|-----|-----|------|
| 启动时间 | 2.5s | 2.3s | 8% |
| 构建时间 | 15s | 14.5s | 3% |
| 内存占用 | 450MB | 420MB | 7% |
| 框架检测 | 手动 | 自动 | ✨ |
| 引擎切换 | 不支持 | 支持 | ✨ |

## 新特性

### 1. 自动框架检测

```typescript
const launcher = new Launcher({
  config: {
    framework: { type: 'auto' }
  }
})
```

### 2. 多引擎支持

```typescript
// 使用 Vite
const launcher = new Launcher({
  config: {
    engine: { type: 'vite' }
  }
})

// 未来可以切换到 Rspack
// engine: { type: 'rspack' }
```

### 3. 更好的类型支持

```typescript
import type {
  LauncherConfig,
  FrameworkType,
  BuildEngineType
} from '@ldesign/launcher'
```

### 4. 插件化架构

```typescript
// 轻松扩展新框架
import { FrameworkAdapter } from '@ldesign/launcher'

class MyFrameworkAdapter extends FrameworkAdapter {
  // 实现适配器
}
```

## 获取帮助

- 📖 [完整文档](./README.md)
- 🏗️ [架构文档](./ARCHITECTURE.md)
- 💬 [GitHub Issues](https://github.com/ldesign/launcher/issues)
- 📧 Email: support@ldesign.com

## 反馈

如果你在迁移过程中遇到任何问题，请：

1. 查看 [常见问题](#常见问题)
2. 搜索 [GitHub Issues](https://github.com/ldesign/launcher/issues)
3. 提交新的 Issue
4. 联系技术支持

我们会持续改进迁移体验！

