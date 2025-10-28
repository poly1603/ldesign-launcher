import { component$ } from '@builder.io/qwik'
import './hello-world.css'

interface HelloWorldProps {
  msg: string
}

export const HelloWorld = component$<HelloWorldProps>(({ msg }) => {
  return (
    <div class="hello">
      <h2>{msg}</h2>
      <p>这是一个简单的 Qwik 组件示例</p>
      <div class="features">
        <div class="feature">
          <h3>⚡️ 快速开发</h3>
          <p>使用 Vite 提供极速的开发体验</p>
        </div>
        <div class="feature">
          <h3>🔥 可恢复性</h3>
          <p>Qwik 的可恢复性让应用瞬间加载</p>
        </div>
        <div class="feature">
          <h3>📦 优化构建</h3>
          <p>生产环境自动优化打包</p>
        </div>
      </div>
    </div>
  )
})

