/**
 * Progress view — §5.6
 *
 * Layout (top to bottom):
 *   1. WarmingGrid — signature element, prominent, full width
 *   2. Burndown chart (Recharts): problems remaining vs ideal line to deadline
 *   3. Stats: cold-solve rate, mastered count, pace indicator
 *
 * Design: warming grid is the one place to spend boldness.
 * Everything else is quiet, disciplined, honest. No emojis, no punishing reds.
 */
import { useMemo } from 'react'
import { format, differenceInCalendarDays, addDays, parseISO } from 'date-fns'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts'
import { useStore } from '../../store'
import { computeDailyNewTarget } from '../../scheduling'
import { WarmingGrid } from '../WarmingGrid'
import { cn } from '../../utils/cn'

// ─── helpers ──────────────────────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDisplayDate(iso: string): string {
  return format(parseISO(iso), 'MMM d')
}

// ─── Burndown data ─────────────────────────────────────────────────────────────

interface BurndownPoint {
  date: string     // display label
  ideal: number
  actual: number | null  // null on future dates
}

function buildBurndownData(
  remaining: number,
  deadline: string,
  today: string,
): BurndownPoint[] {
  const totalDays = differenceInCalendarDays(
    parseISO(deadline),
    parseISO(today),
  )

  if (totalDays <= 0) {
    return [
      { date: formatDisplayDate(today), ideal: remaining, actual: remaining },
      { date: formatDisplayDate(deadline), ideal: 0, actual: null },
    ]
  }

  // Build a set of representative points: today, a few intermediates, deadline
  const points: BurndownPoint[] = []

  // How many intermediate points to render (keep it sparse for clarity)
  const step = Math.max(1, Math.floor(totalDays / 6))
  const dates: string[] = []

  for (let d = 0; d <= totalDays; d += step) {
    dates.push(format(addDays(parseISO(today), d), 'yyyy-MM-dd'))
  }
  // Always include deadline
  if (dates[dates.length - 1] !== deadline) {
    dates.push(deadline)
  }

  dates.forEach((dateStr, i) => {
    const daysIn = differenceInCalendarDays(parseISO(dateStr), parseISO(today))
    const idealRemaining = Math.max(
      0,
      remaining - Math.round((remaining / totalDays) * daysIn),
    )
    points.push({
      date: formatDisplayDate(dateStr),
      ideal: idealRemaining,
      // Only today has actual data; future points have null actual
      actual: i === 0 ? remaining : null,
    })
  })

  return points
}

// ─── Stats helpers ─────────────────────────────────────────────────────────────

function computeColdRate(problems: ReturnType<typeof useStore.getState>['problems']): {
  coldRate: number | null
  hasData: boolean
} {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 14)
  const cutoffIso = cutoff.toISOString().slice(0, 10)

  let totalAttempts = 0
  let coldAttempts = 0

  for (const p of problems) {
    for (const a of p.attempts) {
      if (a.date.slice(0, 10) >= cutoffIso) {
        totalAttempts++
        if (a.result === 'cold') coldAttempts++
      }
    }
  }

  if (totalAttempts === 0) return { coldRate: null, hasData: false }
  return { coldRate: coldAttempts / totalAttempts, hasData: true }
}

// ─── Recharts custom tooltip ──────────────────────────────────────────────────

function CustomBurndownTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number | null; color: string }>
  label?: string
}) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="flex flex-col gap-1 px-3 py-2 rounded border border-line/20 bg-ink shadow-lg">
      <span className="font-mono text-xs text-slate">{label}</span>
      {payload.map((entry) => {
        if (entry.value === null || entry.value === undefined) return null
        return (
          <div key={entry.name} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <span className="font-mono text-xs text-paper/90">
              {entry.name}: {entry.value}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export function Progress() {
  const problems = useStore((s) => s.problems)
  const settings = useStore((s) => s.settings)
  const today = todayIso()

  // ── Computed values ────────────────────────────────────────────────────────

  const masteredCount = useMemo(
    () => problems.filter((p) => p.status === 'mastered').length,
    [problems],
  )

  const remaining = useMemo(
    () =>
      problems.filter(
        (p) =>
          p.status === 'not_started' ||
          p.status === 'learning' ||
          p.status === 'reviewing',
      ).length,
    [problems],
  )

  const { dailyNewTarget, paceStatus, remainingNew } = useMemo(
    () => computeDailyNewTarget(problems, settings, today),
    [problems, settings, today],
  )

  const { coldRate, hasData } = useMemo(() => computeColdRate(problems), [problems])

  const burndownData = useMemo(
    () => buildBurndownData(remaining, settings.deadline, today),
    [remaining, settings.deadline, today],
  )

  const deadlineDisplay = format(parseISO(settings.deadline), 'MMMM d, yyyy')

  const daysLeft = differenceInCalendarDays(parseISO(settings.deadline), parseISO(today))

  return (
    <div className="flex flex-col gap-10 px-6 py-8 max-w-4xl mx-auto">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <h1 className="font-mono text-xl font-semibold text-paper">Progress</h1>
        <p className="font-sans text-sm text-slate">
          {problems.length} problems · deadline {deadlineDisplay}
          {daysLeft > 0 ? ` · ${daysLeft} days left` : ' · deadline reached'}
        </p>
      </div>

      {/* ── Warming grid ──────────────────────────────────────────────────── */}
      <section aria-label="Mastery warming grid">
        <div className="relative">
          <WarmingGrid problems={problems} />
        </div>
      </section>

      {/* ── Burndown chart ────────────────────────────────────────────────── */}
      <section aria-label="Burndown chart" className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-mono text-sm font-semibold text-paper/90">Burndown</h2>
          <p className="font-sans text-xs text-slate">
            Problems remaining vs ideal pace to {deadlineDisplay}
          </p>
        </div>

        <div
          className={cn(
            'rounded-lg border border-line/15 bg-paper/3 p-4',
          )}
        >
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={burndownData}
              margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(211,217,222,0.08)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: '#5B6672' }}
                axisLine={{ stroke: 'rgba(211,217,222,0.15)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: '#5B6672' }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <RechartsTooltip content={<CustomBurndownTooltip />} />
              {/* Ideal line — dashed signal teal */}
              <Line
                type="monotone"
                dataKey="ideal"
                name="ideal"
                stroke="#2F6F6A"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={false}
                activeDot={{ r: 3, fill: '#2F6F6A' }}
              />
              {/* Actual line — warm/hot (only today's point, extends as user progresses) */}
              <Line
                type="monotone"
                dataKey="actual"
                name="actual"
                stroke="#D9673B"
                strokeWidth={2}
                dot={{ r: 4, fill: '#D9673B', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#D9673B' }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Chart legend */}
          <div className="flex items-center gap-5 mt-2 pl-8">
            <ChartLegendItem
              color="#2F6F6A"
              dashed
              label="ideal pace"
            />
            <ChartLegendItem
              color="#D9673B"
              label="actual remaining"
            />
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section aria-label="Honest stats" className="flex flex-col gap-4">
        <h2 className="font-mono text-sm font-semibold text-paper/90">Stats</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Mastered */}
          <StatCard
            label="mastered"
            value={`${masteredCount} / ${problems.length}`}
            sub={`${remainingNew} not started`}
          />

          {/* Cold-solve rate */}
          <StatCard
            label="cold rate · last 14 days"
            value={
              hasData && coldRate !== null
                ? `${Math.round(coldRate * 100)}%`
                : '—'
            }
            sub={
              !hasData
                ? 'no attempts yet'
                : coldRate !== null && coldRate < 0.4
                ? 'leaning on solutions — slow down, use hints first'
                : coldRate !== null && coldRate >= 0.7
                ? 'strong independent recall'
                : 'building cold recall'
            }
            accent={
              hasData && coldRate !== null && coldRate < 0.4 ? 'amber' : undefined
            }
          />

          {/* Pace */}
          <StatCard
            label="pace"
            value={paceStatus === 'ahead' ? 'ahead' : paceStatus === 'on_track' ? 'on track' : 'behind'}
            sub={
              paceStatus === 'behind'
                ? `pick up ~${dailyNewTarget}/day to finish by ${format(parseISO(settings.deadline), 'MMM d')}`
                : paceStatus === 'ahead'
                ? `${dailyNewTarget} new/day keeps you ahead`
                : `${dailyNewTarget} new/day to finish on time`
            }
            accent={paceStatus === 'behind' ? 'amber' : paceStatus === 'ahead' ? 'green' : undefined}
          />
        </div>
      </section>

    </div>
  )
}

// ─── Chart legend item ────────────────────────────────────────────────────────

function ChartLegendItem({
  color,
  dashed,
  label,
}: {
  color: string
  dashed?: boolean
  label: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <svg
        width="18"
        height="6"
        viewBox="0 0 18 6"
        aria-hidden="true"
        className="shrink-0"
      >
        <line
          x1="0"
          y1="3"
          x2="18"
          y2="3"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray={dashed ? '5 4' : undefined}
        />
      </svg>
      <span className="font-mono text-xs text-slate/80">{label}</span>
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string
  sub?: string
  accent?: 'amber' | 'green'
}

function StatCard({ label, value, sub, accent }: StatCardProps) {
  const dotColor =
    accent === 'amber'
      ? 'bg-warm'
      : accent === 'green'
      ? 'bg-signal'
      : undefined

  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-4 rounded-lg',
        'border border-line/15 bg-paper/3',
      )}
    >
      <span className="font-sans text-xs text-slate uppercase tracking-wide">
        {label}
      </span>
      <div className="flex items-center gap-2">
        {dotColor && (
          <span
            className={cn('w-2 h-2 rounded-full shrink-0', dotColor)}
            aria-hidden="true"
          />
        )}
        <span className="font-mono text-lg font-medium text-paper">
          {value}
        </span>
      </div>
      {sub && (
        <span
          className={cn(
            'font-sans text-xs',
            accent === 'amber' ? 'text-warm/90' : 'text-slate/80',
          )}
        >
          {sub}
        </span>
      )}
    </div>
  )
}
