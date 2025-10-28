<script lang="ts">
  import Counter from './lib/Counter.svelte'
  import HelloWorld from './lib/HelloWorld.svelte'
</script>

<div class="app">
  <header class="header">
    <h1>🚀 Svelte + @ldesign/launcher</h1>
    <p>这是一个使用 @ldesign/launcher 构建的 Svelte 示例项目</p>
  </header>

  <main class="main">
    <Counter />
    <HelloWorld msg="欢迎使用 Svelte!" />
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
</style>

