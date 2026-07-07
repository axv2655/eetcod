/**
 * Patterns view — §5.3
 *
 * 18 pattern rows (in PATTERN_ORDER) as an expandable list.
 * Each row: pattern name, TemperatureBar, mastery counts.
 * Expanded: that pattern's problems with status badge, MasteryDots,
 * last attempt date, 3-line notes, inline notes editing.
 * Click problem title → jump to ProblemSession.
 */
import { useState, useMemo } from 'react'
import { useStore } from '../../store'
import { PATTERN_LABELS, PATTERN_ORDER } from '../../constants'
import { cn } from '../../utils/cn'
import { TemperatureBar } from '../TemperatureBar'
import type { MasteryCounts } from '../TemperatureBar'
import { MasteryDots } from '../MasteryDots'
import type { Pattern, Problem, ProblemStatus } from '../../types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  // iso is 'yyyy-MM-dd' or a full ISO string
  const date = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const STATUS_LABELS: Record<ProblemStatus, string> = {
  not_started: 'not started',
  learning: 'learning',
  reviewing: 'reviewing',
  mastered: 'mastered',
}

const STATUS_COLORS: Record<ProblemStatus, string> = {
  not_started: 'text-slate/60 border-line/30',
  learning:    'text-cool border-cool/40',
  reviewing:   'text-mid border-mid/40',
  mastered:    'text-hot border-hot/40',
}

// ─── Notes editor ─────────────────────────────────────────────────────────────

interface NotesEditorProps {
  problemId: string
  notes: Problem['notes']
}

function NotesEditor({ problemId, notes }: NotesEditorProps) {
  const updateNotes = useStore((s) => s.updateNotes)
  const [trigger, setTrigger] = useState(notes.trigger)
  const [insight, setInsight] = useState(notes.insight)
  const [gap, setGap] = useState(notes.gap)

  const hasContent = trigger || insight || gap

  const handleBlur = (field: 'trigger' | 'insight' | 'gap', value: string) => {
    updateNotes(problemId, { [field]: value })
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      {/* Show all three fields always — compact single-line inputs */}
      <div className="grid gap-1.5">
        {(
          [
            { key: 'trigger' as const, label: 'Trigger', value: trigger, setter: setTrigger, placeholder: 'what signaled the pattern' },
            { key: 'insight' as const, label: 'Insight', value: insight, setter: setInsight, placeholder: 'the one non-obvious move' },
            { key: 'gap' as const, label: 'Gap', value: gap, setter: setGap, placeholder: 'what tripped me up' },
          ] as const
        ).map(({ key, label, value, setter, placeholder }) => (
          <label key={key} className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-slate/60 w-14 shrink-0 text-right">
              {label}
            </span>
            <input
              type="text"
              value={value}
              maxLength={140}
              onChange={(e) => setter(e.target.value)}
              onBlur={(e) => handleBlur(key, e.target.value)}
              placeholder={placeholder}
              className={cn(
                'flex-1 bg-transparent text-xs font-sans text-paper/80',
                'border-b border-line/20 focus:border-signal/60',
                'py-0.5 outline-none transition-colors',
                'placeholder:text-slate/30',
              )}
            />
          </label>
        ))}
      </div>

      {!hasContent && (
        <p className="text-xs font-sans text-slate/30 italic ml-16">
          No notes yet — add a trigger, insight, or gap.
        </p>
      )}
    </div>
  )
}

// ─── Problem row ──────────────────────────────────────────────────────────────

interface ProblemRowProps {
  problem: Problem
  onStartSession: (problemId: string) => void
}

function ProblemRow({ problem, onStartSession }: ProblemRowProps) {
  const [editingNotes, setEditingNotes] = useState(false)

  const lastAttemptDate =
    problem.attempts.length > 0
      ? problem.attempts[problem.attempts.length - 1].date
      : null

  const hasNotes = problem.notes.trigger || problem.notes.insight || problem.notes.gap

  return (
    <div className={cn(
      'flex flex-col gap-2 py-3 px-4',
      'border-b border-line/10 last:border-b-0',
    )}>
      {/* Main row */}
      <div className="flex items-center gap-3">
        {/* Problem title — click to start session */}
        <button
          onClick={() => onStartSession(problem.id)}
          className={cn(
            'font-sans text-sm text-paper/90 text-left flex-1 min-w-0',
            'hover:text-signal transition-colors truncate',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded',
          )}
          title={`Start session for ${problem.title}`}
        >
          {problem.title}
        </button>

        {/* Status badge */}
        <span className={cn(
          'text-xs font-mono px-1.5 py-0.5 rounded border shrink-0',
          STATUS_COLORS[problem.status],
        )}>
          {STATUS_LABELS[problem.status]}
        </span>

        {/* Mastery dots */}
        <MasteryDots mastery={problem.mastery} size="sm" />

        {/* Last attempt date */}
        <span className="font-mono text-xs text-slate/50 tabular-nums shrink-0 w-14 text-right">
          {formatDate(lastAttemptDate)}
        </span>

        {/* Notes toggle */}
        <button
          onClick={() => setEditingNotes((v) => !v)}
          className={cn(
            'text-xs font-mono shrink-0 transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded px-1',
            editingNotes
              ? 'text-signal'
              : hasNotes
              ? 'text-slate/60 hover:text-slate'
              : 'text-line/40 hover:text-slate/40',
          )}
          title={editingNotes ? 'Hide notes' : 'Edit notes'}
          aria-expanded={editingNotes}
        >
          {editingNotes ? '▲' : '▼'}
        </button>
      </div>

      {/* Notes panel */}
      {editingNotes && (
        <NotesEditor problemId={problem.id} notes={problem.notes} />
      )}
    </div>
  )
}

// ─── Pattern row ──────────────────────────────────────────────────────────────

interface PatternRowProps {
  pattern: Pattern
  problems: Problem[]
  counts: MasteryCounts
  expanded: boolean
  onToggle: () => void
  onStartSession: (problemId: string) => void
}

function PatternRow({
  pattern,
  problems,
  counts,
  expanded,
  onToggle,
  onStartSession,
}: PatternRowProps) {
  const label = PATTERN_LABELS[pattern] ?? pattern
  const total = counts.not_started + counts.learning + counts.reviewing + counts.mastered

  return (
    <div className={cn(
      'border border-line/20 rounded-lg overflow-hidden',
      'transition-colors',
    )}>
      {/* Header — click to expand */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-4 px-4 py-3',
          'hover:bg-paper/5 transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-inset',
          expanded && 'bg-paper/5',
        )}
        aria-expanded={expanded}
        aria-label={`${label} — ${expanded ? 'collapse' : 'expand'}`}
      >
        {/* Pattern name */}
        <span className="font-sans text-sm font-medium text-paper/90 text-left flex-1 min-w-0 truncate">
          {label}
        </span>

        {/* Counts — mastered / reviewing / learning / not started */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-mono text-xs text-hot tabular-nums" title="Mastered">
            {counts.mastered}
          </span>
          <span className="font-mono text-xs text-slate/30" aria-hidden="true">/</span>
          <span className="font-mono text-xs text-mid tabular-nums" title="Reviewing">
            {counts.reviewing}
          </span>
          <span className="font-mono text-xs text-slate/30" aria-hidden="true">/</span>
          <span className="font-mono text-xs text-cool tabular-nums" title="Learning">
            {counts.learning}
          </span>
          <span className="font-mono text-xs text-slate/30" aria-hidden="true">/</span>
          <span className="font-mono text-xs text-slate/50 tabular-nums" title="Not started">
            {counts.not_started}
          </span>
        </div>

        {/* Temperature bar */}
        <div className="w-28 shrink-0">
          <TemperatureBar counts={counts} showTotal={false} />
        </div>

        {/* Total count */}
        <span className="font-mono text-xs text-slate/50 tabular-nums w-6 text-right shrink-0">
          {total}
        </span>

        {/* Chevron */}
        <span
          className={cn(
            'font-mono text-xs text-slate/40 shrink-0 transition-transform duration-200',
            expanded && 'rotate-180',
          )}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {/* Expanded problem list */}
      {expanded && (
        <div className="border-t border-line/15">
          {problems.length === 0 ? (
            <p className="px-4 py-3 text-xs font-sans text-slate/40 italic">
              No problems in this pattern.
            </p>
          ) : (
            problems.map((problem) => (
              <ProblemRow
                key={problem.id}
                problem={problem}
                onStartSession={onStartSession}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Patterns view ────────────────────────────────────────────────────────────

export function Patterns() {
  const problems = useStore((s) => s.problems)
  const setView = useStore((s) => s.setView)
  const setSessionState = useStore((s) => s.setSessionState)

  const [expandedPatterns, setExpandedPatterns] = useState<Set<Pattern>>(new Set())

  // Group problems by pattern, sorted by order within each pattern
  const problemsByPattern = useMemo(() => {
    const map = new Map<Pattern, Problem[]>()
    for (const pattern of PATTERN_ORDER) {
      const patternProblems = problems
        .filter((p) => p.pattern === pattern)
        .sort((a, b) => a.order - b.order)
      map.set(pattern as Pattern, patternProblems)
    }
    return map
  }, [problems])

  // Compute mastery counts per pattern
  const countsByPattern = useMemo(() => {
    const map = new Map<Pattern, MasteryCounts>()
    for (const [pattern, patternProblems] of problemsByPattern) {
      const counts: MasteryCounts = {
        not_started: 0,
        learning: 0,
        reviewing: 0,
        mastered: 0,
      }
      for (const p of patternProblems) {
        counts[p.status]++
      }
      map.set(pattern, counts)
    }
    return map
  }, [problemsByPattern])

  // Overall totals
  const totals = useMemo(() => {
    return problems.reduce(
      (acc, p) => {
        acc[p.status]++
        return acc
      },
      { not_started: 0, learning: 0, reviewing: 0, mastered: 0 } as MasteryCounts,
    )
  }, [problems])

  const handleToggle = (pattern: Pattern) => {
    setExpandedPatterns((prev) => {
      const next = new Set(prev)
      if (next.has(pattern)) {
        next.delete(pattern)
      } else {
        next.add(pattern)
      }
      return next
    })
  }

  const handleStartSession = (problemId: string) => {
    setSessionState({ problemId })
    setView('problem_session')
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-mono text-xl font-semibold text-paper">Patterns</h1>
        <p className="font-sans text-xs text-slate">
          {problems.length} problems across 18 patterns
        </p>
      </div>

      {/* Overall summary bar */}
      <div className="flex flex-col gap-2 p-4 border border-line/20 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="font-sans text-xs text-slate">Overall progress</span>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-hot tabular-nums" title="Mastered">{totals.mastered} mastered</span>
            <span className="text-mid tabular-nums" title="Reviewing">{totals.reviewing} reviewing</span>
            <span className="text-cool tabular-nums" title="Learning">{totals.learning} learning</span>
            <span className="text-slate/50 tabular-nums" title="Not started">{totals.not_started} not started</span>
          </div>
        </div>
        <TemperatureBar counts={totals} showTotal={false} className="mt-1" />
      </div>

      {/* Pattern rows */}
      <div className="flex flex-col gap-2">
        {PATTERN_ORDER.map((pattern) => {
          const p = pattern as Pattern
          const counts = countsByPattern.get(p) ?? {
            not_started: 0,
            learning: 0,
            reviewing: 0,
            mastered: 0,
          }
          return (
            <PatternRow
              key={p}
              pattern={p}
              problems={problemsByPattern.get(p) ?? []}
              counts={counts}
              expanded={expandedPatterns.has(p)}
              onToggle={() => handleToggle(p)}
              onStartSession={handleStartSession}
            />
          )
        })}
      </div>
    </div>
  )
}
