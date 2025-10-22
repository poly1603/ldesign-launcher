# 🚀 从这里开始 - Launcher v1.1.2

## 欢迎使用 @ldesign/launcher！

v1.1.2 是**深度优化版本**，提供**极简、专业、高效**的开发体验。

## ⚡ 快速开始（5 分钟）

### 1. 构建 Launcher

```bash
cd tools/launcher
pnpm build
```

### 2. 在项目中使用

```bash
cd ../../apps/app

# 启动开发服务器（极简输出）
pnpm dev

# 构建项目
pnpm build

# 预览构建结果
pnpm preview
```

### 3. 享受极简输出！

```
🚀 LDesign Launcher - 🟢 DEVELOPMENT
📁 工作目录: /your/project
⚙️  模式: development

┌────────────────────────────────────┐
│  ✔ 开发服务器已启动                │
│  • 本地:  http://localhost:3330/   │
│  • 网络:  http://192.168.3.227:3330/│
│  • 提示: 按 Ctrl+C 停止服务器       │
└────────────────────────────────────┘

二维码（扫码在手机上打开）：
[二维码显示]
```

## 🎯 核心特性

### ✨ 零警告输出
- 彻底抑制 Node.js ESM 警告（16+ 条）
- 抑制 Vite CJS API 警告
- 专业、安静的开发环境

### 📱 移动端友好
- 自动显示局域网地址
- 终端二维码，扫码即访问
- 无需手动输入URL

### 🔧 三种模式

| 模式 | 命令 | 适用场景 |
|------|------|----------|
| **普通** | `launcher dev` | 日常开发 |
| **Debug** | `launcher dev --debug` | 问题排查 |
| **Silent** | `launcher dev --silent` | CI/CD |

## 📖 详细文档

### 快速查阅
- **新手指南**: [`QUICK_START_v1.1.1.md`](./QUICK_START_v1.1.1.md)
- **版本说明**: [`README_v1.1.1.md`](./README_v1.1.1.md)

### 优化报告
- **v1.1.1 优化**: [`OPTIMIZATION_SUMMARY.md`](./OPTIMIZATION_SUMMARY.md)
- **v1.1.2 深度优化**: [`V1.1.2_DEEP_OPTIMIZATION.md`](./V1.1.2_DEEP_OPTIMIZATION.md)
- **最终总结**: [`FINAL_SUMMARY_v1.1.2.md`](./FINAL_SUMMARY_v1.1.2.md)

### 技术文档
- **更新日志**: [`CHANGELOG.md`](./CHANGELOG.md)
- **项目说明**: [`README.md`](./README.md)

## 💡 常用命令

### 开发
```bash
# 基本启动
launcher dev

# 指定端口
launcher dev --port 8080

# 允许外部访问（显示二维码）
launcher dev --host 0.0.0.0

# 自动打开浏览器
launcher dev --open

# 调试模式（查看所有日志）
launcher dev --debug
```

### 构建
```bash
# 基本构建
launcher build

# 生成 sourcemap
launcher build --sourcemap

# 生成分析报告
launcher build --analyze
```

### 预览
```bash
# 预览构建结果
launcher preview

# 指定端口
launcher preview --port 4173

# 自动打开浏览器
launcher preview --open
```

### 诊断
```bash
# 系统健康检查
launcher doctor

# 检查端口占用
launcher doctor --port 5173

# 自动修复问题
launcher doctor --fix
```

## 🎨 输出效果

### 之前（v1.0.0）
- ❌ 30+ 行冗余日志
- ❌ 17+ 条警告信息
- ❌ 技术细节混乱
- ❌ URL 不明显

### 现在（v1.1.2）
- ✅ 3 行核心信息
- ✅ 零警告输出
- ✅ 专业简洁
- ✅ URL 和二维码突出

## 🐛 常见问题

### 端口被占用？
```bash
# 方法1: 自动诊断并修复
launcher doctor --port 5173 --fix

# 方法2: 使用其他端口
launcher dev --port 8080
```

### 需要调试信息？
```bash
# 使用 debug 模式查看所有日志
launcher dev --debug
```

### 依赖安装问题？
```bash
# 使用 doctor 检查
launcher doctor
```

## 🎁 额外功能

### 1. 智能诊断工具
- 自动检测端口占用
- 检查依赖安装
- 检查 Node.js 版本
- 检查系统资源
- 支持自动修复

### 2. 公共 UI 组件
- 精美的信息框
- 终端二维码
- 进度条
- 表格渲染

### 3. 警告管理系统
- 智能过滤警告
- 零干扰开发
- Debug 模式可查看

## 🚀 下一步

### 继续探索
1. 查看 [完整文档](./README.md)
2. 了解 [优化详情](./V1.1.2_DEEP_OPTIMIZATION.md)
3. 参考 [更新日志](./CHANGELOG.md)

### 参与贡献
1. 提交 Issue 反馈问题
2. 提交 PR 贡献代码
3. 分享使用体验

## 🎉 享受开发！

v1.1.2 提供了**极致的开发体验**，希望你喜欢！

---

**版本**: v1.1.2  
**发布日期**: 2025-01-22  
**开发团队**: LDesign Team  

**有问题？查看文档或提交 Issue！** 📚💬



