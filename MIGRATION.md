# 迁移指南

## v2.x → v3.0 升级指南

本指南帮助您从 `Launcher` 迁移到 `ViteLauncher`。

---

## ⚠️ 重要变更

### Launcher 类已弃用

`Launcher` 类已在 **v2.1.0** 标记为 deprecated，将在 **v3.0.0** 完全移除。

**原因：**
- ViteLauncher 功能更完整（1856 行 vs 449 行）
- ViteLauncher 包含配置热更新、SSL、代理等高级特性
- 减少维护成本和代码冗余
- 统一 API 体验

---

## 🔄 快速迁移

### 基本用法

迁移非常简单，只需更改类名：

**之前（Launcher）：**
```typescript
import { Launcher } from '@ldesign/launcher'

const launcher = new Launcher({
  cwd: process.cwd(),
  environment: 'development'
})

await launcher.startDev()
```

**之后（ViteLauncher）：**
```typescript
import { ViteLauncher } from '@ldesign/launcher'

const launcher = new ViteLauncher({
  cwd: process.cwd(),
  environment: 'development'
})

await launcher.startDev()
```

---

## 📋 API 对照表

### 构造函数

| Launcher | ViteLauncher | 说明 |
|----------|--------------|------|
| `new Launcher(options)` | `new ViteLauncher(options)` | ✅ 完全兼容 |

### 核心方法

| Launcher | ViteLauncher | 说明 |
|----------|--------------|------|
| `startDev(config?)` | `startDev(config?)` | ✅ 完全兼容 |
| `stopDev()` | `stopDev()` | ✅ 完全兼容 |
| `restartDev()` | `restartDev()` | ✅ 完全兼容 |
| `build(config?)` | `build(config?)` | ✅ 完全兼容 |
| `buildWatch(config?)` | `buildWatch(config?)` | ✅ 完全兼容 |
| `preview(config?)` | `preview(config?)` | ✅ 完全兼容 |

### 配置方法

| Launcher | ViteLauncher | 说明 |
|----------|--------------|------|
| `mergeConfig()` | `mergeConfig()` | ✅ 完全兼容 |
| `validateConfig()` | `validateConfig()` | ✅ 完全兼容 |
| `loadConfig()` | `loadConfig()` | ✅ 完全兼容 |
| `getConfig()` | `getConfig()` | ✅ 完全兼容 |

### 插件方法

| Launcher | ViteLauncher | 说明 |
|----------|--------------|------|
| `addPlugin()` | `addPlugin()` | ✅ 完全兼容 |
| `removePlugin()` | `removePlugin()` | ✅ 完全兼容 |
| `getPlugins()` | `getPlugins()` | ✅ 完全兼容 |

### 生命周期钩子

| Launcher | ViteLauncher | 说明 |
|----------|--------------|------|
| `onReady()` | `onReady()` | ✅ 完全兼容 |
| `onError()` | `onError()` | ✅ 完全兼容 |
| `onClose()` | `onClose()` | ✅ 完全兼容 |

### 状态方法

| Launcher | ViteLauncher | 说明 |
|----------|--------------|------|
| `getStatus()` | `getStatus()` | ✅ 完全兼容 |
| `isRunning()` | `isRunning()` | ✅ 完全兼容 |

### 额外功能（ViteLauncher 独有）

| 方法 | 说明 |
|------|------|
| `getStats()` | 获取统计信息 |
| `getPerformanceMetrics()` | 获取性能指标 |
| `getServerInfo()` | 获取服务器详细信息 |
| `destroy()` | 清理资源 |

---

## 🎯 迁移示例

### 示例 1：基本开发服务器

**之前：**
```typescript
import { Launcher } from '@ldesign/launcher'

const launcher = new Launcher()
await launcher.startDev()
```

**之后：**
```typescript
import { ViteLauncher } from '@ldesign/launcher'

const launcher = new ViteLauncher()
await launcher.startDev()
```

---

### 示例 2：自定义配置

**之前：**
```typescript
import { Launcher } from '@ldesign/launcher'

const launcher = new Launcher({
  cwd: process.cwd(),
  config: {
    server: {
      port: 3000,
      open: true
    }
  }
})

await launcher.startDev()
```

**之后：**
```typescript
import { ViteLauncher } from '@ldesign/launcher'

const launcher = new ViteLauncher({
  cwd: process.cwd(),
  config: {
    server: {
      port: 3000,
      open: true
    }
  }
})

await launcher.startDev()
```

---

### 示例 3：生命周期钩子

**之前：**
```typescript
import { Launcher } from '@ldesign/launcher'

const launcher = new Launcher()

launcher.onReady(() => {
  console.log('Server ready!')
})

launcher.onError((error) => {
  console.error('Error:', error)
})

await launcher.startDev()
```

**之后：**
```typescript
import { ViteLauncher } from '@ldesign/launcher'

const launcher = new ViteLauncher()

launcher.onReady(() => {
  console.log('Server ready!')
})

launcher.onError((error) => {
  console.error('Error:', error)
})

await launcher.startDev()
```

---

### 示例 4：构建和预览

**之前：**
```typescript
import { Launcher } from '@ldesign/launcher'

const launcher = new Launcher()

// 构建
await launcher.build()

// 预览
await launcher.preview()
```

**之后：**
```typescript
import { ViteLauncher } from '@ldesign/launcher'

const launcher = new ViteLauncher()

// 构建
await launcher.build()

// 预览
await launcher.preview()
```

---

## 🔧 配置文件迁移

配置文件无需修改，完全兼容！

```typescript
// launcher.config.ts - 无需修改
import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
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

---

## 📦 package.json 更新

### 1. 导入语句

查找并替换所有导入语句：

```bash
# 使用 VS Code 全局搜索
# 查找: import { Launcher }
# 替换: import { ViteLauncher }
```

### 2. 类型定义

如果使用了类型注解：

```typescript
// 之前
const launcher: Launcher = new Launcher()

// 之后
const launcher: ViteLauncher = new ViteLauncher()
```

---

## ✅ 迁移检查清单

完成迁移后，请检查以下项目：

- [ ] 所有 `import { Launcher }` 已改为 `import { ViteLauncher }`
- [ ] 所有 `new Launcher()` 已改为 `new ViteLauncher()`
- [ ] 类型注解已更新（如果使用）
- [ ] 运行测试确保功能正常
- [ ] 检查 dev、build、preview 命令是否正常工作
- [ ] 验证配置热更新功能（如果使用）

---

## 🆘 常见问题

### Q: 迁移后是否需要修改配置文件？

**A:** 不需要！所有配置完全兼容。

---

### Q: ViteLauncher 是否支持所有 Launcher 的功能？

**A:** 是的，并且提供更多功能：
- ✅ 配置热更新
- ✅ HTTPS/SSL 支持
- ✅ 智能代理配置
- ✅ 性能监控
- ✅ 统计信息
- ✅ 更好的错误处理

---

### Q: 迁移需要多长时间？

**A:** 通常 5-10 分钟即可完成：
1. 全局搜索替换导入语句（1 分钟）
2. 更新类型注解（2 分钟）
3. 运行测试验证（5 分钟）

---

### Q: 迁移后遇到问题怎么办？

**A:** 
1. 检查 [GitHub Issues](https://github.com/ldesign/launcher/issues)
2. 查看 [文档](https://ldesign.github.io/launcher/)
3. 提交新的 Issue 获取帮助

---

## 📅 时间表

| 版本 | 时间 | 状态 |
|------|------|------|
| v2.1.0 | 2025-11 | ✅ Launcher 标记为 deprecated |
| v2.2.0 | 2025-12 | ⚠️ 使用 Launcher 时显示警告 |
| v3.0.0 | 2026-01 | 🗑️ 完全移除 Launcher |

**建议：** 请在 v3.0.0 发布前完成迁移。

---

## 🔗 相关资源

- [ViteLauncher API 文档](./docs/api/ViteLauncher.md)
- [配置参考](./docs/config/README.md)
- [示例项目](./examples/)
- [更新日志](./CHANGELOG.md)

---

## 💡 获得帮助

如果您在迁移过程中遇到任何问题：

1. **查看文档**: [https://ldesign.github.io/launcher/](https://ldesign.github.io/launcher/)
2. **提交 Issue**: [GitHub Issues](https://github.com/ldesign/launcher/issues)
3. **讨论社区**: [GitHub Discussions](https://github.com/ldesign/launcher/discussions)

---

*最后更新: 2025-11-17*
