/**
 * Export/Import utilities — spec §2
 *
 * exportState: serializes persisted store fields → downloads a timestamped JSON file.
 * importState: reads a JSON file, validates shape, then replaces store data after a confirm.
 */

import type { Problem, ConceptCard, Snippet, Settings } from '../types'
import type { StoreState } from '../store'

// ─── Export payload type ──────────────────────────────────────────────────────

export interface ExportPayload {
  version: 1
  exportedAt: string // ISO timestamp
  problems: Problem[]
  cards: ConceptCard[]
  snippets: Snippet[]
  settings: Settings
  updatedAt: string
}

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Serializes persisted state and triggers a browser download.
 * Filename: warmup-backup-YYYY-MM-DDTHH-MM-SS.json
 */
export function exportState(store: StoreState): void {
  const now = new Date()
  const timestamp = now
    .toISOString()
    .replace(/:/g, '-')   // colons not allowed in filenames on Windows
    .replace(/\.\d+Z$/, '') // strip milliseconds

  const payload: ExportPayload = {
    version: 1,
    exportedAt: now.toISOString(),
    problems: store.problems,
    cards: store.cards,
    snippets: store.snippets,
    settings: store.settings,
    updatedAt: store.updatedAt,
  }

  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `warmup-backup-${timestamp}.json`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_PATTERNS = new Set([
  'arrays_hashing', 'two_pointers', 'sliding_window', 'stack',
  'binary_search', 'linked_list', 'trees', 'tries',
  'heap_priority_queue', 'backtracking', 'graphs', 'advanced_graphs',
  'dp_1d', 'dp_2d', 'greedy', 'intervals',
  'math_geometry', 'bit_manipulation',
])

function isString(v: unknown): v is string {
  return typeof v === 'string'
}

function isNumber(v: unknown): v is number {
  return typeof v === 'number'
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function validateProblem(p: unknown): p is Problem {
  if (!isObject(p)) return false
  if (!isString(p.id) || !isString(p.title) || !isString(p.url)) return false
  if (!isString(p.pattern) || !VALID_PATTERNS.has(p.pattern)) return false
  if (!isNumber(p.order)) return false
  const validStatuses = ['not_started', 'learning', 'reviewing', 'mastered']
  if (!isString(p.status) || !validStatuses.includes(p.status)) return false
  if (!isNumber(p.mastery) || ![0, 1, 2, 3].includes(p.mastery as number)) return false
  if (p.nextReview !== null && !isString(p.nextReview)) return false
  if (!Array.isArray(p.attempts)) return false
  if (!isObject(p.notes)) return false
  return true
}

function validateCard(c: unknown): c is ConceptCard {
  if (!isObject(c)) return false
  if (!isString(c.id) || !isString(c.question) || !isString(c.answer)) return false
  if (!isString(c.pattern) || !VALID_PATTERNS.has(c.pattern)) return false
  if (!isNumber(c.interval)) return false
  if (c.nextReview !== null && !isString(c.nextReview)) return false
  const validRatings = ['got_it', 'shaky', 'missed', null]
  if (!validRatings.includes(c.lastRating as string | null)) return false
  return true
}

function validateSnippet(sn: unknown): sn is Snippet {
  if (!isObject(sn)) return false
  if (!isString(sn.id) || !isString(sn.title) || !isString(sn.language) || !isString(sn.code)) return false
  if (!isString(sn.pattern) || !VALID_PATTERNS.has(sn.pattern)) return false
  return true
}

function validateSettings(s: unknown): s is Settings {
  if (!isObject(s)) return false
  if (!isNumber(s.timerSec) || !isNumber(s.studyDaysPerWeek)) return false
  if (!isString(s.language) || !isString(s.deadline)) return false
  return true
}

/**
 * Validates the raw parsed JSON object from an import file.
 * Returns a typed ExportPayload or throws an Error with a human-readable message.
 */
export function validatePayload(raw: unknown): ExportPayload {
  if (!isObject(raw)) {
    throw new Error('Import file is not a valid JSON object.')
  }

  if (raw.version !== 1) {
    throw new Error(`Unknown export version: ${String(raw.version)}. Expected 1.`)
  }

  if (!Array.isArray(raw.problems)) {
    throw new Error('Import file is missing a "problems" array.')
  }
  const badProblemIdx = (raw.problems as unknown[]).findIndex((p) => !validateProblem(p))
  if (badProblemIdx !== -1) {
    throw new Error(`Problem at index ${badProblemIdx} has an invalid shape.`)
  }

  if (!Array.isArray(raw.cards)) {
    throw new Error('Import file is missing a "cards" array.')
  }
  const badCardIdx = (raw.cards as unknown[]).findIndex((c) => !validateCard(c))
  if (badCardIdx !== -1) {
    throw new Error(`Card at index ${badCardIdx} has an invalid shape.`)
  }

  if (!Array.isArray(raw.snippets)) {
    throw new Error('Import file is missing a "snippets" array.')
  }
  const badSnippetIdx = (raw.snippets as unknown[]).findIndex((sn) => !validateSnippet(sn))
  if (badSnippetIdx !== -1) {
    throw new Error(`Snippet at index ${badSnippetIdx} has an invalid shape.`)
  }

  if (!validateSettings(raw.settings)) {
    throw new Error('Import file has invalid or missing "settings".')
  }

  if (!isString(raw.updatedAt)) {
    throw new Error('Import file is missing "updatedAt".')
  }

  return raw as unknown as ExportPayload
}

// ─── Import ───────────────────────────────────────────────────────────────────

/**
 * Reads a JSON file selected by the user, validates its shape, confirms with
 * the user, then replaces the store's persisted data.
 *
 * Returns a Promise that resolves with a summary string on success or rejects
 * with an Error on failure.
 */
export async function importState(
  file: File,
  store: StoreState,
): Promise<string> {
  const text = await file.text()

  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('Could not parse the file as JSON. Make sure you selected a valid Warmup backup file.')
  }

  const payload = validatePayload(raw) // throws on invalid shape

  const confirmed = window.confirm(
    `Replace all current data with this backup?\n\n` +
    `Backup exported: ${new Date(payload.exportedAt).toLocaleString()}\n` +
    `Problems: ${payload.problems.length} | Cards: ${payload.cards.length} | Snippets: ${payload.snippets.length}\n\n` +
    `This will overwrite your current data and cannot be undone.`,
  )

  if (!confirmed) {
    throw new Error('Import cancelled.')
  }

  store.replaceAll({
    problems: payload.problems,
    cards: payload.cards,
    snippets: payload.snippets,
    settings: payload.settings,
    updatedAt: payload.updatedAt,
  })

  return `Imported ${payload.problems.length} problems, ${payload.cards.length} cards, ${payload.snippets.length} snippets.`
}
