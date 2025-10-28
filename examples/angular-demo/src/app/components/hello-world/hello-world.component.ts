import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-hello-world',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hello">
      <h2>{{ msg }}</h2>
      <p>这是一个简单的 Angular 组件示例</p>
      <div class="features">
        <div class="feature">
          <h3>⚡️ 快速开发</h3>
          <p>使用 Vite 提供极速的开发体验</p>
        </div>
        <div class="feature">
          <h3>🔥 热模块替换</h3>
          <p>修改代码后立即看到效果</p>
        </div>
        <div class="feature">
          <h3>📦 优化构建</h3>
          <p>生产环境自动优化打包</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .hello {
        background: white;
        border-radius: 8px;
        padding: 2rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .hello h2 {
        margin-top: 0;
        color: #dd0031;
      }

      .features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-top: 2rem;
      }

      .feature {
        padding: 1.5rem;
        background: #f8f9fa;
        border-radius: 8px;
        transition: transform 0.3s;
      }

      .feature:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .feature h3 {
        margin: 0 0 0.5rem 0;
        color: #333;
      }

      .feature p {
        margin: 0;
        color: #666;
      }
    `
  ]
})
export class HelloWorldComponent {
  @Input() msg = ''
}

