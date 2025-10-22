# 快速开始 - Launcher v1.1.1

## 🎉 新版本特性

v1.1.1 带来了全新的用户体验优化！

### 主要改进
- ✨ 全新的简洁日志输出
- 📱 突出显示 URL 和二维码
- 🎨 精美的信息框设计
- 🔧 完善的 debug 模式

## 📦 安装

```bash
pnpm add -D @ldesign/launcher
```

## 🚀 基本使用

### 1. 启动开发服务器

```bash
# 普通模式（简洁输出）
launcher dev
# 或
pnpm dev

# 指定端口
launcher dev --port 8080

# 自动打开浏览器
launcher dev --open

# 允许外部访问
launcher dev --host 0.0.0.0
```

**输出示例**:
```
🚀 LDesign Launcher - 🟢 DEVELOPMENT
📁 工作目录: /path/to/project
⚙️  模式: development

┌─────────────────────────────────────┐
│  ✔ 开发服务器已启动               │
│  • 本地: http://localhost:5173     │
│  • 网络: http://192.168.1.100:5173 │
│  • 提示: 按 Ctrl+C 停止服务器     │
└─────────────────────────────────────┘

二维码（扫码在手机上打开）：
┌────────────┐
│            │
│  ████████  │
│  ██    ██  │
│            │
└────────────┘
```

### 2. 构建项目

```bash
# 普通模式（简洁输出）
launcher build
# 或
pnpm build

# 指定输出目录
launcher build --outDir dist

# 生成 sourcemap
launcher build --sourcemap

# 生成构建报告
launcher build --report
```

**输出示例**:
```
🏗️  LDesign Launcher - 🔴 PRODUCTION
📁 工作目录: /path/to/project
⚙️  模式: production

正在执行生产构建...
构建成功完成! (2.34s)
输出: dist (1.23 MB)
```

### 3. 预览构建结果

```bash
# 普通模式（简洁输出）
launcher preview
# 或
pnpm preview

# 指定端口
launcher preview --port 4173

# 自动打开浏览器
launcher preview --open
```

**输出示例**:
```
👁️  LDesign Launcher - 🔴 PRODUCTION
📁 工作目录: /path/to/project
⚙️  模式: preview

┌─────────────────────────────────────┐
│  ✔ 预览服务器已启动               │
│  • 本地: http://localhost:4173     │
│  • 网络: http://192.168.1.100:4173 │
│  • 目录: /path/to/dist             │
│  • 提示: 按 Ctrl+C 停止服务器     │
└─────────────────────────────────────┘

二维码（扫码在手机上打开）：
...
```

## 🔧 调试模式

当你需要查看详细的技术信息时，使用 debug 模式：

```bash
# dev 命令 debug 模式
launcher dev --debug

# build 命令 debug 模式
launcher build --debug

# preview 命令 debug 模式
launcher preview --debug
```

**debug 模式输出示例**:
```
[09:29:38.123] 🔧 ConfigManager.loadConfig 开始
[09:29:38.456] 🔧 使用指定配置文件: .ldesign/launcher.config.ts
[09:29:39.012] 🔧 ViteLauncher.initialize 开始
[09:29:39.234] 🔧 加载配置文件...
[09:29:40.123] 🔧 ViteLauncher 初始化完成
[09:29:40.456] 🔧 应用别名配置...
...（完整的调试信息）
```

## 🤫 静默模式

如果你只想看到错误信息：

```bash
# 静默模式（只输出错误）
launcher dev --silent
launcher build --silent
launcher preview --silent
```

## ⚙️ 配置文件

创建 `.ldesign/launcher.config.ts`:

```typescript
import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0'
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: true
  },
  preview: {
    port: 4173,
    open: false
  }
})
```

## 📱 移动设备访问

v1.1.1 优化了移动设备访问体验：

1. **网络地址自动生成**: 启动服务器后自动显示局域网地址
2. **二维码显示**: 直接在终端显示二维码，扫码即可访问
3. **友好提示**: 清晰的使用提示和停止说明

**使用步骤**:
1. 启动开发服务器: `launcher dev --host 0.0.0.0`
2. 终端会显示网络地址和二维码
3. 用手机扫描二维码即可访问

## 🎯 常见场景

### 场景 1: 本地开发
```bash
launcher dev
```
简洁输出，快速启动。

### 场景 2: 团队协作（局域网访问）
```bash
launcher dev --host 0.0.0.0
```
团队成员可以通过网络地址或二维码访问。

### 场景 3: 移动端调试
```bash
launcher dev --host 0.0.0.0 --open
```
自动打开浏览器，手机扫码访问。

### 场景 4: 问题排查
```bash
launcher dev --debug
```
查看详细的调试信息。

### 场景 5: CI/CD 集成
```bash
launcher build --silent
```
静默构建，只输出错误。

## 🆚 模式对比

| 模式 | 时间戳 | Emoji | 技术细节 | 适用场景 |
|------|--------|-------|----------|----------|
| **普通** | ❌ | ✅ (部分) | ❌ | 日常开发 |
| **Debug** | ✅ | ✅ | ✅ | 问题排查 |
| **Silent** | ❌ | ❌ | ❌ | CI/CD |

## 💡 小贴士

### 1. 快速切换端口
```bash
# 端口被占用？自动尝试下一个
launcher dev
# 或指定端口
launcher dev --port 8080
```

### 2. 自动打开浏览器
```bash
launcher dev --open
# 或配置文件中设置
```

### 3. 强制重新构建依赖
```bash
launcher dev --force
```

### 4. 生成构建分析报告
```bash
launcher build --analyze
```

## 📚 更多资源

- [完整文档](./README.md)
- [优化总结](./OPTIMIZATION_SUMMARY.md)
- [优化完成报告](./OPTIMIZATION_COMPLETE.md)
- [更新日志](./CHANGELOG.md)

## 🐛 问题反馈

遇到问题？

1. 先尝试 debug 模式查看详细信息
2. 查看文档和 FAQ
3. 提交 Issue

## 🎉 享受新版本！

v1.1.1 带来了全新的用户体验，希望你喜欢！

---

**版本**: v1.1.1  
**更新日期**: 2025-01-22  
**开发团队**: LDesign Team

