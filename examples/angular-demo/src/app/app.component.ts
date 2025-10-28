import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { CounterComponent } from './components/counter/counter.component'
import { HelloWorldComponent } from './components/hello-world/hello-world.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CounterComponent, HelloWorldComponent],
  template: `
    <div class="app">
      <header class="header">
        <h1>🚀 Angular + @ldesign/launcher</h1>
        <p>这是一个使用 @ldesign/launcher 构建的 Angular 示例项目</p>
      </header>

      <main class="main">
        <app-counter></app-counter>
        <app-hello-world [msg]="'欢迎使用 Angular!'"></app-hello-world>
      </main>

      <footer class="footer">
        <p>Powered by @ldesign/launcher 2.0</p>
      </footer>
    </div>
  `,
  styles: [
    `
      .app {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }

      .header {
        background: linear-gradient(135deg, #dd0031 0%, #c3002f 100%);
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
  ]
})
export class AppComponent {}

