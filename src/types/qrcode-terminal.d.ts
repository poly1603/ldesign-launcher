declare module 'qrcode-terminal' {
  export function generate(text: string, opts?: any, callback?: (qrcode: string) => void): void
  export function setErrorLevel(level: string): void
}
