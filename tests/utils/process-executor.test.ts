/**
 * ProcessExecutor 单元测试
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ProcessExecutor, createProcessExecutor } from '../../src/utils/process-executor'

describe('ProcessExecutor', () => {
  let executor: ProcessExecutor

  beforeEach(() => {
    executor = new ProcessExecutor()
  })

  describe('基础命令执行', () => {
    it('应该能执行简单命令', async () => {
      const result = await executor.execute('node', ['--version'])

      expect(result).toHaveProperty('exitCode')
      expect(result).toHaveProperty('stdout')
      expect(result).toHaveProperty('stderr')
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('duration')

      expect(result.exitCode).toBe(0)
      expect(result.success).toBe(true)
      expect(result.stdout).toContain('v')
    })

    it('失败的命令应该返回非零退出码', async () => {
      const result = await executor.execute('node', ['--invalid-flag-xyz'])

      expect(result.success).toBe(false)
      expect(result.exitCode).not.toBe(0)
    })

    it('应该记录执行时长', async () => {
      const result = await executor.execute('node', ['--version'])

      expect(result.duration).toBeGreaterThan(0)
      expect(typeof result.duration).toBe('number')
    })
  })

  describe('Shell 命令执行', () => {
    it('应该能执行 Shell 命令', async () => {
      const command = process.platform === 'win32' ? 'echo test' : 'echo "test"'
      const result = await executor.executeShell(command)

      expect(result.success).toBe(true)
      expect(result.stdout).toContain('test')
    })
  })

  describe('并发执行', () => {
    it('应该能并发执行多个命令', async () => {
      const commands = [
        { command: 'node', args: ['--version'] },
        { command: 'npm', args: ['--version'] }
      ]

      const results = await executor.executeConcurrent(commands, {}, 2)

      expect(results).toHaveLength(2)
      expect(results.every(r => r.success)).toBe(true)
    })

    it('应该限制并发数', async () => {
      const commands = Array(5).fill({ command: 'node', args: ['--version'] })

      const startTime = Date.now()
      await executor.executeConcurrent(commands, {}, 2) // 并发数2
      const duration = Date.now() - startTime

      // 5个任务，并发2，至少需要 3 批次
      expect(results).toHaveLength(5)
    })
  })

  describe('包管理器命令', () => {
    it('应该能执行 npm 命令', async () => {
      const result = await executor.executePackageManager('npm', '--version')

      expect(result.success).toBe(true)
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/)
    })

    it('应该能执行 pnpm 命令（如果可用）', async () => {
      const isAvailable = await executor.isCommandAvailable('pnpm')

      if (isAvailable) {
        const result = await executor.executePackageManager('pnpm', '--version')
        expect(result.success).toBe(true)
      }
    })
  })

  describe('命令可用性检查', () => {
    it('应该能检查 node 命令可用', async () => {
      const available = await executor.isCommandAvailable('node')
      expect(available).toBe(true)
    })

    it('不存在的命令应该返回 false', async () => {
      const available = await executor.isCommandAvailable('nonexistent-command-xyz')
      expect(available).toBe(false)
    })
  })

  describe('工厂函数', () => {
    it('createProcessExecutor 应该创建实例', () => {
      const instance = createProcessExecutor()
      expect(instance).toBeInstanceOf(ProcessExecutor)
    })
  })

  describe('错误处理', () => {
    it('执行异常应该被捕获', async () => {
      const result = await executor.execute('invalid-command-that-does-not-exist')

      expect(result.success).toBe(false)
      expect(result.stderr).toBeTruthy()
    })
  })
})


