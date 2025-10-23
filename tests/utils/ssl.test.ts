/**
 * SSL 工具测试用例
 * 
 * 测试 SSL 证书管理功能
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createSSLManager, type SSLConfig } from '../../src/utils/ssl'
import { Logger } from '../../src/utils/logger'
import path from 'path'
import os from 'os'

describe('SSL Utils', () => {
  let sslManager: ReturnType<typeof createSSLManager>
  let logger: Logger
  let testCertDir: string

  beforeEach(() => {
    logger = new Logger('TestLogger', { level: 'silent' })
    testCertDir = path.join(os.tmpdir(), 'launcher-ssl-test', Date.now().toString())
    sslManager = createSSLManager(testCertDir, logger)
  })

  describe('SSL Manager 创建', () => {
    it('应该能创建 SSL 管理器', () => {
      expect(sslManager).toBeDefined()
      expect(typeof sslManager.getOrCreateSSLConfig).toBe('function')
    })
  })

  describe('SSL 配置获取', () => {
    it('getOrCreateSSLConfig 应该返回配置', async () => {
      const config = await sslManager.getOrCreateSSLConfig({
        domains: ['localhost'],
        days: 365,
        force: false
      })
      
      expect(config).toBeDefined()
      expect(config.key).toBeDefined()
      expect(config.cert).toBeDefined()
    }, 30000) // SSL 证书生成可能需要时间

    it('应该包含有效的证书路径', async () => {
      const config = await sslManager.getOrCreateSSLConfig({
        domains: ['localhost'],
        days: 365,
        force: false
      })
      
      expect(typeof config.key).toBe('string')
      expect(typeof config.cert).toBe('string')
      expect(config.key.length).toBeGreaterThan(0)
      expect(config.cert.length).toBeGreaterThan(0)
    }, 30000)
  })

  describe('证书验证', () => {
    it('应该处理证书不存在的情况', async () => {
      // 第一次调用应该创建新证书
      const config = await sslManager.getOrCreateSSLConfig({
        domains: ['localhost'],
        days: 365,
        force: false
      })
      
      expect(config).toBeDefined()
    }, 30000)
  })

  describe('错误处理', () => {
    it('应该处理无效的域名', async () => {
      await expect(
        sslManager.getOrCreateSSLConfig({
          domains: [],
          days: 365,
          force: false
        })
      ).resolves.toBeDefined()
    }, 30000)

    it('应该处理无效的天数', async () => {
      await expect(
        sslManager.getOrCreateSSLConfig({
          domains: ['localhost'],
          days: 0,
          force: false
        })
      ).resolves.toBeDefined()
    }, 30000)
  })

  describe('边界情况', () => {
    it('应该处理空的证书目录', async () => {
      const emptyDirManager = createSSLManager('', logger)
      
      await expect(
        emptyDirManager.getOrCreateSSLConfig({
          domains: ['localhost'],
          days: 365,
          force: false
        })
      ).resolves.toBeDefined()
    }, 30000)
  })
})


