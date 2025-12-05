<script lang="ts">
  let count = 0
  const framework = 'Svelte'

  function increment() {
    count += 1
  }
</script>

<div class="app">
  <h1>🔥 {framework} Demo</h1>
  <p>Powered by <strong>@ldesign/launcher</strong></p>
  
  <div class="card">
    <button on:click={increment}>
      Count is {count}
    </button>
    <p>Edit <code>src/App.svelte</code> to test HMR</p>
  </div>
  
  <div class="features">
    <h2>✨ Features</h2>
    <ul>
      <li>⚡️ Super Fast HMR</li>
      <li>🎨 Svelte 4 Reactivity</li>
      <li>📦 Zero Config</li>
      <li>🔧 TypeScript Support</li>
    </ul>
  </div>
</div>

<style>
  .app {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  h1 {
    color: #ff3e00;
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
    background: #ff3e00;
    color: white;
    cursor: pointer;
    transition: background 0.2s;
  }

  button:hover {
    background: #e63600;
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
