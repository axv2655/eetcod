/**
 * ConfirmDialog — modal overlay with confirm/cancel buttons.
 * Focus is trapped to the dialog while open; Escape cancels.
 */
import { useEffect, useRef } from 'react'
import { cn } from '../utils/cn'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  /** When true, the confirm button uses a destructive/warning style */
  destructive?: boolean
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
}: ConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Focus the confirm button when dialog opens
  useEffect(() => {
    if (open && confirmBtnRef.current) {
      confirmBtnRef.current.focus()
    }
  }, [open])

  // Escape key to cancel
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
      // Basic focus trap: Tab cycles within the dialog
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last?.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first?.focus()
          }
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        ref={dialogRef}
        className={cn(
          'relative z-10 w-full max-w-md',
          'bg-ink border border-line/30 rounded-lg shadow-2xl',
          'p-6 flex flex-col gap-4',
        )}
      >
        <h2
          id="confirm-dialog-title"
          className="font-sans font-semibold text-lg text-paper"
        >
          {title}
        </h2>
        <p
          id="confirm-dialog-message"
          className="font-sans text-sm text-slate leading-relaxed"
        >
          {message}
        </p>

        <div className="flex gap-3 justify-end mt-2">
          <button
            onClick={onCancel}
            className={cn(
              'px-4 py-2 rounded text-sm font-sans',
              'border border-line/30 text-slate',
              'hover:text-paper hover:border-line/60 transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
            )}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            className={cn(
              'px-4 py-2 rounded text-sm font-sans font-medium',
              'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
              destructive
                ? 'bg-hot/80 text-paper hover:bg-hot border border-hot/50'
                : 'bg-signal text-paper hover:bg-signal/80 border border-signal/50',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
