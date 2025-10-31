/**
 * Qwik 开发模式入口文件
 */
import { render } from '@builder.io/qwik'
import Root from './root'

// 创建容器并渲染
const container = document.createElement('div')
container.id = 'app'
document.body.appendChild(container)

render(container, <Root />)

