/**
 * 错误类测试用例
 * 
 * 测试统一错误处理机制
 * 
 * @author LDesign Team
 * @since 1.2.0
 */

import { describe, it, expect } from 'vitest'
import {
  LauncherError,
  ConfigError,
  PluginError,
  ServerError,
  BuildError,
  ValidationError,
  NetworkError,
  FileSystemError,
  isLauncherError,
  createError
} from '../../src/utils/errors'

describe('Error Classes', () => {
  describe('LauncherError', () => {
    it('应该能创建基础错误', () => {
      const error = new LauncherError('Test error')
      
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(LauncherError)
      expect(error.message).toBe('Test error')
      expect(error.code).toBe('LAUNCHER_ERROR')
    })

    it('应该支持自定义错误码', () => {
      const error = new LauncherError('Test error', {
        code: 'CUSTOM_ERROR'
      })
      
      expect(error.code).toBe('CUSTOM_ERROR')
    })

    it('应该支持上下文信息', () => {
      const error = new LauncherError('Test error', {
        context: { key: 'value', number: 123 }
      })
      
      expect(error.context).toEqual({ key: 'value', number: 123 })
    })

    it('应该支持建议信息', () => {
      const error = new LauncherError('Test error', {
        suggestion: 'Try this solution'
      })
      
      expect(error.suggestion).toBe('Try this solution')
    })

    it('应该支持错误链', () => {
      const cause = new Error('Original error')
      const error = new LauncherError('Wrapped error', { cause })
      
      expect(error.cause).toBe(cause)
    })

    it('应该能格式化错误消息', () => {
      const error = new LauncherError('Test error', {
        code: 'TEST_ERROR',
        context: { foo: 'bar' },
        suggestion: 'Fix it'
      })
      
      const formatted = error.format()
      
      expect(formatted).toContain('TEST_ERROR')
      expect(formatted).toContain('Test error')
      expect(formatted).toContain('foo')
      expect(formatted).toContain('Fix it')
    })
  })

  describe('ConfigError', () => {
    it('应该创建配置错误', () => {
      const error = new ConfigError('Invalid config')
      
      expect(error).toBeInstanceOf(ConfigError)
      expect(error).toBeInstanceOf(LauncherError)
      expect(error.code).toBe('CONFIG_ERROR')
    })
  })

  describe('PluginError', () => {
    it('应该创建插件错误', () => {
      const error = new PluginError('Plugin failed', {
        pluginName: 'test-plugin'
      })
      
      expect(error).toBeInstanceOf(PluginError)
      expect(error.code).toBe('PLUGIN_ERROR')
      expect(error.pluginName).toBe('test-plugin')
    })
  })

  describe('ServerError', () => {
    it('应该创建服务器错误', () => {
      const error = new ServerError('Server failed', {
        port: 3000,
        host: 'localhost'
      })
      
      expect(error).toBeInstanceOf(ServerError)
      expect(error.code).toBe('SERVER_ERROR')
      expect(error.port).toBe(3000)
      expect(error.host).toBe('localhost')
    })
  })

  describe('BuildError', () => {
    it('应该创建构建错误', () => {
      const error = new BuildError('Build failed')
      
      expect(error).toBeInstanceOf(BuildError)
      expect(error.code).toBe('BUILD_ERROR')
    })
  })

  describe('ValidationError', () => {
    it('应该创建验证错误', () => {
      const error = new ValidationError('Validation failed', {
        field: 'port'
      })
      
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.field).toBe('port')
    })
  })

  describe('NetworkError', () => {
    it('应该创建网络错误', () => {
      const error = new NetworkError('Network failed', {
        url: 'http://example.com',
        statusCode: 404
      })
      
      expect(error).toBeInstanceOf(NetworkError)
      expect(error.code).toBe('NETWORK_ERROR')
      expect(error.url).toBe('http://example.com')
      expect(error.statusCode).toBe(404)
    })
  })

  describe('FileSystemError', () => {
    it('应该创建文件系统错误', () => {
      const error = new FileSystemError('File operation failed', {
        path: '/test/path',
        operation: 'read'
      })
      
      expect(error).toBeInstanceOf(FileSystemError)
      expect(error.code).toBe('FILESYSTEM_ERROR')
      expect(error.path).toBe('/test/path')
      expect(error.operation).toBe('read')
    })
  })

  describe('isLauncherError', () => {
    it('应该识别 Launcher 错误', () => {
      const launcherError = new LauncherError('Test')
      const standardError = new Error('Test')
      
      expect(isLauncherError(launcherError)).toBe(true)
      expect(isLauncherError(standardError)).toBe(false)
    })

    it('应该识别所有子类错误', () => {
      expect(isLauncherError(new ConfigError('test'))).toBe(true)
      expect(isLauncherError(new PluginError('test'))).toBe(true)
      expect(isLauncherError(new ServerError('test'))).toBe(true)
      expect(isLauncherError(new BuildError('test'))).toBe(true)
    })
  })

  describe('createError 工厂函数', () => {
    it('应该能创建配置错误', () => {
      const error = createError.config('Invalid config')
      expect(error).toBeInstanceOf(ConfigError)
    })

    it('应该能创建插件错误', () => {
      const error = createError.plugin('Plugin failed', { pluginName: 'test' })
      expect(error).toBeInstanceOf(PluginError)
      expect(error.pluginName).toBe('test')
    })

    it('应该能创建服务器错误', () => {
      const error = createError.server('Server failed', { port: 3000 })
      expect(error).toBeInstanceOf(ServerError)
      expect(error.port).toBe(3000)
    })

    it('应该能创建构建错误', () => {
      const error = createError.build('Build failed')
      expect(error).toBeInstanceOf(BuildError)
    })

    it('应该能创建验证错误', () => {
      const error = createError.validation('Validation failed', { field: 'port' })
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.field).toBe('port')
    })

    it('应该能创建网络错误', () => {
      const error = createError.network('Network failed', { url: 'http://test.com' })
      expect(error).toBeInstanceOf(NetworkError)
      expect(error.url).toBe('http://test.com')
    })

    it('应该能创建文件系统错误', () => {
      const error = createError.filesystem('FS failed', { path: '/test', operation: 'write' })
      expect(error).toBeInstanceOf(FileSystemError)
      expect(error.path).toBe('/test')
      expect(error.operation).toBe('write')
    })
  })
})


