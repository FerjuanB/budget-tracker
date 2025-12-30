'use client'

import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    // Check localStorage for saved theme
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
  }, [])

  useEffect(() => {
    // Apply theme to document
    const root = window.document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark')
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.add(prefersDark ? 'dark' : 'light')
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    } else {
      root.classList.add(theme)
      root.setAttribute('data-theme', theme)
    }

    // Save to localStorage
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dark'
      if (prev === 'dark') return 'light'
      return 'light' // system -> light
    })
  }

  const setLightTheme = () => setTheme('light')
  const setDarkTheme = () => setTheme('dark')
  const setSystemTheme = () => setTheme('system')

  return {
    theme,
    setTheme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setSystemTheme,
  }
}