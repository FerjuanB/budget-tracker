'use client'

import { useTheme } from '@/hooks/useTheme'
import { Sun, Moon, Monitor } from 'lucide-react'

export function ThemeToggle() {
  const { theme, toggleTheme, setLightTheme, setDarkTheme, setSystemTheme } = useTheme()

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-5 w-5" />
      case 'dark':
        return <Moon className="h-5 w-5" />
      case 'system':
        return <Monitor className="h-5 w-5" />
      default:
        return <Sun className="h-5 w-5" />
    }
  }

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Claro'
      case 'dark':
        return 'Oscuro'
      case 'system':
        return 'Sistema'
      default:
        return 'Claro'
    }
  }

  return (
    <div className="relative group">
      <button
        onClick={toggleTheme}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-border-primary bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label="Toggle theme"
      >
        {getThemeIcon()}
        <span className="hidden sm:inline">{getThemeLabel()}</span>
      </button>

      {/* Theme selector dropdown */}
      <div className="absolute right-0 top-full mt-2 w-48 bg-bg-secondary border border-border-primary rounded-lg shadow-theme-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="p-2">
          <button
            onClick={setLightTheme}
            className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 transition-colors ${
              theme === 'light'
                ? 'bg-primary-500/10 text-primary-600 border border-primary-500/20'
                : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
            }`}
          >
            <Sun className="h-4 w-4" />
            <div className="flex flex-col">
              <span>Modo Claro</span>
              <span className="text-xs text-text-tertiary">Usar tema claro</span>
            </div>
          </button>

          <button
            onClick={setDarkTheme}
            className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 transition-colors mt-1 ${
              theme === 'dark'
                ? 'bg-primary-500/10 text-primary-600 border border-primary-500/20'
                : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
            }`}
          >
            <Moon className="h-4 w-4" />
            <div className="flex flex-col">
              <span>Modo Oscuro</span>
              <span className="text-xs text-text-tertiary">Usar tema oscuro</span>
            </div>
          </button>

          <button
            onClick={setSystemTheme}
            className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 transition-colors mt-1 ${
              theme === 'system'
                ? 'bg-primary-500/10 text-primary-600 border border-primary-500/20'
                : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
            }`}
          >
            <Monitor className="h-4 w-4" />
            <div className="flex flex-col">
              <span>Según Sistema</span>
              <span className="text-xs text-text-tertiary">Usar preferencia del sistema</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}