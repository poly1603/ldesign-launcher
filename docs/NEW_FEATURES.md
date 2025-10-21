# @ldesign/launcher 新功能说明

本文档描述了在 @ldesign/launcher 项目中新增的插件市场系统和缓存管理系统功能。

## 🔌 插件市场系统

插件市场系统为 @ldesign/launcher 提供了完整的插件生态管理能力，支持插件的发现、安装、管理和版本控制。

### 核心特性

#### 1. 插件发现与搜索
- 支持关键词搜索插件
- 按类别过滤（构建、开发、框架、CSS、测试、代码检查、优化、部署、工具）
- 按类型过滤（Vite插件、Launcher插件、预设、模板）
- 支持显示官方插件和已安装插件
- 灵活的排序和分页功能

#### 2. 插件安装与管理
- 一键安装插件，支持指定版本
- 支持多种包管理器（npm、yarn、pnpm）
- 自动依赖检查和解析
- 插件卸载和更新功能
- 批量更新所有插件

#### 3. 插件信息展示
- 详细的插件信息（作者、版本、描述、标签）
- 下载量和评分统计
- 依赖关系展示
- 使用示例和配置说明

#### 4. CLI 集成
```bash
# 搜索插件
launcher plugin search vue

# 安装插件
launcher plugin install @ldesign/plugin-vue-devtools

# 查看已安装插件
launcher plugin list

# 更新插件
launcher plugin update

# 查看插件详细信息
launcher plugin info vite-plugin-windicss
```

### 使用方法

```typescript
import { PluginMarketManager, pluginMarket } from '@ldesign/launcher'

// 使用全局实例
await pluginMarket.fetchPlugins()
const results = pluginMarket.searchPlugins({ query: 'vue' })

// 或创建自定义实例
const customMarket = new PluginMarketManager(logger, 'https://custom-registry.com')
```

## 💾 缓存管理系统

缓存管理系统提供了智能的构建缓存、依赖缓存和模块缓存策略，显著提升开发和构建性能。

### 核心特性

#### 1. 多类型缓存支持
- **构建缓存**: 缓存构建结果和中间产物
- **依赖缓存**: 缓存第三方依赖解析结果
- **模块缓存**: 缓存模块转换和编译结果
- **转换缓存**: 缓存文件转换和处理结果
- **资源缓存**: 缓存静态资源处理结果
- **临时缓存**: 临时数据和中间状态缓存

#### 2. 智能缓存策略
- LRU（最近最少使用）淘汰算法
- 基于访问频率的智能清理
- 可配置的缓存大小和过期时间
- 自动压缩以节省存储空间

#### 3. 持久化存储
- 磁盘持久化，重启后缓存不丢失
- 增量更新和差异化存储
- 缓存数据完整性校验

#### 4. 性能监控
- 实时缓存命中率统计
- 缓存大小和使用情况监控
- 详细的性能分析报告
- 优化建议和最佳实践指导

#### 5. CLI 管理工具
```bash
# 查看缓存状态
launcher cache status

# 清理指定类型缓存
launcher cache clear build

# 清理所有缓存
launcher cache clear --all

# 压缩缓存
launcher cache compress

# 分析缓存使用情况
launcher cache analyze

# 预热常用缓存
launcher cache warmup
```

### 使用方法

```typescript
import { CacheManager, cacheManager } from '@ldesign/launcher'

// 使用全局实例
await cacheManager.set('build-result', 'build', buildData)
const cached = await cacheManager.get('build-result', 'build')

// 或创建自定义实例
const customCache = new CacheManager({
  cacheDir: './custom-cache',
  maxSize: 1024, // 1GB
  ttl: 24 * 60 * 60 * 1000, // 24小时
  types: ['build', 'deps'],
  compression: true
})
```

## 🚀 项目模板管理系统

项目模板管理系统提供了丰富的项目模板，支持快速创建不同技术栈的项目。

### 支持的模板

- **Vue 3**: 标准 Vue 3 项目模板
- **Vue 3 + TypeScript**: Vue 3 + TS 完整开发环境
- **React**: React 18+ 现代开发模板
- **React + TypeScript**: React + TS 企业级模板
- **Svelte**: Svelte 轻量级应用模板
- **Svelte + TypeScript**: Svelte + TS 类型安全模板
- **Vue 2**: Vue 2.x 兼容性模板
- **Vanilla JS**: 原生 JavaScript 模板
- **TypeScript**: 纯 TypeScript 项目模板

### CLI 使用

```bash
# 交互式创建项目
launcher init

# 指定模板创建
launcher init my-project --template vue3-ts

# 使用预设创建
launcher init my-project --preset vue3
```

## 📊 性能监控系统

增强的性能监控系统提供了全面的开发和构建性能分析。

### 监控指标

- **构建时间**: 详细的构建阶段耗时统计
- **插件性能**: 各插件的执行时间分析
- **文件操作**: I/O 操作性能统计
- **热更新性能**: HMR 响应时间监控
- **缓存效率**: 缓存命中率和性能提升
- **内存使用**: 内存占用和垃圾回收监控

### 性能报告

```bash
# 查看性能报告
launcher performance report

# 实时性能监控
launcher performance monitor

# 性能分析和建议
launcher performance analyze
```

## 🔧 配置增强

### 新增配置选项

```typescript
export interface LauncherConfig {
  // 插件市场配置
  pluginMarket?: {
    enabled: boolean
    registryUrl?: string
    autoUpdate?: boolean
  }
  
  // 缓存配置
  cache?: {
    enabled: boolean
    cacheDir?: string
    maxSize?: number
    types?: CacheType[]
    compression?: boolean
    autoClean?: {
      enabled: boolean
      interval: number
      threshold: number
    }
  }
  
  // 模板配置
  templates?: {
    customTemplates?: string[]
    defaultTemplate?: string
  }
  
  // 性能监控配置
  performance?: {
    enabled: boolean
    reportInterval?: number
    metricsEnabled?: boolean
  }
}
```

## 📚 文档和示例

### 完整文档结构

```
docs/
├── quick-start.md          # 快速开始指南
├── cli-reference.md        # CLI 命令参考
├── configuration.md        # 配置文件参考
├── faq.md                 # 常见问题
├── api-reference.md       # API 参考
├── plugin-development.md  # 插件开发指南
├── architecture.md        # 架构设计文档
├── contributing.md        # 贡献指南
└── examples/              # 示例项目
    ├── vue3-example/
    ├── react-example/
    └── svelte-example/
```

## 🧪 测试覆盖

新功能包含完整的单元测试：

- **插件市场测试**: 搜索、安装、管理等功能测试
- **缓存系统测试**: 存取、过期、清理等功能测试
- **模板管理测试**: 模板生成和项目创建测试
- **性能监控测试**: 性能数据收集和分析测试
- **集成测试**: 各系统间协作测试

## 🎯 使用场景

### 开发团队
- 统一的开发环境和工具链
- 标准化的项目模板和配置
- 智能的缓存管理提升构建速度
- 丰富的插件生态支持

### 企业级项目
- 可扩展的插件系统
- 完整的性能监控和优化
- 灵活的配置和定制能力
- 稳定的缓存和持久化机制

### 个人开发者
- 简单易用的 CLI 工具
- 丰富的项目模板选择
- 自动化的依赖和插件管理
- 优化的开发体验

## 🔮 未来规划

- [ ] 可视化的插件管理界面
- [ ] 云端缓存和同步功能
- [ ] 更多技术栈的模板支持
- [ ] AI 驱动的性能优化建议
- [ ] 团队协作和配置共享功能
- [ ] 微前端和 Monorepo 支持

---

这些新功能大大增强了 @ldesign/launcher 的能力，为现代前端开发提供了更完整、更高效的工具链解决方案。
