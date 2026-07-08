/**
 * Sync engine — Task 10 (§11 of design spec)
 *
 * Strategy: local-first, last-write-wins on updated_at, debounced push.
 *
 * Pull-on-load:
 *   - Fetch user's app_state row on valid session.
 *   - remote.updated_at > local updatedAt → hydrate store from remote.
 *   - local is newer → push local up.
 *   - No remote row → insert from local.
 *
 * Debounced push (~2s):
 *   - Any data change bumps updatedAt → debounce → upsert full snapshot.
 *
 * Offline grace:
 *   - If offline at load → run from localStorage immediately.
 *   - Listen for 'online' event → re-sync when connectivity returns.
 *   - Never block the app on a network call.
 *
 * // SYNC-UPGRADE-PATH
 * Currently stores the entire snapshot as one JSONB row per user (last-write-wins).
 * If concurrent offline edits on multiple devices become a problem, upgrade to
 * per-record tables (problems/cards/snippets each as rows with their own updated_at)
 * for field-level merge. All sync logic is contained in this module to make that
 * change localized.
 */

import { supabase } from './lib/supabase'
import { useStore } from './store'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RemoteRow {
  user_id: string
  state: SnapshotState
  updated_at: string
  version: number
}

/** The subset of store state we sync — excludes transient UI state. */
interface SnapshotState {
  problems: unknown[]
  cards: unknown[]
  snippets: unknown[]
  settings: unknown
  updatedAt: string
}

// ─── Debounce handle ──────────────────────────────────────────────────────────

let _debounceTimer: ReturnType<typeof setTimeout> | null = null
let _unsubscribe: (() => void) | null = null
let _onlineListener: (() => void) | null = null

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildSnapshot(): SnapshotState {
  const s = useStore.getState()
  return {
    problems: s.problems,
    cards: s.cards,
    snippets: s.snippets,
    settings: s.settings,
    updatedAt: s.updatedAt,
  }
}

function hydrateStore(state: SnapshotState): void {
  const store = useStore.getState()
  store.replaceAll({
    problems: state.problems as never,
    cards: state.cards as never,
    snippets: state.snippets as never,
    settings: state.settings as never,
    updatedAt: state.updatedAt,
  })
}

// ─── Push ─────────────────────────────────────────────────────────────────────

export async function pushToRemote(userId: string): Promise<void> {
  if (!supabase) return
  const store = useStore.getState()
  store.setSyncStatus('syncing')

  try {
    const snapshot = buildSnapshot()
    const { error } = await supabase
      .from('app_state')
      .upsert(
        {
          user_id: userId,
          state: snapshot,
          updated_at: new Date().toISOString(),
          version: 1,
        },
        { onConflict: 'user_id' },
      )

    if (error) throw error

    store.setSyncStatus('idle')
    store.setLastSyncedAt(new Date().toISOString())
  } catch (err) {
    console.error('[sync] push failed:', err)
    store.setSyncStatus('error')
  }
}

// ─── Pull-on-load ─────────────────────────────────────────────────────────────

export async function pullOnLoad(userId: string): Promise<void> {
  if (!supabase) return
  const store = useStore.getState()
  store.setSyncStatus('syncing')

  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('*')
      .eq('user_id', userId)
      .single<RemoteRow>()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found — that's fine, we'll insert below
      throw error
    }

    if (!data) {
      // No remote row — push local up
      await pushToRemote(userId)
      return
    }

    const localUpdatedAt = store.updatedAt
    const remoteUpdatedAt = data.updated_at

    if (remoteUpdatedAt > localUpdatedAt) {
      // Remote is newer — hydrate store
      hydrateStore(data.state)
    } else {
      // Local is newer (or equal) — push local up
      await pushToRemote(userId)
      return
    }

    store.setSyncStatus('idle')
    store.setLastSyncedAt(new Date().toISOString())
  } catch (err) {
    console.error('[sync] pull failed:', err)
    store.setSyncStatus(navigator.onLine ? 'error' : 'offline')
  }
}

// ─── Debounced push ───────────────────────────────────────────────────────────

function schedulePush(userId: string, delayMs = 2000): void {
  if (_debounceTimer !== null) clearTimeout(_debounceTimer)
  _debounceTimer = setTimeout(() => {
    _debounceTimer = null
    if (navigator.onLine) {
      pushToRemote(userId)
    }
    // If offline, the 'online' listener will handle it
  }, delayMs)
}

// ─── Manual sync ──────────────────────────────────────────────────────────────

export async function syncNow(userId: string): Promise<void> {
  if (_debounceTimer !== null) {
    clearTimeout(_debounceTimer)
    _debounceTimer = null
  }
  await pullOnLoad(userId)
}

// ─── Init & teardown ──────────────────────────────────────────────────────────

/**
 * Call once after the user session is established.
 * Sets up:
 *   1. Pull-on-load from remote.
 *   2. Store subscription for debounced push on data changes.
 *   3. Online event listener for offline recovery.
 */
export async function initSync(userId: string): Promise<void> {
  // Tear down any previous listeners (e.g. re-login)
  teardownSync()

  // Offline at boot — run from local cache, sync when back online
  if (!navigator.onLine) {
    useStore.getState().setSyncStatus('offline')
  } else {
    await pullOnLoad(userId)
  }

  // Subscribe to store changes — debounce push on updatedAt change
  let lastUpdatedAt = useStore.getState().updatedAt
  _unsubscribe = useStore.subscribe((state) => {
    if (state.updatedAt !== lastUpdatedAt) {
      lastUpdatedAt = state.updatedAt
      schedulePush(userId)
    }
  })

  // Listen for connectivity restoration
  _onlineListener = () => {
    useStore.getState().setSyncStatus('syncing')
    // Re-pull when coming back online
    pullOnLoad(userId)
  }
  window.addEventListener('online', _onlineListener)

  // Also update status to offline if connection drops
  const offlineListener = () => {
    useStore.getState().setSyncStatus('offline')
  }
  window.addEventListener('offline', offlineListener)
}

/**
 * Call on sign-out to clean up listeners and timers.
 */
export function teardownSync(): void {
  if (_debounceTimer !== null) {
    clearTimeout(_debounceTimer)
    _debounceTimer = null
  }
  if (_unsubscribe) {
    _unsubscribe()
    _unsubscribe = null
  }
  if (_onlineListener) {
    window.removeEventListener('online', _onlineListener)
    _onlineListener = null
  }
}
