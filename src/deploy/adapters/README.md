# 部署适配器注册表 - 使用指南

> 统一的部署适配器管理系统，支持多平台部署、插件式扩展、智能选择等功能。

## 📚 目录

- [快速开始](#快速开始)
- [核心概念](#核心概念)
- [API 参考](#api-参考)
- [使用示例](#使用示例)
- [插件开发](#插件开发)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)

---

## 快速开始

### 1. 基础部署

```typescript
import { getAdapter } from './adapters'
import type { NetlifyDeployConfig } from './types/deploy'

// 配置
const config: NetlifyDeployConfig = {
  platform: 'netlify',
  distDir: 'dist',
  authToken: process.env.NETLIFY_AUTH_TOKEN,
  prod: true,
}

// 获取适配器（类型安全）
const adapter = getAdapter<NetlifyDeployConfig>('netlify')

if (adapter) {
  // 部署
  const result = await adapter.deploy(config, {
    onProgress: (progress) => console.log(`进度: ${progress.progress}%`),
    onLog: (log) => console.log(log.message),
    onStatusChange: (status) => console.log(`状态: ${status}`),
  })
  
  if (result.success) {
    console.log(`部署成功: ${result.url}`)
  }
}
```

### 2. 配置验证与默认值

```typescript
import { validatePlatformConfig, applyConfigDefaults } from './adapters'

// 验证配置
const validation = validatePlatformConfig('netlify', config)
if (!validation.valid) {
  console.error('配置错误:', validation.errors)
  process.exit(1)
}

// 应用默认值和环境变量
const fullConfig = applyConfigDefaults('netlify', config)
// 自动填充 port: 21, secure: false 等默认值
```

### 3. 智能平台选择

```typescript
import { autoDetectPlatform, recommendPlatform } from './adapters'

// 自动检测（基于环境变量）
const detected = autoDetectPlatform()
if (detected) {
  console.log(`检测到平台: ${detected}`)
}

// 根据项目特征推荐
const recommendations = recommendPlatform({
  isStatic: true,
  needsPreview: true,
  budget: 'free',
})
console.log('推荐平台:', recommendations)
// => ['github-pages', 'netlify', 'cloudflare']
```

---

## 核心概念

### 适配器（Adapter）

适配器是部署到特定平台的实现类，所有适配器都实现 `DeployAdapter` 接口：

```typescript
interface DeployAdapter<T extends BaseDeployConfig> {
  name: string
  platform: DeployPlatform
  displayName: string
  icon: string
  description: string
  requiresBuild: boolean
  
  validateConfig(config: T): Promise<{ valid: boolean, errors: string[] }>
  deploy(config: T, callbacks: DeployCallbacks): Promise<DeployResult>
  cancel?(): Promise<void>
  getStatus?(deployId: string): Promise<DeployStatus>
  getLogs?(deployId: string): Promise<DeployLogEntry[]>
  rollback?(deployId: string): Promise<DeployResult>
}
```

### 注册表（Registry）

注册表负责管理所有适配器的生命周期：

- **懒加载**: 适配器在首次使用时才实例化
- **缓存**: 已加载的适配器会被缓存
- **工厂模式**: 使用工厂函数创建适配器实例

### 平台信息（Platform Info）

每个平台都有详细的元数据，包括：

```typescript
interface DeployPlatformInfo {
  id: DeployPlatform
  name: string
  icon: string
  description: string
  docsUrl?: string
  requiresAuth: boolean
  authType?: 'token' | 'password' | 'key' | 'oauth'
  supportsPreview: boolean
  supportsCustomDomain: boolean
  supportsRollback: boolean
  configFields: DeployConfigField[]
}
```

---

## API 参考

### 适配器管理

#### `getAdapter<T>(platform)`

获取指定平台的适配器实例（类型安全）。

```typescript
const adapter = getAdapter<NetlifyDeployConfig>('netlify')
// 返回类型: DeployAdapter<NetlifyDeployConfig> | undefined
```

#### `registerAdapter(platform, adapter, platformInfo?)`

注册自定义适配器实例。

```typescript
registerAdapter('custom-platform', new CustomAdapter(), platformInfo)
```

#### `registerAdapterFactory(platform, factory)`

注册适配器工厂（推荐方式）。

```typescript
registerAdapterFactory('custom-platform', () => new CustomAdapter())
```

#### `unregisterAdapter(platform)`

注销指定平台的适配器。

```typescript
unregisterAdapter('custom-platform')
```

#### `hasAdapter(platform)`

检查适配器是否已注册。

```typescript
if (hasAdapter('netlify')) {
  // 适配器可用
}
```

#### `getRegisteredPlatforms()`

获取所有已注册的平台列表。

```typescript
const platforms = getRegisteredPlatforms()
// => ['netlify', 'vercel', 'cloudflare', ...]
```

#### `preloadAdapters()`

预加载所有适配器（可选的性能优化）。

```typescript
await preloadAdapters()
```

---

### 平台信息

#### `getPlatformInfo(platform)`

获取指定平台的详细信息。

```typescript
const info = getPlatformInfo('netlify')
console.log(info.name)          // => 'Netlify'
console.log(info.requiresAuth)  // => true
console.log(info.authType)      // => 'token'
```

#### `SUPPORTED_PLATFORMS`

所有支持的平台信息列表。

```typescript
import { SUPPORTED_PLATFORMS } from './adapters'

SUPPORTED_PLATFORMS.forEach(platform => {
  console.log(`${platform.icon} ${platform.name}`)
})
```

---

### 配置管理

#### `validatePlatformConfig(platform, config)`

验证平台配置是否有效。

```typescript
const validation = validatePlatformConfig('netlify', {
  authToken: '',  // 必填但为空
  port: 'abc',    // 应该是数字
})

// validation.valid => false
// validation.errors => [
//   '字段 "访问令牌" 为必填项',
//   '字段 "端口" 必须是数字'
// ]
```

#### `applyConfigDefaults(platform, config)`

应用默认值和环境变量。

```typescript
const config = applyConfigDefaults('ftp', {
  platform: 'ftp',
  host: 'ftp.example.com',
  username: 'user',
  password: 'pass',
  remotePath: '/www',
  // port 未设置
  // secure 未设置
})

// config.port => 21 (默认值)
// config.secure => false (默认值)
```

---

### 智能选择

#### `recommendPlatform(features)`

根据项目特征推荐最佳平台。

```typescript
const platforms = recommendPlatform({
  hasServerless: true,
  hasSSR: false,
  isStatic: false,
  requiresCustomDomain: true,
  needsPreview: true,
  budget: 'paid',
})
// => ['netlify', 'vercel', 'cloudflare']
```

**特征说明**:
- `hasServerless`: 是否需要 Serverless 函数
- `hasSSR`: 是否需要服务端渲染
- `isStatic`: 是否为纯静态站点
- `requiresCustomDomain`: 是否需要自定义域名
- `needsPreview`: 是否需要预览部署
- `budget`: 预算（`'free'` 或 `'paid'`）

#### `autoDetectPlatform()`

根据环境变量自动检测平台。

```typescript
// 设置环境变量
process.env.NETLIFY_AUTH_TOKEN = 'xxx'

const platform = autoDetectPlatform()
// => 'netlify'
```

**支持的环境变量**:
- `NETLIFY_AUTH_TOKEN` / `NETLIFY` → `netlify`
- `VERCEL_TOKEN` / `VERCEL` → `vercel`
- `CLOUDFLARE_API_TOKEN` → `cloudflare`
- `GITHUB_TOKEN` → `github-pages`
- `FTP_HOST` → `ftp`
- `SFTP_HOST` / `SSH_HOST` → `sftp`

#### `selectPlatformByProjectType(type)`

根据项目类型选择合适的平台。

```typescript
const platforms = selectPlatformByProjectType('spa')
// => ['netlify', 'vercel', 'cloudflare', 'github-pages']
```

**项目类型**:
- `'static'`: 纯静态 HTML
- `'spa'`: 单页应用（React/Vue/Angular）
- `'ssr'`: 服务端渲染（Next.js/Nuxt.js）
- `'ssg'`: 静态站点生成（Gatsby/VuePress）
- `'jamstack'`: JAMstack 架构

---

## 使用示例

### 示例1: 完整的部署流程

```typescript
import {
  autoDetectPlatform,
  getAdapter,
  validatePlatformConfig,
  applyConfigDefaults,
  DeployAdapterError,
} from './adapters'

async function deployProject(config: Partial<DeployConfig>) {
  try {
    // 1. 检测或选择平台
    const platform = config.platform || autoDetectPlatform()
    if (!platform) {
      throw new Error('无法确定部署平台，请在配置中指定')
    }
    
    // 2. 应用默认值
    const fullConfig = applyConfigDefaults(platform, {
      ...config,
      platform,
    })
    
    // 3. 验证配置
    const validation = validatePlatformConfig(platform, fullConfig)
    if (!validation.valid) {
      console.error('配置错误:')
      validation.errors.forEach(err => console.error(`  - ${err}`))
      throw new Error('配置验证失败')
    }
    
    // 4. 获取适配器
    const adapter = getAdapter(platform)
    if (!adapter) {
      throw new Error(`平台 "${platform}" 不支持`)
    }
    
    // 5. 执行部署
    console.log(`开始部署到 ${adapter.displayName}...`)
    const result = await adapter.deploy(fullConfig, {
      onProgress: (progress) => {
        console.log(`[${progress.phase}] ${progress.message} (${progress.progress}%)`)
      },
      onLog: (log) => {
        console.log(`[${log.level}] ${log.message}`)
      },
      onStatusChange: (status) => {
        console.log(`状态变更: ${status}`)
      },
    })
    
    // 6. 处理结果
    if (result.success) {
      console.log('✅ 部署成功!')
      console.log(`📍 URL: ${result.url}`)
      if (result.previewUrl) {
        console.log(`👀 预览: ${result.previewUrl}`)
      }
    } else {
      console.error('❌ 部署失败:', result.error)
      if (result.errorDetails) {
        console.error('详细信息:', result.errorDetails)
      }
    }
    
    return result
  } catch (error) {
    if (error instanceof DeployAdapterError) {
      console.error(`[${error.platform}] ${error.code}:`, error.message)
    } else {
      console.error('部署失败:', error)
    }
    throw error
  }
}
```

### 示例2: 多平台部署

```typescript
async function deployToMultiplePlatforms(config: BaseDeployConfig, platforms: DeployPlatform[]) {
  const results = await Promise.allSettled(
    platforms.map(async (platform) => {
      const adapter = getAdapter(platform)
      if (!adapter) {
        throw new Error(`平台不可用: ${platform}`)
      }
      
      const platformConfig = { ...config, platform }
      return adapter.deploy(platformConfig, callbacks)
    })
  )
  
  results.forEach((result, index) => {
    const platform = platforms[index]
    if (result.status === 'fulfilled') {
      console.log(`✅ ${platform}: ${result.value.url}`)
    } else {
      console.error(`❌ ${platform}: ${result.reason}`)
    }
  })
}

// 使用
await deployToMultiplePlatforms(config, ['netlify', 'vercel', 'cloudflare'])
```

### 示例3: 部署向导

```typescript
import inquirer from 'inquirer'
import {
  getRegisteredPlatforms,
  getPlatformInfo,
  recommendPlatform,
  getAdapter,
} from './adapters'

async function deployWizard() {
  // 1. 推荐平台
  const recommendations = recommendPlatform({
    isStatic: true,
    budget: 'free',
  })
  
  // 2. 选择平台
  const { platform } = await inquirer.prompt([{
    type: 'list',
    name: 'platform',
    message: '选择部署平台:',
    choices: recommendations.map(id => {
      const info = getPlatformInfo(id)
      return {
        name: `${info.icon} ${info.name} - ${info.description}`,
        value: id,
      }
    }),
  }])
  
  const platformInfo = getPlatformInfo(platform)
  
  // 3. 配置字段
  const config: any = { platform }
  
  for (const field of platformInfo.configFields) {
    if (!field.required && field.default !== undefined) {
      continue // 跳过有默认值的可选字段
    }
    
    const { value } = await inquirer.prompt([{
      type: field.type === 'password' ? 'password' : 'input',
      name: 'value',
      message: field.label + (field.required ? ' *' : ''),
      default: field.default || field.envVar && process.env[field.envVar],
      validate: field.required ? (v: string) => !!v || '必填字段' : undefined,
    }])
    
    config[field.name] = value
  }
  
  // 4. 部署
  const adapter = getAdapter(platform)
  const result = await adapter.deploy(config, callbacks)
  
  return result
}
```

---

## 插件开发

### 创建自定义适配器

```typescript
import { BaseAdapter } from './adapters/BaseAdapter'
import type { DeployCallbacks, DeployResult } from './types/deploy'

// 1. 定义配置类型
interface MyPlatformConfig extends BaseDeployConfig {
  platform: 'my-platform'
  apiKey: string
  region: string
}

// 2. 继承 BaseAdapter
class MyPlatformAdapter extends BaseAdapter<MyPlatformConfig> {
  name = 'my-platform'
  platform = 'my-platform' as const
  displayName = '我的平台'
  icon = '🚀'
  description = '部署到我的平台'
  requiresBuild = true
  
  async validateConfig(config: MyPlatformConfig) {
    const errors: string[] = []
    
    if (!config.apiKey) {
      errors.push('API Key 是必需的')
    }
    if (!config.region) {
      errors.push('Region 是必需的')
    }
    
    return { valid: errors.length === 0, errors }
  }
  
  async deploy(
    config: MyPlatformConfig,
    callbacks: DeployCallbacks,
  ): Promise<DeployResult> {
    this.callbacks = callbacks
    
    try {
      // 准备阶段
      this.updateProgress({
        phase: 'prepare',
        progress: 0,
        phaseProgress: 0,
        message: '准备部署...',
      })
      
      // 验证构建目录
      const cwd = process.cwd()
      const distDir = this.getDistDir(config, cwd)
      const validation = await this.validateDistDir(distDir)
      
      if (!validation.valid) {
        return this.createFailedResult(validation.error!)
      }
      
      // 获取文件列表
      const files = await this.getFilesToUpload(distDir)
      this.log('info', `共 ${files.length} 个文件`, 'prepare')
      
      // 上传阶段
      this.updateProgress({
        phase: 'upload',
        progress: 50,
        phaseProgress: 0,
        message: '上传文件...',
      })
      
      // TODO: 实现上传逻辑
      // await this.uploadFiles(files, config)
      
      // 完成
      this.updateProgress({
        phase: 'complete',
        progress: 100,
        phaseProgress: 100,
        message: '部署完成',
      })
      
      return this.createSuccessResult('https://my-platform.com/your-site')
    } catch (error) {
      return this.createFailedResult(
        (error as Error).message,
        (error as Error).stack,
      )
    }
  }
}

// 3. 注册适配器
import { registerAdapterFactory } from './adapters'

registerAdapterFactory('my-platform', () => new MyPlatformAdapter())
```

### 定义平台信息

```typescript
import { SUPPORTED_PLATFORMS } from './adapters'

SUPPORTED_PLATFORMS.push({
  id: 'my-platform',
  name: '我的平台',
  icon: '🚀',
  description: '部署到我的平台，快速、稳定、可靠',
  docsUrl: 'https://my-platform.com/docs',
  requiresAuth: true,
  authType: 'token',
  supportsPreview: true,
  supportsCustomDomain: true,
  supportsRollback: true,
  configFields: [
    {
      name: 'apiKey',
      label: 'API Key',
      type: 'password',
      required: true,
      placeholder: 'your-api-key',
      envVar: 'MY_PLATFORM_API_KEY',
    },
    {
      name: 'region',
      label: '区域',
      type: 'select',
      required: true,
      options: [
        { label: '华东', value: 'cn-east' },
        { label: '华北', value: 'cn-north' },
      ],
    },
  ],
})
```

---

## 最佳实践

### 1. 使用环境变量

```typescript
// ✅ 推荐：敏感信息使用环境变量
const config = {
  platform: 'netlify',
  authToken: process.env.NETLIFY_AUTH_TOKEN,
  // ...
}

// ❌ 不推荐：硬编码敏感信息
const config = {
  platform: 'netlify',
  authToken: 'nfp_xxxxx', // 不要这样做！
}
```

### 2. 配置验证

```typescript
// ✅ 推荐：部署前验证配置
const validation = validatePlatformConfig('netlify', config)
if (!validation.valid) {
  console.error('配置错误:', validation.errors)
  process.exit(1)
}

// ❌ 不推荐：直接部署，等着报错
await adapter.deploy(config, callbacks)
```

### 3. 错误处理

```typescript
// ✅ 推荐：精确的错误处理
try {
  const adapter = getAdapter('netlify')
  await adapter.deploy(config, callbacks)
} catch (error) {
  if (error instanceof DeployAdapterError) {
    console.error(`[${error.platform}] ${error.code}:`, error.message)
    // 根据 error.code 做不同处理
  }
}

// ❌ 不推荐：吞掉错误
try {
  await adapter.deploy(config, callbacks)
} catch (error) {
  console.log('部署失败') // 信息太少
}
```

### 4. 类型安全

```typescript
// ✅ 推荐：使用泛型获得类型安全
const adapter = getAdapter<NetlifyDeployConfig>('netlify')
if (adapter) {
  // adapter 的类型是 DeployAdapter<NetlifyDeployConfig>
  // config 会有完整的类型检查
}

// ❌ 不推荐：丢失类型信息
const adapter = getAdapter('netlify')
// adapter 的类型是 DeployAdapter<DeployConfig> | undefined
// 类型信息不够精确
```

---

## 故障排除

### 问题1: 适配器未找到

```typescript
const adapter = getAdapter('netlify')
// => undefined
```

**可能原因**:
1. 平台名称拼写错误
2. 适配器未注册

**解决方案**:
```typescript
// 检查可用平台
const platforms = getRegisteredPlatforms()
console.log('可用平台:', platforms)

// 检查适配器是否存在
if (!hasAdapter('netlify')) {
  console.error('Netlify 适配器未注册')
}
```

### 问题2: 配置验证失败

```typescript
const validation = validatePlatformConfig('netlify', config)
// => { valid: false, errors: ['...'] }
```

**解决方案**:
```typescript
// 查看详细错误
console.log('配置错误:')
validation.errors.forEach(err => console.log(`  - ${err}`))

// 应用默认值
const fullConfig = applyConfigDefaults('netlify', config)

// 再次验证
const retryValidation = validatePlatformConfig('netlify', fullConfig)
```

### 问题3: 部署失败

```typescript
const result = await adapter.deploy(config, callbacks)
// => { success: false, error: '...' }
```

**调试步骤**:
1. 检查错误信息
```typescript
console.error('错误:', result.error)
console.error('详细信息:', result.errorDetails)
```

2. 查看平台信息
```typescript
const info = getPlatformInfo('netlify')
console.log('文档:', info.docsUrl)
console.log('认证方式:', info.authType)
```

3. 验证网络连接
```typescript
// 检查是否可以访问平台 API
```

---

## 相关文档

- [重构总结](./REFACTORING_SUMMARY.md) - 了解重构的详细过程和改进
- [类型定义](../../types/deploy.ts) - 完整的 TypeScript 类型定义
- [BaseAdapter](./BaseAdapter.ts) - 适配器基类实现

---

**维护者**: LDesign Team  
**最后更新**: 2025-12-29  
**版本**: 2.0.0
