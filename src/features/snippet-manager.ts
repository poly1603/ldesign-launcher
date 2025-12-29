/**
 * 代码片段管理器
 *
 * 管理常用代码片段、模板和快捷代码生成
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import pc from 'picocolors'
import { FileSystem } from '../utils/file-system'
import { Logger } from '../utils/logger'

export interface Snippet {
  id: string
  name: string
  description?: string
  language: string
  code: string
  tags?: string[]
  category?: string
  variables?: SnippetVariable[]
  createdAt: number
  updatedAt: number
  usageCount: number
}

export interface SnippetVariable {
  name: string
  description?: string
  default?: string
  required?: boolean
}

export interface SnippetCategory {
  id: string
  name: string
  description?: string
  snippets: string[] // snippet IDs
}

export class SnippetManager {
  private logger: Logger
  private snippetsDir: string
  private snippets: Map<string, Snippet> = new Map()

  constructor(configDir?: string) {
    this.logger = new Logger('SnippetManager')
    this.snippetsDir = configDir || path.join(process.env.HOME || process.env.USERPROFILE || '', '.launcher', 'snippets')
  }

  /**
   * 初始化片段管理器
   */
  async init(): Promise<void> {
    await FileSystem.ensureDir(this.snippetsDir)
    await this.loadSnippets()
    await this.loadDefaultSnippets()
  }

  /**
   * 加载用户片段
   */
  private async loadSnippets(): Promise<void> {
    try {
      const files = await fs.readdir(this.snippetsDir)

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.snippetsDir, file)
          const content = await fs.readFile(filePath, 'utf-8')
          const snippet = JSON.parse(content) as Snippet
          this.snippets.set(snippet.id, snippet)
        }
      }

      this.logger.debug(`已加载 ${this.snippets.size} 个代码片段`)
    }
    catch (error) {
      this.logger.warn(`加载代码片段失败: ${(error as Error).message}`)
    }
  }

  /**
   * 加载默认片段
   */
  private async loadDefaultSnippets(): Promise<void> {
    const defaults: Snippet[] = [
      {
        id: 'vue-component',
        name: 'Vue 3 组件模板',
        description: '创建一个标准的 Vue 3 组件',
        language: 'vue',
        code: `<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Hello World'
})

const count = ref(0)
</script>

<template>
  <div class="{{className}}">
    <h1>{{ title }}</h1>
    <p>Count: {{ count }}</p>
    <button @click="count++">Increment</button>
  </div>
</template>

<style scoped>
.{{className}} {
  padding: 20px;
}
</style>`,
        tags: ['vue', 'component', 'typescript'],
        category: 'vue',
        variables: [
          { name: 'className', description: '组件类名', default: 'component', required: true },
          { name: 'title', description: '标题', default: 'Hello World' },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
      },
      {
        id: 'react-component',
        name: 'React 组件模板',
        description: '创建一个标准的 React 函数组件',
        language: 'tsx',
        code: `import React, { useState } from 'react'

interface {{ComponentName}}Props {
  title?: string
}

export const {{ComponentName}}: React.FC<{{ComponentName}}Props> = ({ 
  title = 'Hello World' 
}) => {
  const [count, setCount] = useState(0)

  return (
    <div className="{{className}}">
      <h1>{title}</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  )
}`,
        tags: ['react', 'component', 'typescript'],
        category: 'react',
        variables: [
          { name: 'ComponentName', description: '组件名称', default: 'MyComponent', required: true },
          { name: 'className', description: '组件类名', default: 'component' },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
      },
      {
        id: 'api-request',
        name: 'API 请求函数',
        description: '创建一个类型安全的 API 请求函数',
        language: 'typescript',
        code: `import axios, { AxiosResponse } from 'axios'

interface {{ResponseType}} {
  // TODO: 定义响应类型
}

export async function {{functionName}}(
  params?: Record<string, any>
): Promise<{{ResponseType}}> {
  try {
    const response: AxiosResponse<{{ResponseType}}> = await axios.get(
      '{{apiEndpoint}}',
      { params }
    )
    return response.data
  }
  catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}`,
        tags: ['api', 'typescript', 'axios'],
        category: 'api',
        variables: [
          { name: 'functionName', description: '函数名称', default: 'fetchData', required: true },
          { name: 'ResponseType', description: '响应类型名称', default: 'ApiResponse', required: true },
          { name: 'apiEndpoint', description: 'API 端点', default: '/api/data', required: true },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
      },
      {
        id: 'composable',
        name: 'Vue Composable',
        description: '创建一个可复用的 Vue Composable',
        language: 'typescript',
        code: `import { ref, computed, onMounted, onUnmounted } from 'vue'

export function use{{ComposableName}}() {
  const data = ref<any>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const isReady = computed(() => !loading.value && !error.value)

  async function fetch{{DataName}}() {
    loading.value = true
    error.value = null
    
    try {
      // TODO: 实现数据获取逻辑
      data.value = await Promise.resolve(null)
    }
    catch (err) {
      error.value = err as Error
    }
    finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetch{{DataName}}()
  })

  return {
    data,
    loading,
    error,
    isReady,
    refresh: fetch{{DataName}},
  }
}`,
        tags: ['vue', 'composable', 'typescript'],
        category: 'vue',
        variables: [
          { name: 'ComposableName', description: 'Composable 名称', default: 'Data', required: true },
          { name: 'DataName', description: '数据名称', default: 'Data', required: true },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
      },
      {
        id: 'vite-plugin',
        name: 'Vite 插件模板',
        description: '创建一个基础的 Vite 插件',
        language: 'typescript',
        code: `import type { Plugin } from 'vite'

export interface {{PluginName}}Options {
  // TODO: 定义插件选项
}

export function {{pluginName}}(options: {{PluginName}}Options = {}): Plugin {
  return {
    name: '{{pluginName}}',
    
    configResolved(config) {
      // 配置解析后的钩子
    },
    
    transformIndexHtml(html) {
      // 转换 index.html
      return html
    },
    
    transform(code, id) {
      // 转换模块代码
      return null
    },
  }
}

export default {{pluginName}}`,
        tags: ['vite', 'plugin', 'typescript'],
        category: 'vite',
        variables: [
          { name: 'pluginName', description: '插件函数名（小驼峰）', default: 'myPlugin', required: true },
          { name: 'PluginName', description: '插件类型名（大驼峰）', default: 'MyPlugin', required: true },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
      },
    ]

    for (const snippet of defaults) {
      if (!this.snippets.has(snippet.id)) {
        this.snippets.set(snippet.id, snippet)
      }
    }
  }

  /**
   * 添加新片段
   */
  async add(snippet: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<Snippet> {
    const id = this.generateId(snippet.name)
    const newSnippet: Snippet = {
      ...snippet,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
    }

    this.snippets.set(id, newSnippet)
    await this.saveSnippet(newSnippet)

    this.logger.info(pc.green(`✅ 已添加代码片段: ${newSnippet.name}`))
    return newSnippet
  }

  /**
   * 更新片段
   */
  async update(id: string, updates: Partial<Snippet>): Promise<Snippet> {
    const snippet = this.snippets.get(id)
    if (!snippet) {
      throw new Error(`代码片段不存在: ${id}`)
    }

    const updated: Snippet = {
      ...snippet,
      ...updates,
      id: snippet.id, // 保持 ID 不变
      createdAt: snippet.createdAt, // 保持创建时间
      updatedAt: Date.now(),
    }

    this.snippets.set(id, updated)
    await this.saveSnippet(updated)

    this.logger.info(pc.green(`✅ 已更新代码片段: ${updated.name}`))
    return updated
  }

  /**
   * 删除片段
   */
  async remove(id: string): Promise<void> {
    const snippet = this.snippets.get(id)
    if (!snippet) {
      throw new Error(`代码片段不存在: ${id}`)
    }

    this.snippets.delete(id)

    const filePath = path.join(this.snippetsDir, `${id}.json`)
    try {
      await fs.unlink(filePath)
    }
    catch {
      // 忽略文件不存在的错误
    }

    this.logger.info(pc.green(`✅ 已删除代码片段: ${snippet.name}`))
  }

  /**
   * 获取片段
   */
  get(id: string): Snippet | undefined {
    return this.snippets.get(id)
  }

  /**
   * 获取所有片段
   */
  list(filter?: { language?: string, category?: string, tags?: string[] }): Snippet[] {
    let snippets = Array.from(this.snippets.values())

    if (filter) {
      if (filter.language) {
        snippets = snippets.filter(s => s.language === filter.language)
      }
      if (filter.category) {
        snippets = snippets.filter(s => s.category === filter.category)
      }
      if (filter.tags && filter.tags.length > 0) {
        snippets = snippets.filter(s =>
          s.tags && filter.tags!.some(tag => s.tags!.includes(tag)),
        )
      }
    }

    return snippets.sort((a, b) => b.usageCount - a.usageCount)
  }

  /**
   * 搜索片段
   */
  search(query: string): Snippet[] {
    const lowerQuery = query.toLowerCase()

    return Array.from(this.snippets.values())
      .filter(snippet =>
        snippet.name.toLowerCase().includes(lowerQuery)
        || snippet.description?.toLowerCase().includes(lowerQuery)
        || snippet.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
        || snippet.code.toLowerCase().includes(lowerQuery),
      )
      .sort((a, b) => b.usageCount - a.usageCount)
  }

  /**
   * 使用片段（渲染变量）
   */
  async use(id: string, variables?: Record<string, string>): Promise<string> {
    const snippet = this.snippets.get(id)
    if (!snippet) {
      throw new Error(`代码片段不存在: ${id}`)
    }

    // 增加使用计数
    snippet.usageCount++
    snippet.updatedAt = Date.now()
    await this.saveSnippet(snippet)

    // 渲染变量
    let code = snippet.code

    if (variables && snippet.variables) {
      for (const variable of snippet.variables) {
        const value = variables[variable.name] || variable.default || ''
        const regex = new RegExp(`{{${variable.name}}}`, 'g')
        code = code.replace(regex, value)
      }
    }

    return code
  }

  /**
   * 导出片段
   */
  async export(id: string, outputPath: string): Promise<void> {
    const snippet = this.snippets.get(id)
    if (!snippet) {
      throw new Error(`代码片段不存在: ${id}`)
    }

    await fs.writeFile(outputPath, JSON.stringify(snippet, null, 2), 'utf-8')
    this.logger.info(pc.green(`✅ 已导出代码片段到: ${outputPath}`))
  }

  /**
   * 导入片段
   */
  async import(inputPath: string): Promise<Snippet> {
    const content = await fs.readFile(inputPath, 'utf-8')
    const snippet = JSON.parse(content) as Snippet

    // 生成新 ID 避免冲突
    snippet.id = this.generateId(snippet.name)
    snippet.createdAt = Date.now()
    snippet.updatedAt = Date.now()

    this.snippets.set(snippet.id, snippet)
    await this.saveSnippet(snippet)

    this.logger.info(pc.green(`✅ 已导入代码片段: ${snippet.name}`))
    return snippet
  }

  /**
   * 保存片段到文件
   */
  private async saveSnippet(snippet: Snippet): Promise<void> {
    const filePath = path.join(this.snippetsDir, `${snippet.id}.json`)
    await fs.writeFile(filePath, JSON.stringify(snippet, null, 2), 'utf-8')
  }

  /**
   * 生成唯一 ID
   */
  private generateId(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    let id = base
    let counter = 1

    while (this.snippets.has(id)) {
      id = `${base}-${counter++}`
    }

    return id
  }
}

/**
 * 创建片段管理器实例
 */
export function createSnippetManager(configDir?: string): SnippetManager {
  return new SnippetManager(configDir)
}
