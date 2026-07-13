/**
 * Patterns view — §5.3
 *
 * 18 pattern rows (in PATTERN_ORDER) as an expandable list.
 * Each row: pattern name, TemperatureBar, mastery counts.
 * Expanded: that pattern's problems with status badge, MasteryDots,
 * last attempt date, 3-line notes, inline notes editing.
 * Click problem title → jump to ProblemSession.
 *
 * Task 9 addition (§8): full problem CRUD — edit title/url/pattern/order,
 * add new problem, remove with confirm.
 */
import { useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { useStore } from '../../store'
import { PATTERN_LABELS, PATTERN_ORDER } from '../../constants'
import { cn } from '../../utils/cn'
import { TemperatureBar } from '../TemperatureBar'
import type { MasteryCounts } from '../TemperatureBar'
import { MasteryDots } from '../MasteryDots'
import { ConfirmDialog } from '../ConfirmDialog'
import type { Pattern, Problem, ProblemStatus, Solution } from '../../types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  // iso is 'yyyy-MM-dd' or a full ISO string
  const date = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const STATUS_LABELS: Record<ProblemStatus, string> = {
  not_started: 'not started',
  learning: 'learning',
  reviewing: 'reviewing',
  mastered: 'mastered',
}

const STATUS_COLORS: Record<ProblemStatus, string> = {
  not_started: 'text-slate/60 border-line/30',
  learning:    'text-cool border-cool/40',
  reviewing:   'text-mid border-mid/40',
  mastered:    'text-hot border-hot/40',
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ─── Problem edit form ────────────────────────────────────────────────────────

interface ProblemEditFormProps {
  problem: Problem
  onSave: (updates: Partial<Problem>) => void
  onCancel: () => void
}

function ProblemEditForm({ problem, onSave, onCancel }: ProblemEditFormProps) {
  const [title, setTitle] = useState(problem.title)
  const [url, setUrl] = useState(problem.url)
  const [pattern, setPattern] = useState<Pattern>(problem.pattern)
  const [order, setOrder] = useState(String(problem.order))

  const canSave = title.trim() && url.trim()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    const orderNum = parseInt(order, 10)
    onSave({
      title: title.trim(),
      url: url.trim(),
      pattern,
      order: isNaN(orderNum) ? problem.order : orderNum,
    })
  }

  const inputClass = cn(
    'w-full bg-ink border border-line/30 rounded px-3 py-1.5',
    'font-sans text-sm text-paper',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
    'placeholder:text-slate/30',
  )

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'flex flex-col gap-3 p-4 rounded-lg mt-2',
        'border border-signal/30 bg-signal/5',
      )}
    >
      <p className="font-mono text-xs text-signal font-medium">Edit problem</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="font-mono text-xs text-slate/60">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Problem title"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="font-mono text-xs text-slate/60">LeetCode URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://leetcode.com/problems/..."
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs text-slate/60">Pattern</label>
          <select
            value={pattern}
            onChange={(e) => setPattern(e.target.value as Pattern)}
            className={cn(inputClass, 'bg-ink')}
          >
            {PATTERN_ORDER.map((p) => (
              <option key={p} value={p}>{PATTERN_LABELS[p] ?? p}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs text-slate/60">Order within pattern</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            min={1}
            className={cn(inputClass, 'w-full')}
          />
        </div>
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
          disabled={!canSave}
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
    </form>
  )
}

// ─── Add problem form ─────────────────────────────────────────────────────────

interface AddProblemFormProps {
  defaultPattern: Pattern
  defaultOrder: number
  onAdd: (problem: Problem) => void
  onCancel: () => void
}

function AddProblemForm({ defaultPattern, defaultOrder, onAdd, onCancel }: AddProblemFormProps) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [pattern, setPattern] = useState<Pattern>(defaultPattern)
  const [order, setOrder] = useState(String(defaultOrder))

  const canSubmit = title.trim() && url.trim()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    const orderNum = parseInt(order, 10)
    const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    onAdd({
      id: slug + '-' + uid().slice(0, 6),
      title: title.trim(),
      url: url.trim(),
      pattern,
      order: isNaN(orderNum) ? defaultOrder : orderNum,
      status: 'not_started',
      mastery: 0,
      nextReview: null,
      attempts: [],
      notes: { trigger: '', insight: '', gap: '' },
      solution: null,
    })
    setTitle('')
    setUrl('')
  }

  const inputClass = cn(
    'w-full bg-ink border border-line/30 rounded px-3 py-1.5',
    'font-sans text-sm text-paper',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
    'placeholder:text-slate/30',
  )

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'flex flex-col gap-3 p-4 rounded-lg',
        'border border-signal/30 bg-signal/5',
      )}
    >
      <p className="font-mono text-xs text-signal font-medium">Add new problem</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="font-mono text-xs text-slate/60">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Two Sum"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="font-mono text-xs text-slate/60">LeetCode URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://leetcode.com/problems/two-sum/"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs text-slate/60">Pattern</label>
          <select
            value={pattern}
            onChange={(e) => setPattern(e.target.value as Pattern)}
            className={cn(inputClass, 'bg-ink')}
          >
            {PATTERN_ORDER.map((p) => (
              <option key={p} value={p}>{PATTERN_LABELS[p] ?? p}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs text-slate/60">Order within pattern</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            min={1}
            className={cn(inputClass, 'w-full')}
          />
        </div>
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
          Add problem
        </button>
      </div>
    </form>
  )
}

// ─── Notes editor ─────────────────────────────────────────────────────────────

interface NotesEditorProps {
  problemId: string
  notes: Problem['notes']
}

function NotesEditor({ problemId, notes }: NotesEditorProps) {
  const updateNotes = useStore((s) => s.updateNotes)
  const [trigger, setTrigger] = useState(notes.trigger)
  const [insight, setInsight] = useState(notes.insight)
  const [gap, setGap] = useState(notes.gap)

  const hasContent = trigger || insight || gap

  const handleBlur = (field: 'trigger' | 'insight' | 'gap', value: string) => {
    updateNotes(problemId, { [field]: value })
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      {/* Show all three fields always — compact single-line inputs */}
      <div className="grid gap-1.5">
        {(
          [
            { key: 'trigger' as const, label: 'Trigger', value: trigger, setter: setTrigger, placeholder: 'what signaled the pattern' },
            { key: 'insight' as const, label: 'Insight', value: insight, setter: setInsight, placeholder: 'the one non-obvious move' },
            { key: 'gap' as const, label: 'Gap', value: gap, setter: setGap, placeholder: 'what tripped me up' },
          ] as const
        ).map(({ key, label, value, setter, placeholder }) => (
          <label key={key} className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-slate/60 w-14 shrink-0 text-right">
              {label}
            </span>
            <input
              type="text"
              value={value}
              maxLength={140}
              onChange={(e) => setter(e.target.value)}
              onBlur={(e) => handleBlur(key, e.target.value)}
              placeholder={placeholder}
              className={cn(
                'flex-1 bg-transparent text-xs font-sans text-paper/80',
                'border-b border-line/20 focus:border-signal/60',
                'py-0.5 outline-none transition-colors',
                'placeholder:text-slate/30',
              )}
            />
          </label>
        ))}
      </div>

      {!hasContent && (
        <p className="text-xs font-sans text-slate/30 italic ml-16">
          No notes yet — add a trigger, insight, or gap.
        </p>
      )}
    </div>
  )
}

// ─── Solution panel ──────────────────────────────────────────────────────────

interface SolutionPanelProps {
  problemId: string
  solution: Solution | null
}

function SolutionPanel({ problemId, solution }: SolutionPanelProps) {
  const updateSolution = useStore((s) => s.updateSolution)
  const [editing, setEditing] = useState(false)
  const [code, setCode] = useState(solution?.code ?? '')
  const [timeCx, setTimeCx] = useState(solution?.timeComplexity ?? '')
  const [spaceCx, setSpaceCx] = useState(solution?.spaceComplexity ?? '')
  const [notes, setNotes] = useState(solution?.notes ?? '')

  const hasSolution = solution && (solution.code || solution.timeComplexity || solution.spaceComplexity || solution.notes)

  const handleSave = () => {
    updateSolution(problemId, {
      code,
      timeComplexity: timeCx.trim(),
      spaceComplexity: spaceCx.trim(),
      notes,
    })
    setEditing(false)
  }

  const inputClass = cn(
    'w-full bg-ink border border-line/30 rounded px-3 py-1.5',
    'font-mono text-sm text-paper',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
    'placeholder:text-slate/30',
  )

  if (editing) {
    return (
      <div className="flex flex-col gap-3 mt-3 p-3 border border-signal/20 rounded-lg bg-signal/5">
        <p className="font-mono text-xs text-signal font-medium">My solution</p>

        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs text-slate/60">Code</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your solution..."
            rows={8}
            className={cn(inputClass, 'resize-y font-mono')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs text-slate/60">Time</label>
            <input
              type="text"
              value={timeCx}
              onChange={(e) => setTimeCx(e.target.value)}
              placeholder="O(n)"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs text-slate/60">Space</label>
            <input
              type="text"
              value={spaceCx}
              onChange={(e) => setSpaceCx(e.target.value)}
              placeholder="O(1)"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs text-slate/60">Notes (markdown)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={"## Approach\n\nDescribe your approach..."}
            rows={4}
            className={cn(inputClass, 'resize-y font-sans')}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => setEditing(false)}
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
            type="button"
            onClick={handleSave}
            className={cn(
              'px-3 py-1.5 rounded text-xs font-sans font-medium',
              'bg-signal text-paper border border-signal/50',
              'hover:bg-signal/80 transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
            )}
          >
            Save
          </button>
        </div>
      </div>
    )
  }

  if (!hasSolution) {
    return (
      <div className="mt-2 ml-16">
        <button
          onClick={() => setEditing(true)}
          className="text-xs font-sans text-slate/30 hover:text-signal transition-colors italic focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded"
        >
          + add solution
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 mt-3 p-3 border border-line/15 rounded-lg bg-ink/30">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-slate/60">My solution</span>
        <button
          onClick={() => setEditing(true)}
          className={cn(
            'font-mono text-xs text-slate/40 hover:text-slate transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded px-1',
          )}
        >
          edit
        </button>
      </div>

      {/* Complexity badges */}
      {(solution!.timeComplexity || solution!.spaceComplexity) && (
        <div className="flex gap-2">
          {solution!.timeComplexity && (
            <span className="font-mono text-xs text-mid bg-mid/10 border border-mid/20 px-2 py-0.5 rounded">
              Time: {solution!.timeComplexity}
            </span>
          )}
          {solution!.spaceComplexity && (
            <span className="font-mono text-xs text-cool bg-cool/10 border border-cool/20 px-2 py-0.5 rounded">
              Space: {solution!.spaceComplexity}
            </span>
          )}
        </div>
      )}

      {/* Code block */}
      {solution!.code && (
        <pre className={cn(
          'mt-1 p-3 rounded-md overflow-x-auto',
          'bg-ink border border-line/20',
          'font-mono text-xs text-paper/80 leading-relaxed',
        )}>
          <code>{solution!.code}</code>
        </pre>
      )}

      {/* Markdown notes */}
      {solution!.notes && (
        <div className={cn(
          'mt-1 prose prose-invert prose-sm max-w-none',
          'prose-headings:font-mono prose-headings:text-paper prose-headings:text-sm prose-headings:font-semibold',
          'prose-p:text-paper/80 prose-p:text-xs prose-p:leading-relaxed',
          'prose-li:text-paper/80 prose-li:text-xs',
          'prose-code:text-signal prose-code:text-xs',
          'prose-strong:text-paper',
        )}>
          <ReactMarkdown>{solution!.notes}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}

// ─── Problem row ──────────────────────────────────────────────────────────────

interface ProblemRowProps {
  problem: Problem
  onStartSession: (problemId: string) => void
  onEditProblem: (problem: Problem) => void
  onDeleteProblem: (problemId: string) => void
}

function ProblemRow({ problem, onStartSession, onEditProblem, onDeleteProblem }: ProblemRowProps) {
  const [editingNotes, setEditingNotes] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const lastAttemptDate =
    problem.attempts.length > 0
      ? problem.attempts[problem.attempts.length - 1].date
      : null

  const hasNotes = problem.notes.trigger || problem.notes.insight || problem.notes.gap

  return (
    <>
      <div className={cn(
        'flex flex-col gap-2 py-3 px-4',
        'border-b border-line/10 last:border-b-0',
      )}>
        {/* Main row */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Problem title — click to start session */}
          <button
            onClick={() => onStartSession(problem.id)}
            className={cn(
              'font-sans text-sm text-paper/90 text-left flex-1 min-w-0',
              'hover:text-signal transition-colors truncate',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded',
            )}
            title={`Start session for ${problem.title}`}
          >
            {problem.title}
          </button>

          {/* Status badge — hidden on very narrow mobile */}
          <span className={cn(
            'hidden sm:inline text-xs font-mono px-1.5 py-0.5 rounded border shrink-0',
            STATUS_COLORS[problem.status],
          )}>
            {STATUS_LABELS[problem.status]}
          </span>

          {/* Mastery dots */}
          <MasteryDots mastery={problem.mastery} size="sm" />

          {/* Last attempt date — hidden on narrow mobile */}
          <span className="hidden sm:block font-mono text-xs text-slate/50 tabular-nums shrink-0 w-14 text-right">
            {formatDate(lastAttemptDate)}
          </span>

          {/* Edit problem */}
          <button
            onClick={() => onEditProblem(problem)}
            className={cn(
              'font-mono text-xs text-slate/40 hover:text-slate transition-colors shrink-0',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded px-1',
            )}
            title="Edit problem"
            aria-label={`Edit ${problem.title}`}
          >
            edit
          </button>

          {/* Delete problem */}
          <button
            onClick={() => setConfirmDelete(true)}
            className={cn(
              'font-mono text-xs text-slate/30 hover:text-hot transition-colors shrink-0',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded px-1',
            )}
            title="Remove problem"
            aria-label={`Remove ${problem.title}`}
          >
            ×
          </button>

          {/* Notes toggle */}
          <button
            onClick={() => setEditingNotes((v) => !v)}
            className={cn(
              'font-mono text-xs shrink-0 transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded px-1',
              editingNotes
                ? 'text-signal'
                : hasNotes
                ? 'text-slate/60 hover:text-slate'
                : 'text-line/40 hover:text-slate/40',
            )}
            title={editingNotes ? 'Hide notes' : 'Edit notes'}
            aria-expanded={editingNotes}
          >
            {editingNotes ? '▲' : '▼'}
          </button>
        </div>

        {/* Notes panel */}
        {editingNotes && (
          <>
            <NotesEditor problemId={problem.id} notes={problem.notes} />
            <SolutionPanel problemId={problem.id} solution={problem.solution} />
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Remove problem"
        message={`Remove "${problem.title}" from your list? This will delete all attempt history and notes for this problem. It cannot be undone.`}
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          onDeleteProblem(problem.id)
          setConfirmDelete(false)
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}

// ─── Pattern row ──────────────────────────────────────────────────────────────

interface PatternRowProps {
  pattern: Pattern
  problems: Problem[]
  counts: MasteryCounts
  expanded: boolean
  onToggle: () => void
  onStartSession: (problemId: string) => void
  onEditProblem: (problem: Problem) => void
  onDeleteProblem: (problemId: string) => void
  onAddProblem: (problem: Problem) => void
}

function PatternRow({
  pattern,
  problems,
  counts,
  expanded,
  onToggle,
  onStartSession,
  onEditProblem,
  onDeleteProblem,
  onAddProblem,
}: PatternRowProps) {
  const label = PATTERN_LABELS[pattern] ?? pattern
  const total = counts.not_started + counts.learning + counts.reviewing + counts.mastered
  const [showAddForm, setShowAddForm] = useState(false)

  const handleAdd = (problem: Problem) => {
    onAddProblem(problem)
    setShowAddForm(false)
  }

  return (
    <div className={cn(
      'border border-line/20 rounded-lg overflow-hidden',
    )}>
      {/* Header — click to expand */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-3 sm:gap-4 px-4 py-3',
          'hover:bg-paper/5 transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-inset',
          expanded && 'bg-paper/5',
        )}
        aria-expanded={expanded}
        aria-label={`${label} — ${expanded ? 'collapse' : 'expand'}`}
      >
        {/* Pattern name */}
        <span className="font-sans text-sm font-medium text-paper/90 text-left flex-1 min-w-0 truncate">
          {label}
        </span>

        {/* Counts — mastered / reviewing / learning / not started (hide on mobile) */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <span className="font-mono text-xs text-hot tabular-nums" title="Mastered">
            {counts.mastered}
          </span>
          <span className="font-mono text-xs text-slate/30" aria-hidden="true">/</span>
          <span className="font-mono text-xs text-mid tabular-nums" title="Reviewing">
            {counts.reviewing}
          </span>
          <span className="font-mono text-xs text-slate/30" aria-hidden="true">/</span>
          <span className="font-mono text-xs text-cool tabular-nums" title="Learning">
            {counts.learning}
          </span>
          <span className="font-mono text-xs text-slate/30" aria-hidden="true">/</span>
          <span className="font-mono text-xs text-slate/50 tabular-nums" title="Not started">
            {counts.not_started}
          </span>
        </div>

        {/* Temperature bar */}
        <div className="w-20 sm:w-28 shrink-0">
          <TemperatureBar counts={counts} showTotal={false} />
        </div>

        {/* Total count */}
        <span className="font-mono text-xs text-slate/50 tabular-nums w-5 sm:w-6 text-right shrink-0">
          {total}
        </span>

        {/* Chevron */}
        <span
          className={cn(
            'font-mono text-xs text-slate/40 shrink-0 motion-safe:transition-transform motion-safe:duration-200',
            expanded && 'rotate-180',
          )}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {/* Expanded problem list */}
      {expanded && (
        <div className="border-t border-line/15">
          {problems.length === 0 && !showAddForm ? (
            <div className="px-4 py-4 flex flex-col gap-3">
              <p className="text-xs font-sans text-slate/50">
                No problems in this pattern yet.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className={cn(
                  'self-start font-mono text-xs text-signal/70 hover:text-signal transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded px-1',
                )}
              >
                + add problem
              </button>
            </div>
          ) : (
            <>
              {problems.map((problem) => (
                <ProblemRow
                  key={problem.id}
                  problem={problem}
                  onStartSession={onStartSession}
                  onEditProblem={onEditProblem}
                  onDeleteProblem={onDeleteProblem}
                />
              ))}
              <div className="px-4 py-2 border-t border-line/10">
                {showAddForm ? (
                  <AddProblemForm
                    defaultPattern={pattern}
                    defaultOrder={problems.length + 1}
                    onAdd={handleAdd}
                    onCancel={() => setShowAddForm(false)}
                  />
                ) : (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className={cn(
                      'font-mono text-xs text-slate/40 hover:text-signal transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded px-1 py-1',
                    )}
                  >
                    + add problem
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Patterns view ────────────────────────────────────────────────────────────

export function Patterns() {
  const problems = useStore((s) => s.problems)
  const setView = useStore((s) => s.setView)
  const setSessionState = useStore((s) => s.setSessionState)
  const updateProblem = useStore((s) => s.updateProblem)
  const addProblem = useStore((s) => s.addProblem)
  const removeProblem = useStore((s) => s.removeProblem)

  const [expandedPatterns, setExpandedPatterns] = useState<Set<Pattern>>(new Set())
  // Problem being edited in the inline form
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null)

  // Group problems by pattern, sorted by order within each pattern
  const problemsByPattern = useMemo(() => {
    const map = new Map<Pattern, Problem[]>()
    for (const pattern of PATTERN_ORDER) {
      const patternProblems = problems
        .filter((p) => p.pattern === pattern)
        .sort((a, b) => a.order - b.order)
      map.set(pattern as Pattern, patternProblems)
    }
    return map
  }, [problems])

  // Compute mastery counts per pattern
  const countsByPattern = useMemo(() => {
    const map = new Map<Pattern, MasteryCounts>()
    for (const [pattern, patternProblems] of problemsByPattern) {
      const counts: MasteryCounts = {
        not_started: 0,
        learning: 0,
        reviewing: 0,
        mastered: 0,
      }
      for (const p of patternProblems) {
        counts[p.status]++
      }
      map.set(pattern, counts)
    }
    return map
  }, [problemsByPattern])

  // Overall totals
  const totals = useMemo(() => {
    return problems.reduce(
      (acc, p) => {
        acc[p.status]++
        return acc
      },
      { not_started: 0, learning: 0, reviewing: 0, mastered: 0 } as MasteryCounts,
    )
  }, [problems])

  const handleToggle = (pattern: Pattern) => {
    setExpandedPatterns((prev) => {
      const next = new Set(prev)
      if (next.has(pattern)) {
        next.delete(pattern)
      } else {
        next.add(pattern)
      }
      return next
    })
  }

  const handleStartSession = (problemId: string) => {
    setSessionState({ problemId })
    setView('problem_session')
  }

  const handleEditSave = (updates: Partial<Problem>) => {
    if (!editingProblem) return
    updateProblem(editingProblem.id, updates)
    setEditingProblem(null)
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-mono text-xl font-semibold text-paper">Patterns</h1>
        <p className="font-sans text-xs text-slate">
          {problems.length} problems across 18 patterns
        </p>
      </div>

      {/* Overall summary bar */}
      <div className="flex flex-col gap-2 p-4 border border-line/20 rounded-lg">
        <div className="flex flex-wrap items-center justify-between gap-y-1 gap-x-3">
          <span className="font-sans text-xs text-slate">Overall progress</span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs">
            <span className="text-hot tabular-nums" title="Mastered">{totals.mastered} mastered</span>
            <span className="text-mid tabular-nums" title="Reviewing">{totals.reviewing} reviewing</span>
            <span className="text-cool tabular-nums" title="Learning">{totals.learning} learning</span>
            <span className="text-slate/50 tabular-nums" title="Not started">{totals.not_started} not started</span>
          </div>
        </div>
        <TemperatureBar counts={totals} showTotal={false} className="mt-1" />
      </div>

      {/* Pattern rows */}
      <div className="flex flex-col gap-2">
        {PATTERN_ORDER.map((pattern) => {
          const p = pattern as Pattern
          const counts = countsByPattern.get(p) ?? {
            not_started: 0,
            learning: 0,
            reviewing: 0,
            mastered: 0,
          }
          return (
            <div key={p}>
              <PatternRow
                pattern={p}
                problems={problemsByPattern.get(p) ?? []}
                counts={counts}
                expanded={expandedPatterns.has(p)}
                onToggle={() => handleToggle(p)}
                onStartSession={handleStartSession}
                onEditProblem={setEditingProblem}
                onDeleteProblem={removeProblem}
                onAddProblem={addProblem}
              />
              {/* Inline edit form — shown below the pattern row being edited */}
              {editingProblem && editingProblem.pattern === p && (
                <div className="mt-1 px-2">
                  <ProblemEditForm
                    problem={editingProblem}
                    onSave={handleEditSave}
                    onCancel={() => setEditingProblem(null)}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
