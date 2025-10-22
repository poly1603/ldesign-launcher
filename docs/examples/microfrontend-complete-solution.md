# 实战案例：微前端完整解决方案

## 📋 项目背景

**场景**: 大型企业应用，需要多团队协作  
**需求**: 独立开发、独立部署、技术栈自由  
**选择**: 微前端架构

---

## 🏗️ 架构设计

```
主应用 (Main App)
├── 用户中心 (User Center) - Vue 3
├── 产品管理 (Product Management) - React
├── 订单系统 (Order System) - Vue 3
└── 数据分析 (Analytics) - React
```

---

## 🚀 Step 1: 创建主应用

### 1.1 初始化主应用

```bash
# 创建主应用目录
mkdir enterprise-portal && cd enterprise-portal

# 初始化主应用
launcher micro init --type main --name enterprise-portal --framework qiankun
```

**自动生成**:
- ✅ 项目结构
- ✅ 主应用入口文件
- ✅ 路由配置
- ✅ 微前端配置

### 1.2 配置主应用

```typescript
// micro.config.ts
export default {
  type: 'main',
  name: 'enterprise-portal',
  port: 3000,
  framework: 'qiankun',
  
  subApps: [
    // 子应用稍后添加
  ],
  
  shared: {
    vue: { singleton: true, eager: true },
    'vue-router': { singleton: true, eager: true },
    pinia: { singleton: true }
  }
}
```

### 1.3 主应用入口

```typescript
// src/main.ts
import { createApp } from 'vue'
import { registerMicroApps, start } from 'qiankun'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)

// 注册微应用（动态加载配置）
registerMicroApps([
  // 将在下面配置
])

// 启动 qiankun
start({
  prefetch: 'all',
  sandbox: { strictStyleIsolation: true }
})

app.mount('#app')
```

---

## 📦 Step 2: 创建子应用

### 2.1 用户中心 (Vue 3)

```bash
cd ..
mkdir user-center && cd user-center

launcher micro init --type sub --name user-center --port 3001
```

**配置子应用**:

```typescript
// micro.config.ts
export default {
  type: 'sub',
  name: 'UserCenter',
  port: 3001,
  framework: 'qiankun'
}
```

**入口文件**:

```typescript
// src/main.ts
import './public-path'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

let instance: any = null
let router: any = null

function render(props: any = {}) {
  const { container } = props
  
  router = createRouter({
    history: createWebHistory(window.__POWERED_BY_QIANKUN__ ? '/user' : '/'),
    routes: [
      { path: '/', component: () => import('./views/Home.vue') },
      { path: '/profile', component: () => import('./views/Profile.vue') }
    ]
  })
  
  instance = createApp(App)
  instance.use(router)
  instance.mount(container ? container.querySelector('#app') : '#app')
}

// 独立运行
if (!window.__POWERED_BY_QIANKUN__) {
  render()
}

// qiankun 生命周期
export async function bootstrap() {
  console.log('[UserCenter] bootstrapped')
}

export async function mount(props: any) {
  console.log('[UserCenter] props from main:', props)
  render(props)
}

export async function unmount() {
  instance?.unmount()
  router = null
  instance = null
}
```

### 2.2 产品管理 (React)

```bash
cd ..
mkdir product-management && cd product-management

launcher micro init --type sub --name product-management --port 3002
```

**React 子应用配置**:

```typescript
// src/index.tsx
import './public-path'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

let root: any = null

function render(props: any = {}) {
  const { container } = props
  const dom = container ? container.querySelector('#root') : document.getElementById('root')
  
  root = ReactDOM.createRoot(dom)
  root.render(
    <BrowserRouter basename={window.__POWERED_BY_QIANKUN__ ? '/product' : '/'}>
      <App />
    </BrowserRouter>
  )
}

if (!window.__POWERED_BY_QIANKUN__) {
  render()
}

export async function bootstrap() {
  console.log('[ProductManagement] bootstrapped')
}

export async function mount(props: any) {
  render(props)
}

export async function unmount() {
  root?.unmount()
}
```

---

## 🔗 Step 3: 注册子应用

回到主应用，注册子应用：

```bash
cd ../enterprise-portal

# 添加用户中心
launcher micro add-app user-center http://localhost:3001 --route /user

# 添加产品管理
launcher micro add-app product-management http://localhost:3002 --route /product
```

**更新后的配置**:

```typescript
// micro.config.ts (自动更新)
export default {
  type: 'main',
  name: 'enterprise-portal',
  port: 3000,
  framework: 'qiankun',
  
  subApps: [
    {
      name: 'user-center',
      entry: 'http://localhost:3001',
      activeRule: '/user',
      container: '#subapp-viewport'
    },
    {
      name: 'product-management',
      entry: 'http://localhost:3002',
      activeRule: '/product',
      container: '#subapp-viewport'
    }
  ]
}
```

---

## 💻 Step 4: 本地开发

### 4.1 启动所有应用

**方式一：一键启动**（推荐）

```bash
# 在主应用目录
launcher micro dev --all
```

**方式二：分别启动**

```bash
# Terminal 1 - 主应用
cd enterprise-portal
launcher micro dev

# Terminal 2 - 用户中心
cd user-center
launcher micro dev

# Terminal 3 - 产品管理
cd product-management
launcher micro dev
```

### 4.2 访问应用

- 主应用: http://localhost:3000
- 用户中心: http://localhost:3000/user
- 产品管理: http://localhost:3000/product

### 4.3 调试技巧

**查看状态**:
```bash
launcher micro status
```

**查看日志**:
```bash
# 主应用会显示所有子应用的加载状态
# 每个子应用也可以独立运行调试
```

---

## 🏭 Step 5: 生产构建

### 5.1 构建所有应用

```bash
cd enterprise-portal
launcher micro build --all --env production
```

**构建输出**:
```
✓ 构建主应用...
  Bundle: 850KB
  Chunks: 12
  
✓ 构建子应用: user-center
  Bundle (UMD): 320KB
  
✓ 构建子应用: product-management
  Bundle (UMD): 280KB
  
✅ 所有应用构建完成
```

### 5.2 优化构建配置

```typescript
// 主应用 vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // 手动分包，提取公共依赖
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue')) return 'vendor-vue'
            if (id.includes('element-plus')) return 'vendor-ui'
            return 'vendor'
          }
        }
      }
    }
  }
})
```

```typescript
// 子应用 vite.config.ts
export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.ts',
      name: 'UserCenter',
      fileName: 'index',
      formats: ['umd']
    },
    rollupOptions: {
      // 外部化共享依赖
      external: ['vue', 'vue-router', 'pinia'],
      output: {
        globals: {
          vue: 'Vue',
          'vue-router': 'VueRouter',
          pinia: 'Pinia'
        }
      }
    }
  }
})
```

---

## 🐳 Step 6: 容器化部署

### 6.1 生成 Docker 配置

```bash
cd enterprise-portal
launcher micro deploy --env production
```

**自动生成**:
- ✅ Dockerfile (多阶段构建)
- ✅ docker-compose.yml
- ✅ .dockerignore
- ✅ nginx.conf

### 6.2 Dockerfile (多阶段构建)

```dockerfile
# 构建阶段
FROM node:18-alpine as builder

WORKDIR /app

# 安装依赖
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# 构建应用
COPY . .
RUN pnpm build

# 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 6.3 docker-compose.yml

```yaml
version: '3.8'

services:
  # 主应用
  main-app:
    build: ./enterprise-portal
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    networks:
      - microfront-network

  # 用户中心
  user-center:
    build: ./user-center
    ports:
      - "3001:80"
    environment:
      - NODE_ENV=production
    networks:
      - microfront-network

  # 产品管理
  product-management:
    build: ./product-management
    ports:
      - "3002:80"
    environment:
      - NODE_ENV=production
    networks:
      - microfront-network

networks:
  microfront-network:
    driver: bridge
```

### 6.4 部署到生产

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f main-app
```

---

## 🔒 Step 7: 进阶配置

### 7.1 应用间通信

**使用 qiankun 的 initGlobalState**:

```typescript
// 主应用
import { initGlobalState } from 'qiankun'

const actions = initGlobalState({
  user: null,
  theme: 'light'
})

actions.onGlobalStateChange((state, prev) => {
  console.log('状态变化:', state, prev)
})

// 子应用可以监听和修改全局状态
```

### 7.2 样式隔离

```typescript
// micro.config.ts
start({
  sandbox: {
    strictStyleIsolation: true,  // 严格样式隔离
    experimentalStyleIsolation: true
  }
})
```

### 7.3 预加载

```typescript
// 主应用
start({
  prefetch: true,  // 预加载子应用
  // 或精确控制
  prefetch: [
    { name: 'user-center', strategy: 'all' },
    { name: 'product-management', strategy: 'idle' }
  ]
})
```

---

## 📊 性能监控

### 监控微前端性能

```bash
# 监控主应用
launcher monitor vitals --url http://localhost:3000

# 监控子应用（独立运行）
launcher monitor vitals --url http://localhost:3001
```

### 分析 Bundle

```bash
# 分析主应用
cd enterprise-portal
launcher monitor build-analyze

# 对比优化前后
launcher monitor build-analyze --compare ./before-optimization.json
```

---

## 🎯 最佳实践

### 1. 版本管理

```json
// 主应用 package.json
{
  "dependencies": {
    "qiankun": "^2.10.16",
    "vue": "^3.3.0",
    "vue-router": "^4.2.0"
  }
}

// 子应用保持相同的主要依赖版本
```

### 2. 错误边界

```typescript
// 主应用
registerMicroApps(apps, {
  beforeLoad: [
    app => {
      console.log('加载前:', app.name)
    }
  ],
  beforeMount: [
    app => {
      console.log('挂载前:', app.name)
    }
  ],
  afterMount: [
    app => {
      console.log('挂载后:', app.name)
    }
  ],
  afterUnmount: [
    app => {
      console.log('卸载后:', app.name)
    }
  ]
})
```

### 3. 性能优化

- ✅ 使用懒加载
- ✅ 启用预加载
- ✅ 共享公共依赖
- ✅ 使用 CDN
- ✅ 启用缓存

### 4. 安全考虑

- ✅ CSP (Content Security Policy)
- ✅ CORS 配置
- ✅ XSS 防护
- ✅ 沙箱隔离

---

## 🎉 成果展示

### 开发效率

- 多团队并行开发：**+200%**
- 部署独立性：**100%**
- 技术栈灵活性：**无限制**

### 性能表现

- 首屏加载：< 2s
- 子应用切换：< 100ms
- 整体 Bundle: 3.5MB (合理)

### 维护成本

- 代码耦合度：**-80%**
- 部署复杂度：**-60%**
- Bug 隔离度：**+90%**

---

## 📚 扩展阅读

- [qiankun 官方文档](https://qiankun.umijs.org/)
- [微前端最佳实践](../guide/microfrontend.md)
- [性能优化指南](./real-world-performance-optimization.md)

---

**🎊 微前端架构让大型应用的开发变得简单高效！**


