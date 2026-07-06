import { useEffect, useState } from 'react'
import { cn } from '../utils/cn'

type Theme = 'dark' | 'light'

function getInitialTheme(): Theme {
  // Check localStorage first
  const stored = localStorage.getItem('theme') as Theme | null
  if (stored === 'dark' || stored === 'light') return stored
  // Default to dark per spec §7
  return 'dark'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
  } else {
    root.classList.remove('dark')
    root.classList.add('light')
  }
  localStorage.setItem('theme', theme)
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggle = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded',
        'text-slate-400 hover:text-paper',
        'hover:bg-white/5 transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
      )}
    >
      {isDark ? (
        // Sun icon for "switch to light"
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <circle cx="8" cy="8" r="3" />
          <line x1="8" y1="1" x2="8" y2="3" />
          <line x1="8" y1="13" x2="8" y2="15" />
          <line x1="1" y1="8" x2="3" y2="8" />
          <line x1="13" y1="8" x2="15" y2="8" />
          <line x1="2.93" y1="2.93" x2="4.34" y2="4.34" />
          <line x1="11.66" y1="11.66" x2="13.07" y2="13.07" />
          <line x1="2.93" y1="13.07" x2="4.34" y2="11.66" />
          <line x1="11.66" y1="4.34" x2="13.07" y2="2.93" />
        </svg>
      ) : (
        // Moon icon for "switch to dark"
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M13.5 10A6 6 0 1 1 6 2.5a4.5 4.5 0 0 0 7.5 7.5z" />
        </svg>
      )}
    </button>
  )
}

// Export a hook for other components to read / set theme
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return { theme, setTheme }
}
