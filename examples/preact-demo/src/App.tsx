import { useState } from 'preact/hooks'

export function App() {
  const [count, setCount] = useState(0)
  const framework = 'Preact'

  return (
    <div class="app">
      <h1>⚡ {framework} Demo</h1>
      <p>Powered by <strong>@ldesign/launcher</strong></p>
      
      <div class="card">
        <button onClick={() => setCount(count + 1)}>
          Count is {count}
        </button>
        <p>Edit <code>src/App.tsx</code> to test HMR</p>
      </div>
      
      <div class="features">
        <h2>✨ Features</h2>
        <ul>
          <li>⚡️ 3KB React Alternative</li>
          <li>🎨 Same API as React</li>
          <li>📦 Zero Config</li>
          <li>🔧 TypeScript Support</li>
        </ul>
      </div>
    </div>
  )
}
