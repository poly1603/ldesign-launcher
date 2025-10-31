import { component$, useSignal, $ } from '@builder.io/qwik'
import './counter.css'

export const Counter = component$(() => {
  const count = useSignal(0)

  const decrement = $(() => {
    count.value--
  })

  const increment = $(() => {
    count.value++
  })

  const reset = $(() => {
    count.value = 0
  })

  return (
    <div class="counter">
      <h2>计数器组件</h2>
      <div class="counter-display">
        <button onClick$={decrement} class="btn">
          -
        </button>
        <span class="count">{count.value}</span>
        <button onClick$={increment} class="btn">
          +
        </button>
      </div>
      <button onClick$={reset} class="btn btn-reset">
        重置
      </button>
    </div>
  )
})

