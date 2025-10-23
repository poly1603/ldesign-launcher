# v1.2.0 新功能指南

本指南介绍 `@ldesign/launcher` v1.2.0 新增的核心功能。

---

## 🌍 环境快速切换

### 功能介绍

快速切换和管理不同的开发环境配置，提升多环境开发效率。

### 使用方法

#### 查看当前环境

```bash
launcher env --current
```

输出:
```
📍 当前环境:
  ● development
```

#### 列出所有环境

```bash
launcher env --list
```

输出:
```
🌍 可用环境:
  ● development (launcher.development.config.ts)
  ● production (launcher.production.config.ts)
  ○ test (无配置文件)
  ○ staging (无配置文件)

💡 上次使用: development
```

#### 对比环境配置

```bash
launcher env --diff development production
```

输出:
```
📊 对比环境配置: development vs production

  发现 3 处差异:

  server.port:
    development: 3000
    production: undefined

  build.sourcemap:
    development: true
    production: false

  launcher.logLevel:
    development: "debug"
    production: "warn"
```

#### 验证环境配置

```bash
launcher env --validate
```

输出:
```
✅ 验证环境配置

  ✓ development (launcher.development.config.ts) - 有效
  ✗ production (launcher.production.config.ts) - 无效
    → server.port: 端口号必须在 1-65535 范围内
  ○ test - 无配置文件
```

#### 查看环境历史

```bash
launcher env --history
```

输出:
```
📜 环境切换历史:

  1. development - 2025-01-24 14:30:25
  2. production - 2025-01-24 12:15:10
  3. test - 2025-01-23 16:45:00
```

#### 设置当前环境

```bash
launcher env --set production
```

### 配置示例

```typescript
// .ldesign/launcher.development.config.ts
export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  launcher: {
    logLevel: 'debug',
    autoRestart: true
  }
})

// .ldesign/launcher.production.config.ts
export default defineConfig({
  build: {
    minify: true,
    sourcemap: false
  },
  launcher: {
    logLevel: 'warn'
  }
})
```

---

## 💾 构建缓存增强

### 功能介绍

智能的增量构建缓存系统，显著提升构建速度。

### 核心特性

- ✅ **增量缓存** - 只缓存变更的文件
- ✅ **智能清理** - 自动清理过期和低命中率缓存
- ✅ **缓存预热** - 提前缓存常用文件
- ✅ **命中率统计** - 实时查看缓存效果

### 使用方法

#### 查看缓存状态

```bash
launcher cache status
```

输出:
```
📊 缓存状态:

  总条目: 156
  总大小: 45.2 MB
  命中次数: 892
  未命中次数: 134
  命中率: 86.9%
  最旧条目: 2025-01-20 10:30:15
  最新条目: 2025-01-24 14:25:40
```

#### 缓存统计

```bash
launcher cache stats
```

#### 预热缓存

```bash
# 预热常用文件
launcher cache warmup

# 预热指定文件
launcher cache warmup --files "src/**/*.ts,src/**/*.vue"
```

#### 清理过期缓存

```bash
launcher cache prune
```

输出:
```
清理了 23 个过期缓存
缓存空间释放: 8.5 MB
```

#### 清空所有缓存

```bash
launcher cache clear
```

### 自动化使用

缓存会在构建时自动使用，无需额外配置：

```bash
# 第一次构建（冷启动）
launcher build
# 构建时间: 45秒

# 第二次构建（使用缓存）
launcher build
# 构建时间: 12秒 (↓ 73%)
```

---

## 🔥 热重载增强

### 功能介绍

更稳定、更智能的热模块替换 (HMR)，自动处理失败情况。

### 核心特性

- ✅ **失败自动回退** - HMR 失败时自动全量刷新
- ✅ **性能统计** - 实时查看 HMR 性能
- ✅ **错误恢复** - 自动重试机制
- ✅ **调试模式** - 详细的 HMR 日志

### 使用方法

#### 启用 HMR 增强

```typescript
// launcher.config.ts
import { defineConfig } from '@ldesign/launcher'
import { createHMREnhancedPlugin } from '@ldesign/launcher/plugins/hmr-enhanced'

export default defineConfig({
  plugins: [
    createHMREnhancedPlugin({
      // 失败时自动全量刷新
      fallbackToFullReload: true,
      
      // 重试次数
      retries: 3,
      
      // 显示统计信息
      showStats: true,
      
      // 启用调试
      debug: false,
      
      // 超时时间
      timeout: 5000
    })
  ]
})
```

#### 查看 HMR 统计

```bash
launcher dev --hmr-stats
```

控制台输出:
```
HMR 统计: 156/168 成功 (92.9%), 平均 45ms
HMR 统计: 157/169 成功 (92.9%), 平均 44ms
...
```

#### 调试 HMR 问题

```bash
launcher dev --hmr-debug
```

控制台输出:
```
[HMR] 更新成功，耗时: 42ms
[HMR] 模块: src/components/Button.vue
[HMR] 影响的模块: 3 个
```

### 行为说明

#### 正常 HMR 流程

```
文件变更 → HMR 更新 → 页面局部刷新 → 状态保持 ✅
```

#### HMR 失败时（启用回退）

```
文件变更 → HMR 失败 → 自动全量刷新 → 页面重新加载 ✅
```

#### HMR 失败时（未启用回退）

```
文件变更 → HMR 失败 → 显示错误遮罩 → 手动刷新 ⚠️
```

### 客户端 API

```typescript
// 在你的代码中
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    console.log('HMR 更新开始')
  })

  import.meta.hot.on('vite:afterUpdate', () => {
    console.log('HMR 更新完成')
  })

  import.meta.hot.on('vite:error', (error) => {
    console.error('HMR 失败:', error)
    // 增强插件会自动处理
  })
}
```

---

## ⚡ 开发服务器增强

### 功能介绍

更智能的开发服务器，自动端口分配、健康检查、浏览器控制。

### 核心特性

- ✅ **自动端口分配** - 端口被占用时自动查找可用端口
- ✅ **健康检查** - 定期检查服务器状态
- ✅ **多浏览器支持** - 指定浏览器打开
- ✅ **隐私模式** - 支持隐身/无痕模式

### 使用方法

#### 自动端口分配

```bash
# 自动选择 3000-3100 范围内的可用端口
launcher dev --auto-port
```

输出:
```
端口 3000 被占用，自动查找可用端口...
找到可用端口: 3001

🚀 开发服务器已启动
📍 本地地址: http://localhost:3001
```

#### 指定浏览器

```bash
# 在 Chrome 中打开
launcher dev --browser chrome

# 在 Edge 中打开
launcher dev --browser edge

# 在 Firefox 中打开
launcher dev --browser firefox
```

#### 隐私模式

```bash
# Chrome 隐身模式
launcher dev --browser chrome --incognito

# Edge InPrivate 模式
launcher dev --browser edge --incognito
```

#### 健康检查

```bash
launcher dev --health-check
```

控制台会定期输出:
```
服务器健康检查通过 ✓
服务器健康检查通过 ✓
```

### 配置示例

```typescript
export default defineConfig({
  server: {
    port: 3000,
    strictPort: false  // 端口被占用时自动使用下一个
  },
  
  launcher: {
    server: {
      // 自动端口范围
      autoPortRange: [3000, 3100],
      
      // QR 码配置
      qrCode: {
        enabled: true,
        showNetworkUrls: true
      },
      
      // 健康检查
      healthCheck: {
        enabled: true,
        interval: 30000  // 30秒检查一次
      },
      
      // 浏览器配置
      browser: {
        name: 'chrome',
        incognito: false
      }
    }
  }
})
```

### API 使用

```typescript
import { createServerEnhanced } from '@ldesign/launcher/utils/server-enhanced'

const serverEnhanced = createServerEnhanced({
  autoPortRange: [3000, 3100],
  healthCheck: true,
  browser: {
    name: 'chrome',
    incognito: true
  }
})

// 自动分配端口
const port = await serverEnhanced.allocatePort(3000)

// 启动健康检查
serverEnhanced.startHealthCheck(server)

// 在浏览器中打开
await serverEnhanced.openBrowser('http://localhost:3000')

// 清理
serverEnhanced.destroy()
```

---

## 🎯 实际应用场景

### 场景 1: 多人开发避免端口冲突

```bash
# 团队成员A
launcher dev --auto-port  # 自动分配到 3000

# 团队成员B
launcher dev --auto-port  # 自动分配到 3001

# 团队成员C
launcher dev --auto-port  # 自动分配到 3002
```

### 场景 2: 多环境开发

```bash
# 早上开发新功能
launcher dev --env development

# 下午测试集成
launcher env --set test
launcher dev  # 自动使用 test 环境

# 晚上验证生产配置
launcher env --set production
launcher build  # 使用生产环境配置
```

### 场景 3: HMR 稳定性

```typescript
// 配置文件
export default defineConfig({
  plugins: [
    createHMREnhancedPlugin({
      fallbackToFullReload: true,  // 失败自动刷新
      showStats: true,              // 显示统计
      retries: 3                    // 重试 3 次
    })
  ]
})
```

开发时:
- HMR 成功 → 局部刷新，保持状态 ✅
- HMR 失败 → 自动全量刷新 ✅
- 不会卡在错误状态 ✅

### 场景 4: 构建性能优化

```bash
# 第一次构建（建立缓存）
launcher build
# 耗时: 45秒

# 小改动后重新构建（使用缓存）
launcher build
# 耗时: 12秒 (↓ 73%) 🚀

# 查看缓存效果
launcher cache stats
# 命中率: 86.9%
```

---

## 💡 最佳实践

### 1. 环境管理

```bash
# 开发前先检查环境
launcher env --current

# 切换到正确的环境
launcher env --set development

# 验证配置正确
launcher env --validate

# 然后启动
launcher dev
```

### 2. 缓存管理

```bash
# 定期清理过期缓存
launcher cache prune

# 遇到奇怪问题时清空缓存
launcher cache clear

# 大版本升级后预热缓存
launcher cache warmup
```

### 3. HMR 调试

```bash
# HMR 不稳定时启用调试
launcher dev --hmr-debug

# 查看 HMR 统计找出问题
launcher dev --hmr-stats
```

### 4. 自动端口

```bash
# 团队开发时启用自动端口
launcher dev --auto-port

# 配置首选端口范围
```

```typescript
export default defineConfig({
  launcher: {
    server: {
      autoPortRange: [3000, 3020]  // 只在这个小范围内查找
    }
  }
})
```

---

## 🆘 故障排查

### 问题：环境切换不生效

```bash
# 清除配置缓存
launcher cache clear

# 验证环境配置
launcher env --validate

# 查看当前使用的环境
launcher env --current
```

### 问题：HMR 总是全量刷新

检查配置:
```typescript
createHMREnhancedPlugin({
  fallbackToFullReload: false  // 禁用自动回退
})
```

或查看 HMR 统计找出失败原因:
```bash
launcher dev --hmr-debug
```

### 问题：端口分配失败

```bash
# 查看端口范围配置
launcher config get launcher.server.autoPortRange

# 扩大端口范围
launcher config set launcher.server.autoPortRange [3000,4000]
```

---

## 📚 更多资源

- [配置参考](../config/README.md)
- [API 文档](../api/README.md)
- [最佳实践](./BEST_PRACTICES.md)
- [性能优化指南](./PERFORMANCE_GUIDE.md)

---

**最后更新**: 2025-01-24  
**适用版本**: v1.2.0+

