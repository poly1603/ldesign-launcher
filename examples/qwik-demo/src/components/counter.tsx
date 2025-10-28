import { component$, useSignal } from '@builder.io/qwik'
import './counter.css'

export const Counter = component$(() => {
  const count = useSignal(0)

  return (
    <div class="counter">
      <h2>计数器组件</h2>
      <div class="counter-display">
        <button onClick$={() => count.value--} class="btn">
          -
        </button>
        <span class="count">{count.value}</span>
        <button onClick$={() => count.value++} class="btn">
          +
        </button>
      </div>
      <button onClick$={() => (count.value = 0)} class="btn btn-reset">
        重置
      </button>
    </div>
  )
})

