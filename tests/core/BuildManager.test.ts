/**
 * BuildManager 构建管理器测试
 * 
 * @author LDesign Team
 * @since 2.1.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BuildManager } from '../../src/core/BuildManager'
import { Logger } from '../../src/utils/logger'

describe('BuildManager', () => {
  let buildManager: BuildManager
  let mockLogger: Logger

  beforeEach(() => {
    mockLogger = new Logger('TestBuildManager', { level: 'silent' })
    buildManager = new BuildManager({
      cwd: process.cwd(),
      logger: mockLogger,
      environment: 'test'
    })
  })

  afterEach(async () => {
    await buildManager.destroy()
  })

  describe('构造函数', () => {
    it('应该正确初始化 BuildManager 实例', () => {
      expect(buildManager).toBeInstanceOf(BuildManager)
    })
  })

  describe('构建监听器状态检查', () => {
    it('初始状态应该是未运行', () => {
      expect(buildManager.isBuildWatchRunning()).toBe(false)
      expect(buildManager.getBuildWatcher()).toBeNull()
    })
  })

  describe('destroy', () => {
    it('应该能够安全销毁', async () => {
      await expect(buildManager.destroy()).resolves.not.toThrow()
    })
  })
})
