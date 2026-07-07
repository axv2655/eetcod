/**
 * Scheduling engine — pure functions implementing spec §4 exactly.
 *
 * No side-effects; all inputs and outputs are values.
 * Import into the Zustand store actions or any React component.
 */
import { addDays, format, differenceInCalendarDays } from 'date-fns'
import type { Problem, ConceptCard, Settings, Mastery, ProblemStatus, AttemptResult } from './types'
import { MASTERY_INTERVALS, PATTERN_ORDER } from './constants'

// ─── QueueItem type ───────────────────────────────────────────────────────────

export type QueueItem =
  | { type: 'review'; problem: Problem }
  | { type: 'new'; problem: Problem }
  | { type: 'concept'; card: ConceptCard }

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Format a Date to the canonical ISO date string used throughout the app. */
function toIso(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/** Add N calendar days to an ISO date string and return an ISO date string. */
function addDaysToIso(isoDate: string, days: number): string {
  // Parse as midnight local — safe for date arithmetic
  return toIso(addDays(new Date(isoDate + 'T00:00:00'), days))
}

// ─── §4a — Problem scheduling ─────────────────────────────────────────────────

/**
 * Compute the new mastery, status, and nextReview for a problem after an
 * attempt. Implements spec §4a exactly.
 *
 * @param problem  Current problem state
 * @param result   What happened in the attempt
 * @param today    ISO date string for "today" (injected for testability)
 */
export function scheduleAfterAttempt(
  problem: Problem,
  result: AttemptResult,
  today: string,
): { mastery: Mastery; status: ProblemStatus; nextReview: string } {
  const currentMastery = problem.mastery

  switch (result) {
    case 'cold': {
      const newMastery = Math.min(3, currentMastery + 1) as Mastery
      // If the problem was already at mastery 3 (including 'mastered' status),
      // solving cold again → mastered + 30-day check-in.
      if (currentMastery === 3) {
        return {
          mastery: 3,
          status: 'mastered',
          nextReview: addDaysToIso(today, 30),
        }
      }
      // Otherwise advance mastery, stay in reviewing.
      return {
        mastery: newMastery,
        status: 'reviewing',
        nextReview: addDaysToIso(today, MASTERY_INTERVALS[newMastery]),
      }
    }

    case 'hint': {
      return {
        mastery: currentMastery,
        status: 'reviewing',
        nextReview: addDaysToIso(today, 2),
      }
    }

    case 'solution': {
      return {
        mastery: 0,
        status: 'learning',
        nextReview: addDaysToIso(today, 1),
      }
    }
  }
}

// ─── §4b — Concept card scheduling ───────────────────────────────────────────

/**
 * Compute the new interval and nextReview for a concept card after rating.
 * Implements spec §4b exactly.
 *
 * @param card    Current card state
 * @param rating  User's self-assessment
 * @param today   ISO date string for "today"
 */
export function scheduleCard(
  card: ConceptCard,
  rating: 'got_it' | 'shaky' | 'missed',
  today: string,
): { interval: number; nextReview: string } {
  let interval: number

  switch (rating) {
    case 'got_it':
      interval = Math.min(30, Math.max(3, card.interval * 2))
      break
    case 'shaky':
      interval = 3
      break
    case 'missed':
      interval = 1
      break
  }

  return {
    interval,
    nextReview: addDaysToIso(today, interval),
  }
}

// ─── §4a — isDue ─────────────────────────────────────────────────────────────

/**
 * A problem or card is due when it has a nextReview date and that date is
 * today or in the past (ISO string comparison works for yyyy-MM-dd).
 */
export function isDue(nextReview: string | null, today: string): boolean {
  return nextReview !== null && nextReview <= today
}

// ─── §4c — Daily new-problem pacing ──────────────────────────────────────────

/**
 * Compute how many new problems the user should tackle today to stay on pace
 * for the deadline, and whether they're ahead/on-track/behind.
 *
 * @param problems  Full problem list
 * @param settings  User settings (deadline, studyDaysPerWeek)
 * @param today     ISO date string for "today"
 */
export function computeDailyNewTarget(
  problems: Problem[],
  settings: Settings,
  today: string,
): {
  dailyNewTarget: number
  paceStatus: 'on_track' | 'ahead' | 'behind'
  remainingNew: number
  studyDaysLeft: number
} {
  const totalProblems = problems.length
  const remainingNew = problems.filter((p) => p.status === 'not_started').length

  // Raw calendar days from today to deadline
  const rawDays = differenceInCalendarDays(
    new Date(settings.deadline + 'T00:00:00'),
    new Date(today + 'T00:00:00'),
  )

  // Scale by study-days-per-week factor, ensure at least 1
  const studyDaysLeft = Math.max(1, rawDays * (settings.studyDaysPerWeek / 7))

  // Daily new target, clamped to [1, 8]
  const rawTarget = Math.ceil(remainingNew / studyDaysLeft)
  const dailyNewTarget = Math.min(8, Math.max(1, rawTarget))

  // Pace: compare current required rate vs a "fresh start" rate anchored to
  // today's remaining time.
  //
  // freshStartRate = totalProblems / studyDaysLeft
  //   (what someone starting fresh today with all totalProblems would need)
  //
  // currentRate = remainingNew / studyDaysLeft
  //   (what the user actually needs to do per day)
  //
  // - currentRate < freshStartRate → ahead (user has already done some work)
  // - currentRate > 8 (the hard cap) → behind (impossible to finish at the cap rate)
  // - otherwise → on_track
  //
  // This is clean and stateless: it measures how the user's current load compares
  // to what a fresh user would face, naturally rewarding progress.

  const MAX_DAILY = 8
  const freshStartRate = totalProblems / studyDaysLeft
  const currentRate = remainingNew / studyDaysLeft

  let paceStatus: 'on_track' | 'ahead' | 'behind' = 'on_track'

  if (totalProblems === 0 || remainingNew === 0) {
    paceStatus = 'ahead'
  } else if (rawTarget > MAX_DAILY) {
    // Unclamped rate exceeds the maximum we can cap — definitively behind
    paceStatus = 'behind'
  } else if (currentRate < freshStartRate - 0.5) {
    // Needing meaningfully less per day than a fresh starter → ahead
    paceStatus = 'ahead'
  } else {
    paceStatus = 'on_track'
  }

  return {
    dailyNewTarget,
    paceStatus,
    remainingNew,
    studyDaysLeft,
  }
}

// ─── §5.1 — Today queue assembly ──────────────────────────────────────────────

/**
 * Build the ordered queue of items for today's study session.
 *
 * Assembly order (spec §5.1):
 *  1. All due problem re-attempts
 *  2. All due concept cards (incl. new cards whose pattern has been started)
 *  3. Up to dailyNewTarget new problems in strict NeetCode order
 *
 * The result interleaves review and new items so they aren't all clumped.
 */
export function buildTodayQueue(
  problems: Problem[],
  cards: ConceptCard[],
  settings: Settings,
  today: string,
): QueueItem[] {
  // 1. Due problem re-attempts (status != not_started, and isDue)
  const dueReviews: QueueItem[] = problems
    .filter((p) => p.status !== 'not_started' && isDue(p.nextReview, today))
    .map((p) => ({ type: 'review' as const, problem: p }))

  // 2. Due concept cards
  // Patterns that have been started (at least one problem not not_started)
  const startedPatterns = new Set(
    problems
      .filter((p) => p.status !== 'not_started')
      .map((p) => p.pattern),
  )

  const dueCards: QueueItem[] = cards
    .filter((c) => {
      if (isDue(c.nextReview, today)) return true
      // New cards (nextReview === null) are due if their pattern is started
      if (c.nextReview === null && startedPatterns.has(c.pattern)) return true
      return false
    })
    .map((c) => ({ type: 'concept' as const, card: c }))

  // 3. New problems in strict NeetCode order
  const { dailyNewTarget } = computeDailyNewTarget(problems, settings, today)

  // Build a pattern → order map for sorting
  const patternRank = new Map(PATTERN_ORDER.map((p, i) => [p, i]))

  const newProblems: QueueItem[] = problems
    .filter((p) => p.status === 'not_started')
    .sort((a, b) => {
      const pa = patternRank.get(a.pattern) ?? Infinity
      const pb = patternRank.get(b.pattern) ?? Infinity
      if (pa !== pb) return pa - pb
      return a.order - b.order
    })
    .slice(0, dailyNewTarget)
    .map((p) => ({ type: 'new' as const, problem: p }))

  // 4. Interleave reviews and new items (alternate: review, new, review, new...)
  //    Concept cards are woven in at the start (after the first review if any, else at top)
  const interleaved: QueueItem[] = []
  let ri = 0
  let ni = 0
  let ci = 0

  // Simple round-robin: concept → review → new → review → new ...
  // First, place due concept cards at the beginning (interspersed)
  while (ri < dueReviews.length || ni < newProblems.length || ci < dueCards.length) {
    if (ci < dueCards.length) {
      interleaved.push(dueCards[ci++])
    }
    if (ri < dueReviews.length) {
      interleaved.push(dueReviews[ri++])
    }
    if (ni < newProblems.length) {
      interleaved.push(newProblems[ni++])
    }
  }

  return interleaved
}
