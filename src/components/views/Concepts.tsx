/**
 * Concepts view — §5.4
 *
 * Two modes:
 *   Review (default when due cards exist): show due cards one at a time,
 *     question → Reveal → rate (Got it / Shaky / Missed) → schedule → next.
 *   Browse: cards grouped by pattern, add / edit / delete cards inline.
 *
 * Toggle between modes via a header tab strip.
 */
import { useState, useMemo } from 'react'
import { useStore } from '../../store'
import { PATTERN_LABELS, PATTERN_ORDER } from '../../constants'
import { isDue } from '../../scheduling'
import { cn } from '../../utils/cn'
import { ConfirmDialog } from '../ConfirmDialog'
import type { ConceptCard, Pattern } from '../../types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ─── Card review ──────────────────────────────────────────────────────────────

interface CardReviewProps {
  card: ConceptCard
  total: number
  remaining: number
  onRate: (rating: NonNullable<ConceptCard['lastRating']>) => void
}

function CardReview({ card, total, remaining, onRate }: CardReviewProps) {
  const [revealed, setRevealed] = useState(false)

  // Reset reveal state whenever card changes
  const [revealedCardId, setRevealedCardId] = useState<string | null>(null)
  const isCurrentRevealed = revealedCardId === card.id

  const handleReveal = () => {
    setRevealedCardId(card.id)
    setRevealed(true)
  }

  const handleRate = (rating: NonNullable<ConceptCard['lastRating']>) => {
    setRevealedCardId(null)
    setRevealed(false)
    onRate(rating)
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-slate">
          {PATTERN_LABELS[card.pattern] ?? card.pattern}
        </span>
        <span className="font-mono text-xs text-slate/50 tabular-nums">
          {total - remaining + 1} / {total}
        </span>
      </div>

      {/* Question */}
      <div className={cn(
        'border border-line/20 rounded-lg p-5',
        'bg-paper/5',
      )}>
        <p className="font-sans text-base text-paper leading-relaxed">{card.question}</p>
      </div>

      {/* Answer or reveal button */}
      {isCurrentRevealed || revealed ? (
        <div className={cn(
          'border border-signal/20 rounded-lg p-5',
          'bg-signal/5',
        )}>
          <p className="font-sans text-sm text-paper/90 leading-relaxed">{card.answer}</p>
        </div>
      ) : (
        <button
          onClick={handleReveal}
          className={cn(
            'w-full py-3 rounded-lg border border-line/30',
            'text-sm font-sans text-slate',
            'hover:text-paper hover:border-signal/50 hover:bg-signal/10',
            'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
          )}
        >
          Reveal answer
        </button>
      )}

      {/* Rating buttons — only after reveal */}
      {(isCurrentRevealed || revealed) && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-sans text-slate">How did it go?</p>
          <div className="flex gap-3">
            <button
              onClick={() => handleRate('got_it')}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-sans font-medium',
                'bg-mid/15 text-mid border border-mid/30',
                'hover:bg-mid/25 hover:border-mid/50',
                'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
              )}
            >
              Got it
            </button>
            <button
              onClick={() => handleRate('shaky')}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-sans font-medium',
                'bg-warm/15 text-warm border border-warm/30',
                'hover:bg-warm/25 hover:border-warm/50',
                'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
              )}
            >
              Shaky
            </button>
            <button
              onClick={() => handleRate('missed')}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-sans font-medium',
                'bg-cool/15 text-cool border border-cool/30',
                'hover:bg-cool/25 hover:border-cool/50',
                'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
              )}
            >
              Missed
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── All caught up ────────────────────────────────────────────────────────────

function AllCaughtUp({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 h-64">
      <div className="flex flex-col items-center gap-2">
        <span className="font-mono text-2xl text-line/20" aria-hidden="true">✓</span>
        <h2 className="font-sans text-lg font-semibold text-paper">All caught up</h2>
        <p className="font-sans text-sm text-slate text-center max-w-xs">
          No concept cards are due right now. Check back later or browse your cards.
        </p>
      </div>
      <button
        onClick={onBrowse}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-sans',
          'border border-line/30 text-slate',
          'hover:text-paper hover:border-signal/50 transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
        )}
      >
        Browse cards
      </button>
    </div>
  )
}

// ─── Review mode ─────────────────────────────────────────────────────────────

interface ReviewModeProps {
  dueCards: ConceptCard[]
  onBrowse: () => void
}

function ReviewMode({ dueCards, onBrowse }: ReviewModeProps) {
  const rateCard = useStore((s) => s.rateCard)
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())

  const remaining = dueCards.filter((c) => !doneIds.has(c.id))
  const current = remaining[0] ?? null

  const handleRate = (rating: NonNullable<ConceptCard['lastRating']>) => {
    if (!current) return
    rateCard(current.id, rating)
    setDoneIds((prev) => new Set([...prev, current.id]))
  }

  if (!current) {
    return <AllCaughtUp onBrowse={onBrowse} />
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-8">
      <CardReview
        card={current}
        total={dueCards.length}
        remaining={remaining.length}
        onRate={handleRate}
      />
    </div>
  )
}

// ─── Add card form ────────────────────────────────────────────────────────────

interface AddCardFormProps {
  onAdd: (card: Omit<ConceptCard, 'id'>) => void
  onCancel: () => void
}

function AddCardForm({ onAdd, onCancel }: AddCardFormProps) {
  const [pattern, setPattern] = useState<Pattern>('arrays_hashing')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')

  const canSubmit = question.trim() && answer.trim()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onAdd({
      pattern,
      question: question.trim(),
      answer: answer.trim(),
      interval: 0,
      nextReview: null,
      lastRating: null,
    })
    setQuestion('')
    setAnswer('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'flex flex-col gap-3 p-4 rounded-lg',
        'border border-signal/30 bg-signal/5',
      )}
    >
      <p className="font-mono text-xs text-signal font-medium">Add new card</p>

      {/* Pattern select */}
      <div className="flex flex-col gap-1">
        <label className="font-mono text-xs text-slate/60">Pattern</label>
        <select
          value={pattern}
          onChange={(e) => setPattern(e.target.value as Pattern)}
          className={cn(
            'w-full bg-ink border border-line/30 rounded px-3 py-1.5',
            'font-sans text-sm text-paper',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
          )}
        >
          {PATTERN_ORDER.map((p) => (
            <option key={p} value={p}>
              {PATTERN_LABELS[p] ?? p}
            </option>
          ))}
        </select>
      </div>

      {/* Question */}
      <div className="flex flex-col gap-1">
        <label className="font-mono text-xs text-slate/60">Question</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What signals this pattern?"
          rows={2}
          className={cn(
            'w-full bg-ink border border-line/30 rounded px-3 py-2',
            'font-sans text-sm text-paper resize-none',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
            'placeholder:text-slate/30',
          )}
        />
      </div>

      {/* Answer */}
      <div className="flex flex-col gap-1">
        <label className="font-mono text-xs text-slate/60">Answer</label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="The recognition cue or key insight"
          rows={3}
          className={cn(
            'w-full bg-ink border border-line/30 rounded px-3 py-2',
            'font-sans text-sm text-paper resize-none',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
            'placeholder:text-slate/30',
          )}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            'px-3 py-1.5 rounded text-xs font-sans',
            'border border-line/30 text-slate',
            'hover:text-paper hover:border-line/60 transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
          )}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            'px-3 py-1.5 rounded text-xs font-sans font-medium',
            'bg-signal text-paper border border-signal/50',
            'hover:bg-signal/80 transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          Add card
        </button>
      </div>
    </form>
  )
}

// ─── Single card in browse mode ───────────────────────────────────────────────

interface BrowseCardProps {
  card: ConceptCard
  onUpdate: (id: string, updates: Partial<ConceptCard>) => void
  onDelete: (id: string) => void
}

function BrowseCard({ card, onUpdate, onDelete }: BrowseCardProps) {
  const [editing, setEditing] = useState(false)
  const [question, setQuestion] = useState(card.question)
  const [answer, setAnswer] = useState(card.answer)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSave = () => {
    if (question.trim() && answer.trim()) {
      onUpdate(card.id, { question: question.trim(), answer: answer.trim() })
      setEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setQuestion(card.question)
    setAnswer(card.answer)
    setEditing(false)
  }

  const ratingColors: Record<string, string> = {
    got_it: 'text-mid',
    shaky: 'text-warm',
    missed: 'text-cool',
  }

  return (
    <>
      <div className={cn(
        'flex flex-col gap-2 p-4 rounded-lg border',
        'border-line/20 bg-paper/3',
        editing && 'border-signal/30 bg-signal/5',
      )}>
        {editing ? (
          /* Edit mode */
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs text-slate/60">Question</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={2}
                className={cn(
                  'w-full bg-ink border border-line/30 rounded px-3 py-2',
                  'font-sans text-sm text-paper resize-none',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
                )}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs text-slate/60">Answer</label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={3}
                className={cn(
                  'w-full bg-ink border border-line/30 rounded px-3 py-2',
                  'font-sans text-sm text-paper resize-none',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
                )}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelEdit}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-sans',
                  'border border-line/30 text-slate',
                  'hover:text-paper transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!question.trim() || !answer.trim()}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-sans font-medium',
                  'bg-signal text-paper border border-signal/50',
                  'hover:bg-signal/80 transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                )}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          /* View mode */
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <p className="font-sans text-sm text-paper/90 leading-relaxed flex-1">
                {card.question}
              </p>
              <div className="flex gap-1.5 shrink-0">
                {card.lastRating && (
                  <span className={cn(
                    'font-mono text-xs',
                    ratingColors[card.lastRating] ?? 'text-slate/50',
                  )}>
                    {card.lastRating === 'got_it' ? 'got it' : card.lastRating}
                  </span>
                )}
                <button
                  onClick={() => setEditing(true)}
                  className={cn(
                    'font-mono text-xs text-slate/50 hover:text-slate transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded',
                  )}
                  title="Edit card"
                >
                  edit
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className={cn(
                    'font-mono text-xs text-slate/30 hover:text-hot transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded',
                  )}
                  title="Delete card"
                >
                  ×
                </button>
              </div>
            </div>
            <p className="font-sans text-xs text-slate/70 leading-relaxed border-t border-line/15 pt-2">
              {card.answer}
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete card"
        message={`Delete this card? "${card.question.slice(0, 80)}${card.question.length > 80 ? '…' : ''}" — this cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          onDelete(card.id)
          setConfirmDelete(false)
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}

// ─── Browse mode ──────────────────────────────────────────────────────────────

function BrowseMode() {
  const cards = useStore((s) => s.cards)
  const addCard = useStore((s) => s.addCard)
  const updateCard = useStore((s) => s.updateCard)
  const removeCard = useStore((s) => s.removeCard)

  const [showAddForm, setShowAddForm] = useState(false)
  const [addForPattern, setAddForPattern] = useState<Pattern | null>(null)

  // Group cards by pattern (in PATTERN_ORDER)
  const cardsByPattern = useMemo(() => {
    const map = new Map<Pattern, ConceptCard[]>()
    for (const pattern of PATTERN_ORDER) {
      const patternCards = cards.filter((c) => c.pattern === pattern)
      if (patternCards.length > 0) {
        map.set(pattern as Pattern, patternCards)
      }
    }
    return map
  }, [cards])

  // Patterns that have no cards yet (for the "add to pattern" affordance)
  const emptyPatterns = PATTERN_ORDER.filter(
    (p) => !cardsByPattern.has(p as Pattern),
  )

  const handleAdd = (partial: Omit<ConceptCard, 'id'>) => {
    addCard({ ...partial, id: uid() })
    setShowAddForm(false)
    setAddForPattern(null)
  }

  const handleAddForPattern = (pattern: Pattern) => {
    setAddForPattern(pattern)
    setShowAddForm(true)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Add new card — global */}
      {showAddForm && !addForPattern ? (
        <AddCardForm
          onAdd={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className={cn(
              'self-start px-4 py-2 rounded-lg text-sm font-sans',
              'border border-line/30 text-slate',
              'hover:text-paper hover:border-signal/50 transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
            )}
          >
            + Add card
          </button>
        )
      )}

      {/* Cards grouped by pattern */}
      {PATTERN_ORDER.map((pattern) => {
        const p = pattern as Pattern
        const patternCards = cardsByPattern.get(p)
        if (!patternCards && emptyPatterns.includes(pattern)) return null

        return (
          <div key={p} className="flex flex-col gap-3">
            {/* Pattern header */}
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-xs text-slate uppercase tracking-widest">
                {PATTERN_LABELS[p] ?? p}
              </h3>
              <button
                onClick={() => handleAddForPattern(p)}
                className={cn(
                  'font-mono text-xs text-slate/40 hover:text-signal transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded',
                )}
                title={`Add card to ${PATTERN_LABELS[p] ?? p}`}
              >
                + add
              </button>
            </div>

            {/* Add form anchored to a specific pattern */}
            {showAddForm && addForPattern === p && (
              <AddCardForm
                onAdd={handleAdd}
                onCancel={() => {
                  setShowAddForm(false)
                  setAddForPattern(null)
                }}
              />
            )}

            {/* Card list */}
            {patternCards && patternCards.length > 0 ? (
              <div className="flex flex-col gap-2">
                {patternCards.map((card) => (
                  <BrowseCard
                    key={card.id}
                    card={card}
                    onUpdate={updateCard}
                    onDelete={removeCard}
                  />
                ))}
              </div>
            ) : (
              <p className="font-sans text-xs text-slate/30 italic ml-2">
                No cards yet.
              </p>
            )}
          </div>
        )
      })}

      {cards.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <p className="font-sans text-sm text-slate text-center">
            No concept cards yet. Add some to start your flashcard deck.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Concepts view ────────────────────────────────────────────────────────────

export function Concepts() {
  const cards = useStore((s) => s.cards)
  const problems = useStore((s) => s.problems)

  const today = todayIso()

  // Patterns that have been started (at least one problem not not_started)
  const startedPatterns = useMemo(
    () =>
      new Set(
        problems
          .filter((p) => p.status !== 'not_started')
          .map((p) => p.pattern),
      ),
    [problems],
  )

  // Due cards: nextReview <= today, or nextReview === null and pattern is started
  const dueCards = useMemo(
    () =>
      cards.filter((c) => {
        if (isDue(c.nextReview, today)) return true
        if (c.nextReview === null && startedPatterns.has(c.pattern)) return true
        return false
      }),
    [cards, today, startedPatterns],
  )

  // Mode: 'review' or 'browse'
  const defaultMode = dueCards.length > 0 ? 'review' : 'browse'
  const [mode, setMode] = useState<'review' | 'browse'>(defaultMode)

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="font-mono text-xl font-semibold text-paper">Concepts</h1>
          {dueCards.length > 0 && (
            <span className="font-mono text-xs text-cool tabular-nums">
              {dueCards.length} due
            </span>
          )}
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 border border-line/20 rounded-lg p-1 self-start">
          {(['review', 'browse'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-sans capitalize transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
                mode === m
                  ? 'bg-signal text-paper'
                  : 'text-slate hover:text-paper',
              )}
            >
              {m}
              {m === 'review' && dueCards.length > 0 && (
                <span className={cn(
                  'ml-1.5 font-mono text-xs',
                  mode === 'review' ? 'text-paper/70' : 'text-cool',
                )}>
                  {dueCards.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Mode content */}
      {mode === 'review' ? (
        <ReviewMode
          dueCards={dueCards}
          onBrowse={() => setMode('browse')}
        />
      ) : (
        <BrowseMode />
      )}
    </div>
  )
}
