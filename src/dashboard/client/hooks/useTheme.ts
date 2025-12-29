/**
 * 主题管理 Hook
 */
import { useCallback, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light' | 'system'

export interface ThemeColors {
  bg: string
  bgSecondary: string
  bgTertiary: string
  text: string
  textSecondary: string
  border: string
  primary: string
  success: string
  warning: string
  error: string
}

const darkTheme: ThemeColors = {
  bg: '#111827',
  bgSecondary: '#1f2937',
  bgTertiary: '#374151',
  text: '#ffffff',
  textSecondary: '#9ca3af',
  border: '#374151',
  primary: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
}

const lightTheme: ThemeColors = {
  bg: '#ffffff',
  bgSecondary: '#f3f4f6',
  bgTertiary: '#e5e7eb',
  text: '#111827',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  primary: '#0891b2',
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
}

interface UseThemeReturn {
  theme: Theme
  colors: ThemeColors
  isDark: boolean
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('launcher-theme') as Theme
      return saved || 'dark'
    }
    return 'dark'
  })

  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return true
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const isDark = theme === 'system' ? systemDark : theme === 'dark'
  const colors = isDark ? darkTheme : lightTheme

  useEffect(() => {
    // 应用主题到 document
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.style.setProperty('--color-bg', colors.bg)
    document.documentElement.style.setProperty('--color-bg-secondary', colors.bgSecondary)
    document.documentElement.style.setProperty('--color-text', colors.text)
    document.documentElement.style.setProperty('--color-primary', colors.primary)
  }, [isDark, colors])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('launcher-theme', newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark')
  }, [isDark, setTheme])

  return {
    theme,
    colors,
    isDark,
    setTheme,
    toggleTheme,
  }
}

export default useTheme
