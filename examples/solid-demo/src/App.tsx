import type { Component } from 'solid-js'
import Counter from './components/Counter'
import HelloWorld from './components/HelloWorld'
import styles from './App.module.css'

const App: Component = () => {
  return (
    <div class={styles.app}>
      <header class={styles.header}>
        <h1>🚀 Solid + @ldesign/launcher</h1>
        <p>这是一个使用 @ldesign/launcher 构建的 Solid 示例项目</p>
      </header>

      <main class={styles.main}>
        <Counter />
        <HelloWorld msg="欢迎使用 Solid!" />
      </main>

      <footer class={styles.footer}>
        <p>Powered by @ldesign/launcher 2.0</p>
      </footer>
    </div>
  )
}

export default App

