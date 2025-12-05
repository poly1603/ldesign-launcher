/**
 * Dashboard 前端入口
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// 注入 TailwindCSS
const style = document.createElement('style')
style.textContent = `
  @import url('https://cdn.tailwindcss.com');
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    margin: 0;
    padding: 0;
  }
  
  * {
    box-sizing: border-box;
  }
  
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: #1f2937;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
`
document.head.appendChild(style)

// 加载 Tailwind
const tailwindScript = document.createElement('script')
tailwindScript.src = 'https://cdn.tailwindcss.com'
document.head.appendChild(tailwindScript)

// 渲染应用
const root = document.getElementById('root') || document.getElementById('app')
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
