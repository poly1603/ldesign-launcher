<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
const framework = 'Vue 3'
</script>

<template>
  <div class="app">
    <h1>🚀 {{ framework }} Demo</h1>
    <p>Powered by <strong>@ldesign/launcher</strong></p>
    
    <div class="card">
      <button @click="count++">
        Count is {{ count }}
      </button>
      <p>Edit <code>src/App.vue</code> to test HMR</p>
    </div>
    
    <div class="features">
      <h2>✨ Features</h2>
      <ul>
        <li>⚡️ Lightning Fast HMR</li>
        <li>🎨 Vue 3 Composition API</li>
        <li>📦 Zero Config</li>
        <li>🔧 TypeScript Support</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.app {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

h1 {
  color: #42b883;
  margin-bottom: 0.5rem;
}

.card {
  padding: 2rem;
  margin: 2rem 0;
  background: #f9f9f9;
  border-radius: 8px;
}

button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 4px;
  background: #42b883;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background: #35a06e;
}

code {
  background: #e8e8e8;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.features {
  text-align: left;
  margin-top: 2rem;
}

.features ul {
  list-style: none;
  padding: 0;
}

.features li {
  padding: 0.5rem 0;
}
</style>
