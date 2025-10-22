/**
 * BundleAnalyzer 单元测试
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BundleAnalyzer, createBundleAnalyzer } from '../../src/utils/bundle-analyzer'
import { mkdir, writeFile, rm } from 'fs/promises'
import { join } from 'path'

describe('BundleAnalyzer', () => {
  let analyzer: BundleAnalyzer
  let testBuildDir: string

  beforeEach(async () => {
    analyzer = new BundleAnalyzer()
    testBuildDir = join(process.cwd(), 'test-build')

    // 创建测试构建目录
    await mkdir(testBuildDir, { recursive: true })

    // 创建测试文件
    await writeFile(join(testBuildDir, 'app.js'), 'a'.repeat(1024 * 100)) // 100KB
    await writeFile(join(testBuildDir, 'vendor.js'), 'b'.repeat(1024 * 600)) // 600KB
    await writeFile(join(testBuildDir, 'style.css'), 'c'.repeat(1024 * 50)) // 50KB
    await writeFile(join(testBuildDir, 'index.html'), '<html></html>')
  })

  afterEach(async () => {
    try {
      await rm(testBuildDir, { recursive: true, force: true })
    } catch {
      // 忽略清理错误
    }
  })

  describe('基础分析', () => {
    it('应该能分析构建目录', async () => {
      const analysis = await analyzer.analyze(testBuildDir)

      expect(analysis).toHaveProperty('totalSize')
      expect(analysis).toHaveProperty('files')
      expect(analysis).toHaveProperty('byType')
      expect(analysis).toHaveProperty('largeFiles')
      expect(analysis).toHaveProperty('suggestions')

      expect(analysis.totalSize).toBeGreaterThan(0)
      expect(analysis.files.length).toBeGreaterThan(0)
    })

    it('应该正确统计文件大小', async () => {
      const analysis = await analyzer.analyze(testBuildDir)

      // 100KB + 600KB + 50KB = 750KB
      expect(analysis.totalSize).toBeGreaterThan(700 * 1024)
      expect(analysis.totalSize).toBeLessThan(800 * 1024)
    })

    it('应该按类型分类文件', async () => {
      const analysis = await analyzer.analyze(testBuildDir)

      expect(analysis.byType).toHaveProperty('js')
      expect(analysis.byType).toHaveProperty('css')
      expect(analysis.byType.js.count).toBe(2) // app.js + vendor.js
      expect(analysis.byType.css.count).toBe(1)
    })

    it('应该识别大文件', async () => {
      const analysis = await analyzer.analyze(testBuildDir)

      // vendor.js 是 600KB，应该被识别为大文件
      expect(analysis.largeFiles.length).toBeGreaterThan(0)

      const vendorFile = analysis.largeFiles.find(f => f.name.includes('vendor'))
      expect(vendorFile).toBeTruthy()
      expect(vendorFile!.size).toBeGreaterThan(500 * 1024)
    })
  })

  describe('优化建议', () => {
    it('应该生成优化建议', async () => {
      const analysis = await analyzer.analyze(testBuildDir)

      expect(Array.isArray(analysis.suggestions)).toBe(true)

      // 600KB 的大文件应该触发建议
      expect(analysis.suggestions.length).toBeGreaterThan(0)
    })

    it('大文件应该触发代码分割建议', async () => {
      const analysis = await analyzer.analyze(testBuildDir)

      const hasSplittingSuggestion = analysis.suggestions.some(s =>
        s.includes('大文件') || s.includes('拆分')
      )

      expect(hasSplittingSuggestion).toBe(true)
    })
  })

  describe('HTML 报告生成', () => {
    it('应该能生成 HTML 报告', async () => {
      const analysis = await analyzer.analyze(testBuildDir)
      const outputPath = join(testBuildDir, 'report.html')

      await analyzer.generateHTMLReport(analysis, outputPath)

      // 检查文件是否生成
      const fs = await import('fs/promises')
      const content = await fs.readFile(outputPath, 'utf-8')

      expect(content).toContain('<!DOCTYPE html>')
      expect(content).toContain('Bundle 分析报告')
    })
  })

  describe('构建对比', () => {
    it('应该能对比两次构建', async () => {
      // 创建第二个构建目录
      const testBuildDir2 = join(process.cwd(), 'test-build-2')
      await mkdir(testBuildDir2, { recursive: true })
      await writeFile(join(testBuildDir2, 'app.js'), 'a'.repeat(1024 * 120)) // 120KB (增加)

      try {
        const comparison = await analyzer.compare(testBuildDir, testBuildDir2)

        expect(comparison).toHaveProperty('current')
        expect(comparison).toHaveProperty('previous')
        expect(comparison).toHaveProperty('diff')

        expect(comparison.diff).toHaveProperty('sizeChange')
        expect(comparison.diff).toHaveProperty('sizeChangePercent')
      } finally {
        await rm(testBuildDir2, { recursive: true, force: true })
      }
    })
  })

  describe('工厂函数', () => {
    it('createBundleAnalyzer 应该创建实例', () => {
      const instance = createBundleAnalyzer()
      expect(instance).toBeInstanceOf(BundleAnalyzer)
    })
  })

  describe('错误处理', () => {
    it('不存在的目录应该抛出错误', async () => {
      await expect(
        analyzer.analyze('nonexistent-directory')
      ).rejects.toThrow()
    })
  })
})


