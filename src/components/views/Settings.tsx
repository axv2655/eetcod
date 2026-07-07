/**
 * Settings view — §5.7
 *
 * Configuration fields (save immediately on change):
 *   - timerSec (number, default 480)
 *   - studyDaysPerWeek (1–7, default 6)
 *   - language (text, default 'Python')
 *   - deadline (date, default '2026-08-21')
 *
 * Data management:
 *   - Export: calls exportState() to download JSON backup
 *   - Import: file input → importState() with confirm (handled inside importState)
 *   - Reset all data: double ConfirmDialog before executing
 */
import { useState, useRef } from 'react'
import { useStore } from '../../store'
import { DEFAULT_SETTINGS } from '../../constants'
import { cn } from '../../utils/cn'
import { ConfirmDialog } from '../ConfirmDialog'
import { exportState } from '../../utils/exportImport'
import { importState } from '../../utils/exportImport'

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn(
      'flex flex-col gap-4 p-5 rounded-lg',
      'border border-line/20 bg-paper/3',
    )}>
      <div className="flex flex-col gap-0.5">
        <h2 className="font-mono text-sm font-semibold text-paper">{title}</h2>
        {description && (
          <p className="font-sans text-xs text-slate">{description}</p>
        )}
      </div>
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </div>
  )
}

// ─── Field wrappers ───────────────────────────────────────────────────────────

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col gap-0.5 w-44 shrink-0 pt-1">
        <span className="font-sans text-sm text-paper/80">{label}</span>
        {hint && <span className="font-sans text-xs text-slate/60">{hint}</span>}
      </div>
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}

// ─── Settings view ────────────────────────────────────────────────────────────

export function Settings() {
  const store = useStore()
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const resetAll = useStore((s) => s.resetAll)

  // Import feedback state
  const [importStatus, setImportStatus] = useState<
    { type: 'idle' } | { type: 'loading' } | { type: 'success'; message: string } | { type: 'error'; message: string }
  >({ type: 'idle' })

  // Reset: double confirm flow
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0)
  // 0 = none, 1 = first confirm open, 2 = second confirm open

  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Config handlers ──────────────────────────────────────────────────

  const handleTimerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val) && val > 0) {
      updateSettings({ timerSec: val })
    }
  }

  const handleStudyDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val) && val >= 1 && val <= 7) {
      updateSettings({ studyDaysPerWeek: val })
    }
  }

  const handleLanguageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ language: e.target.value })
  }

  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      updateSettings({ deadline: e.target.value })
    }
  }

  // ── Export handler ───────────────────────────────────────────────────

  const handleExport = () => {
    exportState(store)
  }

  // ── Import handler ───────────────────────────────────────────────────

  const handleImportClick = () => {
    setImportStatus({ type: 'idle' })
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset the input so re-selecting the same file works
    e.target.value = ''

    setImportStatus({ type: 'loading' })
    try {
      const summary = await importState(file, store)
      setImportStatus({ type: 'success', message: summary })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import failed.'
      if (msg === 'Import cancelled.') {
        setImportStatus({ type: 'idle' })
      } else {
        setImportStatus({ type: 'error', message: msg })
      }
    }
  }

  // ── Reset handlers ───────────────────────────────────────────────────

  const handleResetClick = () => setResetStep(1)

  const handleResetFirstConfirm = () => setResetStep(2)

  const handleResetSecondConfirm = () => {
    resetAll()
    setResetStep(0)
  }

  const handleResetCancel = () => setResetStep(0)

  // ── Derived display values ───────────────────────────────────────────

  const timerMinutes = Math.floor(settings.timerSec / 60)
  const timerSeconds = settings.timerSec % 60
  const timerDisplay = timerSeconds === 0
    ? `${timerMinutes} min`
    : `${timerMinutes}m ${timerSeconds}s`

  const inputClass = cn(
    'w-full bg-ink border border-line/30 rounded px-3 py-1.5',
    'font-sans text-sm text-paper',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
    'placeholder:text-slate/30',
  )

  return (
    <>
      <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="font-mono text-xl font-semibold text-paper">Settings</h1>
          <p className="font-sans text-xs text-slate">
            Changes save immediately.
          </p>
        </div>

        {/* ── Session config ── */}
        <Section
          title="Session"
          description="Controls how problem sessions are timed and paced."
        >
          <FieldRow label="Timer length" hint={`Currently ${timerDisplay}`}>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={settings.timerSec}
                onChange={handleTimerChange}
                min={30}
                max={3600}
                step={30}
                className={cn(inputClass, 'w-32')}
                aria-label="Timer length in seconds"
              />
              <span className="font-sans text-xs text-slate shrink-0">seconds</span>
            </div>
          </FieldRow>

          <FieldRow label="Study days / week" hint="Used to compute your daily target">
            <input
              type="number"
              value={settings.studyDaysPerWeek}
              onChange={handleStudyDaysChange}
              min={1}
              max={7}
              step={1}
              className={cn(inputClass, 'w-20')}
              aria-label="Study days per week (1–7)"
            />
          </FieldRow>

          <FieldRow label="Language" hint="Default for new snippets">
            <input
              type="text"
              value={settings.language}
              onChange={handleLanguageChange}
              placeholder={DEFAULT_SETTINGS.language}
              className={cn(inputClass, 'w-40')}
              aria-label="Primary language"
            />
          </FieldRow>

          <FieldRow label="Deadline" hint="Target date to finish NeetCode 150">
            <input
              type="date"
              value={settings.deadline}
              onChange={handleDeadlineChange}
              className={cn(inputClass, 'w-44')}
              aria-label="Study deadline"
            />
          </FieldRow>
        </Section>

        {/* ── Data management ── */}
        <Section
          title="Data"
          description="Export a backup or restore from a previous export. All data is stored locally in your browser."
        >
          {/* Export */}
          <FieldRow label="Export" hint="Download a JSON backup file">
            <button
              onClick={handleExport}
              className={cn(
                'px-4 py-2 rounded text-sm font-sans font-medium',
                'bg-signal text-paper border border-signal/50',
                'hover:bg-signal/80 transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
              )}
            >
              Export backup
            </button>
          </FieldRow>

          {/* Import */}
          <FieldRow label="Import" hint="Restore from a backup file">
            <div className="flex flex-col gap-2">
              <button
                onClick={handleImportClick}
                disabled={importStatus.type === 'loading'}
                className={cn(
                  'self-start px-4 py-2 rounded text-sm font-sans',
                  'border border-line/30 text-slate',
                  'hover:text-paper hover:border-signal/50 transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                )}
              >
                {importStatus.type === 'loading' ? 'Importing…' : 'Import from file'}
              </button>

              {/* Status feedback */}
              {importStatus.type === 'success' && (
                <p className="font-sans text-xs text-mid">
                  {importStatus.message}
                </p>
              )}
              {importStatus.type === 'error' && (
                <p className="font-sans text-xs text-hot">
                  {importStatus.message}
                </p>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="sr-only"
                aria-label="Select backup file to import"
                tabIndex={-1}
              />
            </div>
          </FieldRow>
        </Section>

        {/* ── Danger zone ── */}
        <Section
          title="Reset"
          description="Clear all data and restore the default seed. This cannot be undone."
        >
          <FieldRow label="Reset all data" hint="Wipes problems, cards, snippets">
            <button
              onClick={handleResetClick}
              className={cn(
                'px-4 py-2 rounded text-sm font-sans',
                'border border-hot/30 text-hot/70',
                'hover:text-hot hover:border-hot/60 hover:bg-hot/5 transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-hot',
              )}
            >
              Reset all data
            </button>
          </FieldRow>
        </Section>
      </div>

      {/* First reset confirmation */}
      <ConfirmDialog
        open={resetStep === 1}
        title="Reset all data?"
        message="This will delete all your problems, cards, snippets, and settings, then re-seed the defaults. Your progress cannot be recovered unless you exported a backup."
        confirmLabel="Yes, reset"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleResetFirstConfirm}
        onCancel={handleResetCancel}
      />

      {/* Second reset confirmation */}
      <ConfirmDialog
        open={resetStep === 2}
        title="Are you sure?"
        message="Last chance — this is permanent. All your attempt history, mastery progress, and notes will be erased."
        confirmLabel="Reset everything"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleResetSecondConfirm}
        onCancel={handleResetCancel}
      />
    </>
  )
}
