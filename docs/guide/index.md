---
title: 介绍
description: 了解 @ldesign/launcher 的定位、特性与典型用法概览
---

# 介绍

@ldesign/launcher 是一个基于 Vite JavaScript API 的前端项目启动器，提供统一的开发服务器、构建工具和预览服务。

## 什么是 @ldesign/launcher？

@ldesign/launcher 是一个现代化的前端开发工具，它封装了 Vite 的强大功能，为开发者提供了简单易用的 API 和 CLI 工具。无论你是在开发简单的静态网站还是复杂的单页应用，@ldesign/launcher 都能为你提供一致且高效的开发体验。

## 核心特性

### 🚀 基于 Vite

@ldesign/launcher 基于 Vite 构建，继承了 Vite 的所有优势：

- **极速的冷启动** - 利用 ES 模块的原生支持
- **即时热更新** - 快速的 HMR 体验
- **丰富的插件生态** - 支持各种前端框架和工具
- **优化的构建** - 基于 Rollup 的生产构建

### 🛠️ 统一 API

提供一致的编程接口，简化开发工作流程：

```typescript
const launcher = new ViteLauncher()

// 开发
await launcher.startDev()

// 构建
await launcher.build()

// 预览
await launcher.preview()
```

### 🔧 高度可配置

支持灵活的配置管理：

- 多种配置格式：支持 JS、TS、JSON 等
- 配置验证：自动验证配置的正确性
- 配置合并：智能合并多个配置源
- 热重载：配置变更时自动重启

```ts
// launcher.config.ts
import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  server: { port: 3000 },
  build: { outDir: 'dist' }
})
```

## 架构设计

Vite Launcher 采用模块化设计，主要包含以下组件：

### 核心类
- **ViteLauncher**: 主要的启动器类，提供项目创建、开发、构建等核心功能
- **ProjectDetector**: 项目类型检测器，自动识别项目框架和特性
- **ConfigManager**: 配置管理器，处理配置的加载、合并和应用
- **PluginManager**: 插件管理器，管理 Vite 插件的加载和配置
- **ErrorHandler**: 错误处理器，提供统一的错误处理和格式化

### 服务层
- 文件系统操作
- 依赖管理
- 模板生成
- 构建优化

## 使用场景

### 1. 项目脚手架
快速创建各种类型的前端项目，减少重复工作：

```typescript
// 创建 Vue 3 项目
await createProject('./vue-app', 'vue3', { force: true })

// 创建 React 项目
await createProject('./react-app', 'react', { template: 'typescript' })
```

### 2. 开发环境管理
统一管理开发服务器的启动、配置和停止：

```typescript
const server = await startDev('./my-app', {
  port: 3000,
  host: '127.0.0.1',
  open: true
})

// 停止服务器
await stopDev()
```

### 3. 构建流程
标准化构建流程，支持多种输出格式：

```typescript
const result = await buildProject('./my-app', {
  outDir: 'dist',
  minify: true,
  sourcemap: false
})
```

### 4. 工具集成
作为其他工具的核心组件，提供统一的 API：

```typescript
import { ViteLauncher } from '@ldesign/launcher'

class MyTool {
  private launcher = new ViteLauncher()
  
  async createProject(type: string) {
    return this.launcher.create('./project', type)
  }
}
```

## 技术栈

- **TypeScript**: 主要开发语言，提供类型安全
- **Vite**: 底层构建工具，提供快速的开发体验
- **Node.js**: 运行时环境
- **Vitest**: 测试框架
- **tsup**: 打包工具

## 性能指标

- **构建时间**: ~2.5秒 (包含类型生成)
- **包大小**: ~67KB (压缩后)
- **测试覆盖率**: 68.1% (持续改进中)
- **类型覆盖率**: 100%

## 下一步

- [快速开始](./getting-started.md) - 了解如何安装和使用
- [基础用法](./basic-usage.md) - 学习基本的使用方法
- [高级用法](./advanced-usage.md) - 探索高级功能和最佳实践
- [SSR 指南](./ssr.md) - 使用 SSR 提升首屏与 SEO
- [库模式](./library-mode.md) - 构建可复用的组件库或工具库
- [性能优化](./performance.md) - 冷启动/HMR/拆包与体积分析
- [API 参考](../api/vite-launcher.md) - 查看完整的 API 文档
