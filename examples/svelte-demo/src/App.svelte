<script lang="ts">
  import ConfigDisplay from './components/ConfigDisplay.svelte'
  
  let count = 0
  const increment = () => count++
</script>

<div class="app">
  <header class="header">
    <h1>🚀 Svelte + @ldesign/launcher</h1>
    <p>这是一个使用 @ldesign/launcher 构建的 Svelte 示例项目</p>
  </header>

  <main class="main">
    <!-- 配置信息展示 -->
    <ConfigDisplay />

    <div class="counter">
      <h2>计数器示例</h2>
      <button on:click={increment}>点击次数: {count}</button>
    </div>
  </main>

  <footer class="footer">
    <p>Powered by @ldesign/launcher 2.0</p>
  </footer>
</div>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .header {
    background: linear-gradient(135deg, #ff3e00 0%, #ff8a00 100%);
    color: white;
    padding: 2rem;
    text-align: center;
  }

  .header h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2.5rem;
  }

  .header p {
    margin: 0;
    opacity: 0.9;
  }

  .main {
    flex: 1;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  .footer {
    background: #f5f5f5;
    padding: 1rem;
    text-align: center;
    color: #666;
  }

  .counter {
    margin: 2rem 0;
    text-align: center;
  }

  .counter button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background: #ff3e00;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .counter button:hover {
    background: #ff5722;
  }
</style>

