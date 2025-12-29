/**
 * Mock 服务器增强功能
 *
 * 提供高级 Mock 功能：
 * - 场景切换
 * - 数据持久化
 * - 自动生成 Mock 数据
 * - 请求录制与回放
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type { MockRoute } from '../mock'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import pc from 'picocolors'
import { FileSystem } from '../utils/file-system'
import { Logger } from '../utils/logger'

export interface MockScenario {
  name: string
  description?: string
  routes: MockRoute[]
  active: boolean
}

export interface RecordedRequest {
  url: string
  method: string
  timestamp: number
  request: {
    headers: Record<string, string>
    query: Record<string, string>
    body: unknown
  }
  response: {
    statusCode: number
    headers: Record<string, string>
    body: unknown
    delay: number
  }
}

export interface MockTemplate {
  name: string
  description?: string
  generator: () => unknown
}

export class MockEnhanced {
  private logger: Logger
  private mockDir: string
  private scenariosDir: string
  private recordingsDir: string
  private scenarios: Map<string, MockScenario> = new Map()
  private activeScenario: string = 'default'
  private isRecording: boolean = false
  private recordings: RecordedRequest[] = []

  constructor(cwd: string = process.cwd()) {
    this.logger = new Logger('MockEnhanced')
    this.mockDir = path.join(cwd, 'mock')
    this.scenariosDir = path.join(this.mockDir, 'scenarios')
    this.recordingsDir = path.join(this.mockDir, 'recordings')
  }

  /**
   * 初始化
   */
  async init(): Promise<void> {
    await FileSystem.ensureDir(this.mockDir)
    await FileSystem.ensureDir(this.scenariosDir)
    await FileSystem.ensureDir(this.recordingsDir)
    await this.loadScenarios()
  }

  /**
   * 加载场景
   */
  private async loadScenarios(): Promise<void> {
    try {
      const files = await fs.readdir(this.scenariosDir)

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.scenariosDir, file)
          const content = await fs.readFile(filePath, 'utf-8')
          const scenario = JSON.parse(content) as MockScenario
          this.scenarios.set(scenario.name, scenario)
        }
      }

      // 如果没有场景，创建默认场景
      if (this.scenarios.size === 0) {
        await this.createScenario('default', '默认场景', [])
      }

      this.logger.debug(`已加载 ${this.scenarios.size} 个场景`)
    }
    catch (error) {
      this.logger.warn(`加载场景失败: ${(error as Error).message}`)
    }
  }

  /**
   * 创建场景
   */
  async createScenario(
    name: string,
    description?: string,
    routes: MockRoute[] = [],
  ): Promise<void> {
    const scenario: MockScenario = {
      name,
      description,
      routes,
      active: false,
    }

    this.scenarios.set(name, scenario)
    await this.saveScenario(scenario)
    this.logger.info(pc.green(`✅ 已创建场景: ${name}`))
  }

  /**
   * 保存场景
   */
  private async saveScenario(scenario: MockScenario): Promise<void> {
    const filePath = path.join(this.scenariosDir, `${scenario.name}.json`)
    await fs.writeFile(filePath, JSON.stringify(scenario, null, 2), 'utf-8')
  }

  /**
   * 切换场景
   */
  async switchScenario(name: string): Promise<void> {
    const scenario = this.scenarios.get(name)
    if (!scenario) {
      throw new Error(`场景不存在: ${name}`)
    }

    // 取消之前的激活场景
    for (const s of this.scenarios.values()) {
      s.active = false
    }

    scenario.active = true
    this.activeScenario = name

    this.logger.info(pc.green(`✅ 已切换到场景: ${name}`))
  }

  /**
   * 获取当前激活的场景
   */
  getActiveScenario(): MockScenario | undefined {
    return this.scenarios.get(this.activeScenario)
  }

  /**
   * 列出所有场景
   */
  listScenarios(): MockScenario[] {
    return Array.from(this.scenarios.values())
  }

  /**
   * 删除场景
   */
  async deleteScenario(name: string): Promise<void> {
    if (name === 'default') {
      throw new Error('无法删除默认场景')
    }

    const scenario = this.scenarios.get(name)
    if (!scenario) {
      throw new Error(`场景不存在: ${name}`)
    }

    this.scenarios.delete(name)

    const filePath = path.join(this.scenariosDir, `${name}.json`)
    await FileSystem.remove(filePath)

    this.logger.info(pc.green(`✅ 已删除场景: ${name}`))
  }

  /**
   * 开始录制请求
   */
  startRecording(): void {
    this.isRecording = true
    this.recordings = []
    this.logger.info(pc.yellow('🔴 开始录制请求'))
  }

  /**
   * 停止录制
   */
  stopRecording(): void {
    this.isRecording = false
    this.logger.info(pc.green(`✅ 停止录制，共录制 ${this.recordings.length} 个请求`))
  }

  /**
   * 录制请求
   */
  recordRequest(request: RecordedRequest): void {
    if (this.isRecording) {
      this.recordings.push(request)
    }
  }

  /**
   * 保存录制
   */
  async saveRecording(name: string): Promise<void> {
    const filePath = path.join(this.recordingsDir, `${name}.json`)
    await fs.writeFile(
      filePath,
      JSON.stringify(this.recordings, null, 2),
      'utf-8',
    )
    this.logger.info(pc.green(`✅ 已保存录制: ${name}`))
  }

  /**
   * 加载录制并转换为场景
   */
  async loadRecording(name: string): Promise<RecordedRequest[]> {
    const filePath = path.join(this.recordingsDir, `${name}.json`)
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  }

  /**
   * 从录制生成场景
   */
  async generateScenarioFromRecording(
    recordingName: string,
    scenarioName: string,
  ): Promise<void> {
    const recordings = await this.loadRecording(recordingName)

    const routes: MockRoute[] = recordings.map(rec => ({
      url: rec.url,
      method: rec.method,
      delay: rec.response.delay,
      statusCode: rec.response.statusCode,
      headers: rec.response.headers,
      response: rec.response.body,
    }))

    await this.createScenario(
      scenarioName,
      `从录制 ${recordingName} 生成`,
      routes,
    )

    this.logger.info(pc.green(`✅ 已从录制生成场景: ${scenarioName}`))
  }

  /**
   * 生成 Mock 数据模板
   */
  static getMockTemplates(): Record<string, MockTemplate> {
    return {
      user: {
        name: '用户对象',
        description: '生成随机用户数据',
        generator: () => ({
          id: Math.floor(Math.random() * 10000),
          name: `User${Math.floor(Math.random() * 1000)}`,
          email: `user${Math.floor(Math.random() * 1000)}@example.com`,
          avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
          createdAt: new Date().toISOString(),
        }),
      },

      list: {
        name: '分页列表',
        description: '生成分页列表数据',
        generator: () => ({
          total: 100,
          page: 1,
          pageSize: 10,
          data: Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            title: `Item ${i + 1}`,
            status: ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)],
            createdAt: new Date().toISOString(),
          })),
        }),
      },

      error: {
        name: '错误响应',
        description: '生成错误响应',
        generator: () => ({
          code: 400,
          message: 'Bad Request',
          errors: [
            {
              field: 'email',
              message: 'Invalid email format',
            },
          ],
        }),
      },

      product: {
        name: '商品对象',
        description: '生成随机商品数据',
        generator: () => ({
          id: Math.floor(Math.random() * 10000),
          name: `Product ${Math.floor(Math.random() * 1000)}`,
          price: (Math.random() * 1000).toFixed(2),
          stock: Math.floor(Math.random() * 100),
          image: `https://picsum.photos/200/300?random=${Math.random()}`,
          category: ['Electronics', 'Clothing', 'Books', 'Food'][Math.floor(Math.random() * 4)],
          createdAt: new Date().toISOString(),
        }),
      },

      article: {
        name: '文章对象',
        description: '生成随机文章数据',
        generator: () => ({
          id: Math.floor(Math.random() * 10000),
          title: `Article Title ${Math.floor(Math.random() * 1000)}`,
          content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
          author: `Author${Math.floor(Math.random() * 100)}`,
          tags: ['tech', 'news', 'tutorial'].slice(0, Math.floor(Math.random() * 3) + 1),
          views: Math.floor(Math.random() * 10000),
          likes: Math.floor(Math.random() * 1000),
          publishedAt: new Date().toISOString(),
        }),
      },
    }
  }

  /**
   * 使用模板生成 Mock 数据
   */
  static generateMockData(templateName: string, count: number = 1): unknown {
    const templates = MockEnhanced.getMockTemplates()
    const template = templates[templateName]

    if (!template) {
      throw new Error(`模板不存在: ${templateName}`)
    }

    if (count === 1) {
      return template.generator()
    }

    return Array.from({ length: count }, () => template.generator())
  }

  /**
   * 生成 Mock 文件
   */
  async generateMockFile(
    fileName: string,
    routes: Array<{
      url: string
      method: string
      template: string
      count?: number
    }>,
  ): Promise<void> {
    const filePath = path.join(this.mockDir, `${fileName}.ts`)

    const code = `/**
 * Auto-generated Mock file
 * Generated at: ${new Date().toISOString()}
 */

import type { MockRoute } from '@ldesign/launcher'

const mockRoutes: MockRoute[] = [
${routes.map(route => `  {
    url: '${route.url}',
    method: '${route.method}',
    response: () => ${JSON.stringify(
      MockEnhanced.generateMockData(route.template, route.count || 1),
      null,
      6,
    ).split('\n').map((line, i) => i === 0 ? line : `      ${line}`).join('\n')},
  }`).join(',\n')}
]

export default mockRoutes
`

    await fs.writeFile(filePath, code, 'utf-8')
    this.logger.info(pc.green(`✅ 已生成 Mock 文件: ${fileName}.ts`))
  }

  /**
   * 分析 Mock 使用情况
   */
  async analyzeUsage(): Promise<{
    totalScenarios: number
    totalRoutes: number
    totalRecordings: number
    scenarioStats: Array<{
      name: string
      routes: number
      active: boolean
    }>
  }> {
    const recordings = await fs.readdir(this.recordingsDir)

    return {
      totalScenarios: this.scenarios.size,
      totalRoutes: Array.from(this.scenarios.values()).reduce(
        (sum, s) => sum + s.routes.length,
        0,
      ),
      totalRecordings: recordings.filter(f => f.endsWith('.json')).length,
      scenarioStats: Array.from(this.scenarios.values()).map(s => ({
        name: s.name,
        routes: s.routes.length,
        active: s.active,
      })),
    }
  }
}

/**
 * 创建增强 Mock 管理器
 */
export function createMockEnhanced(cwd?: string): MockEnhanced {
  return new MockEnhanced(cwd)
}
