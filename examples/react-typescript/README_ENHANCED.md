# React + TypeScript 示例项目

使用 `@ldesign/launcher` 的 React + TypeScript 完整示例。

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发命令

```bash
# 启动开发服务器
launcher dev

# 构建生产版本
launcher build

# 预览构建结果
launcher preview
```

---

## ⚙️ 配置文件

### launcher.config.ts

```typescript
import { defineConfig } from '@ldesign/launcher'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // Fast Refresh
      fastRefresh: true,
      // Babel 配置
      babel: {
        plugins: [
          // 你的 Babel 插件
        ]
      }
    })
  ],
  
  server: {
    port: 3000,
    open: true
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  
  resolve: {
    alias: [
      { find: '@', replacement: './src' },
      { find: '@components', replacement: './src/components' },
      { find: '@hooks', replacement: './src/hooks' },
      { find: '@utils', replacement: './src/utils' }
    ]
  }
})
```

---

## 🎯 React 最佳实践

### 1. 组件类型定义

```typescript
// 使用 FC 类型
import { FC } from 'react'

interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export const Button: FC<ButtonProps> = ({ 
  label, 
  onClick, 
  variant = 'primary' 
}) => {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
```

### 2. Hooks 使用

```typescript
import { useState, useEffect, useCallback } from 'react'

function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue)
  
  const increment = useCallback(() => {
    setCount(prev => prev + 1)
  }, [])
  
  const decrement = useCallback(() => {
    setCount(prev => prev - 1)
  }, [])
  
  return { count, increment, decrement }
}
```

### 3. 性能优化

```typescript
import { memo, useMemo, useCallback } from 'react'

// 使用 memo 避免不必要的重渲染
export const ExpensiveComponent = memo(({ data }: Props) => {
  // 使用 useMemo 缓存计算结果
  const processed = useMemo(() => {
    return heavyProcessing(data)
  }, [data])
  
  return <div>{processed}</div>
})
```

---

## 🔧 开发工具集成

### ESLint 配置

```json
{
  "extends": [
    "react-app",
    "react-app/jest"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn"
  }
}
```

### Prettier 配置

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100
}
```

---

## 📚 更多资源

- [React 官方文档](https://react.dev/)
- [TypeScript 手册](https://www.typescriptlang.org/)
- [Launcher 文档](../../README.md)

---

**最后更新**: 2025-01-24


