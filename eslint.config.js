import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  vue: false,
  jsonc: true,
  markdown: true,
  formatters: {
    css: true,
    html: true,
    markdown: 'prettier',
  },
  rules: {
    // 自定义规则
    // 默认禁止使用 console，后续通过局部禁用或浏览器端代码特例控制
    'no-console': 'error',
    'no-debugger': 'warn',

    // Node 全局相关规则在本项目中噪音较大，关闭以兼容现有代码风格
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off',
    'node/prefer-global/global': 'off',

    // 修复 unicorn 插件兼容性问题
    'unicorn/error-message': 'off',
    'unicorn/no-null': 'off',
    'unicorn/prefer-top-level-await': 'off',

    // TypeScript 规则优化
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    // 允许在少数场景使用 require()（如动态加载、与 CJS 互操作）
    '@typescript-eslint/no-require-imports': 'off',
    // 渐进式处理 ts-ignore，先降级为 warning
    '@typescript-eslint/ban-ts-comment': 'warn',
  },
})
