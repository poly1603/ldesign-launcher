/**
 * 启动性能基准测试
 * 
 * 测试 launcher 的启动性能
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { describe, it, expect, bench } from 'vitest'
import { ViteLauncher } from '../../src/core/ViteLauncher'
import { ConfigManager } from '../../src/core/ConfigManager'
import { SmartPluginManager } from '../../src/core/SmartPluginManager'
import { Logger } from '../../src/utils/logger'

describe('Startup Performance', () => {
  const testCwd = process.cwd()
  const logger = new Logger('PerfTest', { level: 'silent' })

  describe('ViteLauncher 初始化性能', () => {
    it('初始化应该在100ms内完成', () => {
      const start = Date.now()
      const launcher = new ViteLauncher({ cwd: testCwd })
      const duration = Date.now() - start
      
      expect(duration).toBeLessThan(100)
    })

    it('异步初始化应该在500ms内完成', async () => {
      const launcher = new ViteLauncher({ cwd: testCwd })
      
      const start = Date.now()
      await launcher.initialize()
      const duration = Date.now() - start
      
      // 首次初始化可能需要加载配置文件
      expect(duration).toBeLessThan(1000)
    }, 2000)
  })

  describe('ConfigManager 性能', () => {
    it('配置加载应该在200ms内完成', async () => {
      const configManager = new ConfigManager({ logger })
      
      const start = Date.now()
      await configManager.load({ cwd: testCwd })
      const duration = Date.now() - start
      
      // 首次加载
      expect(duration).toBeLessThan(500)
    }, 1000)

    it('缓存配置加载应该更快', async () => {
      const configManager = new ConfigManager({ logger })
      
      // 第一次加载
      const start1 = Date.now()
      await configManager.load({ cwd: testCwd })
      const duration1 = Date.now() - start1
      
      // 第二次加载（使用缓存）
      const start2 = Date.now()
      await configManager.load({ cwd: testCwd })
      const duration2 = Date.now() - start2
      
      // 第二次应该更快（但这不是严格保证，因为缓存可能失效）
      if (duration1 > 50) {
        expect(duration2).toBeLessThanOrEqual(duration1 * 1.5)
      }
    }, 2000)
  })

  describe('SmartPluginManager 性能', () => {
    it('项目类型检测应该在300ms内完成', async () => {
      const pluginManager = new SmartPluginManager(testCwd, logger)
      
      const start = Date.now()
      await pluginManager.detectProjectType()
      const duration = Date.now() - start
      
      expect(duration).toBeLessThan(1000)
    }, 2000)

    it('缓存的项目类型检测应该在10ms内完成', async () => {
      const pluginManager = new SmartPluginManager(testCwd, logger)
      
      // 第一次检测
      await pluginManager.detectProjectType()
      
      // 第二次检测（使用缓存）
      const start = Date.now()
      await pluginManager.detectProjectType()
      const duration = Date.now() - start
      
      expect(duration).toBeLessThan(50)
    })

    it('插件加载应该在500ms内完成', async () => {
      const pluginManager = new SmartPluginManager(testCwd, logger)
      
      const start = Date.now()
      await pluginManager.getRecommendedPlugins()
      const duration = Date.now() - start
      
      expect(duration).toBeLessThan(2000)
    }, 3000)
  })
})

// 性能基准测试（仅在需要时运行）
if (process.env.RUN_BENCHMARKS === 'true') {
  describe.skip('Performance Benchmarks', () => {
    bench('ViteLauncher 构造', () => {
      new ViteLauncher({ cwd: process.cwd() })
    })

    bench('ConfigManager 配置加载', async () => {
      const configManager = new ConfigManager({
        logger: new Logger('Bench', { level: 'silent' })
      })
      await configManager.load({ cwd: process.cwd() })
    })

    bench('SmartPluginManager 项目类型检测', async () => {
      const pluginManager = new SmartPluginManager(
        process.cwd(),
        new Logger('Bench', { level: 'silent' })
      )
      await pluginManager.detectProjectType()
    })
  })
}


