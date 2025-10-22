# @ldesign/launcher

[![NPM version](https://img.shields.io/npm/v/@ldesign/launcher.svg)](https://www.npmjs.com/package/@ldesign/launcher)
[![Build Status](https://github.com/ldesign/launcher/workflows/CI/badge.svg)](https://github.com/ldesign/launcher/actions)
[![Coverage Status](https://coveralls.io/repos/github/ldesign/launcher/badge.svg?branch=main)](https://coveralls.io/github/ldesign/launcher?branch=main)
[![License](https://img.shields.io/npm/l/@ldesign/launcher.svg)](https://github.com/ldesign/launcher/blob/main/LICENSE)

基于 Vite JavaScript API 的前端项目启动器，提供统一的开发服务器、构建工具和预览服务。

## ✨ 特性

### 核心功能

- 🚀 **基于 Vite** - 利用 Vite 5.0+ 的强大功能和生态系统
- 🛠️ **统一 API** - 提供一致的开发、构建和预览体验
- 🔧 **高度可配置** - 支持灵活的配置管理和扩展
- 🌍 **多环境配置** - 支持环境特定配置文件和自动合并
- 🔗 **智能代理** - 简化的代理配置语法和常见场景支持
- 🔌 **插件系统** - 支持插件扩展和自定义功能
- 🎯 **TypeScript** - 完整的 TypeScript 支持
- 📱 **CLI 工具** - 提供友好的命令行界面

### 🆕 v1.1.0 新增特性

- 📊 **完整性能监控** - Core Web Vitals 追踪、构建分析、实时监控、HTML 报告
- 🏗️ **微前端架构** - qiankun/Module Federation 支持、完整开发到部署流程
- 🤖 **AI 智能优化** - 自动依赖分析、代码质量评估、机器学习改进建议
- 💾 **三级缓存系统** - 内存+磁盘+压缩，缓存预热、智能压缩
- 🐳 **容器化部署** - Docker 自动配置、Docker Compose 生成
- ⚡ **构建性能提升** - 并行构建、增量构建、构建时间减少 30-50%
- 🗜️ **智能压缩** - gzip 压缩节省 20-50% 空间
- 🔍 **Bundle 分析** - 详细的构建产物分析和优化建议
- ✅ **配置验证** - 基于 Zod 的类型安全配置验证
- 🚀 **进程执行** - 基于 execa 的高级进程管理

## 📦 安装

```bash
# 使用 pnpm (推荐)
pnpm add @ldesign/launcher

# 使用 npm
npm install @ldesign/launcher

# 使用 yarn
yarn add @ldesign/launcher
```

## 🚀 快速开始

### 编程式 API

```typescript
import { ViteLauncher } from '@ldesign/launcher'

// 创建启动器实例
const launcher = new ViteLauncher({
  cwd: process.cwd(),
  config: {
    server: {
      port: 3000,
      host: 'localhost'
    }
  }
})

// 启动开发服务器
await launcher.startDev()

// 执行构建
await launcher.build()

// 启动预览服务器
await launcher.preview()
```

### CLI 工具

```bash
# 启动开发服务器
launcher dev

# 使用环境特定配置
launcher dev --environment development
launcher build --environment production

# 执行生产构建
launcher build

# 预览构建结果
launcher preview

# 查看配置
launcher config list

# 开发工具
launcher tools --help

# 查看帮助
launcher --help
```

## 🛠️ 开发工具

@ldesign/launcher 提供了丰富的开发工具，帮助提升开发效率：

```bash
# 字体转换 - 将字体转换为 WebFont 格式
launcher tools font --source ./fonts --output ./public/fonts --subset --css

# SVG 组件生成 - 根据框架类型生成对应组件
launcher tools svg --source ./icons --framework vue --typescript

# 图片优化 - 支持现代图片格式和响应式图片
launcher tools image --responsive --formats webp,avif

# 国际化管理 - 自动提取翻译键和验证完整性
launcher tools i18n --extract --validate --generate-types

# API 文档生成 - 支持多种文档格式
launcher tools api-docs --format openapi --interactive

# 主题管理 - 支持多主题和暗色模式
launcher tools theme --generate-switcher --dark-mode

# PWA 支持 - 自动生成 PWA 相关文件
launcher tools pwa --generate-sw --offline-page offline.html
```

详细的工具使用说明请参考 [工具文档](./docs/TOOLS.md)。

### 配置文件

创建 `launcher.config.ts` 或 `launcher.config.js`：

```typescript
import { defineConfig } from '@ldesign/launcher'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  
  server: {
    port: 3000,
    host: 'localhost',
    open: true
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: true
  },

  // 路径别名配置（支持阶段配置）
  resolve: {
    alias: [
      // 基本别名（@ -> src, ~ -> 项目根目录）
      { find: '@', replacement: './src' },
      { find: '~', replacement: './' },

      // 只在开发时生效的别名
      { find: '@mock', replacement: './src/mock', stages: ['dev'] },

      // 只在构建时生效的别名
      { find: '@prod', replacement: './src/production', stages: ['build'] },

      // 在所有阶段生效的别名
      { find: '@shared', replacement: './src/shared', stages: ['dev', 'build', 'preview'] }
    ]
  },

  launcher: {
    autoRestart: true,
    hooks: {
      beforeStart: () => {
        console.log('🚀 启动前钩子')
      },
      afterStart: () => {
        console.log('✅ 启动完成')
      }
    }
  }
})
```

## 🌍 多环境配置

支持为不同环境创建专门的配置文件：

```typescript
// .ldesign/launcher.development.config.ts
export default defineConfig({
  server: {
    port: 3011,
    open: true,
    host: '0.0.0.0'
  },
  launcher: {
    logLevel: 'debug'
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

使用环境配置：

```bash
# 使用开发环境配置
launcher dev --environment development

# 使用生产环境配置
launcher build --environment production
```

## 🔗 智能代理配置

提供简化的代理配置语法：

```typescript
export default defineConfig({
  // 简化代理配置
  simpleProxy: {
    // API 代理
    api: {
      target: 'http://localhost:8080',
      pathPrefix: '/api',
      rewrite: true,
      headers: {
        'X-Forwarded-Host': 'localhost'
      }
    },

    // 静态资源代理
    assets: {
      target: 'http://localhost:9000',
      pathPrefix: '/assets',
      cache: {
        maxAge: 3600,
        etag: true
      }
    },

    // WebSocket 代理
    websocket: {
      target: 'ws://localhost:8080',
      pathPrefix: '/ws'
    }
  }
})
```

## 📚 文档

- [多环境配置指南](./docs/guide/environment-config.md)
- [代理配置指南](./docs/guide/proxy-config.md)
- [快速开始](./docs/guide/getting-started.md)
- [配置参考](./docs/config/README.md)
- [API 参考](./docs/api/README.md)
- [CLI 参考](./docs/cli/README.md)
- [插件开发](./docs/plugins/README.md)
- [示例](./docs/examples/README.md)

## 🛠️ 支持的框架

@ldesign/launcher 通过智能检测自动支持以下框架：

- ✅ Vue 2.x
- ✅ Vue 3.x
- ✅ React
- ✅ Svelte
- ✅ Vanilla JavaScript/TypeScript

## 📋 系统要求

- Node.js >= 16.0.0
- 支持现代浏览器

## 🤝 贡献

欢迎贡献！请查看 [贡献指南](./CONTRIBUTING.md)。

## 📄 许可证

[MIT](./LICENSE) © LDesign Team

## 🔗 相关链接

- [GitHub](https://github.com/ldesign/launcher)
- [NPM](https://www.npmjs.com/package/@ldesign/launcher)
- [文档](https://ldesign.github.io/launcher/)
- [讨论](https://github.com/ldesign/launcher/discussions)
- [问题反馈](https://github.com/ldesign/launcher/issues)
