/**
 * Today view — the daily queue. Shows one item at a time.
 *
 * Queue sources (§5.1):
 *   1. Due problem re-attempts
 *   2. Due concept cards
 *   3. Up to dailyNewTarget new problems (strict NeetCode order)
 *
 * Concept cards are reviewed inline; problems launch ProblemSession.
 */
import { useState, useMemo } from 'react'
import { useStore } from '../../store'
import { buildTodayQueue, computeDailyNewTarget } from '../../scheduling'
import type { QueueItem } from '../../scheduling'
import { PATTERN_LABELS, EMPTY_TODAY_TAGLINE, PATTERN_ORDER } from '../../constants'
import { cn } from '../../utils/cn'
import { MasteryDots } from '../MasteryDots'
import type { ConceptCard } from '../../types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── Inline concept card review ───────────────────────────────────────────────

interface ConceptReviewProps {
  card: ConceptCard
  onDone: () => void
}

function ConceptReview({ card, onDone }: ConceptReviewProps) {
  const [revealed, setRevealed] = useState(false)
  const rateCard = useStore((s) => s.rateCard)

  const handleRate = (rating: NonNullable<ConceptCard['lastRating']>) => {
    rateCard(card.id, rating)
    onDone()
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl">
      {/* Question */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-mono text-slate uppercase tracking-widest">
          concept — {PATTERN_LABELS[card.pattern] ?? card.pattern}
        </span>
        <p className="font-sans text-lg text-paper leading-snug">{card.question}</p>
      </div>

      {/* Answer */}
      {revealed ? (
        <div className={cn(
          'border border-line/30 rounded-lg p-4',
          'bg-signal/5',
        )}>
          <p className="font-sans text-sm text-paper leading-relaxed">{card.answer}</p>
        </div>
      ) : (
        <button
          onClick={() => setRevealed(true)}
          className={cn(
            'w-full py-3 rounded-lg border border-line/30',
            'text-sm font-sans text-slate',
            'hover:text-paper hover:border-signal/50 hover:bg-signal/10',
            'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
          )}
        >
          Reveal answer
        </button>
      )}

      {/* Rating buttons — only after reveal */}
      {revealed && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-sans text-slate">How did it go?</p>
          <div className="flex gap-3">
            <button
              onClick={() => handleRate('got_it')}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-sans font-medium',
                'bg-mid/15 text-mid border border-mid/30',
                'hover:bg-mid/25 hover:border-mid/50',
                'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
              )}
            >
              Got it
            </button>
            <button
              onClick={() => handleRate('shaky')}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-sans font-medium',
                'bg-warm/15 text-warm border border-warm/30',
                'hover:bg-warm/25 hover:border-warm/50',
                'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
              )}
            >
              Shaky
            </button>
            <button
              onClick={() => handleRate('missed')}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-sans font-medium',
                'bg-cool/15 text-cool border border-cool/30',
                'hover:bg-cool/25 hover:border-cool/50',
                'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
              )}
            >
              Missed
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  paceStatus: 'on_track' | 'ahead' | 'behind'
  dailyNewTarget: number
  onPullForward: () => void
}

function EmptyState({ paceStatus, onPullForward }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 h-full text-center px-6">
      <div className="flex flex-col items-center gap-3">
        <span className="font-mono text-2xl text-line/20" aria-hidden="true">✓</span>
        <h2 className="font-sans text-xl font-semibold text-paper">Nothing due. You're clear for today.</h2>
        <p className="font-sans text-sm text-slate italic max-w-xs leading-relaxed">
          {EMPTY_TODAY_TAGLINE}
        </p>
      </div>

      {/* Pace indicator */}
      {paceStatus === 'ahead' && (
        <p className="font-mono text-xs text-mid">ahead of pace</p>
      )}
      {paceStatus === 'on_track' && (
        <p className="font-mono text-xs text-slate">on track</p>
      )}
      {paceStatus === 'behind' && (
        <p className="font-mono text-xs text-warm">a bit behind — consider pulling more</p>
      )}

      {/* Pull forward option */}
      <button
        onClick={onPullForward}
        className={cn(
          'text-sm font-sans text-slate/60',
          'hover:text-slate underline-offset-2 hover:underline transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded',
        )}
      >
        Pull tomorrow's problems forward
      </button>
    </div>
  )
}

// ─── Queue item card ──────────────────────────────────────────────────────────

type ItemType = 'review' | 'new' | 'concept'

const TYPE_LABELS: Record<ItemType, string> = {
  review: 'review',
  new: 'new',
  concept: 'concept',
}

const TYPE_COLORS: Record<ItemType, string> = {
  review: 'text-warm bg-warm/10 border-warm/30',
  new: 'text-cool bg-cool/10 border-cool/30',
  concept: 'text-mid bg-mid/10 border-mid/30',
}

// ─── Today view ───────────────────────────────────────────────────────────────

export function Today() {
  const problems = useStore((s) => s.problems)
  const cards = useStore((s) => s.cards)
  const settings = useStore((s) => s.settings)
  const setView = useStore((s) => s.setView)
  const setSessionState = useStore((s) => s.setSessionState)

  const today = todayIso()

  // Build queue fresh on each render (derived from store state)
  const queue = useMemo(
    () => buildTodayQueue(problems, cards, settings, today),
    [problems, cards, settings, today],
  )

  const pacing = useMemo(
    () => computeDailyNewTarget(problems, settings, today),
    [problems, settings, today],
  )

  // Track which items have been completed inline (concept cards)
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())

  // Pull-forward toggle: show extra new problems if user wants to get ahead
  const [pullForward, setPullForward] = useState(false)

  // Extra new problems pulled forward (tomorrow's allocation)
  const extraQueue = useMemo(() => {
    if (!pullForward) return []
    const { dailyNewTarget } = pacing
    const alreadyQueued = new Set(
      queue
        .filter((item) => item.type === 'new')
        .map((item) => (item as { type: 'new'; problem: { id: string } }).problem.id),
    )
    const patternRank = new Map(PATTERN_ORDER.map((p: string, i: number) => [p, i]))
    return problems
      .filter((p) => p.status === 'not_started' && !alreadyQueued.has(p.id))
      .sort((a, b) => {
        const pa = (patternRank.get(a.pattern) as number | undefined) ?? Infinity
        const pb = (patternRank.get(b.pattern) as number | undefined) ?? Infinity
        if (pa !== pb) return pa - pb
        return a.order - b.order
      })
      .slice(0, dailyNewTarget)
      .map((p) => ({ type: 'new' as const, problem: p }))
  }, [pullForward, problems, queue, pacing])

  const fullQueue: QueueItem[] = [...queue, ...extraQueue].filter((item) => {
    const id = item.type === 'concept' ? item.card.id : item.problem.id
    return !doneIds.has(id)
  })

  // Current item is always index 0 of the remaining queue
  const currentItem = fullQueue[0] ?? null
  const remaining = fullQueue.length

  const handleConceptDone = (cardId: string) => {
    setDoneIds((prev) => new Set([...prev, cardId]))
  }

  const handleStartProblem = (problemId: string) => {
    setSessionState({ problemId })
    setView('today') // view stays today but session overlay opens
    // Signal the app to show the session via sessionState
    // The App.tsx will watch sessionState.problemId to decide if ProblemSession is shown
    // We use a special "session" pseudo-view handled in App.tsx
    setView('problem_session' as Parameters<typeof setView>[0])
  }

  const handleSkip = () => {
    if (!currentItem) return
    const id = currentItem.type === 'concept' ? currentItem.card.id : currentItem.problem.id
    setDoneIds((prev) => new Set([...prev, id]))
  }

  if (remaining === 0) {
    return (
      <div className="flex flex-col h-full">
        {/* Pace indicator pill */}
        <PaceBar paceStatus={pacing.paceStatus} />
        <EmptyState
          paceStatus={pacing.paceStatus}
          dailyNewTarget={pacing.dailyNewTarget}
          onPullForward={() => setPullForward(true)}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header: counter + pace */}
      <div className="flex items-center justify-between shrink-0">
        <span
          className="font-mono text-2xl font-semibold text-paper tabular-nums"
          aria-live="polite"
          aria-label={`${remaining} item${remaining === 1 ? '' : 's'} left today`}
        >
          {remaining} left today
        </span>
        <PaceBar paceStatus={pacing.paceStatus} />
      </div>

      {/* Current item */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {currentItem && (
          <QueueCard
            item={currentItem}
            onStart={handleStartProblem}
            onConceptDone={handleConceptDone}
            onSkip={handleSkip}
          />
        )}
      </div>
    </div>
  )
}

// ─── Pace bar ─────────────────────────────────────────────────────────────────

function PaceBar({ paceStatus }: { paceStatus: 'on_track' | 'ahead' | 'behind' }) {
  if (paceStatus === 'on_track') {
    return <span className="font-mono text-xs text-slate">on track</span>
  }
  if (paceStatus === 'ahead') {
    return <span className="font-mono text-xs text-mid">ahead</span>
  }
  // behind — amber dot, calm
  return (
    <span className="flex items-center gap-1.5 font-mono text-xs text-warm">
      <span className="w-1.5 h-1.5 rounded-full bg-warm inline-block" aria-hidden="true" />
      behind pace
    </span>
  )
}

// ─── Queue card ───────────────────────────────────────────────────────────────

interface QueueCardProps {
  item: QueueItem
  onStart: (problemId: string) => void
  onConceptDone: (cardId: string) => void
  onSkip: () => void
}

function QueueCard({ item, onStart, onConceptDone, onSkip }: QueueCardProps) {
  const [showConcept, setShowConcept] = useState(false)

  if (item.type === 'concept') {
    if (!showConcept) {
      const card = item.card
      return (
        <div className="flex flex-col gap-6 w-full max-w-xl">
          {/* Type badge */}
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-xs font-mono px-2 py-0.5 rounded border',
              TYPE_COLORS['concept'],
            )}>
              {TYPE_LABELS['concept']}
            </span>
            <span className="text-xs font-mono text-slate">
              {PATTERN_LABELS[card.pattern] ?? card.pattern}
            </span>
          </div>

          {/* Question preview */}
          <p className="font-sans text-lg text-paper leading-snug">{card.question}</p>

          <div className="flex gap-3">
            <button
              onClick={() => setShowConcept(true)}
              className={cn(
                'flex-1 py-3 rounded-lg text-sm font-sans font-medium',
                'bg-signal text-paper border border-signal/50',
                'hover:bg-signal/80 transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
              )}
            >
              Review card
            </button>
            <button
              onClick={onSkip}
              className={cn(
                'px-4 py-3 rounded-lg text-sm font-sans',
                'border border-line/30 text-slate',
                'hover:text-paper hover:border-line/60 transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
              )}
            >
              Skip
            </button>
          </div>
        </div>
      )
    }

    return (
      <ConceptReview
        card={item.card}
        onDone={() => onConceptDone(item.card.id)}
      />
    )
  }

  // Problem item (review or new)
  const problem = item.problem
  const itemType = item.type

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl">
      {/* Type badge + pattern */}
      <div className="flex items-center gap-2">
        <span className={cn(
          'text-xs font-mono px-2 py-0.5 rounded border',
          TYPE_COLORS[itemType],
        )}>
          {TYPE_LABELS[itemType]}
        </span>
        <span className="text-xs font-mono text-slate">
          {PATTERN_LABELS[problem.pattern] ?? problem.pattern}
        </span>
      </div>

      {/* Problem title + mastery */}
      <div className="flex flex-col gap-2">
        <h2 className="font-sans text-xl font-semibold text-paper leading-tight">
          {problem.title}
        </h2>
        {problem.status !== 'not_started' && (
          <div className="flex items-center gap-2">
            <MasteryDots mastery={problem.mastery} />
            <span className="text-xs font-mono text-slate capitalize">
              {problem.status.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => onStart(problem.id)}
          className={cn(
            'flex-1 py-3 rounded-lg text-sm font-sans font-medium',
            'bg-signal text-paper border border-signal/50',
            'hover:bg-signal/80 transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
          )}
        >
          Start
        </button>
        <button
          onClick={onSkip}
          className={cn(
            'px-4 py-3 rounded-lg text-sm font-sans',
            'border border-line/30 text-slate',
            'hover:text-paper hover:border-line/60 transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
          )}
        >
          Skip
        </button>
      </div>

      {/* Subtle tagline */}
      <p className="text-xs font-sans text-slate/40 italic text-center">
        {EMPTY_TODAY_TAGLINE}
      </p>
    </div>
  )
}
