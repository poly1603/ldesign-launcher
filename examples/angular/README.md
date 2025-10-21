# Angular + @ldesign/launcher 示例

🚀 这是一个使用 **Angular 17** 和 **@ldesign/launcher** 构建的现代化 Web 应用示例项目。

## 📖 项目简介

本项目展示了如何使用最新的 Angular 特性（如独立组件、信号系统等）结合 @ldesign/launcher 统一的开发工具链来构建高效的现代化 Web 应用。

### ✨ 主要特性

- 🅰️ **Angular 17** - 采用最新的 Angular 框架和独立组件架构
- ⚡ **极速开发** - 基于 Vite 的快速热重载和构建
- 📘 **TypeScript** - 完整的类型安全支持
- 🎨 **主题切换** - 内置明暗主题系统，支持用户偏好保存
- 📱 **响应式设计** - 移动端友好的界面适配
- 🔧 **开箱即用** - 预配置的开发工具和构建流程
- 🏗️ **现代化架构** - 独立组件、路由懒加载等最佳实践

## 🛠️ 技术栈

### 前端框架
- **Angular 17** - 现代化 Web 应用框架
- **TypeScript 5.2** - 类型安全的 JavaScript
- **RxJS 7.8** - 响应式编程库

### 构建工具
- **Vite 5.0** - 下一代前端构建工具  
- **@ldesign/launcher** - 统一的开发工具链
- **ESBuild** - 极速 JavaScript 构建器

### 开发工具
- **ESLint** - 代码质量检测
- **Prettier** - 代码格式化
- **SCSS** - CSS 预处理器

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 7.0.0

### 安装依赖

```bash
# 进入项目目录
cd examples/angular

# 安装依赖
pnpm install
```

### 开发模式

```bash
# 启动开发服务器
pnpm dev

# 应用将在 http://localhost:5173 启动
```

### 构建项目

```bash
# 构建生产版本
pnpm build

# 生产文件将输出到 dist/ 目录
```

### 预览构建

```bash
# 预览生产构建
pnpm preview

# 预览服务将在 http://localhost:4173 启动
```

### 类型检查

```bash
# 运行 TypeScript 类型检查
pnpm typecheck
```

## 📁 项目结构

```
angular/
├── src/
│   ├── app/
│   │   ├── components/          # 应用组件
│   │   │   ├── header/         # 页头组件
│   │   │   ├── footer/         # 页脚组件
│   │   │   ├── home/           # 首页组件
│   │   │   └── about/          # 关于页组件
│   │   ├── app.component.ts    # 根组件
│   │   ├── app.component.scss  # 根组件样式
│   │   └── app.routes.ts       # 路由配置
│   ├── styles/
│   │   └── global.scss         # 全局样式和主题变量
│   └── main.ts                 # 应用入口
├── index.html                  # HTML 模板
├── launcher.config.ts          # Launcher 配置
├── tsconfig.json              # TypeScript 配置
├── package.json               # 依赖和脚本
└── README.md                  # 项目文档
```

## 🎯 功能特性

### 🔄 主题切换
- 支持明暗主题自动切换
- 用户偏好本地存储
- 流畅的主题过渡动画

### 📱 响应式设计
- 移动端优先的设计理念
- 灵活的布局和组件适配
- 优化的触摸交互体验

### 🧭 路由导航
- 基于 Angular Router 的 SPA 导航
- 懒加载的路由组件
- 优雅的页面切换效果

### 🎮 交互演示
- 实时状态管理演示
- 计数器功能展示
- 动态时间显示

## ⚙️ 配置说明

### Launcher 配置

项目使用 `launcher.config.ts` 文件进行构建配置：

```typescript
import { defineConfig } from '@ldesign/launcher';

export default defineConfig({
  // Angular 构建特定配置
  build: {
    target: 'es2020',
    minify: 'esbuild',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['@angular/core', '@angular/common', '@angular/platform-browser'],
          rxjs: ['rxjs']
        }
      }
    }
  },
  
  // 开发服务器配置
  server: {
    port: 5173,
    host: true,
    open: true,
  },
  
  // 优化配置
  optimizeDeps: {
    include: [
      '@angular/core',
      '@angular/common',
      '@angular/platform-browser',
      '@angular/platform-browser-dynamic',
      '@angular/router',
      'rxjs',
      'zone.js'
    ]
  }
});
```

### TypeScript 配置

项目配置了 Angular 17 推荐的 TypeScript 设置：

- 启用装饰器支持
- 严格的类型检查
- ES2022 目标输出
- 独立组件支持

## 🎨 样式系统

### CSS 变量系统
项目使用完整的 CSS 变量系统，支持：

- 颜色主题（主要色彩、语义色彩）
- 间距系统（xs, sm, md, lg, xl 等）
- 字体系统（大小、粗细、行高）
- 圆角和阴影效果
- 过渡动画配置

### 主题切换
支持明暗两种主题，通过 `data-theme` 属性控制：

```scss
:root {
  --primary-color: #3b82f6;
  --background-color: #ffffff;
}

[data-theme="dark"] {
  --primary-color: #60a5fa;
  --background-color: #111827;
}
```

## 📚 学习资源

- [Angular 官方文档](https://angular.io/)
- [Vite 构建工具文档](https://vitejs.dev/)
- [TypeScript 语言文档](https://typescript.org/)
- [@ldesign/launcher 文档](#)

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出功能建议！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 🐛 问题反馈

如果你发现了 bug 或有功能建议，请：

1. 检查是否已有相关 issue
2. 创建详细的 issue 描述
3. 提供复现步骤和环境信息

## 📄 许可证

本项目基于 [MIT 许可证](../../LICENSE) 开源发布。

## 💡 致谢

感谢以下开源项目和团队：

- Angular 团队提供的优秀框架
- Vite 团队的高性能构建工具
- TypeScript 团队的类型安全支持
- 所有开源贡献者的无私奉献

---

**Happy Coding!** 🎉
