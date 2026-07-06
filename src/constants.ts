// Mastery interval table — spec §4a
// Indexed by Mastery (0–3). Days until next review per mastery level.
export const MASTERY_INTERVALS: [number, number, number, number] = [1, 3, 7, 16];

// Type scale (px) — spec §7
export const TYPE_SCALE = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 20,
  xl: 28,
  '2xl': 40,
} as const;

// Default settings values
export const DEFAULT_SETTINGS = {
  timerSec: 480,
  studyDaysPerWeek: 6,
  language: 'Python',
  deadline: '2026-08-21',
} as const;

// AI hint prompt templates — spec §6
// These are copied to clipboard at the appropriate step; no AI API is called.

export const PROMPT_HINT = `Here's a problem: [I'll paste it]. Don't give the solution or the full approach. Just name the pattern category, and ask me ONE question that points at the key insight.`;

export const PROMPT_SANITY_CHECK = `My approach is: [___]. Poke holes in it — where is my reasoning off or incomplete? Don't give me the answer.`;

export const PROMPT_CODE_REVIEW = `Here's my working solution: [___]. What's the time/space complexity? Is it clean and idiomatic? Only show a rewrite if mine is clearly suboptimal, and explain the diff.`;

export const PROMPT_TRANSFER_TEST = `Give me a different problem that uses the same pattern as [___], without telling me it's the same pattern. I want to test whether it actually stuck.`;

// Structured collection for rendering in the UI
export const AI_PROMPTS = [
  {
    id: 'hint',
    label: 'Get a hint',
    description: 'Ask for a pattern nudge, not the solution',
    template: PROMPT_HINT,
  },
  {
    id: 'sanity_check',
    label: 'Sanity-check my approach',
    description: 'Poke holes in your reasoning',
    template: PROMPT_SANITY_CHECK,
  },
  {
    id: 'code_review',
    label: 'Code review',
    description: 'Check complexity and clarity after solving',
    template: PROMPT_CODE_REVIEW,
  },
  {
    id: 'transfer_test',
    label: 'Transfer test',
    description: 'Test if the pattern actually stuck',
    template: PROMPT_TRANSFER_TEST,
  },
] as const;

export type AiPromptId = typeof AI_PROMPTS[number]['id'];

// Pattern display names for UI
export const PATTERN_LABELS: Record<string, string> = {
  arrays_hashing: 'Arrays & Hashing',
  two_pointers: 'Two Pointers',
  sliding_window: 'Sliding Window',
  stack: 'Stack',
  binary_search: 'Binary Search',
  linked_list: 'Linked List',
  trees: 'Trees',
  tries: 'Tries',
  heap_priority_queue: 'Heap / Priority Queue',
  backtracking: 'Backtracking',
  graphs: 'Graphs',
  advanced_graphs: 'Advanced Graphs',
  dp_1d: '1-D DP',
  dp_2d: '2-D DP',
  greedy: 'Greedy',
  intervals: 'Intervals',
  math_geometry: 'Math & Geometry',
  bit_manipulation: 'Bit Manipulation',
};

// Canonical NeetCode 150 pattern order
export const PATTERN_ORDER = [
  'arrays_hashing',
  'two_pointers',
  'sliding_window',
  'stack',
  'binary_search',
  'linked_list',
  'trees',
  'tries',
  'heap_priority_queue',
  'backtracking',
  'graphs',
  'advanced_graphs',
  'dp_1d',
  'dp_2d',
  'greedy',
  'intervals',
  'math_geometry',
  'bit_manipulation',
] as const;

// Tagline shown on empty Today state — spec §7 copy voice
export const EMPTY_TODAY_TAGLINE = 'Blanking is the start line, not the verdict.';
