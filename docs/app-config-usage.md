# 应用配置使用指南

`@ldesign/launcher` 提供了统一的应用配置管理系统，支持所有主流前端框架。配置文件会自动注入到应用中，并支持 HMR 热更新。

## 📋 目录

- [配置文件](#配置文件)
- [使用方式](#使用方式)
  - [React](#react)
  - [Vue 3](#vue-3)
  - [Vue 2](#vue-2)
  - [Svelte](#svelte)
  - [Solid](#solid)
  - [Preact](#preact)
  - [Qwik](#qwik)
  - [Lit](#lit)
- [配置结构](#配置结构)
- [HMR 热更新](#hmr-热更新)

## 配置文件

在项目根目录的 `.ldesign/` 目录下创建 `app.config.ts`：

```typescript
// .ldesign/app.config.ts
export default {
  app: {
    name: 'My App',
    version: '1.0.0',
    description: 'My awesome application'
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

支持多环境配置：
- `app.config.ts` - 基础配置
- `app.config.development.ts` - 开发环境配置
- `app.config.production.ts` - 生产环境配置
- `app.config.test.ts` - 测试环境配置

## 使用方式

### React

使用 `useAppConfig` Hook：

```tsx
import { useAppConfig } from '@ldesign/launcher/client/react'

function App() {
  const { config, environment } = useAppConfig()
  
  return (
    <div>
      <h1>{config.app.name}</h1>
      <p>版本: {config.app.version}</p>
      <p>环境: {environment.mode}</p>
      <p>API: {config.api.baseUrl}</p>
    </div>
  )
}
```

**特点**：
- ✅ 自动订阅配置变化
- ✅ 组件卸载时自动清理
- ✅ TypeScript 类型支持
- ✅ HMR 热更新

### Vue 3

使用 `useAppConfig` Composable：

```vue
<script setup lang="ts">
import { useAppConfig } from '@ldesign/launcher/client/vue'

const { config, environment } = useAppConfig()
</script>

<template>
  <div>
    <h1>{{ config.app.name }}</h1>
    <p>版本: {{ config.app.version }}</p>
    <p>环境: {{ environment.mode }}</p>
    <p>API: {{ config.api.baseUrl }}</p>
  </div>
</template>
```

**特点**：
- ✅ Composition API 风格
- ✅ 响应式 ref
- ✅ 自动订阅和清理
- ✅ HMR 热更新

### Vue 2

使用 `appConfigMixin`：

```vue
<script>
import { appConfigMixin } from '@ldesign/launcher/client/vue2'

export default {
  mixins: [appConfigMixin],
  
  mounted() {
    console.log('应用名称:', this.appConfig.app.name)
  }
}
</script>

<template>
  <div>
    <h1>{{ appConfig.app.name }}</h1>
    <p>版本: {{ appConfig.app.version }}</p>
    <p>环境: {{ appEnvironment.mode }}</p>
  </div>
</template>
```

**特点**：
- ✅ Options API 风格
- ✅ Mixin 自动注入
- ✅ 响应式数据
- ✅ HMR 热更新

### Svelte

使用 Svelte Store：

```svelte
<script>
import { appConfig, appEnvironment } from '@ldesign/launcher/client/svelte'
</script>

<div>
  <h1>{$appConfig.app.name}</h1>
  <p>版本: {$appConfig.app.version}</p>
  <p>环境: {$appEnvironment.mode}</p>
  <p>API: {$appConfig.api.baseUrl}</p>
</div>
```

**特点**：
- ✅ Svelte Store 风格
- ✅ 使用 `$` 自动订阅
- ✅ 响应式更新
- ✅ HMR 热更新

### Solid

使用 `useAppConfig` Hook：

```tsx
import { useAppConfig } from '@ldesign/launcher/client/solid'

function App() {
  const { config, environment } = useAppConfig()
  
  return (
    <div>
      <h1>{config().app.name}</h1>
      <p>版本: {config().app.version}</p>
      <p>环境: {environment().mode}</p>
      <p>API: {config().api.baseUrl}</p>
    </div>
  )
}
```

**特点**：
- ✅ Solid Signal 风格
- ✅ 细粒度响应式
- ✅ 自动订阅和清理
- ✅ HMR 热更新

### Preact

使用 `useAppConfig` Hook（与 React 相同）：

```tsx
import { useAppConfig } from '@ldesign/launcher/client/react'

function App() {
  const { config, environment } = useAppConfig()
  
  return (
    <div>
      <h1>{config.app.name}</h1>
      <p>版本: {config.app.version}</p>
    </div>
  )
}
```

### Qwik

使用 `useAppConfig` Hook：

```tsx
import { component$ } from '@builder.io/qwik'
import { useAppConfig } from '@ldesign/launcher/client/qwik'

export default component$(() => {
  const { config, environment } = useAppConfig()
  
  return (
    <div>
      <h1>{config.value.app.name}</h1>
      <p>版本: {config.value.app.version}</p>
      <p>环境: {environment.value.mode}</p>
    </div>
  )
})
```

**特点**：
- ✅ Qwik Signal 风格
- ✅ 可恢复性支持
- ✅ 自动订阅和清理
- ✅ HMR 热更新

### Lit

使用 `AppConfigMixin` 或 `AppConfigController`：

#### 方式 1: Mixin（推荐）

```typescript
import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { AppConfigMixin } from '@ldesign/launcher/client/lit'

@customElement('my-app')
export class MyApp extends AppConfigMixin(LitElement) {
  render() {
    return html`
      <div>
        <h1>${this.appConfig.app.name}</h1>
        <p>版本: ${this.appConfig.app.version}</p>
        <p>环境: ${this.appEnvironment.mode}</p>
      </div>
    `
  }
}
```

#### 方式 2: Controller

```typescript
import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { AppConfigController } from '@ldesign/launcher/client/lit'

@customElement('my-app')
export class MyApp extends LitElement {
  private appConfig = new AppConfigController(this)
  
  render() {
    return html`
      <div>
        <h1>${this.appConfig.config.app.name}</h1>
        <p>版本: ${this.appConfig.config.app.version}</p>
      </div>
    `
  }
}
```

**特点**：
- ✅ Reactive Controller 模式
- ✅ 自动触发重渲染
- ✅ 生命周期管理
- ✅ HMR 热更新

## 配置结构

```typescript
interface AppConfig {
  app: {
    name: string
    version: string
    description: string
  }
  api: {
    baseUrl: string
    timeout: number
  }
  features: {
    enableAnalytics: boolean
    enableDebug: boolean
  }
  // 可以添加自定义字段
  [key: string]: any
}
```

## HMR 热更新

所有框架都支持配置文件的 HMR 热更新：

1. **自动监听**：修改 `.ldesign/app.config.ts` 文件
2. **自动更新**：页面无需刷新，配置自动更新
3. **控制台日志**：显示 "🔄 配置已更新" 消息
4. **响应式更新**：所有使用配置的组件自动重新渲染

### 工作原理

```
配置文件变化
    ↓
app-config 插件监听
    ↓
发送 HMR 事件
    ↓
配置管理器接收
    ↓
通知所有订阅者
    ↓
组件自动更新
```

### 优势

- ✅ **零配置**：无需手动监听 HMR 事件
- ✅ **自动清理**：组件卸载时自动取消订阅
- ✅ **类型安全**：完整的 TypeScript 支持
- ✅ **统一 API**：所有框架使用相同的概念
- ✅ **性能优化**：单例模式，避免重复订阅

## 最佳实践

1. **使用环境变量**：敏感信息使用 `import.meta.env`
2. **多环境配置**：为不同环境创建专用配置文件
3. **类型定义**：扩展 `AppConfig` 接口添加自定义字段
4. **按需导入**：只导入需要的框架特定 API

## 示例项目

查看 `examples/` 目录下的示例项目：
- `react-demo` - React 示例
- `vue3-demo` - Vue 3 示例
- `vue2-demo` - Vue 2 示例
- `svelte-demo` - Svelte 示例
- `solid-demo` - Solid 示例
- `preact-demo` - Preact 示例
- `qwik-demo` - Qwik 示例
- `lit-demo` - Lit 示例

