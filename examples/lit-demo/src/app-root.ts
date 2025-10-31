import { LitElement, html, css } from 'lit'
import { customElement } from 'lit/decorators.js'
import './components/counter-component'
import './components/hello-world'
import './components/config-display'

@customElement('app-root')
export class AppRoot extends LitElement {
  static styles = css`
    .app {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .header {
      background: linear-gradient(135deg, #324fff 0%, #00d4ff 100%);
      color: white;
      padding: 2rem;
      text-align: center;
    }

    .header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2.5rem;
    }

    .header p {
      margin: 0;
      opacity: 0.9;
    }

    .main {
      flex: 1;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    .footer {
      background: #f5f5f5;
      padding: 1rem;
      text-align: center;
      color: #666;
    }
  `

  render() {
    return html`
      <div class="app">
        <header class="header">
          <h1>🚀 Lit + @ldesign/launcher</h1>
          <p>这是一个使用 @ldesign/launcher 构建的 Lit 示例项目</p>
        </header>

        <main class="main">
          <!-- 配置信息展示 -->
          <config-display></config-display>

          <counter-component></counter-component>
          <hello-world msg="欢迎使用 Lit!"></hello-world>
        </main>

        <footer class="footer">
          <p>Powered by @ldesign/launcher 2.0</p>
        </footer>
      </div>
    `
  }
}

