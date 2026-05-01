import React from "react";
import { html } from "../htm.js";

/**
 * Three-row infographic: input keys, cumulative / working count[], output[].
 * Mirrors Lab-style counting sort; highlights follow `countingViz` on each step.
 *
 * @param {{
 *   viz: {
 *     phase: string,
 *     maxKey: number,
 *     inputKeys: number[],
 *     freq: number[],
 *     output: Array<number|null>,
 *     inputFocusIndex?: number,
 *     countFocusIndex?: number,
 *     outputFocusIndex?: number,
 *     formula?: string,
 *   },
 * }} props
 */
export default function CountingSortDiagram({ viz }) {
  if (!viz) return null;

  const input = viz.inputKeys ?? [];
  const nIn = input.length;
  const m = viz.maxKey + 1;
  const binsSrc = viz.freq ?? [];
  const bins = Array.from({ length: m }, (_, i) => (Number.isFinite(binsSrc[i]) ? binsSrc[i] : 0));
  const outSrc = viz.output ?? [];
  const output = Array.from({ length: nIn }, (_, i) =>
    outSrc[i] !== undefined ? outSrc[i] : /** @type {number|null} */ (null)
  );

  /** @param {number} len @param {readonly (number|null|undefined)[]} vals @param {number|undefined|null} focusedIdx @param {string} keyPre */
  const rowCells = (len, vals, focusedIdx, keyPre) =>
    [...Array(len)].map((_, i) =>
      html`<div className="count-sort-slot" key=${keyPre + "-" + i}>
        <span className="count-sort-ix">${i}</span>
        <div className=${"count-sort-cell " + (i === focusedIdx ? "count-sort-cell-focus" : "count-sort-cell-base")} title=${`index ${i}`}>
          ${vals[i] === null || vals[i] === undefined ? html`<span className="count-sort-empty">—</span>` : vals[i]}
        </div>
      </div>`
    );

  return html`<div className="count-sort-viz-shell" aria-label="Counting sort data view">
    <div className="count-sort-row">
      <div className="count-sort-row-label">Array</div>
      <div className="count-sort-strip-scroll">
        <div className="count-sort-strip">${rowCells(nIn, input, viz.inputFocusIndex, "in")}</div>
      </div>
    </div>
    <div className="count-sort-row">
      <div className="count-sort-row-label">Count</div>
      <div className="count-sort-strip-scroll">
        <div className="count-sort-strip count-sort-strip-wide">${rowCells(m, bins, viz.countFocusIndex, "cnt")}</div>
      </div>
    </div>
    ${viz.formula
      ? html`<div className="count-sort-formula-band" aria-hidden="false">
          <span className="count-sort-arrow">${"▼"}</span>
          <span className="count-sort-formula-text">${viz.formula}</span>
          <span className="count-sort-arrow">${"▼"}</span>
        </div>`
      : html`<div className="count-sort-formula-gap"></div>`}
    <div className="count-sort-row">
      <div className="count-sort-row-label">Output</div>
      <div className="count-sort-strip-scroll">
        <div className="count-sort-strip">${rowCells(nIn, output, viz.outputFocusIndex, "out")}</div>
      </div>
    </div>
  </div>`;
}
