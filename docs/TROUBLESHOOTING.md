# 故障排除指南

本文档列出了使用 @ldesign/launcher 时的常见问题和解决方案。

## 🔍 框架检测问题

### 问题：未检测到框架

```bash
⚠️ 未检测到任何已注册的框架
```

**原因**：
- 项目中没有安装框架依赖
- 框架注册系统未初始化

**解决方案**：

1. 确保已安装框架依赖（例如 react、vue、svelte 等）

2. 如果使用编程式 API，确保调用了 `bootstrap()`：
```typescript
import { bootstrap, Launcher } from '@ldesign/launcher'

// 必须先初始化
await bootstrap()

const launcher = new Launcher({ cwd: process.cwd() })
await launcher.startDev()
```

3. 显式指定框架类型：
```typescript
export default defineConfig({
  framework: {
    type: 'react'  // 强制使用 React
  }
})
```

### 问题：检测到错误的框架

**解决方案**：

在配置文件中显式指定正确的框架：

```typescript
import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: 'vue3',  // 显式指定
    options: {
      // 框架特定选项
    }
  }
})
```

## 🌐 端口问题

### 问题：端口被占用

```bash
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案**：

1. 修改配置文件中的端口：
```typescript
export default defineConfig({
  server: {
    port: 8080  // 使用不同端口
  }
})
```

2. 使用命令行选项：
```bash
launcher dev --port 8080
```

3. 启用自动端口选择：
```typescript
export default defineConfig({
  server: {
    strictPort: false  // 如果端口占用，自动尝试下一个
  }
})
```

### 问题：Preview 端口权限被拒绝

```bash
listen EACCES: permission denied ::1:4173
```

**原因**：
- Windows 防火墙或其他程序占用端口
- IPv6 地址绑定问题

**解决方案**：

1. 修改 host 和 port 配置：
```typescript
export default defineConfig({
  preview: {
    host: '0.0.0.0',  // 使用 IPv4
    port: 4174,       // 使用不同端口
    strictPort: false // 允许自动选择端口
  }
})
```

2. 以管理员权限运行（不推荐）

3. 检查防火墙设置，允许 Node.js 访问网络

## 📦 依赖问题

### 问题：找不到 Vite 插件

```bash
Error: Cannot find module '@vitejs/plugin-react'
```

**原因**：
框架对应的 Vite 插件未安装

**解决方案**：

根据框架安装对应的插件：

```bash
# React
npm install -D @vitejs/plugin-react

# Vue 3
npm install -D @vitejs/plugin-vue

# Vue 2
npm install -D @vitejs/plugin-vue2

# Svelte
npm install -D @sveltejs/vite-plugin-svelte

# Solid
npm install -D vite-plugin-solid

# Preact
npm install -D @preact/preset-vite

# Qwik
npm install -D @builder.io/qwik

# Lit
# Lit 不需要特殊插件，Vite 原生支持
```

### 问题：Vite CJS API 弃用警告

```bash
The CJS build of Vite's Node API is deprecated.
```

**说明**：
这是一个已知的兼容性警告，不影响功能。launcher 为了兼容更多环境被构建为 CJS 格式。

**可以忽略此警告**，或通过环境变量禁用：

```bash
export NODE_NO_WARNINGS=1
launcher dev
```

## 🔧 配置问题

### 问题：配置文件不生效

**检查清单**：

1. 确认配置文件路径正确：
   - `.ldesign/launcher.config.ts` （推荐）
   - `.ldesign/launcher.config.js`
   - `launcher.config.ts`（根目录）

2. 确认配置文件语法正确：
```typescript
import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  // 必须使用 export default
  server: {
    port: 3000
  }
})
```

3. 检查是否有 TypeScript 编译错误

4. 启用调试模式查看配置加载过程：
```bash
launcher dev --debug
```

### 问题：环境特定配置未加载

**配置文件命名规范**：

```bash
.ldesign/
├── launcher.config.ts              # 基础配置（必需）
├── launcher.config.development.ts  # 开发环境（可选）
└── launcher.config.production.ts   # 生产环境（可选）
```

**验证配置加载**：
```bash
launcher config list
```

## 🏗️ 构建问题

### 问题：构建失败，类型错误

```bash
error TS2322: Type 'X' is not assignable to type 'Y'
```

**解决方案**：

1. 确认 TypeScript 配置正确

2. 暂时跳过类型检查（不推荐）：
```typescript
export default defineConfig({
  build: {
    emptyOutDir: true,
    rollupOptions: {
      onwarn(warning, warn) {
        // 忽略某些警告
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return
        warn(warning)
      }
    }
  }
})
```

3. 修复类型定义或更新依赖版本

### 问题：构建产物过大

**解决方案**：

1. 启用代码分割：
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'utils': ['lodash', 'axios']
        }
      }
    }
  }
})
```

2. 启用压缩：
```typescript
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    }
  }
})
```

3. 分析构建产物：
```bash
launcher build --analyze
```

## 🚀 性能问题

### 问题：开发服务器启动慢

**解决方案**：

1. 减少预构建依赖：
```typescript
export default defineConfig({
  optimizeDeps: {
    exclude: ['some-large-package']
  }
})
```

2. 使用更快的依赖扫描：
```typescript
export default defineConfig({
  optimizeDeps: {
    entries: ['src/main.ts']  // 指定入口，减少扫描范围
  }
})
```

3. 禁用不必要的功能：
```typescript
export default defineConfig({
  server: {
    hmr: {
      overlay: false  // 禁用错误覆盖层
    }
  }
})
```

### 问题：热更新（HMR）慢

**解决方案**：

1. 减小监听文件范围：
```typescript
export default defineConfig({
  server: {
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**']
    }
  }
})
```

2. 使用更细粒度的更新：
```typescript
export default defineConfig({
  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost'
    }
  }
})
```

## 🐛 调试技巧

### 启用调试模式

```bash
launcher dev --debug
```

显示详细的日志信息，包括：
- 框架检测过程
- 配置加载详情
- 插件加载情况
- 性能统计

### 查看当前配置

```bash
launcher config list
```

### 检查版本信息

```bash
launcher --version
```

### 清理缓存

```bash
# 删除 node_modules/.vite
rm -rf node_modules/.vite

# 重新安装依赖
npm install
```

## 📞 获取帮助

如果以上方法都无法解决问题：

1. 查看 [GitHub Issues](https://github.com/ldesign/launcher/issues)
2. 提交新的 Issue，包含：
   - 错误信息和堆栈跟踪
   - launcher 版本（`launcher --version`）
   - Node.js 版本（`node --version`）
   - 操作系统信息
   - 最小可复现示例

3. 在 Issue 中添加调试日志：
```bash
launcher dev --debug > debug.log 2>&1
```

## 🎯 最佳实践

为避免常见问题，建议：

1. ✅ 始终使用最新版本的 launcher
2. ✅ 保持框架和插件版本同步
3. ✅ 使用 `.ldesign` 目录组织配置
4. ✅ 为不同环境创建独立配置文件
5. ✅ 启用 TypeScript 以获得更好的类型检查
6. ✅ 定期清理缓存和重新安装依赖
7. ✅ 使用调试模式排查问题
8. ✅ 查阅文档和示例项目
