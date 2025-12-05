import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)
  const framework = 'React'

  return (
    <div className="app">
      <h1>⚛️ {framework} Demo</h1>
      <p>Powered by <strong>@ldesign/launcher</strong></p>
      
      <div className="card">
        <button onClick={() => setCount(count + 1)}>
          Count is {count}
        </button>
        <p>Edit <code>src/App.tsx</code> to test HMR</p>
      </div>
      
      <div className="features">
        <h2>✨ Features</h2>
        <ul>
          <li>⚡️ Fast Refresh</li>
          <li>🎨 React 18 with Hooks</li>
          <li>📦 Zero Config</li>
          <li>🔧 TypeScript Support</li>
        </ul>
      </div>
    </div>
  )
}

export default App
