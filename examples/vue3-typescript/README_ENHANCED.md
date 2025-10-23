# Vue 3 + TypeScript 示例项目

这是一个使用 `@ldesign/launcher` 的 Vue 3 + TypeScript 完整示例。

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
# 使用默认配置
launcher dev

# 使用自定义端口
launcher dev --port 3000

# 启用调试模式
launcher dev --debug

# 使用环境配置
launcher dev --environment development
```

### 构建生产版本

```bash
# 标准构建
launcher build

# 使用生产环境配置
launcher build --environment production

# 分析构建产物
launcher build --analyze
```

### 预览构建结果

```bash
launcher preview
```

---

## 📁 项目结构

```
vue3-typescript/
├── src/
│   ├── App.vue          # 主应用组件
│   ├── main.ts          # 应用入口
│   ├── style.css        # 全局样式
│   └── components/
│       └── Counter.vue  # 示例组件
├── public/              # 静态资源
├── index.html           # HTML模板
├── launcher.config.ts   # Launcher配置
├── tsconfig.json        # TypeScript配置
└── package.json         # 项目配置
```

---

## ⚙️ 配置说明

### launcher.config.ts

```typescript
import { defineConfig } from '@ldesign/launcher'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Vite 插件
  plugins: [vue()],
  
  // 服务器配置
  server: {
    port: 3000,
    host: 'localhost',
    open: true,
    cors: true
  },
  
  // 构建配置
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild'
  },
  
  // 路径别名
  resolve: {
    alias: [
      { find: '@', replacement: './src' },
      { find: '@components', replacement: './src/components' }
    ]
  },
  
  // Launcher 特性
  launcher: {
    autoRestart: true,
    logLevel: 'info',
    hooks: {
      beforeStart: () => {
        console.log('🚀 启动前准备...')
      },
      afterStart: () => {
        console.log('✅ 服务器已启动！')
      }
    }
  }
})
```

---

## 🎯 功能特性

### 1. 热模块替换 (HMR)

修改代码后自动刷新，无需手动重启。

### 2. TypeScript 支持

完整的 TypeScript 类型检查和智能提示。

### 3. 路径别名

使用 `@` 替代相对路径：

```typescript
// ❌ 不推荐
import Counter from '../../../components/Counter.vue'

// ✅ 推荐
import Counter from '@/components/Counter.vue'
```

### 4. 开发工具

```bash
# 查看配置
launcher config list

# 清除缓存
launcher cache clear

# 项目诊断
launcher doctor

# 性能分析
launcher optimize --analyze
```

---

## 📝 最佳实践

### 1. 组件开发

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// 使用 TypeScript 定义类型
interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})

const currentCount = ref(props.count)
const doubled = computed(() => currentCount.value * 2)
</script>

<template>
  <div class="component">
    <h2>{{ title }}</h2>
    <p>Count: {{ currentCount }} (Doubled: {{ doubled }})</p>
  </div>
</template>
```

### 2. 多环境配置

创建环境特定配置：

```bash
.ldesign/
├── launcher.development.config.ts  # 开发环境
├── launcher.production.config.ts   # 生产环境
└── launcher.test.config.ts         # 测试环境
```

### 3. 性能优化

```typescript
// launcher.config.ts
export default defineConfig({
  build: {
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue'],
          'utils': ['lodash-es']
        }
      }
    },
    
    // 压缩优化
    minify: 'esbuild',
    target: 'es2020',
    
    // CSS 代码分割
    cssCodeSplit: true
  }
})
```

---

## 🔧 故障排查

### 问题：端口被占用

```bash
# 查找并关闭占用端口的进程
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# 或使用其他端口
launcher dev --port 3001
```

### 问题：模块未找到

```bash
# 清除缓存并重新安装
launcher cache clear
rm -rf node_modules
pnpm install
```

### 问题：构建失败

```bash
# 启用调试模式查看详细信息
launcher build --debug

# 检查项目配置
launcher doctor
```

---

## 📚 更多资源

- [Launcher 文档](../../README.md)
- [配置参考](../../docs/config/README.md)
- [API 文档](../../docs/api/README.md)
- [Vue 3 官方文档](https://vuejs.org/)

---

**示例维护者**: LDesign Team  
**最后更新**: 2025-01-24


