# Phase 10: 架构重构计划

> ViteLauncher 重构为引擎无关的 Launcher  
> 开始时间: 2025-01-17  
> 预计工作量: 500 行代码，1 周

---

## 🎯 重构目标

1. ✅ 创建引擎无关的 `Launcher` 类
2. ✅ 应用 Phase 6 创建的 Manager 基础设施
3. ✅ 解耦 Vite 依赖，真正支持多引擎
4. ✅ 保持向后兼容，ViteLauncher 作为适配器
5. ✅ 简化代码结构，降低维护成本

---

## 📊 当前问题

### ViteLauncher 问题分析
```
ViteLauncher.ts: 1,575 行
├── 直接依赖 Vite API ❌
├── 职责过多（配置、服务器、插件、别名） ❌
├── 难以测试 ❌
└── 无法切换引擎 ❌
```

### 已有但未使用的基础设施
```
✅ EngineManager (161 行)
✅ ServerManager (234 行)
✅ PluginOrchestrator (156 行)
✅ ViteEngine (完整实现)
✅ EngineRegistry (完整实现)
```

---

## 🏗️ 重构策略

### 策略: 渐进式重构 + 适配器模式

**阶段 1: 创建新架构 (不破坏现有功能)**
```
保留: ViteLauncher (当前实现)
新增: Launcher (引擎无关)
新增: ViteAdapter (适配器，继承 ViteLauncher)
```

**阶段 2: 逐步迁移**
```
CLI → 使用新 Launcher
导出 → 同时导出 Launcher 和 ViteLauncher
文档 → 推荐新 Launcher，标记 ViteLauncher 为 @deprecated
```

**阶段 3: 完全迁移 (未来)**
```
移除 ViteLauncher (v3.0.0)
```

---

## 📐 新架构设计

### 新 Launcher 类结构

```typescript
/**
 * 引擎无关的 Launcher
 * 职责：协调各个 Manager，提供统一的启动接口
 */
export class Launcher extends EventEmitter {
  // 核心 Manager（Phase 6 创建）
  private engineManager: EngineManager
  private configManager: ConfigManager
  private pluginOrchestrator: PluginOrchestrator
  private serverManager: ServerManager
  
  // 当前引擎实例
  private currentEngine: BuildEngine | null = null
  
  // 日志和错误处理
  private logger: Logger
  private errorHandler: ErrorHandler
  
  constructor(options: LauncherOptions)
  
  // 核心方法
  async dev(): Promise<void>
  async build(): Promise<EngineBuildResult>
  async preview(): Promise<void>
  
  // 生命周期
  async initialize(): Promise<void>
  async destroy(): Promise<void>
}
```

### 职责划分

| 类 | 职责 | 代码行数 |
|---|---|---|
| **Launcher** | 协调器，统一入口 | ~300 行 |
| **EngineManager** | 引擎创建和管理 | 161 行 (已有) |
| **ConfigManager** | 配置加载和管理 | 优化后 (已有) |
| **PluginOrchestrator** | 插件检测和加载 | 156 行 (已有) |
| **ServerManager** | 服务器信息管理 | 234 行 (已有) |

---

## 📝 实施步骤

### Step 1: 创建新 Launcher 类 ✅

**文件**: `src/core/Launcher.ts`

**核心实现**:
```typescript
export class Launcher extends EventEmitter {
  private engineManager: EngineManager
  private configManager: ConfigManager
  private pluginOrchestrator: PluginOrchestrator
  private serverManager: ServerManager
  private logger: Logger
  
  constructor(options: LauncherOptions) {
    super()
    this.logger = new Logger('Launcher')
    
    // 初始化各个 Manager
    this.configManager = new ConfigManager(...)
    this.pluginOrchestrator = new PluginOrchestrator(...)
    this.engineManager = new EngineManager(...)
    this.serverManager = new ServerManager(...)
  }
  
  async dev(): Promise<void> {
    // 1. 加载配置
    const config = await this.configManager.load()
    
    // 2. 检测框架和加载插件
    const detectedFramework = await this.pluginOrchestrator.detectFramework()
    const plugins = await this.pluginOrchestrator.loadPlugins(detectedFramework)
    
    // 3. 确定引擎类型
    const engineType = config.launcher?.engine || 'vite'
    
    // 4. 创建引擎
    const engine = await this.engineManager.createEngine(engineType)
    this.currentEngine = engine
    
    // 5. 启动开发服务器
    const server = await engine.dev({ ...config, plugins })
    
    // 6. 打印服务器信息
    this.serverManager.printServerInfo(server, 'dev')
  }
  
  async build(): Promise<EngineBuildResult> {
    const config = await this.configManager.load()
    const plugins = await this.pluginOrchestrator.loadPlugins()
    
    const engineType = config.launcher?.engine || 'vite'
    const engine = await this.engineManager.createEngine(engineType)
    
    const result = await engine.build({ ...config, plugins })
    return result
  }
}
```

**工作量**: ~300 行

### Step 2: 重构 EngineManager 集成 EngineRegistry

**当前 EngineManager**: 只支持 Vite  
**目标**: 使用 EngineRegistry 支持多引擎

**修改**: `src/core/EngineManager.ts`
```typescript
export class EngineManager {
  private registry: EngineRegistry
  private currentEngine: BuildEngine | null = null
  
  constructor(options: EngineManagerOptions) {
    this.registry = getEngineRegistry()
  }
  
  async createEngine(type?: BuildEngineType): Promise<BuildEngine> {
    // 使用 Registry 创建引擎
    const engine = await this.registry.createEngine(type)
    this.currentEngine = engine
    return engine
  }
  
  async getAvailableEngines(): Promise<BuildEngineType[]> {
    return this.registry.getRegisteredEngines()
  }
}
```

**工作量**: ~50 行修改

### Step 3: 重构 PluginOrchestrator 

**当前**: 基础实现  
**目标**: 完善框架检测和插件加载

**修改**: `src/core/PluginOrchestrator.ts`
```typescript
export class PluginOrchestrator {
  async detectFramework(): Promise<ProjectType | null> {
    // 使用 FrameworkRegistry
    const registry = getFrameworkRegistry()
    return registry.detect(this.cwd)
  }
  
  async loadPlugins(framework?: ProjectType): Promise<Plugin[]> {
    // 使用 PluginManager
    return this.pluginManager.getRecommendedPlugins(framework)
  }
  
  mergePlugins(userPlugins: Plugin[], smartPlugins: Plugin[]): Plugin[] {
    // 去重合并
  }
}
```

**工作量**: ~100 行

### Step 4: 创建 ViteAdapter (向后兼容)

**文件**: `src/adapters/ViteAdapter.ts`

**实现**:
```typescript
/**
 * ViteLauncher 向后兼容适配器
 * @deprecated 使用 Launcher 代替
 */
export class ViteAdapter extends ViteLauncher {
  constructor(options: LauncherOptions) {
    super(options)
    console.warn(
      '[DEPRECATED] ViteLauncher is deprecated. Use Launcher instead.'
    )
  }
}

// 向后兼容导出
export { ViteAdapter as ViteLauncher }
```

**工作量**: ~50 行

### Step 5: 更新 CLI

**修改**: `src/cli/commands/dev.ts`, `build.ts`, `preview.ts`

```typescript
// 修改前
import { ViteLauncher } from '../../core/ViteLauncher'
const launcher = new ViteLauncher(options)

// 修改后
import { Launcher } from '../../core/Launcher'
const launcher = new Launcher(options)
```

**工作量**: ~50 行修改

### Step 6: 更新导出

**修改**: `src/index.ts`, `src/core/index.ts`

```typescript
// src/core/index.ts
export { Launcher } from './Launcher'
export { ViteLauncher } from './ViteLauncher' // 保留向后兼容
export { Launcher as default } // 新默认导出

// src/index.ts
export { Launcher, ViteLauncher } from './core'
export { Launcher as default } from './core'
```

**工作量**: ~20 行

---

## 🧪 测试计划

### 单元测试
```
□ Launcher.dev() 正常启动
□ Launcher.build() 正常构建
□ Launcher.preview() 正常预览
□ 引擎切换功能
□ 配置加载和合并
```

### 集成测试
```
□ React 示例项目 - dev/build/preview
□ Vue3 示例项目 - dev/build/preview
□ Svelte 示例项目 - dev/build/preview
```

### 向后兼容测试
```
□ ViteLauncher 仍可用
□ 现有项目无需修改配置
□ 导出接口保持一致
```

---

## 📊 重构收益

### 代码质量
- ✅ 单一职责：Launcher 只负责协调
- ✅ 可测试性：每个 Manager 独立测试
- ✅ 可维护性：代码量减少 ~70%

### 架构扩展
- ✅ 真正支持多引擎 (Rspack/Webpack)
- ✅ 插件式架构，易扩展
- ✅ 清晰的职责划分

### 性能
- ✅ 无性能损失
- ✅ 延迟加载引擎
- ✅ 缓存优化保留

---

## ⚠️ 风险控制

### 风险识别
1. **破坏现有功能**: 渐进式重构 + 完整测试
2. **性能回退**: 保留所有优化 + 基准测试
3. **向后兼容**: 保留 ViteLauncher 导出 + 适配器

### 回滚策略
```
git branch phase-10-refactor
如果出现问题: git revert
```

---

## 📅 时间规划

| 任务 | 预计时间 | 状态 |
|------|---------|------|
| Step 1: 创建 Launcher | 2-3 小时 | ⏳ 待开始 |
| Step 2: 重构 EngineManager | 1 小时 | ⏳ 待开始 |
| Step 3: 重构 PluginOrchestrator | 2 小时 | ⏳ 待开始 |
| Step 4: 创建 ViteAdapter | 30 分钟 | ⏳ 待开始 |
| Step 5: 更新 CLI | 1 小时 | ⏳ 待开始 |
| Step 6: 更新导出 | 30 分钟 | ⏳ 待开始 |
| 测试验证 | 2-3 小时 | ⏳ 待开始 |
| **总计** | **1-2 天** | |

---

## 🎯 成功标准

### 功能性
- ✅ 所有示例项目构建成功
- ✅ dev/build/preview 命令正常工作
- ✅ 所有测试通过（≥95%）

### 架构性
- ✅ Launcher 类 ≤300 行
- ✅ 引擎无关，支持切换
- ✅ 使用所有 Phase 6 Manager

### 兼容性
- ✅ ViteLauncher 仍可用
- ✅ 现有 API 不破坏
- ✅ 配置格式不变

---

## 📚 相关文档

1. [ARCHITECTURE_EXTENSIBILITY_ANALYSIS.md](./ARCHITECTURE_EXTENSIBILITY_ANALYSIS.md) - 架构分析
2. [PROJECT_COMPLETION_SUMMARY.md](./PROJECT_COMPLETION_SUMMARY.md) - 项目总结
3. [OPTIMIZATION_CHANGELOG.md](./OPTIMIZATION_CHANGELOG.md) - 优化日志

---

**计划创建时间**: 2025-01-17  
**预计完成时间**: 2025-01-18  
**状态**: ⏳ 准备开始
