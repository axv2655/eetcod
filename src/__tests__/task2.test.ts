import { describe, it, expect, beforeEach } from 'vitest'
import { seedProblems } from '../seed/problems'
import { seedCards } from '../seed/cards'
import { seedSnippets } from '../seed/snippets'
import { PATTERN_ORDER } from '../constants'
import type { Pattern } from '../types'
import { validatePayload } from '../utils/exportImport'

// ─── Seed problems ────────────────────────────────────────────────────────────

describe('seedProblems()', () => {
  let problems: ReturnType<typeof seedProblems>

  beforeEach(() => {
    problems = seedProblems()
  })

  it('returns exactly 150 problems', () => {
    expect(problems).toHaveLength(150)
  })

  it('every problem has required fields', () => {
    for (const p of problems) {
      expect(typeof p.id).toBe('string')
      expect(p.id.length).toBeGreaterThan(0)
      expect(typeof p.title).toBe('string')
      expect(p.url).toMatch(/^https:\/\/leetcode\.com\/problems\//)
      expect(PATTERN_ORDER).toContain(p.pattern)
      expect(typeof p.order).toBe('number')
      expect(p.status).toBe('not_started')
      expect(p.mastery).toBe(0)
      expect(p.nextReview).toBeNull()
      expect(Array.isArray(p.attempts)).toBe(true)
      expect(p.attempts).toHaveLength(0)
      expect(p.notes).toEqual({ trigger: '', insight: '', gap: '' })
    }
  })

  it('url slug matches the problem id', () => {
    for (const p of problems) {
      expect(p.url).toBe(`https://leetcode.com/problems/${p.id}/`)
    }
  })

  it('no duplicate problem ids', () => {
    const ids = problems.map((p) => p.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('each pattern has the expected count', () => {
    const expected: Record<Pattern, number> = {
      arrays_hashing: 9,
      two_pointers: 5,
      sliding_window: 6,
      stack: 7,
      binary_search: 7,
      linked_list: 11,
      trees: 15,
      tries: 3,
      heap_priority_queue: 7,
      backtracking: 9,
      graphs: 13,
      advanced_graphs: 6,
      dp_1d: 12,
      dp_2d: 11,
      greedy: 8,
      intervals: 6,
      math_geometry: 8,
      bit_manipulation: 7,
    }
    for (const [pattern, count] of Object.entries(expected)) {
      const actual = problems.filter((p) => p.pattern === pattern).length
      expect(actual, `${pattern} count`).toBe(count)
    }
  })

  it('order values within each pattern are 0-indexed and contiguous', () => {
    for (const pattern of PATTERN_ORDER) {
      const group = problems
        .filter((p) => p.pattern === pattern)
        .sort((a, b) => a.order - b.order)
      group.forEach((p, i) => {
        expect(p.order, `${pattern}[${i}].order`).toBe(i)
      })
    }
  })
})

// ─── Seed cards ───────────────────────────────────────────────────────────────

describe('seedCards()', () => {
  let cards: ReturnType<typeof seedCards>

  beforeEach(() => {
    cards = seedCards()
  })

  it('returns at least 36 cards (2 per pattern × 18)', () => {
    expect(cards.length).toBeGreaterThanOrEqual(36)
  })

  it('returns at most 54 cards (3 per pattern × 18)', () => {
    expect(cards.length).toBeLessThanOrEqual(54)
  })

  it('every card has required fields', () => {
    for (const c of cards) {
      expect(typeof c.id).toBe('string')
      expect(c.id.length).toBeGreaterThan(0)
      expect(PATTERN_ORDER).toContain(c.pattern)
      expect(typeof c.question).toBe('string')
      expect(c.question.length).toBeGreaterThan(0)
      expect(typeof c.answer).toBe('string')
      expect(c.answer.length).toBeGreaterThan(0)
      expect(c.interval).toBe(0)
      expect(c.nextReview).toBeNull()
      expect(c.lastRating).toBeNull()
    }
  })

  it('no duplicate card ids', () => {
    const ids = cards.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every pattern has at least 2 cards', () => {
    for (const pattern of PATTERN_ORDER) {
      const count = cards.filter((c) => c.pattern === pattern).length
      expect(count, `${pattern} card count`).toBeGreaterThanOrEqual(2)
    }
  })
})

// ─── Seed snippets ────────────────────────────────────────────────────────────

describe('seedSnippets()', () => {
  let snippets: ReturnType<typeof seedSnippets>

  beforeEach(() => {
    snippets = seedSnippets()
  })

  it('returns at least 8 snippets', () => {
    expect(snippets.length).toBeGreaterThanOrEqual(8)
  })

  it('every snippet has required fields', () => {
    for (const sn of snippets) {
      expect(typeof sn.id).toBe('string')
      expect(sn.id.length).toBeGreaterThan(0)
      expect(PATTERN_ORDER).toContain(sn.pattern)
      expect(typeof sn.title).toBe('string')
      expect(sn.language).toBe('Python')
      expect(typeof sn.code).toBe('string')
      expect(sn.code.length).toBeGreaterThan(0)
    }
  })

  it('no duplicate snippet ids', () => {
    const ids = snippets.map((sn) => sn.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('includes BFS snippet', () => {
    const hasBfs = snippets.some(
      (sn) => sn.title.toLowerCase().includes('bfs'),
    )
    expect(hasBfs).toBe(true)
  })

  it('includes DFS snippet', () => {
    const hasDfs = snippets.some(
      (sn) => sn.title.toLowerCase().includes('dfs'),
    )
    expect(hasDfs).toBe(true)
  })

  it('includes binary search snippet', () => {
    const hasBs = snippets.some(
      (sn) => sn.title.toLowerCase().includes('binary search'),
    )
    expect(hasBs).toBe(true)
  })

  it('includes union-find snippet', () => {
    const hasUf = snippets.some(
      (sn) => sn.title.toLowerCase().includes('union'),
    )
    expect(hasUf).toBe(true)
  })

  it('includes backtracking snippet', () => {
    const hasBt = snippets.some(
      (sn) => sn.title.toLowerCase().includes('backtrack'),
    )
    expect(hasBt).toBe(true)
  })
})

// ─── Export payload validation ───────────────────────────────────────────────

describe('validatePayload()', () => {
  it('accepts a valid payload', () => {
    const problems = seedProblems()
    const cards = seedCards()
    const snippets = seedSnippets()

    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      problems,
      cards,
      snippets,
      settings: {
        timerSec: 480,
        studyDaysPerWeek: 6,
        language: 'Python',
        deadline: '2026-08-21',
      },
      updatedAt: new Date().toISOString(),
    }

    expect(() => validatePayload(payload)).not.toThrow()
    const result = validatePayload(payload)
    expect(result.version).toBe(1)
    expect(result.problems).toHaveLength(150)
  })

  it('rejects a non-object', () => {
    expect(() => validatePayload('not an object')).toThrow()
  })

  it('rejects unknown version', () => {
    expect(() =>
      validatePayload({
        version: 99,
        exportedAt: '',
        problems: [],
        cards: [],
        snippets: [],
        settings: { timerSec: 480, studyDaysPerWeek: 6, language: 'Python', deadline: '2026-08-21' },
        updatedAt: '',
      }),
    ).toThrow(/version/)
  })

  it('rejects missing problems array', () => {
    expect(() =>
      validatePayload({
        version: 1,
        exportedAt: '',
        cards: [],
        snippets: [],
        settings: { timerSec: 480, studyDaysPerWeek: 6, language: 'Python', deadline: '2026-08-21' },
        updatedAt: '',
      }),
    ).toThrow()
  })

  it('rejects a problem with bad pattern', () => {
    const p = { ...seedProblems()[0], pattern: 'not_a_pattern' }
    expect(() =>
      validatePayload({
        version: 1,
        exportedAt: '',
        problems: [p],
        cards: [],
        snippets: [],
        settings: { timerSec: 480, studyDaysPerWeek: 6, language: 'Python', deadline: '2026-08-21' },
        updatedAt: '',
      }),
    ).toThrow(/Problem at index 0/)
  })
})
