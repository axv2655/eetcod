import type { Snippet, Pattern } from '../types'

function makeSnippet(
  id: string,
  pattern: Pattern,
  title: string,
  code: string,
): Snippet {
  return { id, pattern, title, language: 'Python', code }
}

export function seedSnippets(): Snippet[] {
  return [
    // ── BFS ──────────────────────────────────────────────────────────────
    makeSnippet(
      'bfs-graph',
      'graphs',
      'BFS on a graph',
      `from collections import deque

def bfs(graph: dict, start: int) -> list:
    visited = {start}
    queue = deque([start])
    order = []

    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)

    return order`,
    ),

    makeSnippet(
      'bfs-grid',
      'graphs',
      'BFS on a grid (multi-source)',
      `from collections import deque

def bfs_grid(grid: list[list[int]]) -> int:
    ROWS, COLS = len(grid), len(grid[0])
    queue = deque()
    visited = set()

    # Seed all starting cells (multi-source BFS)
    for r in range(ROWS):
        for c in range(COLS):
            if grid[r][c] == START:
                queue.append((r, c, 0))   # (row, col, distance)
                visited.add((r, c))

    directions = [(0,1),(0,-1),(1,0),(-1,0)]

    while queue:
        r, c, dist = queue.popleft()
        for dr, dc in directions:
            nr, nc = r + dr, c + dc
            if 0 <= nr < ROWS and 0 <= nc < COLS and (nr, nc) not in visited:
                visited.add((nr, nc))
                queue.append((nr, nc, dist + 1))

    return -1  # replace with actual return logic`,
    ),

    // ── DFS ──────────────────────────────────────────────────────────────
    makeSnippet(
      'dfs-recursive',
      'graphs',
      'DFS recursive',
      `def dfs(graph: dict, node: int, visited: set) -> None:
    if node in visited:
        return
    visited.add(node)
    # process node here
    for neighbor in graph[node]:
        dfs(graph, neighbor, visited)

# Usage
visited = set()
dfs(graph, start_node, visited)`,
    ),

    makeSnippet(
      'dfs-iterative',
      'graphs',
      'DFS iterative (stack)',
      `def dfs_iterative(graph: dict, start: int) -> list:
    visited = set()
    stack = [start]
    order = []

    while stack:
        node = stack.pop()
        if node in visited:
            continue
        visited.add(node)
        order.append(node)
        # Push neighbors (reverse for left-to-right order)
        for neighbor in reversed(graph[node]):
            if neighbor not in visited:
                stack.append(neighbor)

    return order`,
    ),

    makeSnippet(
      'dfs-grid-recursive',
      'graphs',
      'DFS on a grid (recursive)',
      `def dfs(grid, r, c, visited):
    ROWS, COLS = len(grid), len(grid[0])
    if (r < 0 or c < 0 or r >= ROWS or c >= COLS
            or (r, c) in visited or grid[r][c] == 0):
        return
    visited.add((r, c))
    dfs(grid, r + 1, c, visited)
    dfs(grid, r - 1, c, visited)
    dfs(grid, r, c + 1, visited)
    dfs(grid, r, c - 1, visited)`,
    ),

    // ── Binary Search ────────────────────────────────────────────────────
    makeSnippet(
      'binary-search-exact',
      'binary_search',
      'Binary search — exact match',
      `def binary_search(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1  # not found`,
    ),

    makeSnippet(
      'binary-search-left',
      'binary_search',
      'Binary search — leftmost boundary (first true)',
      `def first_true(nums: list[int], target: int) -> int:
    """Returns leftmost index where nums[i] >= target."""
    lo, hi = 0, len(nums)  # hi = len for insertion point
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid   # mid is a candidate; keep searching left
    return lo  # lo == hi, first position where condition is True`,
    ),

    makeSnippet(
      'binary-search-answer',
      'binary_search',
      'Binary search on the answer (feasibility check)',
      `def solve(nums: list[int], limit: int) -> int:
    def feasible(mid: int) -> bool:
        # Replace with actual feasibility logic
        return True

    lo, hi = MIN_ANSWER, MAX_ANSWER
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible(mid):
            hi = mid        # mid is feasible, try smaller
        else:
            lo = mid + 1    # mid not feasible, must go larger
    return lo`,
    ),

    // ── Heap ─────────────────────────────────────────────────────────────
    makeSnippet(
      'heap-min',
      'heap_priority_queue',
      'Min-heap push / pop (heapq)',
      `import heapq

# Min-heap (Python default)
heap: list = []
heapq.heappush(heap, val)
smallest = heapq.heappop(heap)  # O(log n)
peek = heap[0]                  # O(1), no pop

# Heapify existing list in-place O(n)
heapq.heapify(heap)

# nsmallest / nlargest (uses heap internally)
top_k = heapq.nsmallest(k, iterable)`,
    ),

    makeSnippet(
      'heap-max',
      'heap_priority_queue',
      'Max-heap via negation',
      `import heapq

# Python has no max-heap; negate values to simulate one.
heap: list = []
heapq.heappush(heap, -val)
largest = -heapq.heappop(heap)

# For tuples: negate the priority field
heapq.heappush(heap, (-priority, item))
priority, item = heapq.heappop(heap)
priority = -priority`,
    ),

    makeSnippet(
      'heap-kth',
      'heap_priority_queue',
      'Kth largest with a fixed-size min-heap',
      `import heapq

def find_kth_largest(nums: list[int], k: int) -> int:
    """Maintain a min-heap of size k.
    The root is always the kth largest seen so far."""
    heap: list[int] = []
    for num in nums:
        heapq.heappush(heap, num)
        if len(heap) > k:
            heapq.heappop(heap)  # evict the smallest
    return heap[0]  # root = kth largest`,
    ),

    // ── Union-Find ───────────────────────────────────────────────────────
    makeSnippet(
      'union-find',
      'graphs',
      'Union-Find (path compression + union by rank)',
      `class UnionFind:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.components = n

    def find(self, x: int) -> int:
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # path compression
        return self.parent[x]

    def union(self, x: int, y: int) -> bool:
        px, py = self.find(x), self.find(y)
        if px == py:
            return False  # already connected
        if self.rank[px] < self.rank[py]:
            px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]:
            self.rank[px] += 1
        self.components -= 1
        return True

    def connected(self, x: int, y: int) -> bool:
        return self.find(x) == self.find(y)`,
    ),

    // ── Backtracking ─────────────────────────────────────────────────────
    makeSnippet(
      'backtrack-subsets',
      'backtracking',
      'Backtracking — subsets template',
      `def subsets(nums: list[int]) -> list[list[int]]:
    result: list[list[int]] = []
    subset: list[int] = []

    def backtrack(start: int) -> None:
        result.append(subset[:])  # record current state
        for i in range(start, len(nums)):
            subset.append(nums[i])
            backtrack(i + 1)      # i+1 = no reuse; i = allow reuse
            subset.pop()          # undo

    backtrack(0)
    return result`,
    ),

    makeSnippet(
      'backtrack-permutations',
      'backtracking',
      'Backtracking — permutations template',
      `def permute(nums: list[int]) -> list[list[int]]:
    result: list[list[int]] = []
    used = [False] * len(nums)
    perm: list[int] = []

    def backtrack() -> None:
        if len(perm) == len(nums):
            result.append(perm[:])
            return
        for i in range(len(nums)):
            if used[i]:
                continue
            used[i] = True
            perm.append(nums[i])
            backtrack()
            perm.pop()
            used[i] = False

    backtrack()
    return result`,
    ),

    makeSnippet(
      'backtrack-combination-sum',
      'backtracking',
      'Backtracking — combination sum (allow reuse)',
      `def combination_sum(candidates: list[int], target: int) -> list[list[int]]:
    result: list[list[int]] = []
    combo: list[int] = []

    def backtrack(start: int, remaining: int) -> None:
        if remaining == 0:
            result.append(combo[:])
            return
        if remaining < 0:
            return
        for i in range(start, len(candidates)):
            combo.append(candidates[i])
            backtrack(i, remaining - candidates[i])  # i = allow reuse
            combo.pop()

    backtrack(0, target)
    return result`,
    ),

    // ── defaultdict / Counter ────────────────────────────────────────────
    makeSnippet(
      'defaultdict-patterns',
      'arrays_hashing',
      'defaultdict and Counter patterns',
      `from collections import defaultdict, Counter

# --- Counter ---
freq = Counter("aabbc")      # Counter({'a': 2, 'b': 2, 'c': 1})
most_common = freq.most_common(2)  # [('a', 2), ('b', 2)]
freq.subtract(Counter("ab"))  # decrement counts
freq += Counter()             # remove zero/negative counts

# --- defaultdict ---
# Auto-initializes missing keys
graph = defaultdict(list)
graph[0].append(1)           # no KeyError

adj = defaultdict(set)
count = defaultdict(int)
count['x'] += 1             # starts at 0

# Group by key
groups: dict[str, list] = defaultdict(list)
for word in words:
    groups[tuple(sorted(word))].append(word)`,
    ),

    makeSnippet(
      'sliding-window-template',
      'sliding_window',
      'Sliding window — variable size template',
      `def sliding_window(s: str) -> int:
    left = 0
    best = 0
    window: dict = {}  # or Counter, or defaultdict(int)

    for right in range(len(s)):
        # Expand: add s[right] to window
        char = s[right]
        window[char] = window.get(char, 0) + 1

        # Shrink: while window is invalid, move left
        while not is_valid(window):
            remove = s[left]
            window[remove] -= 1
            if window[remove] == 0:
                del window[remove]
            left += 1

        # Record best valid window
        best = max(best, right - left + 1)

    return best`,
    ),

    makeSnippet(
      'topological-sort-kahn',
      'graphs',
      "Topological sort — Kahn's algorithm (BFS)",
      `from collections import deque, defaultdict

def topo_sort(n: int, edges: list[tuple[int,int]]) -> list[int]:
    """Returns topo order or [] if cycle exists."""
    in_degree = [0] * n
    adj = defaultdict(list)

    for u, v in edges:
        adj[u].append(v)
        in_degree[v] += 1

    queue = deque(i for i in range(n) if in_degree[i] == 0)
    order: list[int] = []

    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in adj[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return order if len(order) == n else []  # [] means cycle`,
    ),

    makeSnippet(
      'two-pointers-template',
      'two_pointers',
      'Two pointers — opposite ends template',
      `def two_pointers(nums: list[int]) -> int:
    # nums must be sorted (or problem guarantees order)
    left, right = 0, len(nums) - 1
    result = 0

    while left < right:
        current = nums[left] + nums[right]  # or any combination

        if current == target:
            # found a valid pair; record and move both
            result = max(result, ...)
            left += 1
            right -= 1
        elif current < target:
            left += 1   # need a larger sum
        else:
            right -= 1  # need a smaller sum

    return result`,
    ),

    makeSnippet(
      'dp-1d-template',
      'dp_1d',
      '1-D DP — bottom-up template',
      `def dp_1d(nums: list[int]) -> int:
    n = len(nums)
    # dp[i] = answer for subproblem ending at / up to index i
    dp = [0] * (n + 1)
    dp[0] = BASE_CASE

    for i in range(1, n + 1):
        # Typical recurrences:
        # dp[i] = dp[i-1] + nums[i-1]          (running sum)
        # dp[i] = max(dp[i-1], dp[i-2] + val)  (house robber)
        # dp[i] = min(dp[i-c] + 1 for c in coins if i >= c)
        dp[i] = ...

    return dp[n]`,
    ),

    makeSnippet(
      'dp-2d-template',
      'dp_2d',
      '2-D DP — bottom-up template',
      `def dp_2d(s1: str, s2: str) -> int:
    m, n = len(s1), len(s2)
    # dp[i][j] = answer for s1[:i] and s2[:j]
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    # Base cases
    for i in range(m + 1):
        dp[i][0] = i  # e.g., edit distance: delete i chars
    for j in range(n + 1):
        dp[0][j] = j  # e.g., edit distance: insert j chars

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s1[i-1] == s2[j-1]:
                dp[i][j] = dp[i-1][j-1]
            else:
                dp[i][j] = 1 + min(
                    dp[i-1][j],    # delete from s1
                    dp[i][j-1],    # insert into s1
                    dp[i-1][j-1],  # replace
                )

    return dp[m][n]`,
    ),

    makeSnippet(
      'binary-indexed-tree',
      'arrays_hashing',
      'Binary Indexed Tree (Fenwick Tree)',
      `class BIT:
    """1-indexed prefix sum with point updates in O(log n)."""
    def __init__(self, n: int):
        self.n = n
        self.tree = [0] * (n + 1)

    def update(self, i: int, delta: int) -> None:
        while i <= self.n:
            self.tree[i] += delta
            i += i & (-i)  # move to parent

    def query(self, i: int) -> int:
        """Prefix sum [1..i]."""
        total = 0
        while i > 0:
            total += self.tree[i]
            i -= i & (-i)  # move to parent
        return total

    def range_query(self, l: int, r: int) -> int:
        return self.query(r) - self.query(l - 1)`,
    ),
  ]
}
