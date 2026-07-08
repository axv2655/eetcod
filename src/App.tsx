import { useEffect } from 'react'
import { Nav } from './components/Nav'
import { ThemeToggle } from './components/ThemeToggle'
import { useStore, selectView } from './store'
import { cn } from './utils/cn'
import type { View } from './types'
import { Today } from './components/views/Today'
import { ProblemSession } from './components/views/ProblemSession'
import { Patterns } from './components/views/Patterns'
import { Concepts } from './components/views/Concepts'
import { Boilerplate } from './components/views/Boilerplate'
import { Settings } from './components/views/Settings'
import { Progress } from './components/views/Progress'

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

// Guard component: handles the case where problem_session is active without a problemId
function SessionGuard({ children }: { children: React.ReactNode }) {
  const setView = useStore((s) => s.setView)
  const sessionState = useStore((s) => s.sessionState)
  const problemId = sessionState?.problemId as string | undefined

  useEffect(() => {
    if (!problemId) {
      setView('today')
    }
  }, [problemId, setView])

  if (!problemId) return null
  return <>{children}</>
}

function ViewContent({ view }: { view: View }) {
  const setView = useStore((s) => s.setView)
  const sessionState = useStore((s) => s.sessionState)
  const setSessionState = useStore((s) => s.setSessionState)

  // ProblemSession is a special overlay — rendered when view === 'problem_session'
  if (view === 'problem_session') {
    const problemId = sessionState?.problemId as string | undefined
    const isTransferTest = (sessionState?.isTransferTest as boolean | undefined) ?? false
    return (
      <SessionGuard>
        <ProblemSession
          problemId={problemId!}
          isTransferTest={isTransferTest}
          onComplete={() => {
            setSessionState(null)
            setView('today')
          }}
        />
      </SessionGuard>
    )
  }

  switch (view) {
    case 'today':
      return <Today />
    case 'patterns':
      return <Patterns />
    case 'concepts':
      return <Concepts />
    case 'boilerplate':
      return <Boilerplate />
    case 'progress':
      return <Progress />
    case 'settings':
      return <Settings />
    default:
      return <PlaceholderView name="unknown" />
  }
}

export default function App() {
  const view = useStore(selectView)
  const setView = useStore((s) => s.setView)

  // When in problem_session, nav shows 'today' as active
  const navView: View = view === 'problem_session' ? 'today' : view

  const handleNavigate = (newView: View) => {
    // If navigating away from problem session, return to today cleanly
    setView(newView)
  }

  return (
    <div
      className={cn(
        'flex h-screen overflow-hidden',
        'bg-ink text-paper',
        'font-sans',
        // On mobile: stack content above bottom nav
        'flex-col md:flex-row',
      )}
    >
      {/* Left rail nav — hidden on mobile (we show bottom bar instead) */}
      <div className="hidden md:flex">
        <Nav currentView={navView} onNavigate={handleNavigate} />
      </div>

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
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <ViewContent view={view} />
        </main>
      </div>

      {/* Bottom tab bar — mobile only */}
      <div className="md:hidden">
        <Nav currentView={navView} onNavigate={handleNavigate} mobile />
      </div>
    </div>
  )
}
