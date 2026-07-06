# Warmup App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first deliberate-practice tracker for NeetCode 150 with enforced method, spaced repetition, and Supabase cloud sync.

**Architecture:** Vite + React + TypeScript SPA with Zustand (persist middleware) for local-first state. Spaced repetition scheduling via pure functions. Supabase for auth + cross-device sync (milestone 10). Static deploy to GitHub Pages (milestone 11).

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, Zustand (persist), date-fns, Recharts, Supabase JS, Vitest, IBM Plex Mono/Sans (self-hosted via @fontsource)

## Global Constraints

- No server of our own -- static SPA only (`vite build` -> `dist/`)
- No client-side router -- use `view` enum in Zustand store (hash routing only if ever added)
- No `VITE_` secrets -- only publishable Supabase URL + anon key
- Fonts self-hosted via `@fontsource` (no CDN links)
- All date math via `date-fns` (no raw `Date` arithmetic)
- `prefers-reduced-motion` respected; no bouncy animations
- Responsive down to phone; visible keyboard focus states
- Copy voice: plain, active, encouraging-but-not-cute. Sentence case.
- Temperature colors (cool->warm) mean mastery ONLY -- used nowhere else
- Dark mode supported (default if it looks better)

## File Structure

```
/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── vitest.config.ts
├── public/
│   └── 404.html
├── src/
│   ├── main.tsx                    -- React root + font imports
│   ├── App.tsx                     -- Layout shell + view router
│   ├── index.css                   -- Tailwind directives + base styles
│   ├── types.ts                    -- All type definitions from spec §3
│   ├── constants.ts                -- Intervals, prompt templates, type scale
│   ├── store.ts                    -- Zustand store with persist
│   ├── scheduling.ts              -- Pure functions for §4a/§4b/§4c
│   ├── scheduling.test.ts         -- Vitest tests for scheduling
│   ├── seed/
│   │   ├── problems.ts            -- NeetCode 150 seed data
│   │   ├── cards.ts               -- Concept card seeds (2-3 per pattern)
│   │   └── snippets.ts            -- Boilerplate snippet seeds
│   ├── components/
│   │   ├── Nav.tsx                 -- Left rail navigation
│   │   ├── ThemeToggle.tsx         -- Dark/light mode toggle
│   │   ├── Timer.tsx               -- Countdown timer component
│   │   ├── MasteryDots.tsx         -- Mastery level indicator (0-3)
│   │   ├── TemperatureBar.tsx      -- Progress bar with temperature colors
│   │   ├── CopyButton.tsx          -- One-click copy to clipboard
│   │   ├── ConfirmDialog.tsx       -- Reusable confirmation dialog
│   │   ├── WarmingGrid.tsx         -- The signature 150-cell mastery grid
│   │   └── views/
│   │       ├── Today.tsx           -- Daily queue view
│   │       ├── ProblemSession.tsx  -- Step machine for problem attempts
│   │       ├── Patterns.tsx        -- Pattern browse + problem details
│   │       ├── Concepts.tsx        -- Flashcard review + browse/edit
│   │       ├── Boilerplate.tsx     -- Snippet library
│   │       ├── Progress.tsx        -- Warming grid + burndown + stats
│   │       └── Settings.tsx        -- Config + export/import + account
│   └── utils/
│       ├── exportImport.ts         -- JSON export/import logic
│       └── cn.ts                   -- clsx/twMerge helper
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `vitest.config.ts`, `index.html`, `public/404.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/types.ts`, `src/constants.ts`
- Create: `src/components/Nav.tsx`, `src/components/ThemeToggle.tsx`, `src/utils/cn.ts`

**Interfaces:**
- Produces: Working Vite dev server with Tailwind, React, TypeScript. App shell with left rail nav and view switching. Dark/light toggle. All design tokens in Tailwind config. All types from spec §3 exported.

- [ ] **Step 1:** Initialize Vite React-TS project, install all dependencies:
  `npm create vite@latest . -- --template react-ts` then install:
  `tailwindcss @tailwindcss/vite zustand date-fns recharts @fontsource/ibm-plex-mono @fontsource/ibm-plex-sans clsx tailwind-merge vitest @testing-library/react`

- [ ] **Step 2:** Configure `tailwind.config.ts` with all design tokens from §7 (ink, paper, slate, line, cool, mid, warm, hot, signal). Configure dark mode.

- [ ] **Step 3:** Set up `src/index.css` with Tailwind directives, font-face declarations, base styles.

- [ ] **Step 4:** Create `src/types.ts` with all types from §3 exactly (Pattern, AttemptResult, Attempt, Mastery, ProblemStatus, Problem, ConceptCard, Snippet, Settings) plus View type enum.

- [ ] **Step 5:** Create `src/constants.ts` with mastery intervals `[1, 3, 7, 16]`, prompt templates from §6, type scale.

- [ ] **Step 6:** Create `src/utils/cn.ts` (clsx + tailwind-merge helper).

- [ ] **Step 7:** Create `src/components/ThemeToggle.tsx` -- toggles dark class on `<html>`, persists to localStorage.

- [ ] **Step 8:** Create `src/components/Nav.tsx` -- slim left rail with 6 view icons + labels (Today, Patterns, Concepts, Boilerplate, Progress, Settings). Takes `currentView` and `onNavigate` props.

- [ ] **Step 9:** Create `src/App.tsx` -- renders Nav + view area, switches on `view` state. Create `src/main.tsx` with font imports and React root.

- [ ] **Step 10:** Create `public/404.html` as copy of `index.html`. Set up `vite.config.ts`.

- [ ] **Step 11:** Verify: `npm run dev` shows app shell with nav rail, view switching works, dark/light toggle works, fonts render.

- [ ] **Step 12:** Commit.

---

### Task 2: Data Store, Seed Data, and Export/Import

**Files:**
- Create: `src/store.ts`, `src/seed/problems.ts`, `src/seed/cards.ts`, `src/seed/snippets.ts`, `src/utils/exportImport.ts`

**Interfaces:**
- Consumes: Types from `src/types.ts`, constants from `src/constants.ts`
- Produces: `useStore` hook with full state + actions (addAttempt, updateNotes, updateProblem, addCard, rateCard, addSnippet, updateSnippet, deleteSnippet, updateSettings, exportState, importState, resetAll). Seed data auto-populates on first load.

- [ ] **Step 1:** Create `src/seed/problems.ts` -- export `seedProblems(): Problem[]` returning the full NeetCode 150 with id (slug), title, url, pattern, order, status='not_started', mastery=0, nextReview=null, empty attempts/notes.

- [ ] **Step 2:** Create `src/seed/cards.ts` -- export `seedCards(): ConceptCard[]` with 2-3 recognition-focused cards per pattern (36-54 cards total), following the style from §8.

- [ ] **Step 3:** Create `src/seed/snippets.ts` -- export `seedSnippets(): Snippet[]` with Python boilerplate: BFS, DFS (recursive + iterative), binary search, heap, union-find, backtracking template, defaultdict/Counter patterns.

- [ ] **Step 4:** Create `src/store.ts` -- Zustand store with `persist` middleware. State: problems, cards, snippets, settings (with defaults from §3), updatedAt, view (transient), sessionState (transient). Actions for CRUD on all entities. Seeds on first load (checks if problems array is empty).

- [ ] **Step 5:** Create `src/utils/exportImport.ts` -- `exportState()` downloads timestamped JSON, `importState(file)` parses + validates + replaces store after confirm.

- [ ] **Step 6:** Wire export/import into a temporary test UI or verify via console.

- [ ] **Step 7:** Verify: reload browser, data persists. Export downloads JSON. Import restores from JSON.

- [ ] **Step 8:** Commit.

---

### Task 3: Scheduling Engine with Tests

**Files:**
- Create: `src/scheduling.ts`, `src/scheduling.test.ts`

**Interfaces:**
- Consumes: Types from `src/types.ts`, `addDays` from `date-fns`
- Produces: Pure functions: `scheduleAfterAttempt(problem, result, today) -> {mastery, status, nextReview}`, `scheduleCard(card, rating, today) -> {interval, nextReview}`, `computeDailyNewTarget(problems, settings, today) -> {dailyNewTarget, paceStatus}`, `isDue(nextReview, today) -> boolean`, `buildTodayQueue(problems, cards, settings, today) -> QueueItem[]`

- [ ] **Step 1:** Write failing tests for `scheduleAfterAttempt`:
  - cold on mastery 0 -> mastery 1, status reviewing, nextReview +3 days
  - cold on mastery 3 -> status mastered, nextReview +30
  - cold on mastery 3 when already mastered -> stays mastered
  - hint -> mastery unchanged, nextReview +2
  - solution -> mastery 0, status learning, nextReview +1
  - first attempt on not_started follows same rules

- [ ] **Step 2:** Run tests, verify they fail: `npx vitest run src/scheduling.test.ts`

- [ ] **Step 3:** Implement `scheduleAfterAttempt` in `src/scheduling.ts`.

- [ ] **Step 4:** Run tests, verify pass.

- [ ] **Step 5:** Write failing tests for `scheduleCard`:
  - got_it doubles interval (clamped 3-30)
  - shaky -> interval 3
  - missed -> interval 1
  - new card (interval 0) got_it -> interval 3

- [ ] **Step 6:** Implement `scheduleCard`, run tests, verify pass.

- [ ] **Step 7:** Write failing tests for `computeDailyNewTarget`:
  - 150 problems, 46 days left, 6 days/week -> ceil(150/39.4) = 4
  - clamps to [1, 8]
  - returns paceStatus: on_track, ahead, behind

- [ ] **Step 8:** Implement `computeDailyNewTarget`, run tests.

- [ ] **Step 9:** Write tests for `buildTodayQueue`:
  - includes due reviews
  - includes due concept cards
  - includes up to dailyNewTarget new problems in NeetCode order
  - interleaves review and new items

- [ ] **Step 10:** Implement `buildTodayQueue` and `isDue`, run tests.

- [ ] **Step 11:** Commit.

---

### Task 4: Today Queue + Problem Session Step Machine

**Files:**
- Create: `src/components/views/Today.tsx`, `src/components/views/ProblemSession.tsx`, `src/components/Timer.tsx`, `src/components/CopyButton.tsx`, `src/components/MasteryDots.tsx`, `src/components/ConfirmDialog.tsx`

**Interfaces:**
- Consumes: `useStore`, `buildTodayQueue`, `scheduleAfterAttempt`, prompt templates from constants
- Produces: Today view showing queue with "N left today" counter, one item at a time, Start action. ProblemSession step machine with all gates enforced (timer -> hint -> solution -> re-implement -> log -> notes).

- [ ] **Step 1:** Create `src/components/Timer.tsx` -- countdown from `settings.timerSec`, visible display, fires `onComplete` callback, "I'm stuck" button.

- [ ] **Step 2:** Create `src/components/CopyButton.tsx` -- copies text to clipboard, shows "Copied" briefly.

- [ ] **Step 3:** Create `src/components/MasteryDots.tsx` -- renders 0-3 filled dots with temperature colors.

- [ ] **Step 4:** Create `src/components/ConfirmDialog.tsx` -- modal with message + confirm/cancel.

- [ ] **Step 5:** Create `src/components/views/Today.tsx`:
  - Calls `buildTodayQueue` to assemble the queue
  - Shows one item at a time with "N left today" counter (IBM Plex Mono, large)
  - Queue items show: problem title (or card question) + pattern + type badge (review/new/concept)
  - "Start" button launches ProblemSession or inline concept card review
  - Empty state: "Nothing due. You're clear for today." + subtle "Pull tomorrow's problems forward" option
  - Motivational line: "Blanking is the start line, not the verdict."

- [ ] **Step 6:** Create `src/components/views/ProblemSession.tsx` -- the step machine:
  - Step 1 (Attempt): title, link, pattern HIDDEN, running timer. "I'm stuck" button.
  - Step 2 (Hint): shows after timer ends or "I'm stuck". Copy AI hint prompt button. Reveals pattern name. "Try again" option.
  - Step 3 (Reveal solution): only available after hint step. Behind confirm dialog ("Reading the solution resets mastery"). Sets `solutionRevealed` flag.
  - Step 4 (Re-implement gate): if solution was revealed, checkbox "I closed the solution and re-coded it from scratch" required before logging.
  - Step 5 (Log result): three buttons -- Cold (disabled if solution revealed), Hint, Solution. Captures timeSpentSec from timer.
  - Step 6 (Notes): three single-line inputs (Trigger, Insight, My gap) with placeholder examples. Max ~140 chars each. Nudge if blank.
  - On save: call store.addAttempt() which runs scheduling, return to Today queue.

- [ ] **Step 7:** Wire Today and ProblemSession into App.tsx view switching.

- [ ] **Step 8:** Verify full flow: start problem -> timer runs -> hint gate works -> solution gate works -> re-implement checkbox enforced -> logging works -> scheduling updates -> back to queue.

- [ ] **Step 9:** Commit.

---

### Task 5: Patterns Browse + Concepts Flashcards

**Files:**
- Create: `src/components/views/Patterns.tsx`, `src/components/views/Concepts.tsx`, `src/components/TemperatureBar.tsx`

**Interfaces:**
- Consumes: `useStore`, `scheduleCard`
- Produces: Patterns view with 18 pattern rows (progress bar, counts, expandable problem list). Concepts view with flashcard review + browse/add/edit.

- [ ] **Step 1:** Create `src/components/TemperatureBar.tsx` -- progress bar colored by temperature scale. Takes counts of each mastery level.

- [ ] **Step 2:** Create `src/components/views/Patterns.tsx`:
  - 18 pattern rows as expandable list
  - Each row: pattern name, TemperatureBar, counts (mastered/reviewing/learning/not started)
  - Expanded: pattern's problems in order, each showing status, MasteryDots, last attempt date, 3-line notes
  - Click problem -> jump to ProblemSession or edit notes inline

- [ ] **Step 3:** Create `src/components/views/Concepts.tsx`:
  - Review mode: show due cards one at a time, question -> Reveal -> rate (Got it / Shaky / Missed) -> schedule
  - Browse mode: cards grouped by pattern, add/edit/delete cards
  - Add card form: pattern select, question, answer inputs

- [ ] **Step 4:** Verify: patterns show correct counts, expanding shows problems with notes. Concept card review cycles through due cards and schedules correctly.

- [ ] **Step 5:** Commit.

---

### Task 6: Boilerplate + Settings

**Files:**
- Create: `src/components/views/Boilerplate.tsx`, `src/components/views/Settings.tsx`

**Interfaces:**
- Consumes: `useStore`, `exportState`/`importState` from utils
- Produces: Boilerplate view with snippet library grouped by pattern (view, copy, edit, add, delete). Settings view with all config fields + export/import + reset all.

- [ ] **Step 1:** Create `src/components/views/Boilerplate.tsx`:
  - Snippets grouped by pattern
  - Each: title, language badge, syntax-highlighted code (mono `<pre>`), CopyButton
  - Edit inline (title, code, language)
  - Add new snippet button
  - Delete with confirm

- [ ] **Step 2:** Create `src/components/views/Settings.tsx`:
  - Timer length (number input)
  - Study days/week (1-7)
  - Language (text input)
  - Deadline (date input)
  - Export button (downloads JSON)
  - Import button (file picker + confirm)
  - Reset all data (double confirm)

- [ ] **Step 3:** Verify: snippets display and copy correctly. Settings persist. Export/import round-trips. Reset clears and re-seeds.

- [ ] **Step 4:** Commit.

---

### Task 7: Progress View (Warming Grid + Burndown + Stats)

**Files:**
- Create: `src/components/WarmingGrid.tsx`, `src/components/views/Progress.tsx`

**Interfaces:**
- Consumes: `useStore`, `computeDailyNewTarget`, Recharts
- Produces: Progress view with the signature warming grid, burndown chart, and honest stats.

- [ ] **Step 1:** Create `src/components/WarmingGrid.tsx`:
  - 150 cells, one per problem, laid out in pattern groups
  - Each cell colored by mastery temperature (cool -> mid -> warm -> hot)
  - not_started = very faint/empty
  - Hover tooltip: problem title + status
  - This is the signature element -- spend design effort here
  - Respect `prefers-reduced-motion` for any fill animations

- [ ] **Step 2:** Create `src/components/views/Progress.tsx`:
  - WarmingGrid at top (prominent)
  - Burndown chart (Recharts): problems remaining vs ideal line to deadline
  - Stats: cold-solve rate (cold / total attempts, last 14 days), problems mastered, on-track/behind status
  - If cold rate is low: calm note "Leaning on solutions -- slow down, use hints first"
  - Pace indicator: on track (green dot), ahead (green), behind (amber dot + "pick up ~N/day")
  - No streak emojis, no punishing visuals

- [ ] **Step 3:** Verify: grid renders correctly with temperature colors. Burndown chart shows data. Stats compute correctly.

- [ ] **Step 4:** Commit.

---

### Task 8: Transfer Tests + AI Prompt Copy Cards

**Files:**
- Modify: `src/components/views/ProblemSession.tsx`, `src/store.ts`
- Create: (AI prompt cards integrated into ProblemSession)

**Interfaces:**
- Consumes: `useStore`, prompt templates from constants
- Produces: Transfer test offering after mastery (~1 in 3 chance). AI prompt copy cards shown at appropriate steps in ProblemSession.

- [ ] **Step 1:** Add transfer test logic to store: after a problem reaches mastered, ~33% chance to surface a different problem in the same pattern, unlabeled, as a check.

- [ ] **Step 2:** Add transfer test UI to ProblemSession/Today: "Same family. Does it still click without the label?" -- launches a session for the transfer problem without revealing pattern.

- [ ] **Step 3:** Add AI prompt copy cards to ProblemSession at appropriate steps:
  - Hint step: "Hint" prompt template with CopyButton
  - After attempt: "Sanity-check my approach" prompt
  - After solving: "Code review" prompt
  - Transfer test: "Transfer test" prompt
  - Each as a labeled card with copy button

- [ ] **Step 4:** Verify: transfer tests appear occasionally after mastery. Prompt cards show at correct steps and copy works.

- [ ] **Step 5:** Commit.

---

### Task 9: Polish Pass

**Files:**
- Modify: Multiple component files

**Interfaces:**
- Produces: Responsive layouts, focus states, reduced-motion support, empty/error states with good copy.

- [ ] **Step 1:** Responsive pass: ensure all views work on phone widths. Nav collapses to bottom bar or icon-only on mobile.

- [ ] **Step 2:** Focus states: visible focus rings using `signal` color on all interactive elements.

- [ ] **Step 3:** `prefers-reduced-motion`: disable any card transitions and grid fill animations.

- [ ] **Step 4:** Empty/error states: every view has a helpful empty state with direction (never "No data" or apologetic copy).

- [ ] **Step 5:** Design critique: "remove one accessory" -- review all screens for unnecessary visual noise.

- [ ] **Step 6:** Make problems fully editable/addable/removable as specified in §8.

- [ ] **Step 7:** Verify all definition-of-done items from §10 (except auth/sync/deploy).

- [ ] **Step 8:** Commit.

---

### Task 10: Auth & Cloud Sync (Supabase)

**Files:**
- Create: `src/lib/supabase.ts`, `src/components/views/Login.tsx`, `src/sync.ts`
- Modify: `src/store.ts`, `src/components/views/Settings.tsx`, `src/App.tsx`

**Interfaces:**
- Consumes: `@supabase/supabase-js`, `useStore`
- Produces: Login screen (email+password, magic link, GitHub OAuth). Auth gating. Sync engine: pull-on-load, debounced push, offline grace. Account controls in Settings.

- [ ] **Step 1:** Install `@supabase/supabase-js`. Create `src/lib/supabase.ts` with client init from `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.

- [ ] **Step 2:** Create SQL migration for `app_state` table with RLS policies (document in README or `supabase/` folder).

- [ ] **Step 3:** Create `src/components/views/Login.tsx`: email+password form, magic link option, GitHub OAuth button. On-brand minimal design.

- [ ] **Step 4:** Create `src/sync.ts`: sync engine with pull-on-load, debounced push (~2s), last-write-wins on `updated_at`, syncStatus state (idle/syncing/error/offline), offline detection. `// SYNC-UPGRADE-PATH` comment at module boundary.

- [ ] **Step 5:** Add auth state to store (transient): `user`, `syncStatus`, `lastSyncedAt`. Gate app: no session -> Login; valid session -> hydrate + run. Offline grace: persisted session + offline -> run from local cache.

- [ ] **Step 6:** Add Account block to Settings: signed-in email, Sync now button, last synced timestamp, Sign out (with note about clearing local cache).

- [ ] **Step 7:** Verify: login works, data syncs across devices, RLS blocks other accounts, offline use works.

- [ ] **Step 8:** Commit.

---

### Task 11: Deploy (GitHub Pages)

**Files:**
- Create: `.github/workflows/deploy.yml`, `public/CNAME` (if custom domain)
- Modify: `vite.config.ts`

**Interfaces:**
- Produces: GitHub Actions workflow deploying `dist/` to GitHub Pages. Correct base path. Working refresh. Supabase URL allow-list configured.

- [ ] **Step 1:** Set `base` in `vite.config.ts` with clear comment per §12.

- [ ] **Step 2:** Ensure `public/404.html` is a copy of `index.html` for GitHub Pages refresh.

- [ ] **Step 3:** Create `.github/workflows/deploy.yml`: on push to main -> checkout, Node setup, `npm ci`, build with Supabase env vars from secrets, deploy via `actions/upload-pages-artifact` + `actions/deploy-pages`.

- [ ] **Step 4:** Document: Supabase URL Configuration (add deployed origins to redirect allow-list).

- [ ] **Step 5:** Verify deploy checklist from §12: dev works, preview works, push deploys, live URL loads, cross-device sync works, signed-out data is unreadable.

- [ ] **Step 6:** Commit.
