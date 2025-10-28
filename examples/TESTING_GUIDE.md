# 示例项目测试指南

## 快速开始

### 测试单个项目

```powershell
# 进入项目目录
cd D:\WorkBench\ldesign\tools\launcher\examples\react-demo

# 启动dev服务器
pnpm run dev

# 在浏览器中访问 http://localhost:3000
```

### 测试build

```powershell
# 构建项目
pnpm run build

# 检查dist目录
ls dist
```

### 测试preview

```powershell
# 预览构建后的项目
pnpm run preview

# 在浏览器中访问 http://localhost:4173
```

## 所有项目端口列表

| 项目 | Dev端口 | Preview端口 | 框架 |
|------|---------|-------------|------|
| react-demo | 3000 | 4173 | React 18 |
| vue3-demo | 3000 | 4173 | Vue 3 |
| vue2-demo | 3000 | 4173 | Vue 2 |
| solid-demo | 3000 | 4173 | Solid.js |
| lit-demo | 3000 | 4173 | Lit |
| preact-demo | 3000 | 4173 | Preact |
| angular-demo | 4200 | 4173 | Angular 17 |
| svelte-demo | 5173 | 4173 | Svelte 4 |
| qwik-demo | 5173 | 4173 | Qwik |

## 自动化测试

### 测试所有项目

```powershell
cd D:\WorkBench\ldesign\tools\launcher

# 运行完整测试
.\test-all-examples.ps1
```

此脚本会自动：
1. 启动每个项目的dev服务器
2. 验证HTTP访问
3. 执行构建
4. 启动preview服务器
5. 验证preview访问
6. 生成测试报告

### 测试单个项目（带自动验证）

```powershell
cd D:\WorkBench\ldesign\tools\launcher

# 测试react-demo
.\test-dev.ps1 -ProjectPath "D:\WorkBench\ldesign\tools\launcher\examples\react-demo" -Port 3000
```

## 常见问题

### Q: Dev服务器启动后无法访问？

A: 确保配置中包含 `host: '0.0.0.0'`：

```typescript
server: {
  host: '0.0.0.0',
  port: 3000,
  open: false
}
```

### Q: 端口被占用？

A: 检查并杀掉占用端口的进程：

```powershell
# 查看占用端口3000的进程
netstat -ano | findstr ":3000"

# 杀掉进程 (替换PID)
taskkill /PID <PID> /F
```

### Q: Build失败？

A: 确保已安装依赖：

```powershell
# 在项目根目录运行
pnpm install
```

### Q: Preview无法启动？

A: 确保先执行build：

```powershell
pnpm run build
pnpm run preview
```

## 预期结果

### Dev服务器

- ✅ 服务器成功启动
- ✅ 显示本地和网络URL
- ✅ 浏览器可以访问
- ✅ 页面正确渲染
- ✅ HMR热更新工作正常

### Build

- ✅ 构建成功完成
- ✅ 生成dist目录
- ✅ 包含index.html和assets
- ✅ 无错误或警告

### Preview

- ✅ Preview服务器启动
- ✅ 浏览器可以访问
- ✅ 页面与dev版本一致
- ✅ 所有资源正确加载

## 手动测试清单

针对每个项目，手动验证：

- [ ] Dev服务器启动
- [ ] 浏览器访问dev
- [ ] 页面内容正确
- [ ] 交互功能正常
- [ ] HMR更新工作
- [ ] Build成功
- [ ] Preview启动
- [ ] 浏览器访问preview
- [ ] Preview页面正常

## 性能基准

预期的启动和构建时间（参考值）：

| 操作 | 预期时间 |
|------|----------|
| Dev服务器启动 | 2-5秒 |
| 首次页面加载 | < 1秒 |
| HMR更新 | < 500ms |
| Build构建 | 3-10秒 |
| Preview启动 | 1-2秒 |

## 报告问题

如果遇到问题，请收集以下信息：

1. 项目名称
2. 操作系统和版本
3. Node.js版本 (`node --version`)
4. pnpm版本 (`pnpm --version`)
5. 错误信息（完整）
6. 复现步骤

## 更新日志

- 2025-10-28: 初始版本
- 修复所有项目的host配置
- 添加自动化测试脚本
