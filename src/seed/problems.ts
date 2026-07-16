import type { Problem, Pattern } from '../types'

function makeProblem(
  id: string,
  title: string,
  pattern: Pattern,
  order: number,
  /** NeetCode slug when it differs from the LeetCode id */
  neetSlug?: string,
): Problem {
  return {
    id,
    title,
    url: `https://neetcode.io/problems/${neetSlug ?? id}/question?list=neetcode150`,
    pattern,
    order,
    status: 'not_started',
    mastery: 0,
    nextReview: null,
    attempts: [],
    notes: { trigger: '', insight: '', gap: '' },
    solution: null,
  }
}

export function seedProblems(): Problem[] {
  return [
    // ── Arrays & Hashing (9) ──────────────────────────────────────────────
    makeProblem('contains-duplicate', 'Contains Duplicate', 'arrays_hashing', 0),
    makeProblem('valid-anagram', 'Valid Anagram', 'arrays_hashing', 1),
    makeProblem('two-sum', 'Two Sum', 'arrays_hashing', 2),
    makeProblem('group-anagrams', 'Group Anagrams', 'arrays_hashing', 3),
    makeProblem('top-k-frequent-elements', 'Top K Frequent Elements', 'arrays_hashing', 4),
    makeProblem('product-of-array-except-self', 'Product of Array Except Self', 'arrays_hashing', 5),
    makeProblem('valid-sudoku', 'Valid Sudoku', 'arrays_hashing', 6),
    makeProblem('encode-and-decode-strings', 'Encode and Decode Strings', 'arrays_hashing', 7, 'string-encode-and-decode'),
    makeProblem('longest-consecutive-sequence', 'Longest Consecutive Sequence', 'arrays_hashing', 8),

    // ── Two Pointers (5) ─────────────────────────────────────────────────
    makeProblem('valid-palindrome', 'Valid Palindrome', 'two_pointers', 0),
    makeProblem('two-sum-ii-input-array-is-sorted', 'Two Sum II - Input Array Is Sorted', 'two_pointers', 1, 'two-integer-sum-ii'),
    makeProblem('3sum', '3Sum', 'two_pointers', 2, 'three-integer-sum'),
    makeProblem('container-with-most-water', 'Container With Most Water', 'two_pointers', 3),
    makeProblem('trapping-rain-water', 'Trapping Rain Water', 'two_pointers', 4),

    // ── Sliding Window (6) ───────────────────────────────────────────────
    makeProblem('best-time-to-buy-and-sell-stock', 'Best Time to Buy and Sell Stock', 'sliding_window', 0, 'buy-and-sell-crypto'),
    makeProblem('longest-substring-without-repeating-characters', 'Longest Substring Without Repeating Characters', 'sliding_window', 1),
    makeProblem('longest-repeating-character-replacement', 'Longest Repeating Character Replacement', 'sliding_window', 2),
    makeProblem('permutation-in-string', 'Permutation in String', 'sliding_window', 3),
    makeProblem('minimum-window-substring', 'Minimum Window Substring', 'sliding_window', 4, 'minimum-window-with-characters'),
    makeProblem('sliding-window-maximum', 'Sliding Window Maximum', 'sliding_window', 5),

    // ── Stack (7) ────────────────────────────────────────────────────────
    makeProblem('valid-parentheses', 'Valid Parentheses', 'stack', 0, 'validate-parentheses'),
    makeProblem('min-stack', 'Min Stack', 'stack', 1),
    makeProblem('evaluate-reverse-polish-notation', 'Evaluate Reverse Polish Notation', 'stack', 2),
    makeProblem('generate-parentheses', 'Generate Parentheses', 'stack', 3),
    makeProblem('daily-temperatures', 'Daily Temperatures', 'stack', 4),
    makeProblem('car-fleet', 'Car Fleet', 'stack', 5),
    makeProblem('largest-rectangle-in-histogram', 'Largest Rectangle in Histogram', 'stack', 6),

    // ── Binary Search (7) ────────────────────────────────────────────────
    makeProblem('binary-search', 'Binary Search', 'binary_search', 0),
    makeProblem('search-a-2d-matrix', 'Search a 2D Matrix', 'binary_search', 1),
    makeProblem('koko-eating-bananas', 'Koko Eating Bananas', 'binary_search', 2),
    makeProblem('find-minimum-in-rotated-sorted-array', 'Find Minimum in Rotated Sorted Array', 'binary_search', 3),
    makeProblem('search-in-rotated-sorted-array', 'Search in Rotated Sorted Array', 'binary_search', 4),
    makeProblem('time-based-key-value-store', 'Time Based Key-Value Store', 'binary_search', 5),
    makeProblem('median-of-two-sorted-arrays', 'Median of Two Sorted Arrays', 'binary_search', 6),

    // ── Linked List (11) ─────────────────────────────────────────────────
    makeProblem('reverse-linked-list', 'Reverse Linked List', 'linked_list', 0),
    makeProblem('merge-two-sorted-lists', 'Merge Two Sorted Lists', 'linked_list', 1),
    makeProblem('reorder-list', 'Reorder List', 'linked_list', 2),
    makeProblem('remove-nth-node-from-end-of-list', 'Remove Nth Node From End of List', 'linked_list', 3),
    makeProblem('copy-list-with-random-pointer', 'Copy List with Random Pointer', 'linked_list', 4, 'copy-linked-list-with-random-pointer'),
    makeProblem('add-two-numbers', 'Add Two Numbers', 'linked_list', 5),
    makeProblem('linked-list-cycle', 'Linked List Cycle', 'linked_list', 6),
    makeProblem('find-the-duplicate-number', 'Find the Duplicate Number', 'linked_list', 7, 'find-duplicate-integer'),
    makeProblem('lru-cache', 'LRU Cache', 'linked_list', 8),
    makeProblem('merge-k-sorted-lists', 'Merge K Sorted Lists', 'linked_list', 9, 'merge-k-sorted-linked-lists'),
    makeProblem('reverse-nodes-in-k-group', 'Reverse Nodes in k-Group', 'linked_list', 10),

    // ── Trees (15) ───────────────────────────────────────────────────────
    makeProblem('invert-binary-tree', 'Invert Binary Tree', 'trees', 0),
    makeProblem('maximum-depth-of-binary-tree', 'Maximum Depth of Binary Tree', 'trees', 1),
    makeProblem('diameter-of-binary-tree', 'Diameter of Binary Tree', 'trees', 2),
    makeProblem('balanced-binary-tree', 'Balanced Binary Tree', 'trees', 3),
    makeProblem('same-tree', 'Same Tree', 'trees', 4),
    makeProblem('subtree-of-another-tree', 'Subtree of Another Tree', 'trees', 5),
    makeProblem('lowest-common-ancestor-of-a-binary-search-tree', 'Lowest Common Ancestor of a BST', 'trees', 6, 'lowest-common-ancestor-in-binary-search-tree'),
    makeProblem('binary-tree-level-order-traversal', 'Binary Tree Level Order Traversal', 'trees', 7),
    makeProblem('binary-tree-right-side-view', 'Binary Tree Right Side View', 'trees', 8),
    makeProblem('count-good-nodes-in-binary-tree', 'Count Good Nodes in Binary Tree', 'trees', 9),
    makeProblem('validate-binary-search-tree', 'Validate Binary Search Tree', 'trees', 10),
    makeProblem('kth-smallest-element-in-a-bst', 'Kth Smallest Element in a BST', 'trees', 11),
    makeProblem('construct-binary-tree-from-preorder-and-inorder-traversal', 'Construct Binary Tree from Preorder and Inorder Traversal', 'trees', 12, 'binary-tree-from-preorder-and-inorder-traversal'),
    makeProblem('binary-tree-maximum-path-sum', 'Binary Tree Maximum Path Sum', 'trees', 13),
    makeProblem('serialize-and-deserialize-binary-tree', 'Serialize and Deserialize Binary Tree', 'trees', 14),

    // ── Tries (3) ────────────────────────────────────────────────────────
    makeProblem('implement-trie-prefix-tree', 'Implement Trie (Prefix Tree)', 'tries', 0, 'implement-prefix-tree'),
    makeProblem('design-add-and-search-words-data-structure', 'Design Add and Search Words Data Structure', 'tries', 1, 'design-word-search-data-structure'),
    makeProblem('word-search-ii', 'Word Search II', 'tries', 2, 'search-for-word-ii'),

    // ── Heap / Priority Queue (7) ────────────────────────────────────────
    makeProblem('kth-largest-element-in-a-stream', 'Kth Largest Element in a Stream', 'heap_priority_queue', 0, 'kth-largest-integer-in-a-stream'),
    makeProblem('last-stone-weight', 'Last Stone Weight', 'heap_priority_queue', 1),
    makeProblem('k-closest-points-to-origin', 'K Closest Points to Origin', 'heap_priority_queue', 2),
    makeProblem('kth-largest-element-in-an-array', 'Kth Largest Element in an Array', 'heap_priority_queue', 3),
    makeProblem('task-scheduler', 'Task Scheduler', 'heap_priority_queue', 4),
    makeProblem('design-twitter', 'Design Twitter', 'heap_priority_queue', 5),
    makeProblem('find-median-from-data-stream', 'Find Median from Data Stream', 'heap_priority_queue', 6),

    // ── Backtracking (9) ─────────────────────────────────────────────────
    makeProblem('subsets', 'Subsets', 'backtracking', 0),
    makeProblem('combination-sum', 'Combination Sum', 'backtracking', 1),
    makeProblem('permutations', 'Permutations', 'backtracking', 2),
    makeProblem('subsets-ii', 'Subsets II', 'backtracking', 3),
    makeProblem('combination-sum-ii', 'Combination Sum II', 'backtracking', 4),
    makeProblem('word-search', 'Word Search', 'backtracking', 5),
    makeProblem('palindrome-partitioning', 'Palindrome Partitioning', 'backtracking', 6),
    makeProblem('letter-combinations-of-a-phone-number', 'Letter Combinations of a Phone Number', 'backtracking', 7),
    makeProblem('n-queens', 'N-Queens', 'backtracking', 8),

    // ── Graphs (13) ──────────────────────────────────────────────────────
    makeProblem('number-of-islands', 'Number of Islands', 'graphs', 0),
    makeProblem('clone-graph', 'Clone Graph', 'graphs', 1),
    makeProblem('max-area-of-island', 'Max Area of Island', 'graphs', 2),
    makeProblem('pacific-atlantic-water-flow', 'Pacific Atlantic Water Flow', 'graphs', 3),
    makeProblem('surrounded-regions', 'Surrounded Regions', 'graphs', 4),
    makeProblem('rotting-oranges', 'Rotting Oranges', 'graphs', 5),
    makeProblem('walls-and-gates', 'Walls and Gates', 'graphs', 6, 'islands-and-treasure'),
    makeProblem('course-schedule', 'Course Schedule', 'graphs', 7),
    makeProblem('course-schedule-ii', 'Course Schedule II', 'graphs', 8),
    makeProblem('redundant-connection', 'Redundant Connection', 'graphs', 9),
    makeProblem('number-of-connected-components-in-an-undirected-graph', 'Number of Connected Components in an Undirected Graph', 'graphs', 10, 'count-connected-components'),
    makeProblem('graph-valid-tree', 'Graph Valid Tree', 'graphs', 11, 'valid-tree'),
    makeProblem('word-ladder', 'Word Ladder', 'graphs', 12),

    // ── Advanced Graphs (6) ──────────────────────────────────────────────
    makeProblem('reconstruct-itinerary', 'Reconstruct Itinerary', 'advanced_graphs', 0),
    makeProblem('min-cost-to-connect-all-points', 'Min Cost to Connect All Points', 'advanced_graphs', 1),
    makeProblem('network-delay-time', 'Network Delay Time', 'advanced_graphs', 2),
    makeProblem('swim-in-rising-water', 'Swim in Rising Water', 'advanced_graphs', 3),
    makeProblem('alien-dictionary', 'Alien Dictionary', 'advanced_graphs', 4),
    makeProblem('cheapest-flights-within-k-stops', 'Cheapest Flights Within K Stops', 'advanced_graphs', 5),

    // ── 1-D DP (12) ──────────────────────────────────────────────────────
    makeProblem('climbing-stairs', 'Climbing Stairs', 'dp_1d', 0),
    makeProblem('min-cost-climbing-stairs', 'Min Cost Climbing Stairs', 'dp_1d', 1),
    makeProblem('house-robber', 'House Robber', 'dp_1d', 2),
    makeProblem('house-robber-ii', 'House Robber II', 'dp_1d', 3),
    makeProblem('longest-palindromic-substring', 'Longest Palindromic Substring', 'dp_1d', 4),
    makeProblem('palindromic-substrings', 'Palindromic Substrings', 'dp_1d', 5),
    makeProblem('decode-ways', 'Decode Ways', 'dp_1d', 6),
    makeProblem('coin-change', 'Coin Change', 'dp_1d', 7),
    makeProblem('maximum-product-subarray', 'Maximum Product Subarray', 'dp_1d', 8),
    makeProblem('word-break', 'Word Break', 'dp_1d', 9),
    makeProblem('longest-increasing-subsequence', 'Longest Increasing Subsequence', 'dp_1d', 10),
    makeProblem('partition-equal-subset-sum', 'Partition Equal Subset Sum', 'dp_1d', 11),

    // ── 2-D DP (11) ──────────────────────────────────────────────────────
    makeProblem('unique-paths', 'Unique Paths', 'dp_2d', 0),
    makeProblem('longest-common-subsequence', 'Longest Common Subsequence', 'dp_2d', 1),
    makeProblem('best-time-to-buy-and-sell-stock-with-cooldown', 'Best Time to Buy and Sell Stock with Cooldown', 'dp_2d', 2, 'buy-and-sell-crypto-with-cooldown'),
    makeProblem('coin-change-ii', 'Coin Change II', 'dp_2d', 3),
    makeProblem('target-sum', 'Target Sum', 'dp_2d', 4),
    makeProblem('interleaving-string', 'Interleaving String', 'dp_2d', 5),
    makeProblem('longest-increasing-path-in-a-matrix', 'Longest Increasing Path in a Matrix', 'dp_2d', 6),
    makeProblem('distinct-subsequences', 'Distinct Subsequences', 'dp_2d', 7),
    makeProblem('edit-distance', 'Edit Distance', 'dp_2d', 8),
    makeProblem('burst-balloons', 'Burst Balloons', 'dp_2d', 9),
    makeProblem('regular-expression-matching', 'Regular Expression Matching', 'dp_2d', 10),

    // ── Greedy (8) ───────────────────────────────────────────────────────
    makeProblem('maximum-subarray', 'Maximum Subarray', 'greedy', 0),
    makeProblem('jump-game', 'Jump Game', 'greedy', 1),
    makeProblem('jump-game-ii', 'Jump Game II', 'greedy', 2),
    makeProblem('gas-station', 'Gas Station', 'greedy', 3),
    makeProblem('hand-of-straights', 'Hand of Straights', 'greedy', 4),
    makeProblem('merge-triplets-to-form-target-triplet', 'Merge Triplets to Form Target Triplet', 'greedy', 5),
    makeProblem('partition-labels', 'Partition Labels', 'greedy', 6),
    makeProblem('valid-parenthesis-string', 'Valid Parenthesis String', 'greedy', 7),

    // ── Intervals (6) ────────────────────────────────────────────────────
    makeProblem('insert-interval', 'Insert Interval', 'intervals', 0),
    makeProblem('merge-intervals', 'Merge Intervals', 'intervals', 1),
    makeProblem('non-overlapping-intervals', 'Non Overlapping Intervals', 'intervals', 2),
    makeProblem('meeting-rooms', 'Meeting Rooms', 'intervals', 3),
    makeProblem('meeting-rooms-ii', 'Meeting Rooms II', 'intervals', 4),
    makeProblem('minimum-interval-to-include-each-query', 'Minimum Interval to Include Each Query', 'intervals', 5),

    // ── Math & Geometry (8) ──────────────────────────────────────────────
    makeProblem('rotate-image', 'Rotate Image', 'math_geometry', 0),
    makeProblem('spiral-matrix', 'Spiral Matrix', 'math_geometry', 1),
    makeProblem('set-matrix-zeroes', 'Set Matrix Zeroes', 'math_geometry', 2),
    makeProblem('happy-number', 'Happy Number', 'math_geometry', 3),
    makeProblem('plus-one', 'Plus One', 'math_geometry', 4),
    makeProblem('pow-x-n', 'Pow(x, n)', 'math_geometry', 5),
    makeProblem('multiply-strings', 'Multiply Strings', 'math_geometry', 6),
    makeProblem('detect-squares', 'Detect Squares', 'math_geometry', 7, 'count-squares'),

    // ── Bit Manipulation (7) ─────────────────────────────────────────────
    makeProblem('single-number', 'Single Number', 'bit_manipulation', 0),
    makeProblem('number-of-1-bits', 'Number of 1 Bits', 'bit_manipulation', 1),
    makeProblem('counting-bits', 'Counting Bits', 'bit_manipulation', 2),
    makeProblem('reverse-bits', 'Reverse Bits', 'bit_manipulation', 3),
    makeProblem('missing-number', 'Missing Number', 'bit_manipulation', 4),
    makeProblem('sum-of-two-integers', 'Sum of Two Integers', 'bit_manipulation', 5),
    makeProblem('reverse-integer', 'Reverse Integer', 'bit_manipulation', 6),
  ]
}
