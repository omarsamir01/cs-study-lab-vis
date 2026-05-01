/** Red–Black tree insert (BST + parent pointers + rotations + fix-up). Leaves are null (= black NIL). */

/** @typedef {{
 *  key: number,
 *  id: string|number,
 *  red: boolean,
 *  left: RBNode|null,
 *  right: RBNode|null,
 *  parent: RBNode|null
 * }} RBNode */

/** @param {boolean} red @param {number} key */
function makeNode(red, key) {
  /** @type {RBNode|null} */
  const left = null;
  /** @type {RBNode|null} */
  const right = null;
  /** @type {RBNode|null} */
  const parent = null;
  /** @type {RBNode} */
  const node = /** @type {RBNode} */ ({
    red,
    key,
    id: `rb-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`}`,
    left,
    right,
    parent,
  });
  return node;
}

/** @param {RBNode|null} treeRoot @param {RBNode} pivot */
export function rbRotateLeft(treeRoot, pivot) {
  /** @type {RBNode|null} */
  let root = treeRoot;
  const rightChild = pivot.right;
  if (!rightChild) return root;
  pivot.right = rightChild.left;
  if (rightChild.left) rightChild.left.parent = pivot;
  rightChild.parent = pivot.parent;
  if (!pivot.parent) root = rightChild;
  else if (pivot === pivot.parent.left) pivot.parent.left = rightChild;
  else pivot.parent.right = rightChild;
  rightChild.left = pivot;
  pivot.parent = rightChild;
  return root;
}

/** @param {RBNode|null} treeRoot @param {RBNode} pivot */
export function rbRotateRight(treeRoot, pivot) {
  /** @type {RBNode|null} */
  let root = treeRoot;
  const leftChild = pivot.left;
  if (!leftChild) return root;
  pivot.left = leftChild.right;
  if (leftChild.right) leftChild.right.parent = pivot;
  leftChild.parent = pivot.parent;
  if (!pivot.parent) root = leftChild;
  else if (pivot === pivot.parent.right) pivot.parent.right = leftChild;
  else pivot.parent.left = leftChild;
  leftChild.right = pivot;
  pivot.parent = leftChild;
  return root;
}


/**
 * Insert integer key into RB tree. Duplicates ≤ parent go left (matches Lab BST demo).
 * @param {{ root: RBNode|null }} wrapper
 * @param {number|string} rawKey
 * @returns {RBNode|null} new root reference (may mutate wrapper.root)
 */
export function rbInsert(wrapper, rawKey) {
  const key = Number(rawKey);
  if (!Number.isFinite(key) || Math.floor(key) !== key || Math.abs(key) > 999999999) {
    throw new RangeError("Integer key needed");
  }
  let /** @type {RBNode|null} */ root = wrapper.root;

  let /** @type {RBNode|null} */ z = /** @type {RBNode|null} */ (makeNode(false, key));
  z.red = true;
  /** @type {RBNode|null} */
  let y = null;
  /** @type {RBNode|null} */
  let x = root;

  while (x) {
    y = x;
    if (key <= x.key) x = x.left;
    else x = x.right;
  }
  z.parent = y;
  if (!y) {
    wrapper.root = z;
    root = z;
    z.red = false;
    return root;
  }
  if (key <= y.key) y.left = z;
  else y.right = z;

  root = fixInsert(wrapper.root, z);

  wrapper.root = root;
  /** force root black always */
  if (wrapper.root) wrapper.root.red = false;
  return wrapper.root;
}

/** @param {RBNode|null} root @param {RBNode} z */
function fixInsert(root, z) {
  /** @type {RBNode|null} */
  let r = root;
  while (z.parent && z.parent.red) {
    if (z.parent === z.parent.parent?.left) {
      const uncle = z.parent.parent?.right ?? null;
      if (uncle?.red) {
        z.parent.red = false;
        uncle.red = false;
        if (z.parent.parent) z.parent.parent.red = true;
        z = /** @type {RBNode} */ (z.parent.parent);
      } else {
        if (z === z.parent.right) {
          z = z.parent;
          r = rbRotateLeft(r, z);
        }
        if (z.parent) z.parent.red = false;
        if (z.parent?.parent) {
          z.parent.parent.red = true;
          r = rbRotateRight(r, /** @type {RBNode} */ (z.parent.parent));
        }
      }
    } else {
      const uncle = z.parent.parent?.left ?? null;
      if (uncle?.red) {
        z.parent.red = false;
        uncle.red = false;
        if (z.parent.parent) z.parent.parent.red = true;
        z = /** @type {RBNode} */ (z.parent.parent);
      } else {
        if (z === z.parent.left) {
          z = z.parent;
          r = rbRotateRight(r, z);
        }
        if (z.parent) z.parent.red = false;
        if (z.parent?.parent) {
          z.parent.parent.red = true;
          r = rbRotateLeft(r, /** @type {RBNode} */ (z.parent.parent));
        }
      }
    }
  }
  if (r) r.red = false;
  return r;
}

export function rbClear(wrapper) {
  wrapper.root = null;
}
