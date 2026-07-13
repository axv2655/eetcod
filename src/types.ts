// All types from design spec §3 — implement exactly as written

export type Pattern =
  | 'arrays_hashing' | 'two_pointers' | 'sliding_window' | 'stack'
  | 'binary_search' | 'linked_list' | 'trees' | 'tries'
  | 'heap_priority_queue' | 'backtracking' | 'graphs' | 'advanced_graphs'
  | 'dp_1d' | 'dp_2d' | 'greedy' | 'intervals'
  | 'math_geometry' | 'bit_manipulation';

export type AttemptResult =
  | 'cold'      // solved unaided within the timer
  | 'hint'      // solved but needed 1–2 hints (pattern name / nudge)
  | 'solution'; // had to read the solution

export interface Attempt {
  date: string;          // ISO
  result: AttemptResult;
  timeSpentSec: number;
  reimplemented: boolean; // did they close the solution and re-code from scratch?
}

export type Mastery = 0 | 1 | 2 | 3; // 0 = learning ... 3 = about to retire
export type ProblemStatus = 'not_started' | 'learning' | 'reviewing' | 'mastered';

export interface Solution {
  code: string;            // the user's code
  timeComplexity: string;  // e.g. 'O(n)'
  spaceComplexity: string; // e.g. 'O(1)'
  notes: string;           // markdown-formatted notes
}

export interface Problem {
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
  solution: Solution | null; // user's saved solution + complexity
}

export interface ConceptCard {
  id: string;
  pattern: Pattern;
  question: string;      // recognition-focused, e.g. "What signals sliding window?"
  answer: string;        // revealed on demand
  interval: number;      // days
  nextReview: string | null;
  lastRating: 'got_it' | 'shaky' | 'missed' | null;
}

export interface Snippet {      // the boilerplate library
  id: string;
  pattern: Pattern;
  title: string;         // 'BFS on a grid', 'binary search (no off-by-one)'
  language: string;
  code: string;
}

export interface Settings {
  timerSec: number;          // default 480 (8 min)
  studyDaysPerWeek: number;  // default 6, used for pacing math
  language: string;          // default 'Python'; single language for the summer
  deadline: string;          // ISO, default 2026-08-21
}

// View enum for screen switching (no router — per spec §2)
// 'problem_session' is a transient overlay on top of 'today' — not a nav destination
export type View = 'today' | 'patterns' | 'concepts' | 'boilerplate' | 'progress' | 'settings' | 'problem_session';
