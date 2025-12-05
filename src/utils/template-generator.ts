/**
 * 项目模板生成器
 * 用于从模板快速创建新项目
 */
import { promises as fs } from 'fs'
import path from 'path'

export interface TemplateConfig {
  id: string
  name: string
  description: string
  icon: string
  framework: string
  files: Record<string, string>
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  scripts: Record<string, string>
}

export interface CreateProjectOptions {
  template: string
  name: string
  directory: string
  packageManager?: 'npm' | 'pnpm' | 'yarn'
}

/**
 * 内置模板
 */
export const templates: Record<string, TemplateConfig> = {
  vue3: {
    id: 'vue3',
    name: 'Vue 3',
    description: 'Vue 3 + TypeScript + Vite',
    icon: '🟢',
    framework: 'vue3',
    dependencies: {
      vue: '^3.4.0',
    },
    devDependencies: {
      '@ldesign/launcher': 'latest',
      '@vitejs/plugin-vue': '^5.0.0',
      typescript: '^5.3.0',
      vite: '^5.4.0',
    },
    scripts: {
      dev: 'launcher dev',
      build: 'launcher build',
      preview: 'launcher preview',
    },
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{name}}</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>`,
      'src/main.ts': `import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
`,
      'src/App.vue': `<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div class="app">
    <h1>🚀 {{name}}</h1>
    <button @click="count++">Count: {{ count }}</button>
  </div>
</template>

<style scoped>
.app {
  text-align: center;
  padding: 2rem;
}
</style>
`,
      'src/vite-env.d.ts': `/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
`,
      'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": true,
    "noEmit": true
  },
  "include": ["src/**/*.ts", "src/**/*.vue"]
}
`,
    },
  },

  react: {
    id: 'react',
    name: 'React',
    description: 'React 18 + TypeScript + Vite',
    icon: '⚛️',
    framework: 'react',
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
    },
    devDependencies: {
      '@ldesign/launcher': 'latest',
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      '@vitejs/plugin-react': '^4.2.0',
      typescript: '^5.3.0',
      vite: '^5.4.0',
    },
    scripts: {
      dev: 'launcher dev',
      build: 'launcher build',
      preview: 'launcher preview',
    },
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{name}}</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`,
      'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`,
      'src/App.tsx': `import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app" style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>🚀 {{name}}</h1>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
    </div>
  )
}

export default App
`,
      'src/vite-env.d.ts': `/// <reference types="vite/client" />
`,
      'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true
  },
  "include": ["src"]
}
`,
    },
  },

  svelte: {
    id: 'svelte',
    name: 'Svelte',
    description: 'Svelte 4 + TypeScript + Vite',
    icon: '🔥',
    framework: 'svelte',
    dependencies: {
      svelte: '^4.2.0',
    },
    devDependencies: {
      '@ldesign/launcher': 'latest',
      '@sveltejs/vite-plugin-svelte': '^3.0.0',
      typescript: '^5.3.0',
      vite: '^5.4.0',
    },
    scripts: {
      dev: 'launcher dev',
      build: 'launcher build',
      preview: 'launcher preview',
    },
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{name}}</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>`,
      'src/main.ts': `import App from './App.svelte'

const app = new App({
  target: document.getElementById('app')!,
})

export default app
`,
      'src/App.svelte': `<script lang="ts">
  let count = 0
</script>

<div class="app">
  <h1>🚀 {{name}}</h1>
  <button on:click={() => count++}>Count: {count}</button>
</div>

<style>
  .app {
    text-align: center;
    padding: 2rem;
  }
</style>
`,
      'svelte.config.js': `import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  preprocess: vitePreprocess(),
}
`,
    },
  },

  solid: {
    id: 'solid',
    name: 'Solid',
    description: 'SolidJS + TypeScript + Vite',
    icon: '💎',
    framework: 'solid',
    dependencies: {
      'solid-js': '^1.8.0',
    },
    devDependencies: {
      '@ldesign/launcher': 'latest',
      typescript: '^5.3.0',
      vite: '^5.4.0',
      'vite-plugin-solid': '^2.8.0',
    },
    scripts: {
      dev: 'launcher dev',
      build: 'launcher build',
      preview: 'launcher preview',
    },
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{name}}</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/index.tsx"></script>
</body>
</html>`,
      'src/index.tsx': `import { render } from 'solid-js/web'
import App from './App'

render(() => <App />, document.getElementById('root')!)
`,
      'src/App.tsx': `import { createSignal } from 'solid-js'

function App() {
  const [count, setCount] = createSignal(0)

  return (
    <div class="app" style={{ 'text-align': 'center', padding: '2rem' }}>
      <h1>🚀 {{name}}</h1>
      <button onClick={() => setCount(count() + 1)}>Count: {count()}</button>
    </div>
  )
}

export default App
`,
      'tsconfig.json': `{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "jsxImportSource": "solid-js",
    "strict": true,
    "noEmit": true
  },
  "include": ["src"]
}
`,
    },
  },

  vanilla: {
    id: 'vanilla',
    name: 'Vanilla',
    description: 'Vanilla TypeScript + Vite',
    icon: '🌟',
    framework: 'vanilla',
    dependencies: {},
    devDependencies: {
      '@ldesign/launcher': 'latest',
      typescript: '^5.3.0',
      vite: '^5.4.0',
    },
    scripts: {
      dev: 'launcher dev',
      build: 'launcher build',
      preview: 'launcher preview',
    },
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{name}}</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>`,
      'src/main.ts': `import './style.css'

let count = 0

document.querySelector<HTMLDivElement>('#app')!.innerHTML = \`
  <div class="app">
    <h1>🚀 {{name}}</h1>
    <button id="counter" type="button">Count: 0</button>
  </div>
\`

document.querySelector<HTMLButtonElement>('#counter')!.addEventListener('click', (e) => {
  count++
  ;(e.target as HTMLButtonElement).textContent = \`Count: \${count}\`
})
`,
      'src/style.css': `.app {
  text-align: center;
  padding: 2rem;
}

button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
}
`,
      'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true
  },
  "include": ["src"]
}
`,
    },
  },
}

/**
 * 项目模板生成器类
 */
export class TemplateGenerator {
  /**
   * 获取所有可用模板
   */
  getTemplates(): TemplateConfig[] {
    return Object.values(templates)
  }

  /**
   * 获取指定模板
   */
  getTemplate(id: string): TemplateConfig | undefined {
    return templates[id]
  }

  /**
   * 从模板创建项目
   */
  async createProject(options: CreateProjectOptions): Promise<string> {
    const { template: templateId, name, directory } = options

    const template = this.getTemplate(templateId)
    if (!template) {
      throw new Error(`Template "${templateId}" not found`)
    }

    const projectDir = path.join(directory, name)

    // 检查目录是否存在
    try {
      await fs.access(projectDir)
      throw new Error(`Directory "${projectDir}" already exists`)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }

    // 创建项目目录
    await fs.mkdir(projectDir, { recursive: true })
    await fs.mkdir(path.join(projectDir, 'src'), { recursive: true })

    // 生成 package.json
    const packageJson = {
      name,
      version: '1.0.0',
      private: true,
      type: 'module',
      scripts: template.scripts,
      dependencies: template.dependencies,
      devDependencies: template.devDependencies,
    }

    await fs.writeFile(
      path.join(projectDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    )

    // 生成模板文件
    for (const [filePath, content] of Object.entries(template.files)) {
      const fullPath = path.join(projectDir, filePath)
      const dir = path.dirname(fullPath)

      await fs.mkdir(dir, { recursive: true })

      // 替换模板变量
      const processedContent = content.replace(/\{\{name\}\}/g, name)
      await fs.writeFile(fullPath, processedContent)
    }

    // 生成 .gitignore
    await fs.writeFile(
      path.join(projectDir, '.gitignore'),
      `node_modules
dist
.DS_Store
*.local
`
    )

    return projectDir
  }

  /**
   * 获取安装命令
   */
  getInstallCommand(packageManager: 'npm' | 'pnpm' | 'yarn' = 'pnpm'): string {
    switch (packageManager) {
      case 'yarn':
        return 'yarn'
      case 'npm':
        return 'npm install'
      default:
        return 'pnpm install'
    }
  }
}

// 单例
let generatorInstance: TemplateGenerator | null = null

export function getTemplateGenerator(): TemplateGenerator {
  if (!generatorInstance) {
    generatorInstance = new TemplateGenerator()
  }
  return generatorInstance
}
