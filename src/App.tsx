import { useState } from 'react'
import { Nav } from './components/Nav'
import { ThemeToggle } from './components/ThemeToggle'
import type { View } from './types'
import { cn } from './utils/cn'

// Placeholder view components — will be replaced in later tasks
function PlaceholderView({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
      <span className="font-mono text-4xl text-line opacity-20">_</span>
      <p className="font-mono text-sm">{name}</p>
      <p className="text-xs opacity-40">Coming in a later task</p>
    </div>
  )
}

function ViewContent({ view }: { view: View }) {
  switch (view) {
    case 'today':
      return <PlaceholderView name="today" />
    case 'patterns':
      return <PlaceholderView name="patterns" />
    case 'concepts':
      return <PlaceholderView name="concepts" />
    case 'boilerplate':
      return <PlaceholderView name="boilerplate" />
    case 'progress':
      return <PlaceholderView name="progress" />
    case 'settings':
      return <PlaceholderView name="settings" />
    default:
      return <PlaceholderView name="unknown" />
  }
}

export default function App() {
  const [view, setView] = useState<View>('today')

  return (
    <div
      className={cn(
        'flex h-screen overflow-hidden',
        'bg-ink text-paper',
        'font-sans',
      )}
    >
      {/* Left rail nav */}
      <Nav currentView={view} onNavigate={setView} />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className={cn(
            'flex items-center justify-end gap-2',
            'h-10 px-4 shrink-0',
            'border-b border-line/20',
          )}
        >
          <ThemeToggle />
        </header>

        {/* View content */}
        <main className="flex-1 overflow-y-auto p-6">
          <ViewContent view={view} />
        </main>
      </div>
    </div>
  )
}
