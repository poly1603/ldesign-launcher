# Launcher 2.0 架构文档

## 概述

Launcher 2.0 采用全新的分层架构设计，通过适配器模式和策略模式实现了对多种构建引擎和前端框架的灵活支持。

## 核心设计原则

1. **开闭原则**：对扩展开放，对修改封闭
2. **单一职责**：每个模块只负责一个明确的功能
3. **依赖倒置**：依赖抽象而非具体实现
4. **接口隔离**：提供清晰的接口定义
5. **向后兼容**：保持与 1.x 版本的 API 兼容

## 架构层次

```
┌─────────────────────────────────────────────────────────┐
│                    CLI Layer (命令层)                     │
│              dev / build / preview 命令                   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  Core Layer (核心层)                      │
│                   Launcher (统一入口)                     │
│          - 生命周期管理                                    │
│          - 配置管理                                        │
│          - 事件系统                                        │
└─────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        ↓                                       ↓
┌──────────────────┐                  ┌──────────────────┐
│  Engine Adapter  │                  │ Framework Adapter│
│  (引擎适配层)     │                  │  (框架适配层)     │
│                  │                  │                  │
│  - ViteEngine    │                  │  - Vue3Adapter   │
│  - RspackEngine  │                  │  - ReactAdapter  │
│  - WebpackEngine │                  │  - SvelteAdapter │
│  - TurboEngine   │                  │  - SolidAdapter  │
└──────────────────┘                  │  - AngularAdapter│
                                      └──────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                Registry Layer (注册层)                    │
│         - EngineRegistry (引擎注册表)                     │
│         - FrameworkRegistry (框架注册表)                  │
└─────────────────────────────────────────────────────────┘
```

## 核心模块

### 1. Launcher (核心入口)

**职责：**
- 统一的项目启动器入口
- 管理引擎和框架的生命周期
- 提供 dev/build/preview 等核心功能
- 事件发布和订阅

**关键方法：**
```typescript
class Launcher {
  async initialize(): Promise<void>
  async startDev(config?: LauncherConfig): Promise<any>
  async build(config?: LauncherConfig): Promise<any>
  async preview(config?: LauncherConfig): Promise<any>
  async dispose(): Promise<void>
}
```

### 2. BuildEngine (构建引擎抽象)

**职责：**
- 定义构建引擎的统一接口
- 提供配置转换能力
- 管理开发服务器和构建流程

**关键接口：**
```typescript
interface BuildEngine {
  readonly name: BuildEngineType
  readonly version: string
  
  initialize(): Promise<void>
  dev(config: LauncherConfig): Promise<DevServer>
  build(config: LauncherConfig): Promise<BuildResult>
  preview(config: LauncherConfig): Promise<PreviewServer>
  transformConfig(config: LauncherConfig): any
  dispose(): Promise<void>
}
```

**已实现的引擎：**
- ✅ ViteEngine - Vite 构建引擎
- 🔲 RspackEngine - Rspack 构建引擎（预留）
- 🔲 WebpackEngine - Webpack 构建引擎（预留）
- 🔲 TurboEngine - Turbopack 构建引擎（预留）

### 3. FrameworkAdapter (框架适配器抽象)

**职责：**
- 定义框架适配器的统一接口
- 自动检测项目使用的框架
- 提供框架特定的插件和配置

**关键接口：**
```typescript
interface FrameworkAdapter {
  readonly name: FrameworkType
  readonly version?: string
  readonly features: FrameworkFeatures
  
  detect(cwd: string): Promise<FrameworkDetectionResult>
  getPlugins(engine: BuildEngine, options?: FrameworkOptions): Promise<Plugin[]>
  getConfig(options?: FrameworkOptions): Partial<LauncherConfig>
  getDependencies(): FrameworkDependencies
}
```

**已实现的适配器：**
- ✅ Vue3Adapter - Vue 3 框架适配器
- ✅ ReactAdapter - React 框架适配器
- ✅ AngularAdapter - Angular 框架适配器
- ✅ SvelteAdapter - Svelte 框架适配器
- ✅ SolidAdapter - Solid.js 框架适配器

### 4. Registry (注册表)

**EngineRegistry：**
- 管理所有可用的构建引擎
- 提供引擎创建和检测功能
- 支持优先级排序

**FrameworkRegistry：**
- 管理所有可用的框架适配器
- 提供框架检测和创建功能
- 支持置信度评分

## 目录结构

```
tools/launcher/src/
├── core/                    # 核心层
│   ├── Launcher.ts         # 新架构 Launcher
│   ├── bootstrap.ts        # 系统初始化
│   ├── ViteLauncher.ts     # 旧架构（兼容）
│   └── ConfigManager.ts    # 配置管理
│
├── engines/                 # 引擎适配层
│   ├── base/               # 基类
│   │   ├── BuildEngine.ts  # 引擎抽象基类
│   │   └── index.ts
│   ├── vite/               # Vite 引擎
│   │   ├── ViteEngine.ts
│   │   ├── ViteConfigTransformer.ts
│   │   ├── ViteEngineFactory.ts
│   │   └── index.ts
│   └── index.ts
│
├── frameworks/              # 框架适配层
│   ├── base/               # 基类
│   │   ├── FrameworkAdapter.ts
│   │   ├── FrameworkDetector.ts
│   │   └── index.ts
│   ├── vue/                # Vue 适配器
│   │   ├── Vue3Adapter.ts
│   │   └── index.ts
│   ├── react/              # React 适配器
│   │   ├── ReactAdapter.ts
│   │   └── index.ts
│   ├── angular/            # Angular 适配器
│   ├── svelte/             # Svelte 适配器
│   ├── solid/              # Solid 适配器
│   └── index.ts
│
├── registry/                # 注册层
│   ├── EngineRegistry.ts   # 引擎注册表
│   ├── FrameworkRegistry.ts # 框架注册表
│   └── index.ts
│
├── types/                   # 类型定义
│   ├── engine.ts           # 引擎相关类型
│   ├── framework.ts        # 框架相关类型
│   ├── config.ts           # 配置类型
│   └── index.ts
│
└── cli/                     # CLI 层
    ├── commands/           # 命令实现
    └── index.ts
```

## 扩展指南

### 添加新的构建引擎

1. **创建引擎实现类**

```typescript
// src/engines/rspack/RspackEngine.ts
import { BuildEngine } from '../base/BuildEngine'

export class RspackEngine extends BuildEngine {
  readonly name = 'rspack' as const
  readonly version = '1.0.0'
  
  async dev(config: LauncherConfig): Promise<DevServer> {
    // 实现开发服务器逻辑
  }
  
  async build(config: LauncherConfig): Promise<BuildResult> {
    // 实现构建逻辑
  }
  
  async preview(config: LauncherConfig): Promise<PreviewServer> {
    // 实现预览服务器逻辑
  }
}
```

2. **创建配置转换器**

```typescript
// src/engines/rspack/RspackConfigTransformer.ts
import { ConfigTransformer } from '../../types/engine'

export class RspackConfigTransformer implements ConfigTransformer {
  transform(config: LauncherConfig): RspackConfig {
    // 转换配置
  }
}
```

3. **创建工厂类**

```typescript
// src/engines/rspack/RspackEngineFactory.ts
export class RspackEngineFactory implements BuildEngineFactory {
  async create(options?: BuildEngineOptions): Promise<BuildEngine> {
    const engine = new RspackEngine()
    await engine.initialize()
    return engine
  }
}
```

4. **注册引擎**

```typescript
// src/engines/index.ts
import { registerEngine } from '../registry/EngineRegistry'
import { createRspackEngineFactory } from './rspack'

registerEngine('rspack', createRspackEngineFactory(), {
  name: 'rspack',
  version: '1.0.0',
  description: 'Rspack 构建引擎'
})
```

### 添加新的框架适配器

1. **创建适配器类**

```typescript
// src/frameworks/preact/PreactAdapter.ts
import { FrameworkAdapter } from '../base/FrameworkAdapter'

export class PreactAdapter extends FrameworkAdapter {
  readonly name = 'preact' as const
  readonly version = '10.x'
  readonly features = {
    jsx: true,
    sfc: false,
    // ...
  }
  
  async detect(cwd: string): Promise<FrameworkDetectionResult> {
    // 实现检测逻辑
  }
  
  async getPlugins(engine: BuildEngine): Promise<Plugin[]> {
    // 返回所需插件
  }
  
  getConfig(): Partial<LauncherConfig> {
    // 返回框架配置
  }
  
  getDependencies(): FrameworkDependencies {
    // 返回依赖列表
  }
}
```

2. **创建工厂**

```typescript
// src/frameworks/preact/index.ts
export const preactAdapterFactory: FrameworkAdapterFactory = {
  async create(options?: FrameworkOptions) {
    const adapter = new PreactAdapter()
    await adapter.initialize()
    return adapter
  }
}
```

3. **注册框架**

```typescript
// src/frameworks/index.ts
import { registerFramework } from '../registry/FrameworkRegistry'
import { preactAdapterFactory } from './preact'

registerFramework('preact', preactAdapterFactory, {
  name: 'preact',
  displayName: 'Preact',
  description: 'Preact - 快速的 3kB React 替代方案'
})
```

## 最佳实践

1. **使用 bootstrap 初始化**
   ```typescript
   import { bootstrap, Launcher } from '@ldesign/launcher'
   
   await bootstrap()
   const launcher = new Launcher()
   ```

2. **监听事件**
   ```typescript
   launcher.on('server:ready', (data) => {
     console.log('服务器已就绪:', data.url)
   })
   ```

3. **清理资源**
   ```typescript
   try {
     await launcher.startDev()
   } finally {
     await launcher.dispose()
   }
   ```

4. **错误处理**
   ```typescript
   try {
     await launcher.build()
   } catch (error) {
     console.error('构建失败:', error)
   }
   ```

## 向后兼容

旧版本的 `ViteLauncher` 仍然可用：

```typescript
import { ViteLauncher } from '@ldesign/launcher'

const launcher = new ViteLauncher({ cwd: process.cwd() })
await launcher.startDev()
```

但建议迁移到新的 `Launcher` API 以获得更好的扩展性。

## 性能优化

1. **懒加载**：引擎和框架适配器按需加载
2. **缓存**：配置和检测结果会被缓存
3. **并行处理**：框架检测支持并行执行
4. **资源清理**：自动清理不再使用的资源

## 未来规划

- [ ] 支持更多构建引擎（Rspack、Webpack、Turbopack）
- [ ] 支持更多框架（Preact、Qwik、Lit）
- [ ] 插件市场集成
- [ ] 可视化配置界面
- [ ] 性能监控和分析
- [ ] 云端构建支持

