/**
 * 插件系统集成测试
 * 
 * 测试插件的注册、加载、执行全流程
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PluginManager } from '../../src/core/PluginManager'
import { SmartPluginManager } from '../../src/core/SmartPluginManager'
import { ViteLauncher } from '../../src/core/ViteLauncher'
import { Logger } from '../../src/utils/logger'
import type { LauncherPlugin } from '../../src/types'

describe('Plugin System Integration', () => {
  let pluginManager: PluginManager
  let logger: Logger

  beforeEach(() => {
    logger = new Logger('TestLogger', { level: 'silent' })
    pluginManager = new PluginManager()
  })

  afterEach(() => {
    pluginManager.removeAllListeners()
  })

  describe('插件注册流程', () => {
    it('应该能注册简单插件', async () => {
      const testPlugin: LauncherPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin'
      }
      
      const result = await pluginManager.register(testPlugin)
      
      expect(result.success).toBe(true)
    })

    it('应该能注册带初始化的插件', async () => {
      const initFn = vi.fn()
      const testPlugin: LauncherPlugin = {
        name: 'test-plugin-with-init',
        version: '1.0.0',
        init: initFn
      }
      
      const result = await pluginManager.register(testPlugin, {
        autoEnable: true
      })
      
      expect(result.success).toBe(true)
    })

    it('应该拒绝重复注册', async () => {
      const testPlugin: LauncherPlugin = {
        name: 'duplicate-plugin',
        version: '1.0.0'
      }
      
      await pluginManager.register(testPlugin)
      const result = await pluginManager.register(testPlugin)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('已存在')
    })
  })

  describe('插件生命周期', () => {
    it('应该能启用插件', async () => {
      const testPlugin: LauncherPlugin = {
        name: 'lifecycle-plugin',
        version: '1.0.0'
      }
      
      await pluginManager.register(testPlugin)
      const result = await pluginManager.enable('lifecycle-plugin')
      
      expect(result.success).toBe(true)
    })

    it('应该能禁用插件', async () => {
      const testPlugin: LauncherPlugin = {
        name: 'disable-plugin',
        version: '1.0.0'
      }
      
      await pluginManager.register(testPlugin, { autoEnable: true })
      const result = await pluginManager.disable('disable-plugin')
      
      expect(result.success).toBe(true)
    })

    it('应该能卸载插件', async () => {
      const testPlugin: LauncherPlugin = {
        name: 'unregister-plugin',
        version: '1.0.0'
      }
      
      await pluginManager.register(testPlugin)
      const result = await pluginManager.unregister('unregister-plugin')
      
      expect(result.success).toBe(true)
    })
  })

  describe('智能插件检测', () => {
    it('应该能检测项目类型', async () => {
      const smartManager = new SmartPluginManager(process.cwd(), logger)
      const projectType = await smartManager.detectProjectType()
      
      expect(projectType).toBeDefined()
    })

    it('应该能获取推荐插件', async () => {
      const smartManager = new SmartPluginManager(process.cwd(), logger)
      const plugins = await smartManager.getRecommendedPlugins()
      
      expect(Array.isArray(plugins)).toBe(true)
    })
  })

  describe('ViteLauncher 插件集成', () => {
    it('应该能添加插件到 launcher', () => {
      const launcher = new ViteLauncher()
      const testPlugin = {
        name: 'vite-test-plugin',
        configureServer: vi.fn()
      }
      
      expect(() => launcher.addPlugin(testPlugin)).not.toThrow()
    })

    it('应该能移除插件', () => {
      const launcher = new ViteLauncher()
      const testPlugin = {
        name: 'removable-plugin',
        configureServer: vi.fn()
      }
      
      launcher.addPlugin(testPlugin)
      expect(() => launcher.removePlugin('removable-plugin')).not.toThrow()
    })

    it('应该能获取插件列表', () => {
      const launcher = new ViteLauncher()
      const plugins = launcher.getPlugins()
      
      expect(Array.isArray(plugins)).toBe(true)
    })
  })

  describe('错误隔离', () => {
    it('插件错误不应该影响其他插件', async () => {
      const failingPlugin: LauncherPlugin = {
        name: 'failing-plugin',
        version: '1.0.0',
        init: async () => {
          throw new Error('Plugin init failed')
        }
      }
      
      const workingPlugin: LauncherPlugin = {
        name: 'working-plugin',
        version: '1.0.0'
      }
      
      await pluginManager.register(failingPlugin, { autoEnable: true })
      const result = await pluginManager.register(workingPlugin, { autoEnable: true })
      
      // 正常插件应该能成功注册
      expect(result.success).toBe(true)
    })
  })

  describe('插件依赖', () => {
    it('应该支持插件依赖声明', async () => {
      const depPlugin: LauncherPlugin = {
        name: 'dependency-plugin',
        version: '1.0.0'
      }
      
      const mainPlugin: LauncherPlugin = {
        name: 'main-plugin',
        version: '1.0.0',
        dependencies: ['dependency-plugin']
      }
      
      await pluginManager.register(depPlugin)
      const result = await pluginManager.register(mainPlugin)
      
      expect(result.success).toBe(true)
    })
  })
})


