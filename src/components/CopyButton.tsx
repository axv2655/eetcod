/**
 * CopyButton — copies text to clipboard, shows brief "Copied" feedback.
 */
import { useState, useCallback } from 'react'
import { cn } from '../utils/cn'

interface CopyButtonProps {
  text: string
  label?: string
  className?: string
}

export function CopyButton({ text, label = 'Copy', className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Fallback for older browsers / blocked permissions
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [text])

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Copied to clipboard' : `${label} — copy to clipboard`}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded',
        'text-sm font-sans font-medium',
        'border border-line/30',
        copied
          ? 'text-mid border-mid/40 bg-mid/10'
          : 'text-slate hover:text-paper hover:border-signal/50 hover:bg-signal/10',
        'transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
        className,
      )}
    >
      {copied ? (
        <>
          {/* Checkmark icon */}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="2 6 5 9 10 3" />
          </svg>
          Copied
        </>
      ) : (
        <>
          {/* Copy icon */}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="4" width="7" height="7" rx="1" />
            <path d="M8 4V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1" />
          </svg>
          {label}
        </>
      )}
    </button>
  )
}
