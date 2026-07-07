/**
 * TemperatureBar — stacked horizontal progress bar using the mastery temperature scale.
 *
 * Segments:
 *   not_started: near-transparent (background only)
 *   learning:    cool  #3E7CB1
 *   reviewing:   mid   #8FB8A8
 *   mastered:    hot   #D9673B
 *
 * Temperature colors are used ONLY for mastery encoding (spec §7).
 */
import { cn } from '../utils/cn'

export interface MasteryCounts {
  not_started: number
  learning: number
  reviewing: number
  mastered: number
}

interface TemperatureBarProps {
  counts: MasteryCounts
  /** Optional: show total count label on the right */
  showTotal?: boolean
  className?: string
}

export function TemperatureBar({
  counts,
  showTotal = true,
  className,
}: TemperatureBarProps) {
  const total = counts.not_started + counts.learning + counts.reviewing + counts.mastered

  if (total === 0) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex-1 h-1.5 rounded-full bg-line/20" />
        {showTotal && (
          <span className="font-mono text-xs text-slate/60 tabular-nums shrink-0">0</span>
        )}
      </div>
    )
  }

  const pct = (n: number) => (n / total) * 100

  return (
    <div className={cn('flex items-center gap-2', className)} role="img" aria-label={
      `${counts.mastered} mastered, ${counts.reviewing} reviewing, ${counts.learning} learning, ${counts.not_started} not started`
    }>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-line/20 flex">
        {/* Mastered — hot */}
        {counts.mastered > 0 && (
          <div
            className="bg-hot h-full transition-[width] duration-300"
            style={{ width: `${pct(counts.mastered)}%` }}
          />
        )}
        {/* Reviewing — mid */}
        {counts.reviewing > 0 && (
          <div
            className="bg-mid h-full transition-[width] duration-300"
            style={{ width: `${pct(counts.reviewing)}%` }}
          />
        )}
        {/* Learning — cool */}
        {counts.learning > 0 && (
          <div
            className="bg-cool h-full transition-[width] duration-300"
            style={{ width: `${pct(counts.learning)}%` }}
          />
        )}
        {/* Not started — faint fill, already covered by the background */}
      </div>
      {showTotal && (
        <span className="font-mono text-xs text-slate/60 tabular-nums shrink-0">
          {total}
        </span>
      )}
    </div>
  )
}
