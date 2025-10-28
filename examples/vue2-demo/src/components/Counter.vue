<template>
  <div class="counter">
    <h2>计数器组件</h2>
    <div class="counter-display">
      <button @click="decrement" class="btn">-</button>
      <span class="count">{{ count }}</span>
      <button @click="increment" class="btn">+</button>
    </div>
    <button @click="reset" class="btn btn-reset">重置</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Counter',
  data() {
    return {
      count: 0
    }
  },
  methods: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    },
    reset() {
      this.count = 0
    }
  }
})
</script>

<style scoped>
.counter {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.counter h2 {
  margin-top: 0;
  color: #42b883;
}

.counter-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 1.5rem 0;
}

.count {
  font-size: 3rem;
  font-weight: bold;
  color: #35495e;
  min-width: 100px;
  text-align: center;
}

.btn {
  padding: 0.75rem 1.5rem;
  font-size: 1.25rem;
  border: none;
  border-radius: 4px;
  background: #42b883;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.btn:hover {
  background: #35495e;
  transform: translateY(-2px);
}

.btn:active {
  transform: translateY(0);
}

.btn-reset {
  background: #e74c3c;
}

.btn-reset:hover {
  background: #c0392b;
}
</style>

