/**
 * WarmingGrid — the signature element of the app (spec §5.6, §7).
 *
 * 150 cells, one per problem, laid out in pattern groups (PATTERN_ORDER).
 * Each cell is colored by mastery "temperature":
 *   not_started (status not_started): very faint — thin border, almost empty
 *   learning    (mastery 0, status learning): cool  #3E7CB1
 *   reviewing   mastery 1: cool #3E7CB1
 *   reviewing   mastery 2: mid  #8FB8A8
 *   reviewing   mastery 3: warm #E0A458
 *   mastered:              hot  #D9673B
 *
 * Hover → tooltip: problem title + status label.
 * Respects prefers-reduced-motion for fill transitions.
 */
import { useState, useRef, useCallback } from 'react'
import type { Problem, ProblemStatus } from '../types'
import { PATTERN_LABELS, PATTERN_ORDER } from '../constants'
import { cn } from '../utils/cn'

// ─── Temperature mapping ──────────────────────────────────────────────────────

/**
 * Returns Tailwind background-color class + an inline style color for the cell.
 * Using inline style because the temperature values need to express partial
 * opacity for not_started without losing the border.
 */
function getCellColor(problem: Problem): {
  bg: string
  borderColor: string
  opacity: number
} {
  if (problem.status === 'not_started') {
    return { bg: 'transparent', borderColor: '#D3D9DE', opacity: 1 }
  }
  if (problem.status === 'mastered') {
    return { bg: '#D9673B', borderColor: '#D9673B', opacity: 1 }
  }
  // learning or reviewing — use mastery level
  switch (problem.mastery) {
    case 0:
      return { bg: '#3E7CB1', borderColor: '#3E7CB1', opacity: 0.85 }
    case 1:
      return { bg: '#3E7CB1', borderColor: '#3E7CB1', opacity: 1 }
    case 2:
      return { bg: '#8FB8A8', borderColor: '#8FB8A8', opacity: 1 }
    case 3:
      return { bg: '#E0A458', borderColor: '#E0A458', opacity: 1 }
    default:
      return { bg: '#3E7CB1', borderColor: '#3E7CB1', opacity: 1 }
  }
}

const STATUS_DISPLAY: Record<ProblemStatus, string> = {
  not_started: 'not started',
  learning:    'learning',
  reviewing:   'reviewing',
  mastered:    'mastered',
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipState {
  problem: Problem
  x: number
  y: number
}

// ─── Cell ─────────────────────────────────────────────────────────────────────

interface CellProps {
  problem: Problem
  onHover: (problem: Problem | null, x: number, y: number) => void
}

function Cell({ problem, onHover }: CellProps) {
  const { bg, opacity } = getCellColor(problem)
  const isNotStarted = problem.status === 'not_started'

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      onHover(problem, rect.left + rect.width / 2, rect.top)
    },
    [problem, onHover],
  )

  const handleMouseLeave = useCallback(() => {
    onHover(null, 0, 0)
  }, [onHover])

  return (
    <button
      type="button"
      className={cn(
        'w-4 h-4 rounded-sm',
        'transition-[background-color,opacity] duration-200',
        'focus-visible:ring-1 focus-visible:ring-signal focus-visible:ring-offset-1 focus-visible:ring-offset-ink',
        'focus-visible:outline-none',
        isNotStarted ? 'border border-solid' : '',
      )}
      style={{
        backgroundColor: isNotStarted ? 'transparent' : bg,
        borderColor: isNotStarted ? 'rgba(211, 217, 222, 0.30)' : undefined,
        opacity,
      }}
      aria-label={`${problem.title} — ${STATUS_DISPLAY[problem.status]}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter as unknown as React.FocusEventHandler}
      onBlur={handleMouseLeave}
    />
  )
}

// ─── WarmingGrid ──────────────────────────────────────────────────────────────

interface WarmingGridProps {
  problems: Problem[]
}

export function WarmingGrid({ problems }: WarmingGridProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleHover = useCallback(
    (problem: Problem | null, x: number, y: number) => {
      if (!problem) {
        setTooltip(null)
        return
      }
      setTooltip({ problem, x, y })
    },
    [],
  )

  // Group problems by pattern in PATTERN_ORDER
  const grouped = PATTERN_ORDER.map((pattern) => ({
    pattern,
    label: PATTERN_LABELS[pattern],
    problems: problems
      .filter((p) => p.pattern === pattern)
      .sort((a, b) => a.order - b.order),
  })).filter((g) => g.problems.length > 0)

  // Quick stats for the legend
  const mastered = problems.filter((p) => p.status === 'mastered').length
  const inProgress = problems.filter(
    (p) => p.status === 'learning' || p.status === 'reviewing',
  ).length
  const total = problems.length

  return (
    <div className="flex flex-col gap-5" ref={containerRef}>
      {/* Legend row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <LegendItem color="transparent" border label="not started" />
          <LegendItem color="#3E7CB1" label="learning" />
          <LegendItem color="#8FB8A8" label="reviewing" />
          <LegendItem color="#E0A458" label="approaching" />
          <LegendItem color="#D9673B" label="mastered" />
        </div>
        <span className="font-mono text-xs text-slate tabular-nums">
          {mastered}/{total} mastered · {inProgress} in progress
        </span>
      </div>

      {/* Grid — pattern groups */}
      <div className="flex flex-col gap-3">
        {grouped.map(({ pattern, label, problems: patternProblems }) => (
          <PatternRow
            key={pattern}
            label={label}
            problems={patternProblems}
            onHover={handleHover}
          />
        ))}
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <Tooltip
          problem={tooltip.problem}
          x={tooltip.x}
          y={tooltip.y}
          containerRef={containerRef}
        />
      )}
    </div>
  )
}

// ─── Pattern row ──────────────────────────────────────────────────────────────

interface PatternRowProps {
  label: string
  problems: Problem[]
  onHover: (problem: Problem | null, x: number, y: number) => void
}

function PatternRow({ label, problems, onHover }: PatternRowProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Pattern label — fixed width for alignment */}
      <span
        className="font-mono text-xs text-slate/70 text-right shrink-0 select-none"
        style={{ width: '9.5rem' }}
        title={label}
      >
        {label}
      </span>

      {/* Cell strip */}
      <div className="flex items-center gap-0.5 flex-wrap">
        {problems.map((p) => (
          <Cell key={p.id} problem={p} onHover={onHover} />
        ))}
      </div>
    </div>
  )
}

// ─── Legend item ──────────────────────────────────────────────────────────────

function LegendItem({
  color,
  border,
  label,
}: {
  color: string
  border?: boolean
  label: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-3 h-3 rounded-sm shrink-0"
        style={{
          backgroundColor: color === 'transparent' ? 'transparent' : color,
          border: border ? '1px solid rgba(211, 217, 222, 0.35)' : undefined,
        }}
        aria-hidden="true"
      />
      <span className="font-mono text-xs text-slate/70">{label}</span>
    </div>
  )
}

// ─── Floating tooltip ─────────────────────────────────────────────────────────

interface TooltipProps {
  problem: Problem
  x: number
  y: number
  containerRef: React.RefObject<HTMLDivElement | null>
}

function Tooltip({ problem, x, y, containerRef }: TooltipProps) {
  const { bg, borderColor } = getCellColor(problem)
  const isNotStarted = problem.status === 'not_started'

  // Convert viewport coords to container-relative
  const containerRect = containerRef.current?.getBoundingClientRect()
  const relX = containerRect ? x - containerRect.left : x
  const relY = containerRect ? y - containerRect.top : y

  return (
    <div
      className={cn(
        'absolute z-50 pointer-events-none',
        'flex flex-col gap-1 px-2.5 py-2 rounded',
        'bg-ink border border-line/30 shadow-lg',
        '-translate-x-1/2 -translate-y-full -mt-1.5',
      )}
      style={{
        left: relX,
        top: relY - 6,
      }}
      role="tooltip"
    >
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-sm shrink-0"
          style={{
            backgroundColor: isNotStarted ? 'transparent' : bg,
            border: isNotStarted ? '1px solid rgba(211,217,222,0.4)' : `1px solid ${borderColor}`,
          }}
          aria-hidden="true"
        />
        <span className="font-sans text-sm text-paper whitespace-nowrap">
          {problem.title}
        </span>
      </div>
      <span className="font-mono text-xs text-slate/80 pl-4">
        {STATUS_DISPLAY[problem.status]}
        {problem.status === 'reviewing' ? ` · mastery ${problem.mastery}/3` : ''}
      </span>
    </div>
  )
}
