# 零配置使用指南

@ldesign/launcher 提供类似 Vite 的零配置体验，让你无需任何配置文件即可启动项目。

## 🎯 核心理念

**约定优于配置** - launcher 会自动检测你的项目框架，并应用最佳实践配置。

## 🚀 快速开始

### 1. 安装

```bash
npm install -D @ldesign/launcher
```

这是你唯一需要安装的依赖！

### 2. 启动开发服务器

```bash
npx launcher dev
```

就这么简单！launcher 会：
1. 🔍 自动检测你的项目框架
2. 📦 加载框架所需的 Vite 插件
3. ⚙️ 应用框架的最佳配置
4. 🚀 启动开发服务器

### 3. 构建生产版本

```bash
npx launcher build
```

### 4. 预览构建结果

```bash
npx launcher preview
```

## 🔍 框架自动检测

launcher 支持自动检测以下框架：

### React 项目

**检测依据：**
- ✅ `package.json` 中有 `react` 依赖
- ✅ `package.json` 中有 `react-dom` 依赖
- ✅ 存在 `.jsx` 或 `.tsx` 文件
- ✅ 文件中有 `import React from 'react'`

**自动配置：**
- 加载 `@vitejs/plugin-react` 插件
- 配置 JSX 转换
- 启用 Fast Refresh
- 优化 React 相关依赖

### Vue 3 项目

**检测依据：**
- ✅ `package.json` 中有 `vue@^3.x` 依赖
- ✅ 存在 `.vue` 文件
- ✅ 文件中有 `import { createApp } from 'vue'`

**自动配置：**
- 加载 `@vitejs/plugin-vue` 插件
- 配置 SFC 编译
- 启用 HMR
- 优化 Vue 相关依赖

### Svelte 项目

**检测依据：**
- ✅ `package.json` 中有 `svelte` 依赖
- ✅ 存在 `.svelte` 文件
- ✅ 有 `svelte.config.js` 配置文件

**自动配置：**
- 加载 `@sveltejs/vite-plugin-svelte` 插件
- 配置 Svelte 编译器
- 启用 HMR
- 优化 Svelte 相关依赖

### Solid.js 项目

**检测依据：**
- ✅ `package.json` 中有 `solid-js` 依赖
- ✅ 存在 `.jsx` 或 `.tsx` 文件
- ✅ 文件中有 `import { createSignal } from 'solid-js'`

**自动配置：**
- 加载 `vite-plugin-solid` 插件
- 配置 JSX 转换
- 启用 HMR
- 优化 Solid 相关依赖

### 其他框架

launcher 还支持：
- **Preact** - 轻量级 React 替代方案
- **Qwik** - 可恢复性框架
- **Lit** - Web Components 库
- **Angular** - 完整的应用开发平台
- **Marko** - 快速、轻量的 UI 框架
- **SvelteKit** - Svelte 全栈框架
- **Vanilla JS/TS** - 原生 JavaScript/TypeScript

## 📊 检测置信度

launcher 使用多维度检测算法，计算框架检测的置信度：

```
置信度 = 依赖检测 (40%) + 
         插件检测 (15%) + 
         文件检测 (15%) + 
         导入检测 (10%) + 
         结构检测 (10%) + 
         配置检测 (10%)
```

**置信度阈值：** 50%

当置信度 ≥ 50% 时，launcher 会使用检测到的框架配置。

## 🎨 检测结果示例

### 高置信度检测

```bash
🔍 正在检测项目框架...
✓ 检测到 REACT 框架 (置信度: 95%)
  依赖: react, react-dom, @vitejs/plugin-react
  文件: src/App.tsx, src/main.tsx
  配置: vite.config.ts, tsconfig.json
```

### 低置信度警告

```bash
🔍 正在检测项目框架...
⚠ 未检测到已知框架，将使用默认配置
```

## ⚙️ 默认配置

每个框架都有精心设计的默认配置：

### React 默认配置

```typescript
{
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
}
```

### Vue 3 默认配置

```typescript
{
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  optimizeDeps: {
    include: ['vue']
  }
}
```

## 🔧 覆盖默认配置

如果需要自定义配置，创建 `launcher.config.ts`：

```typescript
import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  // 覆盖服务器配置
  server: {
    port: 8080,  // 自定义端口
    host: '0.0.0.0'  // 允许外部访问
  },
  
  // 覆盖构建配置
  build: {
    outDir: 'build',  // 自定义输出目录
    sourcemap: true   // 生成 sourcemap
  }
})
```

**配置优先级：**
1. 命令行参数（最高优先级）
2. `launcher.config.ts` 配置文件
3. 框架默认配置
4. launcher 全局默认配置（最低优先级）

## 🎯 最佳实践

### 1. 使用 package.json scripts

```json
{
  "scripts": {
    "dev": "launcher dev",
    "build": "launcher build",
    "preview": "launcher preview"
  }
}
```

然后使用：

```bash
npm run dev
npm run build
npm run preview
```

### 2. 环境特定配置

launcher 支持环境特定配置文件：

```
launcher.config.ts           # 基础配置
launcher.config.development.ts  # 开发环境配置
launcher.config.production.ts   # 生产环境配置
```

使用：

```bash
launcher dev --environment development
launcher build --environment production
```

### 3. 调试模式

查看详细的检测信息：

```bash
launcher dev --debug
```

输出示例：

```bash
🔍 正在检测项目框架...
✓ 检测到 REACT 框架 (置信度: 95%)
  依赖: react, react-dom, @vitejs/plugin-react
  文件: src/App.tsx, src/main.tsx
  配置: vite.config.ts, tsconfig.json
  
创建 ViteLauncher 实例
  cwd: /path/to/project
  environment: development
  framework: react
```

## 🚫 何时需要配置文件

虽然 launcher 提供零配置体验，但在以下情况下你可能需要配置文件：

1. **自定义端口或主机**
   ```typescript
   export default defineConfig({
     server: { port: 8080, host: '0.0.0.0' }
   })
   ```

2. **自定义路径别名**
   ```typescript
   export default defineConfig({
     resolve: {
       alias: {
         '@components': '/src/components',
         '@utils': '/src/utils'
       }
     }
   })
   ```

3. **添加额外的 Vite 插件**
   ```typescript
   import legacy from '@vitejs/plugin-legacy'
   
   export default defineConfig({
     plugins: [legacy()]
   })
   ```

4. **自定义构建选项**
   ```typescript
   export default defineConfig({
     build: {
       target: 'es2015',
       minify: 'terser'
     }
   })
   ```

## 📚 更多资源

- [完整配置选项](./CONFIGURATION.md)
- [框架支持列表](../examples/FRAMEWORK_SUPPORT.md)
- [API 文档](./api/README.md)
- [迁移指南](./MIGRATION.md)


