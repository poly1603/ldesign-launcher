/**
 * Config Schemas 测试用例
 * 
 * 测试配置验证 Schema
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { describe, it, expect } from 'vitest'
import {
  portSchema,
  hostSchema,
  logLevelSchema,
  modeSchema,
  httpsSchema,
  serverConfigSchema,
  buildConfigSchema,
  launcherConfigSchema,
  viteLauncherConfigSchema,
  validateLauncherConfig,
  validateServerConfig,
  validateBuildConfig,
  formatValidationError,
  validateWithSuggestions
} from '../../src/utils/config-schemas'

describe('Config Schemas', () => {
  describe('基础 Schema', () => {
    it('portSchema 应该验证有效端口', () => {
      expect(portSchema.safeParse(3000).success).toBe(true)
      expect(portSchema.safeParse(80).success).toBe(true)
      expect(portSchema.safeParse(65535).success).toBe(true)
    })

    it('portSchema 应该拒绝无效端口', () => {
      expect(portSchema.safeParse(0).success).toBe(false)
      expect(portSchema.safeParse(65536).success).toBe(false)
      expect(portSchema.safeParse(-1).success).toBe(false)
      expect(portSchema.safeParse(3.14).success).toBe(false)
    })

    it('hostSchema 应该接受字符串和布尔值', () => {
      expect(hostSchema.safeParse('localhost').success).toBe(true)
      expect(hostSchema.safeParse('0.0.0.0').success).toBe(true)
      expect(hostSchema.safeParse(true).success).toBe(true)
      expect(hostSchema.safeParse(false).success).toBe(true)
    })

    it('logLevelSchema 应该只接受有效级别', () => {
      expect(logLevelSchema.safeParse('silent').success).toBe(true)
      expect(logLevelSchema.safeParse('error').success).toBe(true)
      expect(logLevelSchema.safeParse('warn').success).toBe(true)
      expect(logLevelSchema.safeParse('info').success).toBe(true)
      expect(logLevelSchema.safeParse('debug').success).toBe(true)
      expect(logLevelSchema.safeParse('invalid').success).toBe(false)
    })

    it('modeSchema 应该只接受有效模式', () => {
      expect(modeSchema.safeParse('development').success).toBe(true)
      expect(modeSchema.safeParse('production').success).toBe(true)
      expect(modeSchema.safeParse('test').success).toBe(true)
      expect(modeSchema.safeParse('staging').success).toBe(false)
    })
  })

  describe('服务器配置 Schema', () => {
    it('应该验证有效的服务器配置', () => {
      const validConfig = {
        host: 'localhost',
        port: 3000,
        https: false,
        open: true
      }
      
      expect(serverConfigSchema.safeParse(validConfig).success).toBe(true)
    })

    it('应该接受 HTTPS 配置', () => {
      const httpsConfig = {
        port: 3000,
        https: {
          key: '/path/to/key.pem',
          cert: '/path/to/cert.pem'
        }
      }
      
      expect(serverConfigSchema.safeParse(httpsConfig).success).toBe(true)
    })

    it('应该验证代理配置', () => {
      const proxyConfig = {
        port: 3000,
        proxy: {
          '/api': {
            target: 'http://localhost:8080',
            changeOrigin: true
          }
        }
      }
      
      expect(serverConfigSchema.safeParse(proxyConfig).success).toBe(true)
    })

    it('应该拒绝无效的端口', () => {
      const invalidConfig = {
        port: 99999
      }
      
      expect(serverConfigSchema.safeParse(invalidConfig).success).toBe(false)
    })
  })

  describe('构建配置 Schema', () => {
    it('应该验证有效的构建配置', () => {
      const validConfig = {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true,
        minify: 'esbuild'
      }
      
      expect(buildConfigSchema.safeParse(validConfig).success).toBe(true)
    })

    it('应该接受数组形式的 target', () => {
      const config = {
        target: ['es2020', 'edge88']
      }
      
      expect(buildConfigSchema.safeParse(config).success).toBe(true)
    })
  })

  describe('Launcher 配置 Schema', () => {
    it('应该验证有效的 launcher 配置', () => {
      const validConfig = {
        autoRestart: true,
        logLevel: 'info',
        mode: 'development',
        debug: false
      }
      
      expect(launcherConfigSchema.safeParse(validConfig).success).toBe(true)
    })

    it('应该拒绝无效的日志级别', () => {
      const invalidConfig = {
        logLevel: 'invalid'
      }
      
      expect(launcherConfigSchema.safeParse(invalidConfig).success).toBe(false)
    })
  })

  describe('完整配置验证', () => {
    it('validateLauncherConfig 应该验证完整配置', () => {
      const validConfig = {
        server: {
          port: 3000,
          host: 'localhost'
        },
        build: {
          outDir: 'dist'
        },
        launcher: {
          logLevel: 'info'
        }
      }
      
      const result = validateLauncherConfig(validConfig)
      expect(result.success).toBe(true)
    })

    it('应该提供详细的错误信息', () => {
      const invalidConfig = {
        server: {
          port: 99999 // 无效端口
        },
        launcher: {
          logLevel: 'invalid' // 无效级别
        }
      }
      
      const result = validateLauncherConfig(invalidConfig)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0)
      }
    })
  })

  describe('validateWithSuggestions', () => {
    it('应该提供验证建议', () => {
      const invalidConfig = {
        server: {
          port: 99999
        }
      }
      
      const result = validateWithSuggestions(invalidConfig)
      
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.suggestions).toBeDefined()
        expect(result.suggestions.length).toBeGreaterThan(0)
      }
    })

    it('有效配置应该不返回建议', () => {
      const validConfig = {
        server: {
          port: 3000
        }
      }
      
      const result = validateWithSuggestions(validConfig)
      
      expect(result.valid).toBe(true)
    })

    it('应该为不同错误提供不同建议', () => {
      const invalidConfig = {
        server: {
          port: 99999
        },
        launcher: {
          logLevel: 'invalid',
          mode: 'invalid'
        }
      }
      
      const result = validateWithSuggestions(invalidConfig)
      
      if (!result.valid) {
        expect(result.suggestions.length).toBeGreaterThan(1)
      }
    })
  })

  describe('formatValidationError', () => {
    it('应该格式化验证错误', () => {
      const invalidConfig = {
        server: {
          port: 'invalid'
        }
      }
      
      const parseResult = serverConfigSchema.safeParse(invalidConfig)
      
      if (!parseResult.success) {
        const formatted = formatValidationError(parseResult.error)
        expect(typeof formatted).toBe('string')
        expect(formatted.length).toBeGreaterThan(0)
      }
    })
  })

  describe('边界情况', () => {
    it('应该处理空配置', () => {
      const result = validateLauncherConfig({})
      expect(result.success).toBe(true)
    })

    it('应该处理 null', () => {
      const result = validateLauncherConfig(null)
      expect(result.success).toBe(false)
    })

    it('应该处理 undefined', () => {
      const result = validateLauncherConfig(undefined)
      expect(result.success).toBe(false)
    })

    it('应该允许额外字段（passthrough）', () => {
      const configWithExtra = {
        server: {
          port: 3000,
          customField: 'custom-value'
        }
      }
      
      const result = validateLauncherConfig(configWithExtra)
      expect(result.success).toBe(true)
    })
  })
})


