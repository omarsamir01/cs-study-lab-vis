import React from "react";
import { html } from "../htm.js";

/** @param {Record<number, string>|undefined} highlight @param {number} gap @param {number} len */
function shellActiveStrand(highlight, gap, len) {
  if (!highlight || gap < 1) return null;
  const keys = Object.keys(highlight)
    .map(Number)
    .filter((i) => Number.isFinite(i) && i >= 0 && i < len)
    .sort((a, b) => a - b);
  if (!keys.length) return null;
  for (let a = 0; a < keys.length; a++) {
    for (let b = a + 1; b < keys.length; b++) {
      const delta = keys[b] - keys[a];
      if (delta !== 0 && delta % gap === 0) return keys[a] % gap;
    }
  }
  if (keys.length === 1) return keys[0] % gap;
  return null;
}

/** Hue degrees for strand index `r` ∈ [0 .. gap − 1] (spread around the wheel). */
function strandHueDeg(r, gap) {
  return `${(360 * r) / Math.max(gap, 1)}deg`;
}

/**
 * Textbook-style shell diagram: main array color-coded by i mod gap; one row per
 * subsequence r, r+gap, … with connectors, span band, and every element in that strand.
 *
 * @param {{
 *   arr: number[],
 *   gap: number,
 *   highlight?: Record<number, string>,
 *   prevGap?: number | null,
 * }} props
 */
export default function ShellSortDiagram({ arr, gap, highlight, prevGap }) {
  const n = arr.length;
  if (n < 1 || gap < 1) return null;

  const activeStrand = shellActiveStrand(highlight, gap, n);

  /** @type {{ r: number, indices: number[] }[]} */
  const strands = [];
  for (let r = 0; r < gap; r++) {
    const indices = [];
    for (let i = r; i < n; i += gap) indices.push(i);
    strands.push({ r, indices });
  }

  const gridStyle = {
    "--shell-n": n,
  };

  return html`<div className="shell-ig-board" aria-label="Shell sort gap groups" style=${gridStyle}>
    <div className="shell-ig-head">
      <span className="shell-ig-title">Shell sort · gap ${gap}</span>
      ${prevGap != null && prevGap > 0
        ? html`<span className="shell-ig-prev">was ${prevGap}</span>`
        : null}
      <span className="shell-ig-sub">
        Rows below mirror each strand: indices <strong>r</strong>, <strong>r+gap</strong>, <strong>r+2·gap…</strong> share
        one value of <code>i mod gap</code>.
      </span>
    </div>
    <div className="shell-ig-main-grid">
      ${arr.map(
        (v, i) =>
          html`<div
              className="shell-ig-slot"
              style=${{ "--hue": strandHueDeg(i % gap, gap) }}
              key=${"m-" + i}
            >
              <span className="shell-ig-idx">${String(i)}</span>
              <span className="shell-ig-val mono">${String(v)}</span>
              ${highlight && highlight[i]
                ? html`<span className=${"shell-ig-slot-ring shell-ig-slot-ring--" + highlight[i]}></span>`
                : null}
            </div>`
      )}
    </div>
    ${strands.map(({ r, indices }) => {
      if (indices.length === 0) return null;
      const ixSet = new Set(indices);
      const lo = indices[0];
      const hi = indices[indices.length - 1];
      const hiColEnd = indices.length >= 2 ? hi + 2 : lo + 2;
      return html`<div
        key=${"s-" + r}
        className=${"shell-pair-band " + (activeStrand === r ? "shell-pair-band--focus" : "")}
        style=${{ "--hue": strandHueDeg(r, gap) }}
      >
        <div className="shell-pair-connect">
          ${Array.from(
            { length: n },
            (_, c) =>
              html`<div className="shell-pair-connect-cell" key=${"conn-" + r + "-" + c}>
                ${ixSet.has(c)
                  ? html`<span className="shell-pair-arrow" aria-hidden="true">↓</span>`
                  : null}
              </div>`
          )}
        </div>
        <div className="shell-pair-grid-inner">
          ${indices.length >= 2
            ? html`<div
                  className="shell-pair-span-fill"
                  style=${{
                    gridColumn: `${lo + 1} / ${hiColEnd}`,
                    gridRow: "1",
                  }}
                ></div>`
            : html`<div
                className="shell-pair-span-fill shell-pair-span-fill--narrow"
                style=${{
                  gridColumn: `${lo + 1} / ${lo + 2}`,
                  gridRow: "1",
                }}
              ></div>`}
          ${indices.map((ix) =>
            html`<div
              className="shell-pair-mini"
              key=${"mn-" + r + "-" + ix}
              style=${{ gridColumn: `${ix + 1} / ${ix + 2}`, gridRow: "2" }}
            >
              <span className="mono">${String(arr[ix] ?? "")}</span>
              <span className="shell-pair-mini-ix">[${String(ix)}]</span>
            </div>`
          )}
        </div>
      </div>`;
    })}
  </div>`;
}
