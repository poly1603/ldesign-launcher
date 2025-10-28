# Qwik Demo - @ldesign/launcher

这是一个使用 `@ldesign/launcher` 构建的 Qwik 示例项目。

## 特性

- ⚡️ **Vite** - 极速的开发服务器和构建工具
- 🎨 **Qwik** - 可恢复性框架，瞬间加载
- 📦 **TypeScript** - 类型安全的 JavaScript 超集
- 🔥 **HMR** - 热模块替换，开发体验极佳
- 🚀 **@ldesign/launcher** - 统一的构建工具链

## 安装依赖

```bash
npm install
```

## 开发

启动开发服务器：

```bash
npm run dev
```

或使用 launcher 命令：

```bash
launcher dev
```

## 构建

构建生产版本：

```bash
npm run build
```

或使用 launcher 命令：

```bash
launcher build
```

## 预览

预览构建产物：

```bash
npm run preview
```

或使用 launcher 命令：

```bash
launcher preview
```

## 项目结构

```
qwik-demo/
├── src/
│   ├── components/
│   │   ├── counter.tsx      # 计数器组件
│   │   ├── counter.css      # 计数器样式
│   │   ├── hello-world.tsx  # Hello World 组件
│   │   └── hello-world.css  # Hello World 样式
│   ├── app.tsx              # 根组件
│   ├── entry.tsx            # 入口文件
│   └── global.css           # 全局样式
├── index.html               # HTML 模板
├── launcher.config.ts       # Launcher 配置
├── package.json             # 项目配置
└── tsconfig.json            # TypeScript 配置
```

## 了解更多

- [Qwik 文档](https://qwik.builder.io/)
- [Vite 文档](https://vitejs.dev/)
- [@ldesign/launcher 文档](../../README.md)

