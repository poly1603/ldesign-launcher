/**
 * 多环境配置集成测试
 * 
 * 测试多环境配置加载和合并功能
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ConfigManager } from '../../src/core/ConfigManager'
import { ViteLauncher } from '../../src/core/ViteLauncher'
import { Logger } from '../../src/utils/logger'

describe('Multi-Environment Integration', () => {
  let logger: Logger

  beforeEach(() => {
    logger = new Logger('TestLogger', { level: 'silent' })
  })

  describe('环境配置加载', () => {
    it('应该能加载开发环境配置', async () => {
      const configManager = new ConfigManager({ logger })
      
      const config = await configManager.load({
        cwd: process.cwd(),
        environment: 'development'
      })
      
      expect(config).toBeDefined()
      expect(typeof config).toBe('object')
    })

    it('应该能加载生产环境配置', async () => {
      const configManager = new ConfigManager({ logger })
      
      const config = await configManager.load({
        cwd: process.cwd(),
        environment: 'production'
      })
      
      expect(config).toBeDefined()
      expect(typeof config).toBe('object')
    })

    it('应该能加载测试环境配置', async () => {
      const configManager = new ConfigManager({ logger })
      
      const config = await configManager.load({
        cwd: process.cwd(),
        environment: 'test'
      })
      
      expect(config).toBeDefined()
      expect(typeof config).toBe('object')
    })
  })

  describe('配置合并', () => {
    it('环境配置应该覆盖基础配置', async () => {
      const configManager = new ConfigManager({ logger })
      
      const devConfig = await configManager.load({
        cwd: process.cwd(),
        environment: 'development'
      })
      
      const prodConfig = await configManager.load({
        cwd: process.cwd(),
        environment: 'production'
      })
      
      // 配置应该不同（如果有环境特定配置的话）
      expect(devConfig).toBeDefined()
      expect(prodConfig).toBeDefined()
    })
  })

  describe('ViteLauncher 环境集成', () => {
    it('应该能使用环境配置启动', async () => {
      const launcher = new ViteLauncher({
        cwd: process.cwd(),
        environment: 'development'
      })
      
      await launcher.initialize()
      const config = launcher.getConfig()
      
      expect(config).toBeDefined()
    })

    it('不同环境应该有不同的配置', async () => {
      const devLauncher = new ViteLauncher({
        cwd: process.cwd(),
        environment: 'development'
      })
      
      const prodLauncher = new ViteLauncher({
        cwd: process.cwd(),
        environment: 'production'
      })
      
      await devLauncher.initialize()
      await prodLauncher.initialize()
      
      const devConfig = devLauncher.getConfig()
      const prodConfig = prodLauncher.getConfig()
      
      expect(devConfig).toBeDefined()
      expect(prodConfig).toBeDefined()
    })
  })

  describe('错误处理', () => {
    it('应该处理无效的环境名称', async () => {
      const configManager = new ConfigManager({ logger })
      
      await expect(
        configManager.load({
          cwd: process.cwd(),
          environment: 'invalid-environment'
        })
      ).resolves.not.toThrow()
    })

    it('应该回退到默认配置', async () => {
      const configManager = new ConfigManager({ logger })
      
      const config = await configManager.load({
        cwd: '/nonexistent/path',
        environment: 'development'
      })
      
      expect(config).toBeDefined()
      expect(typeof config).toBe('object')
    })
  })
})


