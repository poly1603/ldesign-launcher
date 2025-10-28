# @ldesign/launcher 示例项目

本目录包含使用 `@ldesign/launcher` 的各种框架示例项目。

## 📦 可用示例

### ✅ 完整示例（已实现）

1. **vue3-demo** - Vue 3 示例项目
   - 完整的组件示例
   - TypeScript 支持
   - HMR 热更新
   - 状态：✅ 完整可用

2. **react-demo** - React 18 示例项目
   - Hooks 示例
   - TypeScript 支持
   - Fast Refresh
   - 状态：✅ 完整可用

### 🚧 基础示例（待完善）

以下示例项目已创建基础结构，包含必要的配置文件，可以正常运行 dev/build/preview 命令：

3. **vue2-demo** - Vue 2 示例项目
4. **svelte-demo** - Svelte 示例项目
5. **solid-demo** - Solid.js 示例项目
6. **angular-demo** - Angular 示例项目
7. **preact-demo** - Preact 示例项目
8. **qwik-demo** - Qwik 示例项目
9. **lit-demo** - Lit 示例项目

## 🚀 快速开始

### 运行任意示例

```bash
# 进入示例目录
cd [framework]-demo

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

### 示例：运行 Vue 3 示例

```bash
cd vue3-demo
npm install
npm run dev
```

浏览器将自动打开 http://localhost:3000

## 📋 示例项目结构

每个示例项目都包含以下文件：

```
[framework]-demo/
├── src/                 # 源代码目录
│   ├── main.ts/tsx/js  # 应用入口
│   ├── App.*           # 根组件
│   └── components/     # 组件目录
├── index.html          # HTML 模板
├── launcher.config.ts  # Launcher 配置
├── package.json        # 项目配置
├── tsconfig.json       # TypeScript 配置
└── README.md           # 项目说明
```

## 🎯 配置说明

所有示例都使用 `launcher.config.ts` 进行配置：

```typescript
import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: 'vue3',  // 或 'react', 'svelte', 'solid' 等
    options: {}
  },
  
  server: {
    port: 3000,
    open: true
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

## 📚 框架特定说明

### Vue 3
- 使用 `@vitejs/plugin-vue`
- 支持 SFC (Single File Components)
- 支持 TypeScript
- 默认端口：3000

### React
- 使用 `@vitejs/plugin-react`
- 支持 Fast Refresh
- 支持 TypeScript + JSX
- 默认端口：3000

### Vue 2
- 使用 `@vitejs/plugin-vue2`
- 支持 Vue 2.7+
- 默认端口：3000

### Svelte
- 使用 `@sveltejs/vite-plugin-svelte`
- 支持 SFC
- 默认端口：5173

### Solid.js
- 使用 `vite-plugin-solid`
- 支持 JSX
- 默认端口：3000

### Angular
- 使用 `@analogjs/vite-plugin-angular`
- 支持 TypeScript
- 默认端口：4200

### Preact
- 使用 `@preact/preset-vite`
- 兼容 React API
- 默认端口：3000

### Qwik
- 使用 `@builder.io/qwik`
- 支持可恢复性
- 默认端口：5173

### Lit
- 使用原生 Web Components
- 无需额外插件
- 默认端口：3000

## 🔧 开发建议

1. **首次运行**：确保先在根目录运行 `npm install` 安装 launcher 包
2. **端口冲突**：如果端口被占用，可以在 `launcher.config.ts` 中修改端口
3. **类型检查**：运行 `npm run type-check` 进行 TypeScript 类型检查
4. **构建优化**：生产构建会自动进行代码分割和优化

## 📖 相关文档

- [Launcher 快速开始](../docs/QUICK_START.md)
- [Launcher 架构文档](../docs/ARCHITECTURE.md)
- [从 1.x 迁移](../docs/MIGRATION.md)

## 🤝 贡献

欢迎提交 PR 完善示例项目！

## 📄 许可证

MIT

