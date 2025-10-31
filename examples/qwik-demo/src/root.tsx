import { component$ } from '@builder.io/qwik'
import { Counter } from './components/counter'
import { HelloWorld } from './components/hello-world'
import { ConfigDisplay } from './components/config-display'
import './global.css'

export default component$(() => {
  return (
    <div class="app">
      <header class="header">
        <h1>🚀 Qwik + @ldesign/launcher</h1>
        <p>这是一个使用 @ldesign/launcher 构建的 Qwik 示例项目</p>
      </header>

      <main class="main">
        {/* 配置信息展示 */}
        <ConfigDisplay />

        <Counter />
        <HelloWorld msg="欢迎使用 Qwik!" />
      </main>

      <footer class="footer">
        <p>Powered by @ldesign/launcher 2.0</p>
      </footer>
    </div>
  )
})

