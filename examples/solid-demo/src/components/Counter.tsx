import { createSignal } from 'solid-js'
import styles from './Counter.module.css'

export default function Counter() {
  const [count, setCount] = createSignal(0)

  const increment = () => setCount(count() + 1)
  const decrement = () => setCount(count() - 1)
  const reset = () => setCount(0)

  return (
    <div class={styles.counter}>
      <h2>计数器组件</h2>
      <div class={styles.counterDisplay}>
        <button onClick={decrement} class={styles.btn}>
          -
        </button>
        <span class={styles.count}>{count()}</span>
        <button onClick={increment} class={styles.btn}>
          +
        </button>
      </div>
      <button onClick={reset} class={`${styles.btn} ${styles.btnReset}`}>
        重置
      </button>
    </div>
  )
}

