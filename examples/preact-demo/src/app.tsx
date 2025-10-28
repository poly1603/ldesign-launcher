import { Counter } from './components/Counter'
import { HelloWorld } from './components/HelloWorld'
import './app.css'

export function App() {
  return (
    <div class="app">
      <header class="header">
        <h1>🚀 Preact + @ldesign/launcher</h1>
        <p>这是一个使用 @ldesign/launcher 构建的 Preact 示例项目</p>
      </header>

      <main class="main">
        <Counter />
        <HelloWorld msg="欢迎使用 Preact!" />
      </main>

      <footer class="footer">
        <p>Powered by @ldesign/launcher 2.0</p>
      </footer>
    </div>
  )
}

