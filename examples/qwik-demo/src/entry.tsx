/**
 * Qwik 入口文件
 */
import { render } from '@builder.io/qwik'
import Root from './root'

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', () => {
  const container = document.createElement('div')
  container.id = 'app'
  document.body.appendChild(container)

  render(container, <Root />)
})

