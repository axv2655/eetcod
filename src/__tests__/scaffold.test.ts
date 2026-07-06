import { describe, it, expect } from 'vitest'
import { MASTERY_INTERVALS, AI_PROMPTS, PATTERN_ORDER, DEFAULT_SETTINGS } from '../constants'
import type { Pattern, AttemptResult, Mastery, ProblemStatus, View } from '../types'
import { cn } from '../utils/cn'

describe('Project scaffold — smoke tests', () => {
  it('MASTERY_INTERVALS has exactly 4 entries [1,3,7,16]', () => {
    expect(MASTERY_INTERVALS).toEqual([1, 3, 7, 16])
    expect(MASTERY_INTERVALS).toHaveLength(4)
  })

  it('AI_PROMPTS has all 4 templates', () => {
    expect(AI_PROMPTS).toHaveLength(4)
    const ids = AI_PROMPTS.map(p => p.id)
    expect(ids).toContain('hint')
    expect(ids).toContain('sanity_check')
    expect(ids).toContain('code_review')
    expect(ids).toContain('transfer_test')
  })

  it('PATTERN_ORDER has all 18 patterns', () => {
    expect(PATTERN_ORDER).toHaveLength(18)
  })

  it('DEFAULT_SETTINGS has correct values', () => {
    expect(DEFAULT_SETTINGS.timerSec).toBe(480)
    expect(DEFAULT_SETTINGS.studyDaysPerWeek).toBe(6)
    expect(DEFAULT_SETTINGS.language).toBe('Python')
    expect(DEFAULT_SETTINGS.deadline).toBe('2026-08-21')
  })

  it('cn() merges classes correctly', () => {
    expect(cn('px-2', 'py-3')).toBe('px-2 py-3')
    // tailwind-merge deduplication: later class wins on conflict
    expect(cn('px-2', 'px-4')).toBe('px-4')
    // conditional classes
    expect(cn('base', false && 'gone', 'kept')).toBe('base kept')
  })

  it('Pattern type values are valid strings', () => {
    const validPattern: Pattern = 'arrays_hashing'
    expect(typeof validPattern).toBe('string')
  })

  it('AttemptResult type values are valid strings', () => {
    const results: AttemptResult[] = ['cold', 'hint', 'solution']
    expect(results).toHaveLength(3)
  })

  it('Mastery type accepts 0–3', () => {
    const masteries: Mastery[] = [0, 1, 2, 3]
    expect(masteries).toHaveLength(4)
  })

  it('ProblemStatus type values are valid strings', () => {
    const statuses: ProblemStatus[] = ['not_started', 'learning', 'reviewing', 'mastered']
    expect(statuses).toHaveLength(4)
  })

  it('View type has all 6 views', () => {
    const views: View[] = ['today', 'patterns', 'concepts', 'boilerplate', 'progress', 'settings']
    expect(views).toHaveLength(6)
  })
})
