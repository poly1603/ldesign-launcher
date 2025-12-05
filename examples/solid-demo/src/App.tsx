import { createSignal } from 'solid-js'

function App() {
  const [count, setCount] = createSignal(0)
  const framework = 'Solid'

  return (
    <div class="app">
      <h1>💎 {framework} Demo</h1>
      <p>Powered by <strong>@ldesign/launcher</strong></p>
      
      <div class="card">
        <button onClick={() => setCount(count() + 1)}>
          Count is {count()}
        </button>
        <p>Edit <code>src/App.tsx</code> to test HMR</p>
      </div>
      
      <div class="features">
        <h2>✨ Features</h2>
        <ul>
          <li>⚡️ True Reactivity</li>
          <li>🎨 Fine-grained Updates</li>
          <li>📦 Zero Config</li>
          <li>🔧 TypeScript Support</li>
        </ul>
      </div>
    </div>
  )
}

export default App
