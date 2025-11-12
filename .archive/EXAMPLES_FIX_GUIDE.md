# Examples 项目修复指南

## 概述

examples 目录中的项目使用 `@ldesign/engine-*` 包，这些项目存在多个需要修复的问题。

## 已完成的修复

### ✅ 1. engine-core 的 exports 配置

**文件**: `packages/engine/packages/core/package.json`

**已添加**:
```json
"./plugins": {
  "types": "./es/plugin/plugins/index.d.ts",
  "import": "./es/plugin/plugins/index.js",
  "require": "./lib/plugin/plugins/index.cjs"
},
"./plugins/*": {
  "types": "./es/plugin/plugins/*.d.ts",
  "import": "./es/plugin/plugins/*.js",
  "require": "./lib/plugin/plugins/*.cjs"
}
```

**状态**: ✅ 已完成并重新构建

### ✅ 2. Svelte 示例的导入路径

**文件**: `examples/svelte/src/main.ts`

**已修复**:
```typescript
// 修复前
import { createI18nPlugin } from '@ldesign/engine-core/plugins/i18n'
import { createThemePlugin } from '@ldesign/engine-core/plugins/theme'
import { createSizePlugin } from '@ldesign/engine-core/plugins/size'

// 修复后
import { createI18nPlugin } from '@ldesign/engine-core/plugins/i18n-plugin'
import { createThemePlugin } from '@ldesign/engine-core/plugins/theme-plugin'
import { createSizePlugin } from '@ldesign/engine-core/plugins/size-plugin'
```

**状态**: ✅ 已完成

## 待修复的问题

### ⏸️ 3. 更新工作区依赖

**问题**: 修改后的 engine-core 需要在整个 monorepo 中更新

**解决方案**:
```bash
cd D:\WorkBench\ldesign
pnpm install --force
```

**或者更安全的方式**:
```bash
cd D:\WorkBench\ldesign\packages\engine\packages\core
pnpm build

# 回到根目录
cd D:\WorkBench\ldesign
rm -rf node_modules
pnpm install
```

### ⏸️ 4. Solid 示例的导入路径

**文件**: `examples/solid/src/main.tsx`

**需要修复**（与 Svelte 类似）:
```typescript
import { createI18nPlugin } from '@ldesign/engine-core/plugins/i18n-plugin'
import { createThemePlugin } from '@ldesign/engine-core/plugins/theme-plugin'
import { createSizePlugin } from '@ldesign/engine-core/plugins/size-plugin'
```

### ⏸️ 5. React 示例的类型错误

**文件**: `examples/react/src/main.tsx`

**问题**: TypeScript 类型错误，需要修复代码以匹配 engine-core 的类型定义

**错误**:
- 第 28, 33, 40, 47, 52, 59 行：对象字面量类型不匹配
- 第 72, 79 行：`colors` 属性不存在
- 第 91 行：`small` 属性不存在
- 第 98 行：`initialize` 方法不存在

**需要检查**: engine-core 的类型定义和 API 文档

### ⏸️ 6. Vue 示例的 vue-tsc 版本

**文件**: `examples/vue/package.json`

**问题**: vue-tsc@1.8.27 与 typescript@5.9.3 不兼容

**解决方案** (二选一):

**方案 A**: 升级 vue-tsc
```json
{
  "devDependencies": {
    "vue-tsc": "^2.0.0"
  }
}
```

**方案 B**: 降级 TypeScript
```json
{
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

### ⏸️ 7. Angular 示例的版本升级

**文件**: `examples/angular/package.json`

**问题**: Angular 18.2.14 与 Angular CLI 20+ 不兼容

**解决方案**: 升级 Angular 到 v20
```bash
cd examples/angular
ng update @angular/core@20 @angular/cli@20
```

**或者**: 创建新的 Angular 20 项目

## 详细修复步骤

### 第一步：完成工作区更新

```bash
# 1. 清理并重新安装依赖
cd D:\WorkBench\ldesign
rm -rf node_modules .pnpm-store
pnpm install

# 2. 重新构建 engine-core
cd packages/engine/packages/core
pnpm build
```

### 第二步：修复 Solid 示例

```bash
cd D:\WorkBench\ldesign\examples\solid
```

编辑 `src/main.tsx`，修改导入语句：
```typescript
import { createI18nPlugin } from '@ldesign/engine-core/plugins/i18n-plugin'
import { createThemePlugin } from '@ldesign/engine-core/plugins/theme-plugin'
import { createSizePlugin } from '@ldesign/engine-core/plugins/size-plugin'
```

### 第三步：修复 React 示例

```bash
cd D:\WorkBench\ldesign\examples\react
```

查看 engine-core 的 API 文档，并根据实际类型定义修复 `src/main.tsx`。

可能需要：
1. 检查 `CoreEngine` 是否有 `initialize` 方法
2. 修正插件配置的类型
3. 或者跳过类型检查（不推荐）：
   ```bash
   # 临时方案
   pnpm build --skipLibCheck
   ```

### 第四步：修复 Vue 示例

```bash
cd D:\WorkBench\ldesign\examples\vue
```

**推荐方案**：升级 vue-tsc
```bash
pnpm add -D vue-tsc@latest
pnpm build
```

### 第五步：修复 Angular 示例

```bash
cd D:\WorkBench\ldesign\examples\angular
```

**方案 A** - 升级 Angular:
```bash
ng update @angular/core@20 @angular/cli@20
```

**方案 B** - 使用老版本 CLI:
```bash
npm install -g @angular/cli@18
pnpm build
```

## 验证修复

完成所有修复后，依次测试：

```bash
cd D:\WorkBench\ldesign

# 测试 Svelte
cd examples/svelte && pnpm build

# 测试 Solid
cd ../solid && pnpm build

# 测试 React
cd ../react && pnpm build

# 测试 Vue
cd ../vue && pnpm build

# 测试 Angular
cd ../angular && pnpm build
```

## 快速修复脚本

创建一个脚本 `fix-examples.sh`:

```bash
#!/bin/bash

# 进入项目根目录
cd /d/WorkBench/ldesign

echo "Step 1: Rebuilding engine-core..."
cd packages/engine/packages/core
pnpm build

echo "Step 2: Fixing Solid imports..."
cd /d/WorkBench/ldesign/examples/solid
sed -i 's|/plugins/i18n"|/plugins/i18n-plugin"|g' src/main.tsx
sed -i 's|/plugins/theme"|/plugins/theme-plugin"|g' src/main.tsx
sed -i 's|/plugins/size"|/plugins/size-plugin"|g' src/main.tsx

echo "Step 3: Upgrading Vue dependencies..."
cd /d/WorkBench/ldesign/examples/vue
pnpm add -D vue-tsc@latest

echo "Step 4: Testing builds..."
cd /d/WorkBench/ldesign/examples/svelte && pnpm build
cd /d/WorkBench/ldesign/examples/solid && pnpm build
cd /d/WorkBench/ldesign/examples/vue && pnpm build

echo "Done!"
```

## 注意事项

1. **工作区链接**: 这些项目使用 pnpm workspace，修改 engine-core 后需要重新安装依赖
2. **缓存问题**: 如果遇到缓存问题，删除 `node_modules` 和 `.pnpm-store`
3. **类型检查**: React 示例的类型错误可能需要查看 engine-core 的文档
4. **Angular 版本**: Angular 的版本升级可能会有破坏性变更

## 简化建议

考虑到这些示例项目的复杂性，建议：

1. **创建新的简单示例**: 不使用 engine 包，直接使用框架官方脚手架
2. **独立维护**: 将 engine 相关示例移到 engine 包内
3. **文档化**: 为 engine 包创建独立的文档和示例

## 总结

当前状态：
- ✅ engine-core exports 已修复
- ✅ Svelte 导入路径已修复
- ⏸️ 需要重新安装工作区依赖
- ⏸️ Solid, React, Vue, Angular 还需要修复

预计修复时间：
- Solid: 5 分钟
- Vue: 5 分钟
- React: 15-30 分钟（需要理解 engine-core API）
- Angular: 10-20 分钟（版本升级）

**建议**: 如果这些示例不是核心功能，可以暂时跳过修复，专注于 launcher 的开发和测试。
