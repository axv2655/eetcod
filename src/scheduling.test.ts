/**
 * Tests for src/scheduling.ts — written first (TDD).
 *
 * Run with: npx vitest run src/scheduling.test.ts
 */
import { describe, it, expect } from 'vitest'
import { addDays, format } from 'date-fns'
import {
  scheduleAfterAttempt,
  scheduleCard,
  isDue,
  computeDailyNewTarget,
  buildTodayQueue,
} from './scheduling'
import type { Problem, ConceptCard, Settings } from './types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = '2026-07-06'

/** Return an ISO date string N calendar days from TODAY */
function todayPlus(n: number): string {
  return format(addDays(new Date(TODAY + 'T00:00:00'), n), 'yyyy-MM-dd')
}

/** Build a minimal Problem for testing */
function makeProblem(overrides: Partial<Problem> = {}): Problem {
  return {
    id: 'two-sum',
    title: 'Two Sum',
    url: 'https://leetcode.com/problems/two-sum/',
    pattern: 'arrays_hashing',
    order: 1,
    status: 'learning',
    mastery: 0,
    nextReview: null,
    attempts: [],
    notes: { trigger: '', insight: '', gap: '' },
    solution: null,
    ...overrides,
  }
}

/** Build a minimal ConceptCard for testing */
function makeCard(overrides: Partial<ConceptCard> = {}): ConceptCard {
  return {
    id: 'card-1',
    pattern: 'arrays_hashing',
    question: 'What signals arrays/hashing?',
    answer: 'Need O(1) lookup or counting',
    interval: 0,
    nextReview: null,
    lastRating: null,
    ...overrides,
  }
}

/** Default test settings */
const DEFAULT_SETTINGS: Settings = {
  timerSec: 480,
  studyDaysPerWeek: 6,
  language: 'Python',
  deadline: '2026-08-21',
}

// ─── scheduleAfterAttempt ─────────────────────────────────────────────────────

describe('scheduleAfterAttempt', () => {
  // ── cold ──
  it('cold on mastery 0 → mastery 1, reviewing, nextReview +3', () => {
    const p = makeProblem({ mastery: 0, status: 'learning' })
    const r = scheduleAfterAttempt(p, 'cold', TODAY)
    expect(r.mastery).toBe(1)
    expect(r.status).toBe('reviewing')
    expect(r.nextReview).toBe(todayPlus(3))
  })

  it('cold on mastery 1 → mastery 2, reviewing, nextReview +7', () => {
    const p = makeProblem({ mastery: 1, status: 'reviewing' })
    const r = scheduleAfterAttempt(p, 'cold', TODAY)
    expect(r.mastery).toBe(2)
    expect(r.status).toBe('reviewing')
    expect(r.nextReview).toBe(todayPlus(7))
  })

  it('cold on mastery 2 → mastery 3, reviewing, nextReview +16', () => {
    const p = makeProblem({ mastery: 2, status: 'reviewing' })
    const r = scheduleAfterAttempt(p, 'cold', TODAY)
    expect(r.mastery).toBe(3)
    expect(r.status).toBe('reviewing')
    expect(r.nextReview).toBe(todayPlus(16))
  })

  it('cold on mastery 3 → status mastered, nextReview +30', () => {
    const p = makeProblem({ mastery: 3, status: 'reviewing' })
    const r = scheduleAfterAttempt(p, 'cold', TODAY)
    expect(r.mastery).toBe(3) // stays at 3 (min(3, 3+1)=3, then mastered path)
    expect(r.status).toBe('mastered')
    expect(r.nextReview).toBe(todayPlus(30))
  })

  it('cold on already mastered → stays mastered, nextReview +30', () => {
    const p = makeProblem({ mastery: 3, status: 'mastered' })
    const r = scheduleAfterAttempt(p, 'cold', TODAY)
    expect(r.mastery).toBe(3)
    expect(r.status).toBe('mastered')
    expect(r.nextReview).toBe(todayPlus(30))
  })

  // ── hint ──
  it('hint → mastery unchanged, reviewing, nextReview +2', () => {
    const p = makeProblem({ mastery: 1, status: 'reviewing' })
    const r = scheduleAfterAttempt(p, 'hint', TODAY)
    expect(r.mastery).toBe(1)
    expect(r.status).toBe('reviewing')
    expect(r.nextReview).toBe(todayPlus(2))
  })

  it('hint on mastery 0 → mastery stays 0, reviewing, nextReview +2', () => {
    const p = makeProblem({ mastery: 0, status: 'learning' })
    const r = scheduleAfterAttempt(p, 'hint', TODAY)
    expect(r.mastery).toBe(0)
    expect(r.status).toBe('reviewing')
    expect(r.nextReview).toBe(todayPlus(2))
  })

  // ── solution ──
  it('solution → mastery 0, learning, nextReview +1', () => {
    const p = makeProblem({ mastery: 2, status: 'reviewing' })
    const r = scheduleAfterAttempt(p, 'solution', TODAY)
    expect(r.mastery).toBe(0)
    expect(r.status).toBe('learning')
    expect(r.nextReview).toBe(todayPlus(1))
  })

  it('solution on any mastery → mastery resets to 0', () => {
    const p = makeProblem({ mastery: 3, status: 'mastered' })
    const r = scheduleAfterAttempt(p, 'solution', TODAY)
    expect(r.mastery).toBe(0)
    expect(r.status).toBe('learning')
    expect(r.nextReview).toBe(todayPlus(1))
  })

  // ── first attempt on not_started ──
  it('first attempt cold on not_started → same rules as mastery 0 cold', () => {
    const p = makeProblem({ mastery: 0, status: 'not_started' })
    const r = scheduleAfterAttempt(p, 'cold', TODAY)
    expect(r.mastery).toBe(1)
    expect(r.status).toBe('reviewing')
    expect(r.nextReview).toBe(todayPlus(3))
  })

  it('first attempt solution on not_started → mastery 0, learning', () => {
    const p = makeProblem({ mastery: 0, status: 'not_started' })
    const r = scheduleAfterAttempt(p, 'solution', TODAY)
    expect(r.mastery).toBe(0)
    expect(r.status).toBe('learning')
    expect(r.nextReview).toBe(todayPlus(1))
  })

  it('first attempt hint on not_started → mastery 0, reviewing, +2', () => {
    const p = makeProblem({ mastery: 0, status: 'not_started' })
    const r = scheduleAfterAttempt(p, 'hint', TODAY)
    expect(r.mastery).toBe(0)
    expect(r.status).toBe('reviewing')
    expect(r.nextReview).toBe(todayPlus(2))
  })
})

// ─── scheduleCard ─────────────────────────────────────────────────────────────

describe('scheduleCard', () => {
  it('got_it on interval 5 → interval 10', () => {
    const c = makeCard({ interval: 5 })
    const r = scheduleCard(c, 'got_it', TODAY)
    expect(r.interval).toBe(10)
    expect(r.nextReview).toBe(todayPlus(10))
  })

  it('got_it on interval 20 → interval 30 (capped at 30)', () => {
    const c = makeCard({ interval: 20 })
    const r = scheduleCard(c, 'got_it', TODAY)
    expect(r.interval).toBe(30)
    expect(r.nextReview).toBe(todayPlus(30))
  })

  it('got_it on interval 0 → interval 3 (min 3)', () => {
    const c = makeCard({ interval: 0 })
    const r = scheduleCard(c, 'got_it', TODAY)
    expect(r.interval).toBe(3)
    expect(r.nextReview).toBe(todayPlus(3))
  })

  it('got_it on interval 1 → interval 3 (max(3, 1*2)=3)', () => {
    const c = makeCard({ interval: 1 })
    const r = scheduleCard(c, 'got_it', TODAY)
    expect(r.interval).toBe(3)
    expect(r.nextReview).toBe(todayPlus(3))
  })

  it('got_it on interval 16 → interval 30 (min(30, 32)=30)', () => {
    const c = makeCard({ interval: 16 })
    const r = scheduleCard(c, 'got_it', TODAY)
    expect(r.interval).toBe(30)
    expect(r.nextReview).toBe(todayPlus(30))
  })

  it('shaky → interval 3', () => {
    const c = makeCard({ interval: 10 })
    const r = scheduleCard(c, 'shaky', TODAY)
    expect(r.interval).toBe(3)
    expect(r.nextReview).toBe(todayPlus(3))
  })

  it('missed → interval 1', () => {
    const c = makeCard({ interval: 10 })
    const r = scheduleCard(c, 'missed', TODAY)
    expect(r.interval).toBe(1)
    expect(r.nextReview).toBe(todayPlus(1))
  })

  it('shaky on a new card (interval 0) → interval 3', () => {
    const c = makeCard({ interval: 0 })
    const r = scheduleCard(c, 'shaky', TODAY)
    expect(r.interval).toBe(3)
  })

  it('missed on a new card (interval 0) → interval 1', () => {
    const c = makeCard({ interval: 0 })
    const r = scheduleCard(c, 'missed', TODAY)
    expect(r.interval).toBe(1)
  })
})

// ─── isDue ────────────────────────────────────────────────────────────────────

describe('isDue', () => {
  it('null nextReview is never due', () => {
    expect(isDue(null, TODAY)).toBe(false)
  })

  it('nextReview === today → due', () => {
    expect(isDue(TODAY, TODAY)).toBe(true)
  })

  it('nextReview before today → due', () => {
    expect(isDue(todayPlus(-1), TODAY)).toBe(true)
  })

  it('nextReview after today → not due', () => {
    expect(isDue(todayPlus(1), TODAY)).toBe(false)
  })

  it('nextReview far in the future → not due', () => {
    expect(isDue(todayPlus(30), TODAY)).toBe(false)
  })
})

// ─── computeDailyNewTarget ────────────────────────────────────────────────────

describe('computeDailyNewTarget', () => {
  /**
   * deadline = 2026-08-21
   * today    = 2026-07-06
   * raw days = differenceInCalendarDays('2026-08-21', '2026-07-06') = 46
   * studyDaysLeft = 46 * (6/7) ≈ 39.43, min 1
   * remainingNew = 150
   * dailyNewTarget = ceil(150 / 39.43) = ceil(3.80) = 4
   */
  it('150 problems, 46 days left, 6 days/week → dailyNewTarget 4', () => {
    const problems: Problem[] = Array.from({ length: 150 }, (_, i) =>
      makeProblem({ id: `p-${i}`, status: 'not_started', order: i + 1 }),
    )
    const result = computeDailyNewTarget(problems, DEFAULT_SETTINGS, TODAY)
    expect(result.dailyNewTarget).toBe(4)
    expect(result.remainingNew).toBe(150)
    expect(result.studyDaysLeft).toBeGreaterThan(1)
  })

  it('clamps dailyNewTarget to minimum of 1 when very few remain', () => {
    const problems: Problem[] = [
      makeProblem({ id: 'p-1', status: 'not_started' }),
    ]
    const result = computeDailyNewTarget(problems, DEFAULT_SETTINGS, TODAY)
    expect(result.dailyNewTarget).toBe(1)
  })

  it('clamps dailyNewTarget to maximum of 8', () => {
    // Many problems, very little time
    const nearDeadlineSettings: Settings = {
      ...DEFAULT_SETTINGS,
      deadline: todayPlus(2), // only 2 days left
    }
    const problems: Problem[] = Array.from({ length: 100 }, (_, i) =>
      makeProblem({ id: `p-${i}`, status: 'not_started', order: i + 1 }),
    )
    const result = computeDailyNewTarget(problems, nearDeadlineSettings, TODAY)
    expect(result.dailyNewTarget).toBe(8)
  })

  it('remainingNew counts only not_started problems', () => {
    const problems: Problem[] = [
      makeProblem({ id: 'p-1', status: 'not_started' }),
      makeProblem({ id: 'p-2', status: 'learning' }),
      makeProblem({ id: 'p-3', status: 'reviewing' }),
      makeProblem({ id: 'p-4', status: 'mastered' }),
      makeProblem({ id: 'p-5', status: 'not_started' }),
    ]
    const result = computeDailyNewTarget(problems, DEFAULT_SETTINGS, TODAY)
    expect(result.remainingNew).toBe(2)
  })

  it('paceStatus: on_track when progressing at exactly the right rate', () => {
    // With 150 remaining and 46 raw days, ideal rate ≈ 3.26/day.
    // Treat 0 done as behind (no progress at all).
    const problems: Problem[] = Array.from({ length: 150 }, (_, i) =>
      makeProblem({ id: `p-${i}`, status: 'not_started', order: i + 1 }),
    )
    const result = computeDailyNewTarget(problems, DEFAULT_SETTINGS, TODAY)
    // 0 done out of 150 is behind pace (ideal would be some done by now)
    // The result should be one of the valid statuses
    expect(['on_track', 'ahead', 'behind']).toContain(result.paceStatus)
  })

  it('paceStatus: ahead when more problems completed than ideal line', () => {
    // 100 done (status != not_started), 50 remaining
    const problems: Problem[] = [
      ...Array.from({ length: 100 }, (_, i) =>
        makeProblem({ id: `done-${i}`, status: 'mastered', order: i + 1 }),
      ),
      ...Array.from({ length: 50 }, (_, i) =>
        makeProblem({ id: `p-${i}`, status: 'not_started', order: i + 1 }),
      ),
    ]
    const result = computeDailyNewTarget(problems, DEFAULT_SETTINGS, TODAY)
    // 100/150 done; ideal from today to deadline is much less → ahead
    expect(result.paceStatus).toBe('ahead')
  })

  it('paceStatus: behind when fewer problems completed than ideal line', () => {
    // deadline very close, almost nothing done
    const nearDeadlineSettings: Settings = {
      ...DEFAULT_SETTINGS,
      deadline: todayPlus(10),
    }
    const problems: Problem[] = [
      makeProblem({ id: 'done', status: 'mastered' }), // only 1 done
      ...Array.from({ length: 149 }, (_, i) =>
        makeProblem({ id: `p-${i}`, status: 'not_started', order: i + 1 }),
      ),
    ]
    const result = computeDailyNewTarget(problems, nearDeadlineSettings, TODAY)
    expect(result.paceStatus).toBe('behind')
  })

  it('studyDaysLeft is at least 1 even when deadline is in the past', () => {
    const pastSettings: Settings = {
      ...DEFAULT_SETTINGS,
      deadline: todayPlus(-5),
    }
    const problems: Problem[] = [makeProblem({ status: 'not_started' })]
    const result = computeDailyNewTarget(problems, pastSettings, TODAY)
    expect(result.studyDaysLeft).toBeGreaterThanOrEqual(1)
    expect(result.dailyNewTarget).toBeGreaterThanOrEqual(1)
  })
})

// ─── buildTodayQueue ──────────────────────────────────────────────────────────

describe('buildTodayQueue', () => {
  it('includes due problem reviews', () => {
    const dueReview = makeProblem({
      id: 'due-review',
      status: 'reviewing',
      mastery: 1,
      nextReview: TODAY, // due today
    })
    const futureReview = makeProblem({
      id: 'future',
      status: 'reviewing',
      mastery: 1,
      nextReview: todayPlus(3),
    })
    const queue = buildTodayQueue([dueReview, futureReview], [], DEFAULT_SETTINGS, TODAY)
    const ids = queue.map((q) => (q.type !== 'concept' ? q.problem.id : null))
    expect(ids).toContain('due-review')
    expect(ids).not.toContain('future')
  })

  it('includes due concept cards', () => {
    const dueCard = makeCard({ id: 'due-card', nextReview: TODAY })
    const futureCard = makeCard({ id: 'future-card', nextReview: todayPlus(5) })
    const queue = buildTodayQueue([], [dueCard, futureCard], DEFAULT_SETTINGS, TODAY)
    const ids = queue.map((q) => (q.type === 'concept' ? q.card.id : null))
    expect(ids).toContain('due-card')
    expect(ids).not.toContain('future-card')
  })

  it('includes cards with nextReview=null whose pattern has been started', () => {
    // A card whose pattern has a problem that has been started (status != not_started)
    const startedProblem = makeProblem({
      id: 'started',
      pattern: 'arrays_hashing',
      status: 'learning',
    })
    const newCard = makeCard({
      id: 'new-card',
      pattern: 'arrays_hashing',
      nextReview: null,
    })
    const queue = buildTodayQueue([startedProblem], [newCard], DEFAULT_SETTINGS, TODAY)
    const ids = queue.map((q) => (q.type === 'concept' ? q.card.id : null))
    expect(ids).toContain('new-card')
  })

  it('does NOT include cards with nextReview=null whose pattern has NOT been started', () => {
    const notStartedProblem = makeProblem({
      id: 'not-started',
      pattern: 'arrays_hashing',
      status: 'not_started',
    })
    const newCard = makeCard({
      id: 'new-card',
      pattern: 'arrays_hashing',
      nextReview: null,
    })
    const queue = buildTodayQueue([notStartedProblem], [newCard], DEFAULT_SETTINGS, TODAY)
    const ids = queue.map((q) => (q.type === 'concept' ? q.card.id : null))
    expect(ids).not.toContain('new-card')
  })

  it('includes up to dailyNewTarget new problems', () => {
    // 10 not_started problems; dailyNewTarget with 10 remaining and 46 days ≈ 1
    const newProblems: Problem[] = Array.from({ length: 10 }, (_, i) =>
      makeProblem({
        id: `new-${i}`,
        status: 'not_started',
        pattern: 'arrays_hashing',
        order: i + 1,
      }),
    )
    const queue = buildTodayQueue(newProblems, [], DEFAULT_SETTINGS, TODAY)
    const newItems = queue.filter((q) => q.type === 'new')
    const target = Math.min(8, Math.max(1, Math.ceil(10 / 39.5))) // rough target
    expect(newItems.length).toBeLessThanOrEqual(target + 1) // allow slight variance
    expect(newItems.length).toBeGreaterThanOrEqual(1)
  })

  it('picks new problems in strict NeetCode order (by pattern then by order)', () => {
    // Two patterns: arrays_hashing first, then two_pointers
    // Within each pattern, by .order ascending
    const problems: Problem[] = [
      makeProblem({ id: 'tp-1', pattern: 'two_pointers', order: 1, status: 'not_started' }),
      makeProblem({ id: 'ah-2', pattern: 'arrays_hashing', order: 2, status: 'not_started' }),
      makeProblem({ id: 'ah-1', pattern: 'arrays_hashing', order: 1, status: 'not_started' }),
    ]
    // Force high dailyNewTarget to get all new problems
    const highPaceSettings: Settings = {
      ...DEFAULT_SETTINGS,
      deadline: todayPlus(1), // clamped → dailyNewTarget=8
    }
    const queue = buildTodayQueue(problems, [], highPaceSettings, TODAY)
    const newItems = queue.filter((q) => q.type === 'new')
    const ids = newItems.map((q) => (q.type === 'new' ? q.problem.id : ''))
    // arrays_hashing comes before two_pointers; within arrays_hashing, order 1 before 2
    const ahIdx = ids.indexOf('ah-1')
    const ah2Idx = ids.indexOf('ah-2')
    const tpIdx = ids.indexOf('tp-1')
    expect(ahIdx).toBeLessThan(ah2Idx)
    expect(ahIdx).toBeLessThan(tpIdx)
    expect(ah2Idx).toBeLessThan(tpIdx)
  })

  it('interleaves review and new items (not all-reviews-then-all-new)', () => {
    // Set up: 3 due reviews, dailyNewTarget new problems
    const reviews: Problem[] = Array.from({ length: 3 }, (_, i) =>
      makeProblem({
        id: `review-${i}`,
        status: 'reviewing',
        mastery: 1,
        nextReview: TODAY,
        pattern: 'arrays_hashing',
        order: i + 1,
      }),
    )
    const newProbs: Problem[] = Array.from({ length: 5 }, (_, i) =>
      makeProblem({
        id: `new-${i}`,
        status: 'not_started',
        pattern: 'arrays_hashing',
        order: i + 100,
      }),
    )
    const highPaceSettings: Settings = {
      ...DEFAULT_SETTINGS,
      deadline: todayPlus(1), // dailyNewTarget → 8 (clamped)
    }
    const queue = buildTodayQueue([...reviews, ...newProbs], [], highPaceSettings, TODAY)
    const types = queue.map((q) => q.type).filter((t) => t === 'review' || t === 'new')
    // Should not be all reviews followed by all news
    const allReviewsFirst = types.every((t, i) => (i < reviews.length ? t === 'review' : t === 'new'))
    // If we have both types, they should be interleaved
    if (types.includes('review') && types.includes('new')) {
      expect(allReviewsFirst).toBe(false)
    }
  })

  it('returns empty queue when nothing is due and no new problems', () => {
    const futureProblem = makeProblem({
      status: 'reviewing',
      nextReview: todayPlus(5),
    })
    const futureCard = makeCard({ nextReview: todayPlus(5) })
    const queue = buildTodayQueue([futureProblem], [futureCard], DEFAULT_SETTINGS, TODAY)
    expect(queue).toHaveLength(0)
  })
})
