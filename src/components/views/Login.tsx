/**
 * Login screen — §11 of design spec.
 *
 * Shown when there is no valid Supabase session.
 * Offers:
 *   1. Email + password (primary)
 *   2. "Email me a magic link" option
 *   3. "Continue with GitHub" OAuth button
 */
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { cn } from '../../utils/cn'

type Mode = 'password' | 'magic_link'

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

export function Login() {
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  // Capture non-null client — App.tsx only renders Login when Supabase is configured.
  const client = supabase
  if (!client) return null

  const clearError = () => setError(null)

  // ── Email + password sign in ──────────────────────────────────────────

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Enter your email and password.')
      return
    }
    setLoading(true)
    clearError()

    const { error: err } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)
    if (err) {
      setError(err.message)
    }
    // On success, App.tsx's auth listener will update state and unmount Login.
  }

  // ── Magic link ───────────────────────────────────────────────────────

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Enter your email address.')
      return
    }
    setLoading(true)
    clearError()

    const { error: err } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    })

    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setMagicLinkSent(true)
    }
  }

  // ── GitHub OAuth ─────────────────────────────────────────────────────

  const handleGitHub = async () => {
    setLoading(true)
    clearError()

    const { error: err } = await client.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      },
    })

    if (err) {
      setLoading(false)
      setError(err.message)
    }
    // On success, browser redirects to GitHub — loading stays true until redirect.
  }

  // ─── Styles ───────────────────────────────────────────────────────────

  const inputClass = cn(
    'w-full bg-ink border border-line/30 rounded px-3 py-2',
    'font-sans text-sm text-paper placeholder:text-slate/40',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
    'disabled:opacity-40',
  )

  const primaryBtnClass = cn(
    'w-full px-4 py-2 rounded text-sm font-sans font-medium',
    'bg-signal text-paper border border-signal/50',
    'hover:bg-signal/80 transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  )

  const ghostBtnClass = cn(
    'w-full px-4 py-2 rounded text-sm font-sans',
    'border border-line/30 text-slate',
    'hover:text-paper hover:border-signal/50 transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  )

  // ─── Magic link sent state ────────────────────────────────────────────

  if (magicLinkSent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ink px-4">
        <div className="flex flex-col gap-6 w-full max-w-sm">
          <div className="flex flex-col gap-1">
            <h1 className="font-mono text-xl font-semibold text-paper">Check your inbox</h1>
            <p className="font-sans text-sm text-slate">
              A sign-in link was sent to <span className="text-paper">{email}</span>.
              Open it on any device to sign in.
            </p>
          </div>
          <button
            onClick={() => {
              setMagicLinkSent(false)
              setMode('password')
            }}
            className={ghostBtnClass}
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  // ─── Main login form ──────────────────────────────────────────────────

  return (
    <div className="flex items-center justify-center min-h-screen bg-ink px-4">
      <div className="flex flex-col gap-6 w-full max-w-sm">
        {/* Wordmark */}
        <div className="flex flex-col gap-0.5">
          <h1 className="font-mono text-xl font-semibold text-paper tracking-tight">
            warmup
          </h1>
          <p className="font-sans text-xs text-slate">
            Sign in to sync your progress across devices.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex border border-line/20 rounded overflow-hidden">
          <button
            onClick={() => { setMode('password'); clearError() }}
            className={cn(
              'flex-1 px-3 py-1.5 text-xs font-sans transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal',
              mode === 'password'
                ? 'bg-signal/20 text-paper'
                : 'text-slate hover:text-paper',
            )}
          >
            Password
          </button>
          <button
            onClick={() => { setMode('magic_link'); clearError() }}
            className={cn(
              'flex-1 px-3 py-1.5 text-xs font-sans transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal',
              mode === 'magic_link'
                ? 'bg-signal/20 text-paper'
                : 'text-slate hover:text-paper',
            )}
          >
            Magic link
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={mode === 'password' ? handlePasswordSignIn : handleMagicLink}
          className="flex flex-col gap-3"
          noValidate
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="login-email" className="font-sans text-xs text-slate">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError() }}
              placeholder="you@example.com"
              disabled={loading}
              className={inputClass}
            />
          </div>

          {mode === 'password' && (
            <div className="flex flex-col gap-1">
              <label htmlFor="login-password" className="font-sans text-xs text-slate">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError() }}
                placeholder="••••••••"
                disabled={loading}
                className={inputClass}
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <p
              role="alert"
              className="font-sans text-xs text-hot bg-hot/10 border border-hot/20 rounded px-3 py-2"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={primaryBtnClass}
          >
            {loading
              ? 'Signing in…'
              : mode === 'password'
                ? 'Sign in'
                : 'Send magic link'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-line/20" />
          <span className="font-sans text-xs text-slate/40">or</span>
          <div className="flex-1 border-t border-line/20" />
        </div>

        {/* GitHub OAuth */}
        <button
          onClick={handleGitHub}
          disabled={loading}
          className={cn(ghostBtnClass, 'flex items-center justify-center gap-2')}
        >
          <GitHubIcon />
          Continue with GitHub
        </button>
      </div>
    </div>
  )
}
