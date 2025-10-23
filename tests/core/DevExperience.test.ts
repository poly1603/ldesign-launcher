/**
 * DevExperience 测试用例
 * 
 * 测试开发体验增强功能
 * 
 * @author LDesign Team  
 * @since 1.2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { DevExperience, createDevExperience, type DevExperienceOptions } from '../../src/core/DevExperience'

describe('DevExperience', () => {
  let devExp: DevExperience
  const testCwd = process.cwd()

  beforeEach(() => {
    const options: DevExperienceOptions = {
      cwd: testCwd,
      enableHMR: true,
      enableErrorOverlay: true,
      enableSourceMap: true
    }
    devExp = new DevExperience(options)
  })

  afterEach(() => {
    devExp.removeAllListeners()
  })

  describe('构造函数和工厂函数', () => {
    it('应该正确初始化', () => {
      expect(devExp).toBeInstanceOf(DevExperience)
    })

    it('createDevExperience 工厂函数应该工作', () => {
      const instance = createDevExperience({ cwd: testCwd })
      expect(instance).toBeInstanceOf(DevExperience)
    })

    it('应该使用默认配置', () => {
      const instance = new DevExperience({})
      expect(instance).toBeInstanceOf(DevExperience)
    })
  })

  describe('Vite 插件创建', () => {
    it('应该能创建 Vite 插件', () => {
      const plugin = devExp.createVitePlugin()
      
      expect(plugin).toBeDefined()
      expect(plugin.name).toBe('launcher:dev-experience')
      expect(plugin.configureServer).toBeDefined()
    })

    it('插件应该有正确的钩子', () => {
      const plugin = devExp.createVitePlugin()
      
      expect(typeof plugin.configureServer).toBe('function')
    })
  })

  describe('开发指标', () => {
    it('应该能获取开发指标', () => {
      const metrics = devExp.getMetrics()
      
      expect(metrics).toBeDefined()
      expect(typeof metrics).toBe('object')
    })
  })

  describe('错误处理', () => {
    it('应该能处理无效的配置', () => {
      expect(() => {
        new DevExperience({ cwd: '' })
      }).not.toThrow()
    })
  })
})


