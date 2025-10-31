# @ldesign/launcher 示例项目

本目录包含使用 `@ldesign/launcher` 的各种框架示例项目。

## 📁 配置文件管理

所有示例项目的配置文件都统一放在 `.ldesign` 目录中，实现配置文件的集中管理。

### 配置文件结构

```
project/
├── .ldesign/
│   ├── launcher.config.ts              # 基础配置
│   ├── launcher.config.development.ts  # 开发环境配置
│   ├── launcher.config.production.ts   # 生产环境配置
│   ├── launcher.config.test.ts         # 测试环境配置
│   ├── app.config.ts                   # 应用配置（基础）
│   ├── app.config.development.ts       # 应用配置（开发环境）
│   └── app.config.production.ts        # 应用配置（生产环境）
├── src/
├── package.json
└── ...
```

### 配置文件说明

#### 1. launcher.config.ts

Launcher 的基础配置文件，定义框架类型、服务器配置、构建配置等。

```typescript
import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: 'react'  // 框架类型
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

#### 2. launcher.config.[environment].ts

环境特定的配置文件，会覆盖基础配置。

支持的环境名称：
- `development` - 开发环境
- `production` - 生产环境
- `test` - 测试环境
- `staging` - 预发布环境
- `preview` - 预览环境

**示例：launcher.config.development.ts**

```typescript
import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: 'react'
  },
  server: {
    port: 3000,
    open: true,
    hmr: true
  },
  build: {
    sourcemap: true,
    minify: false
  },
  define: {
    __DEV__: true,
    __API_URL__: JSON.stringify('http://localhost:8080/api')
  }
})
```

**示例：launcher.config.production.ts**

```typescript
import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: 'react'
  },
  build: {
    sourcemap: false,
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom']
        }
      }
    }
  },
  define: {
    __DEV__: false,
    __API_URL__: JSON.stringify('https://api.example.com')
  }
})
```

#### 3. app.config.ts

应用配置文件，会被注入到 `import.meta.env.appConfig` 中，可以在应用代码中访问。

```typescript
export default {
  app: {
    name: 'My App',
    version: '1.0.0',
    description: 'My awesome app'
  },
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    timeout: 30000
  },
  features: {
    enableAnalytics: false,
    enableDebug: true
  }
}
```

#### 4. app.config.[environment].ts

环境特定的应用配置。

```typescript
export default {
  app: {
    name: 'My App',
    version: '1.0.0'
  },
  api: {
    baseUrl: 'https://api.example.com',
    timeout: 30000
  },
  features: {
    enableAnalytics: true,
    enableDebug: false
  }
}
```

### 配置文件加载优先级

Launcher 会按以下优先级查找和加载配置文件：

1. `.ldesign/launcher.config.[environment].ts` - 环境特定配置（最高优先级）
2. `launcher.config.[environment].ts` - 项目根目录的环境配置
3. `.ldesign/launcher.config.ts` - 基础配置
4. `launcher.config.ts` - 项目根目录的基础配置
5. `vite.config.ts` - Vite 配置文件（兼容模式）

应用配置加载优先级：

1. `.ldesign/app.config.[environment].ts` - 环境特定应用配置
2. `.ldesign/app.config.ts` - 基础应用配置

### 使用环境配置

#### 方式 1：通过命令行参数

```bash
# 使用开发环境配置
pnpm run dev --mode development

# 使用生产环境配置
pnpm run build --mode production
```

#### 方式 2：通过环境变量

```bash
# Windows
set NODE_ENV=production && pnpm run build

# Linux/Mac
NODE_ENV=production pnpm run build
```

#### 方式 3：在 package.json 中定义脚本

```json
{
  "scripts": {
    "dev": "launcher dev",
    "dev:prod": "launcher dev --mode production",
    "build": "launcher build",
    "build:dev": "launcher build --mode development"
  }
}
```

## 🎯 支持的框架

| 框架 | 示例项目 | 端口 | 说明 |
|------|----------|------|------|
| React | react-demo | 3000 | React 18 + TypeScript |
| Vue 3 | vue3-demo | 3007 | Vue 3 + TypeScript |
| Vue 2 | vue2-demo | 3006 | Vue 2 + TypeScript |
| Svelte | svelte-demo | 3004 | Svelte + TypeScript |
| Solid | solid-demo | 3003 | Solid.js + TypeScript |
| Preact | preact-demo | 3002 | Preact + TypeScript |
| Lit | lit-demo | 3001 | Lit + TypeScript |
| Qwik | qwik-demo | 5173 | Qwik + TypeScript |

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动开发服务器

```bash
cd react-demo
pnpm run dev
```

### 3. 构建生产版本

```bash
pnpm run build
```

### 4. 预览生产构建

```bash
pnpm run preview
```

## 📝 注意事项

1. **配置文件位置**：所有配置文件都应放在 `.ldesign` 目录中
2. **环境配置**：使用 `launcher.config.[environment].ts` 格式命名环境配置
3. **应用配置**：使用 `app.config.ts` 定义应用级配置，可在代码中通过 `import.meta.env.appConfig` 访问
4. **零配置**：所有示例项目都使用 `@ldesign/launcher` 的内置 Vite 7，无需单独安装 Vite

## 🔧 配置示例

查看各个示例项目的 `.ldesign` 目录，了解不同框架的配置方式：

- **React Demo**: `.ldesign/launcher.config.ts` - 包含完整的多环境配置示例
- **Vue3 Demo**: `.ldesign/launcher.config.ts` - Vue 3 特定配置
- **其他框架**: 类似的配置结构

## 📚 更多信息

- [Launcher 文档](../../README.md)
- [配置参考](../../docs/config.md)
- [API 文档](../../docs/api.md)

