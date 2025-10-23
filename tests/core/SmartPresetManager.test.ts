/**
 * SmartPresetManager 测试用例
 * 
 * 测试智能预设管理功能
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SmartPresetManager } from '../../src/core/SmartPresetManager'
import { Logger } from '../../src/utils/logger'

describe('SmartPresetManager', () => {
  let presetManager: SmartPresetManager
  let logger: Logger
  const testCwd = process.cwd()

  beforeEach(() => {
    logger = new Logger('TestLogger', { level: 'silent' })
    presetManager = new SmartPresetManager(testCwd, logger)
  })

  describe('构造函数', () => {
    it('应该正确初始化', () => {
      expect(presetManager).toBeInstanceOf(SmartPresetManager)
    })
  })

  describe('预设检测', () => {
    it('应该能检测项目预设', async () => {
      const preset = await presetManager.detectPreset()
      
      expect(preset).toBeDefined()
      expect(preset).not.toBeNull()
    })

    it('检测结果应该包含配置', async () => {
      const preset = await presetManager.detectPreset()
      
      if (preset) {
        expect(preset.config).toBeDefined()
        expect(typeof preset.config).toBe('object')
      }
    })
  })

  describe('预设应用', () => {
    it('应该能应用预设配置', async () => {
      const preset = await presetManager.detectPreset()
      
      if (preset) {
        const config = await presetManager.applyPreset(preset.type)
        expect(config).toBeDefined()
        expect(typeof config).toBe('object')
      }
    })
  })

  describe('预设列表', () => {
    it('应该能获取可用预设列表', () => {
      const presets = presetManager.getAvailablePresets()
      
      expect(Array.isArray(presets)).toBe(true)
      expect(presets.length).toBeGreaterThan(0)
    })

    it('预设应该包含基本信息', () => {
      const presets = presetManager.getAvailablePresets()
      
      if (presets.length > 0) {
        const firstPreset = presets[0]
        expect(firstPreset.name).toBeDefined()
        expect(firstPreset.type).toBeDefined()
        expect(firstPreset.config).toBeDefined()
      }
    })
  })

  describe('错误处理', () => {
    it('应该处理检测失败', async () => {
      const invalidManager = new SmartPresetManager('/nonexistent/path', logger)
      const preset = await invalidManager.detectPreset()
      
      // 应该返回默认预设或null
      expect(preset === null || typeof preset === 'object').toBe(true)
    })
  })
})


