/**
 * ProblemSession — the enforced method step machine (§5.2).
 *
 * Step machine:
 *   attempt → hint → (confirm solution) → reimpl_gate? → log → notes → done
 *
 * Gates enforced by the component state; no step can be skipped.
 *
 * Task 8 additions:
 *   - isTransferTest: hides pattern throughout, uses Transfer Test AI prompt
 *   - AI prompt copy cards at appropriate steps (hint, log, notes)
 */
import { useState, useRef, useCallback } from 'react'
import { useStore } from '../../store'
import { PATTERN_LABELS, PROMPT_HINT, PROMPT_SANITY_CHECK, PROMPT_CODE_REVIEW, PROMPT_TRANSFER_TEST } from '../../constants'
import { cn } from '../../utils/cn'
import { Timer } from '../Timer'
import { CopyButton } from '../CopyButton'
import { ConfirmDialog } from '../ConfirmDialog'
import type { AttemptResult } from '../../types'

// ─── Step types ───────────────────────────────────────────────────────────────

type Step = 'attempt' | 'hint' | 'reimpl_gate' | 'log' | 'notes'

// ─── Main component ───────────────────────────────────────────────────────────

interface ProblemSessionProps {
  problemId: string
  onComplete: () => void  // return to Today queue
  /** When true the pattern is never revealed — used for transfer tests. */
  isTransferTest?: boolean
}

export function ProblemSession({ problemId, onComplete, isTransferTest = false }: ProblemSessionProps) {
  const problems = useStore((s) => s.problems)
  const settings = useStore((s) => s.settings)
  const addAttempt = useStore((s) => s.addAttempt)
  const updateNotes = useStore((s) => s.updateNotes)

  const problem = problems.find((p) => p.id === problemId)

  // ── Step machine state ──────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('attempt')
  const [solutionRevealed, setSolutionRevealed] = useState(false)
  const [reimplChecked, setReimplChecked] = useState(false)
  const [logResult, setLogResult] = useState<AttemptResult | null>(null)
  const [timerDone, setTimerDone] = useState(false)
  const [showSolutionConfirm, setShowSolutionConfirm] = useState(false)
  const [nudgeShown, setNudgeShown] = useState(false)

  // Elapsed seconds — updated by Timer via ref
  const elapsedRef = useRef<number>(0)

  // Notes state — pre-filled from existing notes if any
  const existingNotes = problem?.notes
  const [trigger, setTrigger] = useState(existingNotes?.trigger ?? '')
  const [insight, setInsight] = useState(existingNotes?.insight ?? '')
  const [gap, setGap] = useState(existingNotes?.gap ?? '')

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleTimerComplete = useCallback(() => {
    setTimerDone(true)
    setStep('hint')
  }, [])

  const handleStuck = useCallback(() => {
    setTimerDone(true)
    setStep('hint')
  }, [])

  const handleRevealSolution = () => {
    setShowSolutionConfirm(true)
  }

  const handleConfirmReveal = () => {
    setShowSolutionConfirm(false)
    setSolutionRevealed(true)
    setStep('reimpl_gate')
  }

  const handleLog = (result: AttemptResult) => {
    setLogResult(result)
    setStep('notes')
  }

  const handleSave = () => {
    if (!problem) return

    const allBlank = !trigger.trim() && !insight.trim() && !gap.trim()
    if (allBlank && !nudgeShown) {
      setNudgeShown(true)
      return // Show nudge; user must click Save again
    }

    const today = new Date().toISOString()

    addAttempt(problemId, {
      date: today,
      result: logResult ?? 'hint',
      timeSpentSec: elapsedRef.current,
      reimplemented: reimplChecked,
    })

    if (trigger.trim() || insight.trim() || gap.trim()) {
      updateNotes(problemId, {
        trigger: trigger.trim(),
        insight: insight.trim(),
        gap: gap.trim(),
      })
    }

    onComplete()
  }

  if (!problem) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="font-sans text-slate">Problem not found.</p>
        <button
          onClick={onComplete}
          className="text-sm font-sans text-signal hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded"
        >
          Back to today
        </button>
      </div>
    )
  }

  // Build the hint prompt with problem title filled in
  const hintPrompt = `Problem: "${problem.title}"\n\n${PROMPT_HINT}`
  // Transfer test prompt with problem title filled in
  const transferTestPrompt = PROMPT_TRANSFER_TEST.replace('[___]', problem.title)

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      {/* Top bar — problem title + back */}
      <div className="flex items-center justify-between shrink-0 mb-6 sm:mb-8">
        <button
          onClick={onComplete}
          className={cn(
            'flex items-center gap-1.5 text-xs font-mono text-slate',
            'hover:text-paper transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded',
          )}
          aria-label="Back to today queue"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 2 4 7 9 12" />
          </svg>
          Today
        </button>

        <div className="flex items-center gap-3">
          {/* Transfer test badge */}
          {isTransferTest && (
            <span className="text-xs font-mono text-warm bg-warm/10 border border-warm/30 px-2 py-0.5 rounded">
              transfer test
            </span>
          )}
          {/* Step indicator */}
          <StepIndicator step={step} />
        </div>
      </div>

      {/* Transfer test context banner */}
      {isTransferTest && (
        <div className={cn(
          'shrink-0 mb-6 px-4 py-3 rounded-lg',
          'border border-warm/20 bg-warm/5',
        )}>
          <p className="text-sm font-sans text-warm/90 leading-relaxed">
            Same family. Does it still click without the label?
          </p>
        </div>
      )}

      {/* Main step content */}
      <div className="flex-1 flex flex-col justify-center">
        {step === 'attempt' && (
          <AttemptStep
            problem={problem}
            timerSec={settings.timerSec}
            elapsedRef={elapsedRef}
            timerDone={timerDone}
            onTimerComplete={handleTimerComplete}
            onStuck={handleStuck}
            isTransferTest={isTransferTest}
          />
        )}

        {step === 'hint' && (
          <HintStep
            problem={problem}
            hintPrompt={hintPrompt}
            isTransferTest={isTransferTest}
            onRevealSolution={handleRevealSolution}
            onProceedToLog={() => setStep('log')}
          />
        )}

        {step === 'reimpl_gate' && (
          <ReimplGate
            checked={reimplChecked}
            onChange={setReimplChecked}
            onContinue={() => setStep('log')}
          />
        )}

        {step === 'log' && (
          <LogStep
            solutionRevealed={solutionRevealed}
            isTransferTest={isTransferTest}
            transferTestPrompt={transferTestPrompt}
            onLog={handleLog}
          />
        )}

        {step === 'notes' && (
          <NotesStep
            trigger={trigger}
            insight={insight}
            gap={gap}
            onTrigger={setTrigger}
            onInsight={setInsight}
            onGap={setGap}
            nudge={nudgeShown}
            problemTitle={problem.title}
            onSave={handleSave}
          />
        )}
      </div>

      {/* Solution reveal confirm dialog */}
      <ConfirmDialog
        open={showSolutionConfirm}
        title="Read the solution?"
        message="Reading the solution resets this problem's mastery back to 0 — that's fine, learning takes what it takes. But try the hint first if you haven't."
        confirmLabel="Yes, show solution"
        cancelLabel="Use hint instead"
        destructive={false}
        onConfirm={handleConfirmReveal}
        onCancel={() => setShowSolutionConfirm(false)}
      />
    </div>
  )
}

// ─── AI Prompt Card ───────────────────────────────────────────────────────────
// A subtle, collapsible card showing a copyable AI prompt template (§6).

interface AiPromptCardProps {
  label: string
  description: string
  promptText: string
}

function AiPromptCard({ label, description, promptText }: AiPromptCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={cn(
      'border border-line/20 rounded-lg overflow-hidden',
      'bg-ink/30',
    )}>
      {/* Header — always visible, click to expand */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-4 py-3',
          'text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-signal',
          'hover:bg-signal/5 transition-colors',
        )}
        aria-expanded={expanded}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs font-mono text-slate/70 uppercase tracking-widest">AI prompt</span>
          <span className="text-sm font-sans text-paper/80 font-medium">{label}</span>
          {!expanded && (
            <span className="text-xs font-sans text-slate/50 truncate">{description}</span>
          )}
        </div>
        {/* Chevron */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn('shrink-0 text-slate/40 transition-transform', expanded && 'rotate-180')}
          aria-hidden="true"
        >
          <polyline points="2 5 7 10 12 5" />
        </svg>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-line/10">
          <p className="text-xs font-sans text-slate/60 pt-3">{description}</p>
          <div className={cn(
            'border border-line/15 rounded-md p-3',
            'bg-ink/60',
          )}>
            <p className="font-mono text-xs text-slate/70 leading-relaxed whitespace-pre-wrap break-words">
              {promptText}
            </p>
          </div>
          <div className="flex justify-end">
            <CopyButton text={promptText} label="Copy prompt" />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Step: Attempt ────────────────────────────────────────────────────────────

interface AttemptStepProps {
  problem: { title: string; url: string; pattern: string }
  timerSec: number
  elapsedRef: React.MutableRefObject<number>
  timerDone: boolean
  onTimerComplete: () => void
  onStuck: () => void
  isTransferTest: boolean
}

function AttemptStep({ problem, timerSec, elapsedRef, timerDone, onTimerComplete, onStuck, isTransferTest }: AttemptStepProps) {
  return (
    <div className="flex flex-col gap-6 sm:gap-8 items-center text-center">
      {/* Problem title — no pattern shown */}
      <div className="flex flex-col gap-2">
        <h1 className="font-sans text-xl sm:text-2xl font-semibold text-paper">
          {problem.title}
        </h1>
        <a
          href={problem.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'text-sm font-mono text-signal hover:underline',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded',
          )}
        >
          Open on LeetCode ↗
        </a>
      </div>

      {/* Instruction */}
      <p className="text-sm font-sans text-slate max-w-md leading-relaxed px-2">
        {isTransferTest
          ? 'No pattern label this time — see if the right approach surfaces on its own. Hit "I\'m stuck" when you want a hint.'
          : 'Solve it in your editor or on LeetCode. The timer runs while you work. Hit "I\'m stuck" when you want a hint.'}
      </p>

      {/* Timer */}
      {!timerDone ? (
        <div className="w-full max-w-xs">
          <Timer
            durationSec={timerSec}
            onComplete={onTimerComplete}
            onStuck={onStuck}
            elapsedRef={elapsedRef}
          />
        </div>
      ) : (
        <p className="font-mono text-sm text-slate">Timer ended. Moving to hint step.</p>
      )}
    </div>
  )
}

// ─── Step: Hint ───────────────────────────────────────────────────────────────

interface HintStepProps {
  problem: { title: string; pattern: string }
  hintPrompt: string
  isTransferTest: boolean
  onRevealSolution: () => void
  onProceedToLog: () => void
}

function HintStep({ problem, hintPrompt, isTransferTest, onRevealSolution, onProceedToLog }: HintStepProps) {
  return (
    <div className="flex flex-col gap-8">
      {/* Pattern hint — hidden in transfer test mode */}
      {!isTransferTest && (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-mono text-slate uppercase tracking-widest">Pattern hint</span>
          <div className={cn(
            'border border-signal/30 rounded-lg p-5',
            'bg-signal/5',
          )}>
            <p className="font-sans text-lg font-medium text-paper">
              {PATTERN_LABELS[problem.pattern] ?? problem.pattern}
            </p>
            <p className="text-sm font-sans text-slate mt-1">
              This problem uses the {PATTERN_LABELS[problem.pattern] ?? problem.pattern} pattern.
              Try again with this in mind.
            </p>
          </div>
        </div>
      )}

      {/* In transfer test mode, just give a nudge without revealing the pattern */}
      {isTransferTest && (
        <div className={cn(
          'border border-warm/20 rounded-lg p-5',
          'bg-warm/5',
        )}>
          <p className="font-sans text-base font-medium text-paper">Need a nudge?</p>
          <p className="text-sm font-sans text-slate mt-1">
            Think about the data constraints. What makes this problem tractable — and what pattern does that suggest?
          </p>
        </div>
      )}

      {/* AI hint prompt card */}
      <AiPromptCard
        label="Get a hint from AI"
        description="Paste into your assistant — asks for pattern + one key question, not the answer"
        promptText={hintPrompt}
      />

      {/* Sanity-check prompt card — shown after the hint step as the user tries again */}
      <AiPromptCard
        label="Sanity-check my approach"
        description="When you have an idea — ask AI to poke holes before you code it"
        promptText={PROMPT_SANITY_CHECK}
      />

      {/* Encouragement */}
      <p className="text-sm font-sans text-slate italic text-center">
        {isTransferTest
          ? 'Pattern recognition, not memorization — this is the real test.'
          : 'Try again with the pattern in mind — partial recognition counts.'}
      </p>

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onProceedToLog}
          className={cn(
            'w-full py-3 rounded-lg text-sm font-sans font-medium',
            'bg-signal text-paper border border-signal/50',
            'hover:bg-signal/80 transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
          )}
        >
          I'm done — log result
        </button>
        <button
          onClick={onRevealSolution}
          className={cn(
            'w-full py-3 rounded-lg text-sm font-sans',
            'border border-line/30 text-slate',
            'hover:text-paper hover:border-warm/50 hover:bg-warm/5 transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
          )}
        >
          Reveal solution
        </button>
      </div>
    </div>
  )
}

// ─── Step: Re-implement gate ──────────────────────────────────────────────────

interface ReimplGateProps {
  checked: boolean
  onChange: (v: boolean) => void
  onContinue: () => void
}

function ReimplGate({ checked, onChange, onContinue }: ReimplGateProps) {
  return (
    <div className="flex flex-col gap-8 items-center text-center">
      <div className="flex flex-col gap-2">
        <h2 className="font-sans text-xl font-semibold text-paper">Close the solution and re-code it</h2>
        <p className="text-sm font-sans text-slate max-w-sm leading-relaxed">
          Reading isn't learning. This one step — re-implementing from scratch with the solution closed — is what builds the pattern. It turns reading into recognition.
        </p>
      </div>

      {/* Checkbox */}
      <label
        className={cn(
          'flex items-start gap-3 cursor-pointer rounded-lg p-4 max-w-sm w-full',
          'border transition-colors',
          checked ? 'border-signal/50 bg-signal/10' : 'border-line/30 hover:border-line/60',
        )}
      >
        <div className="shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only"
          />
          <div className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
            checked ? 'bg-signal border-signal' : 'border-line/60',
          )}>
            {checked && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="2 6 5 9 10 3" />
              </svg>
            )}
          </div>
        </div>
        <span className="text-sm font-sans text-paper text-left">
          I closed the solution and re-coded it from scratch
        </span>
      </label>

      <button
        onClick={onContinue}
        disabled={!checked}
        className={cn(
          'w-full max-w-sm py-3 rounded-lg text-sm font-sans font-medium',
          'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
          checked
            ? 'bg-signal text-paper border border-signal/50 hover:bg-signal/80'
            : 'bg-line/10 text-slate border border-line/20 cursor-not-allowed',
        )}
      >
        Continue to log
      </button>
    </div>
  )
}

// ─── Step: Log result ─────────────────────────────────────────────────────────

interface LogStepProps {
  solutionRevealed: boolean
  isTransferTest: boolean
  transferTestPrompt: string
  onLog: (result: AttemptResult) => void
}

function LogStep({ solutionRevealed, isTransferTest, transferTestPrompt, onLog }: LogStepProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="font-sans text-xl font-semibold text-paper text-center">How did it go?</h2>
        <p className="text-sm font-sans text-slate text-center">
          Be honest — the point is accurate scheduling, not self-judgment.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {/* Cold — disabled if solution was revealed */}
        <ResultButton
          label="Cold"
          description={isTransferTest ? 'Pattern clicked without any hint' : 'Solved without hints or solutions'}
          disabled={solutionRevealed}
          disabledReason={solutionRevealed ? 'Not available — solution was revealed' : undefined}
          colorClass="text-mid border-mid/40 hover:bg-mid/15"
          onClick={() => onLog('cold')}
        />

        {/* Hint */}
        <ResultButton
          label="Hint"
          description={isTransferTest ? 'Needed a nudge before it clicked' : 'Needed the pattern name or a nudge'}
          colorClass="text-warm border-warm/40 hover:bg-warm/15"
          onClick={() => onLog('hint')}
        />

        {/* Solution */}
        <ResultButton
          label="Solution"
          description={isTransferTest ? 'Needed to read the full solution' : 'Read the solution or re-implemented it'}
          colorClass="text-cool border-cool/40 hover:bg-cool/15"
          onClick={() => onLog('solution')}
        />
      </div>

      {/* Transfer test AI prompt card — available during the log step */}
      {isTransferTest && (
        <AiPromptCard
          label="Generate another transfer test"
          description="Ask AI for a fresh unlabeled problem in the same family"
          promptText={transferTestPrompt}
        />
      )}
    </div>
  )
}

interface ResultButtonProps {
  label: string
  description: string
  disabled?: boolean
  disabledReason?: string
  colorClass: string
  onClick: () => void
}

function ResultButton({ label, description, disabled, disabledReason, colorClass, onClick }: ResultButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabledReason}
      aria-describedby={disabled ? 'disabled-reason' : undefined}
      className={cn(
        'w-full text-left px-5 py-4 rounded-lg border',
        'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
        disabled
          ? 'opacity-40 cursor-not-allowed border-line/20 text-slate'
          : cn('cursor-pointer', colorClass),
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="font-sans font-semibold text-base">{label}</span>
        <span className="text-xs font-sans text-slate">
          {disabled && disabledReason ? disabledReason : description}
        </span>
      </div>
    </button>
  )
}

// ─── Step: Notes ──────────────────────────────────────────────────────────────

interface NotesStepProps {
  trigger: string
  insight: string
  gap: string
  onTrigger: (v: string) => void
  onInsight: (v: string) => void
  onGap: (v: string) => void
  nudge: boolean
  problemTitle: string
  onSave: () => void
}

function NotesStep({ trigger, insight, gap, onTrigger, onInsight, onGap, nudge, problemTitle, onSave }: NotesStepProps) {
  // Code review prompt with problem title context
  const codeReviewPrompt = `Problem: "${problemTitle}"\n\n${PROMPT_CODE_REVIEW}`

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="font-sans text-xl font-semibold text-paper">Lock it in</h2>
        <p className="text-sm font-sans text-slate">
          Three lines. The whole point: next time you see a problem like this, what should click?
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <NoteField
          label="Trigger"
          placeholder="What in the problem hinted at this pattern? e.g. sorted array + find pair"
          value={trigger}
          onChange={onTrigger}
        />
        <NoteField
          label="Insight"
          placeholder="The one non-obvious move. e.g. use two pointers instead of nested loops"
          value={insight}
          onChange={onInsight}
        />
        <NoteField
          label="My gap"
          placeholder="The exact thing that tripped you up. e.g. off-by-one in binary search"
          value={gap}
          onChange={onGap}
        />
      </div>

      {/* Code review AI prompt — shown after solving, before saving notes */}
      <AiPromptCard
        label="Code review"
        description="Paste your working solution — get complexity analysis and a clean-up if needed"
        promptText={codeReviewPrompt}
      />

      {/* Nudge message */}
      {nudge && (
        <div className={cn(
          'border border-warm/30 rounded-lg px-4 py-3',
          'bg-warm/5',
        )}>
          <p className="text-sm font-sans text-warm">
            These notes are the whole point — even a few words will help future-you. Hit save again to skip anyway.
          </p>
        </div>
      )}

      <button
        onClick={onSave}
        className={cn(
          'w-full py-3 rounded-lg text-sm font-sans font-medium',
          'bg-signal text-paper border border-signal/50',
          'hover:bg-signal/80 transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
        )}
      >
        Save and return to queue
      </button>
    </div>
  )
}

interface NoteFieldProps {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}

function NoteField({ label, placeholder, value, onChange }: NoteFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-mono text-slate uppercase tracking-widest">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={140}
        className={cn(
          'w-full px-3 py-2.5 rounded-lg',
          'bg-ink/50 border border-line/30',
          'font-sans text-sm text-paper placeholder:text-slate/40',
          'focus:outline-none focus-visible:border-signal focus-visible:ring-1 focus-visible:ring-signal',
          'transition-colors',
        )}
      />
      <span className="text-xs font-mono text-slate/40 text-right">
        {value.length}/140
      </span>
    </div>
  )
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS: Step[] = ['attempt', 'hint', 'reimpl_gate', 'log', 'notes']
const STEP_LABELS: Record<Step, string> = {
  attempt: 'Attempt',
  hint: 'Hint',
  reimpl_gate: 'Re-implement',
  log: 'Log',
  notes: 'Notes',
}

function StepIndicator({ step }: { step: Step }) {
  const currentIdx = STEPS.indexOf(step)

  return (
    <div className="flex items-center gap-1.5" aria-label={`Step: ${STEP_LABELS[step]}`}>
      {STEPS.map((s, idx) => {
        const done = idx < currentIdx
        const active = idx === currentIdx
        return (
          <div key={s} className="flex items-center gap-1.5">
            <div
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-colors',
                done ? 'bg-signal' : active ? 'bg-paper' : 'bg-line/30',
              )}
              aria-hidden="true"
              title={STEP_LABELS[s]}
            />
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-4 h-px transition-colors',
                  done ? 'bg-signal/50' : 'bg-line/20',
                )}
                aria-hidden="true"
              />
            )}
          </div>
        )
      })}
      <span className="ml-2 text-xs font-mono text-slate">{STEP_LABELS[step]}</span>
    </div>
  )
}
