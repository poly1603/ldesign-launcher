/**
 * UI Components 测试用例
 * 
 * 测试 UI 组件工具函数
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { describe, it, expect } from 'vitest'
import {
  renderServerBanner,
  renderQRCode,
  renderProgressBar,
  renderTable,
  renderDivider,
  renderTitle,
  renderError,
  renderSuccess,
  renderWarning,
  renderInfo,
  stripAnsi,
  formatFileSize
} from '../../src/utils/ui-components'

describe('UI Components Utils', () => {
  describe('renderServerBanner', () => {
    it('应该渲染服务器横幅', () => {
      const banner = renderServerBanner({
        title: 'Dev Server',
        items: [
          { label: 'Local', value: 'http://localhost:3000' }
        ]
      })
      
      expect(typeof banner).toBe('string')
      expect(banner.length).toBeGreaterThan(0)
    })
  })

  describe('renderQRCode', () => {
    it('应该渲染二维码', async () => {
      const qrCode = await renderQRCode('http://localhost:3000')
      
      expect(typeof qrCode).toBe('string')
    })

    it('应该处理自定义选项', async () => {
      const qrCode = await renderQRCode('http://localhost:3000', {
        small: true
      })
      
      expect(typeof qrCode).toBe('string')
    })
  })

  describe('renderProgressBar', () => {
    it('应该渲染进度条', () => {
      const progressBar = renderProgressBar(50, 100, {
        width: 40
      })
      
      expect(typeof progressBar).toBe('string')
      expect(progressBar.length).toBeGreaterThan(0)
    })

    it('应该处理0%进度', () => {
      const progressBar = renderProgressBar(0, 100)
      expect(typeof progressBar).toBe('string')
    })

    it('应该处理100%进度', () => {
      const progressBar = renderProgressBar(100, 100)
      expect(typeof progressBar).toBe('string')
    })
  })

  describe('renderTable', () => {
    it('应该渲染表格', () => {
      const table = renderTable({
        columns: [
          { key: 'name', label: 'Name', width: 20 },
          { key: 'value', label: 'Value', width: 30 }
        ],
        rows: [
          { name: 'Item 1', value: 'Value 1' },
          { name: 'Item 2', value: 'Value 2' }
        ]
      })
      
      expect(typeof table).toBe('string')
      expect(table).toContain('Name')
      expect(table).toContain('Value')
    })

    it('应该处理空表格', () => {
      const table = renderTable({
        columns: [],
        rows: []
      })
      
      expect(typeof table).toBe('string')
    })
  })

  describe('renderDivider', () => {
    it('应该渲染分隔线', () => {
      const divider = renderDivider()
      
      expect(typeof divider).toBe('string')
      expect(divider.length).toBeGreaterThan(0)
    })

    it('应该支持自定义宽度', () => {
      const divider = renderDivider(80)
      expect(divider.length).toBeGreaterThanOrEqual(80)
    })
  })

  describe('renderTitle', () => {
    it('应该渲染标题', () => {
      const title = renderTitle('Test Title')
      
      expect(typeof title).toBe('string')
      expect(title).toContain('Test Title')
    })

    it('应该支持子标题', () => {
      const title = renderTitle('Main Title', 'Subtitle')
      
      expect(title).toContain('Main Title')
      expect(title).toContain('Subtitle')
    })
  })

  describe('消息渲染函数', () => {
    it('renderError 应该渲染错误消息', () => {
      const error = renderError('Error message')
      
      expect(typeof error).toBe('string')
      expect(error).toContain('Error message')
    })

    it('renderSuccess 应该渲染成功消息', () => {
      const success = renderSuccess('Success message')
      
      expect(typeof success).toBe('string')
      expect(success).toContain('Success message')
    })

    it('renderWarning 应该渲染警告消息', () => {
      const warning = renderWarning('Warning message')
      
      expect(typeof warning).toBe('string')
      expect(warning).toContain('Warning message')
    })

    it('renderInfo 应该渲染信息消息', () => {
      const info = renderInfo('Info message')
      
      expect(typeof info).toBe('string')
      expect(info).toContain('Info message')
    })
  })

  describe('stripAnsi', () => {
    it('应该移除 ANSI 转义码', () => {
      const withAnsi = '\x1b[31mRed Text\x1b[0m'
      const stripped = stripAnsi(withAnsi)
      
      expect(stripped).toBe('Red Text')
      expect(stripped).not.toContain('\x1b')
    })

    it('应该处理无 ANSI 码的字符串', () => {
      const plain = 'Plain text'
      const stripped = stripAnsi(plain)
      
      expect(stripped).toBe(plain)
    })

    it('应该处理空字符串', () => {
      const stripped = stripAnsi('')
      expect(stripped).toBe('')
    })
  })

  describe('formatFileSize', () => {
    it('应该格式化字节大小', () => {
      expect(formatFileSize(0)).toContain('0')
      expect(formatFileSize(1024)).toContain('KB')
      expect(formatFileSize(1024 * 1024)).toContain('MB')
      expect(formatFileSize(1024 * 1024 * 1024)).toContain('GB')
    })

    it('应该处理负数', () => {
      const result = formatFileSize(-100)
      expect(typeof result).toBe('string')
    })

    it('应该处理小数', () => {
      const result = formatFileSize(1536) // 1.5KB
      expect(result).toContain('KB')
    })
  })
})


