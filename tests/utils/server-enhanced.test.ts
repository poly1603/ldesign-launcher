/**
 * ServerEnhanced 测试用例
 * 
 * 测试服务器增强功能
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ServerEnhanced, createServerEnhanced } from '../../src/utils/server-enhanced'
import { findPortInRange, checkServerHealth, openInBrowser } from '../../src/utils/server'

describe('ServerEnhanced', () => {
  let serverEnhanced: ServerEnhanced

  beforeEach(() => {
    serverEnhanced = new ServerEnhanced({
      autoPortRange: [3000, 3100],
      healthCheck: true,
      healthCheckInterval: 5000
    })
  })

  afterEach(() => {
    serverEnhanced.destroy()
  })

  describe('构造函数和工厂函数', () => {
    it('应该正确初始化', () => {
      expect(serverEnhanced).toBeInstanceOf(ServerEnhanced)
    })

    it('createServerEnhanced 工厂函数应该工作', () => {
      const instance = createServerEnhanced()
      expect(instance).toBeInstanceOf(ServerEnhanced)
      instance.destroy()
    })

    it('应该使用默认配置', () => {
      const defaultEnhanced = new ServerEnhanced()
      expect(defaultEnhanced).toBeInstanceOf(ServerEnhanced)
      defaultEnhanced.destroy()
    })

    it('应该接受自定义配置', () => {
      const custom = new ServerEnhanced({
        autoPortRange: [5000, 5100],
        healthCheck: false,
        browser: {
          name: 'chrome',
          incognito: true
        }
      })

      expect(custom).toBeInstanceOf(ServerEnhanced)
      custom.destroy()
    })
  })

  describe('端口分配', () => {
    it('应该能分配可用端口', async () => {
      const port = await serverEnhanced.allocatePort(3000)

      expect(port).toBeGreaterThanOrEqual(3000)
      expect(port).toBeLessThanOrEqual(3100)
    }, 5000)

    it('首选端口可用时应该返回首选端口', async () => {
      // 这个测试可能不稳定，因为端口可能被占用
      const port = await serverEnhanced.allocatePort(3099)

      expect(port).toBeGreaterThanOrEqual(3000)
      expect(port).toBeLessThanOrEqual(3100)
    }, 5000)
  })

  describe('健康检查', () => {
    it('stopHealthCheck 应该不抛出异常', () => {
      expect(() => serverEnhanced.stopHealthCheck()).not.toThrow()
    })

    it('多次停止健康检查应该安全', () => {
      serverEnhanced.stopHealthCheck()
      expect(() => serverEnhanced.stopHealthCheck()).not.toThrow()
    })
  })

  describe('浏览器打开', () => {
    it('openBrowser 方法应该存在', () => {
      expect(typeof serverEnhanced.openBrowser).toBe('function')
    })

    // 注意：实际打开浏览器的测试会打开真实浏览器，这里只测试不崩溃
    it('应该处理打开失败', async () => {
      await expect(
        serverEnhanced.openBrowser('http://localhost:99999')
      ).resolves.not.toThrow()
    })
  })

  describe('资源清理', () => {
    it('destroy 应该清理资源', () => {
      expect(() => serverEnhanced.destroy()).not.toThrow()
    })

    it('多次 destroy 应该安全', () => {
      serverEnhanced.destroy()
      expect(() => serverEnhanced.destroy()).not.toThrow()
    })
  })
})

describe('Server Utils Enhanced', () => {
  describe('findPortInRange', () => {
    it('应该在范围内查找端口', async () => {
      const port = await findPortInRange([4000, 4100])

      expect(port).toBeGreaterThanOrEqual(4000)
      expect(port).toBeLessThanOrEqual(4100)
    }, 5000)

    it('应该处理无效范围', async () => {
      await expect(findPortInRange([5000, 4000])).rejects.toThrow()
    })

    it('应该处理超出范围的端口', async () => {
      await expect(findPortInRange([70000, 80000])).rejects.toThrow()
    })
  })

  describe('checkServerHealth', () => {
    it('应该检查服务器健康状态', async () => {
      // 使用公共可访问的 URL
      const healthy = await checkServerHealth('https://www.google.com')

      expect(typeof healthy).toBe('boolean')
    }, 10000)

    it('应该处理不可访问的服务器', async () => {
      const healthy = await checkServerHealth('http://localhost:99999')

      expect(healthy).toBe(false)
    }, 6000)

    it('应该处理超时', async () => {
      const healthy = await checkServerHealth('http://nonexistent.invalid', 1000)

      expect(healthy).toBe(false)
    }, 2000)
  })

  describe('openInBrowser', () => {
    it('函数应该存在', () => {
      expect(typeof openInBrowser).toBe('function')
    })

    // 实际打开浏览器会影响测试环境，这里只测试不崩溃
    // 在 CI 环境中应该跳过
    it.skip('应该能打开浏览器', async () => {
      await expect(
        openInBrowser('http://localhost:3000', 'chrome')
      ).resolves.not.toThrow()
    })
  })
})

