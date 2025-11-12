/**
 * ConfigMerger 配置合并工具测试
 * 
 * @author LDesign Team
 * @since 2.1.0
 */

import { describe, it, expect } from 'vitest'
import { ConfigMerger, deepMerge, shallowMerge } from '../../src/utils/config-merger'

describe('ConfigMerger', () => {
  describe('deepMerge', () => {
    it('应该深度合并简单对象', () => {
      const target = { a: 1, b: 2 }
      const source = { b: 3, c: 4 }

      const result = ConfigMerger.deepMerge(target, source)

      expect(result).toEqual({ a: 1, b: 3, c: 4 })
    })

    it('应该深度合并嵌套对象', () => {
      const target = {
        server: { port: 3000, host: 'localhost' },
        build: { outDir: 'dist' }
      }
      const source = {
        server: { port: 4000 },
        build: { minify: true }
      }

      const result = ConfigMerger.deepMerge(target, source)

      expect(result).toEqual({
        server: { port: 4000, host: 'localhost' },
        build: { outDir: 'dist', minify: true }
      })
    })

    it('应该处理 null 和 undefined', () => {
      expect(ConfigMerger.deepMerge(null as any, { a: 1 })).toEqual({ a: 1 })
      expect(ConfigMerger.deepMerge({ a: 1 }, null as any)).toEqual({ a: 1 })
      expect(ConfigMerger.deepMerge({ a: 1 }, undefined as any)).toEqual({ a: 1 })
    })
  })

  describe('数组合并策略', () => {
    it('默认应该替换数组', () => {
      const target = { items: [1, 2, 3] }
      const source = { items: [4, 5] }

      const result = ConfigMerger.deepMerge(target, source)

      expect(result.items).toEqual([4, 5])
    })

    it('concat 策略应该连接数组', () => {
      const target = { items: [1, 2, 3] }
      const source = { items: [4, 5] }

      const result = ConfigMerger.deepMerge(target, source, {
        arrayMergeStrategy: 'concat'
      })

      expect(result.items).toEqual([1, 2, 3, 4, 5])
    })

    it('unique 策略应该去重', () => {
      const target = { items: [1, 2, 3] }
      const source = { items: [2, 3, 4] }

      const result = ConfigMerger.deepMerge(target, source, {
        arrayMergeStrategy: 'unique'
      })

      expect(result.items).toEqual([1, 2, 3, 4])
    })

    it('alias 数组应该始终合并', () => {
      const target = {
        resolve: {
          alias: [{ find: '@', replacement: './src' }]
        }
      }
      const source = {
        resolve: {
          alias: [{ find: '~', replacement: './' }]
        }
      }

      const result = ConfigMerger.deepMerge(target, source)

      expect(result.resolve.alias).toHaveLength(2)
    })
  })

  describe('自定义合并器', () => {
    it('应该使用自定义合并器', () => {
      const target = { plugins: ['a', 'b'] }
      const source = { plugins: ['c'] }

      const result = ConfigMerger.deepMerge(target, source, {
        customMergers: {
          plugins: (t, s) => [...t, ...s]
        }
      })

      expect(result.plugins).toEqual(['a', 'b', 'c'])
    })
  })

  describe('shallowMerge', () => {
    it('应该浅合并对象', () => {
      const target = {
        server: { port: 3000 },
        build: { outDir: 'dist' }
      }
      const source = {
        server: { host: 'localhost' }
      }

      const result = ConfigMerger.shallowMerge(target, source)

      // 浅合并会直接替换 server 对象
      expect(result.server).toEqual({ host: 'localhost' })
      expect(result.build).toEqual({ outDir: 'dist' })
    })
  })

  describe('mergeAll', () => {
    it('应该合并多个配置对象', () => {
      const configs = [
        { a: 1 },
        { b: 2 },
        { c: 3 }
      ]

      const result = ConfigMerger.mergeAll(configs)

      expect(result).toEqual({ a: 1, b: 2, c: 3 })
    })

    it('应该处理空数组', () => {
      const result = ConfigMerger.mergeAll([])

      expect(result).toEqual({})
    })
  })

  describe('便捷函数', () => {
    it('deepMerge 函数应该工作', () => {
      const result = deepMerge({ a: 1 }, { b: 2 })
      expect(result).toEqual({ a: 1, b: 2 })
    })

    it('shallowMerge 函数应该工作', () => {
      const result = shallowMerge({ a: { x: 1 } }, { a: { y: 2 } })
      expect(result.a).toEqual({ y: 2 })
    })
  })

  describe('预设合并器', () => {
    it('vite 预设应该正确合并插件', () => {
      const merger = ConfigMerger.createPresetMerger('vite')

      const target = {
        plugins: ['a'],
        alias: [{ find: '@' }]
      }
      const source = {
        plugins: ['b'],
        alias: [{ find: '~' }]
      }

      const result = merger(target, source)

      expect(result.plugins).toEqual(['a', 'b'])
      expect(result.alias).toHaveLength(2)
    })
  })
})
