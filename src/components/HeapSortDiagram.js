import React from "react";
import { html } from "../htm.js";
import HeapChart from "./HeapChart.js";

/** @param {Record<number, string>|undefined} h @param {number} heapSize */
function filterHeapHighlight(h, heapSize) {
  if (!h || heapSize <= 0) return undefined;
  /** @type {Record<number, string>} */
  const out = {};
  for (const [ks, role] of Object.entries(h)) {
    const ix = Number(ks);
    if (!Number.isFinite(ix) || ix < 0 || ix >= heapSize) continue;
    out[ix] = role;
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * @param {{
 *   arr: number[],
 *   heapViz: { heapSize: number, done?: boolean },
 *   highlight?: Record<number, string>,
 * }} props
 */
export default function HeapSortDiagram({ arr, heapViz, highlight }) {
  const n = arr.length;
  const heapSize = Math.max(0, Math.floor(Number(heapViz.heapSize ?? 0)));
  const done = !!heapViz.done;
  const heapVals = heapSize > 0 ? arr.slice(0, heapSize) : [];
  const heapHl = filterHeapHighlight(highlight, heapSize);

  return html`<div className="heap-sort-diagram-shell" aria-label="Heap sort tree and array layout">
    <div className="heap-sort-diagram-head">
      ${done
        ? html`<span className="heap-sort-phase-chip heap-sort-phase-chip-done">sorted</span>`
        : html`<span className="heap-sort-phase-chip mono"
          >heap <strong>${heapSize}</strong> · tail <strong>${n - heapSize}</strong></span
        >`}
      <span className="heap-sort-diagram-note">
        ${done
          ? html`Indexes <code>[0 .. ${String(n - 1)}]</code> now hold sorted order — the conceptual heap is gone.`
          : html`Active subtree uses <code>A[0..${Math.max(heapSize - 1, 0)}]</code>. Parents must be ≥ children
            (<code>i</code> → children <code>2i+1</code>, <code>2i+2</code>).`}
      </span>
    </div>
    ${!done && heapVals.length > 0
      ? html`<div className="heap-sort-tree-panel">
          <${HeapChart} vals=${heapVals} highlight=${heapHl ?? undefined} />
        </div>`
      : done && n > 0
        ? html`<div className="heap-sort-tree-panel heap-sort-tree-panel-done">
            <div className="heap-sort-done-tree-placeholder" aria-hidden="true">
              <span className="mono heap-sort-done-glyph">◇</span>
              <span>Heap consumed — ordering is in the array row below.</span>
            </div>
          </div>`
        : null}
    <div className="heap-sort-array-caption">
      Array backing store (prefix = current heap indices, darker tail = sorted suffix)
    </div>
    <div
      className="heap-sort-array-strip"
      style=${{
        gridTemplateColumns: `repeat(${Math.max(n, 1)}, minmax(min(36px, 8vw), 1fr))`,
      }}
    >
      ${arr.map((v, i) => {
        const inHeap = i < heapSize;
        const hl = highlight && highlight[i];
        return html`<div
          key=${"hsa-" + i}
          className=${"heap-sort-arr-cell mono" +
          (done ? " heap-sort-arr-cell--sorted" : inHeap ? " heap-sort-arr-cell--heap" : " heap-sort-arr-cell--tail") +
          (hl === "pivot"
            ? " heap-sort-arr-cell--hl-pivot"
            : hl === "highlight"
              ? " heap-sort-arr-cell--hl-compare"
              : hl === "range"
                ? " heap-sort-arr-cell--hl-range"
                : "")}
        >
          <span className="heap-sort-arr-ix">${String(i)}</span>
          <span className="heap-sort-arr-val">${String(v)}</span>
        </div>`;
      })}
    </div>
  </div>`;
}
