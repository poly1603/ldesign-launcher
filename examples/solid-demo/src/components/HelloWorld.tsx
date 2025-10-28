import type { Component } from 'solid-js'
import styles from './HelloWorld.module.css'

interface HelloWorldProps {
  msg: string
}

const HelloWorld: Component<HelloWorldProps> = (props) => {
  return (
    <div class={styles.hello}>
      <h2>{props.msg}</h2>
      <p>这是一个简单的 Solid 组件示例</p>
      <div class={styles.features}>
        <div class={styles.feature}>
          <h3>⚡️ 快速开发</h3>
          <p>使用 Vite 提供极速的开发体验</p>
        </div>
        <div class={styles.feature}>
          <h3>🔥 热模块替换</h3>
          <p>修改代码后立即看到效果</p>
        </div>
        <div class={styles.feature}>
          <h3>📦 优化构建</h3>
          <p>生产环境自动优化打包</p>
        </div>
      </div>
    </div>
  )
}

export default HelloWorld

