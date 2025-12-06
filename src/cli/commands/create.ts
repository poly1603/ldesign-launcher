/**
 * launcher create 命令
 *
 * 快速创建新项目，支持多种框架模板
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type { CliContext } from '../../types'
import { spawn } from 'node:child_process'
import path from 'node:path'
import boxen from 'boxen'
import chalk from 'chalk'
import fs from 'fs-extra'
import inquirer from 'inquirer'
import ora from 'ora'

/**
 * 支持的框架模板
 */
const TEMPLATES = [
  {
    name: 'react',
    displayName: 'React',
    icon: '⚛️',
    description: 'React 18 + TypeScript',
    variants: [
      { name: 'react-ts', display: 'TypeScript', color: chalk.blue },
      { name: 'react-ts-tailwind', display: 'TypeScript + TailwindCSS', color: chalk.cyan },
      { name: 'react-ts-router', display: 'TypeScript + React Router', color: chalk.green },
    ],
  },
  {
    name: 'vue',
    displayName: 'Vue 3',
    icon: '💚',
    description: 'Vue 3 + TypeScript',
    variants: [
      { name: 'vue-ts', display: 'TypeScript', color: chalk.green },
      { name: 'vue-ts-pinia', display: 'TypeScript + Pinia', color: chalk.yellow },
      { name: 'vue-ts-tailwind', display: 'TypeScript + TailwindCSS', color: chalk.cyan },
    ],
  },
  {
    name: 'svelte',
    displayName: 'Svelte',
    icon: '🔥',
    description: 'Svelte 4 + TypeScript',
    variants: [
      { name: 'svelte-ts', display: 'TypeScript', color: chalk.red },
      { name: 'sveltekit', display: 'SvelteKit', color: chalk.magenta },
    ],
  },
  {
    name: 'solid',
    displayName: 'Solid.js',
    icon: '💙',
    description: 'Solid.js + TypeScript',
    variants: [
      { name: 'solid-ts', display: 'TypeScript', color: chalk.blue },
    ],
  },
  {
    name: 'vanilla',
    displayName: 'Vanilla',
    icon: '📜',
    description: '原生 JavaScript/TypeScript',
    variants: [
      { name: 'vanilla-ts', display: 'TypeScript', color: chalk.yellow },
      { name: 'vanilla-js', display: 'JavaScript', color: chalk.gray },
    ],
  },
]

interface CreateCommandOptions {
  template?: string
  install?: boolean
  git?: boolean
  packageManager?: string
}

/**
 * 显示创建 Banner
 */
function showBanner(): void {
  const banner = boxen(
    `
${chalk.bold.cyan('✨ LDesign Launcher Create')}

${chalk.gray('快速创建新项目，支持多种框架模板')}
`.trim(),
    {
      padding: 1,
      margin: { top: 1, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'cyan',
    },
  )
  console.log(banner)
}

/**
 * 生成 package.json
 */
function generatePackageJson(
  projectName: string,
  template: string,
): Record<string, unknown> {
  const base = {
    name: projectName,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'launcher dev',
      build: 'launcher build',
      preview: 'launcher preview',
    },
    devDependencies: {
      '@ldesign/launcher': '^2.0.0',
      'typescript': '^5.3.0',
    },
  }

  // 根据模板添加依赖
  const deps: Record<string, Record<string, string>> = {
    'react-ts': {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
    },
    'react-ts-tailwind': {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      'tailwindcss': '^3.4.0',
      'autoprefixer': '^10.4.0',
      'postcss': '^8.4.0',
    },
    'react-ts-router': {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      'react-router-dom': '^6.0.0',
    },
    'vue-ts': {
      vue: '^3.4.0',
    },
    'vue-ts-pinia': {
      vue: '^3.4.0',
      pinia: '^2.1.0',
    },
    'vue-ts-tailwind': {
      vue: '^3.4.0',
      tailwindcss: '^3.4.0',
      autoprefixer: '^10.4.0',
      postcss: '^8.4.0',
    },
    'svelte-ts': {
      svelte: '^4.2.0',
    },
    'sveltekit': {
      'svelte': '^4.2.0',
      '@sveltejs/kit': '^2.0.0',
    },
    'solid-ts': {
      'solid-js': '^1.8.0',
    },
    'vanilla-ts': {},
    'vanilla-js': {},
  }

  const templateDeps = deps[template] || {}
  const dependencies: Record<string, string> = {}
  const devDependencies: Record<string, string> = { ...base.devDependencies as Record<string, string> }

  for (const [name, version] of Object.entries(templateDeps)) {
    if (name.startsWith('@types/') || ['typescript', 'tailwindcss', 'autoprefixer', 'postcss'].includes(name)) {
      devDependencies[name] = version
    }
    else {
      dependencies[name] = version
    }
  }

  return {
    ...base,
    dependencies: Object.keys(dependencies).length > 0 ? dependencies : undefined,
    devDependencies,
  }
}

/**
 * 生成模板文件
 */
async function generateTemplateFiles(
  projectDir: string,
  template: string,
  projectName: string,
): Promise<void> {
  const framework = template.split('-')[0]

  // 创建目录结构
  await fs.ensureDir(path.join(projectDir, 'src'))
  await fs.ensureDir(path.join(projectDir, 'public'))

  // 生成 index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.${framework === 'vanilla' && template.includes('js') ? 'js' : 'tsx'}"></script>
</body>
</html>`
  await fs.writeFile(path.join(projectDir, 'index.html'), indexHtml)

  // 生成 tsconfig.json
  if (!template.includes('-js')) {
    const tsconfig = {
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        module: 'ESNext',
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
        ...(framework === 'react' ? { jsx: 'react-jsx' } : {}),
        ...(framework === 'solid' ? { jsx: 'preserve', jsxImportSource: 'solid-js' } : {}),
      },
      include: ['src'],
    }
    await fs.writeFile(
      path.join(projectDir, 'tsconfig.json'),
      JSON.stringify(tsconfig, null, 2),
    )
  }

  // 根据框架生成入口文件
  await generateFrameworkFiles(projectDir, template, projectName)

  // 如果包含 tailwind，生成配置
  if (template.includes('tailwind')) {
    await generateTailwindConfig(projectDir)
  }

  // 生成 .gitignore
  const gitignore = `node_modules
dist
.DS_Store
*.local
.env
.env.*
!.env.example`
  await fs.writeFile(path.join(projectDir, '.gitignore'), gitignore)
}

/**
 * 生成框架特定文件
 */
async function generateFrameworkFiles(
  projectDir: string,
  template: string,
  projectName: string,
): Promise<void> {
  const srcDir = path.join(projectDir, 'src')
  const framework = template.split('-')[0]

  if (framework === 'react') {
    // React 入口文件
    const mainTsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
${template.includes('tailwind') ? 'import \'./index.css\'' : ''}

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`
    await fs.writeFile(path.join(srcDir, 'main.tsx'), mainTsx)

    // App 组件
    const appTsx = `import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <h1>🚀 ${projectName}</h1>
      <div className="card">
        <button onClick={() => setCount(c => c + 1)}>
          Count is {count}
        </button>
      </div>
      <p>
        Edit <code>src/App.tsx</code> and save to test HMR
      </p>
    </div>
  )
}

export default App`
    await fs.writeFile(path.join(srcDir, 'App.tsx'), appTsx)

    if (template.includes('tailwind')) {
      const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

.app {
  @apply min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white;
}

.card {
  @apply p-4;
}

button {
  @apply px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors;
}`
      await fs.writeFile(path.join(srcDir, 'index.css'), indexCss)
    }
  }
  else if (framework === 'vue') {
    // Vue 入口文件
    const mainTs = `import { createApp } from 'vue'
import App from './App.vue'
${template.includes('pinia') ? 'import { createPinia } from \'pinia\'' : ''}
${template.includes('tailwind') ? 'import \'./index.css\'' : ''}

const app = createApp(App)
${template.includes('pinia') ? 'app.use(createPinia())' : ''}
app.mount('#app')`
    await fs.writeFile(path.join(srcDir, 'main.ts'), mainTs)

    // App 组件
    const appVue = `<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div class="app">
    <h1>🚀 ${projectName}</h1>
    <div class="card">
      <button @click="count++">
        Count is {{ count }}
      </button>
    </div>
    <p>
      Edit <code>src/App.vue</code> and save to test HMR
    </p>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>`
    await fs.writeFile(path.join(srcDir, 'App.vue'), appVue)

    // Vue 类型声明
    const envDTs = `/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}`
    await fs.writeFile(path.join(srcDir, 'env.d.ts'), envDTs)

    if (template.includes('tailwind')) {
      const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;`
      await fs.writeFile(path.join(srcDir, 'index.css'), indexCss)
    }
  }
  else if (framework === 'svelte') {
    // Svelte 入口文件
    const mainTs = `import App from './App.svelte'

const app = new App({
  target: document.getElementById('app')!,
})

export default app`
    await fs.writeFile(path.join(srcDir, 'main.ts'), mainTs)

    // App 组件
    const appSvelte = `<script lang="ts">
  let count = 0
</script>

<main>
  <h1>🚀 ${projectName}</h1>
  <div class="card">
    <button on:click={() => count++}>
      Count is {count}
    </button>
  </div>
  <p>
    Edit <code>src/App.svelte</code> and save to test HMR
  </p>
</main>

<style>
  main {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
</style>`
    await fs.writeFile(path.join(srcDir, 'App.svelte'), appSvelte)
  }
  else if (framework === 'solid') {
    // Solid 入口文件
    const mainTsx = `import { render } from 'solid-js/web'
import App from './App'

render(() => <App />, document.getElementById('app')!)`
    await fs.writeFile(path.join(srcDir, 'main.tsx'), mainTsx)

    // App 组件
    const appTsx = `import { createSignal } from 'solid-js'

function App() {
  const [count, setCount] = createSignal(0)

  return (
    <div class="app">
      <h1>🚀 ${projectName}</h1>
      <div class="card">
        <button onClick={() => setCount(c => c + 1)}>
          Count is {count()}
        </button>
      </div>
      <p>
        Edit <code>src/App.tsx</code> and save to test HMR
      </p>
    </div>
  )
}

export default App`
    await fs.writeFile(path.join(srcDir, 'App.tsx'), appTsx)
  }
  else if (framework === 'vanilla') {
    const ext = template.includes('-js') ? 'js' : 'ts'
    const mainContent = `const app = document.getElementById('app')${ext === 'ts' ? '!' : ''}

let count = 0

function render() {
  app${ext === 'ts' ? '' : ' && (app'}.innerHTML = \`
    <div class="app">
      <h1>🚀 ${projectName}</h1>
      <div class="card">
        <button id="counter">Count is \${count}</button>
      </div>
      <p>Edit <code>src/main.${ext}</code> and save to test HMR</p>
    </div>
  \`${ext === 'js' ? ')' : ''}

  document.getElementById('counter')?.addEventListener('click', () => {
    count++
    render()
  })
}

render()`
    await fs.writeFile(path.join(srcDir, `main.${ext}`), mainContent)
  }
}

/**
 * 生成 Tailwind 配置
 */
async function generateTailwindConfig(projectDir: string): Promise<void> {
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue,svelte}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`
  await fs.writeFile(path.join(projectDir, 'tailwind.config.js'), tailwindConfig)

  const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
  await fs.writeFile(path.join(projectDir, 'postcss.config.js'), postcssConfig)
}

/**
 * 初始化 Git 仓库
 */
async function initGit(projectDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const git = spawn('git', ['init'], { cwd: projectDir, shell: true })
    git.on('close', (code) => {
      if (code === 0)
        resolve()
      else reject(new Error('Git init failed'))
    })
    git.on('error', reject)
  })
}

/**
 * 安装依赖
 */
async function installDependencies(
  projectDir: string,
  pm: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const install = spawn(pm, ['install'], { cwd: projectDir, shell: true, stdio: 'inherit' })
    install.on('close', (code) => {
      if (code === 0)
        resolve()
      else reject(new Error('Install failed'))
    })
    install.on('error', reject)
  })
}

/**
 * 检测包管理器
 */
function detectPackageManager(): string {
  const userAgent = process.env.npm_config_user_agent
  if (userAgent?.includes('pnpm'))
    return 'pnpm'
  if (userAgent?.includes('yarn'))
    return 'yarn'
  return 'npm'
}

/**
 * 创建命令处理类
 */
export class CreateCommand {
  name = 'create'
  description = '创建新项目'
  options = [
    { name: 'template', alias: 't', description: '项目模板', type: 'string' as const },
    { name: 'install', alias: 'i', description: '自动安装依赖', type: 'boolean' as const, default: true },
    { name: 'git', alias: 'g', description: '初始化 Git', type: 'boolean' as const, default: true },
    { name: 'packageManager', alias: 'pm', description: '包管理器 (npm/yarn/pnpm)', type: 'string' as const },
  ]

  async handler(ctx: CliContext): Promise<void> {
    const options = ctx.options as CreateCommandOptions
    const args = ctx.args

    showBanner()

    // 获取项目名称
    let projectName = args[0]
    if (!projectName) {
      const { name } = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: '项目名称:',
          default: 'my-app',
          validate: (input: string) => {
            if (!input)
              return '请输入项目名称'
            if (!/^[a-z0-9-]+$/.test(input))
              return '项目名称只能包含小写字母、数字和连字符'
            return true
          },
        },
      ])
      projectName = name
    }

    // 检查目录是否存在
    const projectDir = path.resolve(ctx.cwd, projectName)
    if (await fs.pathExists(projectDir)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `目录 ${projectName} 已存在，是否覆盖？`,
          default: false,
        },
      ])
      if (!overwrite) {
        console.log(chalk.yellow('已取消'))
        return
      }
      await fs.remove(projectDir)
    }

    // 选择框架
    let template = options.template
    if (!template) {
      const { framework } = await inquirer.prompt([
        {
          type: 'list',
          name: 'framework',
          message: '选择框架:',
          choices: TEMPLATES.map(t => ({
            name: `${t.icon} ${t.displayName} - ${chalk.gray(t.description)}`,
            value: t.name,
          })),
        },
      ])

      // 选择变体
      const selectedTemplate = TEMPLATES.find(t => t.name === framework)!
      if (selectedTemplate.variants.length > 1) {
        const { variant } = await inquirer.prompt([
          {
            type: 'list',
            name: 'variant',
            message: '选择模板:',
            choices: selectedTemplate.variants.map(v => ({
              name: v.color(v.display),
              value: v.name,
            })),
          },
        ])
        template = variant
      }
      else {
        template = selectedTemplate.variants[0].name
      }
    }

    // 创建项目
    const spinner = ora('创建项目...').start()

    try {
      // 创建目录
      await fs.ensureDir(projectDir)

      // 生成 package.json
      const packageJson = generatePackageJson(projectName, template)
      await fs.writeFile(
        path.join(projectDir, 'package.json'),
        JSON.stringify(packageJson, null, 2),
      )

      // 生成模板文件
      await generateTemplateFiles(projectDir, template, projectName)

      spinner.succeed('项目创建成功！')

      // 初始化 Git
      if (options.git !== false) {
        const gitSpinner = ora('初始化 Git...').start()
        try {
          await initGit(projectDir)
          gitSpinner.succeed('Git 初始化完成')
        }
        catch {
          gitSpinner.warn('Git 初始化失败')
        }
      }

      // 安装依赖
      if (options.install !== false) {
        const pm = options.packageManager || detectPackageManager()
        console.log()
        console.log(chalk.cyan(`📦 使用 ${pm} 安装依赖...`))
        console.log()
        await installDependencies(projectDir, pm)
      }

      // 显示成功信息
      console.log()
      console.log(
        boxen(
          `
${chalk.bold.green('✨ 项目创建成功！')}

${chalk.cyan('下一步：')}

  ${chalk.gray('$')} cd ${projectName}
  ${chalk.gray('$')} launcher dev

${chalk.gray('Happy coding! 🚀')}
`.trim(),
          {
            padding: 1,
            margin: { top: 1, bottom: 1, left: 0, right: 0 },
            borderStyle: 'round',
            borderColor: 'green',
          },
        ),
      )
    }
    catch (error) {
      spinner.fail('创建失败')
      console.error(chalk.red((error as Error).message))
    }
  }
}

export default CreateCommand
