module.exports = {
  // 仅对暂存的源文件进行检查和格式化
  'src/**/*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  'tests/**/*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],
}
