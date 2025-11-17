# API 精简建议方案

## 📊 现状分析

### 当前 API 暴露情况

**文件**: `src/index.ts`  
**总行数**: 158 行  
**导出数量**: 50+ 个导出项

#### 分类统计

| 类别 | 导出数量 | 问题 |
|------|---------|------|
| 核心类 | 3 个 | ✅ 合理 |
| 引擎相关 | 5 个 | ⚠️ 内部实现 |
| 框架相关 | 11 个 | ⚠️ 内部实现 |
| 注册表 | 全部导出 | ❌ 暴露过度 |
| 插件系统 | 全部导出 | ⚠️ 部分内部 |
| 工具函数 | 20+ 个 | ❌ 大量内部工具 |
| 常量 | 全部导出 | ⚠️ 部分内部 |
| UI 配置 | 10 个 | ⚠️ 内部使用 |

---

## 🎯 优化目标

### 核心原则

1. **最小化原则**: 只暴露用户真正需要的 API
2. **分层导出**: 核心 API 主导出，高级 API 子路径导出
3. **向后兼容**: 通过 deprecated 警告平滑过渡
4. **文档清晰**: 明确标注公共 vs 内部 API

### 预期效果

- 主导出从 158 行减少到 **40 行**（**-75%**）
- 公共 API 从 50+ 个减少到 **10-15 个**
- 更清晰的 API 边界
- 更容易维护和重构

---

## 📋 建议的 API 结构

### 1. 主导出（核心用户 API）

```typescript
// src/index.ts - 精简版（约 40 行）

/**
 * @ldesign/launcher - 核心公共 API
 * 
 * 这些是稳定的公共 API，保证向后兼容。
 */

// ===== 核心启动器 =====
export { ViteLauncher } from './core/ViteLauncher'
export { Launcher } from './core/Launcher' // @deprecated

// ===== 配置定义 =====
export { defineConfig } from './utils/config'

// ===== 类型定义 =====
export type {
  ViteLauncherConfig,
  LauncherOptions,
  LauncherStatus,
  LauncherEvent
} from './types'

// ===== 常用工具 =====
export { Logger } from './utils/logger'

// ===== 版本信息 =====
export const version = '2.1.0'

// ===== 默认导出 =====
export { ViteLauncher as default } from './core/ViteLauncher'
```

**导出数量**: 约 10 个核心 API  
**行数**: 约 40 行（**-75%**）

---

### 2. 高级 API 导出

#### 2.1 CLI 工具

```typescript
// src/cli/index.ts
export { createCli } from './cli'
export type { CliConfig, CliCommand } from './types/cli'
```

**用法**:
```typescript
import { createCli } from '@ldesign/launcher/cli'
```

---

#### 2.2 配置管理

```typescript
// src/config/index.ts
export { ConfigManager } from './core/ConfigManager'
export { AliasManager } from './core/AliasManager'
export type { AliasEntry, BuildStage } from './utils/aliases'
```

**用法**:
```typescript
import { ConfigManager } from '@ldesign/launcher/config'
```

---

#### 2.3 插件系统

```typescript
// src/plugins/index.ts
export { presetManager, definePreset } from './plugins/presets'
export { SmartPluginManager } from './core/SmartPluginManager'
export type { PresetType, PresetOptions } from './plugins/presets'
```

**用法**:
```typescript
import { presetManager } from '@ldesign/launcher/plugins'
```

---

#### 2.4 工具函数

```typescript
// src/utils/index.ts
export { Logger } from './utils/logger'
export { ErrorHandler } from './utils/error-handler'
export { FileSystem } from './utils/file-system'
export { PathUtils } from './utils/path-utils'
export { PerformanceMonitor } from './utils/performance'
// ... 其他工具
```

**用法**:
```typescript
import { FileSystem, PathUtils } from '@ldesign/launcher/utils'
```

---

#### 2.5 类型定义

```typescript
// src/types/index.ts
export type * from './types'
```

**用法**:
```typescript
import type { ViteLauncherConfig } from '@ldesign/launcher/types'
```

---

#### 2.6 常量

```typescript
// src/constants/index.ts
export * from './constants'
```

**用法**:
```typescript
import { DEFAULT_PORT } from '@ldesign/launcher/constants'
```

---

### 3. 内部 API（不导出）

以下 API 应该标记为内部使用，不对外暴露：

- ❌ `BuildEngine` - 引擎实现细节
- ❌ `ViteEngine` - 引擎实现细节
- ❌ `FrameworkAdapter` - 框架适配器实现
- ❌ `FrameworkDetector` - 框架检测实现
- ❌ 注册表相关 - 内部管理机制
- ❌ UI 配置函数 - 内部使用
- ❌ 大部分工具函数 - 内部辅助

---

## 🔄 迁移策略

### 阶段 1: 添加子路径导出（v2.2.0）

**目标**: 提供新的子路径导出，保持主导出不变

**实施**:
1. 在 `package.json` 添加 exports 配置
2. 创建各子路径的 index.ts
3. 更新文档说明新的导入方式

```json
// package.json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./cli": {
      "types": "./dist/cli/index.d.ts",
      "import": "./dist/cli/index.js"
    },
    "./config": {
      "types": "./dist/config/index.d.ts",
      "import": "./dist/config/index.js"
    },
    "./plugins": {
      "types": "./dist/plugins/index.d.ts",
      "import": "./dist/plugins/index.js"
    },
    "./utils": {
      "types": "./dist/utils/index.d.ts",
      "import": "./dist/utils/index.js"
    },
    "./types": {
      "types": "./dist/types/index.d.ts"
    },
    "./constants": {
      "types": "./dist/constants/index.d.ts",
      "import": "./dist/constants/index.js"
    }
  }
}
```

**影响**: 无破坏性变更，纯新增功能

---

### 阶段 2: 标记主导出为 deprecated（v2.3.0）

**目标**: 警告用户迁移到子路径导出

**实施**:
1. 在过度暴露的导出上添加 `@deprecated` 注释
2. 添加运行时警告
3. 更新文档引导用户迁移

```typescript
// src/index.ts
/**
 * @deprecated 请使用 '@ldesign/launcher/utils' 代替
 * 将在 v3.0.0 移除
 */
export { FileSystem } from './utils/file-system'
```

**影响**: 用户会看到弃用警告，但功能正常

---

### 阶段 3: 精简主导出（v3.0.0）

**目标**: 移除过度暴露的 API，只保留核心

**实施**:
1. 重写 `src/index.ts` 为精简版本
2. 确保子路径导出完整
3. 更新所有文档和示例

```typescript
// src/index.ts - v3.0.0
// 只保留核心 API（40 行）
export { ViteLauncher } from './core/ViteLauncher'
export { defineConfig } from './utils/config'
export type { ViteLauncherConfig } from './types'
export { Logger } from './utils/logger'
export const version = '3.0.0'
export default ViteLauncher
```

**影响**: Breaking change，需要用户迁移

---

## 📚 用户迁移指南

### 常见迁移场景

#### 场景 1: 使用配置管理器

**之前（v2.x）**:
```typescript
import { ConfigManager } from '@ldesign/launcher'
```

**之后（v3.0）**:
```typescript
import { ConfigManager } from '@ldesign/launcher/config'
```

---

#### 场景 2: 使用工具函数

**之前（v2.x）**:
```typescript
import { FileSystem, PathUtils } from '@ldesign/launcher'
```

**之后（v3.0）**:
```typescript
import { FileSystem, PathUtils } from '@ldesign/launcher/utils'
```

---

#### 场景 3: 使用插件系统

**之前（v2.x）**:
```typescript
import { presetManager } from '@ldesign/launcher'
```

**之后（v3.0）**:
```typescript
import { presetManager } from '@ldesign/launcher/plugins'
```

---

#### 场景 4: 核心 API（无需变更）

```typescript
// ✅ 保持不变
import { ViteLauncher, defineConfig } from '@ldesign/launcher'

const launcher = new ViteLauncher()
export default defineConfig({ /* ... */ })
```

---

## 📊 收益分析

### 代码质量

| 指标 | 当前 | 优化后 | 改善 |
|------|------|--------|------|
| 主导出行数 | 158 | 40 | **-75%** |
| 公共 API 数量 | 50+ | 10-15 | **-70%** |
| API 文档工作量 | 高 | 低 | **-60%** |
| 用户学习曲线 | 陡峭 | 平缓 | ✅ |

### 维护性

- **重构更容易**: 内部 API 不需要考虑向后兼容
- **文档更清晰**: 只需文档化核心 API
- **测试更简单**: 减少需要测试的公共接口
- **版本管理**: 更容易管理 API 版本

### 用户体验

- **导入更简单**: 只需记住少数核心 API
- **IDE 提示更好**: 自动完成列表更短更精准
- **错误更少**: 减少误用内部 API 的可能
- **升级更平滑**: 核心 API 稳定不变

---

## 🎯 实施建议

### 推荐路径

**短期（v2.2.0 - 1 个月）**:
- [ ] 添加所有子路径导出
- [ ] 更新文档说明新的导入方式
- [ ] 在示例中使用新的导入方式

**中期（v2.3.0 - 2 个月）**:
- [ ] 标记过度暴露的 API 为 deprecated
- [ ] 添加迁移指南
- [ ] 收集用户反馈

**长期（v3.0.0 - 3-4 个月）**:
- [ ] 精简主导出到核心 API
- [ ] 移除所有 deprecated API
- [ ] 发布完整的迁移文档

---

## ⚠️ 风险控制

### 潜在风险

1. **用户代码破坏**: v3.0.0 的 breaking changes
2. **文档工作量**: 需要更新大量文档
3. **用户抵触**: 需要学习新的导入方式

### 缓解措施

1. **渐进式迁移**: 通过 3 个版本逐步过渡
2. **自动化工具**: 提供 codemod 自动迁移
3. **详细文档**: 提供完整的迁移指南和示例
4. **长期支持**: v2.x 继续维护至少 6 个月

---

## 📝 总结

### 核心价值

- ✅ **API 更清晰**: 从 50+ 个减少到 10-15 个核心 API
- ✅ **维护更容易**: 内部 API 可以自由重构
- ✅ **用户体验更好**: 学习曲线更平缓
- ✅ **代码更健康**: 明确的公共/私有边界

### 下一步

1. 讨论并确认精简方案
2. 实施阶段 1（添加子路径导出）
3. 更新文档和示例
4. 收集用户反馈

---

**注意**: 这是一个长期优化方案，建议在完成当前 v2.1.0 的弃用标记后，再开始实施。

---

*创建时间: 2025-11-17*  
*优先级: 中*  
*预计实施时间: 3-4 个月*
