/**
 * TestIntegration 测试用例
 * 
 * 测试测试集成功能
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TestIntegration, createTestIntegration, type TestConfig } from '../../src/core/TestIntegration'

describe('TestIntegration', () => {
  let testIntegration: TestIntegration
  const testCwd = process.cwd()

  beforeEach(() => {
    const config: TestConfig = {
      framework: 'vitest',
      cwd: testCwd,
      coverage: true,
      watch: false
    }
    testIntegration = new TestIntegration(config)
  })

  describe('构造函数和工厂函数', () => {
    it('应该正确初始化', () => {
      expect(testIntegration).toBeInstanceOf(TestIntegration)
    })

    it('createTestIntegration 工厂函数应该工作', () => {
      const instance = createTestIntegration({ framework: 'vitest', cwd: testCwd })
      expect(instance).toBeInstanceOf(TestIntegration)
    })

    it('应该支持不同的测试框架', () => {
      const vitestIntegration = new TestIntegration({ framework: 'vitest', cwd: testCwd })
      const jestIntegration = new TestIntegration({ framework: 'jest', cwd: testCwd })
      
      expect(vitestIntegration).toBeInstanceOf(TestIntegration)
      expect(jestIntegration).toBeInstanceOf(TestIntegration)
    })
  })

  describe('Vite 插件创建', () => {
    it('应该能创建 Vite 插件', () => {
      const plugin = testIntegration.createVitePlugin()
      
      expect(plugin).toBeDefined()
      expect(plugin.name).toBe('launcher:test-integration')
    })
  })

  describe('测试执行', () => {
    it('runTests 方法应该存在', () => {
      expect(typeof testIntegration.runTests).toBe('function')
    })

    it('getResults 方法应该返回结果', () => {
      const results = testIntegration.getResults()
      expect(results).toBeDefined()
    })
  })

  describe('配置验证', () => {
    it('应该处理无效配置', () => {
      expect(() => {
        new TestIntegration({ framework: 'vitest', cwd: '' })
      }).not.toThrow()
    })

    it('应该使用默认配置', () => {
      const instance = new TestIntegration({ framework: 'vitest' })
      expect(instance).toBeInstanceOf(TestIntegration)
    })
  })
})


