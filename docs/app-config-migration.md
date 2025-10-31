# 应用配置 API 迁移指南

从手动 HMR 监听迁移到新的统一配置管理 API。

## 📊 对比总览

| 特性 | 旧方式（手动监听） | 新方式（useAppConfig） |
|------|------------------|---------------------|
| **代码行数** | ~48 行 | ~8 行 |
| **HMR 监听** | 手动监听 | 自动处理 |
| **清理逻辑** | 需要手动清理 | 自动清理 |
| **类型安全** | 需要手动定义 | 内置类型 |
| **框架支持** | 每个框架不同 | 统一 API |
| **易用性** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🔄 迁移步骤

### React / Preact

#### 旧方式（手动监听 HMR）

```tsx
import { useState, useEffect } from 'react'

interface AppConfig {
  app: { name: string; version: string; description: string }
  api: { baseUrl: string; timeout: number }
  features: { enableAnalytics: boolean; enableDebug: boolean }
}

export function ConfigDisplay() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [environment, setEnvironment] = useState('development')

  useEffect(() => {
    // 从 import.meta.env 获取配置
    const appConfig = (import.meta.env as any).appConfig
    if (appConfig) {
      setConfig(appConfig)
    }

    // 获取当前环境
    const mode = import.meta.env.MODE || 'development'
    setEnvironment(mode)

    // 监听 HMR 事件
    if (import.meta.hot) {
      import.meta.hot.on('app-config-updated', (data: any) => {
        console.log('🔄 配置已更新:', data)
        setConfig(data)
      })
    }
  }, [])

  if (!config) return <div>加载中...</div>

  return (
    <div>
      <h1>{config.app.name}</h1>
      <p>环境: {environment}</p>
    </div>
  )
}
```

**问题**：
- ❌ 代码冗长（48 行）
- ❌ 需要手动监听 HMR
- ❌ 需要手动定义类型
- ❌ 没有自动清理
- ❌ 每个组件都要重复这些代码

#### 新方式（useAppConfig Hook）

```tsx
import { useAppConfig } from '@ldesign/launcher/client/react'

export function ConfigDisplay() {
  const { config, environment } = useAppConfig()

  return (
    <div>
      <h1>{config.app.name}</h1>
      <p>环境: {environment.mode}</p>
    </div>
  )
}
```

**优势**：
- ✅ 代码简洁（8 行）
- ✅ 自动处理 HMR
- ✅ 内置类型定义
- ✅ 自动清理订阅
- ✅ 一次导入，到处使用

### Vue 3

#### 旧方式

```vue
<script setup>
import { ref, onMounted } from 'vue'

const config = ref(null)
const environment = ref('development')

onMounted(() => {
  const appConfig = import.meta.env.appConfig
  if (appConfig) {
    config.value = appConfig
  }

  environment.value = import.meta.env.MODE || 'development'

  if (import.meta.hot) {
    import.meta.hot.on('app-config-updated', (data) => {
      console.log('🔄 配置已更新:', data)
      config.value = data
    })
  }
})
</script>

<template>
  <div v-if="config">
    <h1>{{ config.app.name }}</h1>
    <p>环境: {{ environment }}</p>
  </div>
</template>
```

#### 新方式

```vue
<script setup>
import { useAppConfig } from '@ldesign/launcher/client/vue'

const { config, environment } = useAppConfig()
</script>

<template>
  <div>
    <h1>{{ config.app.name }}</h1>
    <p>环境: {{ environment.mode }}</p>
  </div>
</template>
```

### Vue 2

#### 旧方式

```vue
<script>
export default {
  data() {
    return {
      config: null,
      environment: 'development'
    }
  },

  mounted() {
    const appConfig = import.meta.env.appConfig
    if (appConfig) {
      this.config = appConfig
    }

    this.environment = import.meta.env.MODE || 'development'

    if (import.meta.hot) {
      import.meta.hot.on('app-config-updated', (data) => {
        console.log('🔄 配置已更新:', data)
        this.config = data
      })
    }
  }
}
</script>

<template>
  <div v-if="config">
    <h1>{{ config.app.name }}</h1>
  </div>
</template>
```

#### 新方式

```vue
<script>
import { appConfigMixin } from '@ldesign/launcher/client/vue2'

export default {
  mixins: [appConfigMixin]
}
</script>

<template>
  <div>
    <h1>{{ appConfig.app.name }}</h1>
    <p>环境: {{ appEnvironment.mode }}</p>
  </div>
</template>
```

### Svelte

#### 旧方式

```svelte
<script>
import { onMount } from 'svelte'

let config = null
let environment = 'development'

onMount(() => {
  const appConfig = import.meta.env.appConfig
  if (appConfig) {
    config = appConfig
  }

  environment = import.meta.env.MODE || 'development'

  if (import.meta.hot) {
    import.meta.hot.on('app-config-updated', (data) => {
      console.log('🔄 配置已更新:', data)
      config = data
    })
  }
})
</script>

{#if config}
  <div>
    <h1>{config.app.name}</h1>
    <p>环境: {environment}</p>
  </div>
{/if}
```

#### 新方式

```svelte
<script>
import { appConfig, appEnvironment } from '@ldesign/launcher/client/svelte'
</script>

<div>
  <h1>{$appConfig.app.name}</h1>
  <p>环境: {$appEnvironment.mode}</p>
</div>
```

### Solid

#### 旧方式

```tsx
import { createSignal, onMount } from 'solid-js'

function App() {
  const [config, setConfig] = createSignal(null)
  const [environment, setEnvironment] = createSignal('development')

  onMount(() => {
    const appConfig = import.meta.env.appConfig
    if (appConfig) {
      setConfig(appConfig)
    }

    setEnvironment(import.meta.env.MODE || 'development')

    if (import.meta.hot) {
      import.meta.hot.on('app-config-updated', (data) => {
        console.log('🔄 配置已更新:', data)
        setConfig(data)
      })
    }
  })

  return (
    <div>
      <h1>{config()?.app.name}</h1>
      <p>环境: {environment()}</p>
    </div>
  )
}
```

#### 新方式

```tsx
import { useAppConfig } from '@ldesign/launcher/client/solid'

function App() {
  const { config, environment } = useAppConfig()

  return (
    <div>
      <h1>{config().app.name}</h1>
      <p>环境: {environment().mode}</p>
    </div>
  )
}
```

### Qwik

#### 旧方式

```tsx
import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'

export default component$(() => {
  const config = useSignal(null)
  const environment = useSignal('development')

  useVisibleTask$(() => {
    const appConfig = import.meta.env.appConfig
    if (appConfig) {
      config.value = appConfig
    }

    environment.value = import.meta.env.MODE || 'development'

    if (import.meta.hot) {
      import.meta.hot.on('app-config-updated', (data) => {
        console.log('🔄 配置已更新:', data)
        config.value = data
      })
    }
  })

  return (
    <div>
      <h1>{config.value?.app.name}</h1>
      <p>环境: {environment.value}</p>
    </div>
  )
})
```

#### 新方式

```tsx
import { component$ } from '@builder.io/qwik'
import { useAppConfig } from '@ldesign/launcher/client/qwik'

export default component$(() => {
  const { config, environment } = useAppConfig()

  return (
    <div>
      <h1>{config.value.app.name}</h1>
      <p>环境: {environment.value.mode}</p>
    </div>
  )
})
```

### Lit

#### 旧方式

```typescript
import { LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'

@customElement('my-app')
export class MyApp extends LitElement {
  @state() private config: any = null
  @state() private environment = 'development'

  connectedCallback() {
    super.connectedCallback()

    const appConfig = (import.meta.env as any).appConfig
    if (appConfig) {
      this.config = appConfig
    }

    this.environment = import.meta.env.MODE || 'development'

    if (import.meta.hot) {
      import.meta.hot.on('app-config-updated', (data: any) => {
        console.log('🔄 配置已更新:', data)
        this.config = data
      })
    }
  }

  render() {
    if (!this.config) return html`<div>加载中...</div>`

    return html`
      <div>
        <h1>${this.config.app.name}</h1>
        <p>环境: ${this.environment}</p>
      </div>
    `
  }
}
```

#### 新方式

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
        <p>环境: ${this.appEnvironment.mode}</p>
      </div>
    `
  }
}
```

## 📈 收益总结

### 代码量减少

- **React**: 48 行 → 8 行（减少 83%）
- **Vue 3**: 35 行 → 6 行（减少 83%）
- **Vue 2**: 30 行 → 5 行（减少 83%）
- **Svelte**: 25 行 → 5 行（减少 80%）
- **Solid**: 30 行 → 8 行（减少 73%）
- **Qwik**: 35 行 → 10 行（减少 71%）
- **Lit**: 40 行 → 12 行（减少 70%）

### 功能增强

- ✅ **自动 HMR**：无需手动监听
- ✅ **自动清理**：组件卸载时自动取消订阅
- ✅ **类型安全**：内置 TypeScript 类型
- ✅ **统一 API**：所有框架使用相同概念
- ✅ **更好的性能**：单例模式，避免重复订阅

### 维护性提升

- ✅ **代码更简洁**：易于理解和维护
- ✅ **减少重复**：配置逻辑集中管理
- ✅ **更少错误**：自动处理边界情况
- ✅ **更好的测试**：易于模拟和测试

## 🚀 立即迁移

1. **安装最新版本**：
   ```bash
   pnpm update @ldesign/launcher
   ```

2. **导入新 API**：
   ```typescript
   // React/Preact
   import { useAppConfig } from '@ldesign/launcher/client/react'
   
   // Vue 3
   import { useAppConfig } from '@ldesign/launcher/client/vue'
   
   // Vue 2
   import { appConfigMixin } from '@ldesign/launcher/client/vue2'
   
   // Svelte
   import { appConfig, appEnvironment } from '@ldesign/launcher/client/svelte'
   
   // Solid
   import { useAppConfig } from '@ldesign/launcher/client/solid'
   
   // Qwik
   import { useAppConfig } from '@ldesign/launcher/client/qwik'
   
   // Lit
   import { AppConfigMixin } from '@ldesign/launcher/client/lit'
   ```

3. **替换旧代码**：参考上面的示例进行替换

4. **测试 HMR**：修改配置文件，确认页面自动更新

## 📚 更多资源

- [完整使用指南](./app-config-usage.md)
- [示例项目](../examples/)
- [API 文档](./api-reference.md)

