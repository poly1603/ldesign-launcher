# @ldesign/launcher

[![NPM version](https://img.shields.io/npm/v/@ldesign/launcher.svg)](https://www.npmjs.com/package/@ldesign/launcher)
[![Build Status](https://github.com/ldesign/launcher/workflows/CI/badge.svg)](https://github.com/ldesign/launcher/actions)
[![Coverage Status](https://coveralls.io/repos/github/ldesign/launcher/badge.svg?branch=main)](https://coveralls.io/github/ldesign/launcher?branch=main)
[![License](https://img.shields.io/npm/l/@ldesign/launcher.svg)](https://github.com/ldesign/launcher/blob/main/LICENSE)

> 🎯 **零配置启动工具** - 类似 Vite 的开箱即用体验，自动检测框架，无需手动配置！

基于 Vite JavaScript API 的前端项目启动器，提供统一的开发服务器、构建工具和预览服务。**唯一需要安装的依赖**，支持多种主流前端框架的零配置启动。

## ✨ 核心特性

### 🎯 零配置优先

- **🔍 自动框架检测** - 智能识别项目使用的框架（React、Vue、Svelte、Solid、Preact、Qwik、Lit、Angular、Marko 等）
- **📦 开箱即用** - 无需配置文件，直接运行 `launcher dev` 即可启动
- **🎨 智能默认配置** - 每个框架都有最佳实践的默认配置
- **⚙️ 可选配置** - 需要时可通过 `launcher.config.js` 覆盖默认行为

### 🚀 强大功能

- **基于 Vite** - 利用 Vite 5.0+ 的强大功能和生态系统
- **统一 API** - 提供一致的开发、构建和预览体验
- **多框架支持** - 支持 13+ 主流前端框架和库
- **多环境配置** - 支持环境特定配置文件和自动合并
- **智能代理** - 简化的代理配置语法和常见场景支持
- **插件系统** - 支持插件扩展和自定义功能
- **性能监控** - 内置性能监控和优化建议
- **TypeScript** - 完整的 TypeScript 支持
- **CLI 工具** - 提供友好的命令行界面
- **高性能** - 快速启动和热更新
- **✨ 精美 UI** - 渐变色标题、二维码、图表、进度条等
- **🎯 智能提示** - 友好的错误提示和解决方案建议
- **⌨️ 快捷键** - 支持交互式快捷键操作

## 🎨 支持的框架

| 框架 | 版本 | 自动检测 | 零配置 |
|------|------|---------|--------|
| React | 18.x | ✅ | ✅ |
| React (SWC) | 18.x | ✅ | ✅ |
| Vue 3 | 3.x | ✅ | ✅ |
| Vue 2 | 2.7.x | ✅ | ✅ |
| Svelte | 4.x | ✅ | ✅ |
| SvelteKit | 2.x | ✅ | ✅ |
| Solid.js | 1.x | ✅ | ✅ |
| Preact | 10.x | ✅ | ✅ |
| Qwik | 1.x | ✅ | ✅ |
| Lit | 3.x | ✅ | ✅ |
| Angular | 18.x | ✅ | ✅ |
| Marko | 5.x | ✅ | ✅ |
| Vanilla JS/TS | - | ✅ | ✅ |

## 📦 安装

```bash
# 使用 pnpm (推荐)
pnpm add -D @ldesign/launcher

# 使用 npm
npm install -D @ldesign/launcher

# 使用 yarn
yarn add -D @ldesign/launcher
```

**这是你唯一需要安装的依赖！** 🎉

## 🚀 快速开始

### ⚡ 零配置启动（推荐）

无需任何配置文件，launcher 会自动检测你的项目框架并使用最佳配置：

```bash
# 1. 安装 launcher
npm install -D @ldesign/launcher

# 2. 直接启动开发服务器（自动检测框架）
npx launcher dev

# 3. 构建生产版本
npx launcher build

# 4. 预览构建结果
npx launcher preview
```

**就这么简单！** launcher 会自动：
- ✅ 检测你使用的框架（React、Vue、Svelte 等）
- ✅ 应用框架的最佳实践配置
- ✅ 自动加载必要的 Vite 插件
- ✅ 配置开发服务器和构建选项

### 🎨 检测示例

当你运行 `launcher dev` 时，会看到精美的控制台界面：

```bash
╭───────────────────────────────────────────────╮
│   🚀 Launcher v2.0.0                         │
│   ⚡ Lightning Fast Development Tool          │
│   Framework: React 18.2.0                    │
│   Engine: Vite 5.0                           │
│   Node: v20.10.0                             │
│   Started in: 342ms ⚡                        │
╰───────────────────────────────────────────────╯

✨ Development server started

➜ Local:   http://localhost:3000
➜ Network: http://192.168.1.100:3000

📱 扫码访问
[二维码 ASCII Art]

Shortcuts:
  h - 显示帮助
  c - 清屏
  o - 在浏览器中打开
  r - 重启服务器
  q - 退出

✓ Local address copied to clipboard
```

### 📝 可选配置

如果需要自定义配置，创建 `launcher.config.ts` 或 `launcher.config.js`：

```typescript
import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  // 自定义服务器配置
  server: {
    port: 8080,
    open: true
  },

  // 自定义构建配置
  build: {
    outDir: 'build',
    sourcemap: true
  }
})
```

### 🔧 CLI 命令

```bash
# 开发服务器
launcher dev                          # 零配置启动
launcher dev --port 8080              # 指定端口
launcher dev --host 0.0.0.0           # 允许外部访问
launcher dev --open                   # 自动打开浏览器

# 生产构建
launcher build                        # 零配置构建
launcher build --outDir dist          # 指定输出目录
launcher build --sourcemap            # 生成 sourcemap
launcher build --analyze              # 分析构建产物

# 预览构建结果
launcher preview                      # 预览构建结果
launcher preview --port 4173          # 指定预览端口

# 其他命令
launcher config list                  # 查看当前配置
launcher --help                       # 查看帮助
```

### 💻 编程式 API

```typescript
import { ViteLauncher } from '@ldesign/launcher'

// 创建启动器实例（自动检测框架）
const launcher = new ViteLauncher({
  cwd: process.cwd()
})

// 启动开发服务器
await launcher.startDev()

// 执行构建
await launcher.build()

// 启动预览服务器
await launcher.preview()
```

## 📚 功能定位

@ldesign/launcher 是一个**专注于项目启动**的工具，提供：

- ✅ **开发服务器** (`launcher dev`)
- ✅ **生产构建** (`launcher build`)
- ✅ **构建预览** (`launcher preview`)
- ✅ **配置管理** (`launcher config`)

**不包含的功能**：
- ❌ 部署工具（请使用 [@ldesign/deployer](../deployer)）
- ❌ 测试工具（请使用 [@ldesign/testing](../testing)）
- ❌ 代码生成（请使用 [@ldesign/generator](../generator)）
- ❌ 字体/SVG/图片处理等工具

**与其他工具的关系**：
- **@ldesign/builder**: 用于构建 npm 包/组件库，launcher 用于启动应用
- **@ldesign/cli**: 统一 CLI 入口，包含 launcher 和其他工具

## 🔧 配置文件

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

## ✨ UI 增强功能

### 🎨 精美的控制台界面

- **渐变色标题** - 使用 gradient-string 的视觉吸引力
- **边框盒子** - boxen 组件美化信息展示
- **二维码展示** - 扫码即可在手机上访问
- **网络信息** - 自动检测和显示局域网地址
- **进度条** - 实时显示构建进度
- **数据图表** - 可视化构建统计信息

### 📊 构建统计

构建完成后会显示详细的统计信息:

```bash
╭───────────────────────────────────────────────╮
│   📊 Build Statistics                         │
│   Duration: 3.2s                              │
│   Files: 15                                   │
│   Total Size: 156.1 KB                        │
│   Gzipped: 50.3 KB                            │
╰───────────────────────────────────────────────╯

📊 构建产物分析:
JavaScript  ████████████████ 143KB (91.6%)
CSS         ███ 12KB (7.9%)
Images      █ 1KB (0.5%)
```

### ⌨️ 交互式快捷键

开发服务器运行时支持快捷键操作:

- `h` - 显示帮助信息
- `c` - 清屏
- `o` - 在浏览器中打开
- `r` - 重启服务器
- `q` - 退出

### 🎯 友好的错误提示

遇到错误时会显示清晰的问题描述和解决方案:

```bash
✖ 错误 (开发服务器)

  端口 3000 已被占用

⚠ 端口已被占用

💡 可能的解决方案:
  1. 使用不同的端口: launcher dev --port 8080
  2. 查找并终止占用端口的进程
  3. 使用 --strictPort 选项禁用自动端口选择

📚 相关文档: https://launcher.dev/docs/troubleshooting/port-in-use
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
- [UI 功能说明](./docs/guide/ui-features.md) ✨ 新增

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
