/**
 * Monitor 命令单元测试
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MonitorCommand } from '../../src/cli/commands/monitor'

describe('MonitorCommand', () => {
  let command: MonitorCommand

  beforeEach(() => {
    command = new MonitorCommand()
  })

  describe('命令创建', () => {
    it('应该能创建 monitor 命令', () => {
      const cmd = command.createCommand()

      expect(cmd).toBeDefined()
      expect(cmd.name()).toBe('monitor')
      expect(cmd.description()).toContain('性能监控')
    })

    it('应该包含所有子命令', () => {
      const cmd = command.createCommand()
      const subcommands = cmd.commands.map(c => c.name())

      expect(subcommands).toContain('start')
      expect(subcommands).toContain('stop')
      expect(subcommands).toContain('report')
      expect(subcommands).toContain('analyze')
      expect(subcommands).toContain('vitals')
      expect(subcommands).toContain('build-analyze')
      expect(subcommands).toContain('config')
    })
  })

  describe('命令选项', () => {
    it('start 命令应该有正确的选项', () => {
      const cmd = command.createCommand()
      const startCmd = cmd.commands.find(c => c.name() === 'start')

      expect(startCmd).toBeDefined()
      expect(startCmd?.options).toBeDefined()
    })

    it('report 命令应该支持多种格式', () => {
      const cmd = command.createCommand()
      const reportCmd = cmd.commands.find(c => c.name() === 'report')

      expect(reportCmd).toBeDefined()
      // 应该支持 json, html, pdf 格式
    })
  })
})


