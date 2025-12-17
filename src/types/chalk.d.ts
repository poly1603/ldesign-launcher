/**
 * Type declarations for chalk v5+
 * 
 * chalk v5 is ESM-only with embedded types, but module resolution may not find them.
 * This declaration provides type compatibility.
 */

declare module 'chalk' {
  interface ChalkInstance {
    (text: string | number): string

    // Modifiers
    readonly reset: ChalkInstance
    readonly bold: ChalkInstance
    readonly dim: ChalkInstance
    readonly italic: ChalkInstance
    readonly underline: ChalkInstance
    readonly inverse: ChalkInstance
    readonly hidden: ChalkInstance
    readonly strikethrough: ChalkInstance
    readonly visible: ChalkInstance

    // Colors
    readonly black: ChalkInstance
    readonly red: ChalkInstance
    readonly green: ChalkInstance
    readonly yellow: ChalkInstance
    readonly blue: ChalkInstance
    readonly magenta: ChalkInstance
    readonly cyan: ChalkInstance
    readonly white: ChalkInstance
    readonly gray: ChalkInstance
    readonly grey: ChalkInstance

    // Bright colors
    readonly blackBright: ChalkInstance
    readonly redBright: ChalkInstance
    readonly greenBright: ChalkInstance
    readonly yellowBright: ChalkInstance
    readonly blueBright: ChalkInstance
    readonly magentaBright: ChalkInstance
    readonly cyanBright: ChalkInstance
    readonly whiteBright: ChalkInstance

    // Background colors
    readonly bgBlack: ChalkInstance
    readonly bgRed: ChalkInstance
    readonly bgGreen: ChalkInstance
    readonly bgYellow: ChalkInstance
    readonly bgBlue: ChalkInstance
    readonly bgMagenta: ChalkInstance
    readonly bgCyan: ChalkInstance
    readonly bgWhite: ChalkInstance
    readonly bgGray: ChalkInstance
    readonly bgGrey: ChalkInstance

    // Bright background colors
    readonly bgBlackBright: ChalkInstance
    readonly bgRedBright: ChalkInstance
    readonly bgGreenBright: ChalkInstance
    readonly bgYellowBright: ChalkInstance
    readonly bgBlueBright: ChalkInstance
    readonly bgMagentaBright: ChalkInstance
    readonly bgCyanBright: ChalkInstance
    readonly bgWhiteBright: ChalkInstance

    // 256/TrueColor
    rgb(r: number, g: number, b: number): ChalkInstance
    hex(color: string): ChalkInstance
    bgRgb(r: number, g: number, b: number): ChalkInstance
    bgHex(color: string): ChalkInstance
  }

  const chalk: ChalkInstance
  export default chalk
}
