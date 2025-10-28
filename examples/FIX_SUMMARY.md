# 示例项目修复总结

## 问题描述

之前所有示例项目的dev服务器启动后无法通过浏览器访问，报错 `ERR_CONNECTION_REFUSED`。

## 根本原因

Vite开发服务器在Windows上默认只绑定到IPv6地址 `[::1]`，而不是同时绑定IPv4和IPv6。当浏览器尝试使用IPv4地址（`127.0.0.1`）访问`localhost`时，连接被拒绝。

## 解决方案

在所有示例项目的 `launcher.config.ts` 中添加 `host: '0.0.0.0'` 配置，使服务器同时监听所有网络接口（包括IPv4和IPv6）。

### 修改内容

**修改前：**
```typescript
server: {
  port: 3000,
  open: true
}
```

**修改后：**
```typescript
server: {
  host: '0.0.0.0',  // 添加此行，监听所有网络接口
  port: 3000,
  open: false        // 改为false，避免自动打开浏览器
}
```

## 修复的项目列表

已修复以下所有示例项目：

1. ✅ **react-demo** - 端口 3000
2. ✅ **vue3-demo** - 端口 3000
3. ✅ **vue2-demo** - 端口 3000
4. ✅ **solid-demo** - 端口 3000
5. ✅ **lit-demo** - 端口 3000
6. ✅ **preact-demo** - 端口 3000
7. ✅ **angular-demo** - 端口 4200
8. ✅ **svelte-demo** - 端口 5173
9. ✅ **qwik-demo** - 端口 5173

## 测试验证

### 手动测试

已通过浏览器访问验证 `react-demo` 项目：
- ✅ Dev服务器成功启动
- ✅ 浏览器可以正常访问 http://localhost:3000
- ✅ 页面正常渲染
- ✅ 交互功能正常（计数器点击测试通过）
- ✅ HMR热更新正常工作

### 自动化测试

提供了完整的测试脚本 `test-all-examples.ps1`，可以自动测试所有项目的：
- Dev服务器启动
- HTTP访问性
- Build构建
- Preview预览

### 使用测试脚本

```powershell
# 测试所有项目
.\test-all-examples.ps1

# 测试单个项目
.\test-dev.ps1 -ProjectPath "D:\WorkBench\ldesign\tools\launcher\examples\react-demo" -Port 3000
```

## 额外说明

### 为什么使用 0.0.0.0 而不是 127.0.0.1?

- `0.0.0.0` - 监听所有网络接口（包括localhost、本地IP等）
- `127.0.0.1` - 只监听IPv4 localhost
- `localhost` - 在Windows上可能只解析为IPv6的 `::1`

使用 `0.0.0.0` 确保服务器可以通过任何方式访问（localhost, 127.0.0.1, 本地IP等）。

### 安全性说明

在开发环境中使用 `0.0.0.0` 是安全的，因为：
1. 这只是开发服务器，不是生产环境
2. Windows防火墙会默认保护本地网络
3. 如果有安全顾虑，可以改用 `127.0.0.1`，但需要确保浏览器使用IPv4访问

## 后续工作

所有示例项目现在应该可以：
- ✅ 正常启动dev服务器
- ✅ 通过浏览器访问
- ✅ 正常构建
- ✅ 正常预览

## 相关文件

- `test-all-examples.ps1` - 完整测试脚本
- `test-dev.ps1` - 单项目测试脚本
- `FIX_SUMMARY.md` - 本文档

## 日期

2025-10-28
