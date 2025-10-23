# @ldesign/launcher 示例项目集合

这个目录包含了使用 `@ldesign/launcher` 的各种框架示例项目。

---

## 📁 可用示例

### 前端框架

#### 1. Vue 3 + TypeScript ⭐⭐⭐⭐⭐

**目录**: `vue3-typescript/`  
**特性**: SFC、Composition API、TypeScript、路径别名  
**适合**: Vue 3 新项目、企业级应用

```bash
cd vue3-typescript
pnpm install
launcher dev
```

#### 2. Vue 2

**目录**: `vue2/`  
**特性**: Options API、单文件组件  
**适合**: Vue 2 维护项目、迁移项目

```bash
cd vue2
pnpm install
launcher dev
```

#### 3. React + TypeScript ⭐⭐⭐⭐⭐

**目录**: `react-typescript/`  
**特性**: Hooks、TypeScript、Fast Refresh  
**适合**: React 新项目、现代 React 开发

```bash
cd react-typescript
pnpm install
launcher dev
```

#### 4. Angular

**目录**: `angular/`  
**特性**: 组件、服务、依赖注入  
**适合**: 企业级 Angular 应用

```bash
cd angular
pnpm install
launcher dev
```

#### 5. Svelte

**目录**: `svelte/`  
**特性**: 编译时优化、响应式  
**适合**: 高性能 Web 应用

```bash
cd svelte
pnpm install
launcher dev
```

#### 6. Lit

**目录**: `lit/`  
**特性**: Web Components、轻量级  
**适合**: 组件库、设计系统

```bash
cd lit
pnpm install
launcher dev
```

### 其他示例

#### 7. Vanilla TypeScript

**目录**: `vanilla/`  
**特性**: 纯 TypeScript、无框架  
**适合**: 学习、简单项目

```bash
cd vanilla
pnpm install
launcher dev
```

#### 8. TypeScript Library

**目录**: `typescript-library/`  
**特性**: 库模式、类型定义生成  
**适合**: NPM 包开发

```bash
cd typescript-library
pnpm install
launcher build
```

---

## 🎯 如何选择示例

### 按框架选择

| 框架 | 示例目录 | 推荐度 | 适用场景 |
|------|---------|--------|----------|
| Vue 3 | vue3-typescript | ⭐⭐⭐⭐⭐ | 现代 Vue 应用 |
| React | react-typescript | ⭐⭐⭐⭐⭐ | React 应用 |
| Angular | angular | ⭐⭐⭐⭐ | 企业应用 |
| Svelte | svelte | ⭐⭐⭐⭐ | 高性能应用 |
| Web Components | lit | ⭐⭐⭐ | 组件库 |
| 无框架 | vanilla | ⭐⭐⭐ | 简单项目 |
| NPM 包 | typescript-library | ⭐⭐⭐⭐⭐ | 库开发 |

### 按功能选择

| 功能 | 推荐示例 | 说明 |
|------|---------|------|
| 路径别名 | vue3-typescript | 完整的别名配置 |
| 代码分割 | react-typescript | 懒加载示例 |
| 环境配置 | vue3-typescript | 多环境配置 |
| 库模式 | typescript-library | NPM 包构建 |
| PWA | vue3-typescript | 渐进式Web应用 |

---

## 📖 学习路径

### 新手入门

1. **Vanilla** - 了解基本概念
2. **Vue 3** 或 **React** - 学习主流框架集成
3. **TypeScript Library** - 了解库模式

### 进阶学习

1. **多环境配置** - 查看 vue3-typescript 的环境配置
2. **性能优化** - 查看构建配置和代码分割
3. **插件开发** - 了解自定义插件

---

## 🛠️ 常用命令

### 开发命令

```bash
# 启动开发服务器
launcher dev

# 启用 HTTPS
launcher dev --https

# 自定义端口
launcher dev --port 8080

# 调试模式
launcher dev --debug
```

### 构建命令

```bash
# 生产构建
launcher build

# 库模式构建
launcher build --lib

# 分析构建产物
launcher build --analyze

# 生成类型定义
launcher build --dts
```

### 工具命令

```bash
# 项目诊断
launcher doctor

# 优化分析
launcher optimize --analyze

# 缓存管理
launcher cache list
launcher cache clear

# 配置管理
launcher config list
launcher config get server.port
launcher config set server.port 3001
```

---

## 🎨 自定义配置

### 开发服务器配置

```typescript
export default defineConfig({
  server: {
    // 端口
    port: 3000,
    
    // 主机（0.0.0.0 允许局域网访问）
    host: '0.0.0.0',
    
    // 自动打开浏览器
    open: true,
    
    // HTTPS
    https: true,
    
    // 代理
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
    
    // CORS
    cors: {
      origin: '*',
      credentials: true
    }
  }
})
```

### 构建优化配置

```typescript
export default defineConfig({
  build: {
    // 输出目录
    outDir: 'dist',
    
    // 资源目录
    assetsDir: 'assets',
    
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router'],
          utils: ['lodash-es', 'dayjs']
        }
      }
    },
    
    // 压缩
    minify: 'esbuild',
    
    // Source map
    sourcemap: true,
    
    // 清空输出目录
    emptyOutDir: true
  }
})
```

---

## 🚀 部署

### 静态部署

```bash
# 构建
launcher build

# 部署到静态服务器
launcher deploy --target static --provider netlify
```

### Docker 部署

```bash
# 生成 Dockerfile
launcher deploy --target docker --generate

# 构建镜像
docker build -t my-app .

# 运行容器
docker run -p 3000:80 my-app
```

---

## 💡 提示和技巧

### 1. 快速切换环境

```bash
# 开发环境
launcher dev --environment development

# 生产环境
launcher build --environment production

# 测试环境
launcher dev --environment test
```

### 2. 性能分析

```bash
# 启动性能监控
launcher monitor start

# 查看性能报告
launcher monitor report
```

### 3. 团队协作

```bash
# 生成配置模板
launcher init

# 导出配置
launcher config export > config.backup.json

# 导入配置
launcher config import config.backup.json
```

---

## 🤝 贡献

欢迎提交新的示例项目！请确保：

1. 包含完整的 README
2. 提供 launcher.config.ts 配置
3. 添加必要的注释
4. 通过测试验证

---

## 📞 获取帮助

- [GitHub Issues](https://github.com/ldesign/launcher/issues)
- [讨论区](https://github.com/ldesign/launcher/discussions)
- [文档](../../docs/README.md)

---

**最后更新**: 2025-01-24  
**维护者**: LDesign Team


