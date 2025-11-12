/**
 * ServerManager 服务器管理器测试
 * 
 * @author LDesign Team
 * @since 2.1.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ServerManager } from '../../src/core/ServerManager'
import { Logger } from '../../src/utils/logger'

describe('ServerManager', () => {
  let serverManager: ServerManager
  let mockLogger: Logger

  beforeEach(() => {
    mockLogger = new Logger('TestServerManager', { level: 'silent' })
    serverManager = new ServerManager({
      cwd: process.cwd(),
      logger: mockLogger,
      environment: 'test'
    })
  })

  afterEach(async () => {
    await serverManager.destroy()
  })

  describe('构造函数', () => {
    it('应该正确初始化 ServerManager 实例', () => {
      expect(serverManager).toBeInstanceOf(ServerManager)
    })
  })

  describe('开发服务器状态检查', () => {
    it('初始状态应该是未运行', () => {
      expect(serverManager.isDevServerRunning()).toBe(false)
      expect(serverManager.getDevServer()).toBeNull()
    })
  })

  describe('预览服务器状态检查', () => {
    it('初始状态应该是未运行', () => {
      expect(serverManager.isPreviewServerRunning()).toBe(false)
      expect(serverManager.getPreviewServer()).toBeNull()
    })
  })

  describe('destroy', () => {
    it('应该能够安全销毁', async () => {
      await expect(serverManager.destroy()).resolves.not.toThrow()
    })
  })
})
