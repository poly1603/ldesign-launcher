/**
 * ConfigValidator 单元测试
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ConfigValidator, validateConfig, createConfigValidator } from '../../src/utils/config-validator'

describe('ConfigValidator', () => {
  let validator: ConfigValidator

  beforeEach(() => {
    validator = new ConfigValidator()
  })

  describe('服务器配置验证', () => {
    it('应该验证有效的服务器配置', () => {
      const config = {
        port: 3000,
        host: 'localhost',
        https: false,
        open: true
      }

      const result = validator.validateServerConfig(config)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(config)
    })

    it('应该拒绝无效的端口号', () => {
      const config = {
        port: 99999 // 超出范围
      }

      const result = validator.validateServerConfig(config)

      expect(result.success).toBe(false)
      expect(result.errors).toBeTruthy()
    })

    it('应该拒绝错误的类型', () => {
      const config = {
        port: '3000' // 应该是数字
      }

      const result = validator.validateServerConfig(config)

      expect(result.success).toBe(false)
    })
  })

  describe('构建配置验证', () => {
    it('应该验证有效的构建配置', () => {
      const config = {
        outDir: 'dist',
        sourcemap: true,
        minify: 'esbuild',
        target: 'esnext'
      }

      const result = validator.validateBuildConfig(config)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(config)
    })

    it('应该支持多种 minify 选项', () => {
      const configs = [
        { minify: true },
        { minify: false },
        { minify: 'terser' },
        { minify: 'esbuild' }
      ]

      configs.forEach(config => {
        const result = validator.validateBuildConfig(config)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('完整配置验证', () => {
    it('应该验证完整的配置对象', () => {
      const config = {
        root: './src',
        base: '/',
        server: {
          port: 3000,
          host: 'localhost'
        },
        build: {
          outDir: 'dist',
          minify: true
        },
        launcher: {
          logLevel: 'info',
          autoRestart: true
        }
      }

      const result = validator.validate(config)

      expect(result.success).toBe(true)
    })

    it('应该拒绝无效的 logLevel', () => {
      const config = {
        launcher: {
          logLevel: 'invalid' // 无效值
        }
      }

      const result = validator.validate(config)

      expect(result.success).toBe(false)
    })
  })

  describe('错误格式化', () => {
    it('应该能格式化验证错误', () => {
      const config = {
        server: {
          port: 'invalid'
        }
      }

      const result = validator.validate(config)

      if (!result.success && result.errors) {
        const formatted = validator.formatErrors(result.errors)

        expect(Array.isArray(formatted)).toBe(true)
        expect(formatted.length).toBeGreaterThan(0)
        expect(formatted[0]).toContain('port')
      }
    })
  })

  describe('默认值', () => {
    it('应该提供默认配置', () => {
      const defaults = validator.getDefaults()

      expect(defaults).toHaveProperty('server')
      expect(defaults).toHaveProperty('build')
      expect(defaults).toHaveProperty('launcher')

      expect(defaults.server.port).toBe(3000)
      expect(defaults.build.outDir).toBe('dist')
      expect(defaults.launcher.logLevel).toBe('info')
    })
  })

  describe('配置合并', () => {
    it('应该能合并配置', () => {
      const userConfig = {
        server: {
          port: 8080
        }
      }

      const result = validator.mergeAndValidate(userConfig)

      expect(result.success).toBe(true)
      expect(result.config?.server.port).toBe(8080)
      expect(result.config?.server.host).toBe('localhost') // 来自默认值
    })

    it('用户配置应该覆盖默认值', () => {
      const userConfig = {
        build: {
          outDir: 'build',
          minify: false
        }
      }

      const result = validator.mergeAndValidate(userConfig)

      expect(result.config?.build.outDir).toBe('build')
      expect(result.config?.build.minify).toBe(false)
    })
  })

  describe('快捷函数', () => {
    it('validateConfig 应该工作', () => {
      const config = {
        server: { port: 3000 }
      }

      const result = validateConfig(config)
      expect(result.success).toBe(true)
    })
  })

  describe('工厂函数', () => {
    it('createConfigValidator 应该创建实例', () => {
      const instance = createConfigValidator()
      expect(instance).toBeInstanceOf(ConfigValidator)
    })
  })
})


