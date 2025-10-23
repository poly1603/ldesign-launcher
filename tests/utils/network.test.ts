/**
 * Network 工具测试用例
 * 
 * 测试网络相关工具函数
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { describe, it, expect } from 'vitest'
import {
  parseUrl,
  buildUrl,
  isLocalAddress,
  getPreferredLocalIP,
  getLocalIPs,
  checkUrlAccessibility
} from '../../src/utils/network'

describe('Network Utils', () => {
  describe('parseUrl', () => {
    it('应该能解析标准 URL', () => {
      const url = 'https://example.com:3000/path?query=value'
      const parsed = parseUrl(url)
      
      expect(parsed.protocol).toBe('https:')
      expect(parsed.hostname).toBe('example.com')
      expect(parsed.port).toBe('3000')
      expect(parsed.pathname).toBe('/path')
    })

    it('应该处理无端口的 URL', () => {
      const url = 'http://localhost/path'
      const parsed = parseUrl(url)
      
      expect(parsed.protocol).toBe('http:')
      expect(parsed.hostname).toBe('localhost')
    })

    it('应该处理无效 URL', () => {
      expect(() => parseUrl('invalid-url')).toThrow()
    })
  })

  describe('buildUrl', () => {
    it('应该能构建 URL', () => {
      const url = buildUrl({
        protocol: 'https',
        host: 'example.com',
        port: 3000,
        path: '/api'
      })
      
      expect(url).toBe('https://example.com:3000/api')
    })

    it('应该处理可选参数', () => {
      const url = buildUrl({
        protocol: 'http',
        host: 'localhost'
      })
      
      expect(url).toContain('http://localhost')
    })

    it('应该处理查询参数', () => {
      const url = buildUrl({
        protocol: 'https',
        host: 'api.com',
        path: '/data',
        query: { key: 'value', foo: 'bar' }
      })
      
      expect(url).toContain('key=value')
      expect(url).toContain('foo=bar')
    })
  })

  describe('isLocalAddress', () => {
    it('应该识别 localhost', () => {
      expect(isLocalAddress('localhost')).toBe(true)
      expect(isLocalAddress('127.0.0.1')).toBe(true)
      expect(isLocalAddress('::1')).toBe(true)
    })

    it('应该识别 0.0.0.0', () => {
      expect(isLocalAddress('0.0.0.0')).toBe(true)
    })

    it('应该识别外部地址', () => {
      expect(isLocalAddress('example.com')).toBe(false)
      expect(isLocalAddress('192.168.1.1')).toBe(false)
    })
  })

  describe('getPreferredLocalIP', () => {
    it('应该返回本地 IP 地址', () => {
      const ip = getPreferredLocalIP()
      
      expect(ip).toBeDefined()
      expect(typeof ip).toBe('string')
      expect(ip.length).toBeGreaterThan(0)
    })

    it('返回的 IP 应该是有效格式', () => {
      const ip = getPreferredLocalIP()
      
      // 简单的 IP 格式验证
      const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/
      expect(ipPattern.test(ip)).toBe(true)
    })
  })

  describe('getLocalIPs', () => {
    it('应该返回所有本地 IP 地址', () => {
      const ips = getLocalIPs()
      
      expect(Array.isArray(ips)).toBe(true)
      expect(ips.length).toBeGreaterThan(0)
    })

    it('返回的 IP 列表应该包含有效地址', () => {
      const ips = getLocalIPs()
      const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/
      
      ips.forEach(ip => {
        expect(typeof ip).toBe('string')
        expect(ipPattern.test(ip)).toBe(true)
      })
    })
  })

  describe('checkUrlAccessibility', () => {
    it('应该能检查 URL 可访问性', async () => {
      // 使用公共可访问的 URL
      const result = await checkUrlAccessibility('https://www.google.com')
      
      // 结果应该是 boolean
      expect(typeof result).toBe('boolean')
    }, 10000) // 增加超时时间

    it('应该处理无效 URL', async () => {
      const result = await checkUrlAccessibility('http://nonexistent-domain-12345.com')
      
      expect(result).toBe(false)
    }, 10000)
  })

  describe('边界情况', () => {
    it('应该处理空字符串', () => {
      expect(isLocalAddress('')).toBe(false)
    })

    it('应该处理 undefined', () => {
      expect(isLocalAddress(undefined as any)).toBe(false)
    })
  })
})


