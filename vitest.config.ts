/**
 * Vitest 测试配置
 */

import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // 测试环境
    environment: 'node',

    // 全局设置
    globals: true,

    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        '*.config.ts',
        '*.config.js',
        'src/cli/index.ts', // CLI 入口文件
        'src/types/**', // 类型定义文件
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      }
    },

    // 测试文件匹配模式
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts'
    ],

    // 排除的文件
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**'
    ],

    // 测试超时时间
    testTimeout: 10000,

    // 钩子超时时间
    hookTimeout: 10000,

    // 并发执行
    threads: true,

    // 监视模式配置
    watchExclude: [
      'node_modules/**',
      'dist/**',
      '.cache/**'
    ],

    // 设置别名
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    },

    // 模拟模块
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,

    // 设置文件
    setupFiles: ['./tests/setup.ts']
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
})