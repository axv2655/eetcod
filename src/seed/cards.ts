import type { ConceptCard, Pattern } from '../types'

function makeCard(
  id: string,
  pattern: Pattern,
  question: string,
  answer: string,
): ConceptCard {
  return {
    id,
    pattern,
    question,
    answer,
    interval: 0,
    nextReview: null,
    lastRating: null,
  }
}

export function seedCards(): ConceptCard[] {
  return [
    // ── Arrays & Hashing ─────────────────────────────────────────────────
    makeCard(
      'ah-1',
      'arrays_hashing',
      'What signals that a problem wants a hash map instead of a nested loop?',
      'You need O(1) lookup of a previously-seen value — "have I seen X before?" or "what index did X appear at?" Any time a brute-force would compare every pair, a hash map collapses it to one pass.',
    ),
    makeCard(
      'ah-2',
      'arrays_hashing',
      'How do you detect anagrams or frequency-based equivalence with hashing?',
      'Normalize to a sorted tuple or a character-count map, then use that as the dictionary key. Group Anagrams: key = sorted(word). Valid Anagram: compare Counter(s) == Counter(t).',
    ),
    makeCard(
      'ah-3',
      'arrays_hashing',
      'When does "longest consecutive sequence" become an O(n) problem instead of O(n log n)?',
      'Put all numbers in a set. Only start counting from a number n where n-1 is NOT in the set (that is the sequence start). This avoids restarting mid-sequence and each element is visited at most twice.',
    ),

    // ── Two Pointers ─────────────────────────────────────────────────────
    makeCard(
      'tp-1',
      'two_pointers',
      'Sorted array, find a pair summing to target — why two pointers over hashing?',
      'O(1) space; move left/right inward based on comparison to target. Hash map would work but wastes O(n) space. Two pointers exploit the sorted order: sum too small → advance left; too large → retreat right.',
    ),
    makeCard(
      'tp-2',
      'two_pointers',
      'What is the signal that a problem needs two pointers from opposite ends vs. a slow/fast pointer?',
      'Opposite ends: finding pairs/triplets in a sorted array, container with most water, palindrome check. Slow/fast: cycle detection in a linked list, finding middle node, removing duplicates in-place.',
    ),
    makeCard(
      'tp-3',
      'two_pointers',
      'How do you avoid duplicates in 3Sum without extra memory?',
      'After sorting, skip duplicate values at each pointer position: skip the outer i if nums[i]==nums[i-1], skip inner left/right after finding a valid triplet if the next value is the same.',
    ),

    // ── Sliding Window ───────────────────────────────────────────────────
    makeCard(
      'sw-1',
      'sliding_window',
      'What in a problem statement signals sliding window?',
      'Contiguous subarray/substring + an optimum (longest/shortest/max/min) under a constraint. If you need "best contiguous range satisfying X," grow right, shrink left.',
    ),
    makeCard(
      'sw-2',
      'sliding_window',
      'Fixed-size vs. variable-size window — how do you tell them apart?',
      'Fixed: the window size k is given (e.g., "sliding window maximum of size k") — advance both pointers together. Variable: the constraint changes the valid window size (e.g., "no repeating chars") — shrink left until valid again.',
    ),
    makeCard(
      'sw-3',
      'sliding_window',
      'For "minimum window substring," what bookkeeping do you need?',
      'Track a need count and a have count. Use a frequency map for t. Expand right: when char is in t and freq reaches required, increment have. When have==need, try shrinking left to minimize. Record best window at each valid state.',
    ),

    // ── Stack ─────────────────────────────────────────────────────────────
    makeCard(
      'st-1',
      'stack',
      'What class of problems is best solved with a monotonic stack?',
      '"Next greater/smaller element," "daily temperatures," histograms. The key: you want O(1) access to the last unresolved element. A stack lets you pop all elements that the current element resolves.',
    ),
    makeCard(
      'st-2',
      'stack',
      'How do you use a stack for parenthesis/bracket matching?',
      'Push opening brackets. On a closing bracket, check that the stack top is the matching opener — if not (or stack is empty), it is invalid. Valid iff the stack is empty at the end.',
    ),
    makeCard(
      'st-3',
      'stack',
      'What is the trick for "largest rectangle in histogram"?',
      'Use a monotonic increasing stack of (index, height) pairs. When you find a bar shorter than the stack top, pop and compute the rectangle using the popped height × current width. Push the current bar at the index of the last pop.',
    ),

    // ── Binary Search ────────────────────────────────────────────────────
    makeCard(
      'bs-1',
      'binary_search',
      'Beyond sorted-array lookup, when else does binary search apply?',
      'Monotonic predicate — "search on the answer." If you can ask "is X feasible?" and the answer flips from false to true (or vice versa) at exactly one boundary, binary search finds that boundary in O(log(range)).',
    ),
    makeCard(
      'bs-2',
      'binary_search',
      'How do you binary search a rotated sorted array?',
      'At every mid, one half is always fully sorted. Check which half is sorted (nums[lo] <= nums[mid]). If the target is within that sorted half, search there; otherwise search the other half.',
    ),
    makeCard(
      'bs-3',
      'binary_search',
      'What is the off-by-one rule for binary search boundaries?',
      'Use lo=0, hi=len-1, mid=(lo+hi)//2. If searching for exact match: lo<=hi. For left boundary (first true): hi=mid-1 when true, lo=mid+1 when false; answer is lo. For right boundary: reverse. Never do hi=mid to avoid infinite loop when lo==hi.',
    ),

    // ── Linked List ──────────────────────────────────────────────────────
    makeCard(
      'll-1',
      'linked_list',
      'What signals a linked-list problem that wants the slow/fast pointer?',
      'Cycle detection, finding the middle, or finding the kth-from-end node. Fast moves 2x; slow moves 1x. They meet inside a cycle, or fast reaches None leaving slow at mid.',
    ),
    makeCard(
      'll-2',
      'linked_list',
      'How do you reverse a singly linked list in-place?',
      'Three pointers: prev=None, curr=head. Loop: next_node=curr.next; curr.next=prev; prev=curr; curr=next_node. Return prev. For in-place, no extra space beyond the three pointers.',
    ),
    makeCard(
      'll-3',
      'linked_list',
      'What is the merge-k-sorted-lists trick to avoid O(nk) time?',
      'Use a min-heap. Push the head of each list. Each pop gives the global minimum — push its next node. Total pushes = n total nodes → O(n log k). Alternatively: divide and conquer merge pairs in O(n log k).',
    ),

    // ── Trees ─────────────────────────────────────────────────────────────
    makeCard(
      'tr-1',
      'trees',
      'DFS vs. BFS on a tree — when do you choose each?',
      'DFS: problems that go deep — path sums, subtree checks, height, serialization. BFS: level-order questions — "right side view," "level averages," anything that needs nodes at the same depth together.',
    ),
    makeCard(
      'tr-2',
      'trees',
      'What is the standard DFS post-order trick for diameter / max path sum?',
      'Return a value up from children to the parent — the child computes its own subtree answer and also returns what it contributes to the parent\'s path. For diameter: return max depth; update global with left+right at each node.',
    ),
    makeCard(
      'tr-3',
      'trees',
      'How do you validate a BST without relying on in-order traversal?',
      'Pass down (min_val, max_val) bounds at each recursive call. Left child: max_val=node.val. Right child: min_val=node.val. If node.val violates [min_val, max_val], invalid. Handles subtrees, not just parent.',
    ),

    // ── Tries ─────────────────────────────────────────────────────────────
    makeCard(
      'trie-1',
      'tries',
      'What is the signal that a problem benefits from a Trie over a hash set?',
      'Prefix queries: "does any word start with X?" or "find all words matching a pattern." A hash set handles exact lookup O(1) but prefix checks would be O(n*m). A Trie does prefix in O(m) time.',
    ),
    makeCard(
      'trie-2',
      'tries',
      'How do you implement a Trie node efficiently in Python?',
      'class TrieNode: children = defaultdict(TrieNode); is_end = False. Insert: traverse/create nodes per char, set is_end. Search: traverse nodes per char, return is_end at last. StartsWith: same but return True at last node without checking is_end.',
    ),
    makeCard(
      'trie-3',
      'tries',
      'For Word Search II (find all words in a grid), why Trie over checking each word separately?',
      'Building a Trie of all words lets DFS prune early when no word shares the current prefix. Without Trie: O(W * 4^L) per word. With Trie: one DFS visits each cell once per prefix — O(4^L) total regardless of word count.',
    ),

    // ── Heap / Priority Queue ────────────────────────────────────────────
    makeCard(
      'heap-1',
      'heap_priority_queue',
      'What class of problem signals "use a heap"?',
      '"Top K," "Kth largest/smallest," "streaming median," "merge K sorted." Anytime you need repeated access to the current min or max without sorting the whole collection each time.',
    ),
    makeCard(
      'heap-2',
      'heap_priority_queue',
      'How do you get a max-heap in Python\'s heapq (which is min-heap only)?',
      'Negate the values: push -val, pop gives -min = max. For complex objects, negate the priority field. Remember to negate again when reading the popped value.',
    ),
    makeCard(
      'heap-3',
      'heap_priority_queue',
      'How do you find the median of a data stream with two heaps?',
      'Maintain a max-heap (lower half) and a min-heap (upper half). Invariant: max-heap size == min-heap size or +1. On add: push to max-heap, then balance. Median = max-heap top if odd count, else average of both tops.',
    ),

    // ── Backtracking ─────────────────────────────────────────────────────
    makeCard(
      'bt-1',
      'backtracking',
      'What is the universal backtracking template?',
      'def backtrack(state, choices): if base_case: record(state); return. for choice in choices: make_choice(state, choice); backtrack(state, remaining_choices); undo_choice(state, choice). The "undo" is what makes it backtracking vs. plain DFS.',
    ),
    makeCard(
      'bt-2',
      'backtracking',
      'Subsets vs. Combinations vs. Permutations — what changes in the template?',
      'Subsets: include/exclude each element; no start-index increment on include. Combinations (sum): start index advances to avoid reuse (or stays same for repeated picks). Permutations: use a "used" boolean array; iterate all, skip used.',
    ),
    makeCard(
      'bt-3',
      'backtracking',
      'How do you skip duplicate results in Subsets II / Combination Sum II?',
      'Sort the input first. In the loop, if i>start and nums[i]==nums[i-1]: continue. This skips starting a new branch with the same value as the previous sibling branch, preventing identical sub-trees.',
    ),

    // ── Graphs ────────────────────────────────────────────────────────────
    makeCard(
      'g-1',
      'graphs',
      'BFS vs. DFS for graph problems — when does it matter?',
      'BFS: shortest path in an unweighted graph (Rotting Oranges, Word Ladder). DFS: connectivity, cycle detection, topological sort (Course Schedule), island problems where path length is irrelevant.',
    ),
    makeCard(
      'g-2',
      'graphs',
      'How do you detect a cycle in a directed graph?',
      'DFS with three states: WHITE (unvisited), GRAY (in current path), BLACK (fully explored). If DFS reaches a GRAY node, there is a cycle. This is also the topological sort algorithm — reverse post-order of BLACK nodes.',
    ),
    makeCard(
      'g-3',
      'graphs',
      'What is the Union-Find signal vs. the DFS signal for connectivity problems?',
      'Union-Find: "are these two nodes in the same component?" queried many times (online), or "redundant connection" (detect cycle as we add edges). DFS/BFS: explore all members of a component, count components, or find a path.',
    ),

    // ── Advanced Graphs ──────────────────────────────────────────────────
    makeCard(
      'ag-1',
      'advanced_graphs',
      'Dijkstra vs. Bellman-Ford — when do you need each?',
      'Dijkstra: non-negative edge weights, O((V+E) log V) with a heap. Bellman-Ford: negative weights allowed, detects negative cycles, O(VE). For K-stops shortest path (Cheapest Flights), use Bellman-Ford variant with K iterations.',
    ),
    makeCard(
      'ag-2',
      'advanced_graphs',
      'What signals Prim\'s / Kruskal\'s (Minimum Spanning Tree)?',
      '"Connect all nodes with minimum total cost" — Min Cost to Connect All Points, network wiring. Kruskal: sort edges, Union-Find to avoid cycles. Prim: greedy heap expansion from one node. Both give MST in O(E log E).',
    ),
    makeCard(
      'ag-3',
      'advanced_graphs',
      'How does topological sort enable solving problems on DAGs?',
      'Process nodes in dependency order using Kahn\'s algorithm (BFS with in-degree counts) or DFS post-order. Key: alien dictionary (infer order from adjacent word pairs), course schedule (detect if DAG exists).',
    ),

    // ── 1-D DP ────────────────────────────────────────────────────────────
    makeCard(
      'dp1-1',
      'dp_1d',
      'What signals 1-D DP vs. greedy?',
      'DP: the optimal choice at position i depends on previous choices in a non-obvious way (house robber — skip one affects what you can take later). Greedy: a locally optimal choice is always globally optimal (jump game — always take the farthest reach).',
    ),
    makeCard(
      'dp1-2',
      'dp_1d',
      'What are the two canonical 1-D DP patterns?',
      '(1) Linear scan: dp[i] = f(dp[i-1], dp[i-2], ...) — climbing stairs, house robber, coin change. (2) "Best ending at i": dp[i] = best subarray/subsequence ending exactly at i — max subarray (Kadane), LIS, palindromic substrings.',
    ),
    makeCard(
      'dp1-3',
      'dp_1d',
      'For Coin Change, why is it DP and what is the recurrence?',
      'Greedy fails because a larger coin can block an optimal solution (e.g., coins=[3,4], amount=6). DP: dp[i] = min(dp[i-coin]+1 for each coin if i>=coin). Initialize dp[0]=0, rest=inf. Answer: dp[amount] if not inf.',
    ),

    // ── 2-D DP ────────────────────────────────────────────────────────────
    makeCard(
      'dp2-1',
      'dp_2d',
      'What signals 2-D DP vs. 1-D DP?',
      'Two changing parameters define the subproblem — two strings (LCS, Edit Distance), a grid (Unique Paths), or a string + a knapsack capacity (Coin Change II, Target Sum). The state is a 2-D table.',
    ),
    makeCard(
      'dp2-2',
      'dp_2d',
      'What is the LCS recurrence and why does it capture the right thing?',
      'dp[i][j] = LCS of s1[:i] and s2[:j]. If s1[i-1]==s2[j-1]: dp[i][j]=dp[i-1][j-1]+1. Else: max(dp[i-1][j], dp[i][j-1]). This captures "best alignment of two prefixes," which is the subproblem LCS and Edit Distance share.',
    ),
    makeCard(
      'dp2-3',
      'dp_2d',
      'For Edit Distance, what do the three DP transitions represent?',
      'dp[i][j] = min edits to convert s1[:i] to s2[:j]. If chars match: dp[i-1][j-1] (free). Else: min of dp[i-1][j]+1 (delete from s1), dp[i][j-1]+1 (insert into s1), dp[i-1][j-1]+1 (replace). Each transition is one edit operation.',
    ),

    // ── Greedy ────────────────────────────────────────────────────────────
    makeCard(
      'gr-1',
      'greedy',
      'How do you verify that a greedy is correct (not just plausible)?',
      'Exchange argument: assume an optimal solution differs from greedy at some step. Show that swapping to the greedy choice does not worsen the solution. If the swap is always neutral or better, greedy is provably optimal.',
    ),
    makeCard(
      'gr-2',
      'greedy',
      'What is the Jump Game greedy insight?',
      'Track the farthest reachable index. Scan left to right: at each position, if i > farthest_reach → unreachable, return False. Else update farthest_reach = max(farthest_reach, i + nums[i]). Return True if you finish the loop.',
    ),
    makeCard(
      'gr-3',
      'greedy',
      'For interval-type greedy (Partition Labels), what is the key insight?',
      'Knowing the last occurrence of each character gives you the minimum window that must contain that character. Scan left to right, extend the current partition end to max(last[char]). Whenever i == current end, that is a valid partition point.',
    ),

    // ── Intervals ─────────────────────────────────────────────────────────
    makeCard(
      'iv-1',
      'intervals',
      'What is the standard interval merge algorithm?',
      'Sort by start time. Scan: if current start <= last merged end → merge (update end to max). Else → append current as new interval. Time: O(n log n) for sort + O(n) scan.',
    ),
    makeCard(
      'iv-2',
      'intervals',
      'For Meeting Rooms II (minimum rooms needed), what is the key insight?',
      'This is equivalent to "maximum overlap at any point." Sort starts and ends separately. Two pointers: if next start < next end → new meeting started before previous ended → need one more room. Else → one room freed.',
    ),
    makeCard(
      'iv-3',
      'intervals',
      'For Insert Interval, how do you handle the three cases?',
      'Scan existing intervals: (1) interval ends before new start → add as-is. (2) interval starts after new end → add merged interval then add remainder as-is. (3) overlap → extend new interval to cover both (min start, max end).',
    ),

    // ── Math & Geometry ──────────────────────────────────────────────────
    makeCard(
      'mg-1',
      'math_geometry',
      'How do you rotate a matrix 90 degrees clockwise in-place?',
      'Two steps: (1) Transpose (swap matrix[i][j] with matrix[j][i] for i<j). (2) Reverse each row. For counter-clockwise: reverse each row first, then transpose. O(n^2) time, O(1) extra space.',
    ),
    makeCard(
      'mg-2',
      'math_geometry',
      'What is the spiral matrix traversal pattern?',
      'Maintain four boundaries: top, bottom, left, right. Traverse: right along top (top++), down along right (right--), left along bottom (bottom--), up along left (left++). Stop when top>bottom or left>right.',
    ),
    makeCard(
      'mg-3',
      'math_geometry',
      'For Happy Number, how do you detect the cycle?',
      'Apply the "sum of squares of digits" repeatedly. Either it reaches 1 (happy) or cycles. Use a set to detect revisited numbers, or use Floyd\'s fast/slow pointer on the sequence of values.',
    ),

    // ── Bit Manipulation ─────────────────────────────────────────────────
    makeCard(
      'bm-1',
      'bit_manipulation',
      'What are the four fundamental bit tricks to memorize?',
      'XOR self = 0; XOR 0 = self (use for "find single number"). n & (n-1) clears lowest set bit (count set bits). n & (-n) isolates lowest set bit. x ^ (x-1) creates a mask of lowest set bit and below.',
    ),
    makeCard(
      'bm-2',
      'bit_manipulation',
      'How do you count set bits (Hamming weight) efficiently?',
      'Brian Kernighan: while n: n &= n-1; count++. Each iteration removes the lowest set bit. O(number of set bits). For Counting Bits [0..n]: dp[i] = dp[i >> 1] + (i & 1) — shift right gives a known count, add the lowest bit.',
    ),
    makeCard(
      'bm-3',
      'bit_manipulation',
      'What signals that XOR is the right tool?',
      '"Find the one element that appears an odd number of times" — XOR all elements, pairs cancel to 0. "Missing number in 0..n" — XOR indices 0..n with all array values, the unpaired index survives.',
    ),
  ]
}
