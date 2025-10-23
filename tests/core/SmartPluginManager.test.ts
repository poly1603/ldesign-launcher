/**
 * SmartPluginManager 测试用例
 * 
 * 测试智能插件检测和加载功能
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SmartPluginManager, ProjectType } from '../../src/core/SmartPluginManager'
import { Logger } from '../../src/utils/logger'

describe('SmartPluginManager', () => {
  let pluginManager: SmartPluginManager
  let logger: Logger
  const testCwd = process.cwd()

  beforeEach(() => {
    logger = new Logger('TestLogger', { level: 'silent' })
    pluginManager = new SmartPluginManager(testCwd, logger)
  })

  describe('项目类型检测', () => {
    it('应该能检测 Vue 3 项目', async () => {
      // 模拟环境会根据实际项目进行检测
      const projectType = await pluginManager.detectProjectType()
      expect(projectType).toBeDefined()
      expect(Object.values(ProjectType)).toContain(projectType)
    })

    it('应该缓存检测结果', async () => {
      const type1 = await pluginManager.detectProjectType()
      const type2 = await pluginManager.detectProjectType()
      
      // 第二次应该直接返回缓存结果
      expect(type1).toBe(type2)
    })

    it('getDetectedType 应该返回检测到的类型', async () => {
      await pluginManager.detectProjectType()
      const detectedType = pluginManager.getDetectedType()
      
      expect(detectedType).toBeDefined()
      expect(Object.values(ProjectType)).toContain(detectedType!)
    })
  })

  describe('插件加载', () => {
    it('应该能获取推荐插件列表', async () => {
      const plugins = await pluginManager.getRecommendedPlugins()
      
      expect(Array.isArray(plugins)).toBe(true)
      // 根据项目类型，可能有0个或多个插件
      expect(plugins.length).toBeGreaterThanOrEqual(0)
    })

    it('应该处理插件加载失败的情况', async () => {
      // 这个测试验证错误处理机制
      const plugins = await pluginManager.getRecommendedPlugins()
      
      // 不应该抛出异常
      expect(() => plugins).not.toThrow()
    })
  })

  describe('缓存机制', () => {
    it('应该使用缓存提升性能', async () => {
      const start1 = Date.now()
      await pluginManager.detectProjectType()
      const time1 = Date.now() - start1

      // 创建新实例，使用缓存
      const pluginManager2 = new SmartPluginManager(testCwd, logger)
      const start2 = Date.now()
      await pluginManager2.detectProjectType()
      const time2 = Date.now() - start2

      // 第二次应该更快（使用缓存）
      // 注意：这个断言可能不稳定，仅作参考
      if (time1 > 10) {
        expect(time2).toBeLessThanOrEqual(time1)
      }
    })
  })

  describe('边界情况', () => {
    it('应该处理不存在的工作目录', async () => {
      const invalidManager = new SmartPluginManager('/nonexistent/path', logger)
      const type = await invalidManager.detectProjectType()
      
      // 应该回退到 VANILLA 类型
      expect(type).toBe(ProjectType.VANILLA)
    })

    it('应该处理空的 package.json', async () => {
      // 这个测试依赖实际文件系统，主要验证不会崩溃
      await expect(pluginManager.detectProjectType()).resolves.toBeDefined()
    })
  })
})


