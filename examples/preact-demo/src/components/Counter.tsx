import { useState } from 'preact/hooks'
import './Counter.css'

export function Counter() {
  const [count, setCount] = useState(0)

  const increment = () => setCount(count + 1)
  const decrement = () => setCount(count - 1)
  const reset = () => setCount(0)

  return (
    <div class="counter">
      <h2>计数器组件</h2>
      <div class="counter-display">
        <button onClick={decrement} class="btn">
          -
        </button>
        <span class="count">{count}</span>
        <button onClick={increment} class="btn">
          +
        </button>
      </div>
      <button onClick={reset} class="btn btn-reset">
        重置
      </button>
    </div>
  )
}

