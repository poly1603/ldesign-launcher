/**
 * 测试环境设置
 */

import { vi } from 'vitest'

// 设置测试超时
vi.setConfig({ testTimeout: 10000 })

// Mock 全局对象
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
}

// 设置测试环境变量
process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

// 清理函数
afterEach(() => {
  vi.clearAllMocks()
})

// 全局清理
afterAll(() => {
  vi.restoreAllMocks()
})