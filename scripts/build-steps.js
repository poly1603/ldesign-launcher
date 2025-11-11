import { execSync } from 'child_process'
import { existsSync, rmSync } from 'fs'

const NODE_OPTIONS = '--max-old-space-size=16384'

console.log('🚀 开始构建...\n')

// 清理 dist 目录
if (existsSync('dist')) {
  console.log('🧹 清理 dist 目录...')
  rmSync('dist', { recursive: true, force: true })
}

try {
  // 步骤 1: 构建客户端 ESM (无 DTS)
  console.log('📦 步骤 1/4: 构建客户端 JS...')
  execSync(`cross-env NODE_OPTIONS="${NODE_OPTIONS}" tsup --entry.client/app-config=src/client/app-config.ts --entry.client/index=src/client/index.ts --entry.client/react/useAppConfig=src/client/react/useAppConfig.ts --entry.client/vue/useAppConfig=src/client/vue/useAppConfig.ts --entry.client/vue2/useAppConfig=src/client/vue2/useAppConfig.ts --entry.client/svelte/useAppConfig=src/client/svelte/useAppConfig.ts --entry.client/solid/useAppConfig=src/client/solid/useAppConfig.ts --entry.client/qwik/useAppConfig=src/client/qwik/useAppConfig.ts --entry.client/lit/useAppConfig=src/client/lit/useAppConfig.ts --entry.client/angular/useAppConfig=src/client/angular/useAppConfig.ts --format esm --no-dts --platform browser --target es2020`, {
    stdio: 'inherit',
    shell: true
  })

  // 步骤 2: 构建服务端 JS (无 DTS)  
  console.log('\n📦 步骤 2/4: 构建服务端 JS...')
  execSync(`cross-env NODE_OPTIONS="${NODE_OPTIONS}" tsup "src/**/*.ts" "!src/**/*.test.ts" "!src/**/*.spec.ts" "!src/**/*.bench.ts" "!src/__tests__/**/*" "!src/client/**/*" --format cjs,esm --no-dts --platform node --target node16 --splitting`, {
    stdio: 'inherit',
    shell: true
  })

  // 步骤 3: 生成客户端 DTS
  console.log('\n📝 步骤 3/4: 生成客户端类型定义...')
  execSync(`cross-env NODE_OPTIONS="${NODE_OPTIONS}" tsup --entry.client/app-config=src/client/app-config.ts --entry.client/index=src/client/index.ts --entry.client/react/useAppConfig=src/client/react/useAppConfig.ts --entry.client/vue/useAppConfig=src/client/vue/useAppConfig.ts --entry.client/vue2/useAppConfig=src/client/vue2/useAppConfig.ts --entry.client/svelte/useAppConfig=src/client/svelte/useAppConfig.ts --entry.client/solid/useAppConfig=src/client/solid/useAppConfig.ts --entry.client/qwik/useAppConfig=src/client/qwik/useAppConfig.ts --entry.client/lit/useAppConfig=src/client/lit/useAppConfig.ts --entry.client/angular/useAppConfig=src/client/angular/useAppConfig.ts --dts-only --platform browser --target es2020`, {
    stdio: 'inherit',
    shell: true
  })

  // 步骤 4: 生成服务端 DTS
  console.log('\n📝 步骤 4/4: 生成服务端类型定义...')
  execSync(`cross-env NODE_OPTIONS="${NODE_OPTIONS}" tsup "src/**/*.ts" "!src/**/*.test.ts" "!src/**/*.spec.ts" "!src/**/*.bench.ts" "!src/__tests__/**/*" "!src/client/**/*" --dts-only --platform node --target node16`, {
    stdio: 'inherit',
    shell: true
  })

  console.log('\n✅ 构建完成！')
} catch (error) {
  console.error('\n❌ 构建失败:', error.message)
  process.exit(1)
}
