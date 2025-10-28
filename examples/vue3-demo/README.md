# Vue 3 Demo - @ldesign/launcher

这是一个使用 `@ldesign/launcher` 构建的 Vue 3 示例项目。

## 特性

- ⚡️ Vue 3 + Vite - 极速开发体验
- 🔧 自动框架检测 - 无需手动配置
- 📦 TypeScript 支持 - 完整的类型安全
- 🎨 组件化开发 - 可复用的 Vue 组件
- 🔥 HMR - 热模块替换

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

### 生产构建

```bash
npm run build
```

构建产物将输出到 `dist` 目录

### 预览构建产物

```bash
npm run preview
```

### 类型检查

```bash
npm run type-check
```

## 项目结构

```
vue3-demo/
├── src/
│   ├── components/       # Vue 组件
│   │   ├── Counter.vue   # 计数器组件
│   │   └── HelloWorld.vue # 欢迎组件
│   ├── App.vue          # 根组件
│   ├── main.ts          # 应用入口
│   └── style.css        # 全局样式
├── index.html           # HTML 模板
├── launcher.config.ts   # Launcher 配置
├── package.json
├── tsconfig.json        # TypeScript 配置
└── README.md
```

## 配置说明

项目使用 `launcher.config.ts` 进行配置：

```typescript
import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: 'vue3',  // 指定使用 Vue 3
    options: {
      jsx: false   // 是否启用 JSX
    }
  },
  
  server: {
    port: 3000,    // 开发服务器端口
    open: true     // 自动打开浏览器
  },
  
  build: {
    outDir: 'dist',      // 构建输出目录
    sourcemap: true      // 生成 sourcemap
  }
})
```

## 了解更多

- [Vue 3 文档](https://vuejs.org/)
- [@ldesign/launcher 文档](../../docs/QUICK_START.md)
- [Vite 文档](https://vitejs.dev/)

