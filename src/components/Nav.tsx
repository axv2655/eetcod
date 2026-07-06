import { cn } from '../utils/cn'
import type { View } from '../types'

interface NavItem {
  view: View
  label: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    view: 'today',
    label: 'Today',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="3" width="14" height="13" rx="2" />
        <line x1="6" y1="1" x2="6" y2="5" />
        <line x1="12" y1="1" x2="12" y2="5" />
        <line x1="2" y1="8" x2="16" y2="8" />
        <circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    view: 'patterns',
    label: 'Patterns',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="6" height="6" rx="1" />
        <rect x="10" y="2" width="6" height="6" rx="1" />
        <rect x="2" y="10" width="6" height="6" rx="1" />
        <rect x="10" y="10" width="6" height="6" rx="1" />
      </svg>
    ),
  },
  {
    view: 'concepts',
    label: 'Concepts',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 2L2 6v6l7 4 7-4V6L9 2z" />
        <line x1="9" y1="2" x2="9" y2="16" />
        <line x1="2" y1="6" x2="16" y2="6" />
      </svg>
    ),
  },
  {
    view: 'boilerplate',
    label: 'Boilerplate',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="14" height="14" rx="2" />
        <line x1="5" y1="6" x2="9" y2="6" />
        <line x1="5" y1="9" x2="13" y2="9" />
        <line x1="5" y1="12" x2="11" y2="12" />
        <polyline points="11 4 13 6 11 8" />
      </svg>
    ),
  },
  {
    view: 'progress',
    label: 'Progress',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="2 13 6 8 9 11 13 5 16 7" />
        <line x1="2" y1="15" x2="16" y2="15" />
      </svg>
    ),
  },
  {
    view: 'settings',
    label: 'Settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="9" r="2.5" />
        <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.41 1.41M13.37 13.37l1.41 1.41M14.78 3.22l-1.41 1.41M4.63 13.37l-1.41 1.41" />
      </svg>
    ),
  },
]

interface NavProps {
  currentView: View
  onNavigate: (view: View) => void
}

export function Nav({ currentView, onNavigate }: NavProps) {
  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        'flex flex-col w-16 shrink-0',
        'bg-ink border-r border-line/20',
        'py-4 gap-1',
        // On wider screens show labels; on narrow screens icon-only
        'md:w-48',
      )}
    >
      {/* App wordmark */}
      <div className="px-4 mb-4 hidden md:block">
        <span className="font-mono text-paper text-sm font-semibold tracking-wider uppercase">
          Warmup
        </span>
      </div>
      <div className="px-3 mb-4 md:hidden flex justify-center">
        <span className="font-mono text-paper text-xs font-semibold tracking-wider">W</span>
      </div>

      {/* Nav items */}
      <ul className="flex flex-col gap-0.5 flex-1 px-2" role="list">
        {NAV_ITEMS.map(item => {
          const isActive = item.view === currentView
          return (
            <li key={item.view}>
              <button
                onClick={() => onNavigate(item.view)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                className={cn(
                  'w-full flex items-center gap-3 px-2 py-2 rounded',
                  'transition-colors duration-100',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
                  isActive
                    ? 'bg-signal/20 text-signal'
                    : 'text-slate-400 hover:text-paper hover:bg-white/5',
                )}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="hidden md:block text-sm font-sans">
                  {item.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
