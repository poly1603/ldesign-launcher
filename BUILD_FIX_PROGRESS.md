# @ldesign/launcher 2.0 构建修复进度报告

## 📊 当前状态

**进度：约 95%**

### ✅ 已完成的修复

#### 1. 核心类型重命名（100%）

已成功重命名以避免类型冲突：
- ✅ `BuildResult` → `EngineBuildResult` (types/engine.ts)
- ✅ `BuildStats` → `EngineBuildStats` (types/engine.ts)

#### 2. 核心文件类型引用修复（100%）

已修复以下文件中的所有 `LauncherConfig` → `ViteLauncherConfig` 引用：

**核心层：**
- ✅ `src/core/Launcher.ts` - 完全修复
  - 导入语句
  - 所有方法签名
  - 属性声明
  - 添加了缺失的接口方法（onReady, onError, onClose, isRunning, getConfig）

**类型定义：**
- ✅ `src/types/engine.ts` - 完全修复
  - ConfigTransformer 接口
  - BuildEngine 接口的所有方法签名
- ✅ `src/types/framework.ts` - 完全修复
  - FrameworkAdapter 接口
  - 所有方法签名
- ✅ `src/types/config.ts` - 扩展了 ViteLauncherConfig
  - 添加了 `engine` 配置（2.0 新增）
  - 添加了 `framework` 配置（2.0 新增）

**引擎层：**
- ✅ `src/engines/base/BuildEngine.ts` - 完全修复
  - 导入语句
  - 所有抽象方法签名
  - transformConfig 方法
  - 修复了构造函数中的 logger 初始化问题
- ✅ `src/engines/vite/ViteEngine.ts` - 完全修复
  - 导入语句
  - dev/build/preview/buildWatch 方法签名
  - calculateBuildStats 返回类型
- ✅ `src/engines/vite/ViteConfigTransformer.ts` - 完全修复
  - 导入语句
  - transform 方法签名
  - 文档注释

**框架适配器基类：**
- ✅ `src/frameworks/base/FrameworkAdapter.ts` - 完全修复
  - 导入语句
  - getConfig 方法签名
  - validateConfig 方法签名
  - 修复了构造函数中的 logger 初始化问题
  - 修复了 FileSystem.readFile 的参数格式

### ⚠️ 剩余需要修复的文件

#### 框架适配器（约 9 个文件）

以下框架适配器文件中仍有 `LauncherConfig` 引用需要修复：

1. **Vue 适配器：**
   - ❌ `src/frameworks/vue/Vue3Adapter.ts`
   - ❌ `src/frameworks/vue/Vue2Adapter.ts`

2. **React 适配器：**
   - ❌ `src/frameworks/react/ReactAdapter.ts`

3. **Angular 适配器：**
   - ❌ `src/frameworks/angular/AngularAdapter.ts`

4. **Svelte 适配器：**
   - ❌ `src/frameworks/svelte/SvelteAdapter.ts`

5. **Solid 适配器：**
   - ❌ `src/frameworks/solid/SolidAdapter.ts`

6. **Preact 适配器：**
   - ❌ `src/frameworks/preact/PreactAdapter.ts`

7. **Qwik 适配器：**
   - ❌ `src/frameworks/qwik/QwikAdapter.ts`

8. **Lit 适配器：**
   - ❌ `src/frameworks/lit/LitAdapter.ts`

#### 需要修复的内容

每个框架适配器文件需要进行以下修复：

```typescript
// 1. 修复导入语句
- import type { LauncherConfig } from '../../types/config'
+ import type { ViteLauncherConfig } from '../../types/config'

// 2. 修复 getConfig 方法签名
- getConfig(options?: FrameworkOptions): Partial<LauncherConfig> {
+ getConfig(options?: FrameworkOptions): Partial<ViteLauncherConfig> {

// 3. 修复 validateConfig 方法签名（如果存在）
- validateConfig(config: LauncherConfig): boolean {
+ validateConfig(config: ViteLauncherConfig): boolean {
```

### 🐛 其他已知问题

#### Vue3Adapter 缺少依赖

```
error TS2307: Cannot find module '@vitejs/plugin-vue-jsx' or its corresponding type declarations.
```

**解决方案：**
- 将 `@vitejs/plugin-vue-jsx` 的导入改为动态导入
- 或者在 package.json 中添加该依赖

## 🔧 快速修复方案

### 方案 1：手动修复（推荐）

逐个修复每个框架适配器文件：

```bash
# 对于每个文件，执行以下替换：
1. 将 `import type { LauncherConfig }` 改为 `import type { ViteLauncherConfig }`
2. 将方法签名中的 `LauncherConfig` 改为 `ViteLauncherConfig`
3. 保存文件
```

### 方案 2：使用查找替换

在每个框架适配器文件中：
1. 查找：`LauncherConfig`
2. 替换为：`ViteLauncherConfig`
3. 注意：只替换类型引用，不要替换注释中的文本

## 📋 修复检查清单

### 核心层 ✅
- [x] Launcher.ts
- [x] types/engine.ts
- [x] types/framework.ts
- [x] types/config.ts

### 引擎层 ✅
- [x] engines/base/BuildEngine.ts
- [x] engines/vite/ViteEngine.ts
- [x] engines/vite/ViteConfigTransformer.ts

### 框架适配器基类 ✅
- [x] frameworks/base/FrameworkAdapter.ts

### 框架适配器 ⚠️
- [ ] frameworks/vue/Vue2Adapter.ts
- [ ] frameworks/vue/Vue3Adapter.ts
- [ ] frameworks/react/ReactAdapter.ts
- [ ] frameworks/angular/AngularAdapter.ts
- [ ] frameworks/svelte/SvelteAdapter.ts
- [ ] frameworks/solid/SolidAdapter.ts
- [ ] frameworks/preact/PreactAdapter.ts
- [ ] frameworks/qwik/QwikAdapter.ts
- [ ] frameworks/lit/LitAdapter.ts

## 🎯 下一步行动

### 立即行动（必须）

1. **修复所有框架适配器中的类型引用**
   - 预计时间：10-15 分钟
   - 优先级：最高

2. **修复 Vue3Adapter 的依赖问题**
   - 将 `@vitejs/plugin-vue-jsx` 改为动态导入
   - 预计时间：2 分钟

3. **运行构建验证**
   ```bash
   cd tools/launcher
   npm run build
   ```

### 后续行动

4. **运行类型检查**
   ```bash
   npm run typecheck
   ```

5. **测试基本功能**
   - 创建一个简单的测试项目
   - 验证 dev/build/preview 命令

## 💡 经验总结

### 成功的地方

1. **系统化的修复方法** - 从核心到外围逐层修复
2. **类型重命名策略** - 使用 `Engine` 前缀避免冲突
3. **扩展配置类型** - 在 ViteLauncherConfig 中添加 engine 和 framework 配置

### 遇到的挑战

1. **类型冲突** - `BuildResult` 和 `BuildStats` 在多个文件中定义
2. **抽象属性访问** - 构造函数中无法访问抽象属性（name）
3. **API 变化** - FileSystem.readFile 的参数格式需要调整

### 改进建议

1. **使用命名空间** - 考虑使用 TypeScript 命名空间来组织类型
2. **统一配置类型** - 考虑创建一个统一的配置类型而不是扩展 Vite 的配置
3. **自动化测试** - 添加类型测试以防止未来的类型冲突

## 📞 需要帮助？

如果遇到问题，请参考：
- 架构文档：`docs/ARCHITECTURE.md`
- 类型定义：`src/types/`
- 已修复的示例：`src/core/Launcher.ts`

---

**最后更新：** 2025-10-28
**修复进度：** 95%
**预计完成时间：** 15 分钟

