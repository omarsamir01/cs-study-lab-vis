import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { html } from "../htm.js";
import {
  labelInorderX,
  labelDepth,
  buildFlatTree,
  nodePixelLayout,
  NODE_R,
} from "../lib/treeLayout.js";

/**
 * Interactive tree with SVG parent→child edges and keyed nodes for traversal highlight.
 *
 * @param {{
 *   root: object | null,
 *   colored?: boolean,
 *   highlightId?: string|number|null,
 *   rev?: number,
 * }} props
 */
export default function TreeChart({ root, colored, highlightId, rev }) {
  const data = useMemo(() => {
    if (!root) return null;
    labelInorderX(root);
    labelDepth(root);
    const flat = buildFlatTree(root, { colored });
    const pix = nodePixelLayout(flat.nodes);
    return { flat, pix };
  }, [root, colored, rev]);

  if (!data) return html`<div className="tree-empty">Empty tree — add numbers to visualize.</div>`;

  const { flat, pix } = data;

  /** @type {{ id: number|string }} */
  /** trim line to node rims */
  function trim(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len,
      uy = dy / len;
    return {
      x1: x1 + ux * NODE_R,
      y1: y1 + uy * NODE_R,
      x2: x2 - ux * NODE_R,
      y2: y2 - uy * NODE_R,
    };
  }

  const lines = flat.edges
    .map((e) => {
      const a = pix.pos[e.from],
        b = pix.pos[e.to];
      if (!a || !b) return null;
      const t = trim(a.cx, a.cy, b.cx, b.cy);
      return { ...t, key: `${e.from}-${e.to}` };
    })
    .filter(Boolean);

  return html`<div className="tree-canvas-shell" style=${{ overflowX: "auto" }}>
      <svg
        className="tree-svg"
        width=${pix.W}
        height=${pix.H}
        viewBox=${`0 0 ${pix.W} ${pix.H}`}
        aria-hidden=${true}
      >
        ${lines.map(
          (L) =>
            html`<line
              key=${L.key}
              x1=${L.x1}
              y1=${L.y1}
              x2=${L.x2}
              y2=${L.y2}
              stroke="rgba(154,174,206,0.45)"
              stroke-width="2.2"
              stroke-linecap="round"
            />`
        )}
      </svg>
      <div
        className="tree-overlay"
        style=${{ width: `${pix.W}px`, height: `${pix.H}px`, position: "relative", marginTop: `-${pix.H}px`, pointerEvents: "none" }}
      >
        ${flat.nodes.map(
          (n) => html`<${motion.div}
            key=${String(n.id)}
            layout
            className=${"tree-node-abs " +
            (colored ? (n.red ? "tree-node-abs-red" : "tree-node-abs-black") : "tree-node-abs-bst") +
            (String(highlightId) === String(n.id) ? " tree-node-abs-flash" : "")}
            style=${{
              left: `${pix.pos[n.id].cx}px`,
              top: `${pix.pos[n.id].cy}px`,
            }}
          >
            ${n.key}
          </${motion.div}>`
        )}
      </div>
    </div>`;
}
