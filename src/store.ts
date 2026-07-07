import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Problem,
  ConceptCard,
  Snippet,
  Settings,
  View,
  Attempt,
} from './types'
import { DEFAULT_SETTINGS } from './constants'
import { seedProblems } from './seed/problems'
import { seedCards } from './seed/cards'
import { seedSnippets } from './seed/snippets'
import { scheduleAfterAttempt, scheduleCard } from './scheduling'

// ─── Persisted state shape ────────────────────────────────────────────────────

interface PersistedState {
  problems: Problem[]
  cards: ConceptCard[]
  snippets: Snippet[]
  settings: Settings
  updatedAt: string // ISO; bumped on every data-mutating action
}

// ─── Transient state shape ────────────────────────────────────────────────────

interface TransientState {
  view: View
  // sessionState is defined fully in Task 4; kept as an open shape here
  sessionState: Record<string, unknown> | null
}

// ─── Actions ──────────────────────────────────────────────────────────────────

interface Actions {
  // Problems
  addAttempt: (problemId: string, attempt: Attempt) => void
  updateNotes: (
    problemId: string,
    notes: Partial<Problem['notes']>,
  ) => void
  updateProblem: (problemId: string, updates: Partial<Problem>) => void
  addProblem: (problem: Problem) => void
  removeProblem: (problemId: string) => void

  // Concept cards
  addCard: (card: ConceptCard) => void
  updateCard: (cardId: string, updates: Partial<ConceptCard>) => void
  removeCard: (cardId: string) => void
  rateCard: (cardId: string, rating: NonNullable<ConceptCard['lastRating']>) => void

  // Snippets
  addSnippet: (snippet: Snippet) => void
  updateSnippet: (snippetId: string, updates: Partial<Snippet>) => void
  deleteSnippet: (snippetId: string) => void

  // Settings
  updateSettings: (updates: Partial<Settings>) => void

  // Navigation
  setView: (view: View) => void

  // Session (transient — Task 4 will expand)
  setSessionState: (state: Record<string, unknown> | null) => void

  // Bulk operations
  resetAll: () => void
  replaceAll: (state: Partial<PersistedState>) => void
}

export type StoreState = PersistedState & TransientState & Actions

// ─── Helpers ─────────────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString()
}

function freshSeed(): Pick<PersistedState, 'problems' | 'cards' | 'snippets'> {
  return {
    problems: seedProblems(),
    cards: seedCards(),
    snippets: seedSnippets(),
  }
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      // ── Initial persisted state ─────────────────────────────────────────
      problems: [],
      cards: [],
      snippets: [],
      settings: { ...DEFAULT_SETTINGS },
      updatedAt: now(),

      // ── Initial transient state ─────────────────────────────────────────
      view: 'today' as View,
      sessionState: null,

      // ── Problem actions ─────────────────────────────────────────────────

      addAttempt: (problemId, attempt) =>
        set((s) => ({
          problems: s.problems.map((p) => {
            if (p.id !== problemId) return p
            const today = attempt.date.slice(0, 10) // 'yyyy-MM-dd'
            const { mastery, status, nextReview } = scheduleAfterAttempt(p, attempt.result, today)
            return {
              ...p,
              attempts: [...p.attempts, attempt],
              mastery,
              status,
              nextReview,
            }
          }),
          updatedAt: now(),
        })),

      updateNotes: (problemId, notes) =>
        set((s) => ({
          problems: s.problems.map((p) =>
            p.id === problemId
              ? { ...p, notes: { ...p.notes, ...notes } }
              : p,
          ),
          updatedAt: now(),
        })),

      updateProblem: (problemId, updates) =>
        set((s) => ({
          problems: s.problems.map((p) =>
            p.id === problemId ? { ...p, ...updates } : p,
          ),
          updatedAt: now(),
        })),

      addProblem: (problem) =>
        set((s) => ({
          problems: [...s.problems, problem],
          updatedAt: now(),
        })),

      removeProblem: (problemId) =>
        set((s) => ({
          problems: s.problems.filter((p) => p.id !== problemId),
          updatedAt: now(),
        })),

      // ── Card actions ────────────────────────────────────────────────────

      addCard: (card) =>
        set((s) => ({
          cards: [...s.cards, card],
          updatedAt: now(),
        })),

      updateCard: (cardId, updates) =>
        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === cardId ? { ...c, ...updates } : c,
          ),
          updatedAt: now(),
        })),

      removeCard: (cardId) =>
        set((s) => ({
          cards: s.cards.filter((c) => c.id !== cardId),
          updatedAt: now(),
        })),

      rateCard: (cardId, rating) =>
        set((s) => ({
          cards: s.cards.map((c) => {
            if (c.id !== cardId) return c
            const today = new Date().toISOString().slice(0, 10) // 'yyyy-MM-dd'
            const { interval, nextReview } = scheduleCard(c, rating, today)
            return {
              ...c,
              lastRating: rating,
              interval,
              nextReview,
            }
          }),
          updatedAt: now(),
        })),

      // ── Snippet actions ─────────────────────────────────────────────────

      addSnippet: (snippet) =>
        set((s) => ({
          snippets: [...s.snippets, snippet],
          updatedAt: now(),
        })),

      updateSnippet: (snippetId, updates) =>
        set((s) => ({
          snippets: s.snippets.map((sn) =>
            sn.id === snippetId ? { ...sn, ...updates } : sn,
          ),
          updatedAt: now(),
        })),

      deleteSnippet: (snippetId) =>
        set((s) => ({
          snippets: s.snippets.filter((sn) => sn.id !== snippetId),
          updatedAt: now(),
        })),

      // ── Settings actions ────────────────────────────────────────────────

      updateSettings: (updates) =>
        set((s) => ({
          settings: { ...s.settings, ...updates },
          updatedAt: now(),
        })),

      // ── Navigation ──────────────────────────────────────────────────────

      setView: (view) => set({ view }),

      // ── Session (transient) ─────────────────────────────────────────────

      setSessionState: (sessionState) => set({ sessionState }),

      // ── Bulk operations ─────────────────────────────────────────────────

      resetAll: () =>
        set({
          ...freshSeed(),
          settings: { ...DEFAULT_SETTINGS },
          updatedAt: now(),
        }),

      replaceAll: (state) =>
        set({
          ...state,
          updatedAt: now(),
        }),
    }),
    {
      name: 'warmup-store',
      storage: createJSONStorage(() => localStorage),

      // Exclude transient state from localStorage
      partialize: (state): PersistedState => ({
        problems: state.problems,
        cards: state.cards,
        snippets: state.snippets,
        settings: state.settings,
        updatedAt: state.updatedAt,
      }),

      // Seed on first load if the store is empty
      onRehydrateStorage: () => (state) => {
        if (state && state.problems.length === 0) {
          const seed = freshSeed()
          state.problems = seed.problems
          state.cards = seed.cards
          state.snippets = seed.snippets
          state.updatedAt = new Date().toISOString()
        }
      },
    },
  ),
)

// ─── Convenience selectors ────────────────────────────────────────────────────

export const selectProblems = (s: StoreState) => s.problems
export const selectCards = (s: StoreState) => s.cards
export const selectSnippets = (s: StoreState) => s.snippets
export const selectSettings = (s: StoreState) => s.settings
export const selectView = (s: StoreState) => s.view
export const selectUpdatedAt = (s: StoreState) => s.updatedAt
