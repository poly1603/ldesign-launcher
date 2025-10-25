/**
 * SmartPluginManager 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SmartPluginManager, PluginConfig } from '../../src/core/SmartPluginManager'
import type { Plugin } from 'vite'

describe('SmartPluginManager', () => {
  let pluginManager: SmartPluginManager

  const mockPlugin: Plugin = {
    name: 'mock-plugin',
    configResolved: vi.fn()
  }

  const mockPluginConfig: PluginConfig = {
    name: 'mock-plugin',
    packageName: '@test/mock-plugin',
    enabled: true,
    priority: 10,
    apply: 'serve',
    conditions: {
      mode: 'development'
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    pluginManager = new SmartPluginManager()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('registerPlugin', () => {
    it('应该注册插件', () => {
      pluginManager.registerPlugin('test', mockPluginConfig)

      const registered = pluginManager.getPluginConfig('test')
      expect(registered).toEqual(mockPluginConfig)
    })

    it('应该覆盖已存在的插件', () => {
      pluginManager.registerPlugin('test', mockPluginConfig)

      const updatedConfig = { ...mockPluginConfig, priority: 20 }
      pluginManager.registerPlugin('test', updatedConfig)

      const registered = pluginManager.getPluginConfig('test')
      expect(registered?.priority).toBe(20)
    })
  })

  describe('unregisterPlugin', () => {
    it('应该注销插件', () => {
      pluginManager.registerPlugin('test', mockPluginConfig)
      pluginManager.unregisterPlugin('test')

      const registered = pluginManager.getPluginConfig('test')
      expect(registered).toBeUndefined()
    })
  })

  describe('loadPlugin', () => {
    it('应该加载启用的插件', async () => {
      const enabledConfig = { ...mockPluginConfig, enabled: true }

      // Mock 动态导入
      vi.doMock(enabledConfig.packageName, () => ({
        default: () => mockPlugin
      }))

      const plugin = await pluginManager['loadPlugin'](enabledConfig)

      expect(plugin).toBeDefined()
      expect(plugin?.name).toBe('mock-plugin')
    })

    it('应该跳过禁用的插件', async () => {
      const disabledConfig = { ...mockPluginConfig, enabled: false }

      const plugin = await pluginManager['loadPlugin'](disabledConfig)

      expect(plugin).toBeNull()
    })

    it('应该在加载失败时重试', async () => {
      let attempts = 0

      vi.doMock(mockPluginConfig.packageName, () => {
        attempts++
        if (attempts < 3) {
          throw new Error('加载失败')
        }
        return { default: () => mockPlugin }
      })

      const plugin = await pluginManager['loadPlugin'](mockPluginConfig)

      expect(attempts).toBe(3)
      expect(plugin).toBeDefined()
    })

    it('重试次数耗尽后应该返回 null', async () => {
      vi.doMock(mockPluginConfig.packageName, () => {
        throw new Error('持续失败')
      })

      const plugin = await pluginManager['loadPlugin'](mockPluginConfig)

      expect(plugin).toBeNull()
    })
  })

  describe('shouldLoadPlugin', () => {
    it('应该根据模式条件决定是否加载', () => {
      const config: PluginConfig = {
        ...mockPluginConfig,
        conditions: {
          mode: 'production'
        }
      }

      expect(pluginManager['shouldLoadPlugin'](config, { mode: 'production' })).toBe(true)
      expect(pluginManager['shouldLoadPlugin'](config, { mode: 'development' })).toBe(false)
    })

    it('应该根据环境条件决定是否加载', () => {
      const config: PluginConfig = {
        ...mockPluginConfig,
        conditions: {
          env: { NODE_ENV: 'test' }
        }
      }

      process.env.NODE_ENV = 'test'
      expect(pluginManager['shouldLoadPlugin'](config, {})).toBe(true)

      process.env.NODE_ENV = 'production'
      expect(pluginManager['shouldLoadPlugin'](config, {})).toBe(false)
    })

    it('应该根据文件模式决定是否加载', () => {
      const config: PluginConfig = {
        ...mockPluginConfig,
        conditions: {
          filePatterns: ['*.vue', '*.tsx']
        }
      }

      // 假设存在匹配的文件
      vi.spyOn(pluginManager as any, 'hasMatchingFiles').mockReturnValue(true)
      expect(pluginManager['shouldLoadPlugin'](config, {})).toBe(true)

      vi.spyOn(pluginManager as any, 'hasMatchingFiles').mockReturnValue(false)
      expect(pluginManager['shouldLoadPlugin'](config, {})).toBe(false)
    })
  })

  describe('loadPlugins', () => {
    it('应该按优先级排序加载插件', async () => {
      const plugin1: PluginConfig = {
        ...mockPluginConfig,
        name: 'plugin-1',
        packageName: '@test/plugin-1',
        priority: 20
      }

      const plugin2: PluginConfig = {
        ...mockPluginConfig,
        name: 'plugin-2',
        packageName: '@test/plugin-2',
        priority: 10
      }

      const plugin3: PluginConfig = {
        ...mockPluginConfig,
        name: 'plugin-3',
        packageName: '@test/plugin-3',
        priority: 30
      }

      pluginManager.registerPlugin('p1', plugin1)
      pluginManager.registerPlugin('p2', plugin2)
      pluginManager.registerPlugin('p3', plugin3)

      // Mock 所有插件
      vi.doMock('@test/plugin-1', () => ({
        default: () => ({ name: 'plugin-1' })
      }))
      vi.doMock('@test/plugin-2', () => ({
        default: () => ({ name: 'plugin-2' })
      }))
      vi.doMock('@test/plugin-3', () => ({
        default: () => ({ name: 'plugin-3' })
      }))

      const plugins = await pluginManager.loadPlugins({ mode: 'development' })

      // 应该按优先级排序：30, 20, 10
      expect(plugins[0]?.name).toBe('plugin-3')
      expect(plugins[1]?.name).toBe('plugin-1')
      expect(plugins[2]?.name).toBe('plugin-2')
    })
  })

  describe('checkPluginDependencies', () => {
    it('应该检查插件依赖', async () => {
      const configWithDeps: PluginConfig = {
        ...mockPluginConfig,
        dependencies: ['dep1', 'dep2']
      }

      pluginManager.registerPlugin('test', configWithDeps)

      // Mock 依赖检查
      vi.doMock('dep1', () => ({}))
      vi.doMock('dep2', () => ({}))

      const result = await pluginManager.checkPluginDependencies('test')

      expect(result.satisfied).toBe(true)
      expect(result.missing).toHaveLength(0)
    })

    it('应该检测缺失的依赖', async () => {
      const configWithDeps: PluginConfig = {
        ...mockPluginConfig,
        dependencies: ['missing-dep']
      }

      pluginManager.registerPlugin('test', configWithDeps)

      // 模拟依赖不存在
      vi.doMock('missing-dep', () => {
        throw new Error('Module not found')
      })

      const result = await pluginManager.checkPluginDependencies('test')

      expect(result.satisfied).toBe(false)
      expect(result.missing).toContain('missing-dep')
    })
  })

  describe('validateAllPluginDependencies', () => {
    it('应该验证所有插件的依赖', async () => {
      const plugin1: PluginConfig = {
        ...mockPluginConfig,
        name: 'plugin-1',
        dependencies: ['dep1']
      }

      const plugin2: PluginConfig = {
        ...mockPluginConfig,
        name: 'plugin-2',
        dependencies: ['dep2', 'missing-dep']
      }

      pluginManager.registerPlugin('p1', plugin1)
      pluginManager.registerPlugin('p2', plugin2)

      vi.doMock('dep1', () => ({}))
      vi.doMock('dep2', () => ({}))
      vi.doMock('missing-dep', () => {
        throw new Error('Module not found')
      })

      const results = await pluginManager.validateAllPluginDependencies()

      expect(results.get('p1')?.satisfied).toBe(true)
      expect(results.get('p2')?.satisfied).toBe(false)
      expect(results.get('p2')?.missing).toContain('missing-dep')
    })
  })

  describe('getPluginDependencyTree', () => {
    it('应该获取插件依赖树', async () => {
      const config: PluginConfig = {
        ...mockPluginConfig,
        dependencies: ['dep1', 'dep2']
      }

      pluginManager.registerPlugin('test', config)

      // Mock package.json 读取
      vi.doMock('@test/mock-plugin/package.json', () => ({
        name: '@test/mock-plugin',
        version: '1.0.0',
        dependencies: {
          'dep1': '^1.0.0',
          'dep2': '^2.0.0'
        }
      }))

      const tree = await pluginManager.getPluginDependencyTree('test')

      expect(tree?.name).toBe('@test/mock-plugin')
      expect(tree?.dependencies).toHaveLength(2)
      expect(tree?.dependencies[0].name).toBe('dep1')
    })
  })

  describe('autoInstallDependencies', () => {
    it('应该自动安装缺失的依赖', async () => {
      const { execSync } = await import('child_process')
      vi.mock('child_process')
      const execSyncMock = vi.mocked(execSync)

      const config: PluginConfig = {
        ...mockPluginConfig,
        dependencies: ['missing-dep']
      }

      pluginManager.registerPlugin('test', config)

      // 模拟依赖缺失
      vi.spyOn(pluginManager, 'checkPluginDependencies').mockResolvedValue({
        satisfied: false,
        missing: ['missing-dep'],
        conflicts: []
      })

      const result = await pluginManager.autoInstallDependencies('test')

      expect(execSyncMock).toHaveBeenCalledWith(
        expect.stringContaining('pnpm add missing-dep'),
        expect.any(Object)
      )
    })

    it('依赖已满足时不应该安装', async () => {
      const { execSync } = await import('child_process')
      vi.mock('child_process')
      const execSyncMock = vi.mocked(execSync)

      const config: PluginConfig = {
        ...mockPluginConfig,
        dependencies: ['existing-dep']
      }

      pluginManager.registerPlugin('test', config)

      // 模拟依赖已存在
      vi.spyOn(pluginManager, 'checkPluginDependencies').mockResolvedValue({
        satisfied: true,
        missing: [],
        conflicts: []
      })

      const result = await pluginManager.autoInstallDependencies('test')

      expect(result).toBe(true)
      expect(execSyncMock).not.toHaveBeenCalled()
    })
  })

  describe('getStats', () => {
    it('应该返回正确的统计信息', () => {
      pluginManager.registerPlugin('p1', { ...mockPluginConfig, enabled: true })
      pluginManager.registerPlugin('p2', { ...mockPluginConfig, enabled: false })
      pluginManager.registerPlugin('p3', { ...mockPluginConfig, enabled: true })

      const stats = pluginManager.getStats()

      expect(stats.total).toBe(3)
      expect(stats.enabled).toBe(2)
      expect(stats.disabled).toBe(1)
    })
  })
})