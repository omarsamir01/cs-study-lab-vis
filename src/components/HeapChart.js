import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { html } from "../htm.js";

const PAD = 40;
const ROW_H = 72;
const NODE_R = 26;
const CANVAS_W = 740;

/**
 * @param {{ vals: number[], highlight?: Record<number, string>|undefined }} props
 */
export default function HeapChart({ vals, highlight }) {
  const geo = useMemo(() => {
    const n = vals.length;
    if (!n) return { lines: [], dots: [], H: 120, W: CANVAS_W };

    const levels = [];
    let i = 0;
    let w = 1;
    while (i < n) {
      levels.push(vals.slice(i, Math.min(i + w, n)));
      i += w;
      w <<= 1;
    }

    /** @type {{ cx: number, cy: number, val: number, ix: number }[]} */
    const dots = [];
    let idx = 0;
    levels.forEach((row, ri) => {
      const ncol = Math.pow(2, ri);
      row.forEach((val, ci) => {
        const cx = PAD + ((ci + 0.5) * (CANVAS_W - PAD * 2)) / ncol;
        const cy = PAD + ri * ROW_H;
        dots.push({ cx, cy, val, ix: idx });
        idx++;
      });
    });

    /** @type {{ x1:number,y1:number,x2:number,y2:number,key:string}[]} */
    const lines = [];
    for (let c = 1; c < n; c++) {
      const p = Math.floor((c - 1) / 2);
      const from = dots[p],
        to = dots[c];
      const dx = to.cx - from.cx,
        dy = to.cy - from.cy;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len,
        uy = dy / len;
      lines.push({
        x1: from.cx + ux * NODE_R,
        y1: from.cy + uy * NODE_R,
        x2: to.cx - ux * NODE_R,
        y2: to.cy - uy * NODE_R,
        key: `h-${p}-${c}`,
      });
    }

    const H = PAD * 2 + levels.length * ROW_H + NODE_R;

    return { lines, dots, H, W: CANVAS_W };
  }, [vals]);

  if (!vals.length)
    return html`<div className="tree-empty">Empty heap — insert values to rebuild the pyramid.</div>`;

  const { lines, dots, H, W } = geo;

  return html`<div className="heap-chart-wrap" style=${{ overflowX: "auto" }}>
    <svg className="tree-svg heap-tree-svg" width=${W} height=${H} viewBox=${`0 0 ${W} ${H}`} aria-hidden=${true}>
      ${lines.map(
        (ln) =>
          html`<line
            key=${ln.key}
            x1=${ln.x1}
            y1=${ln.y1}
            x2=${ln.x2}
            y2=${ln.y2}
            stroke="rgba(136,174,170,0.45)"
            stroke-width="2.2"
          />`
      )}
    </svg>
    <div
      className="heap-overlay"
      style=${{
        width: `${W}px`,
        height: `${H}px`,
        position: "relative",
        marginTop: `-${H}px`,
      }}
    >
      ${dots.map((d) => {
        const role = highlight?.[d.ix];
        return html`<${motion.div}
          key=${"heap-dot-" + d.ix}
          layout
          className=${`tree-node-abs heap-node${role ? " heap-role-" + role : ""}`}
          title=${`index ${d.ix}, value ${d.val}`}
          style=${{ left: `${d.cx}px`, top: `${d.cy}px` }}
        >
          ${d.val}
        </${motion.div}>`;
      })}
    </div>
  </div>`;
}
