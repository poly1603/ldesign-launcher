/**
 * ConfigManager 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ConfigManager } from '../../src/core/ConfigManager'
import { ViteLauncherConfig } from '../../src/types'
import * as fs from 'fs-extra'
import path from 'path'

// Mock fs-extra
vi.mock('fs-extra')

describe('ConfigManager', () => {
  let configManager: ConfigManager
  const testConfigPath = path.join(process.cwd(), 'test-config.ts')

  const mockConfig: ViteLauncherConfig = {
    root: './src',
    build: {
      outDir: 'dist',
      target: 'es2020'
    },
    server: {
      port: 3000,
      host: 'localhost'
    },
    launcher: {
      logLevel: 'info',
      cache: {
        enabled: true,
        dir: '.cache'
      }
    }
  }

  beforeEach(() => {
    configManager = new ConfigManager()
    vi.clearAllMocks()
  })

  afterEach(() => {
    configManager.destroy()
  })

  describe('loadConfig', () => {
    it('应该成功加载配置文件', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true)
      vi.mocked(fs.readFile).mockResolvedValue(`export default ${JSON.stringify(mockConfig)}`)

      const config = await configManager.loadConfig(testConfigPath)

      expect(config).toBeDefined()
      expect(config.root).toBe(mockConfig.root)
      expect(config.server?.port).toBe(3000)
    })

    it('配置文件不存在时应该返回默认配置', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false)

      const config = await configManager.loadConfig('non-existent.ts')

      expect(config).toBeDefined()
      expect(config.root).toBe(process.cwd())
    })

    it('应该正确处理配置文件加载错误', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true)
      vi.mocked(fs.readFile).mockRejectedValue(new Error('读取失败'))

      const config = await configManager.loadConfig(testConfigPath)

      expect(config).toBeDefined()
      // 应该返回默认配置
      expect(config.root).toBe(process.cwd())
    })
  })

  describe('validateConfig', () => {
    it('应该验证有效的配置', async () => {
      const result = await configManager.validateConfig(mockConfig)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该检测无效的端口号', async () => {
      const invalidConfig = {
        ...mockConfig,
        server: {
          port: 99999
        }
      }

      const result = await configManager.validateConfig(invalidConfig)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('服务器端口必须是 1-65535 之间的数字')
    })

    it('应该检测无效的日志级别', async () => {
      const invalidConfig = {
        ...mockConfig,
        launcher: {
          logLevel: 'invalid' as any
        }
      }

      const result = await configManager.validateConfig(invalidConfig)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('日志级别必须是 silent、error、warn、info 或 debug 之一')
    })
  })

  describe('validateConfigWithCache', () => {
    it('应该缓存验证结果', async () => {
      const validateSpy = vi.spyOn(configManager, 'validateConfig')

      // 第一次调用
      const result1 = await configManager.validateConfigWithCache(mockConfig)
      expect(result1.valid).toBe(true)
      expect(validateSpy).toHaveBeenCalledTimes(1)

      // 第二次调用应该使用缓存
      const result2 = await configManager.validateConfigWithCache(mockConfig)
      expect(result2.valid).toBe(true)
      expect(validateSpy).toHaveBeenCalledTimes(1) // 仍然是1次，因为使用了缓存
    })

    it('配置改变时应该重新验证', async () => {
      const validateSpy = vi.spyOn(configManager, 'validateConfig')

      await configManager.validateConfigWithCache(mockConfig)
      expect(validateSpy).toHaveBeenCalledTimes(1)

      const modifiedConfig = { ...mockConfig, root: './different' }
      await configManager.validateConfigWithCache(modifiedConfig)
      expect(validateSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('mergeConfigs', () => {
    it('应该正确合并配置', () => {
      const base: ViteLauncherConfig = {
        root: './src',
        build: {
          outDir: 'dist'
        }
      }

      const override: ViteLauncherConfig = {
        build: {
          target: 'es2020'
        },
        server: {
          port: 4000
        }
      }

      const merged = configManager.mergeConfigs(base, override)

      expect(merged.root).toBe('./src')
      expect(merged.build?.outDir).toBe('dist')
      expect(merged.build?.target).toBe('es2020')
      expect(merged.server?.port).toBe(4000)
    })

    it('应该支持覆盖策略', () => {
      const base: ViteLauncherConfig = {
        root: './src',
        build: {
          outDir: 'dist',
          target: 'es2015'
        }
      }

      const override: ViteLauncherConfig = {
        build: {
          target: 'es2020'
        }
      }

      const merged = configManager.mergeConfigs(base, override, { strategy: 'override' })

      expect(merged.build?.target).toBe('es2020')
      expect(merged.build?.outDir).toBeUndefined() // 覆盖策略会完全替换
    })
  })

  describe('backupConfig 和 rollbackConfig', () => {
    it('应该能够备份和回滚配置', async () => {
      // 设置初始配置
      configManager['currentConfig'] = mockConfig

      // 备份配置
      configManager.backupConfig()

      // 修改配置
      const newConfig = { ...mockConfig, root: './new-root' }
      configManager['currentConfig'] = newConfig

      // 回滚配置
      await configManager.rollbackConfig()

      expect(configManager.getConfig().root).toBe(mockConfig.root)
    })

    it('没有备份时回滚应该抛出错误', async () => {
      await expect(configManager.rollbackConfig()).rejects.toThrow('没有可用的配置备份')
    })
  })

  describe('safeUpdateConfig', () => {
    it('应该安全更新有效配置', async () => {
      const newConfig = { ...mockConfig, root: './new-root' }

      await configManager.safeUpdateConfig(newConfig)

      expect(configManager.getConfig().root).toBe('./new-root')
    })

    it('无效配置应该回滚到备份', async () => {
      configManager['currentConfig'] = mockConfig

      const invalidConfig = {
        ...mockConfig,
        server: {
          port: 99999 // 无效端口
        }
      }

      await expect(configManager.safeUpdateConfig(invalidConfig)).rejects.toThrow()
      expect(configManager.getConfig().server?.port).toBe(3000) // 应该回滚到原配置
    })
  })

  describe('resolveEnvironmentVariables', () => {
    it('应该解析环境变量引用', () => {
      process.env.TEST_PORT = '8080'
      process.env.TEST_HOST = 'example.com'

      const config: ViteLauncherConfig = {
        server: {
          port: 3000,
          host: '${TEST_HOST}'
        },
        build: {
          outDir: '$TEST_PORT/dist'
        }
      }

      const resolved = configManager['resolveEnvironmentVariables'](config)

      expect(resolved.server?.host).toBe('example.com')
      expect(resolved.build?.outDir).toBe('8080/dist')

      delete process.env.TEST_PORT
      delete process.env.TEST_HOST
    })
  })

  describe('自定义验证规则', () => {
    it('应该添加和执行自定义验证规则', async () => {
      const customRule = {
        name: 'custom-rule',
        validate: (config: ViteLauncherConfig) => {
          const errors: string[] = []
          if (config.root === 'forbidden') {
            errors.push('Root cannot be "forbidden"')
          }
          return { errors }
        }
      }

      configManager.addValidationRule(customRule)

      const invalidConfig = { ...mockConfig, root: 'forbidden' }
      const result = await configManager.validateConfig(invalidConfig)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Root cannot be "forbidden"')
    })

    it('应该能够移除验证规则', async () => {
      const customRule = {
        name: 'removable-rule',
        validate: () => ({ errors: ['Always fail'] })
      }

      configManager.addValidationRule(customRule)
      configManager.removeValidationRule('removable-rule')

      const result = await configManager.validateConfig(mockConfig)

      expect(result.errors).not.toContain('Always fail')
    })
  })
})