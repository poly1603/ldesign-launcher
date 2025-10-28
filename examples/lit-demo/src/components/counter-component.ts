import { LitElement, html, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'

@customElement('counter-component')
export class CounterComponent extends LitElement {
  static styles = css`
    .counter {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }

    .counter h2 {
      margin-top: 0;
      color: #324fff;
    }

    .counter-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin: 1.5rem 0;
    }

    .count {
      font-size: 3rem;
      font-weight: bold;
      color: #333;
      min-width: 100px;
      text-align: center;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      font-size: 1.25rem;
      border: none;
      border-radius: 4px;
      background: #324fff;
      color: white;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn:hover {
      background: #00d4ff;
      transform: translateY(-2px);
    }

    .btn:active {
      transform: translateY(0);
    }

    .btn-reset {
      background: #e74c3c;
    }

    .btn-reset:hover {
      background: #c0392b;
    }
  `

  @state()
  private count = 0

  private increment() {
    this.count++
  }

  private decrement() {
    this.count--
  }

  private reset() {
    this.count = 0
  }

  render() {
    return html`
      <div class="counter">
        <h2>计数器组件</h2>
        <div class="counter-display">
          <button @click=${this.decrement} class="btn">-</button>
          <span class="count">${this.count}</span>
          <button @click=${this.increment} class="btn">+</button>
        </div>
        <button @click=${this.reset} class="btn btn-reset">重置</button>
      </div>
    `
  }
}

