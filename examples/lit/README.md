# Lit Web Components 示例

这是一个使用 Lit 框架和 @ldesign/launcher 工具链的示例项目，展示了如何创建现代化的 Web Components 应用。

## 项目特性

- ✨ **Lit Web Components**: 使用最新的 Lit 框架构建可复用组件
- 🎨 **TypeScript 支持**: 完整的 TypeScript 类型检查和智能提示
- 🌙 **主题切换**: 内置浅色/深色主题支持
- 📦 **零配置构建**: 使用 @ldesign/launcher 实现开箱即用的开发体验
- 🚀 **热重载**: 开发过程中自动刷新和更新
- 🎯 **现代 CSS**: 使用 CSS 自定义属性和现代布局

## 项目结构

```
lit/
├── src/
│   ├── components/           # Lit 组件
│   │   ├── app-shell.ts     # 主应用外壳
│   │   ├── counter-button.ts # 计数按钮组件
│   │   ├── theme-toggle.ts   # 主题切换组件
│   │   ├── feature-card.ts   # 特性卡片组件
│   │   └── index.ts         # 组件入口
│   ├── styles/              # 样式文件
│   │   └── main.css         # 主样式文件
│   └── main.ts              # 应用入口
├── index.html               # HTML 模板
├── launcher.config.ts       # Launcher 配置
├── package.json             # 项目配置
├── tsconfig.json           # TypeScript 配置
└── tsconfig.node.json      # Node.js TypeScript 配置
```

## 组件说明

### AppShell (app-shell)
- 主应用外壳组件
- 管理全局主题状态
- 包含页面布局和导航

### CounterButton (counter-button)
- 交互式计数按钮
- 展示状态管理和事件处理
- 使用了 Lit 的装饰器语法

### ThemeToggle (theme-toggle)
- 主题切换开关
- 支持浅色/深色模式
- 通过自定义事件传递状态

### FeatureCard (feature-card)
- 可复用的特性展示卡片
- 支持图标、标题、描述属性
- 响应式设计

## 开发命令

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
# 或者
launcher dev
```

### 构建生产版本
```bash
npm run build
# 或者
launcher build
```

### 预览生产构建
```bash
npm run preview
# 或者
launcher preview
```

## 技术栈

- **框架**: Lit 3.x
- **语言**: TypeScript 5.x
- **构建工具**: @ldesign/launcher (基于 Vite)
- **样式**: CSS 3 (自定义属性)
- **开发体验**: 热重载、类型检查、代码分割

## Lit 特性展示

### 装饰器
- `@customElement()`: 定义自定义元素
- `@property()`: 响应式属性
- `@state()`: 内部状态管理

### 模板系统
- `html` 模板标签
- 事件绑定 (`@click`)
- 属性绑定
- 条件渲染

### 样式
- `css` 模板标签
- Shadow DOM 样式隔离
- CSS 自定义属性支持

### 生命周期
- 自动响应性
- 高效的更新机制
- Shadow DOM 封装

## 自定义配置

项目使用 `launcher.config.ts` 进行构建配置，支持：

- 开发服务器端口配置
- 构建输出目录配置
- 资源处理配置
- TypeScript 编译配置

## 浏览器兼容性

- Chrome 54+
- Firefox 63+
- Safari 10.1+
- Edge 79+

支持所有现代浏览器，使用了标准的 Web Components API。

## 学习资源

- [Lit 官方文档](https://lit.dev/)
- [Web Components 标准](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [@ldesign/launcher 文档](../../README.md)
