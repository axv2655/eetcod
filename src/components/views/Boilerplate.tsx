/**
 * Boilerplate view — §5.5
 *
 * Snippet library grouped by pattern (in PATTERN_ORDER).
 * Each snippet: title, language badge, mono code block, CopyButton.
 * Edit inline (title, language, code). Add new per pattern group. Delete with ConfirmDialog.
 * Pattern groups are collapsible.
 */
import { useState, useMemo } from 'react'
import { useStore } from '../../store'
import { PATTERN_LABELS, PATTERN_ORDER } from '../../constants'
import { cn } from '../../utils/cn'
import { CopyButton } from '../CopyButton'
import { ConfirmDialog } from '../ConfirmDialog'
import type { Snippet, Pattern } from '../../types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ─── Language badge ───────────────────────────────────────────────────────────

function LanguageBadge({ language }: { language: string }) {
  return (
    <span className={cn(
      'inline-block px-1.5 py-0.5 rounded text-xs font-mono',
      'border border-line/30 text-slate/70 bg-paper/5',
    )}>
      {language}
    </span>
  )
}

// ─── Snippet card ─────────────────────────────────────────────────────────────

interface SnippetCardProps {
  snippet: Snippet
  onUpdate: (id: string, updates: Partial<Snippet>) => void
  onDelete: (id: string) => void
}

function SnippetCard({ snippet, onUpdate, onDelete }: SnippetCardProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(snippet.title)
  const [language, setLanguage] = useState(snippet.language)
  const [code, setCode] = useState(snippet.code)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSave = () => {
    if (!title.trim() || !code.trim()) return
    onUpdate(snippet.id, {
      title: title.trim(),
      language: language.trim() || 'Python',
      code: code,
    })
    setEditing(false)
  }

  const handleCancelEdit = () => {
    setTitle(snippet.title)
    setLanguage(snippet.language)
    setCode(snippet.code)
    setEditing(false)
  }

  return (
    <>
      <div className={cn(
        'flex flex-col gap-0 rounded-lg border overflow-hidden',
        editing ? 'border-signal/30' : 'border-line/20',
      )}>
        {/* Card header */}
        <div className={cn(
          'flex items-center gap-2 px-4 py-2.5',
          'border-b',
          editing ? 'border-signal/20 bg-signal/5' : 'border-line/15 bg-paper/3',
        )}>
          {editing ? (
            /* Edit: title + language inline */
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Snippet title"
                className={cn(
                  'flex-1 min-w-0 bg-transparent text-sm font-sans text-paper',
                  'border-b border-line/30 focus:border-signal/60',
                  'py-0.5 outline-none transition-colors',
                  'placeholder:text-slate/30',
                )}
              />
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="Language"
                className={cn(
                  'w-24 bg-transparent text-xs font-mono text-slate',
                  'border border-line/30 focus:border-signal/60 rounded px-2 py-0.5',
                  'outline-none transition-colors',
                  'placeholder:text-slate/30',
                )}
              />
            </div>
          ) : (
            /* View: title + badge */
            <>
              <span className="font-sans text-sm text-paper/90 flex-1 min-w-0 truncate">
                {snippet.title}
              </span>
              <LanguageBadge language={snippet.language} />
            </>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {editing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className={cn(
                    'font-mono text-xs text-slate/60 hover:text-slate transition-colors px-1',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded',
                  )}
                >
                  cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!title.trim() || !code.trim()}
                  className={cn(
                    'font-mono text-xs text-signal hover:text-signal/80 transition-colors px-1',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                  )}
                >
                  save
                </button>
              </>
            ) : (
              <>
                <CopyButton text={snippet.code} label="Copy" />
                <button
                  onClick={() => setEditing(true)}
                  className={cn(
                    'font-mono text-xs text-slate/50 hover:text-slate transition-colors px-1',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded',
                  )}
                  title="Edit snippet"
                >
                  edit
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className={cn(
                    'font-mono text-xs text-slate/30 hover:text-hot transition-colors px-1',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded',
                  )}
                  title="Delete snippet"
                >
                  ×
                </button>
              </>
            )}
          </div>
        </div>

        {/* Code block */}
        {editing ? (
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={Math.max(6, code.split('\n').length + 1)}
            spellCheck={false}
            className={cn(
              'w-full bg-ink/60 text-xs font-mono text-paper/85',
              'px-4 py-3 resize-y outline-none',
              'focus:ring-1 focus:ring-signal/30 focus:ring-inset',
              'leading-relaxed',
            )}
          />
        ) : (
          <pre className={cn(
            'px-4 py-3 overflow-x-auto',
            'text-xs font-mono text-paper/80 leading-relaxed',
            'bg-ink/40',
          )}>
            <code>{snippet.code}</code>
          </pre>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete snippet"
        message={`Delete "${snippet.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          onDelete(snippet.id)
          setConfirmDelete(false)
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}

// ─── Add snippet form ─────────────────────────────────────────────────────────

interface AddSnippetFormProps {
  defaultPattern: Pattern
  defaultLanguage: string
  onAdd: (snippet: Omit<Snippet, 'id'>) => void
  onCancel: () => void
}

function AddSnippetForm({ defaultPattern, defaultLanguage, onAdd, onCancel }: AddSnippetFormProps) {
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState(defaultLanguage)
  const [code, setCode] = useState('')

  const canSubmit = title.trim() && code.trim()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onAdd({
      pattern: defaultPattern,
      title: title.trim(),
      language: language.trim() || 'Python',
      code,
    })
    setTitle('')
    setCode('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'flex flex-col gap-3 p-4 rounded-lg',
        'border border-signal/30 bg-signal/5',
      )}
    >
      <p className="font-mono text-xs text-signal font-medium">Add new snippet</p>

      {/* Title + Language row */}
      <div className="flex gap-3">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <label className="font-mono text-xs text-slate/60">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. BFS on a grid"
            className={cn(
              'w-full bg-ink border border-line/30 rounded px-3 py-1.5',
              'font-sans text-sm text-paper',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
              'placeholder:text-slate/30',
            )}
          />
        </div>
        <div className="flex flex-col gap-1 w-28 shrink-0">
          <label className="font-mono text-xs text-slate/60">Language</label>
          <input
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="Python"
            className={cn(
              'w-full bg-ink border border-line/30 rounded px-3 py-1.5',
              'font-mono text-sm text-paper',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
              'placeholder:text-slate/30',
            )}
          />
        </div>
      </div>

      {/* Code */}
      <div className="flex flex-col gap-1">
        <label className="font-mono text-xs text-slate/60">Code</label>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="# paste your template here"
          rows={6}
          spellCheck={false}
          className={cn(
            'w-full bg-ink border border-line/30 rounded px-3 py-2',
            'font-mono text-xs text-paper resize-y',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
            'placeholder:text-slate/30 leading-relaxed',
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
          Add snippet
        </button>
      </div>
    </form>
  )
}

// ─── Pattern group ────────────────────────────────────────────────────────────

interface PatternGroupProps {
  pattern: Pattern
  snippets: Snippet[]
  defaultLanguage: string
  expanded: boolean
  onToggle: () => void
  onUpdate: (id: string, updates: Partial<Snippet>) => void
  onDelete: (id: string) => void
  onAdd: (snippet: Snippet) => void
}

function PatternGroup({
  pattern,
  snippets,
  defaultLanguage,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
  onAdd,
}: PatternGroupProps) {
  const [showAddForm, setShowAddForm] = useState(false)

  const label = PATTERN_LABELS[pattern] ?? pattern
  const count = snippets.length

  const handleAdd = (partial: Omit<Snippet, 'id'>) => {
    onAdd({ ...partial, id: uid() })
    setShowAddForm(false)
  }

  return (
    <div className={cn(
      'border border-line/20 rounded-lg overflow-hidden',
    )}>
      {/* Header — click to expand/collapse */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3',
          'hover:bg-paper/5 transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-inset',
          expanded && 'bg-paper/5',
        )}
        aria-expanded={expanded}
        aria-label={`${label} — ${expanded ? 'collapse' : 'expand'}`}
      >
        <span className="font-sans text-sm font-medium text-paper/90 text-left flex-1 min-w-0 truncate">
          {label}
        </span>
        <span className="font-mono text-xs text-slate/50 tabular-nums shrink-0">
          {count} {count === 1 ? 'snippet' : 'snippets'}
        </span>
        <span
          className={cn(
            'font-mono text-xs text-slate/40 shrink-0 transition-transform duration-200',
            expanded && 'rotate-180',
          )}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-line/15 p-4 flex flex-col gap-4">
          {/* Snippet cards */}
          {snippets.length === 0 && !showAddForm && (
            <p className="text-xs font-sans text-slate/40 italic">
              No snippets yet for this pattern.
            </p>
          )}
          {snippets.map((sn) => (
            <SnippetCard
              key={sn.id}
              snippet={sn}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}

          {/* Add form */}
          {showAddForm ? (
            <AddSnippetForm
              defaultPattern={pattern}
              defaultLanguage={defaultLanguage}
              onAdd={(partial) => handleAdd(partial)}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className={cn(
                'self-start font-mono text-xs text-slate/50 hover:text-signal transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded px-1',
              )}
            >
              + add snippet
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Boilerplate view ─────────────────────────────────────────────────────────

export function Boilerplate() {
  const snippets = useStore((s) => s.snippets)
  const settings = useStore((s) => s.settings)
  const addSnippet = useStore((s) => s.addSnippet)
  const updateSnippet = useStore((s) => s.updateSnippet)
  const deleteSnippet = useStore((s) => s.deleteSnippet)

  const [expandedPatterns, setExpandedPatterns] = useState<Set<Pattern>>(new Set())

  // Group snippets by pattern (in PATTERN_ORDER)
  const snippetsByPattern = useMemo(() => {
    const map = new Map<Pattern, Snippet[]>()
    for (const pattern of PATTERN_ORDER) {
      const patternSnippets = snippets.filter((sn) => sn.pattern === pattern)
      map.set(pattern as Pattern, patternSnippets)
    }
    return map
  }, [snippets])

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

  const handleAdd = (snippet: Snippet) => {
    addSnippet(snippet)
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-mono text-xl font-semibold text-paper">Boilerplate</h1>
        <p className="font-sans text-xs text-slate">
          {snippets.length} snippet{snippets.length !== 1 ? 's' : ''} across {PATTERN_ORDER.length} patterns — copy the frame, then fill in the logic
        </p>
      </div>

      {/* Pattern groups */}
      <div className="flex flex-col gap-2">
        {PATTERN_ORDER.map((pattern) => {
          const p = pattern as Pattern
          const patternSnippets = snippetsByPattern.get(p) ?? []
          return (
            <PatternGroup
              key={p}
              pattern={p}
              snippets={patternSnippets}
              defaultLanguage={settings.language}
              expanded={expandedPatterns.has(p)}
              onToggle={() => handleToggle(p)}
              onUpdate={updateSnippet}
              onDelete={deleteSnippet}
              onAdd={handleAdd}
            />
          )
        })}
      </div>

      {snippets.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="font-sans text-sm text-slate text-center max-w-xs">
            No snippets yet. Expand a pattern group and add the template you always forget — BFS, binary search, union-find. Copy it when you need it, not from memory.
          </p>
        </div>
      )}
    </div>
  )
}
