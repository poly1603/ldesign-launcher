/**
 * Optional framework-related modules.
 *
 * These declarations allow type-checking without requiring the optional
 * framework plugins to be installed in this package.
 */

// Qwik core runtime
declare module '@builder.io/qwik' {
  export interface Signal<T = any> {
    value: T
  }

  export function useSignal<T = any>(initial?: T): Signal<T>

  export function useVisibleTask$(
    task: () => void | (() => void | Promise<void>),
  ): void
}

// Qwik Vite optimizer
declare module '@builder.io/qwik/optimizer' {
  import type { Plugin } from 'vite'

  export interface QwikViteClientOptions {
    devInput?: string | string[]
    outDir?: string
    // other fields are intentionally omitted
    // to keep this declaration lightweight
    [key: string]: any
  }

  export interface QwikViteOptions {
    client?: QwikViteClientOptions
    [key: string]: any
  }

  export function qwikVite(options?: QwikViteOptions): Plugin | Plugin[]
}

// Qwik City Vite plugin
declare module '@builder.io/qwik-city/vite' {
  import type { Plugin } from 'vite'

  export function qwikCity(...args: any[]): Plugin | Plugin[]
}

// Marko Vite plugin
declare module '@marko/vite' {
  import type { Plugin } from 'vite'

  const marko: (options?: any) => Plugin | Plugin[]
  export default marko
}

// Preact Vite preset
declare module '@preact/preset-vite' {
  import type { Plugin } from 'vite'

  const preactPreset: (options?: any) => Plugin | Plugin[]
  export default preactPreset
}

// React Vite plugin
declare module '@vitejs/plugin-react' {
  import type { Plugin } from 'vite'

  const reactPlugin: (options?: any) => Plugin | Plugin[]
  export default reactPlugin
}

// Solid Vite plugin
declare module 'vite-plugin-solid' {
  import type { Plugin } from 'vite'

  const solidPlugin: (options?: any) => Plugin | Plugin[]
  export default solidPlugin
}

// Svelte Vite plugin
declare module '@sveltejs/vite-plugin-svelte' {
  import type { Plugin } from 'vite'

  export interface SveltePluginOptions {
    [key: string]: any
  }

  export function svelte(options?: SveltePluginOptions): Plugin | Plugin[]
}

// Vue 2 Vite plugin
declare module '@vitejs/plugin-vue2' {
  import type { Plugin } from 'vite'

  const vue2Plugin: (options?: any) => Plugin | Plugin[]
  export default vue2Plugin
}

// Vue 2 JSX Vite plugin (optional)
declare module '@vitejs/plugin-vue2-jsx' {
  import type { Plugin } from 'vite'

  const vue2JsxPlugin: (options?: any) => Plugin | Plugin[]
  export default vue2JsxPlugin
}
