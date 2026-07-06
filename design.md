# Build Spec — "Warmup": a deliberate-practice tracker for NeetCode 150

> Paste this whole file into Claude Code as the initial prompt. It is written to be executed end-to-end. Build in the milestone order given at the bottom. When a decision is ambiguous, re-read the **Product principles** — they are the tiebreaker.

---

## 0. Context (read this first — it explains why every feature exists)

I'm a working engineer (internship at AWS) prepping for interviews. I can build software fine, but LeetCode-style problem solving doesn't come to me. My current broken loop is: stare at a problem → blank → peek at the solution → half-understand it → copy it out → make notes I don't understand → feel dumb. That loop trains **memorization**, not **recognition**, so nothing transfers to new problems.

The goal of this app is to **force a better loop** and make it stick with spaced repetition, while I'm busy and can't spend much time per day. Deadline: finish NeetCode 150 by **August 21**. It is now early July.

The app is NOT a generic todo list or a gamified streak-grinder. It is a **coach that enforces a method** and **schedules review so I don't forget old patterns while learning new ones.**

This is a personal, single-user tool. It is **local-first** (instant, works offline) but backed by a **private account that syncs my data across my phone and laptop**. Just me — no public signups, no other users. Auth and sync are done with Supabase (see §11); the frontend stays a static site I can host on GitHub Pages / my personal domain (see §12).

---

## 1. Product principles (the tiebreakers)

1. **Recognition over memorization.** Everything optimizes for "when I see a new problem, the right *pattern* comes to mind." Features that reward re-doing a memorized problem are anti-goals.
2. **The method is enforced by the UI, not suggested.** The solution is gated. Notes are structured, not freeform. The user cannot just copy an answer and move on — the flow physically routes them through an attempt, a hint, and a from-scratch re-implementation.
3. **Calm, not anxious.** No confetti, no punishing streak-loss red numbers, no leaderboard. The emotional target is "focused training log," not "dopamine slot machine." Anxiety pushes cramming, which is the enemy.
4. **One thing at a time.** The default screen shows the *next single action*, not a wall of everything.
5. **Honest signal.** The app must always be able to answer "do I actually understand this pattern, or did I memorize this problem?" — via cold re-attempts and transfer tests (defined below).
6. **Fast to log.** Logging an attempt takes seconds. If logging is tedious, it won't happen on a busy AWS day.

---

## 2. Tech stack (and why)

- **Vite + React + TypeScript.** Local-first SPA, no server needed, fast dev loop. TypeScript because the data model and scheduling logic have real invariants I want the compiler to enforce.
- **Tailwind CSS** for styling. Design tokens defined in `tailwind.config` (see §7).
- **Zustand with the `persist` middleware** for state + the **local-first cache**. *Why:* `persist` auto-syncs the store to `localStorage` on every change, giving instant reads, offline use, and trivial export/import. This is the local cache layer; the cloud (Supabase) is the cross-device source of truth (see §11). Do NOT hand-roll a storage layer or use React Context for the main store.
- **Supabase JS client** (`@supabase/supabase-js`) for **auth + cloud sync** (see §11). The static frontend talks directly to Supabase over HTTPS — there is no server of our own to run or deploy.
- **Recharts** for the progress/burn-down chart only.
- **date-fns** for all date math (do not use raw `Date` arithmetic for intervals).
- **No router library** — use a simple `view` enum in the Zustand store to switch screens. This is deliberate: it sidesteps the "refresh gives a 404" problem that client-side routing causes on GitHub Pages and other static hosts. If you ever add a router, it must be **hash routing** (`createHashRouter`) so refresh/deep-links work on a static host.
- **Fonts:** self-host via `@fontsource/ibm-plex-mono` and `@fontsource/ibm-plex-sans` (imported in code), not a Google Fonts `<link>`. This keeps the deployed site free of a runtime CDN dependency and works offline.

This whole app must build to **static files** (`vite build` → `dist/`) with **no server of our own**, so it can be dropped on GitHub Pages or any static host. The only config is the two Supabase *publishable* keys (URL + anon key), which are designed to be public and are safe in the client **because Row-Level Security protects the data** — see §11 and §12. **No real secrets** (Supabase `service_role` key, any AI API key) may ever be committed or placed in a `VITE_` var, since all `VITE_` vars are baked into the public bundle.

**Durability requirement:** independent of cloud sync, implement **Export** (download full state as a timestamped JSON file) and **Import** (load a JSON file, replacing state after a confirm). This is the offline backup and the ultimate safety net — it is not optional.

---

## 3. Data model (implement these types exactly)

```ts
type Pattern =
  | 'arrays_hashing' | 'two_pointers' | 'sliding_window' | 'stack'
  | 'binary_search' | 'linked_list' | 'trees' | 'tries'
  | 'heap_priority_queue' | 'backtracking' | 'graphs' | 'advanced_graphs'
  | 'dp_1d' | 'dp_2d' | 'greedy' | 'intervals'
  | 'math_geometry' | 'bit_manipulation';

type AttemptResult =
  | 'cold'      // solved unaided within the timer
  | 'hint'      // solved but needed 1–2 hints (pattern name / nudge)
  | 'solution'; // had to read the solution

interface Attempt {
  date: string;          // ISO
  result: AttemptResult;
  timeSpentSec: number;
  reimplemented: boolean; // did they close the solution and re-code from scratch?
}

type Mastery = 0 | 1 | 2 | 3; // 0 = learning ... 3 = about to retire
type ProblemStatus = 'not_started' | 'learning' | 'reviewing' | 'mastered';

interface Problem {
  id: string;            // stable slug, e.g. 'two-sum'
  title: string;         // 'Two Sum'
  url: string;           // leetcode url
  pattern: Pattern;
  order: number;         // position within its pattern in NeetCode 150
  status: ProblemStatus;
  mastery: Mastery;
  nextReview: string | null; // ISO date; null until first attempt
  attempts: Attempt[];
  notes: {               // the ONLY notes allowed — three short lines
    trigger: string;     // what signaled the pattern ("sorted array + find pair")
    insight: string;     // the one non-obvious move
    gap: string;         // the exact thing that tripped me up
  };
}

interface ConceptCard {
  id: string;
  pattern: Pattern;
  question: string;      // recognition-focused, e.g. "What signals sliding window?"
  answer: string;        // revealed on demand
  interval: number;      // days
  nextReview: string | null;
  lastRating: 'got_it' | 'shaky' | 'missed' | null;
}

interface Snippet {      // the boilerplate library
  id: string;
  pattern: Pattern;
  title: string;         // 'BFS on a grid', 'binary search (no off-by-one)'
  language: string;
  code: string;
}

interface Settings {
  timerSec: number;          // default 480 (8 min)
  studyDaysPerWeek: number;  // default 6, used for pacing math
  language: string;          // default 'Python'; single language for the summer
  deadline: string;          // ISO, default 2026-08-21
}
```

The Zustand store holds: `problems: Problem[]`, `cards: ConceptCard[]`, `snippets: Snippet[]`, `settings: Settings`, and a persisted `updatedAt: string` (ISO, bumped on every data change — used for sync conflict resolution in §11). Plus transient (non-persisted) state: `view`, in-progress session state, and `auth` (current Supabase session/user, `syncStatus`, `lastSyncedAt`).

---

## 4. Spaced-repetition scheduling (implement exactly — do not improvise)

There are **two independent tracks**: problem re-attempts (coding) and concept cards (recognition). Both compute `nextReview` from a result. Use `date-fns` `addDays`.

### 4a. Problems

Intervals by mastery level (days): `INTERVAL = [1, 3, 7, 16]` indexed by `mastery`.

On logging an attempt with `result`:

- **`cold`** → `mastery = min(3, mastery + 1)`. If it was already `3` and they solve cold again → set `status = 'mastered'` and `nextReview = addDays(today, 30)` (mastered problems still resurface rarely as a check, then retire fully after one more cold pass). Otherwise `status = 'reviewing'`, `nextReview = addDays(today, INTERVAL[mastery])`.
- **`hint`** → `mastery` unchanged, `status = 'reviewing'`, `nextReview = addDays(today, 2)`. (Partial recall → short leash.)
- **`solution`** → `mastery = 0`, `status = 'learning'`, `nextReview = addDays(today, 1)`.

First ever attempt on a `not_started` problem follows the same rules (it just had `mastery = 0`).

A problem is **due** when `nextReview !== null && nextReview <= today`.

### 4b. Concept cards

Rating a card:

- **`got_it`** → `interval = min(30, max(3, interval * 2))`
- **`shaky`** → `interval = 3`
- **`missed`** → `interval = 1`

Then `nextReview = addDays(today, interval)`. New cards start with `interval = 0`, `nextReview = null` and are considered due immediately once their pattern has been started.

### 4c. Daily "new problem" pacing

Compute how many *new* problems to introduce per day so the user finishes by the deadline:

```
remainingNew   = problems where status === 'not_started'
studyDaysLeft  = business-ish days from today to settings.deadline,
                 scaled by (settings.studyDaysPerWeek / 7), min 1
dailyNewTarget = ceil(remainingNew / studyDaysLeft)   // clamp to [1, 8]
```

Show whether they're **on track**, **ahead**, or **behind** relative to a straight line from today to the deadline. "Behind" is shown calmly (an amber dot + "pick up ~N/day"), never as alarm-red.

---

## 5. Screens & behavior

Six views, switched from a slim persistent left rail (icons + labels): **Today**, **Patterns**, **Concepts**, **Boilerplate**, **Progress**, **Settings**. Default is **Today**.

### 5.1 Today (the heart of the app)

A single focused **queue**, one card visible at a time (with a small "N left today" counter). The queue is assembled each day as:

1. All **due problem re-attempts** (`4a`).
2. All **due concept cards** (`4b`).
3. Up to `dailyNewTarget` **new problems**, taken in strict NeetCode order (never random — a pattern only imprints if you do 5–6 of the same type in a row).

Interleave so it's not all-new-then-all-review; roughly alternate review and new. Each queue item has a **Start** action.

**Empty state:** "Nothing due. You're clear for today." + a subtle option to pull tomorrow's new problems forward if they want to get ahead. (Empty screen is an invitation, per the copy rules — not a dead end.)

### 5.2 Problem Session (the method, enforced)

This is the flow that breaks the broken loop. It is a **step machine** — the user cannot skip ahead:

1. **Attempt.** Show title, link, pattern is **hidden**. Start the timer (`settings.timerSec`, default 8 min). A visible countdown. The user solves in their own editor/LeetCode; this screen just runs the clock and holds the gates.
2. When the timer ends **or** the user hits "I'm stuck": reveal a **Hint** step — but the hint is *not the solution*. It's (a) a one-click **"Copy AI hint prompt"** button that copies a templated prompt (see §6) to clipboard, and (b) the stored pattern name for this problem. Then: "Try again with this."
3. Only after the hint step is a **"Reveal solution"** button available, behind a confirm ("Reading the solution resets this problem's mastery — that's fine, but try the hint first"). Revealing sets an internal flag used to prevent logging `cold` for this attempt.
4. **Re-implement gate.** After any attempt where the solution was revealed, the flow requires a checkbox: *"I closed the solution and re-coded it from scratch."* Logging is disabled until this is checked (or the user explicitly chose `cold`/`hint` and never revealed). This step is the single most important one — it converts reading into learning.
5. **Log result:** three big buttons — `Cold`, `Hint`, `Solution` (disabled appropriately per the flags above). Captures `timeSpentSec` from the timer automatically.
6. **Notes (structured, mandatory-ish):** three short single-line inputs — **Trigger**, **Insight**, **My gap** — with placeholder examples. Freeform paste of a whole solution is impossible by design (single-line, short maxlength ~140). If they leave them blank they can save, but nudge once.
7. On save: run scheduling (§4a), update the problem, return to the queue.

After a problem reaches `mastered`, occasionally (≈1 in 3 masteries) offer a **Transfer test**: surface a *different* problem in the same pattern, unlabeled, as a check — "Same family. Does it still click without the label?" This is the honesty signal (principle 5).

### 5.3 Patterns (browse)

The 18 patterns as a list/grid. Each row: pattern name, a progress bar, counts (`mastered / reviewing / learning / not started`). Click to expand into that pattern's problems (in order), each showing status, mastery dots, last attempt, and the 3-line notes. From here they can jump into any problem session or edit notes.

### 5.4 Concepts (flashcards)

Runs the due concept cards. Show question → user thinks → **Reveal** → rate `Got it / Shaky / Missed` → schedule (§4b). Also allow browsing/adding/editing cards per pattern.

### 5.5 Boilerplate

The snippet library — the fix for "I know the approach but can't code it." Grouped by pattern. Each snippet: title, language, syntax-highlighted code (use a lightweight highlighter or a mono `<pre>` — don't over-engineer), copy button, editable. Seed it (see §8) with the classics: BFS (queue), DFS (recursive + iterative), binary search that handles off-by-ones, heap push/pop, union-find, backtracking template, `defaultdict`/`Counter` patterns.

### 5.6 Progress

- **The signature element (see §7):** the **warming grid** — 150 cells, one per problem, laid out in pattern groups, each cell colored by mastery "temperature" (cool = not started/learning, warming through to a warm tone = mastered). The whole summer's arc is visible as the grid heats up. Hover a cell → problem title + status.
- A **burn-down chart** (Recharts): problems remaining vs. the ideal line to Aug 21.
- Honest stats: **cold-solve rate** (cold ÷ total attempts, last 14 days), problems mastered, current on-track/behind status, and a small note if cold-rate is low ("leaning on solutions — slow down, use hints first").
- Keep it truthful and non-punitive. No streak fire emojis.

### 5.7 Settings

Timer length, study days/week, language, deadline, and **Export / Import** (§2). A "reset all data" behind a double confirm. Plus an **Account** block (see §11): signed-in email, **Sync now** button with a "last synced" timestamp and current sync status, and **Sign out** (with a note that signing out clears this device's local cache — the data is safe in the cloud).

---

## 6. AI hint prompt templates (store as constants, copy-to-clipboard)

The app doesn't call any AI API by default (no keys, keeps the build simple). It gives the user one-click copyable prompts to paste into their own assistant. Store these and expose the right one at the right step:

- **Hint (in the session's hint step):**
  `Here's a problem: [I'll paste it]. Don't give the solution or the full approach. Just name the pattern category, and ask me ONE question that points at the key insight.`
- **Sanity-check my approach:**
  `My approach is: [___]. Poke holes in it — where is my reasoning off or incomplete? Don't give me the answer.`
- **Code review (after solving):**
  `Here's my working solution: [___]. What's the time/space complexity? Is it clean and idiomatic? Only show a rewrite if mine is clearly suboptimal, and explain the diff.`
- **Transfer test:**
  `Give me a different problem that uses the same pattern as [___], without telling me it's the same pattern. I want to test whether it actually stuck.`

Each rendered as a labeled card with a Copy button. (Optional stretch: a Settings toggle to paste an Anthropic API key and call the model in-app — implement only after everything else works, and never commit the key.)

---

## 7. Design system

**Do not** use the current AI-default looks: cream + serif + terracotta; near-black + acid-green; or the hairline broadsheet. This is an engineering practice log — calm, precise, a little bit "instrument panel."

**Concept:** a well-designed engineering logbook. The subject's own vernacular is *code*, so a monospace face carries the identity — used with restraint, paired with a humanist sans for reading. Mastery is encoded as **temperature** (cool→warm), which is real information, not decoration, and it's what makes the warming grid meaningful.

**Palette (define as Tailwind tokens):**
- `ink` `#14171A` — primary dark surface / text on light
- `paper` `#EEF1F3` — cool off-white base (NOT cream)
- `slate` `#5B6672` — secondary text / muted UI
- `line` `#D3D9DE` — hairlines, borders
- Temperature scale for mastery: `cool` `#3E7CB1` (learning) → `mid` `#8FB8A8` → `warm` `#E0A458` → `hot` `#D9673B` (mastered). Use these for the grid cells, mastery dots, and progress bars — nowhere else, so the color always *means mastery*.
- One restrained accent for interactive elements (buttons, focus): `signal` `#2F6F6A` (a deep muted teal — distinct from all the defaults). Focus rings visible and this color.

Support a dark mode (it's a dev tool used during work): dark surfaces from `ink`, same temperature scale, same teal signal. Make dark the default if it looks better; expose a toggle.

**Type:**
- Display / data / anything numeric or code-adjacent: **IBM Plex Mono** (self-hosted via `@fontsource`, see §2). Used large for screen titles and the queue counter — this is the memorable type treatment.
- Body / reading: **IBM Plex Sans** (self-hosted via `@fontsource`). They're a designed pair, so they cohere.
- Set a real scale (e.g. 12 / 14 / 16 / 20 / 28 / 40) and use weight/tracking deliberately; sentence case everywhere.

**Signature:** the **warming grid** on Progress (§5.6). Spend the boldness here; keep every other screen quiet and disciplined. One accent, generous whitespace, hairlines from `line`.

**Quality floor (non-negotiable):** responsive down to a phone; visible keyboard focus; `prefers-reduced-motion` respected (the only motion should be a subtle card transition in the queue and a gentle cell fill on the grid — nothing bouncy).

**Copy voice:** plain, active, encouraging-but-not-cute. "Log attempt," not "Submit." Empty and error states give direction, never apologize, never vague. One line the app should live by, shown subtly on the empty Today state: *"Blanking is the start line, not the verdict."*

---

## 8. Seed data

On first run, seed the store if empty.

**Problems:** seed the full **NeetCode 150** list, grouped into the 18 patterns in canonical NeetCode order, with `order` per pattern, correct `title`, `url` (leetcode.com/problems/&lt;slug&gt;), all with `status:'not_started'`, `mastery:0`, `nextReview:null`, empty attempts and notes. The pattern group sizes are approximately: arrays_hashing 9, two_pointers 5, sliding_window 6, stack 7, binary_search 7, linked_list 11, trees 15, tries 3, heap_priority_queue 7, backtracking 9, graphs 13, advanced_graphs 6, dp_1d 12, dp_2d 11, greedy 8, intervals 6, math_geometry 8, bit_manipulation 7 (≈150 total). Use the canonical NeetCode 150 problem set. **Make problems fully user-editable/addable/removable** so any seeding gap is fixable in-app — treat the seed as a starting point, not a hard dependency.

**Concept cards:** seed 2–3 recognition-focused cards per pattern. Examples to model the style on:
- sliding_window — Q: "What in a problem statement signals sliding window?" A: "Contiguous subarray/substring + an optimum (longest/shortest/max) under a constraint."
- two_pointers — Q: "Sorted array, find a pair summing to target — why two pointers over hashing?" A: "O(1) space; move left/right inward based on comparison to target."
- binary_search — Q: "Beyond sorted-array lookup, when else does binary search apply?" A: "Monotonic predicate — 'search on the answer' when a feasibility check is monotonic."
(Write the rest in this spirit — trigger/recognition first, not trivia.)

**Snippets:** seed the boilerplate listed in §5.5, in the default language (Python).

---

## 9. Build order (milestones — ship each before moving on)

1. **Scaffold:** Vite + React + TS + Tailwind + Zustand(persist) + date-fns. Design tokens in Tailwind config. App shell with the left rail and view switching. Dark/light.
2. **Data + seed:** implement types, seed the 150 problems + concept cards + snippets. Export/Import working. Verify persistence across reloads.
3. **Scheduling engine:** pure functions for §4a/§4b/§4c with a few unit tests (Vitest) proving the interval tables and due logic. This is the core — get it right and covered.
4. **Today queue + Problem Session step machine:** the enforced method (§5.1, §5.2), including hint gate, solution gate, re-implement gate, structured notes, logging → scheduling.
5. **Patterns browse** (§5.3) and **Concepts** flashcards (§5.4).
6. **Boilerplate** (§5.5) and **Settings** (§5.7).
7. **Progress:** warming grid signature + burn-down + honest stats (§5.6).
8. **Transfer tests** + AI prompt copy cards (§5.2 end, §6).
9. **Polish pass:** responsiveness, focus states, reduced-motion, empty/error copy, the design critique ("remove one accessory").
10. **Auth & sync (§11):** add Supabase client, login screen + gating, the `app_state` table with RLS, and the local-first sync engine (pull-on-load, debounced push, offline grace). Verify cross-device sync and that RLS blocks other accounts. Keep everything before this working offline/local so this layers on cleanly.
11. **Deploy (§12):** `vite.config` base path, `404.html`, GitHub Actions workflow with Supabase secrets, Supabase URL allow-list. Confirm the live site works and syncs across two devices.

---

## 10. Definition of done

- I can open the app, see today's queue (new + due reviews), and it's never more than `dailyNewTarget` new problems.
- Starting a problem runs the timer and **will not** let me reveal the solution before trying a hint, and **will not** let me log `cold` on a problem where I read the solution.
- Logging an attempt reschedules it correctly per §4, and the change survives a page reload.
- Concept cards and problem re-attempts both come due on their own schedules and appear in Today.
- The warming grid visibly reflects my mastery and fills toward 150.
- Cold-solve rate is shown honestly and the app tells me, calmly, if I'm behind pace for Aug 21.
- I can export a backup JSON and re-import it into a fresh browser and get all my data back.
- I can sign in on my laptop, log some attempts, then open the live site on my phone, sign in, and **see the same data** — and vice versa (§11).
- My data is private: signed out, or as a different account, I cannot read my rows (RLS verified).
- The deployed site loads from the correct base path, refresh never 404s, and login redirects work in production (§12).
- No server of my own runs anywhere; the only backend is Supabase, reached directly from the static client.

---

## 11. Auth & cloud sync (Supabase)

**Why Supabase:** free tier, hosted Postgres, built-in Auth, and Row-Level Security (RLS). A static SPA can use it directly over HTTPS via `@supabase/supabase-js` — no server of our own. (Firebase would also work; if you prefer it, swap equivalently — but implement Supabase unless told otherwise.)

**Architecture — local-first with cloud sync.** `localStorage` (via Zustand `persist`) stays the instant, offline cache. Supabase is the cross-device source of truth. On load: pull remote, reconcile, run. On change: debounce, push to remote. The app must remain fully usable offline and simply sync when back online. Export/Import JSON stays as the ultimate backup.

**Auth method.** Email + password via Supabase Auth as the default (no dependency on email delivery for every login). Also wire **magic link** and **"Continue with GitHub"** as optional alternates (GitHub is nice for a developer). The session persists via Supabase's refresh token, so login is rare after the first time. Because it's just you: after creating your one account, **disable new signups** in the Supabase dashboard (Auth → Providers/Settings) so nobody else can register. RLS keeps data private regardless.

**Schema — one JSON snapshot row per user (deliberately simple).** Since it's a single user syncing across their *own* devices (not concurrent multi-user editing), store the whole serialized store as one row:

```sql
create table app_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  state      jsonb not null,            -- serialized Zustand state: problems, cards, snippets, settings
  updated_at timestamptz not null default now(),
  version    integer not null default 1
);

alter table app_state enable row level security;
create policy "own row select" on app_state for select using (auth.uid() = user_id);
create policy "own row insert" on app_state for insert with check (auth.uid() = user_id);
create policy "own row update" on app_state for update using (auth.uid() = user_id);
```

RLS is the load-bearing security control: it guarantees each account can only touch its own row, even though the anon key is public in the client bundle. **Do not skip enabling RLS** — without it, the public anon key would let anyone read/write the table.

**Sync algorithm — last-write-wins on `updated_at`, debounced.**
- On load with a valid session: fetch the user's `app_state`. If remote `updated_at` > local `updatedAt` → hydrate the store from `remote.state`. If local is newer → push local up. If no remote row exists → insert one from local.
- On any data change: bump the store's `updatedAt = now()`; debounce ~2s; `upsert` the full snapshot to `app_state`. Reflect progress in `syncStatus` (`idle | syncing | error | offline`) and update `lastSyncedAt`.
- Solo-user tradeoff: if you edit on two devices while *both* are offline, the one that syncs last overwrites the whole snapshot. Acceptable here. If it ever bites, upgrade to per-record tables (problems/cards/snippets as rows, each with its own `updated_at`) for field-level merges — leave a `// SYNC-UPGRADE-PATH` comment at the sync module boundary so that change is localized.

**Auth screens & gating.**
- **Login screen:** email + password, plus "email me a magic link" and "Continue with GitHub" (if enabled). On-brand, minimal (§7).
- Gate the app: no valid session → login screen; valid session → hydrate + run. After first login the session persists, so this is rarely seen.
- **Offline grace:** if a persisted session exists but the device is offline, run from the local cache immediately and sync when connectivity returns — never block the app on a network call.
- Account controls live in Settings (§5.7): signed-in email, Sync now + last-synced, Sign out.

**Keys & secrets.** Client uses only `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (publishable — safe in the bundle *because* of RLS). The `service_role` key must never appear in the frontend or repo. The optional in-app Anthropic key (§6) stays user-entered at runtime in `localStorage` only — never committed, never a `VITE_` var.

---

## 12. Deployment (GitHub Pages / personal site)

The frontend is static (`vite build` → `dist/`). It talks to Supabase directly, so there's nothing else to host.

**Base path.** In `vite.config.ts`, set `base` with a clear comment: `'/<repo>/'` when hosting at `https://<user>.github.io/<repo>/`; `'/'` when hosting at a user/org page (`<user>.github.io`) or a custom domain root. Getting this wrong is the #1 cause of a blank deployed page (assets 404).

**Refresh / deep links.** We use no router (view enum in the store), so every load serves `index.html` and refresh never 404s. As a belt-and-suspenders for GitHub Pages, also emit a `404.html` that's a copy of `index.html` (a tiny build step or a committed `public/404.html` shell).

**GitHub Actions deploy.** Provide `.github/workflows/deploy.yml` that on push to `main`: checks out, sets up Node, `npm ci`, `npm run build`, and deploys `dist/` via the official `actions/upload-pages-artifact` + `actions/deploy-pages`. Inject `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` into the build step's `env` from **GitHub repo secrets** (Settings → Secrets and variables → Actions). In the repo: Settings → Pages → Source = GitHub Actions. (These anon keys end up in the public bundle by design; RLS is what protects data.)

**Custom domain (personal site).** Put your domain in `public/CNAME`, set `base: '/'`, point DNS per GitHub's docs, and enable "Enforce HTTPS."

**Supabase URL config.** In Supabase → Auth → URL Configuration, add every deployed origin (e.g. `https://<user>.github.io/<repo>/` and any custom domain, plus `http://localhost:5173` for dev) to Site URL / redirect allow-list, or magic-link and GitHub OAuth redirects will fail in production.

**Deploy checklist.** `npm run dev` works signed in; `npm run build && npm run preview` works with prod env vars; pushing `main` publishes; the live URL loads (correct base path); logging in on a second device shows the same data; signed out, data is unreadable.

---

Build it in the milestone order in §9 (auth/sync and deploy are milestones 10 and 11). Ship each milestone runnable before starting the next.
