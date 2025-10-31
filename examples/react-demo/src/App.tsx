import { useState } from 'react'
import './App.css'
import { ConfigDisplay } from './components/ConfigDisplay'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <header className="header">
        <h1>🚀 React + @ldesign/launcher</h1>
        <p>这是一个使用 @ldesign/launcher 构建的 React 示例项目</p>
      </header>

      <main className="main">
        {/* 配置信息展示 */}
        <ConfigDisplay />

        <div className="counter">
          <h2>计数器组件</h2>
          <div className="counter-display">
            <button onClick={() => setCount(count - 1)} className="btn">-</button>
            <span className="count">{count}</span>
            <button onClick={() => setCount(count + 1)} className="btn">+</button>
          </div>
          <button onClick={() => setCount(0)} className="btn btn-reset">重置</button>
        </div>

        <div className="features">
          <div className="feature">
            <h3>⚡️ 快速开发</h3>
            <p>使用 Vite 提供极速的开发体验</p>
          </div>
          <div className="feature">
            <h3>🔧 自动配置</h3>
            <p>框架自动检测，无需手动配置</p>
          </div>
          <div className="feature">
            <h3>🎯 类型安全</h3>
            <p>完整的 TypeScript 支持</p>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>Powered by @ldesign/launcher 2.0</p>
      </footer>
    </div>
  )
}

export default App

