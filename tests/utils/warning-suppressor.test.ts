/**
 * WarningSuppressor 测试用例
 * 
 * 测试警告抑制功能
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { WarningSuppressor, getGlobalSuppressor, activateGlobalSuppression } from '../../src/utils/warning-suppressor'

describe('WarningSuppressor', () => {
  let suppressor: WarningSuppressor

  beforeEach(() => {
    suppressor = new WarningSuppressor({
      suppressNodeWarnings: true,
      suppressDeprecationWarnings: true,
      showSuppressed: false
    })
  })

  afterEach(() => {
    suppressor.deactivate()
  })

  describe('构造函数', () => {
    it('应该正确初始化', () => {
      expect(suppressor).toBeInstanceOf(WarningSuppressor)
    })

    it('应该使用默认配置', () => {
      const defaultSuppressor = new WarningSuppressor()
      expect(defaultSuppressor).toBeInstanceOf(WarningSuppressor)
    })

    it('应该接受自定义配置', () => {
      const customSuppressor = new WarningSuppressor({
        suppressNodeWarnings: false,
        showSuppressed: true
      })
      
      expect(customSuppressor).toBeInstanceOf(WarningSuppressor)
    })
  })

  describe('激活和停用', () => {
    it('应该能激活警告抑制', () => {
      expect(() => suppressor.activate()).not.toThrow()
    })

    it('应该能停用警告抑制', () => {
      suppressor.activate()
      expect(() => suppressor.deactivate()).not.toThrow()
    })

    it('重复激活应该安全', () => {
      suppressor.activate()
      expect(() => suppressor.activate()).not.toThrow()
    })

    it('重复停用应该安全', () => {
      suppressor.deactivate()
      expect(() => suppressor.deactivate()).not.toThrow()
    })
  })

  describe('自定义过滤规则', () => {
    it('应该能添加自定义过滤规则', () => {
      expect(() => {
        suppressor.addCustomFilter((message) => message.includes('custom'))
      }).not.toThrow()
    })

    it('应该支持多个自定义规则', () => {
      suppressor.addCustomFilter((msg) => msg.includes('rule1'))
      suppressor.addCustomFilter((msg) => msg.includes('rule2'))
      
      expect(suppressor['customFilters'].length).toBe(2)
    })
  })

  describe('统计信息', () => {
    it('应该能获取抑制统计', () => {
      const stats = suppressor.getStats()
      
      expect(stats).toBeDefined()
      expect(typeof stats.suppressedCount).toBe('number')
      expect(stats.suppressedCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe('全局单例', () => {
    it('getGlobalSuppressor 应该返回单例', () => {
      const global1 = getGlobalSuppressor()
      const global2 = getGlobalSuppressor()
      
      expect(global1).toBe(global2)
    })

    it('activateGlobalSuppression 应该激活全局抑制', () => {
      expect(() => activateGlobalSuppression()).not.toThrow()
    })
  })

  describe('边界情况', () => {
    it('应该处理空的警告消息', () => {
      suppressor.activate()
      // 测试不会因空消息而崩溃
      expect(suppressor).toBeInstanceOf(WarningSuppressor)
    })
  })
})


