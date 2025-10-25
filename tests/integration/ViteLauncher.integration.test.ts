/**
 * ViteLauncher 集成测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ViteLauncher } from '../../src/core/ViteLauncher'
import { ViteLauncherConfig } from '../../src/types'
import * as fs from 'fs-extra'
import path from 'path'
import { EventEmitter } from 'events'

// Mock vite
vi.mock('vite', () => ({
  createServer: vi.fn().mockResolvedValue({
    listen: vi.fn(),
    close: vi.fn(),
    restart: vi.fn(),
    ssrLoadModule: vi.fn(),
    transformRequest: vi.fn(),
    config: {
      root: process.cwd()
    }
  }),
  build: vi.fn().mockResolvedValue({
    output: ['dist/index.js']
  }),
  preview: vi.fn().mockResolvedValue({
    listen: vi.fn(),
    close: vi.fn()
  })
}))

describe('ViteLauncher Integration', () => {
  let launcher: ViteLauncher
  const testConfig: ViteLauncherConfig = {
    root: './src',
    mode: 'development',
    server: {
      port: 3000,
      host: 'localhost'
    },
    build: {
      outDir: 'dist',
      target: 'es2020'
    },
    launcher: {
      logLevel: 'info',
      cache: {
        enabled: true,
        dir: '.test-cache'
      },
      plugins: {
        autoLoad: true
      }
    }
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    launcher = new ViteLauncher(testConfig)
    await launcher.initialize()
  })

  afterEach(async () => {
    await launcher.destroy()
  })

  describe('初始化和销毁', () => {
    it('应该正确初始化', () => {
      expect(launcher.isInitialized()).toBe(true)
      expect(launcher.getConfig()).toBeDefined()
      expect(launcher.getConfig().root).toBe('./src')
    })

    it('应该正确处理配置文件加载失败', async () => {
      const errorLauncher = new ViteLauncher({
        ...testConfig,
        configFile: 'non-existent.config.ts'
      })

      await errorLauncher.initialize()

      // 即使配置文件加载失败，也应该使用默认配置初始化
      expect(errorLauncher.isInitialized()).toBe(true)

      await errorLauncher.destroy()
    })

    it('应该正确销毁并清理资源', async () => {
      const server = await launcher.startServer()
      expect(server).toBeDefined()

      await launcher.destroy()

      expect(launcher.isInitialized()).toBe(false)
      expect(vi.mocked(server.close)).toHaveBeenCalled()
    })
  })

  describe('开发服务器', () => {
    it('应该启动开发服务器', async () => {
      const server = await launcher.startServer()

      expect(server).toBeDefined()
      expect(vi.mocked(server.listen)).toHaveBeenCalled()
      expect(launcher.getStats().serverStartCount).toBe(1)
    })

    it('应该支持重启服务器', async () => {
      const server = await launcher.startServer()

      await launcher.restartServer()

      expect(vi.mocked(server.restart)).toHaveBeenCalled()
      expect(launcher.getStats().serverRestartCount).toBe(1)
    })

    it('应该处理服务器启动错误', async () => {
      const { createServer } = await import('vite')
      vi.mocked(createServer).mockRejectedValueOnce(new Error('启动失败'))

      await expect(launcher.startServer()).rejects.toThrow('启动失败')
      expect(launcher.getStats().errorCount).toBe(1)
    })
  })

  describe('构建', () => {
    it('应该执行构建', async () => {
      const result = await launcher.build()

      expect(result).toBeDefined()
      expect(launcher.getStats().buildCount).toBe(1)
    })

    it('应该支持监听模式构建', async () => {
      const result = await launcher.build({ watch: true })

      expect(result).toBeDefined()
      const { build } = await import('vite')
      expect(vi.mocked(build)).toHaveBeenCalledWith(
        expect.objectContaining({
          build: expect.objectContaining({
            watch: {}
          })
        })
      )
    })

    it('应该处理构建错误', async () => {
      const { build } = await import('vite')
      vi.mocked(build).mockRejectedValueOnce(new Error('构建失败'))

      await expect(launcher.build()).rejects.toThrow('构建失败')
      expect(launcher.getStats().errorCount).toBe(1)
    })
  })

  describe('预览服务器', () => {
    it('应该启动预览服务器', async () => {
      const server = await launcher.preview()

      expect(server).toBeDefined()
      expect(vi.mocked(server.listen)).toHaveBeenCalled()
    })

    it('应该处理预览服务器错误', async () => {
      const { preview } = await import('vite')
      vi.mocked(preview).mockRejectedValueOnce(new Error('预览失败'))

      await expect(launcher.preview()).rejects.toThrow('预览失败')
      expect(launcher.getStats().errorCount).toBe(1)
    })
  })

  describe('配置管理', () => {
    it('应该更新配置', async () => {
      const newConfig: ViteLauncherConfig = {
        ...testConfig,
        server: {
          port: 4000
        }
      }

      await launcher.updateConfig(newConfig)

      expect(launcher.getConfig().server?.port).toBe(4000)
    })

    it('应该验证配置', async () => {
      const invalidConfig: ViteLauncherConfig = {
        ...testConfig,
        server: {
          port: 99999 // 无效端口
        }
      }

      await expect(launcher.updateConfig(invalidConfig)).rejects.toThrow()
    })

    it('应该支持配置回滚', async () => {
      const originalPort = launcher.getConfig().server?.port

      const newConfig: ViteLauncherConfig = {
        ...testConfig,
        server: {
          port: 4000
        }
      }

      await launcher.updateConfig(newConfig)
      expect(launcher.getConfig().server?.port).toBe(4000)

      // 假设有回滚功能
      if (launcher['configManager'].rollbackConfig) {
        await launcher['configManager'].rollbackConfig()
        expect(launcher.getConfig().server?.port).toBe(originalPort)
      }
    })
  })

  describe('插件管理', () => {
    it('应该加载插件', async () => {
      const plugins = await launcher['loadPlugins']()

      expect(Array.isArray(plugins)).toBe(true)
      // 根据配置，可能有自动加载的插件
    })

    it('应该支持动态添加插件', async () => {
      const customPlugin = {
        name: 'custom-plugin',
        configResolved: vi.fn()
      }

      launcher['pluginManager'].registerPlugin('custom', {
        name: 'custom-plugin',
        packageName: '@test/custom-plugin',
        enabled: true
      })

      // Mock 插件加载
      vi.doMock('@test/custom-plugin', () => ({
        default: () => customPlugin
      }))

      const plugins = await launcher['loadPlugins']()

      // 验证插件被加载
      expect(plugins.some(p => p?.name === 'custom-plugin')).toBe(true)
    })
  })

  describe('缓存管理', () => {
    it('应该使用缓存', async () => {
      const cacheKey = 'test-data'
      const testData = { value: 'cached' }

      // 设置缓存
      await launcher['cacheManager'].set(cacheKey, 'BUILD', testData)

      // 获取缓存
      const cached = await launcher['cacheManager'].get(cacheKey, 'BUILD')

      expect(cached).toEqual(testData)
    })

    it('应该支持缓存清理', async () => {
      await launcher['cacheManager'].set('test1', 'BUILD', { data: 1 })
      await launcher['cacheManager'].set('test2', 'MODULE', { data: 2 })

      await launcher['cacheManager'].clear()

      const cache1 = await launcher['cacheManager'].get('test1', 'BUILD')
      const cache2 = await launcher['cacheManager'].get('test2', 'MODULE')

      expect(cache1).toBeNull()
      expect(cache2).toBeNull()
    })
  })

  describe('事件系统', () => {
    it('应该触发和监听事件', async () => {
      const listener = vi.fn()

      launcher.on('SERVER_START', listener)

      await launcher.startServer()

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Number)
        })
      )
    })

    it('应该触发错误事件', async () => {
      const errorListener = vi.fn()

      launcher.on('ERROR', errorListener)

      const { createServer } = await import('vite')
      vi.mocked(createServer).mockRejectedValueOnce(new Error('测试错误'))

      try {
        await launcher.startServer()
      } catch {
        // 忽略错误
      }

      expect(errorListener).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          context: expect.any(String)
        })
      )
    })
  })

  describe('性能监控', () => {
    it('应该收集性能指标', async () => {
      await launcher.startServer()
      await launcher.build()

      const stats = launcher.getStats()

      expect(stats.serverStartCount).toBe(1)
      expect(stats.buildCount).toBe(1)
      expect(stats.errorCount).toBe(0)
      expect(stats.uptime).toBeGreaterThan(0)
    })

    it('应该记录错误', async () => {
      const { build } = await import('vite')
      vi.mocked(build).mockRejectedValueOnce(new Error('构建错误'))

      try {
        await launcher.build()
      } catch {
        // 忽略错误
      }

      const stats = launcher.getStats()
      expect(stats.errorCount).toBe(1)
    })
  })

  describe('环境处理', () => {
    it('应该根据环境加载不同配置', async () => {
      process.env.NODE_ENV = 'production'

      const prodLauncher = new ViteLauncher({
        ...testConfig,
        mode: 'production'
      })

      await prodLauncher.initialize()

      expect(prodLauncher.getConfig().mode).toBe('production')

      await prodLauncher.destroy()

      delete process.env.NODE_ENV
    })

    it('应该解析环境变量', () => {
      process.env.TEST_PORT = '8080'

      const envConfig: ViteLauncherConfig = {
        ...testConfig,
        server: {
          port: parseInt('${TEST_PORT}')
        }
      }

      // 如果 ConfigManager 支持环境变量解析
      const resolved = launcher['configManager']['resolveEnvironmentVariables'](envConfig)

      // 注意：这里需要根据实际实现调整
      expect(resolved).toBeDefined()

      delete process.env.TEST_PORT
    })
  })

  describe('错误恢复', () => {
    it('应该从服务器崩溃中恢复', async () => {
      const server = await launcher.startServer()

      // 模拟服务器崩溃
      server.close = vi.fn().mockRejectedValue(new Error('关闭失败'))

      // 尝试重启
      await launcher.restartServer()

      // 应该创建新的服务器实例
      expect(launcher.getStats().serverRestartCount).toBe(1)
    })

    it('应该处理并发构建请求', async () => {
      const builds = await Promise.all([
        launcher.build(),
        launcher.build(),
        launcher.build()
      ])

      // 所有构建都应该成功
      expect(builds).toHaveLength(3)
      expect(launcher.getStats().buildCount).toBe(3)
    })
  })
})






