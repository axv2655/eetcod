/**
 * Timer — countdown component for ProblemSession.
 *
 * Props:
 *   durationSec  — countdown starting value in seconds
 *   onComplete   — fires when timer reaches 0
 *   onStuck      — fires when user clicks "I'm stuck" (stops the timer)
 *
 * Exposes elapsed seconds via the `elapsedRef` ref (pass a React.MutableRefObject<number>).
 * The ref is updated every second so callers can read it at any time without a re-render.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '../utils/cn'

interface TimerProps {
  durationSec: number
  onComplete: () => void
  onStuck: () => void
  /** Optional ref to read elapsed seconds from the parent. Updated on every tick. */
  elapsedRef?: React.MutableRefObject<number>
  /** When true, the timer is paused (does not count down). */
  paused?: boolean
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function Timer({ durationSec, onComplete, onStuck, elapsedRef, paused = false }: TimerProps) {
  const [remaining, setRemaining] = useState(durationSec)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedRef = useRef(Date.now())
  const pausedRef = useRef(paused)

  // Keep pausedRef in sync
  pausedRef.current = paused

  const stopInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    startedRef.current = Date.now()

    intervalRef.current = setInterval(() => {
      if (pausedRef.current) return

      setRemaining((prev) => {
        const next = prev - 1
        // Update elapsed ref for parent to read
        if (elapsedRef) {
          elapsedRef.current = durationSec - next
        }
        if (next <= 0) {
          stopInterval()
          // Fire onComplete asynchronously to avoid setState during render
          setTimeout(onComplete, 0)
          return 0
        }
        return next
      })
    }, 1000)

    return stopInterval
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally only on mount — durationSec is the initial value

  const handleStuck = () => {
    stopInterval()
    // Record elapsed before calling onStuck
    if (elapsedRef) {
      elapsedRef.current = durationSec - remaining
    }
    onStuck()
  }

  const fraction = durationSec > 0 ? remaining / durationSec : 0
  const pct = Math.max(0, Math.min(100, fraction * 100))

  // Color shifts as time runs out
  const barColor =
    pct > 50
      ? 'bg-signal'
      : pct > 25
      ? 'bg-warm'
      : 'bg-hot'

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Countdown display */}
      <div
        className={cn(
          'font-mono text-2xl font-semibold tabular-nums tracking-wider',
          pct <= 25 ? 'text-hot' : pct <= 50 ? 'text-warm' : 'text-paper',
        )}
        aria-live="polite"
        aria-label={`${fmtTime(remaining)} remaining`}
      >
        {fmtTime(remaining)}
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-1.5 rounded-full bg-line/20 overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Time remaining"
      >
        <div
          className={cn('h-full rounded-full transition-all duration-1000 ease-linear', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* I'm stuck button */}
      <button
        onClick={handleStuck}
        className={cn(
          'text-sm font-sans text-slate underline-offset-2',
          'hover:text-paper hover:underline transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded',
        )}
      >
        I'm stuck — show hint
      </button>
    </div>
  )
}
