/**
 * MasteryDots — renders 4 dots filled up to the mastery level.
 *
 * Temperature colors (used ONLY for mastery, per spec §7):
 *   0 = none (empty)
 *   1 = cool (#3E7CB1)
 *   2 = mid  (#8FB8A8)
 *   3 = warm (#E0A458)
 *
 * (hot / #D9673B is for mastered=4 which doesn't exist as a separate dot level,
 *  but we can use it if mastery is ever displayed as "fully mastered")
 */
import { cn } from '../utils/cn'
import type { Mastery } from '../types'

interface MasteryDotsProps {
  mastery: Mastery
  /** Optional size override; defaults to 'sm' */
  size?: 'sm' | 'md'
}

const DOT_COLORS: Record<number, string> = {
  1: 'bg-cool',
  2: 'bg-mid',
  3: 'bg-warm',
}

export function MasteryDots({ mastery, size = 'sm' }: MasteryDotsProps) {
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'

  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={`Mastery level ${mastery} of 3`}
      title={`Mastery ${mastery}/3`}
    >
      {[1, 2, 3].map((level) => {
        const filled = level <= mastery
        return (
          <span
            key={level}
            className={cn(
              dotSize,
              'rounded-full transition-colors duration-200',
              filled ? DOT_COLORS[level] : 'bg-line/40',
            )}
            aria-hidden="true"
          />
        )
      })}
    </span>
  )
}
