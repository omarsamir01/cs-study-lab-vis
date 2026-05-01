/**
 * Build merge-sort divide & conquer stages for flowchart viz (diagram-style).
 */

/** @typedef {{ vals: number[], leaf?: boolean, L?: TNode, R?: TNode, sorted?: number[], mergeTier?: number }} TNode */

/** Merge two ascending runs into one sorted array */
function mergeTwo(A, B) {
  /** @type {number[]} */
  const out = [];
  let i = 0,
    j = 0;
  while (i < A.length && j < B.length) {
    if (A[i] <= B[j]) out.push(A[i++]);
    else out.push(B[j++]);
  }
  while (i < A.length) out.push(A[i++]);
  while (j < B.length) out.push(B[j++]);
  return out;
}

/** Build binary split tree (same midpoint rule as classic merge sort). */
function buildTree(slice) {
  if (slice.length <= 1) {
    return /** @type {TNode} */ ({
      vals: slice.slice(),
      leaf: true,
    });
  }
  const mid = Math.floor(slice.length / 2);
  return /** @type {TNode} */ ({
    vals: slice.slice(),
    leaf: false,
    L: buildTree(slice.slice(0, mid)),
    R: buildTree(slice.slice(mid)),
  });
}

/** Post-order annotate sorted[] and mergeTier (0 = leaf, 1 first merges, …). */
function annotate(node) {
  if (!node.L) {
    node.sorted = node.vals.slice();
    node.mergeTier = 0;
    return;
  }
  annotate(node.L);
  annotate(node.R);
  node.sorted = mergeTwo(/** @type {number[]} */ (node.L.sorted), /** @type {number[]} */ (node.R.sorted));
  node.mergeTier =
    1 + Math.max(/** @type {number} */ (node.L.mergeTier), /** @type {number} */ (node.R.mergeTier));
}

/** @param {TNode} root */
function internalChunksByMergeTier(root) {
  /** @type {Map<number, number[][]>} */
  const map = new Map();
  /** @param {TNode} node */
  function visit(node) {
    if (node.leaf || !node.L) return;
    visit(node.L);
    visit(node.R);
    const t = /** @type {number} */ (node.mergeTier);
    const row = node.sorted ? node.sorted.slice() : [];
    if (!map.has(t)) map.set(t, []);
    map.get(t).push(row);
  }
  visit(root);
  return map;
}

/** Expand frontier rows until singletons appear in one visual row */
function divideStages(initial) {
  /** @type {number[][][]} */
  const stages = [];
  let frontier = [initial.slice()];
  while (!frontier.every((c) => c.length <= 1)) {
    frontier = frontier.flatMap((chunk) => {
      if (chunk.length <= 1) return [chunk];
      const m = Math.floor(chunk.length / 2);
      return [chunk.slice(0, m), chunk.slice(m)];
    });
    stages.push(frontier.map((x) => x.slice()));
    if (frontier.length >= 128) break;
  }
  return stages;
}

/**
 * @param {number[]} arr (non-empty)
 * @returns {{ phases: Array<{ phase: string, chunks: number[][], caption: string }> }}
 */
export function computeMergeDiagramPhases(arr) {
  /** @type {Array<{ phase: string, chunks: number[][], caption: string }>} */
  const phases = [];

  if (!arr.length) {
    return { phases };
  }

  if (arr.length <= 1) {
    phases.push({
      phase: "sorted",
      chunks: [arr.slice()],
      caption: "Sorted Array :",
    });
    return { phases };
  }

  phases.push({
    phase: "unsorted",
    chunks: [arr.slice()],
    caption: "UnSorted Array :",
  });

  const divRows = divideStages(arr.slice());
  for (const row of divRows) {
    phases.push({
      phase: "divide",
      chunks: row,
      caption: "",
    });
  }

  const root = buildTree(arr.slice());
  annotate(root);
  const byTier = internalChunksByMergeTier(root);
  const tiersSorted = [...byTier.keys()].sort((a, b) => a - b);

  for (let ti = 0; ti < tiersSorted.length; ti++) {
    const t = tiersSorted[ti];
    const chunks = byTier.get(t) || [];
    const last = ti === tiersSorted.length - 1;
    phases.push({
      phase: last ? "sorted" : "merge",
      chunks,
      caption: last ? "Sorted Array :" : "",
    });
  }

  return { phases };
}
