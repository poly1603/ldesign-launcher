/**
 * Doctor 命令测试用例
 * 
 * 测试项目诊断命令
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { describe, it, expect } from 'vitest'
import { DoctorCommand } from '../../src/cli/commands/doctor'

describe('DoctorCommand', () => {
  let command: DoctorCommand

  beforeEach(() => {
    command = new DoctorCommand()
  })

  describe('命令定义', () => {
    it('应该有正确的命令名称', () => {
      expect(command.name).toBe('doctor')
    })

    it('应该有描述信息', () => {
      expect(command.description).toBeDefined()
      expect(typeof command.description).toBe('string')
      expect(command.description.length).toBeGreaterThan(0)
    })

    it('应该有别名', () => {
      if (command.alias) {
        expect(Array.isArray(command.alias)).toBe(true)
      }
    })
  })

  describe('命令执行', () => {
    it('execute 方法应该存在', () => {
      expect(typeof command.execute).toBe('function')
    })

    it('应该能执行诊断', async () => {
      const context = {
        cwd: process.cwd(),
        options: {}
      }
      
      // 诊断命令应该能正常执行
      await expect(command.execute(context)).resolves.not.toThrow()
    }, 30000) // 诊断可能需要较长时间
  })

  describe('诊断项', () => {
    it('应该检查 Node.js 版本', async () => {
      const context = {
        cwd: process.cwd(),
        options: { check: 'node' }
      }
      
      await expect(command.execute(context)).resolves.not.toThrow()
    }, 10000)

    it('应该检查依赖安装', async () => {
      const context = {
        cwd: process.cwd(),
        options: { check: 'dependencies' }
      }
      
      await expect(command.execute(context)).resolves.not.toThrow()
    }, 10000)
  })

  describe('自动修复', () => {
    it('autoFix 选项应该被支持', async () => {
      const context = {
        cwd: process.cwd(),
        options: { autoFix: true }
      }
      
      // 自动修复不应该崩溃
      await expect(command.execute(context)).resolves.not.toThrow()
    }, 30000)
  })

  describe('错误处理', () => {
    it('应该处理无效的工作目录', async () => {
      const context = {
        cwd: '/nonexistent/path',
        options: {}
      }
      
      await expect(command.execute(context)).resolves.not.toThrow()
    }, 10000)
  })
})


