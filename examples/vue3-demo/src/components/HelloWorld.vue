<template>
  <div class="hello">
    <h2>{{ msg }}</h2>
    <div class="features">
      <div class="feature">
        <h3>⚡️ 快速开发</h3>
        <p>使用 Vite 提供极速的开发体验</p>
      </div>
      <div class="feature">
        <h3>🔧 自动配置</h3>
        <p>框架自动检测，无需手动配置</p>
      </div>
      <div class="feature">
        <h3>🎯 类型安全</h3>
        <p>完整的 TypeScript 支持</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  msg: string
}>()
</script>

<style scoped>
.hello {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.hello h2 {
  margin-top: 0;
  color: #42b883;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.feature {
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 6px;
  transition: transform 0.3s;
}

.feature:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.feature h3 {
  margin: 0 0 0.5rem 0;
  color: #35495e;
}

.feature p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}
</style>

