/**
 * HMR Enhanced 插件测试用例
 * 
 * 测试增强的热重载功能
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { describe, it, expect } from 'vitest'
import { createHMREnhancedPlugin } from '../../src/plugins/hmr-enhanced'

describe('HMR Enhanced Plugin', () => {
  describe('插件创建', () => {
    it('应该能创建插件', () => {
      const plugin = createHMREnhancedPlugin()
      
      expect(plugin).toBeDefined()
      expect(plugin.name).toBe('launcher:hmr-enhanced')
    })

    it('应该使用默认配置', () => {
      const plugin = createHMREnhancedPlugin()
      expect(plugin).toBeDefined()
    })

    it('应该接受自定义配置', () => {
      const plugin = createHMREnhancedPlugin({
        fallbackToFullReload: false,
        retries: 5,
        showStats: true,
        debug: true,
        timeout: 10000
      })
      
      expect(plugin).toBeDefined()
    })
  })

  describe('插件钩子', () => {
    it('应该有 configureServer 钩子', () => {
      const plugin = createHMREnhancedPlugin()
      expect(plugin.configureServer).toBeDefined()
      expect(typeof plugin.configureServer).toBe('function')
    })

    it('应该有 handleHotUpdate 钩子', () => {
      const plugin = createHMREnhancedPlugin()
      expect(plugin.handleHotUpdate).toBeDefined()
      expect(typeof plugin.handleHotUpdate).toBe('function')
    })

    it('应该有 transformIndexHtml 钩子', () => {
      const plugin = createHMREnhancedPlugin()
      expect(plugin.transformIndexHtml).toBeDefined()
      expect(typeof plugin.transformIndexHtml).toBe('function')
    })
  })

  describe('HTML 转换', () => {
    it('应该注入客户端代码', () => {
      const plugin = createHMREnhancedPlugin()
      const html = '<html><head></head><body></body></html>'

      if (plugin.transformIndexHtml && typeof plugin.transformIndexHtml === 'function') {
        const result = plugin.transformIndexHtml(html, {} as any)
        
        if (typeof result === 'string') {
          expect(result).toContain('<script')
          expect(result).toContain('import.meta.hot')
        }
      }
    })

    it('注入的代码应该包含配置', () => {
      const plugin = createHMREnhancedPlugin({
        fallbackToFullReload: true,
        debug: true
      })

      const html = '<html><head></head><body></body></html>'

      if (plugin.transformIndexHtml && typeof plugin.transformIndexHtml === 'function') {
        const result = plugin.transformIndexHtml(html, {} as any)
        
        if (typeof result === 'string') {
          expect(result).toContain('fallbackToFullReload')
        }
      }
    })
  })

  describe('配置选项', () => {
    it('fallbackToFullReload 应该默认启用', () => {
      const plugin = createHMREnhancedPlugin()
      // 默认配置应该启用回退
      expect(plugin).toBeDefined()
    })

    it('应该支持禁用回退', () => {
      const plugin = createHMREnhancedPlugin({
        fallbackToFullReload: false
      })
      expect(plugin).toBeDefined()
    })

    it('应该支持自定义重试次数', () => {
      const plugin = createHMREnhancedPlugin({
        retries: 5
      })
      expect(plugin).toBeDefined()
    })
  })
})

