import './style.css'

const framework = 'Vanilla TypeScript'

function setupCounter(element: HTMLButtonElement) {
  let counter = 0
  const setCounter = (count: number) => {
    counter = count
    element.innerHTML = `Count is ${counter}`
  }
  element.addEventListener('click', () => setCounter(counter + 1))
  setCounter(0)
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="app">
    <h1>🌟 ${framework} Demo</h1>
    <p>Powered by <strong>@ldesign/launcher</strong></p>
    
    <div class="card">
      <button id="counter" type="button"></button>
      <p>Edit <code>src/main.ts</code> to test HMR</p>
    </div>
    
    <div class="features">
      <h2>✨ Features</h2>
      <ul>
        <li>⚡️ Lightning Fast HMR</li>
        <li>🎨 Pure TypeScript</li>
        <li>📦 Zero Config</li>
        <li>🔧 No Framework Overhead</li>
      </ul>
    </div>
  </div>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
