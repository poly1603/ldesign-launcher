/**
 * AI 优化器集成测试
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AIOptimizer } from '../../src/ai/optimizer'
import { mkdir, writeFile, rm } from 'fs/promises'
import { join } from 'path'

describe('AIOptimizer Integration', () => {
  let optimizer: AIOptimizer
  let testProjectDir: string

  beforeEach(async () => {
    optimizer = new AIOptimizer()
    testProjectDir = join(process.cwd(), 'test-project-ai')

    // 创建测试项目结构
    await mkdir(join(testProjectDir, 'src'), { recursive: true })
    await mkdir(join(testProjectDir, 'node_modules'), { recursive: true })

    // 创建 package.json
    await writeFile(
      join(testProjectDir, 'package.json'),
      JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'vue': '^3.0.0',
          'lodash': '^4.17.21'
        }
      }),
      'utf-8'
    )

    // 创建源代码文件
    await writeFile(
      join(testProjectDir, 'src/index.ts'),
      `
import { createApp } from 'vue'
import debounce from 'lodash/debounce'

const app = createApp({})

if (true) {
  for (let i = 0; i < 10; i++) {
    console.log(i)
  }
}
      `.trim(),
      'utf-8'
    )
  })

  afterEach(async () => {
    try {
      await rm(testProjectDir, { recursive: true, force: true })
    } catch {
      // 忽略清理错误
    }
  })

  describe('项目分析', () => {
    it('应该能分析测试项目', async () => {
      const analysis = await optimizer.analyzeProject(testProjectDir)

      expect(analysis).toHaveProperty('projectType')
      expect(analysis).toHaveProperty('framework')
      expect(analysis).toHaveProperty('fileStats')
      expect(analysis).toHaveProperty('dependencies')
      expect(analysis).toHaveProperty('codeQuality')
    })

    it('应该能识别框架', async () => {
      const analysis = await optimizer.analyzeProject(testProjectDir)

      expect(analysis.framework).toContain('vue')
    })

    it('应该能统计文件', async () => {
      const analysis = await optimizer.analyzeProject(testProjectDir)

      expect(analysis.fileStats.total).toBeGreaterThan(0)
      expect(analysis.fileStats.ts).toBeGreaterThan(0)
    })

    it('应该能分析依赖', async () => {
      const analysis = await optimizer.analyzeProject(testProjectDir)

      expect(analysis.dependencies.total).toBeGreaterThan(0)
    })
  })

  describe('优化建议生成', () => {
    it('应该能生成优化建议', async () => {
      const analysis = await optimizer.analyzeProject(testProjectDir)
      const suggestions = await optimizer.generateSuggestions(analysis)

      expect(Array.isArray(suggestions)).toBe(true)

      suggestions.forEach(s => {
        expect(s).toHaveProperty('id')
        expect(s).toHaveProperty('priority')
        expect(s).toHaveProperty('category')
        expect(s).toHaveProperty('title')
        expect(s).toHaveProperty('description')
        expect(s).toHaveProperty('implementation')
        expect(['high', 'medium', 'low']).toContain(s.priority)
      })
    })

    it('建议应该按优先级排序', async () => {
      const analysis = await optimizer.analyzeProject(testProjectDir)
      const suggestions = await optimizer.generateSuggestions(analysis)

      if (suggestions.length > 1) {
        const priorities = ['high', 'medium', 'low']
        for (let i = 0; i < suggestions.length - 1; i++) {
          const current = priorities.indexOf(suggestions[i].priority)
          const next = priorities.indexOf(suggestions[i + 1].priority)
          expect(current).toBeLessThanOrEqual(next)
        }
      }
    })
  })

  describe('完整流程', () => {
    it('应该能完成分析→建议→应用的完整流程', async () => {
      // 1. 分析
      const analysis = await optimizer.analyzeProject(testProjectDir)
      expect(analysis).toBeDefined()

      // 2. 生成建议
      const suggestions = await optimizer.generateSuggestions(analysis)
      expect(suggestions.length).toBeGreaterThan(0)

      // 3. 应用建议（这里只测试不抛错）
      if (suggestions.length > 0) {
        await expect(
          optimizer.applySuggestion(suggestions[0].id)
        ).resolves.not.toThrow()
      }
    })
  })
})


