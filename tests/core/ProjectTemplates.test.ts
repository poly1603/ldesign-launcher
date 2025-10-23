/**
 * ProjectTemplates 测试用例
 * 
 * 测试项目模板功能
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { describe, it, expect } from 'vitest'
import { ProjectTemplates } from '../../src/core/ProjectTemplates'

describe('ProjectTemplates', () => {
  let templates: ProjectTemplates

  beforeEach(() => {
    templates = new ProjectTemplates()
  })

  describe('模板列表', () => {
    it('应该能获取所有可用模板', () => {
      const allTemplates = templates.getAvailableTemplates()
      
      expect(Array.isArray(allTemplates)).toBe(true)
      expect(allTemplates.length).toBeGreaterThan(0)
    })

    it('应该包含基本的模板类型', () => {
      const allTemplates = templates.getAvailableTemplates()
      const templateTypes = allTemplates.map(t => t.type)
      
      // 至少应该包含一些基本模板
      expect(templateTypes.length).toBeGreaterThan(0)
    })
  })

  describe('模板获取', () => {
    it('应该能根据类型获取模板', () => {
      const allTemplates = templates.getAvailableTemplates()
      if (allTemplates.length > 0) {
        const firstTemplate = allTemplates[0]
        const template = templates.getTemplate(firstTemplate.type)
        
        expect(template).toBeDefined()
        expect(template?.type).toBe(firstTemplate.type)
      }
    })

    it('应该处理不存在的模板类型', () => {
      const template = templates.getTemplate('nonexistent-template')
      expect(template).toBeUndefined()
    })
  })

  describe('模板应用', () => {
    it('applyTemplate 方法应该存在', () => {
      expect(typeof templates.applyTemplate).toBe('function')
    })
  })

  describe('边界情况', () => {
    it('应该处理空模板名称', () => {
      const template = templates.getTemplate('')
      expect(template).toBeUndefined()
    })
  })
})


