# @ldesign/launcher 包依赖分析报告

**生成时间**: 2025-01-24
**分析版本**: v1.1.2

---

## 📦 依赖统计

### 运行时依赖 (34个)

**CLI 框架** (2个 - 存在重复):
- ✅ `cac` (6.7.14) - 未使用，可移除
- ⚠️ `commander` (12.1.0) - 已使用（8个命令文件），保留

**大型依赖**:
- ⚠️ `lighthouse` (12.2.1) - ~10MB，未在源码中直接导入
  - 可能用于性能监控
  - 建议：改为 peerDependencies 或 optionalDependencies
  
- ✅ `webpack-bundle-analyzer` (4.10.2) - ~5MB
  - 用于打包分析
  - 建议：保持在 external 配置中

**字体转换工具** (5个):
- `svg2ttf` (6.0.3)
- `svgicons2svgfont` (12.0.0)
- `ttf2eot` (3.1.0)
- `ttf2woff` (3.0.0)
- `ttf2woff2` (5.0.0)
- 使用场景：工具命令 `launcher tools font`
- 建议：保留，功能必需

**其他依赖** (正常使用):
- `vite` - peerDependency
- `chalk` / `picocolors` - CLI 颜色
- `fs-extra` - 文件操作
- `fast-glob` / `glob` - 文件匹配（可能重复）
- `archiver` / `tar` / `yauzl` - 压缩解压
- `ws` - WebSocket
- `zod` - 配置验证
- 等等...

### 优化建议

#### 1. 移除未使用的依赖 ⭐⭐⭐

**可立即移除**:
```json
{
  "dependencies": {
    "cac": "^6.7.14"  // ❌ 移除 - 未使用，已使用 commander
  }
}
```

**预期效果**:
- 减少约 100KB (gzip后)
- 简化依赖树

#### 2. 优化大型依赖 ⭐⭐⭐⭐

**lighthouse 优化**:
```json
{
  "optionalDependencies": {
    "lighthouse": "^12.2.1"  // 改为可选依赖
  }
}
```

在代码中动态导入:
```typescript
// 只在使用时导入
async function runLighthouse() {
  try {
    const lighthouse = await import('lighthouse')
    // 使用 lighthouse...
  } catch (error) {
    throw new Error('lighthouse 未安装，请运行: pnpm add lighthouse')
  }
}
```

**预期效果**:
- 安装体积减少 ~10MB
- 不影响核心功能
- 按需安装

#### 3. 合并重复功能 ⭐⭐

**glob 相关**:
- 当前使用: `fast-glob` + `glob`
- 建议: 只保留 `fast-glob` (性能更好)

```typescript
// 替换所有 glob 使用为 fast-glob
import fg from 'fast-glob'
// 替代: import { glob } from 'glob'
```

**预期效果**:
- 减少约 200KB
- 统一文件匹配 API

---

## 📊 包体积对比

### 当前状态
```
总安装大小: ~50MB (估算)
  - lighthouse: ~10MB
  - 其他依赖: ~40MB
```

### 优化后预期
```
总安装大小: ~35-40MB
  - 移除 cac: -0.1MB
  - lighthouse 改为可选: -10MB (可选安装)
  - 合并 glob: -0.2MB
  
总减少: 10-15MB (20-30%)
```

---

## ✅ 实施计划

### 阶段 1: 安全移除 (立即执行)

1. **移除 cac 依赖**
```bash
cd tools/launcher
pnpm remove cac
```

2. **验证构建**
```bash
pnpm build
pnpm test
```

### 阶段 2: lighthouse 优化 (短期)

1. **修改 package.json**
```json
{
  "dependencies": {
    // 移除
  },
  "optionalDependencies": {
    "lighthouse": "^12.2.1"
  }
}
```

2. **代码适配**
- 添加动态导入
- 添加错误提示
- 更新文档

### 阶段 3: glob 统一 (中期)

1. **替换所有 glob 使用**
```typescript
// 查找所有使用
grep -r "from 'glob'" src/

// 替换为 fast-glob
import fg from 'fast-glob'
```

2. **移除 glob 依赖**
```bash
pnpm remove glob
```

---

## 🎯 预期成果

### 包体积
- ✅ 核心安装体积减少 20-30%
- ✅ lighthouse 按需安装
- ✅ 依赖树更清晰

### 性能
- ✅ 安装速度提升
- ✅ node_modules 体积减少
- ✅ 构建时间基本不变

### 兼容性
- ✅ 零破坏性变更
- ✅ lighthouse 功能保留（可选）
- ✅ 所有测试通过

---

**分析完成时间**: 2025-01-24
**建议执行时间**: 1-2 小时
**风险等级**: 低（保守优化）


