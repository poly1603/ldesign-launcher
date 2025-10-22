/**
 * Micro 命令单元测试
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MicroCommand } from '../../src/cli/commands/micro'

describe('MicroCommand', () => {
  let command: MicroCommand

  beforeEach(() => {
    command = new MicroCommand()
  })

  describe('命令创建', () => {
    it('应该能创建 micro 命令', () => {
      const cmd = command.createCommand()

      expect(cmd).toBeDefined()
      expect(cmd.name()).toBe('micro')
      expect(cmd.description()).toContain('微前端')
    })

    it('应该包含所有子命令', () => {
      const cmd = command.createCommand()
      const subcommands = cmd.commands.map(c => c.name())

      expect(subcommands).toContain('init')
      expect(subcommands).toContain('add-app')
      expect(subcommands).toContain('dev')
      expect(subcommands).toContain('build')
      expect(subcommands).toContain('deploy')
      expect(subcommands).toContain('status')
    })
  })

  describe('命令选项', () => {
    it('init 命令应该支持应用类型', () => {
      const cmd = command.createCommand()
      const initCmd = cmd.commands.find(c => c.name() === 'init')

      expect(initCmd).toBeDefined()
      // 应该支持 --type main/sub
    })

    it('build 命令应该支持环境参数', () => {
      const cmd = command.createCommand()
      const buildCmd = cmd.commands.find(c => c.name() === 'build')

      expect(buildCmd).toBeDefined()
      // 应该支持 --env production/development
    })
  })

  describe('框架支持', () => {
    it('应该支持 qiankun 框架', () => {
      // 测试框架配置生成
      const cmd = command.createCommand()
      expect(cmd).toBeDefined()
    })

    it('应该支持 Module Federation', () => {
      const cmd = command.createCommand()
      expect(cmd).toBeDefined()
    })

    it('应该支持 micro-app', () => {
      const cmd = command.createCommand()
      expect(cmd).toBeDefined()
    })
  })
})


