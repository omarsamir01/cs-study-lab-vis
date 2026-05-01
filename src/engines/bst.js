/** @typedef {{ val: number, id: string, left?: any, right?: any }} BSTPlain */

export function nextBstIdFactory() {
  let n = 0;
  return () => `b-${++n}`;
}

/** @returns {BSTPlain} */
export function bstLeaf(val, idStr) {
  return { val, id: idStr, left: null, right: null };
}

/** @param {BSTPlain|null} root @param {number} val @param {()=>string} makeId */
function insertMutable(root, val, makeId) {
  if (!root) return bstLeaf(val, makeId());
  if (val <= root.val) root.left = insertMutable(root.left, val, makeId);
  else root.right = insertMutable(root.right, val, makeId);
  return root;
}

/**
 * Pure-ish insert: clones existing tree before mutating the copy.
 * @param {BSTPlain|null} root @param {number} val @param {()=>string} makeId
 */
export function cloneInsertBST(root, val, makeId) {
  if (!root) return bstLeaf(val, makeId());
  const copy = structuredClone(root);
  return insertMutable(copy, val, makeId);
}
