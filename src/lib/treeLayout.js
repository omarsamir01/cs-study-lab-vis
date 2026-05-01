/** In-order numbering for horizontal layout; annotate each node._ix before calling. */

/** @typedef {{ key: number, id?: string|number, left?: any, right?: any, parent?: any, red?: boolean }} TNode */

/** @param {TNode|null} node */
export function labelInorderX(node) {
  let x = 0;
  /** @param {TNode|null} n */
  function walk(n) {
    if (!n) return;
    walk(n.left);
    n._ix = x++;
    walk(n.right);
  }
  walk(node);
  return x;
}

/**
 * DFS depth annotates `_depth` starting at depth 0 root.
 * @param {TNode|null} node
 */
export function labelDepth(node) {
  /** @param {TNode|null} n */
  /** @param {number} d */
  function walk(n, d) {
    if (!n) return;
    n._depth = d;
    walk(n.left, d + 1);
    walk(n.right, d + 1);
  }
  walk(node, 0);
}

/**
 * @param {TNode|null} root
 * @param {{ colored?: boolean }} opts
 */
export function buildFlatTree(root, opts = {}) {
  const colored = !!opts.colored;
  /** @type {{ id: number|string, key: number, ix: number, depth: number, red?: boolean }[]} */
  const nodes = [];
  /** @type {{ from: number|string, to: number|string }[]} */
  const edges = [];

  /** preorder for edges — any DFS order OK */
  function edgesWalk(n) {
    if (!n) return;
    const id = n.id;
    if (n.left) {
      edges.push({ from: id, to: n.left.id });
      edgesWalk(n.left);
    }
    if (n.right) {
      edges.push({ from: id, to: n.right.id });
      edgesWalk(n.right);
    }
  }

  /** collect nodes inorder to match ix order visually */
  function collectInorder(n) {
    if (!n) return;
    collectInorder(n.left);
    const rec = {
      id: /** @type {string|number} */ (n.id),
      key: typeof n.key === "number" ? n.key : n.val,
      ix: /** @type {number} */ (n._ix),
      depth: /** @type {number} */ (n._depth ?? 0),
    };
    if (colored && "red" in n) rec.red = !!n.red;
    nodes.push(rec);
    collectInorder(n.right);
  }

  if (!root) return { nodes: [], edges: [], maxIx: -1 };

  edgesWalk(root);
  collectInorder(root);
  const maxIx = nodes.length ? Math.max(...nodes.map((o) => o.ix)) : -1;

  /** strip temp fields without mutating clones if caller reuses refs */
  return { nodes, edges, maxIx };
}

const GAP_X = 64;
const GAP_Y = 78;
const PAD = 52;
const NODE_R = 26;

/** Map flat node ix/depth → pixel center for SVG and overlay divs. */
export function nodePixelLayout(flatNodes) {
  const map = {};
  let maxIx = -1,
    maxDepth = 0;
  for (const n of flatNodes) {
    maxIx = Math.max(maxIx, n.ix);
    maxDepth = Math.max(maxDepth, n.depth);
    map[n.id] = {
      cx: PAD + n.ix * GAP_X + GAP_X / 2,
      cy: PAD + n.depth * GAP_Y,
      ...n,
    };
  }
  const W = maxIx >= 0 ? PAD * 2 + (maxIx + 1) * GAP_X : 400;
  const H = PAD * 2 + (maxDepth + 1) * GAP_Y;
  return { pos: map, W, H, NODE_R };
}

/** Pre-order visit order IDs */
export function preorderIds(root) {
  /** @type {(string|number)[]} */
  const out = [];
  /** @param {TNode|null} n */
  function w(n) {
    if (!n) return;
    out.push(n.id);
    w(n.left);
    w(n.right);
  }
  w(root);
  return out;
}

/** In-order */
export function inorderIds(root) {
  const out = [];
  /** @param {TNode|null} n */
  function w(n) {
    if (!n) return;
    w(n.left);
    out.push(n.id);
    w(n.right);
  }
  w(root);
  return out;
}

/** Post-order */
export function postorderIds(root) {
  const out = [];
  /** @param {TNode|null} n */
  function w(n) {
    if (!n) return;
    w(n.left);
    w(n.right);
    out.push(n.id);
  }
  w(root);
  return out;
}

export { NODE_R };
