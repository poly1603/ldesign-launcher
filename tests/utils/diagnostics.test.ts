/**
 * Diagnostics 工具测试用例
 * 
 * 测试诊断功能
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  DiagnosticRunner,
  createDiagnosticCheck,
  type DiagnosticCheck,
  type DiagnosticResult
} from '../../src/utils/diagnostics'

describe('Diagnostics Utils', () => {
  let runner: DiagnosticRunner

  beforeEach(() => {
    runner = new DiagnosticRunner('Test Diagnostics')
  })

  describe('DiagnosticRunner', () => {
    it('应该正确初始化', () => {
      expect(runner).toBeInstanceOf(DiagnosticRunner)
    })

    it('应该有名称', () => {
      expect(runner['name']).toBe('Test Diagnostics')
    })
  })

  describe('检查项添加', () => {
    it('应该能添加检查项', () => {
      const check: DiagnosticCheck = {
        name: 'Test Check',
        description: 'Test check description',
        check: async () => ({
          passed: true,
          message: 'Test passed'
        })
      }
      
      expect(() => runner.addCheck(check)).not.toThrow()
    })

    it('应该能添加多个检查项', () => {
      const check1: DiagnosticCheck = {
        name: 'Check 1',
        check: async () => ({ passed: true })
      }
      
      const check2: DiagnosticCheck = {
        name: 'Check 2',
        check: async () => ({ passed: true })
      }
      
      runner.addCheck(check1)
      runner.addCheck(check2)
      
      expect(runner['checks'].length).toBe(2)
    })
  })

  describe('诊断执行', () => {
    it('应该能运行所有检查', async () => {
      const check: DiagnosticCheck = {
        name: 'Test Check',
        check: async () => ({
          passed: true,
          message: 'Test passed'
        })
      }
      
      runner.addCheck(check)
      const report = await runner.runAll()
      
      expect(report).toBeDefined()
      expect(report.name).toBe('Test Diagnostics')
      expect(report.results.length).toBe(1)
      expect(report.results[0].passed).toBe(true)
    })

    it('应该处理检查失败', async () => {
      const failingCheck: DiagnosticCheck = {
        name: 'Failing Check',
        check: async () => ({
          passed: false,
          message: 'Check failed',
          issue: 'Something is wrong',
          suggestion: 'Fix it'
        })
      }
      
      runner.addCheck(failingCheck)
      const report = await runner.runAll()
      
      expect(report.results[0].passed).toBe(false)
      expect(report.results[0].issue).toBe('Something is wrong')
      expect(report.results[0].suggestion).toBe('Fix it')
    })

    it('应该处理异步检查', async () => {
      const asyncCheck: DiagnosticCheck = {
        name: 'Async Check',
        check: async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
          return { passed: true }
        }
      }
      
      runner.addCheck(asyncCheck)
      const report = await runner.runAll()
      
      expect(report.results.length).toBe(1)
      expect(report.results[0].passed).toBe(true)
    })
  })

  describe('报告生成', () => {
    it('应该生成完整报告', async () => {
      runner.addCheck({
        name: 'Check 1',
        check: async () => ({ passed: true })
      })
      
      runner.addCheck({
        name: 'Check 2',
        check: async () => ({ passed: false, issue: 'Failed' })
      })
      
      const report = await runner.runAll()
      
      expect(report.name).toBe('Test Diagnostics')
      expect(report.totalChecks).toBe(2)
      expect(report.passedChecks).toBe(1)
      expect(report.failedChecks).toBe(1)
      expect(report.results.length).toBe(2)
    })

    it('应该计算成功率', async () => {
      runner.addCheck({
        name: 'Pass 1',
        check: async () => ({ passed: true })
      })
      
      runner.addCheck({
        name: 'Pass 2',
        check: async () => ({ passed: true })
      })
      
      runner.addCheck({
        name: 'Fail 1',
        check: async () => ({ passed: false })
      })
      
      const report = await runner.runAll()
      
      expect(report.totalChecks).toBe(3)
      expect(report.passedChecks).toBe(2)
      expect(report.failedChecks).toBe(1)
    })
  })

  describe('createDiagnosticCheck 工厂函数', () => {
    it('应该能创建检查项', () => {
      const check = createDiagnosticCheck({
        name: 'Test',
        check: async () => ({ passed: true })
      })
      
      expect(check).toBeDefined()
      expect(check.name).toBe('Test')
      expect(typeof check.check).toBe('function')
    })

    it('应该支持自动修复', () => {
      const check = createDiagnosticCheck({
        name: 'Test',
        check: async () => ({ passed: true }),
        autoFix: async () => { /* fix logic */ }
      })
      
      expect(check.autoFix).toBeDefined()
      expect(typeof check.autoFix).toBe('function')
    })
  })

  describe('错误处理', () => {
    it('应该处理检查抛出异常', async () => {
      const throwingCheck: DiagnosticCheck = {
        name: 'Throwing Check',
        check: async () => {
          throw new Error('Check error')
        }
      }
      
      runner.addCheck(throwingCheck)
      
      // 不应该导致整个诊断崩溃
      const report = await runner.runAll()
      expect(report).toBeDefined()
      expect(report.results.length).toBe(1)
      expect(report.results[0].passed).toBe(false)
    })
  })

  describe('打印报告', () => {
    it('printReport 方法应该存在', () => {
      expect(typeof runner.printReport).toBe('function')
    })

    it('应该能打印报告而不崩溃', async () => {
      runner.addCheck({
        name: 'Test',
        check: async () => ({ passed: true })
      })
      
      const report = await runner.runAll()
      
      expect(() => runner.printReport(report)).not.toThrow()
    })
  })
})


